import Link from "next/link";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { getAnalytics, getWatchlistCounts } from "@/lib/admin-queries";
import { formatNumber, TITLE_TYPE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = [7, 14, 30, 90].includes(Number(params.days)) ? Number(params.days) : 14;
  const [{ daily, top, totals }, watchlist] = await Promise.all([getAnalytics(days), getWatchlistCounts(8)]);

  const maxDaily = Math.max(1, ...daily.map((day) => day.count));
  const totalInRange = daily.reduce((sum, day) => sum + day.count, 0);

  return (
    <>
      <AdminPageHeader
        title="التحليلات"
        description="أرقام من عدّاد مشاهدات داخلي (محدود المعدّل) وقوائم الحفظ — لا تُستنتج أرقام غير موجودة."
        actions={
          <div className="flex gap-1 rounded-lg border border-white/8 bg-ink-900/40 p-1 text-[0.68rem]">
            {[7, 14, 30, 90].map((option) => (
              <Link
                key={option}
                href={`/admin/analytics?days=${option}`}
                className={`rounded px-2.5 py-1 ${days === option ? "bg-white/10 text-ink-50" : "text-ink-400 hover:text-ink-100"}`}
              >
                <span className="num">{option}</span> يوم
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجمالي المشاهدات" value={formatNumber(totals.totalViews)} hint="كل الأوقات" />
        <StatCard label="آخر 7 أيام" value={formatNumber(totals.last7)} />
        <StatCard label={`مشاهدات ${days} يومًا`} value={formatNumber(totalInRange)} tone="accent" />
        <StatCard label="متوسط يومي" value={formatNumber(Math.round(totalInRange / days))} hint={`خلال ${days} يومًا`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <AdminCard title="المشاهدات اليومية" description={`آخر ${days} يومًا`}>
          {daily.length === 0 ? (
            <p className="py-14 text-center text-[0.72rem] text-ink-500">لا مشاهدات في هذه الفترة.</p>
          ) : (
            <div className="space-y-1.5" role="img" aria-label={`مخطط أعمدة للمشاهدات اليومية خلال ${days} يومًا`}>
              {daily.map((day) => (
                <div key={day.day} className="flex items-center gap-2">
                  <span className="num w-16 shrink-0 text-[0.55rem] text-ink-500" dir="ltr">
                    {day.day.slice(5)}
                  </span>
                  <div className="h-3.5 flex-1 overflow-hidden rounded-sm bg-white/5">
                    <div className="h-full rounded-sm bg-brass-400/70" style={{ width: `${Math.max(2, (day.count / maxDaily) * 100)}%` }} />
                  </div>
                  <span className="num w-8 text-end text-[0.58rem] text-ink-400">{day.count}</span>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="الأكثر مشاهدة" description={`خلال ${days} يومًا`}>
            {top.length === 0 ? (
              <p className="py-6 text-center text-[0.68rem] text-ink-500">لا بيانات.</p>
            ) : (
              <ol className="space-y-2">
                {top.map((item, index) => (
                  <li key={item.slug} className="flex items-center gap-2">
                    <span className="num w-4 text-[0.6rem] text-ink-500">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.72rem] text-ink-200">{item.titleAr}</span>
                    <span className="text-[0.55rem] text-ink-500">{TITLE_TYPE_LABEL[item.type] ?? item.type}</span>
                    <span className="num text-[0.62rem] text-ink-400">{item.views}</span>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>

          <AdminCard title="الأكثر حفظًا" description="قوائم المشاهدة">
            {watchlist.length === 0 ? (
              <p className="py-6 text-center text-[0.68rem] text-ink-500">لا حفظات بعد.</p>
            ) : (
              <ol className="space-y-2">
                {watchlist.map((item, index) => (
                  <li key={item.slug} className="flex items-center gap-2">
                    <span className="num w-4 text-[0.6rem] text-ink-500">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.72rem] text-ink-200">{item.titleAr}</span>
                    <span className="num text-[0.62rem] text-ink-400">{item.saves}</span>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/8 bg-ink-900/40 p-4 text-[0.65rem] leading-6 text-ink-500">
        <p className="mb-1 font-semibold text-ink-300">حدود القياس</p>
        يُسجّل العدّاد زيارة واحدة لكل عمل كل 30 دقيقة لكل زائر (rate limit). لا توجد بيانات ديموغرافية أو مصادر خارجية،
        ولا تُعرض أرقام «مستخدمين نشطين» لأننا لا نتتبّع الزوار المجهولين. عند الحاجة لتحليلات أعمق يمكن ربط أداة خارجية
        بشرط موافقة صريحة على الكوكيز.
      </div>
    </>
  );
}
