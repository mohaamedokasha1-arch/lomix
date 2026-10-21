"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { removeFromWatchlistAction } from "@/app/actions/watchlist";

export function WatchlistRemove({ titleId }: { titleId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeFromWatchlistAction(titleId);
          router.refresh();
        })
      }
      aria-label="إزالة من القائمة"
      className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-ink-950/80 text-ink-200 backdrop-blur transition hover:border-signal-red/40 hover:text-signal-red"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
    </button>
  );
}
