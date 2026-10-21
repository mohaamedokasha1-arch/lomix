"use client";

import { useState } from "react";
import { Check, Play, Share2, Star } from "lucide-react";
import { TrailerDialog, type TrailerLike } from "@/components/titles/trailer-dialog";
import { WatchlistButton } from "@/components/titles/watchlist-button";

export function TitleActions({
  titleId,
  slug,
  titleAr,
  backdropPath,
  trailer,
  saved,
  isAuthenticated,
  ratingValue,
  ratingSource,
}: {
  titleId: string;
  slug: string;
  titleAr: string;
  backdropPath: string | null;
  trailer: TrailerLike | null;
  saved: boolean;
  isAuthenticated: boolean;
  ratingValue: number | null;
  ratingSource: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: titleAr, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // المستخدم أغلق نافذة المشاركة — لا شيء يستدعي رسالة خطأ.
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {trailer ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-brass-400 px-6 text-sm font-bold text-[#171006] shadow-[0_16px_40px_-18px_rgba(227,178,105,0.8)] transition hover:bg-brass-300"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            مشاهدة التريلر
            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[0.6rem] font-semibold">
              {trailer.kind === "OFFICIAL" ? "رسمي" : trailer.kind === "TEASER" ? "تشويقي" : "ترويجي"}
            </span>
          </button>
        ) : (
          <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm text-ink-400">
            <Play className="h-4 w-4" aria-hidden="true" />
            لا يوجد تريلر متاح
          </span>
        )}

        <WatchlistButton titleId={titleId} slug={slug} initialSaved={saved} isAuthenticated={isAuthenticated} />

        <button
          type="button"
          onClick={share}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm text-ink-200 transition hover:border-white/30 hover:text-ink-50"
        >
          {copied ? <Check className="h-4 w-4 text-signal-green" /> : <Share2 className="h-4 w-4" />}
          {copied ? "نُسخ الرابط" : "مشاركة"}
        </button>

        {ratingValue != null && (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-brass-400/25 bg-brass-400/8 px-3.5 text-sm">
            <Star className="h-4 w-4 fill-brass-300 text-brass-300" aria-hidden="true" />
            <span className="num font-bold text-brass-200">{ratingValue.toFixed(1)}</span>
            <span className="text-[0.65rem] text-ink-400">/ 10</span>
            {ratingSource && (
              <span className="hidden text-[0.65rem] text-ink-400 sm:inline">— {ratingSource}</span>
            )}
          </span>
        )}
      </div>

      <TrailerDialog
        open={open}
        onClose={() => setOpen(false)}
        trailer={trailer}
        titleAr={titleAr}
        backdropPath={backdropPath}
        detailsHref={`/movie/${slug}`}
      />
    </>
  );
}
