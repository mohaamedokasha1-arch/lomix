import path from "node:path";

/**
 * تحديد مصادر صور المشاركة المسموح بها.
 *
 * بطاقات OG تُرسم على الخادم، و`artwork` تفتح الملف أو تجلب الرابط من داخل العملية.
 * لذلك القائمة مغلقة عمدًا: مسارات داخل `public`، أو روابط Vercel Blob فقط.
 * أي رابط آخر (حتى لو جاء من قاعدة البيانات) يُرفض قبل أي قراءة أو طلب شبكة — منعًا
 * لاستخدام الرسم كبوابة SSRF نحو الشبكة الداخلية أو خدمات أخرى.
 */

export const LOCAL_ART_PREFIXES = ["/media/", "/uploads/", "/art/"] as const;

const BLOB_HOST = /(^|\.)blob\.vercel-storage\.com$/i;

/** صورة محلية داخل `public`؛ يُرفض أي مسار يخرج عنها عبر `..` أو مسار مطلق. */
export function localArtFile(candidate: string, publicDir = path.join(process.cwd(), "public")): string | null {
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;
  const normalized = path.posix.normalize(candidate);
  if (!LOCAL_ART_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return null;
  const normalRoot = path.resolve(publicDir);
  const absolute = path.resolve(normalRoot, `.${normalized}`);
  return absolute.startsWith(normalRoot + path.sep) ? absolute : null;
}

/** رابط صورة على نطاق Vercel Blob فقط. */
export function blobArtUrl(candidate: string): URL | null {
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!BLOB_HOST.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
