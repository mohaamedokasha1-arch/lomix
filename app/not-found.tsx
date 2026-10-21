import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

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


export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <LogoMark size={44} uid="notfound" />
      <p className="num mt-8 text-[0.7rem] font-semibold tracking-[0.4em] text-ink-500">404</p>
      <h1 className="display mt-3 text-3xl font-bold text-ink-50">الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-ink-400">
        قد يكون الرابط قديمًا أو العمل لم يعد منشورًا. يمكنك العودة إلى الرئيسية ومتابعة التصفح.
      </p>
      <Link href="/" className="mt-7 rounded-xl bg-brass-400 px-5 py-2.5 text-sm font-bold text-[#171006] transition hover:bg-brass-300">
        العودة إلى لوميكس
      </Link>
    </div>
  );
}
