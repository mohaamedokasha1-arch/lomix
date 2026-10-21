import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول إلى لوميكس للوصول إلى قائمة المشاهدة وملفك الشخصي.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : "/");
  if (user) redirect(user.role === "VIEWER" ? next : "/admin");

  return (
    <div className="container-page flex min-h-[78vh] items-center justify-center pb-16 pt-32">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark size={48} />
          </div>
          <h1 className="display text-2xl font-bold text-ink-50">مرحبًا بعودتك</h1>
          <p className="mt-2 text-sm text-ink-400">سجّل الدخول لمتابعة قائمتك والوصول إلى حسابك.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 backdrop-blur-sm">
          {typeof sp.reset === "string" && (
            <p className="mb-4 rounded-lg border border-signal-green/30 bg-signal-green/10 px-3 py-2 text-xs leading-6 text-signal-green">
              تم تحديث كلمة المرور. سجّل الدخول من جديد.
            </p>
          )}
          <LoginForm next={next} />
        </div>

        <div className="mt-6 rounded-xl border border-white/6 bg-white/[0.02] p-3 text-center text-[0.68rem] leading-6 text-ink-500">
          حساب تجريبي للتجربة: <span dir="ltr" className="num">admin@loomix.tv / Loomix@2026</span>
          <br />
          <span className="text-ink-600">غيّر هذه البيانات قبل أي نشر علني.</span>
        </div>

        <p className="mt-5 text-center text-[0.7rem] text-ink-500">
          <Link href="/" className="underline-offset-4 hover:text-ink-300 hover:underline">العودة إلى الرئيسية</Link>
        </p>
      </div>
    </div>
  );
}
