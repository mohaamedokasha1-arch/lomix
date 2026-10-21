"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Info, Pause, Play, Star } from "lucide-react";
import { TrailerDialog, type TrailerLike } from "@/components/titles/trailer-dialog";
import { STATUS_LABEL, TITLE_TYPE_LABEL, cn, runtimeLabel } from "@/lib/utils";
import type { TitleCard } from "@/lib/queries";

const TYPE_ROUTE: Record<string, string> = { MOVIE: "/movie", SERIES: "/series", ANIME: "/anime" };
const DURATION = 9000;

export function Hero({
  items,
  trailers,
}: {
  items: TitleCard[];
  trailers: Record<string, TrailerLike | null>;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    if (paused || items.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % items.length), DURATION);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, items.length, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowLeft") go(1);
      if (event.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!items.length) return null;
  const current = items[index]!;
  const currentTrailer = trailers[current.slug] ?? null;
  const href = `${TYPE_ROUTE[current.type]}/${current.slug}`;
  const runtime = runtimeLabel(current.runtimeMinutes);

  return (
    <section
      aria-label="أعمال مختارة"
      aria-roledescription="عرض دوّار"
      className="relative -mt-[4.5rem] h-[64svh] min-h-[440px] max-h-[640px] w-full overflow-hidden md:-mt-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1100ms] ease-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          {item.backdropPath ? (
            <Image
              src={item.backdropPath}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover object-center transition-transform ease-linear",
                i === index ? "scale-105 duration-[12000ms]" : "scale-100 duration-0",
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-ink-900" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/25" />
      <div className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/45 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/90 to-transparent" />

      <div className="container-page relative flex h-full flex-col justify-end pb-16 pt-28 md:pb-24">
        <div key={current.id} className="max-w-2xl rise">
          <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[0.7rem]">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-brass-400/35 bg-brass-400/10 px-2 py-1 font-semibold text-brass-200">
              <span className="h-1 w-1 rounded-full bg-brass-300" />
              مختارات لوميكس
            </span>
            <span className="rounded-md border border-white/12 bg-black/30 px-2 py-1 text-ink-200 backdrop-blur-sm">
              {TITLE_TYPE_LABEL[current.type]}
            </span>
            {current.releaseYear && <span className="num text-ink-300">{current.releaseYear}</span>}
            {runtime && <span className="num text-ink-300">{runtime}</span>}
            {current.ratingValue != null && (
              <span className="inline-flex items-center gap-1 text-brass-200">
                <Star className="h-3 w-3 fill-brass-300 text-brass-300" aria-hidden="true" />
                <span className="num font-semibold">{current.ratingValue.toFixed(1)}</span>
              </span>
            )}
            {current.status === "UPCOMING" && (
              <span className="rounded-md border border-signal-amber/35 bg-signal-amber/10 px-2 py-1 text-signal-amber">
                {STATUS_LABEL[current.status]}
              </span>
            )}
          </div>

          <h1 className="display text-balance text-4xl font-bold leading-[1.15] text-ink-50 sm:text-5xl md:text-6xl">
            {current.titleAr}
          </h1>
          {current.titleEn && (
            <p className="mt-3 font-[family-name:var(--font-latin)] text-sm tracking-wide text-ink-300" dir="ltr">
              {current.titleEn}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-1.5">
            {current.genres.slice(0, 3).map((genre) => (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className="rounded-full border border-white/12 px-2.5 py-1 text-[0.7rem] text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
              >
                {genre.nameAr}
              </Link>
            ))}
          </div>

          <p className="mt-5 max-w-xl text-sm leading-7 text-ink-200/90 md:text-[0.95rem]">
            {current.status === "UPCOMING"
              ? "عمل قادم — تابع صفحته لمشاهدة التريلر الرسمي عند صدوره."
              : "اكتشف القصة، الطاقم، والتريلر الرسمي — كل ما تحتاجه لتعرف إن كان هذا العمل لك."}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {currentTrailer ? (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-brass-400 px-6 text-sm font-bold text-[#171006] shadow-[0_16px_40px_-18px_rgba(227,178,105,0.8)] transition hover:bg-brass-300"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                مشاهدة التريلر
              </button>
            ) : null}
            <Link
              href={href}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/[0.06] px-6 text-sm font-semibold text-ink-50 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              التفاصيل
            </Link>
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              className="hidden h-12 w-12 items-center justify-center rounded-xl border border-white/12 text-ink-300 transition hover:text-ink-50 sm:flex"
              aria-label={paused ? "استئناف العرض التلقائي" : "إيقاف العرض التلقائي"}
              aria-pressed={paused}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* أدوات التنقل */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="اختيار العمل المميز">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={item.titleAr}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-1 overflow-hidden rounded-full transition-all",
                  i === index ? "w-12 bg-white/20" : "w-6 bg-white/15 hover:bg-white/30",
                )}
              >
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 start-0 rounded-full bg-brass-300"
                    style={{
                      animation: paused ? "none" : `heroProgress ${DURATION}ms linear forwards`,
                      width: paused ? "50%" : undefined,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="num me-2 text-xs text-ink-400">
              {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-ink-200 transition hover:border-white/30 hover:text-ink-50"
              aria-label="العمل السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-ink-200 transition hover:border-white/30 hover:text-ink-50"
              aria-label="العمل التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes heroProgress { from { width: 0% } to { width: 100% } }`}</style>

      <TrailerDialog
        open={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailer={currentTrailer}
        titleAr={current.titleAr}
        backdropPath={current.backdropPath}
        detailsHref={href}
      />
    </section>
  );
}
