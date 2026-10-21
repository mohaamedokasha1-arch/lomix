import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { ImportResume } from "@/components/admin/import-resume";
import { getImportJob } from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ReportRow = { line?: number; data?: Record<string, string>; errors?: string[]; row?: number; titleAr?: string; message?: string };

export default async function ImportJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getImportJob(id);
  if (!job) notFound();

  const report = (job.report ?? {}) as { rows?: ReportRow[]; errors?: string[]; headers?: string[] };

  return (
    <>
      <AdminPageHeader
        title={`مهمة استيراد${job.filename ? ` — ${job.filename}` : ""}`}
        description={`${formatDate(job.createdAt)} · ${job.kind} · الحالة ${job.status}`}
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/imports", label: "سجل الاستيراد" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="الإجمالي" value={job.total} />
        <StatCard label="تمت معالجته" value={job.processed} />
        <StatCard label="أُضيف" value={job.succeeded} tone="accent" />
        <StatCard label="فشل/تجاهل" value={job.failed} tone={job.failed ? "warning" : "default"} />
      </div>

      {job.processed < job.total && (
        <div className="mt-4">
          <AdminCard title="متابعة التنفيذ" description="المهمة لم تكتمل — يمكنك إكمال بقية الصفوف الآن">
            <ImportResume jobId={job.id} processed={job.processed} total={job.total} />
          </AdminCard>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <AdminCard title="الصفوف" description={`${report.rows?.length ?? 0} صفًا في التقرير`}>
          {!report.rows?.length ? (
            <p className="py-6 text-center text-[0.68rem] text-ink-500">لا صفوف محفوظة.</p>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[520px] text-[0.66rem]">
                <thead className="sticky top-0 bg-ink-900">
                  <tr className="border-b border-white/8 text-[0.58rem] text-ink-500">
                    <th className="px-2 py-2 text-start font-medium">سطر</th>
                    <th className="px-2 py-2 text-start font-medium">العمل</th>
                    <th className="px-2 py-2 text-start font-medium">النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, index) => {
                    const line = row.line ?? row.row ?? index + 1;
                    const title = row.data?.titleAr ?? row.titleAr ?? "—";
                    const errors = row.errors ?? (row.message ? [row.message] : []);
                    return (
                      <tr key={`${line}-${index}`} className="border-b border-white/5 align-top last:border-0">
                        <td className="num px-2 py-1.5 text-ink-500">{line}</td>
                        <td className="px-2 py-1.5 text-ink-200">{title}</td>
                        <td className="px-2 py-1.5 text-[0.6rem]">
                          {errors.length ? (
                            <span className="text-signal-amber">{errors.join(" · ")}</span>
                          ) : (
                            <span className="text-signal-teal">صالح</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="أخطاء التنفيذ" description={`${report.errors?.length ?? 0} خطأ مسجّل`}>
            {!report.errors?.length ? (
              <p className="text-[0.68rem] text-ink-500">لا أخطاء تنفيذ.</p>
            ) : (
              <ul className="space-y-1.5">
                {report.errors.map((error, index) => (
                  <li key={index} className="rounded-md bg-signal-amber/[0.06] px-2 py-1.5 text-[0.6rem] leading-4 text-signal-amber">
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="الأعمدة المكتشفة">
            <p className="break-words text-[0.6rem] text-ink-400" dir="ltr">
              {report.headers?.join(" · ") ?? "—"}
            </p>
          </AdminCard>

          <Link href="/admin/imports" className="inline-block text-[0.68rem] text-ink-400 underline hover:text-ember-200">
            رجوع إلى سجل الاستيراد
          </Link>
        </div>
      </div>
    </>
  );
}
