"use client";

import { useActionState } from "react";
import { Field, FormBanner, Select, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { saveEpisodeAction, type AdminState } from "@/app/actions/admin";

export type EpisodeValues = {
  id?: string;
  seasonId: string;
  titleId: string;
  number: number | string;
  nameAr: string;
  overviewAr: string | null;
  airDate: string | null;
  runtime: number | null;
  state: string;
};

export function EpisodeForm({ values }: { values?: EpisodeValues }) {
  const [state, formAction] = useActionState<AdminState, FormData>(saveEpisodeAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="seasonId" value={values?.seasonId ?? ""} />
      <input type="hidden" name="titleId" value={values?.titleId ?? ""} />
      <FormBanner state={state} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="رقم الحلقة" required error={state?.fieldErrors?.number}>
          <TextInput name="number" type="number" min={0} max={2000} defaultValue={values?.number ?? 1} required />
        </Field>
        <div className="sm:col-span-2">
          <Field label="اسم الحلقة" required error={state?.fieldErrors?.nameAr}>
            <TextInput name="nameAr" defaultValue={values?.nameAr} required maxLength={200} />
          </Field>
        </div>
        <Field label="المدة (دقيقة)" optional>
          <TextInput name="runtime" type="number" min={1} max={600} defaultValue={values?.runtime ?? ""} />
        </Field>
        <Field label="تاريخ العرض" optional>
          <TextInput name="airDate" type="date" defaultValue={values?.airDate ?? ""} />
        </Field>
        <Field label="حالة النشر" required>
          <Select name="state" defaultValue={values?.state ?? "DRAFT"}>
            <option value="DRAFT">مسودة (مخفية)</option>
            <option value="PUBLISHED">منشورة</option>
          </Select>
        </Field>
      </div>
      <Field label="وصف الحلقة" optional>
        <TextArea name="overviewAr" defaultValue={values?.overviewAr ?? ""} rows={2} />
      </Field>
      <SubmitButton>{values?.id ? "حفظ الحلقة" : "إضافة الحلقة"}</SubmitButton>
    </form>
  );
}
