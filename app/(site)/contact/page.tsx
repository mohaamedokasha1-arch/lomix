import type { Metadata } from "next";
import { Mail, MessageSquare, ShieldAlert, Timer } from "lucide-react";
import { PageHeader } from "@/components/titles/catalog-view";
import { ContactForm } from "@/components/site/contact-form";
import { getAllSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "التواصل والدعم",
  description:
    "تواصل مع فريق لوميكس فيلم للاستفسارات والاقتراحات، أو للإبلاغ عن تريلر معطّل أو خطأ في البيانات، أو لطلبات حقوق الملكية — وقت الرد من يوم إلى ثلاثة أيام عمل.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getAllSettings();

  return (
    <div className="container-page pb-16 pt-28 md:pt-32">
      <PageHeader
        kicker="الدعم"
        title="التواصل والدعم"
        description="سؤال عن عمل معيّن؟ ملاحظة على تجربة الموقع؟ اقتراح لقسم جديد؟ اكتب لنا وسيصلنا."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-white/8 bg-ink-900/50 p-5 md:p-6">
          <ContactForm />
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold text-ink-200">
              <Mail className="h-3.5 w-3.5 text-ember-300" /> البريد المباشر
            </p>
            <a href={`mailto:${settings.contact_email}`} dir="ltr" className="mt-2 block text-xs text-ember-200 hover:underline">
              {settings.contact_email}
            </a>
          </div>
          <div className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold text-ink-200">
              <Timer className="h-3.5 w-3.5 text-ember-300" /> وقت الرد المتوقع
            </p>
            <p className="mt-2 text-[0.72rem] leading-6 text-ink-400">من يوم إلى ثلاثة أيام عمل. الطلبات القانونية لها مسار منفصل وأولوية.</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold text-ink-200">
              <MessageSquare className="h-3.5 w-3.5 text-ember-300" /> قبل أن تكتب
            </p>
            <p className="mt-2 text-[0.72rem] leading-6 text-ink-400">
              لوميكس فيلم دليل اكتشاف ولا يوفّر مشاهدة الأعمال كاملة. بلاغات التريلرات المعطّلة مرحّب بها وتُعالج أولًا.
            </p>
          </div>
          <div className="rounded-xl border border-signal-amber/25 bg-signal-amber/[0.06] p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold text-signal-amber">
              <ShieldAlert className="h-3.5 w-3.5" /> طلبات حقوق الملكية
            </p>
            <p className="mt-2 text-[0.72rem] leading-6 text-ink-300">
              استخدم صفحة الإبلاغ المخصصة لضمان وصول الطلب للمسار الصحيح.
            </p>
            <a href="/dmca" className="mt-2 inline-block text-[0.7rem] text-signal-amber underline underline-offset-4">
              صفحة حقوق الملكية (DMCA)
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
