import Image from "next/image";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { MediaUploader } from "@/components/admin/media-uploader";
import { getMediaAssets } from "@/lib/admin-queries";
import { storageDriver, uploadMaxMb } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** اسم الملف للعرض: آخر مقطع من المسار المحلي أو من رابط Blob. */
function fileLabel(storedPath: string) {
  const clean = storedPath.split("?")[0] ?? storedPath;
  return clean.split("/").filter(Boolean).pop() ?? storedPath;
}

function sizeLabel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminMediaPage() {
  const assets = await getMediaAssets(200);
  const totalBytes = assets.reduce((sum, asset) => sum + (asset.sizeBytes ?? 0), 0);
  const driver = storageDriver();

  return (
    <>
      <AdminPageHeader
        title="مكتبة الوسائط"
        description={`${assets.length} صورة مسجّلة · ${sizeLabel(totalBytes)}. كل صورة تُعاد معالجتها إلى أحجام WebP متعددة، وتُفحص من بايتاتها لا من امتداد الاسم.`}
      />

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <AdminCard title="رفع صورة" description={`JPG / PNG / WebP / AVIF — حتى ${uploadMaxMb()}MB`}>
          <MediaUploader />
        </AdminCard>

        <AdminCard title="الملفات">
          {assets.length === 0 ? (
            <p className="py-10 text-center text-[0.72rem] text-ink-500">لا ملفات بعد.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {assets.map((asset) => (
                <li key={asset.id} className="overflow-hidden rounded-lg border border-white/8 bg-ink-950/40">
                  <div className="relative aspect-[3/4] bg-ink-800">
                    <Image src={asset.path} alt={asset.alt ?? ""} fill sizes="180px" className="object-cover" />
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-[0.58rem] text-ink-400" dir="ltr" title={asset.path}>
                      {fileLabel(asset.path)}
                    </p>
                    <p className="num mt-0.5 text-[0.55rem] text-ink-500">
                      {asset.width}×{asset.height} · {sizeLabel(asset.sizeBytes)}
                    </p>
                    <p className="text-[0.55rem] text-ink-500">{formatDate(asset.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className={`mt-4 rounded-xl border p-3.5 text-[0.65rem] leading-5 text-ink-300 ${driver === "vercel-blob" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-signal-amber/20 bg-signal-amber/[0.04]"}`}>
        <p className={`mb-1 font-semibold ${driver === "vercel-blob" ? "text-emerald-400" : "text-signal-amber"}`}>
          {driver === "vercel-blob" ? "التخزين السحابي مفعّل" : "تنبيه بيئة الإنتاج"}
        </p>
        {driver === "vercel-blob" ? (
          <>
            الصور تُرفع إلى <span dir="ltr">Vercel Blob</span> ويُخزَّن رابطها المطلق، فتبقى بعد النشر. الصور القديمة
            المرفوعة محليًا تبقى في <span dir="ltr">public/uploads</span> داخل المستودع.
          </>
        ) : (
          <>
            التخزين الحالي محلي في <span dir="ltr">public/uploads</span> — غير دائم على المنصات ذات نظام ملفات مؤقت
            (مثل Vercel). اربط مخزن <span dir="ltr">Vercel Blob</span> بالمشروع فيتحوّل الرفع تلقائيًا دون تعديل كود،
            أو استخدم S3/R2 عبر <span dir="ltr">lib/storage.ts</span> — الشرح في{" "}
            <span dir="ltr">docs/DEPLOY-VERCEL.md §7</span>.
          </>
        )}
      </div>
    </>
  );
}
