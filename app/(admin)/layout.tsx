import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/queries-extra";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "لوحة التحكم",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) redirect("/login?next=%2Fadmin");
  if (user.role === "VIEWER") redirect("/?forbidden=admin");

  const stats = await getAdminStats();

  return (
    <AdminShell
      user={user}
      pendingBadges={{
        messages: stats.newMessages,
        brokenTrailers: stats.brokenTrailers,
        failedImports: stats.failedImports,
      }}
    >
      {children}
    </AdminShell>
  );
}
