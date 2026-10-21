import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getDb, schema } from "@/db";
import { AuthError, requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { putImage, storageDriver, uploadMaxMb } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

// الحد الافتراضي 6MB محليًا و4MB على Vercel (سقف جسم الطلب هناك 4.5MB ويُطبَّق
// قبل وصول الطلب إلينا) — انظر uploadMaxMb في lib/storage.ts.
const MAX_MB = uploadMaxMb();
const MAX_BYTES = MAX_MB * 1024 * 1024;

/** فحص نوع الملف من البايتات الأولى، لا من اسم الملف أو Content-Type. */
function detectImageType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buffer.subarray(0, 6).toString() === "GIF87a" || buffer.subarray(0, 6).toString() === "GIF89a") return { mime: "image/gif", ext: "gif" };
  if (buffer.subarray(4, 12).toString().includes("ftypavif")) return { mime: "image/avif", ext: "avif" };
  return null;
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireStaff();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 403;
    return NextResponse.json({ error: "غير مصرّح." }, { status });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "لم يُرسل ملف." }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `الحد الأقصى لحجم الصورة ${MAX_MB}MB.` }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type) {
    return NextResponse.json({ error: "نوع الملف غير مسموح. يُقبل JPG أو PNG أو WebP أو AVIF أو GIF فقط." }, { status: 415 });
  }

  try {
    const image = sharp(buffer, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "تعذّر قراءة أبعاد الصورة." }, { status: 422 });
    }
    if (metadata.width * metadata.height > 60_000_000) {
      return NextResponse.json({ error: "أبعاد الصورة كبيرة جدًا." }, { status: 422 });
    }

    const id = randomUUID();

    // توليد أحجام متعددة (بطاقة / صفحة / خلفية) بصيغة WebP، ورفعها إلى
    // التخزين المُهيّأ (قرص محلي أو Vercel Blob) دون تغيير شكل المسارات.
    const widths = [400, 900, 1600].filter((w) => w <= Math.max(metadata.width!, 400));
    const sizes = widths.length ? widths : [Math.min(metadata.width!, 1600)];
    const assets: { path: string; width: number; height: number; size: number }[] = [];

    for (const width of sizes) {
      const filename = `${id}-${width}.webp`;
      const { data: output, info } = await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });
      const publicPath = await putImage(`uploads/${filename}`, output, "image/webp");
      assets.push({ path: publicPath, width: info.width, height: info.height, size: info.size });
    }

    const db = await getDb();
    await db.insert(schema.mediaAssets).values(
      assets.map((asset) => ({
        path: asset.path,
        alt: null,
        width: asset.width,
        height: asset.height,
        sizeBytes: asset.size,
        mimeType: "image/webp",
        uploadedById: user.id,
      })),
    );

    await logAudit({
      userId: user.id,
      action: "MEDIA_UPLOAD",
      entity: "media",
      entityId: id,
      details: {
        originalName: file.name,
        type: type.mime,
        bytes: file.size,
        variants: assets.length,
        storage: storageDriver(),
      },
    });

    const largest = assets[assets.length - 1]!;
    return NextResponse.json({ ok: true, path: largest.path, width: largest.width, height: largest.height, variants: assets });
  } catch (error) {
    console.error("[loomix:upload]", error);
    return NextResponse.json({ error: "تعذّرت معالجة الصورة." }, { status: 500 });
  }
}
