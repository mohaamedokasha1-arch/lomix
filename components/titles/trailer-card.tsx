"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { TrailerDialog } from "@/components/titles/trailer-dialog";
import { TRAILER_KIND_LABEL, TITLE_TYPE_LABEL } from "@/lib/utils";
import type { TrailerCard as TrailerCardData } from "@/lib/queries";

export function TrailerCard({ trailer }: { trailer: TrailerCardData }) {
  const [open, setOpen] = useState(false);
  const detailsHref = `${
    trailer.titleType === "MOVIE" ? "/movie" : trailer.titleType === "ANIME" ? "/anime" : "/series"
  }/${trailer.titleSlug}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full text-right"
        aria-label={`تشغيل ${trailer.nameAr}`}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/8 bg-ink-800">
          {trailer.backdropPath && (
            <Image
              src={trailer.backdropPath}
              alt=""
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-ink-950/10" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/35 text-ink-50 backdrop-blur-md transition group-hover:scale-110 group-hover:border-ember-300/60 group-hover:text-ember-200">
              <Play className="ms-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
          <span className="absolute inset-x-3 top-3 flex items-center justify-between">
            <span className="glass-chip rounded px-1.5 py-0.5 text-[0.6rem] font-semibold text-ink-100">
              {TRAILER_KIND_LABEL[trailer.kind] ?? trailer.kind}
            </span>
            <span className="glass-chip rounded px-1.5 py-0.5 text-[0.6rem] text-ink-200">
              {TITLE_TYPE_LABEL[trailer.titleType]}
            </span>
          </span>
          <span className="absolute inset-x-3 bottom-3">
            <span className="block truncate text-sm font-semibold text-ink-50">{trailer.titleAr}</span>
            <span className="mt-0.5 block truncate text-[0.68rem] text-ink-300">{trailer.nameAr}</span>
          </span>
        </div>
      </button>

      <TrailerDialog
        open={open}
        onClose={() => setOpen(false)}
        trailer={trailer}
        titleAr={trailer.titleAr}
        backdropPath={trailer.backdropPath}
        detailsHref={detailsHref}
      />
    </>
  );
}
