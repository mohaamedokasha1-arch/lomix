import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { getAuditLogs } from "@/lib/admin-queries";
import { ROLE_LABEL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  TITLE_CREATE: "إنشاء عمل",
  TITLE_UPDATE: "تعديل عمل",
  TITLE_DELETE: "حذف عمل",
  TITLE_PUBLISH: "نشر",
  TITLE_UNPUBLISH: "إلغاء نشر",
  TITLE_BULK_PUBLISH: "نشر جماعي",
  TITLE_BULK_DRAFT: "تحويل جماعي لمسودة",
  TITLE_BULK_DELETE: "حذف جماعي",
  SEASON_CREATE: "إضافة موسم",
  SEASON_UPDATE: "تعديل موسم",
  SEASON_DELETE: "حذف موسم",
  EPISODE_CREATE: "إضافة حلقة",
  EPISODE_UPDATE: "تعديل حلقة",
  EPISODE_DELETE: "حذف حلقة",
  EPISODES_BULK_CREATE: "إضافة حلقات دفعة",
  PERSON_CREATE: "إضافة شخص",
  PERSON_UPDATE: "تعديل شخص",
  PERSON_DELETE: "حذف شخص",
  GENRE_CREATE: "إضافة تصنيف",
  GENRE_UPDATE: "تعديل تصنيف",
  GENRE_DELETE: "حذف تصنيف",
  TRAILER_CREATE: "إضافة تريلر",
  TRAILER_UPDATE: "تعديل تريلر",
  TRAILER_DELETE: "حذف تريلر",
  TRAILER_SET_PRIMARY: "تحديد تريلر أساسي",
  TRAILER_HEALTH_MANUAL: "وسم صحة تريلر",
  HOME_SECTION_UPDATE: "تعديل قسم رئيسية",
  HOME_SECTION_MOVE: "إعادة ترتيب رئيسية",
  HOME_SECTION_TOGGLE: "إظهار/إخفاء قسم",
  CURATED_ADD: "إضافة لقائمة",
  CURATED_REMOVE: "إزالة من قائمة",
  CURATED_MOVE: "ترتيب قائمة",
  CURATED_PIN: "تثبيت في قائمة",
  MESSAGE_STATUS: "تحديث حالة رسالة",
  USER_CREATE: "إنشاء مستخدم",
  USER_ROLE_CHANGE: "تغيير دور",
  USER_ACTIVATE: "تفعيل مستخدم",
  USER_DEACTIVATE: "إيقاف مستخدم",
  USER_DELETE: "حذف مستخدم",
  SETTINGS_UPDATE: "تعديل إعدادات",
  BACKUP_CREATE: "إنشاء نسخة احتياطية",
  BACKUP_RESTORE: "استعادة نسخة",
  DEMO_FLUSH: "تنظيف المحتوى التجريبي",
  NAVIGATION_UPDATE: "تحديث روابط التنقل",
  PASSWORD_CHANGE: "تغيير كلمة المرور",
  PASSWORD_RESET_CLI: "إعادة تعيين كلمة المرور (سطر أوامر)",
  USER_PASSWORD_RESET: "إعادة تعيين كلمة مرور مستخدم (اللوحة)",
  PROFILE_UPDATE: "تحديث الملف الشخصي",
  REGISTER: "إنشاء حساب جديد",
  TITLES_BULK_UPDATE: "تحديث جماعي للأعمال",
  USER_CREATE_CLI: "إنشاء مستخدم (سطر أوامر)",
  IMPORT_PREVIEW: "تحليل استيراد",
  IMPORT_COMMIT: "تنفيذ استيراد",
  MEDIA_UPLOAD: "رفع صورة",
  LOGIN_SUCCESS: "دخول ناجح",
  LOGIN_FAILED: "فشل دخول",
  LOGOUT: "خروج",
  SEED: "تهيئة بيانات",
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const { rows, total, totalPages } = await getAuditLogs(page, 50);

  return (
    <>
      <AdminPageHeader
        title="سجل العمليات"
        description={`${total} عملية مسجّلة. السجل للقراءة فقط — لا يوجد أي إجراء في اللوحة يحذفه أو يعدّله.`}
      />

      <AdminCard>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-[0.72rem] text-ink-500">لا سجلات بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[0.68rem]">
              <thead>
                <tr className="border-b border-white/8 text-[0.6rem] text-ink-500">
                  <th className="py-2 text-start font-medium">التوقيت</th>
                  <th className="py-2 text-start font-medium">المنفّذ</th>
                  <th className="py-2 text-start font-medium">العملية</th>
                  <th className="py-2 text-start font-medium">الكيان</th>
                  <th className="py-2 text-start font-medium">التفاصيل</th>
                  <th className="py-2 text-start font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 last:border-0 align-top">
                    <td className="whitespace-nowrap py-2 text-ink-500">{formatDate(row.createdAt)}</td>
                    <td className="py-2">
                      <p className="text-ink-200">{row.userName ?? "نظام"}</p>
                      {row.userEmail && (
                        <p className="text-[0.55rem] text-ink-500" dir="ltr">
                          {row.userEmail}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-ink-200">{ACTION_LABEL[row.action] ?? row.action}</td>
                    <td className="py-2 text-ink-500">
                      <span dir="ltr">{row.entity}</span>
                      {row.entityId && <span className="num ms-1 text-[0.55rem] text-ink-500" dir="ltr">#{row.entityId.slice(0, 6)}</span>}
                    </td>
                    <td className="max-w-[280px] py-2 text-[0.6rem] text-ink-500">
                      <span dir="ltr" className="line-clamp-2 break-all">
                        {row.details ? JSON.stringify(row.details) : "—"}
                      </span>
                    </td>
                    <td className="py-2 text-[0.6rem] text-ink-500">
                      <span dir="ltr">{row.ip ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {totalPages > 1 && (
        <nav aria-label="صفحات السجل" className="mt-4 flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <Link href={`/admin/audit?page=${page - 1}`} className="rounded border border-white/12 px-3 py-1.5 text-ink-200 hover:border-white/25">
              السابق
            </Link>
          )}
          <span className="num text-ink-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/audit?page=${page + 1}`} className="rounded border border-white/12 px-3 py-1.5 text-ink-200 hover:border-white/25">
              التالي
            </Link>
          )}
        </nav>
      )}

      <p className="mt-3 text-[0.6rem] text-ink-500">
        الأدوار في العرض: {Object.values(ROLE_LABEL).join(" · ")}. لا تُخزَّن كلمات المرور أو التوكنات في السجل.
      </p>
    </>
  );
}
