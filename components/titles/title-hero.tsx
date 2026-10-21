import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { TitleActions } from "@/components/titles/title-actions";
import {
  STATUS_LABEL,
  TITLE_TYPE_LABEL,
  formatDate,
  runtimeLabel,
} from "@/lib/utils";
import type { TitleDetail } from "@/lib/queries";

const TYPE_LABEL: Record<string, string> = { MOVIE: "فيلم", SERIES: "مسلسل", ANIME: "أنمي" };

export function TitleHero({
  title,
  trailer,
  saved,
  isAuthenticated,
}: {
  title: TitleDetail;
  trailer: { id: string; youtubeId: string; nameAr: string; kind: string; health: string } | null;
  saved: boolean;
  isAuthenticated: boolean;
}) {
  const typeLabel = TYPE_LABEL[title.type] ?? "عمل";
  const runtime = runtimeLabel(title.runtimeMinutes);
  const director = title.crew.find((c) => c.role === "DIRECTOR");

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {title.backdropPath ? (
          <Image src={title.backdropPath} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        ) : (
          <div className="h-full w-full bg-ink-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-l from-ink-950/95 via-ink-950/40 to-transparent" />
      </div>

      <div className="container-page relative pb-10 pt-28 md:pb-14 md:pt-36">
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-1.5 text-[0.7rem] text-ink-400">
          <Link href="/" className="transition hover:text-ink-100">الرئيسية</Link>
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          <Link
            href={title.type === "MOVIE" ? "/movies" : title.type === "ANIME" ? "/anime" : "/series"}
            className="transition hover:text-ink-100"
          >
            {typeLabel}
          </Link>
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          <span className="truncate text-ink-300">{title.titleAr}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-end lg:grid-cols-[260px_1fr] lg:gap-12">
          <div className="hidden md:block">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {title.posterPath ? (
                <Image src={title.posterPath} alt={`بوستر ${title.titleAr}`} fill sizes="260px" className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center bg-ink-800 text-xs text-ink-500">بلا بوستر</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[0.7rem]">
              <span className="rounded-md border border-brass-400/35 bg-brass-400/12 px-2 py-1 font-semibold text-brass-200">
                {typeLabel}
              </span>
              {title.status !== "RELEASED" && (
                <span className="rounded-md border border-white/15 bg-black/25 px-2 py-1 text-ink-200">
                  {STATUS_LABEL[title.status]}
                </span>
              )}
              {title.releaseYear && (
                // السنة رابط فعلي: صفحة /year/[year] موجودة، ورابطها يجعلها قابلة للوصول
                <Link
                  href={`/year/${title.releaseYear}`}
                  className="num text-ink-300 underline-offset-4 transition hover:text-brass-200 hover:underline"
                >
                  {title.releaseYear}
                </Link>
              )}
              {runtime && (
                <span className="inline-flex items-center gap-1 text-ink-300">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span className="num">{runtime}</span>
                </span>
              )}
              {title.countryNameAr && (
                <Link href={`/country/${title.countryCode}`} className="text-ink-300 underline-offset-4 transition hover:text-brass-200 hover:underline">
                  {title.countryNameAr}
                </Link>
              )}
            </div>

            <h1 className="display text-balance text-3xl font-bold leading-[1.15] text-ink-50 sm:text-4xl md:text-5xl lg:text-6xl">
              {title.titleAr}
            </h1>
            {title.titleEn && (
              <p className="mt-2 font-[family-name:var(--font-latin)] text-sm tracking-wide text-ink-300" dir="ltr">
                {title.titleEn}
              </p>
            )}

            {title.taglineAr && (
              <p className="mt-4 border-s-2 border-brass-400/60 ps-3 text-sm italic leading-7 text-ink-200">
                {title.taglineAr}
              </p>
            )}

            <p className="mt-4 max-w-2xl text-sm leading-8 text-ink-200/90 md:text-[0.95rem]">{title.overviewAr}</p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {title.genres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[0.7rem] text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
                >
                  {genre.nameAr}
                </Link>
              ))}
            </div>

            <div className="mt-7">
              <TitleActions
                titleId={title.id}
                slug={title.slug}
                titleAr={title.titleAr}
                backdropPath={title.backdropPath}
                trailer={trailer}
                saved={saved}
                isAuthenticated={isAuthenticated}
                ratingValue={title.ratingValue}
                ratingSource={title.ratingSource}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.72rem] text-ink-400">
              {director && (
                <span>
                  إخراج{" "}
                  <Link href={`/person/${director.slug}`} className="font-medium text-ink-100 transition hover:text-brass-200">
                    {director.nameAr}
                  </Link>
                </span>
              )}
              {title.releaseDate && <span>تاريخ الإصدار: {formatDate(title.releaseDate)}</span>}
              {title.language && <span>اللغة: {title.language}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TypeLabel({ type }: { type: string }) {
  return <>{TITLE_TYPE_LABEL[type] ?? type}</>;
}
