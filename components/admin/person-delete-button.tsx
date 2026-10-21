"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePersonAction } from "@/app/actions/admin";

export function PersonDeleteButton({ id, nameAr, creditCount }: { id: string; nameAr: string; creditCount: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const message = creditCount
          ? `«${nameAr}» مرتبط بـ${creditCount} عملًا. سيُحذف من طاقم كل هذه الأعمال. المتابعة؟`
          : `حذف «${nameAr}»؟`;
        if (!window.confirm(message)) return;
        startTransition(() => {
          void deletePersonAction(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`حذف ${nameAr}`}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </form>
  );
}
