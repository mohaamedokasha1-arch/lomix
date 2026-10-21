"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteTrailerAction, markTrailerBrokenAction, setPrimaryTrailerAction, checkTrailerHealthAction, type AdminState } from "@/app/actions/admin";

export function TrailerPrimaryButton({ id, titleId, isPrimary }: { id: string; titleId: string; isPrimary: boolean }) {
  const [pending, startTransition] = useTransition();
  if (isPrimary) return <span className="text-[0.6rem] text-brass-300">أساسي</span>;
  return (
    <form
      action={(formData) => {
        startTransition(() => {
          void setPrimaryTrailerAction(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="titleId" value={titleId} />
      <button type="submit" disabled={pending} className="text-[0.6rem] text-ink-400 underline hover:text-brass-200 disabled:opacity-50">
        اجعله أساسيًا
      </button>
    </form>
  );
}

export function TrailerDeleteButton({ id, nameAr }: { id: string; nameAr: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        if (!window.confirm(`حذف «${nameAr}»؟`)) return;
        startTransition(() => {
          void deleteTrailerAction(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`حذف ${nameAr}`}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </form>
  );
}

export function TrailerHealthControls({ id, health }: { id: string; health: string }) {
  const [state, setState] = useState<AdminState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={(formData) => {
          startTransition(() => {
            void checkTrailerHealthAction(formData).then(setState);
          });
        }}
      >
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
      <form
        action={(formData) => {
          startTransition(() => {
            void markTrailerBrokenAction(formData);
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="health" value={health === "BROKEN" ? "OK" : "BROKEN"} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-7 items-center rounded-md border border-white/12 px-2 text-[0.6rem] text-ink-300 hover:border-white/30 disabled:opacity-50"
        >
          {health === "BROKEN" ? "وسم كسليم" : "وسم كمعطل"}
        </button>
      </form>
      {state?.error && <span className="text-[0.6rem] text-signal-amber">{state.error}</span>}
      {state?.ok && <span className="text-[0.6rem] text-signal-teal">{state.message}</span>}
    </div>
  );
}
