import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { getSessionUser } from "@/lib/auth";
import { getSessionCount, getUsersAdmin } from "@/lib/admin-queries";
import { ROLE_LABEL, formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, currentUser, sessionCount] = await Promise.all([getUsersAdmin(), getSessionUser(), getSessionCount()]);

  return (
    <>
      <AdminPageHeader
        title="المستخدمون والصلاحيات"
        description={`${users.length} حسابًا · ${sessionCount} جلسة نشطة. الأدوار تُفحص على الخادم في كل إجراء — إخفاء الأزرار ليس حماية.`}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="الحسابات">
          <ul className="divide-y divide-white/5">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/6 text-[0.68rem] text-ink-200">
                  {user.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.78rem] text-ink-100">
                    {user.name}
                    {user.id === currentUser?.id && <span className="ms-1 text-[0.58rem] text-brass-300">(أنت)</span>}
                  </p>
                  <p className="truncate text-[0.6rem] text-ink-500" dir="ltr">
                    {user.email}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[0.58rem] ${user.role === "ADMIN" ? "bg-brass-400/15 text-brass-200" : "bg-white/8 text-ink-400"}`}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <span className={`text-[0.58rem] ${user.isActive ? "text-signal-teal" : "text-signal-red"}`}>{user.isActive ? "نشط" : "موقوف"}</span>
                <span className="num hidden text-[0.58rem] text-ink-500 sm:inline">{user.sessionCount} جلسة</span>
                <span className="hidden text-[0.58rem] text-ink-500 md:inline">{user.lastLoginAt ? relativeTime(user.lastLoginAt) : "لم يدخل"}</span>
                <UserRowActions id={user.id} role={user.role} isActive={user.isActive} name={user.name} isSelf={user.id === currentUser?.id} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.6rem] leading-4 text-ink-500">
            إيقاف حساب يحذف جلساته فورًا من الخادم. آخر حساب ADMIN لا يمكن حذفه.
          </p>
        </AdminCard>

        <AdminCard title="حساب جديد">
          <UserForm />
        </AdminCard>
      </div>

      <AdminCard title="مصفوفة الصلاحيات" description="ما يستطيع كل دور فعله">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[0.68rem]">
            <thead>
              <tr className="border-b border-white/8 text-ink-500">
                <th className="py-2 text-start font-medium">القدرة</th>
                <th className="py-2 text-center font-medium">ADMIN</th>
                <th className="py-2 text-center font-medium">EDITOR</th>
                <th className="py-2 text-center font-medium">VIEWER</th>
              </tr>
            </thead>
            <tbody className="text-ink-300">
              {[
                ["إدارة الأعمال والمواسم والتريلرات", true, true, false],
                ["ترتيب الصفحة الرئيسية والقوائم", true, true, false],
                ["الاستيراد الجماعي", true, true, false],
                ["الرسائل والبلاغات", true, true, false],
                ["الإعدادات وSEO", true, true, false],
                ["المستخدمون والأدوار", true, false, false],
                ["النسخ الاحتياطي والاستعادة", true, false, false],
                ["سجل العمليات", true, true, false],
              ].map(([label, admin, editor, viewer]) => (
                <tr key={String(label)} className="border-b border-white/5 last:border-0">
                  <td className="py-1.5">{label as string}</td>
                  <td className="py-1.5 text-center">{admin ? "✓" : "—"}</td>
                  <td className="py-1.5 text-center">{editor ? "✓" : "—"}</td>
                  <td className="py-1.5 text-center">{viewer ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
