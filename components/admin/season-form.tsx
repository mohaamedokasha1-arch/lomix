"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { saveSeasonAction, type AdminState } from "@/app/actions/admin";

export type SeasonValues = {
  id?: string;
  titleId: string;
  number: number | string;
  nameAr: string | null;
  year: number | null;
  overviewAr: string | null;
};

export function SeasonForm({ values }: { values?: SeasonValues }) {
  const [state, formAction] = useActionState<AdminState, FormData>(saveSeasonAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="titleId" value={values?.titleId ?? ""} />
      <FormBanner state={state} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="رقم الموسم" required error={state?.fieldErrors?.number} hint="0 للمواسم الخاصة">
          <TextInput name="number" type="number" min={0} max={100} defaultValue={values?.number ?? 1} required />
        </Field>
        <Field label="الاسم" optional>
          <TextInput name="nameAr" defaultValue={values?.nameAr ?? ""} placeholder="الموسم الأول" />
        </Field>
        <Field label="السنة" optional>
          <TextInput name="year" type="number" min={1900} max={2100} defaultValue={values?.year ?? ""} />
        </Field>
      </div>
      <Field label="وصف الموسم" optional>
        <TextArea name="overviewAr" defaultValue={values?.overviewAr ?? ""} rows={2} />
      </Field>
      <SubmitButton>{values?.id ? "حفظ الموسم" : "إضافة موسم"}</SubmitButton>
    </form>
  );
}
