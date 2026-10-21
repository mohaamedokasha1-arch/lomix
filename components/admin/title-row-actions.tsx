"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteTitleAction, toggleTitleStateAction } from "@/app/actions/admin";

export function TitleRowActions({ id, state, titleAr }: { id: string; state: string; titleAr: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <form
        action={(formData) => {
          startTransition(() => {
            void toggleTitleStateAction(formData);
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-white/12 px-2 py-1 text-[0.62rem] text-ink-200 transition hover:border-white/30 disabled:opacity-50"
        >
          {state === "PUBLISHED" ? "إلغاء النشر" : "نشر"}
        </button>
      </form>
      <form
        action={(formData) => {
          if (!window.confirm(`حذف «${titleAr}»؟ سيُحذف معه المواسم والتريلرات والارتباطات نهائيًا.`)) return;
          startTransition(() => {
            void deleteTitleAction(formData);
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          aria-label={`حذف ${titleAr}`}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </form>
    </div>
  );
}
