import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * تخزين ملفات الصور — محلي أو كائنات سحابية.
 *
 * - محليًا (الافتراضي): يُكتب في `public/uploads` ويُخدَم من نفس الأصل.
 * - على Vercel: ملفات `public/uploads` غير دائمة (نظام ملفات مؤقت)، لذلك يكفي
 *   ربط مخزن Vercel Blob بالمشروع — يُحقن `BLOB_READ_WRITE_TOKEN` تلقائيًا،
 *   فيتحوّل التخزين إلى Blob دون أي تغيير في الكود.
 *
 * مسارات Blob مطلقة (`https://….public.blob.vercel-storage.com/…`) وتُخزَّن كما هي
 * في `media_assets.path` وفي حقول البوستر/الخلفية، وتعمل مع `next/image` بعد
 * السماح بالنطاق في `next.config.ts` (remotePatterns + CSP).
 */

export type StorageDriver = "local" | "vercel-blob";

/**
 * سقف حجم الصورة بالميجابايت.
 *
 * على Vercel سقف جسم الطلب **4.5MB** يُطبَّق عند المنصة قبل وصول الطلب إلينا (413 مبهم
 * للمستخدم). لذلك الافتراضي هناك 4MB، وأي قيمة أعلى تُقيَّد بها تلقائيًا حتى تُعطي
 * رسالتنا العربية بدل خطأ المنصة. محليًا الافتراضي 6MB.
 */
export function uploadMaxMb(): number {
  const onVercel = Boolean(process.env.VERCEL);
  const fallback = onVercel ? 4 : 6;
  const ceiling = onVercel ? 4 : 20;
  const requested = Number(process.env.UPLOAD_MAX_MB) || fallback;
  return Math.min(Math.max(requested, 1), ceiling);
}

export function storageDriver(): StorageDriver {
  return process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local";
}

/** المسار العام الذي سيُخزَّن في قاعدة البيانات. */
export async function putImage(key: string, data: Buffer, contentType = "image/webp"): Promise<string> {
  if (storageDriver() === "vercel-blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const full = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return `/${key}`;
}
