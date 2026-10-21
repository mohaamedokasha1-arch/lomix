"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormBanner, Select, SubmitButton, TextInput } from "@/components/admin/form";
import { saveTrailerAction, type AdminState } from "@/app/actions/admin";

type TitleOption = { id: string; titleAr: string; type: string };

export type TrailerValues = {
  id?: string;
  titleId: string;
  youtubeId: string;
  nameAr: string;
  kind: string;
  language: string;
  isPrimary: boolean;
};

export function TrailerForm({ values, titles }: { values?: TrailerValues; titles: TitleOption[] }) {
  const [state, formAction] = useActionState<AdminState, FormData>(saveTrailerAction, null);
  const [youtubeId, setYoutubeId] = useState(values?.youtubeId ?? "");

  const isDemo = youtubeId.startsWith("demo-");

  return (
    <form action={formAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <FormBanner state={state} />
      <Field label="العمل" required error={state?.fieldErrors?.titleId}>
        <Select name="titleId" defaultValue={values?.titleId ?? ""} required>
          <option value="">— اختر عملًا —</option>
          {titles.map((title) => (
            <option key={title.id} value={title.id}>
              {title.titleAr}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="رابط يوتيوب أو المعرّف"
        required
        error={state?.fieldErrors?.youtubeId}
        hint="اقبل فقط فيديو رسمي من القناة الرسمية للموزّع أو الاستوديو"
      >
        <TextInput
          name="youtubeId"
          value={youtubeId}
          onChange={(event) => setYoutubeId(event.target.value)}
          dir="ltr"
          required
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </Field>
      {isDemo && (
        <p className="rounded-md border border-signal-amber/25 bg-signal-amber/[0.06] p-2 text-[0.62rem] leading-4 text-signal-amber">
          هذا معرّف معاينة تجريبية (demo-…). لا يُشغّل فيديو خارجيًا — يُعرض إشعار فقط. لا يُستخدم لمحتوى حقيقي.
        </p>
      )}
      <Field label="اسم التريلر" required error={state?.fieldErrors?.nameAr}>
        <TextInput name="nameAr" defaultValue={values?.nameAr} required maxLength={160} placeholder="الإعلان الرسمي" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="النوع" required>
          <Select name="kind" defaultValue={values?.kind ?? "OFFICIAL"}>
            <option value="OFFICIAL">تريلر رسمي</option>
            <option value="TEASER">تشويق</option>
            <option value="PROMO">مقطع ترويجي</option>
          </Select>
        </Field>
        <Field label="لغة التريلر" required>
          <Select name="language" defaultValue={values?.language ?? "ar"}>
            <option value="ar">عربي</option>
            <option value="ar-sub">عربي (مترجم)</option>
            <option value="en">إنجليزي</option>
            <option value="ja">ياباني</option>
            <option value="other">أخرى</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[0.72rem] text-ink-200">
        <input type="checkbox" name="isPrimary" defaultChecked={values?.isPrimary} className="h-3.5 w-3.5 accent-brass-400" />
        اجعله التريلر الأساسي لهذا العمل
      </label>
      <SubmitButton>{values?.id ? "حفظ التريلر" : "إضافة التريلر"}</SubmitButton>
      <p className="text-[0.6rem] text-ink-500">
        التريلرات لا تُستضاف عندنا — تُضمَّن من يوتيوب الرسمي فقط.{" "}
        <Link href="/dmca" className="underline hover:text-brass-200" target="_blank">
          سياسة الحقوق
        </Link>
      </p>
    </form>
  );
}
