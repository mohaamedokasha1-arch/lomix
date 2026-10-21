"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toggleWatchlistAction } from "@/app/actions/watchlist";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  titleId,
  slug,
  initialSaved,
  isAuthenticated,
  variant = "button",
}: {
  titleId: string;
  slug: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  variant?: "button" | "icon";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/watchlist`)}`);
      return;
    }
    startTransition(async () => {
      const result = await toggleWatchlistAction(titleId, slug);
      if (result.requiresAuth) {
        router.push("/login?next=%2Fwatchlist");
        return;
      }
      if (result.ok) {
        setSaved(Boolean(result.saved));
        setMessage(result.message);
        setTimeout(() => setMessage(null), 2600);
      }
    });
  };

  const Icon = saved ? BookmarkCheck : Bookmark;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? "إزالة من قائمة المشاهدة" : "إضافة إلى قائمة المشاهدة"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border transition",
          saved
            ? "border-brass-400/40 bg-brass-400/12 text-brass-200"
            : "border-white/15 bg-white/[0.04] text-ink-200 hover:text-ink-50",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-[18px] w-[18px]" />}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-busy={pending}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
          saved
            ? "border-brass-400/45 bg-brass-400/12 text-brass-200"
            : "border-white/20 bg-white/[0.04] text-ink-50 hover:border-white/35 hover:bg-white/[0.08]",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        {saved ? "في قائمتك" : "أضف للقائمة"}
      </button>
      {message && (
        <span
          role="status"
          className="absolute start-0 top-full z-20 mt-2 w-max max-w-56 rounded-lg border border-white/10 bg-ink-850 px-2.5 py-1.5 text-[0.7rem] text-ink-100 shadow-xl"
        >
          {message}
        </span>
      )}
    </div>
  );
}
