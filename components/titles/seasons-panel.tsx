"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, Clock, Film } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { TitleDetail } from "@/lib/queries";

type Season = TitleDetail["seasons"][number];

export function SeasonsPanel({ slug, seasons }: { slug: string; seasons: Season[] }) {
  const [active, setActive] = useState(0);

  if (!seasons.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-ink-900/40 px-5 py-8 text-center text-sm text-ink-300">
        لم تتم إضافة مواسم لهذا العمل بعد.
      </div>
    );
  }

  const current = seasons[Math.min(active, seasons.length - 1)]!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="المواسم"
        className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto border-b border-white/8 pb-px"
      >
        {seasons.map((season, index) => (
          <button
            key={season.id}
            role="tab"
            aria-selected={index === active}
            aria-controls="season-panel"
            id={`season-tab-${season.id}`}
            onClick={() => setActive(index)}
            className={cn(
              "relative shrink-0 rounded-t-lg px-4 py-2.5 text-sm transition",
              index === active
                ? "bg-white/[0.04] font-semibold text-ink-50"
                : "text-ink-300 hover:bg-white/[0.02] hover:text-ink-100",
            )}
          >
            {season.nameAr ?? `الموسم ${season.number}`}
            {season.year && <span className="num ms-1.5 text-[0.65rem] text-ink-500">{season.year}</span>}
            {index === active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brass-400" />}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="season-panel"
        aria-labelledby={`season-tab-${current.id}`}
        className="grid gap-6 lg:grid-cols-[1fr_260px]"
      >
        <div>
          {current.overviewAr && <p className="mb-4 text-sm leading-7 text-ink-300">{current.overviewAr}</p>}

          <ol className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-ink-900/40">
            {current.episodes.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-ink-400">لم تتم إضافة حلقات لهذا الموسم بعد.</li>
            )}
            {current.episodes.map((episode) => (
              <li key={episode.id}>
                <Link
                  href={`/series/${slug}/season/${current.number}/episode/${episode.number}`}
                  className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.035]"
                >
                  <span className="num mt-0.5 flex h-7 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-[0.7rem] text-ink-300 group-hover:border-brass-400/35 group-hover:text-brass-200">
                    {episode.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-100 group-hover:text-brass-200">
                      {episode.nameAr}
                    </span>
                    {episode.overviewAr && (
                      <span className="mt-1 line-clamp-2 block text-[0.72rem] leading-6 text-ink-400">{episode.overviewAr}</span>
                    )}
                    <span className="mt-1.5 flex items-center gap-3 text-[0.65rem] text-ink-500">
                      {episode.airDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(episode.airDate)}
                        </span>
                      )}
                      {episode.runtime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {episode.runtime} د
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronLeft className="mt-1.5 h-3.5 w-3.5 shrink-0 text-ink-500 transition group-hover:text-brass-200" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-wide text-ink-300">
              <Film className="h-3.5 w-3.5" /> عن الموسم
            </p>
            <dl className="mt-3 space-y-2 text-[0.72rem]">
              <div className="flex justify-between">
                <dt className="text-ink-500">رقم الموسم</dt>
                <dd className="num text-ink-200">{current.number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">عدد الحلقات</dt>
                <dd className="num text-ink-200">{current.episodes.length}</dd>
              </div>
              {current.year && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">سنة العرض</dt>
                  <dd className="num text-ink-200">{current.year}</dd>
                </div>
              )}
            </dl>
            <Link
              href={`/series/${slug}/season/${current.number}`}
              className="mt-4 flex h-9 items-center justify-center rounded-lg border border-white/12 text-xs text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
            >
              صفحة الموسم الكاملة
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
