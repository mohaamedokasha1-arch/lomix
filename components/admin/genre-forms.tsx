"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, FormBanner, SubmitButton, TextInput } from "@/components/admin/form";
import { deleteGenreAction, saveGenreAction, type AdminState } from "@/app/actions/admin";

export type GenreValues = { id?: string; nameAr: string; nameEn: string; sort: number | string };

export function GenreForm({ values }: { values?: GenreValues }) {
  const [state, formAction] = useActionState<AdminState, FormData>(saveGenreAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <FormBanner state={state} />
      <Field label="الاسم العربي" required error={state?.fieldErrors?.nameAr}>
        <TextInput name="nameAr" defaultValue={values?.nameAr} required maxLength={60} />
      </Field>
      <Field label="الاسم الإنجليزي" required error={state?.fieldErrors?.nameEn} hint="يُستخدم لإنشاء الرابط — لا تغيّره بعد النشر">
        <TextInput name="nameEn" defaultValue={values?.nameEn} dir="ltr" required maxLength={60} />
      </Field>
      <Field label="الترتيب" hint="أصغر = أسبق">
        <TextInput name="sort" type="number" min={0} max={999} defaultValue={values?.sort ?? 100} />
      </Field>
      <SubmitButton>{values?.id ? "حفظ التصنيف" : "إضافة تصنيف"}</SubmitButton>
    </form>
  );
}

export function GenreDeleteForm({
  id,
  nameAr,
  count,
  options,
}: {
  id: string;
  nameAr: string;
  count: number;
  options: { id: string; nameAr: string }[];
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(deleteGenreAction, null);
  const [reassign, setReassign] = useState("");

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const message = count
          ? `حذف «${nameAr}» ونقل ${count} عملًا إلى التصنيف المحدد؟`
          : `حذف «${nameAr}»؟`;
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      {state?.error && <p className="rounded-md bg-signal-red/10 p-2 text-[0.62rem] leading-4 text-signal-red">{state.error}</p>}
      {count > 0 && (
        <>
          <label htmlFor={`reassign-${id}`} className="block text-[0.62rem] text-ink-400">
            هذا التصنيف مرتبط بـ{count} عملًا. اختر تصنيفًا بديلًا قبل الحذف:
          </label>
          <select
            id={`reassign-${id}`}
            name="reassignTo"
            value={reassign}
            onChange={(event) => setReassign(event.target.value)}
            className="field h-7 w-full text-[0.65rem]"
            required
          >
            <option value="">— اختر تصنيفًا —</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nameAr}
              </option>
            ))}
          </select>
        </>
      )}
      <button
        type="submit"
        className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-md border border-signal-red/25 text-[0.62rem] text-signal-red hover:bg-signal-red/10"
      >
        <Trash2 className="h-3 w-3" /> حذف التصنيف
      </button>
    </form>
  );
}
