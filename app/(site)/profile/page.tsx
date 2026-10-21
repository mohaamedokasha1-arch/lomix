import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/titles/catalog-view";
import { PasswordForm, ProfileNameForm } from "@/components/auth/profile-forms";
import { logoutAction } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABEL, formatDate } from "@/lib/utils";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "الملف الشخصي",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Fprofile");

  const db = await getDb();
  const [row] = await db
    .select({ createdAt: schema.users.createdAt, lastLoginAt: schema.users.lastLoginAt })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader kicker="حسابك" title={user.name} description={`${user.email} · ${ROLE_LABEL[user.role]}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/8 bg-ink-900/50 p-5">
            <h2 className="display mb-4 text-sm font-bold text-ink-100">بيانات الحساب</h2>
            <ProfileNameForm defaultName={user.name} />
            <dl className="mt-5 grid gap-2 border-t border-white/6 pt-4 text-[0.72rem] sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">البريد الإلكتروني</dt>
                <dd className="text-ink-200" dir="ltr">{user.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">الدور</dt>
                <dd className="text-ink-200">{ROLE_LABEL[user.role]}</dd>
              </div>
              {row?.createdAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">تاريخ الانضمام</dt>
                  <dd className="text-ink-200">{formatDate(row.createdAt)}</dd>
                </div>
              )}
              {row?.lastLoginAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">آخر دخول</dt>
                  <dd className="text-ink-200">{formatDate(row.lastLoginAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-white/8 bg-ink-900/50 p-5">
            <h2 className="display mb-4 flex items-center gap-2 text-sm font-bold text-ink-100">
              <ShieldCheck className="h-4 w-4 text-ember-300" /> كلمة المرور
            </h2>
            <PasswordForm />
          </section>
        </div>

        <aside className="space-y-3">
          <Link href="/watchlist" className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-ink-900/50 p-4 text-sm text-ink-100 transition hover:border-ember-400/30 hover:text-ember-200">
            <Bookmark className="h-4 w-4" /> قائمة المشاهدة
          </Link>
          {user.role !== "VIEWER" && (
            <Link href="/admin" className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-ink-900/50 p-4 text-sm text-ink-100 transition hover:border-ember-400/30 hover:text-ember-200">
              <LayoutDashboard className="h-4 w-4" /> لوحة التحكم
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl border border-white/8 bg-ink-900/50 p-4 text-sm text-signal-red/90 transition hover:border-signal-red/30">
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
