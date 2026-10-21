"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaField } from "@/components/admin/media-field";
import { savePersonAction, type AdminState } from "@/app/actions/admin";

export type PersonValues = {
  id?: string;
  nameAr: string;
  nameEn: string | null;
  imagePath: string | null;
  bioAr: string | null;
  birthYear: number | null;
};

export function PersonForm({ values }: { values?: PersonValues }) {
  const [state, formAction] = useActionState<AdminState, FormData>(savePersonAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <FormBanner state={state} />
      <Field label="الاسم العربي" required error={state?.fieldErrors?.nameAr}>
        <TextInput name="nameAr" defaultValue={values?.nameAr} required maxLength={120} />
      </Field>
      <Field label="الاسم الأصلي" optional>
        <TextInput name="nameEn" defaultValue={values?.nameEn ?? ""} dir="ltr" maxLength={120} />
      </Field>
      <Field label="سنة الميلاد" optional hint="اتركها فارغة إن لم تكن موثقة">
        <TextInput name="birthYear" type="number" min={1850} max={2020} defaultValue={values?.birthYear ?? ""} />
      </Field>
      <MediaField label="الصورة" name="imagePath" defaultValue={values?.imagePath} aspect="poster" optional />
      <Field label="نبذة" optional>
        <TextArea name="bioAr" defaultValue={values?.bioAr ?? ""} rows={3} maxLength={2000} />
      </Field>
      <SubmitButton>{values?.id ? "حفظ الشخص" : "إضافة شخص"}</SubmitButton>
    </form>
  );
}
