import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NavigationForm } from "@/components/admin/navigation-form";
import { getFooterSectionLinks, getNavigation } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function AdminNavigationPage() {
  const [nav, footerLinks] = await Promise.all([getNavigation(), getFooterSectionLinks()]);
  const hidden = nav.filter((item) => !item.visible).length;

  return (
    <>
      <AdminPageHeader
        title="التنقل والتذييل"
        description={`${nav.length} رابطًا في الشريط العلوي (${hidden} مخفي) و${footerLinks.length} روابط في تذييل الموقع.`}
        actions={
          <Link href="/" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
            معاينة الموقع
          </Link>
        }
      />
      <div className="max-w-3xl">
        <NavigationForm nav={nav} footerLinks={footerLinks} />
      </div>
    </>
  );
}
