import Link from "next/link";
import { CheckCircle2, CircleSlash, Clock, KeyRound } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { getImportJobs } from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Method = {
  key: string;
  name: string;
  state: "ON" | "OFF" | "PARTIAL";
  detail: string;
  where: string;
};

const METHODS: Method[] = [
  {
    key: "manual",
    name: "الإدخال اليدوي",
    state: "ON",
    detail: "نموذج كامل مع تحقق خادمي، ومنع تكرار (الاسم العربي + السنة).",
    where: "/admin/titles/new",
  },
  {
    key: "csv",
    name: "استيراد CSV / JSON",
    state: "ON",
    detail: "تحليل كامل قبل الإدراج، تقرير أخطاء لكل صف، وتنفيذ على دفعات 10 صفوف.",
    where: "/admin/imports/new",
  },
  {
    key: "bulk",
    name: "تحديث جماعي",
    state: "ON",
    detail: "حقول محدودة، سبب إلزامي، سجل «قبل/بعد»، وحماية للتعديلات اليدوية.",
    where: "/admin/titles/bulk",
  },
  {
    key: "embed",
    name: "استيراد رابط تريلر رسمي",
    state: "ON",
    detail: "يُقبل رابط يوتيوب فقط، ويُحوَّل إلى معرّف، ويُفحص عبر oEmbed الرسمي.",
    where: "/admin/trailers",
  },
  {
    key: "external_ids",
    name: "المعرّفات الخارجية (IMDb / TMDB)",
    state: "PARTIAL",
    detail: "الحقول موجودة (المصدر + المعرّف) وتُعرض للمحرر، لكن لا مزامنة تلقائية — تُدخل يدويًا.",
    where: "/admin/titles",
  },
  {
    key: "api",
    name: "مزامنة API خارجي",
    state: "OFF",
    detail: "معطّلة بالكامل: تحتاج مفتاحًا على الخادم ومراجعة شروط الخدمة وحدود الحصة أولًا.",
    where: "—",
  },
];

const STATE_LABEL: Record<Method["state"], { text: string; className: string }> = {
  ON: { text: "مُفعّل", className: "bg-signal-teal/12 text-signal-teal" },
  PARTIAL: { text: "جزئي", className: "bg-signal-amber/12 text-signal-amber" },
  OFF: { text: "معطّل", className: "bg-white/8 text-ink-400" },
};

export default async function AdminSourcesPage() {
  const jobs = await getImportJobs(6);
  // لا تُعرض قيم المفاتيح أبدًا — فقط وجودها على الخادم.
  const keys = [
    { name: "TMDB_API_KEY", present: Boolean(process.env.TMDB_API_KEY) },
    { name: "DATABASE_URL", present: Boolean(process.env.DATABASE_URL) },
  ];

  return (
    <>
      <AdminPageHeader
        title="مصادر البيانات"
        description="حالة كل طرق الإدخال. ما هو معطّل مذكور بسببه — لا نُشغّل مزامنة لا يمكن ضمان شروطها."
        actions={
          <Link href="/admin/imports/new" className="inline-flex h-9 items-center rounded-lg bg-brass-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-brass-300">
            استيراد جديد
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="طرق الإدخال">
          <ul className="divide-y divide-white/5">
            {METHODS.map((method) => {
              const state = STATE_LABEL[method.state];
              return (
                <li key={method.key} className="flex flex-wrap items-start gap-3 py-3">
                  {method.state === "ON" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-teal" aria-hidden="true" />
                  ) : method.state === "PARTIAL" ? (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" aria-hidden="true" />
                  ) : (
                    <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.78rem] font-medium text-ink-100">{method.name}</p>
                    <p className="mt-0.5 text-[0.66rem] leading-5 text-ink-400">{method.detail}</p>
                    {method.where !== "—" && (
                      <Link href={method.where} className="mt-1 inline-block text-[0.62rem] text-brass-200 underline">
                        {method.where}
                      </Link>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] ${state.className}`}>{state.text}</span>
                </li>
              );
            })}
          </ul>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="مفاتيح الخادم" description="وجود المتغيّر فقط — لا تُعرض القيم">
            <ul className="space-y-2">
              {keys.map((key) => (
                <li key={key.name} className="flex items-center justify-between gap-2 rounded-md border border-white/8 px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[0.65rem] text-ink-300" dir="ltr">
                    <KeyRound className="h-3 w-3 text-ink-500" /> {key.name}
                  </span>
                  <span className={`text-[0.6rem] ${key.present ? "text-signal-teal" : "text-ink-500"}`}>
                    {key.present ? "مُهيّأ" : "غير مُهيّأ"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.6rem] leading-5 text-ink-500">
              المفاتيح تُقرأ على الخادم فقط. لا تُضاف إلى قاعدة البيانات ولا إلى أي متغيّر يبدأ بـ<span dir="ltr"> NEXT_PUBLIC_</span>.
            </p>
          </AdminCard>

          <AdminCard title="سياسة المزامنة" description="لماذا معطّلة؟">
            <ul className="space-y-2 text-[0.62rem] leading-5 text-ink-400">
              <li>• الشروط وأسعار الواجهات تتغيّر، ولم نتحقّق منها في بيئة البناء (الشبكة محدودة).</li>
              <li>• التزام الترسيم (attribution) مطلوب في معظم الواجهات، ولا يجوز حذفه.</li>
              <li>• حدود الحصة قد تكسر الاستيراد في منتصفه؛ لذلك أي تنفيذ مستقبلي يجب أن يكون على دفعات مع حالة محفوظة.</li>
              <li>• حتى التفعيل: تبقى البيانات المُدخلة يدويًا هي المصدر، ومعرّف المصدر مُسجَّل في كل عمل.</li>
            </ul>
            <p className="mt-3 text-[0.6rem] text-ink-500">
              التفاصيل في <span dir="ltr">docs/DEPLOYMENT.md</span> و<span dir="ltr">docs/CONTENT-POLICY.md</span>.
            </p>
          </AdminCard>
        </div>
      </div>

      <div className="mt-5">
        <AdminCard
          title="آخر مهام الاستيراد"
          actions={
            <Link href="/admin/imports" className="text-[0.66rem] text-ink-400 hover:text-brass-200">
              السجل الكامل
            </Link>
          }
        >
          {jobs.length === 0 ? (
            <p className="py-6 text-center text-[0.68rem] text-ink-500">لا مهام بعد.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {jobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center gap-2 py-2 text-[0.66rem]">
                  <span className="min-w-0 flex-1 truncate text-ink-200" dir="ltr">
                    {job.filename ?? "لصق مباشر"}
                  </span>
                  <span className="num text-ink-500">
                    {job.succeeded}/{job.total}
                  </span>
                  <span className="text-[0.6rem] text-ink-500">{formatDate(job.createdAt)}</span>
                  <Link href={`/admin/imports/${job.id}`} className="text-[0.6rem] text-brass-200 underline">
                    التقرير
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </>
  );
}
