import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { PasswordResetForm } from "@/components/admin/password-reset-form";
import { requireAdminPage } from "@/lib/auth";
import { getUsersAdmin } from "@/lib/admin-queries";
import { ROLE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * إعادة تعيين كلمة مرور مستخدم — صفحة مستقلة لا نافذة منبثقة.
 *
 * لا يوجد بريد صادر، فالتعيين «بمساعدة الإدارة»: المدير يكتب كلمة مرور جديدة
 * ويبلّغها لصاحب الحساب. الحفظ يُبطل الجلسات ويُسجَّل الحدث في سجل العمليات.
 */
export default async function UserPasswordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const users = await getUsersAdmin();
  const user = users.find((row) => row.id === id);
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title="إعادة تعيين كلمة المرور"
        description={`${user.name} · ${user.email}`}
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/users", label: "المستخدمون" },
          { href: `/admin/users/${id}/password`, label: "كلمة المرور" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard title="كلمة مرور جديدة">
          <PasswordResetForm id={user.id} email={user.email} />
        </AdminCard>

        <AdminCard title="الحساب">
          <dl className="space-y-2 text-[0.72rem]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">الاسم</dt>
              <dd className="truncate text-ink-200">{user.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">البريد</dt>
              <dd className="truncate text-ink-200" dir="ltr">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">الدور</dt>
              <dd className="text-ink-200">{ROLE_LABEL[user.role] ?? user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">الحالة</dt>
              <dd className={user.isActive ? "text-signal-teal" : "text-signal-red"}>{user.isActive ? "نشط" : "موقوف"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[0.62rem] leading-5 text-ink-500">
            كلمة المرور لا تُحفظ كنص ولا تُعاد عرضها في أي مكان؛ إن فُقدت بعد التعيين فأعِد التعيين من هنا.
          </p>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center gap-1.5 text-[0.7rem] text-ember-200 hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            العودة إلى المستخدمين
          </Link>
        </AdminCard>
      </div>
    </>
  );
}
