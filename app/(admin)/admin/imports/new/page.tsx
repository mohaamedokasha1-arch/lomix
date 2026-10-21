import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { ImportWizard } from "@/components/admin/import-wizard";

export const dynamic = "force-dynamic";

const COLUMNS = [
  ["titleAr", "مطلوب", "الاسم العربي"],
  ["titleEn", "اختياري", "الاسم الأصلي — يُستخدم للرابط"],
  ["type", "مطلوب", "MOVIE / SERIES / ANIME أو فيلم / مسلسل / أنمي"],
  ["year", "اختياري", "سنة من 4 أرقام"],
  ["overview", "مطلوب", "وصف من 10 أحرف على الأقل"],
  ["genres", "اختياري", "مفصولة بفاصلة، تُطابق التصنيفات الموجودة"],
  ["country", "اختياري", "رمز الدولة (EG/US/JP)"],
  ["language", "اختياري", "اللغة الأصلية"],
  ["rating", "اختياري", "0–10 — بدون مصدر يُرفض الصف"],
  ["ratingSource", "مطلوب مع rating", "مصدر التقييم"],
  ["state", "اختياري", "PUBLISHED أو اتركه ليكون مسودة"],
] as const;

export default function NewImportPage() {
  return (
    <>
      <AdminPageHeader
        title="استيراد جماعي"
        description="رفع CSV/JSON مع تقرير أخطاء لكل صف قبل الإضافة. الاستيراد لا يعدّل أعمالًا موجودة — يضيف الجديد فقط."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/imports", label: "سجل الاستيراد" },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ImportWizard />

        <div className="space-y-4">
          <AdminCard title="الأعمدة المدعومة">
            <ul className="space-y-1.5">
              {COLUMNS.map(([key, required, label]) => (
                <li key={key} className="text-[0.62rem] leading-5">
                  <code dir="ltr" className="text-brass-200">
                    {key}
                  </code>
                  <span className="text-ink-500"> — {label}</span>
                  {required === "مطلوب" && <span className="ms-1 text-signal-red">*</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.6rem] leading-4 text-ink-500">
              الأسماء العربية للأعمدة مقبولة أيضًا (مثل «الاسم العربي»، «الوصف»). الترميز UTF-8.
            </p>
          </AdminCard>

          <AdminCard title="سياسة الاستيراد">
            <ul className="space-y-2 text-[0.62rem] leading-5 text-ink-400">
              <li>• الصفوف الجديدة تُضاف بحالة <strong className="text-ink-200">مسودة</strong> افتراضيًا — راجعها قبل النشر.</li>
              <li>• التكرار (نفس الاسم العربي + السنة) يُتجاهل ويُسجَّل في التقرير.</li>
              <li>• الصفوف التي بها أخطاء لا تُدخل قاعدة البيانات إطلاقًا.</li>
              <li>• العمل يُعالج في دفعات صغيرة (10 صفوف) لتناسب حدود الدوال قصيرة العمر.</li>
              <li>• لا تستورد بيانات من مصدر لا تملك حق استخدامه.</li>
            </ul>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
