import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, LogIn } from "lucide-react";
import { PageHeader, PosterGrid } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { WatchlistRemove } from "@/components/titles/watchlist-remove";
import { getSessionUser } from "@/lib/auth";
import { getWatchlist } from "@/lib/queries";
import { TitleCard } from "@/components/titles/title-card";

export const metadata: Metadata = {
  title: "قائمة المشاهدة",
  description: "الأعمال التي حفظتها في قائمتك على لوميكس فيلم.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="container-page pb-10 pt-28 md:pt-32">
        <PageHeader kicker="حسابك" title="قائمة المشاهدة" description="قائمتك محفوظة في حسابك — سجّل الدخول للوصول إليها." />
        <EmptyState
          icon={<LogIn className="h-5 w-5" />}
          title="تحتاج تسجيل الدخول"
          description="قوائم المشاهدة مرتبطة بالحساب لتبقى متاحة على كل أجهزتك."
          action={
            <div className="flex gap-2">
              <ButtonLink href="/login?next=%2Fwatchlist" size="sm">تسجيل الدخول</ButtonLink>
              <ButtonLink href="/register" variant="secondary" size="sm">حساب جديد</ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const items = await getWatchlist(user.id);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="حسابك"
        title="قائمة المشاهدة"
        description={`${items.length} عملًا محفوظًا. القائمة خاصة بحسابك ولا تظهر للعامة.`}
      />
      {items.length ? (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.map((item) => (
            <TitleCard key={item.id} title={item} action={<WatchlistRemove titleId={item.id} />} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title="قائمتك فارغة"
          description="أضف الأعمال من صفحة أي فيلم أو مسلسل بزر «أضف للقائمة» لتجدها هنا."
          action={<ButtonLink href="/trending" size="sm" variant="secondary">استكشف الأعمال الرائجة</ButtonLink>}
        />
      )}
      <p className="mt-8 text-[0.7rem] text-ink-500">
        <Link href="/profile" className="underline underline-offset-4 hover:text-ink-300">إدارة الحساب</Link>
      </p>
    </div>
  );
}
