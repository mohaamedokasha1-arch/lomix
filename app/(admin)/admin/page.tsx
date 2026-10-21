import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clapperboard,
  Film,
  FolderTree,
  Import,
  Mail,
  Plus,
  Star,
  Tv,
  Users,
} from "lucide-react";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { getAdminStats, getRecentTrailers, getTrendingSnapshot } from "@/lib/queries-extra";
import { recentAudit } from "@/lib/audit";
import { formatNumber, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  TITLE_CREATE: "إضافة عمل",
  TITLE_UPDATE: "تعديل عمل",
  TITLE_DELETE: "حذف عمل",
  TITLE_PUBLISH: "نشر عمل",
  TITLE_UNPUBLISH: "إلغاء نشر",
  SEASON_CREATE: "إضافة موسم",
  EPISODE_CREATE: "إضافة حلقة",
  TRAILER_CREATE: "إضافة تريلر",
  TRAILER_UPDATE: "تعديل تريلر",
  GENRE_CREATE: "إضافة تصنيف",
  PERSON_CREATE: "إضافة شخص",
  SETTINGS_UPDATE: "تعديل إعدادات",
  LOGIN_SUCCESS: "دخول ناجح",
  LOGIN_FAILED: "محاولة دخول فاشلة",
  SETTINGS: "إعدادات",
  SEED: "تهيئة بيانات",
  IMPORT_COMMIT: "تنفيذ استيراد",
  MEDIA_UPLOAD: "رفع صورة",
  BACKUP_CREATE: "نسخة احتياطية",
  USER_CREATE: "إنشاء مستخدم",
  USER_ROLE_CHANGE: "تغيير دور",
  MESSAGE_STATUS: "تحديث رسالة",
  BACKUP_RESTORE: "استعادة نسخة",
  DEMO_FLUSH: "تنظيف المحتوى التجريبي",
  USER_PASSWORD_RESET: "إعادة تعيين كلمة مرور",
  PASSWORD_CHANGE: "تغيير كلمة المرور",
  PROFILE_UPDATE: "تحديث الملف الشخصي",
  REGISTER: "إنشاء حساب",
  TITLES_BULK_UPDATE: "تحديث جماعي",
  NAVIGATION_UPDATE: "تحديث التنقل",
};

export default async function AdminDashboard() {
  const [stats, audit, trending, trailers] = await Promise.all([
    getAdminStats(),
    recentAudit(12),
    getTrendingSnapshot(7, 6),
    getRecentTrailers(5),
  ]);

  return (
    <>
      <AdminPageHeader
        title="لوحة المعلومات"
        description="أرقام حقيقية من قاعدة البيانات، وآخر العمليات، والتنبيهات التي تحتاج مراجعة."
        actions={
          <>
            <Link href="/admin/titles/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brass-400 px-3.5 text-xs font-bold text-[#171006] transition hover:bg-brass-300">
              <Plus className="h-3.5 w-3.5" /> عمل جديد
            </Link>
            <Link href="/admin/imports/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3.5 text-xs text-ink-100 transition hover:border-white/30">
              <Import className="h-3.5 w-3.5" /> استيراد
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="الأفلام" value={stats.movies} href="/admin/titles?type=MOVIE" hint="كل الأفلام المسجّلة" />
        <StatCard label="المسلسلات" value={stats.series} href="/admin/titles?type=SERIES" hint="كل المسلسلات" />
        <StatCard label="الأنمي" value={stats.anime} href="/admin/titles?type=ANIME" hint="أعمال الأنمي" />
        <StatCard label="المواسم" value={stats.seasons} hint="موسمًا مرتبطًا بالأعمال" />
        <StatCard label="الحلقات" value={stats.episodes} hint="حلقة مسجّلة" />
        <StatCard label="التريلرات" value={stats.trailers} href="/admin/trailers" hint={`${stats.brokenTrailers} رابطًا معطلًا`} tone={stats.brokenTrailers ? "warning" : "default"} />
        <StatCard label="مشاهدات مسجّلة" value={formatNumber(stats.views)} href="/admin/analytics" hint="من عدّاد حقيقي" />
        <StatCard label="أعضاء" value={stats.users} href="/admin/users" hint="حسابات مسجّلة" />
      </div>

      {(stats.newMessages > 0 || stats.brokenTrailers > 0 || stats.failedImports > 0 || stats.drafts > 0) && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {stats.brokenTrailers > 0 && (
            <Link href="/admin/trailers?health=BROKEN" className="flex items-start gap-3 rounded-xl border border-signal-amber/25 bg-signal-amber/[0.06] p-3.5 transition hover:border-signal-amber/40">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" />
              <div>
                <p className="text-[0.78rem] font-semibold text-signal-amber">{stats.brokenTrailers} تريلر برابط معطل</p>
                <p className="mt-0.5 text-[0.68rem] text-ink-400">يظهر للمستخدم «التريلر غير متاح حاليًا» حتى المراجعة.</p>
              </div>
            </Link>
          )}
          {stats.newMessages > 0 && (
            <Link href="/admin/messages?status=NEW" className="flex items-start gap-3 rounded-xl border border-signal-teal/25 bg-signal-teal/[0.05] p-3.5 transition hover:border-signal-teal/40">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-signal-teal" />
              <div>
                <p className="text-[0.78rem] font-semibold text-signal-teal">{stats.newMessages} رسالة جديدة</p>
                <p className="mt-0.5 text-[0.68rem] text-ink-400">تشمل طلبات حقوق الملكية (DMCA) وتحتاج أولوية.</p>
              </div>
            </Link>
          )}
          {stats.failedImports > 0 && (
            <Link href="/admin/imports" className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900/50 p-3.5 transition hover:border-white/25">
              <Import className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
              <div>
                <p className="text-[0.78rem] font-semibold text-ink-100">{stats.failedImports} مهمة استيراد تحتاج مراجعة</p>
                <p className="mt-0.5 text-[0.68rem] text-ink-400">راجع تقرير الأخطاء لكل مهمة قبل إعادة المحاولة.</p>
              </div>
            </Link>
          )}
          {stats.drafts > 0 && (
            <Link href="/admin/titles?state=DRAFT" className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900/50 p-3.5 transition hover:border-white/25">
              <FolderTree className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
              <div>
                <p className="text-[0.78rem] font-semibold text-ink-100">{stats.drafts} عملًا كمسودة</p>
                <p className="mt-0.5 text-[0.68rem] text-ink-400">المسودات لا تظهر للجمهور ولا في الفهرسة.</p>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <AdminCard
          title="آخر العمليات"
          description="سجل غير قابل للحذف من واجهة المحرر"
          actions={
            <Link href="/admin/audit" className="flex items-center gap-1 text-[0.68rem] text-ink-400 transition hover:text-brass-200">
              السجل الكامل <ArrowLeft className="h-3 w-3" />
            </Link>
          }
        >
          <ul className="divide-y divide-white/5">
            {audit.length === 0 && <li className="py-6 text-center text-xs text-ink-500">لا توجد عمليات مسجّلة بعد.</li>}
            {audit.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.78rem] text-ink-100">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                    {entry.entity !== "system" && <span className="text-ink-500"> · {entry.entity}</span>}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-500">{entry.userName ?? "نظام"}</p>
                </div>
                <span className="shrink-0 text-[0.62rem] text-ink-500">{relativeTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="الأكثر مشاهدة" description="آخر 7 أيام — عدّاد حقيقي">
            <ol className="space-y-2.5">
              {trending.length === 0 && <li className="py-4 text-center text-xs text-ink-500">لا مشاهدات مسجّلة هذا الأسبوع.</li>}
              {trending.map((item, index) => (
                <li key={item.slug} className="flex items-center gap-2.5">
                  <span className="num w-4 text-[0.65rem] text-ink-500">{index + 1}</span>
                  <Link href={`/${item.type === "MOVIE" ? "movie" : item.type === "ANIME" ? "anime" : "series"}/${item.slug}`} className="min-w-0 flex-1 truncate text-[0.76rem] text-ink-200 hover:text-brass-200" target="_blank">
                    {item.titleAr}
                  </Link>
                  <span className="num text-[0.65rem] text-ink-400">{item.views}</span>
                </li>
              ))}
            </ol>
          </AdminCard>

          <AdminCard title="آخر التريلرات" actions={<Link href="/admin/trailers" className="text-[0.68rem] text-ink-400 hover:text-brass-200">إدارة</Link>}>
            <ul className="space-y-2">
              {trailers.map((trailer) => (
                <li key={trailer.id} className="flex items-center justify-between gap-2 text-[0.72rem]">
                  <span className="truncate text-ink-200">{trailer.titleAr}</span>
                  <span className={trailer.health === "BROKEN" ? "shrink-0 text-[0.62rem] text-signal-amber" : "shrink-0 text-[0.62rem] text-ink-500"}>
                    {trailer.health === "BROKEN" ? "معطل" : trailer.health === "OK" ? "سليم" : "لم يُفحص"}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/people", label: "الأشخاص", value: stats.people, Icon: Users },
          { href: "/admin/genres", label: "التصنيفات", value: "إدارة", Icon: Star },
          { href: "/admin/homepage", label: "ترتيب الرئيسية", value: "تحكم", Icon: Film },
          { href: "/admin/trailers", label: "التريلرات", value: stats.trailers, Icon: Clapperboard },
          { href: "/admin/titles?type=SERIES", label: "المسلسلات", value: stats.series, Icon: Tv },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-ink-900/40 p-3.5 text-[0.75rem] text-ink-200 transition hover:border-brass-400/30 hover:text-brass-200">
            <item.Icon className="h-4 w-4 text-ink-500" />
            <span className="flex-1">{item.label}</span>
            <span className="num text-[0.68rem] text-ink-500">{item.value}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
