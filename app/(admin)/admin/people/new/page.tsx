import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { PersonForm } from "@/components/admin/person-form";

export const dynamic = "force-dynamic";

export default function NewPersonPage() {
  return (
    <>
      <AdminPageHeader
        title="شخص جديد"
        description="أضف ممثلًا أو مخرجًا أو كاتبًا. بعد الحفظ يمكنك ربطه بأي عمل من صفحة العمل."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/people", label: "الأشخاص" },
        ]}
      />
      <div className="max-w-xl">
        <AdminCard>
          <PersonForm />
        </AdminCard>
      </div>
    </>
  );
}
