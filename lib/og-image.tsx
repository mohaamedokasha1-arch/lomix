import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { TitleDetail } from "@/lib/queries";

/**
 * صور المشاركة الاجتماعية لكل عمل — تُرسم على الخادم وقت الطلب.
 *
 * لماذا خطّ IBM Plex Arabic وليس Noto Kufi؟ لأن محرك الرسم (Satori) لا يدعم
 * جداول الاستبدال السياقي Arabic GSUB format 3 التي يستخدمها Noto Kufi،
 * فتفشل الرسمة بالكامل. Plex يُشكّل الحروف العربية صحيحًا (تحقّقنا بصريًا).
 */

export const OG_SIZE = { width: 1200, height: 630 };

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
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

/** يحوّل صورة من `public` إلى data URI صغيرة؛ أي مسار مشبوه أو ملف مفقود ⇒ null. */
async function artwork(
  relativePath: string | null | undefined,
  width: number,
  height: number,
  quality = 68,
): Promise<string | null> {
  if (!relativePath) return null;
  const normalized = path.posix.normalize(relativePath);
  if (!["/media/", "/uploads/", "/art/"].some((prefix) => normalized.startsWith(prefix))) return null;
  try {
    const absolute = path.join(process.cwd(), "public", normalized);
    if (!absolute.startsWith(path.join(process.cwd(), "public"))) return null;
    const { default: sharp } = await import("sharp");
    const buffer = await sharp(await readFile(absolute))
      // الغلاف جزء من التكوين لا خلفية كاملة، فتُصغَّر هنا بدقة العرض الفعلي.
      // الهدف: PNG نهائي خفيف (< 400KB) لأن واتساب تتجاهل صور المشاركة الثقيلة.
      .resize(width, height, { fit: "cover", position: "centre" })
      .jpeg({ quality })
      .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** نص مختلط عربي/لاتيني: كل كلمة عنصر مستقل، والفصل عبر `gap` لا محارف مسافة. */
function MixedText({
  text,
  weight,
  align = "right",
  gap = 18,
}: {
  text: string;
  weight: 400 | 600 | 700;
  align?: "right" | "center";
  gap?: number;
}) {
  // Satori يوزّع أبناء flex بترتيب DOM من اليسار لليمين ولا يحترم `direction: rtl`
  // في هذا الموضع، لذلك نعكس الترتيب كي تظهر أول كلمة في أقصى اليمين.
  const words = text.split(/\s+/).filter(Boolean).reverse();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        direction: "rtl",
        justifyContent: align === "center" ? "center" : "flex-end",
        gap,
      }}
    >
      {words.map((word, wordIndex) => (
        <div key={`${word}-${wordIndex}`} style={{ display: "flex" }}>
          {(word.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g) ?? [word]).map(
            (part, index) => (
              <span
                key={index}
                style={{ fontFamily: ARABIC_RANGE.test(part) ? "PlexArabic" : "PlexLatin", fontWeight: weight }}
              >
                {part}
              </span>
            ),
          )}
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

  const name = shorten(input.titleAr, 60);
  const titleSize = name.length > 34 ? 58 : name.length > 24 ? 72 : 86;
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
            <span style={{ fontSize: 34, fontWeight: 700, color: "#d9a441" }}>لوميكس</span>
          </div>

          <div style={{display: "flex", marginTop: 40, fontSize: titleSize, color: "#f7f7fa", lineHeight: 1.2}}>
            <MixedText text={name} weight={700} gap={titleSize * 0.26} />
          </div>

          {meta ? (
            <div style={{ display: "flex", marginTop: 22, fontSize: 27, color: "#d7d7e0" }}>
              <MixedText text={meta} weight={600} gap={8} />
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
        <div style={{ fontSize: 92, fontWeight: 700, color: "#f7f7fa" }}>لوميكس</div>
        <div style={{ marginTop: 14, fontFamily: "PlexLatin", fontSize: 26, letterSpacing: 12, color: "#d9a441", fontWeight: 600 }}>
          LOOMIX
        </div>
        {subtitle ? (
          <div style={{ marginTop: 30, fontSize: 30, color: "#b9b9c6", display: "flex" }}>
            <MixedText text={subtitle} weight={400} align="center" />
          </div>
        ) : null}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
