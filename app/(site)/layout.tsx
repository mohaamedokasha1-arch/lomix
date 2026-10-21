import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { getNavigation } from "@/lib/navigation";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, nav] = await Promise.all([getSessionUser(), getNavigation()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={user}
        nav={nav.filter((item) => item.visible).map((item) => ({ href: item.href, label: item.label }))}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
