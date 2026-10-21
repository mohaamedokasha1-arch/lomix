"use client";

import { useTransition } from "react";
import { setMessageStatusAction } from "@/app/actions/admin-system";

const OPTIONS = [
  { value: "NEW", label: "جديد" },
  { value: "IN_PROGRESS", label: "قيد المعالجة" },
  { value: "RESOLVED", label: "مغلق" },
];

export function MessageActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {OPTIONS.filter((option) => option.value !== status).map((option) => (
        <form
          key={option.value}
          action={(formData) => {
            startTransition(() => {
              void setMessageStatusAction(formData);
            });
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={option.value} />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-white/12 px-2 py-1 text-[0.6rem] text-ink-300 transition hover:border-white/30 disabled:opacity-50"
          >
            {option.label}
          </button>
        </form>
      ))}
      {pending && <span className="text-[0.58rem] text-ink-500">جارٍ التحديث…</span>}
    </div>
  );
}
