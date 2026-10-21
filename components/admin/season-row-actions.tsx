"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSeasonAction } from "@/app/actions/admin";

export function SeasonRowActions({ id, titleId, label, episodeCount }: { id: string; titleId: string; label: string; episodeCount: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const message = episodeCount
          ? `حذف «${label}» و${episodeCount} حلقة مرتبطة به؟ لا يمكن التراجع.`
          : `حذف «${label}»؟`;
        if (!window.confirm(message)) return;
        startTransition(() => {
          void deleteSeasonAction(formData);
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
