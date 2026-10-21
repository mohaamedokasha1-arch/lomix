import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { TitleDetail } from "@/lib/queries";
import { blobArtUrl, localArtFile } from "@/lib/art-source";

/**
 * صور المشاركة الاجتماعية لكل عمل — تُرسم على الخادم وقت الطلب.
 *
 * لماذا خطّ IBM Plex Arabic وليس Noto Kufi؟ لأن محرك الرسم (Satori) لا يدعم
 * جداول الاستبدال السياقي Arabic GSUB format 3 التي يستخدمها Noto Kufi،
 * فتفشل الرسمة بالكامل. Plex يُشكّل الحروف العربية صحيحًا (تحقّقنا بصريًا).
 */

export const OG_SIZE = { width: 1200, height: 630 };

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const MAX_REMOTE_ART_BYTES = 8 * 1024 * 1024;
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

type LoadedFont = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" };

let fontsPromise: Promise<LoadedFont[]> | null = null;

function loadFonts(): Promise<LoadedFont[]> {
  fontsPromise ??= Promise.all(
    (
      [
        ["PlexArabic", "ibm-plex-arabic-400.ttf", 400],
        ["PlexArabic", "ibm-plex-arabic-600.ttf", 600],
        ["PlexArabic", "ibm-plex-arabic-700.ttf", 700],
        ["PlexLatin", "ibm-plex-latin-400.ttf", 400],
        ["PlexLatin", "ibm-plex-latin-600.ttf", 600],
        ["PlexLatin", "ibm-plex-latin-700.ttf", 700],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      data: await readFile(path.join(FONT_DIR, file)),
      weight,
      style: "normal" as const,
    })),
  );
  return fontsPromise;
}

/** يحوّل البوستر إلى data URI صغيرة؛ أي مسار مشبوه أو ملف مفقود ⇒ null. */
async function artwork(
  relativePath: string | null | undefined,
  width: number,
  height: number,
  quality = 68,
): Promise<string | null> {
  if (!relativePath) return null;
  const local = localArtFile(relativePath);
  const remote = local ? null : blobArtUrl(relativePath);
  if (!local && !remote) return null;
  try {
    const { default: sharp } = await import("sharp");
    let source: Buffer;
    if (local) {
      source = await readFile(local);
    } else {
      const response = await fetch(remote!, {
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": "loomix-og/1.0" },
        // أسماء ملفات الوسائط لا تتغيّر أبدًا (uuid + عرض)، فالتخزين المؤقت آمن.
        next: { revalidate: 86400 },
      });
      if (!response.ok) return null;
      if (!(response.headers.get("content-type") ?? "").startsWith("image/")) return null;
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > MAX_REMOTE_ART_BYTES) return null;
      // بعد أي إعادة توجيه: يبقى المضيف النهائي داخل نطاق Blob.
      if (!blobArtUrl(response.url)) return null;
      source = Buffer.from(await response.arrayBuffer());
      if (source.length > MAX_REMOTE_ART_BYTES) return null;
    }
    const buffer = await sharp(source)
      // الغلاف جزء من التكوين لا خلفية كاملة، فتُصغَّر هنا بدقة العرض الفعلي.
      // الهدف: صورة نهائية خفيفة (< 400KB) لأن واتساب تتجاهل صور المشاركة الثقيلة.
      .resize(width, height, { fit: "cover", position: "centre" })
      .jpeg({ quality })
      .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * نص عربي/لاتيني لبطاقات المشاركة.
 *
 * Satori لا يطبّق خوارزمية bidi: يُشكّل كل كلمة عربية صحيحًا لكنه يضع الكلمات
 * بترتيب منطقي من اليسار لليمين. لذلك نعكس ترتيب الكلمات للنص العربي حتى
 * تُقرأ من اليمين. (اختُبر بأربع صيغ متجاورة: عقدة واحدة، direction:rtl،
 * spans طبيعية، spans معكوسة — الأخيرة وحدها أعطت الترتيب الصحيح.)
 */
function TextBlock({
  text,
  weight,
  size,
  color,
  align = "right",
  lineHeight = 1.25,
  maxChars,
}: {
  text: string;
  weight: 400 | 600 | 700;
  size: number;
  color: string;
  align?: "right" | "center";
  lineHeight?: number;
  maxChars?: number;
}) {
  const shared = { fontSize: size, color, lineHeight, fontWeight: weight } as const;

  // لاتيني فقط: عقدة واحدة بلا عكس.
  if (!ARABIC_RANGE.test(text)) {
    return (
      <div
        style={{
          ...shared,
          display: "flex",
          fontFamily: "PlexLatin",
          direction: "ltr",
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        {text}
      </div>
    );
  }

  const words = text.split(/\s+/).filter(Boolean);
  // تقسيم يدوي إلى سطرين متوازنين: لفّ Satori التلقائي يقلب ترتيب السطور.
  const lines: string[][] = [];
  if (maxChars && text.length > maxChars && words.length > 1) {
    let best = 1;
    let bestDiff = Infinity;
    for (let index = 1; index < words.length; index += 1) {
      const first = words.slice(0, index).join(" ").length;
      const second = words.slice(index).join(" ").length;
      const diff = Math.abs(first - second);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = index;
      }
    }
    lines.push(words.slice(0, best), words.slice(best));
  } else {
    lines.push(words);
  }

  return (
    <div
      style={{
        ...shared,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-end",
      }}
    >
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} style={{ display: "flex", flexDirection: "row", gap: size * 0.26 }}>
          {[...line].reverse().map((word, index) => (
            <span
              key={`${word}-${index}`}
              style={{ fontFamily: ARABIC_RANGE.test(word) ? "PlexArabic" : "PlexLatin" }}
            >
              {word}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}


/** يقسم عنوانًا إلى سطر أو سطرين متوازنين، ويختار مقاسًا يضمن عدم تجاوز العمود. */
function layoutTitle(text: string, maxWidth: number): { lines: string[][]; size: number } {
  const words = text.split(/\s+/).filter(Boolean);
  // متوسط عرض المحرف في Plex Arabic كبير (حروف متصلة مع مسافات بين الكلمات)،
  // وقد قِسنا تجاوزًا عند 0.52، فنستخدم 0.66 وهو حدّ آمن.
  const avgChar = 0.66;
  if (words.length < 2 || text.length <= 16) {
    return { lines: [words], size: Math.max(44, Math.min(92, maxWidth / (text.length * avgChar))) };
  }
  let best = 1;
  let bestDiff = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ").length;
    const second = words.slice(index).join(" ").length;
    const diff = Math.abs(first - second);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = index;
    }
  }
  const lines = [words.slice(0, best), words.slice(best)];
  const longest = Math.max(...lines.map((line) => line.join(" ").length));
  return { lines, size: Math.max(38, Math.min(76, maxWidth / (longest * avgChar))) };
}

/** يرسم أسطرًا عربية معكوسة الترتيب (Satori بلا bidi) بمقاس واحد. */
function TitleLines({
  lines,
  size,
  color,
  align = "right",
}: {
  lines: string[][];
  size: number;
  color: string;
  align?: "right" | "center";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-end",
        rowGap: size * 0.18,
      }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={lineIndex}
          style={{ display: "flex", flexDirection: "row", gap: size * 0.24, whiteSpace: "nowrap" }}
        >
          {[...line].reverse().map((word, index) => (
            <span
              key={`${word}-${index}`}
              style={{
                fontFamily: ARABIC_RANGE.test(word) ? "PlexArabic" : "PlexLatin",
                fontSize: size,
                fontWeight: 700,
                color,
                lineHeight: 1.18,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function shorten(text: string, max: number) {
  const value = text.trim();
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

const TYPE_LABEL: Record<string, string> = { MOVIE: "فيلم", SERIES: "مسلسل", ANIME: "أنمي" };

export type OgTitleInput = {
  titleAr: string;
  titleEn?: string | null;
  type: string;
  releaseYear?: number | null;
  genres?: string[];
  backdropPath?: string | null;
  posterPath?: string | null;
};

export function titleOgInput(title: TitleDetail): OgTitleInput {
  return {
    titleAr: title.titleAr,
    titleEn: title.titleEn,
    type: title.type,
    releaseYear: title.releaseYear,
    genres: title.genres.map((genre) => genre.nameAr),
    backdropPath: title.backdropPath,
    posterPath: title.posterPath,
  };
}

export async function renderTitleOg(input: OgTitleInput): Promise<ImageResponse> {
  const posterWidth = 400;
  const posterHeight = 600;
  // البوستر أولًا، والغلاف بديل: صفحة التفاصيل تعرض الاثنين، وبطاقة المشاركة
  // تحتاج صورة رأسية واحدة فقط.
  const [fonts, poster] = await Promise.all([
    loadFonts(),
    artwork(input.posterPath ?? input.backdropPath, posterWidth, posterHeight, 72),
  ]);

  const name = shorten(input.titleAr, 64);
  const titleLines = layoutTitle(name, 580);
  const meta = [TYPE_LABEL[input.type] ?? null, ...(input.genres ?? []).slice(0, 3)]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#0b0b0f",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(217,164,65,0.16) 0%, rgba(11,11,15,0) 58%)",
          fontFamily: "PlexArabic",
        }}
      >
        {poster ? (
          <img
            src={poster}
            alt=""
            width={posterWidth}
            height={posterHeight}
            style={{
              width: posterWidth,
              height: posterHeight,
              objectFit: "cover",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 620,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "PlexLatin",
                fontSize: 21,
                letterSpacing: 7,
                color: "#b9b9c6",
                fontWeight: 600,
              }}
            >
              LOOMIX
            </span>
            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#d9a441", display: "flex" }} />
            <span style={{ fontSize: 34, fontWeight: 700, color: "#d9a441" }}>لوميكس فيلم</span>
          </div>

          <div style={{ display: "flex", marginTop: 40 }}>
            <TitleLines lines={titleLines.lines} size={titleLines.size} color="#f7f7fa" />
          </div>

          {meta ? (
            <div style={{ display: "flex", marginTop: 22 }}>
              <TextBlock text={meta} weight={600} size={27} color="#d7d7e0" />
            </div>
          ) : null}

          {input.titleEn ? (
            <div
              style={{
                marginTop: 10,
                fontFamily: "PlexLatin",
                fontSize: 22,
                letterSpacing: 1.5,
                color: "#8f8f9e",
                direction: "ltr",
                display: "flex",
              }}
            >
              {shorten(input.titleEn, 44)}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
            <span style={{ width: 56, height: 3, backgroundColor: "#d9a441", display: "flex" }} />
            {(input.releaseYear ?? 0) > 0 ? (
              <span
                style={{
                  fontFamily: "PlexLatin",
                  fontSize: 23,
                  color: "#b9b9c6",
                  letterSpacing: 3,
                  fontWeight: 600,
                }}
              >
                {String(input.releaseYear)}
              </span>
            ) : null}
          </div>
        </div>

      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/**
 * بطاقة صفحة قائمة (تصنيف/سنة/دولة/شخص): نص كبير + سطر توضيحي، والعلامة في الأعلى.
 * لا صور مُختلقة: الخلفية تدرّج فقط، والأرقام تأتي من عدّ حقيقي في القاعدة.
 */
export async function renderCollectionOg(
  heading: string,
  eyebrow?: string | null,
  footnote?: string | null,
): Promise<ImageResponse> {
  const fonts = await loadFonts();
  const headingLayout = layoutTitle(shorten(heading, 60), 980);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "56px 64px",
          backgroundColor: "#0b0b0f",
          backgroundImage:
            "radial-gradient(circle at 78% 22%, rgba(217,164,65,0.20) 0%, rgba(11,11,15,0) 60%)",
          fontFamily: "PlexArabic",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "PlexLatin",
              fontSize: 21,
              letterSpacing: 7,
              color: "#b9b9c6",
              fontWeight: 600,
            }}
          >
            LOOMIX
          </span>
          <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#d9a441", display: "flex" }} />
          <span style={{ fontSize: 34, fontWeight: 700, color: "#d9a441" }}>لوميكس فيلم</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {eyebrow ? (
            <div style={{ display: "flex", marginBottom: 16 }}>
              <TextBlock text={eyebrow} weight={600} size={26} color="#d9a441" />
            </div>
          ) : null}
          <div style={{ display: "flex" }}>
            <TitleLines lines={headingLayout.lines} size={headingLayout.size} color="#f7f7fa" />
          </div>
          {footnote ? (
            <div style={{ display: "flex", marginTop: 22 }}>
              <TextBlock text={footnote} weight={400} size={25} color="#a9a9b8" />
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/** بطاقة العلامة العامة — تُستخدم للروابط غير الموجودة وللصفحات التي لا عمل لها. */
export async function renderBrandOg(subtitle?: string): Promise<ImageResponse> {
  const fonts = await loadFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          direction: "rtl",
          backgroundColor: "#0b0b0f",
          backgroundImage: "radial-gradient(circle at 30% 20%, rgba(217,164,65,0.18) 0%, rgba(11,11,15,0) 55%)",
          fontFamily: "PlexArabic",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 700, color: "#f7f7fa" }}>لوميكس فيلم</div>
        <div style={{ marginTop: 14, fontFamily: "PlexLatin", fontSize: 26, letterSpacing: 12, color: "#d9a441", fontWeight: 600 }}>
          LOOMIX
        </div>
        {subtitle ? (
          <div style={{ display: "flex", marginTop: 30 }}>
            <TextBlock text={subtitle} weight={400} size={30} color="#b9b9c6" align="center" />
          </div>
        ) : null}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
