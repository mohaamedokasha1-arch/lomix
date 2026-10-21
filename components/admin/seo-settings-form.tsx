"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextArea } from "@/components/admin/form";
import { ToggleField } from "@/components/admin/toggle-field";
import { saveSiteSettingsAction, type SysState } from "@/app/actions/admin-system";

export function SeoSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, formAction] = useActionState<SysState, FormData>(saveSiteSettingsAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner state={state} />
      <Field label="قالب عنوان الصفحة" hint="المتغيّرات المسموحة: {title} و{year} — مثال: {title} — لوميكس">
        <TextArea name="seo_default_title" defaultValue={settings.seo_default_title} rows={2} maxLength={200} />
      </Field>
      <Field label="قالب وصف الصفحة" hint="المتغيّرات: {title} و{year}">
        <TextArea name="seo_default_description" defaultValue={settings.seo_default_description} rows={3} maxLength={320} />
      </Field>

      <div className="space-y-2">
        <ToggleField name="seo_index_titles" label="فهرسة صفحات الأعمال" description="تعطيله يضيف noindex لصفحات الأفلام والمسلسلات." defaultChecked={settings.seo_index_titles === "true"} />
        <ToggleField name="seo_index_genres" label="فهرسة صفحات التصنيفات" defaultChecked={settings.seo_index_genres === "true"} />
        <ToggleField name="seo_index_people" label="فهرسة صفحات الأشخاص" defaultChecked={settings.seo_index_people === "true"} />
        <ToggleField name="seo_index_search" label="فهرسة نتائج البحث" description="مُعطّل افتراضيًا — صفحات البحث ليست محتوى أصليًا." defaultChecked={settings.seo_index_search === "true"} />
      </div>

      <SubmitButton>حفظ إعدادات SEO</SubmitButton>
    </form>
  );
}
