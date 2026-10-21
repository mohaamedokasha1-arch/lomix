import { AdminPageHeader } from "@/components/admin/page-header";
import { BulkUpdateForm } from "@/components/admin/bulk-update-form";
import { getTitleOptions } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function BulkUpdatePage() {
  const titles = await getTitleOptions();

  return (
    <>
      <AdminPageHeader
        title="تحديث جماعي"
        description="تعديل حقول محدودة على مجموعة أعمال، مع تسجيل «قبل/بعد» لكل عمل في سجل العمليات، وحماية اختيارية للتعديلات اليدوية."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
        ]}
      />
      <BulkUpdateForm titles={titles} />
    </>
  );
}
