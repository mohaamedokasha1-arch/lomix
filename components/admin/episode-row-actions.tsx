"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEpisodeAction } from "@/app/actions/admin";

export function EpisodeRowActions({ id, titleId, label }: { id: string; titleId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        if (!window.confirm(`حذف «${label}»؟`)) return;
        startTransition(() => {
          void deleteEpisodeAction(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="titleId" value={titleId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`حذف ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded text-ink-500 transition hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
