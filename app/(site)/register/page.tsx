import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك على لوميكس فيلم لحفظ الأعمال في قائمة المشاهدة.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  const settings = await getSettings(["allow_registration"]);
  const allowed = settings.allow_registration !== "false";

  return (
    <div className="container-page flex min-h-[78vh] items-center justify-center pb-16 pt-32">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark size={48} uid="register" />
          </div>
          <h1 className="display text-2xl font-bold text-ink-50">أنشئ حسابك</h1>
          <p className="mt-2 text-sm text-ink-400">احفظ الأعمال التي تريد مشاهدتها، وارجع إليها في أي وقت.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 backdrop-blur-sm">
          {allowed ? (
            <RegisterForm />
          ) : (
            <p className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 px-3 py-3 text-center text-xs leading-6 text-signal-amber">
              التسجيل مغلق حاليًا. يمكنك تصفح الموقع بالكامل دون حساب، والعودة لاحقًا عند فتح التسجيل.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
