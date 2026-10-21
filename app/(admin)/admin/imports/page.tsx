import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { getImportJobs } from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  QUEUED: "في الانتظار",
  RUNNING: "جارٍ",
  DONE: "مكتمل",
  PARTIAL: "مكتمل بأخطاء",
  FAILED: "فشل",
};

const STATUS_CLASS: Record<string, string> = {
  QUEUED: "bg-white/8 text-ink-400",
  RUNNING: "bg-brass-400/15 text-brass-200",
  DONE: "bg-signal-teal/12 text-signal-teal",
  PARTIAL: "bg-signal-amber/12 text-signal-amber",
  FAILED: "bg-signal-red/12 text-signal-red",
};

export default async function AdminImportsPage() {
  const jobs = await getImportJobs(50);

  return (
    <>
      <AdminPageHeader
        title="سجل الاستيراد"
        description="كل مهمة استيراد مع عدد الصفوف الناجحة والفاشلة. التقرير التفصيلي محفوظ لكل مهمة."
        actions={
          <Link href="/admin/imports/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brass-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-brass-300">
            <Plus className="h-3.5 w-3.5" /> استيراد جديد
          </Link>
        }
      />

      <AdminCard>
        {jobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-ink-300">لا مهام استيراد بعد.</p>
            <Link href="/admin/imports/new" className="mt-2 inline-block text-[0.7rem] text-brass-200 underline">
              ابدأ أول استيراد
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-[0.7rem]">
              <thead>
                <tr className="border-b border-white/8 text-[0.6rem] text-ink-500">
                  <th className="py-2 text-start font-medium">التاريخ</th>
                  <th className="py-2 text-start font-medium">الملف</th>
                  <th className="py-2 text-start font-medium">الصيغة</th>
                  <th className="py-2 text-start font-medium">التقدم</th>
                  <th className="py-2 text-start font-medium">نجح</th>
                  <th className="py-2 text-start font-medium">فشل</th>
                  <th className="py-2 text-start font-medium">الحالة</th>
                  <th className="py-2 text-start font-medium">المنفّذ</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-white/5 last:border-0">
                    <td className="whitespace-nowrap py-2 text-[0.62rem] text-ink-500">{formatDate(job.createdAt)}</td>
                    <td className="max-w-[180px] truncate py-2 text-ink-200" dir="ltr">
                      {job.filename ?? "لصق مباشر"}
                    </td>
                    <td className="py-2 text-[0.62rem] text-ink-400">{job.kind}</td>
                    <td className="num py-2 text-[0.62rem] text-ink-400">
                      {job.processed}/{job.total}
                    </td>
                    <td className="num py-2 text-[0.62rem] text-signal-teal">{job.succeeded}</td>
                    <td className={`num py-2 text-[0.62rem] ${job.failed ? "text-signal-amber" : "text-ink-500"}`}>{job.failed}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[0.56rem] ${STATUS_CLASS[job.status] ?? "bg-white/8 text-ink-400"}`}>
                        {STATUS_LABEL[job.status] ?? job.status}
                      </span>
                    </td>
                    <td className="py-2 text-[0.62rem] text-ink-500">{job.userName ?? "—"}</td>
                    <td className="py-2 text-end">
                      <Link href={`/admin/imports/${job.id}`} className="text-[0.6rem] text-brass-200 underline">
                        التقرير
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <div className="mt-4 rounded-xl border border-white/8 bg-ink-900/40 p-3.5 text-[0.62rem] leading-5 text-ink-500">
        المهام المعلّقة (QUEUED) تعني أن التحليل تم لكن التنفيذ لم يبدأ. على بيئات Serverless لا توجد عملية خلفية دائمة —
        التنفيذ يجري على دفعات متتالية من المتصفح، وتُحفظ حالة كل دفعة في قاعدة البيانات، لذا يمكن إكمالها لاحقًا بأمان.
      </div>
    </>
  );
}
