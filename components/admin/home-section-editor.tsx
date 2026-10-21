"use client";

import { useActionState } from "react";
import { FormBanner, SubmitButton, TextInput } from "@/components/admin/form";
import { saveHomeSectionAction, type SysState } from "@/app/actions/admin-system";

export function HomeSectionEditor({
  id,
  titleAr,
  subtitleAr,
  visible,
}: {
  id: string;
  titleAr: string;
  subtitleAr: string | null;
  visible: boolean;
}) {
  const [state, formAction] = useActionState<SysState, FormData>(saveHomeSectionAction, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <FormBanner state={state} />
      <TextInput name="titleAr" defaultValue={titleAr} required aria-label="عنوان القسم" className="h-8 text-[0.72rem]" />
      <TextInput name="subtitleAr" defaultValue={subtitleAr ?? ""} aria-label="وصف القسم" className="h-8 text-[0.72rem]" placeholder="وصف مختصر (اختياري)" />
      <label className="flex items-center gap-2 text-[0.65rem] text-ink-300">
        <input type="checkbox" name="visible" defaultChecked={visible} className="h-3.5 w-3.5 accent-ember-400" />
        ظاهر على الصفحة
      </label>
      <SubmitButton className="h-8 px-3 text-[0.68rem]">حفظ القسم</SubmitButton>
    </form>
  );
}
