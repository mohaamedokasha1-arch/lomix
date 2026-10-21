"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { ToggleField } from "@/components/admin/toggle-field";
import { saveSiteSettingsAction, type SysState } from "@/app/actions/admin-system";

type Settings = Record<string, string>;

export function SiteSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState<SysState, FormData>(saveSiteSettingsAction, null);

  return (
    <form action={formAction} className="space-y-6">
      <FormBanner state={state} />

      <section className="space-y-3">
        <h2 className="text-[0.8rem] font-semibold text-ink-100">الهوية</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="اسم الموقع (EN)" required>
            <TextInput name="site_name" defaultValue={settings.site_name} required maxLength={60} dir="ltr" />
          </Field>
          <Field label="اسم الموقع (AR)" required>
            <TextInput name="site_name_ar" defaultValue={settings.site_name_ar} required maxLength={60} />
          </Field>
        </div>
        <Field label="الشعار النصي" optional>
          <TextInput name="tagline_ar" defaultValue={settings.tagline_ar} maxLength={120} />
        </Field>
        <Field label="الوصف التعريفي (meta description)" optional hint="يظهر في نتائج البحث والصفحات المشتركة">
          <TextArea name="meta_description" defaultValue={settings.meta_description} rows={2} maxLength={320} />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="text-[0.8rem] font-semibold text-ink-100">التواصل</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="بريد التواصل" required>
            <TextInput name="contact_email" type="email" defaultValue={settings.contact_email} required dir="ltr" />
          </Field>
          <Field label="بريد إشعارات الحقوق" required hint="يُعرض في صفحة DMCA">
            <TextInput name="trailers_mailto" type="email" defaultValue={settings.trailers_mailto} required dir="ltr" />
          </Field>
          <Field label="X / Twitter" optional>
            <TextInput name="twitter_url" defaultValue={settings.twitter_url} dir="ltr" placeholder="https://x.com/…" />
          </Field>
          <Field label="Instagram" optional>
            <TextInput name="instagram_url" defaultValue={settings.instagram_url} dir="ltr" placeholder="https://instagram.com/…" />
          </Field>
          <Field label="YouTube" optional>
            <TextInput name="youtube_url" defaultValue={settings.youtube_url} dir="ltr" placeholder="https://youtube.com/@…" />
          </Field>
          <Field label="Telegram" optional>
            <TextInput name="telegram_url" defaultValue={settings.telegram_url} dir="ltr" placeholder="https://t.me/…" />
          </Field>
        </div>
        <Field label="نص التذييل" optional>
          <TextArea name="footer_note" defaultValue={settings.footer_note} rows={2} maxLength={320} />
        </Field>
      </section>

      <section className="space-y-2">
        <h2 className="mb-1 text-[0.8rem] font-semibold text-ink-100">إظهار عناصر</h2>
        <ToggleField name="show_ratings" label="إظهار التقييمات" description="تُعرض فقط عند وجود مصدر مسجّل — لن تظهر أرقام بلا مصدر حتى مع التفعيل." defaultChecked={settings.show_ratings === "true"} />
        <ToggleField name="show_demo_notice" label="إظهار شريط «محتوى تجريبي»" description="يجب إبقاؤه مفعّلًا حتى استبدال البيانات التجريبية." defaultChecked={settings.show_demo_notice === "true"} />
        <ToggleField name="allow_registration" label="السماح بإنشاء حسابات" description="تعطيله يغلق صفحة التسجيل ويحفظ رسالة واضحة للزائر." defaultChecked={settings.allow_registration === "true"} />
      </section>

      <div className="flex items-center gap-3 border-t border-white/8 pt-4">
        <SubmitButton>حفظ الإعدادات</SubmitButton>
        <span className="text-[0.6rem] text-ink-500">كل حفظ يُسجَّل في سجل العمليات.</span>
      </div>
    </form>
  );
}
