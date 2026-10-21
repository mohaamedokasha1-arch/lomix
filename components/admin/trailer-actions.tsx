"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { checkTrailerHealthAction, deleteTrailerAction, markTrailerBrokenAction, setPrimaryTrailerAction, type AdminState } from "@/app/actions/admin";
import { RowActionForm, RowSubmit } from "./row-action-form";

export function TrailerPrimaryButton({ id, titleId, isPrimary }: { id: string; titleId: string; isPrimary: boolean }) {
  if (isPrimary) return <span className="text-[0.6rem] text-brass-300">أساسي</span>;
  return (
    <RowActionForm action={setPrimaryTrailerAction} fields={{ id, titleId }}>
      <RowSubmit variant="link" label="اجعله أساسيًا" />
    </RowActionForm>
  );
}

export function TrailerDeleteButton({ id, nameAr }: { id: string; nameAr: string }) {
  return (
    <RowActionForm action={deleteTrailerAction} fields={{ id }} confirm={`حذف «${nameAr}»؟`}>
      <RowSubmit variant="icon" ariaLabel={`حذف ${nameAr}`} />
    </RowActionForm>
  );
}

/**
 * فحص صحة الرابط ووسمه.
 * - «فحص الرابط» يستخدم useActionState ليعرض النتيجة، ويعمل بلا JS أيضًا (تحديث الصفحة).
 * - «وسم كمعطل/سليم» نموذج خادم عادي بلا حاجة إلى JS.
 */
export function TrailerHealthControls({ id, health }: { id: string; health: string }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(checkTrailerHealthAction, null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-white/12 px-2 text-[0.6rem] text-ink-200 hover:border-brass-400/40 hover:text-brass-200 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          فحص الرابط
        </button>
      </form>
      <RowActionForm action={markTrailerBrokenAction} fields={{ id, health: health === "BROKEN" ? "OK" : "BROKEN" }}>
        <RowSubmit variant="chip" label={health === "BROKEN" ? "وسم كسليم" : "وسم كمعطل"} />
      </RowActionForm>
      {state?.error && <span className="text-[0.6rem] text-signal-amber">{state.error}</span>}
      {state?.ok && <span className="text-[0.6rem] text-signal-teal">{state.message}</span>}
    </div>
  );
}
