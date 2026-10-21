"use client";

import { useActionState } from "react";
import { Field, FormBanner, SubmitButton, TextInput } from "@/components/admin/form";
import { bulkEpisodesAction, type AdminState } from "@/app/actions/admin";

export function EpisodeBulkForm({ seasonId, titleId, nextNumber }: { seasonId: string; titleId: string; nextNumber: number }) {
  const [state, formAction] = useActionState<AdminState, FormData>(bulkEpisodesAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="titleId" value={titleId} />
      <FormBanner state={state} />
      <div className="grid grid-cols-3 gap-2">
        <Field label="عدد الحلقات" required error={state?.fieldErrors?.count}>
          <TextInput name="count" type="number" min={1} max={60} defaultValue={12} required />
        </Field>
        <Field label="تبدأ من" required>
          <TextInput name="startNumber" type="number" min={0} defaultValue={nextNumber} required />
        </Field>
        <Field label="المدة" optional>
          <TextInput name="runtime" type="number" min={1} max={600} placeholder="45" />
        </Field>
      </div>
      <SubmitButton>إضافة دفعة كمسودات</SubmitButton>
      <p className="text-[0.6rem] leading-4 text-ink-500">
        تُضاف بأسماء مؤقتة («الحلقة N») وحالة مسودة حتى تعدّل أسماءها من القائمة ثم تنشرها.
      </p>
    </form>
  );
}
