import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Film } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/**
 * عنوان صفحة 404 ووسم noindex.
 *
 * هذا هو المكان الصحيح للبيانات الوصفية: عندما يُرمى `notFound()` أثناء العرض
 * تُهمَل بيانات الصفحة الأصلية، ولهذا كانت الصفحة تحمل عنوان الموقع العام.
 */
export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};


export default function NotFound() {
  return (
    <div className="container-page flex min-h-[72vh] flex-col items-center justify-center py-24 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-ember-300">
        <Film className="h-7 w-7" />
      </span>
      <p className="num mb-3 text-[0.7rem] font-semibold tracking-[0.4em] text-ink-500">404</p>
      <h1 className="display text-3xl font-bold text-ink-50 md:text-4xl">هذا المشهد غير موجود</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-ink-400">
        الرابط الذي فتحته لا يقود إلى صفحة قائمة. قد يكون العمل حُذف أو تغيّر رابطه. جرّب البحث أو ابدأ من الأقسام الرئيسية.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <ButtonLink href="/">العودة إلى الرئيسية</ButtonLink>
        <ButtonLink href="/latest" variant="secondary">أحدث الإضافات</ButtonLink>
        <Link href="/search" className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm text-ink-300 transition hover:text-ink-50">
          <Compass className="h-4 w-4" /> البحث في المكتبة
        </Link>
      </div>
    </div>
  );
}
