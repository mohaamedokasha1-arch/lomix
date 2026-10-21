import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <>
      <AdminPageHeader
        title="إعدادات الموقع"
        description="هوية الموقع، روابط التواصل، وإظهار العناصر. التغييرات تُبثّ فورًا للواجهة."
      />
      <div className="max-w-3xl">
        <AdminCard>
          <SiteSettingsForm settings={settings} />
        </AdminCard>
        <p className="mt-3 text-[0.62rem] leading-5 text-ink-500">
          ملاحظة: لا تُخزَّن مفاتيح API في هذه الصفحة ولا في قاعدة البيانات. تُقرأ من متغيّرات البيئة على الخادم فقط،
          ولا تظهر أبدًا في العميل.
        </p>
      </div>
    </>
  );
}
