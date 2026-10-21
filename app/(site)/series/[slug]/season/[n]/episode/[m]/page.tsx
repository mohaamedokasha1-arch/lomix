import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from "lucide-react";
import { cachedEpisode } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { buildEpisodeDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string; n: string; m: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n, m } = await params;
  const data = await cachedEpisode(slug, Number(n), Number(m));
  if (!data) return { title: "الحلقة غير موجودة", robots: { index: false } };
  return {
    title: `${data.titleAr} — ${data.episode.nameAr}`,
    description: buildEpisodeDescription(data),
    alternates: { canonical: `/series/${slug}/season/${n}/episode/${m}` },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { slug, n, m } = await params;
  const seasonNumber = Number(n);
  const episodeNumber = Number(m);
  if (!Number.isInteger(seasonNumber) || !Number.isInteger(episodeNumber)) notFound();

  const data = await cachedEpisode(slug, seasonNumber, episodeNumber);
  if (!data) notFound();

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <nav aria-label="مسار التنقل" className="mb-6 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-ink-400">
        <Link href="/" className="hover:text-ink-100">الرئيسية</Link>
        <ChevronLeft className="h-3 w-3" />
        <Link href={`/series/${slug}`} className="hover:text-ink-100">{data.titleAr}</Link>
        <ChevronLeft className="h-3 w-3" />
        <Link href={`/series/${slug}/season/${seasonNumber}`} className="hover:text-ink-100">
          {data.season.nameAr ?? `الموسم ${seasonNumber}`}
        </Link>
        <ChevronLeft className="h-3 w-3" />
        <span className="truncate text-ink-300">الحلقة {episodeNumber}</span>
      </nav>

      <article className="mx-auto max-w-3xl">
        <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.28em] text-ember-300/80">
          الموسم {seasonNumber} · الحلقة {episodeNumber}
        </p>
        <h1 className="display text-3xl font-bold leading-snug text-ink-50 md:text-4xl">{data.episode.nameAr}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] text-ink-400">
          {data.episode.airDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(data.episode.airDate)}
            </span>
          )}
          {data.episode.runtime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> <span className="num">{data.episode.runtime} دقيقة</span>
            </span>
          )}
          {data.episode.state === "DRAFT" && (
            <span className="rounded border border-signal-amber/30 bg-signal-amber/10 px-2 py-0.5 text-signal-amber">مسودة</span>
          )}
        </div>

        {data.episode.overviewAr ? (
          <p className="mt-6 border-s-2 border-white/10 ps-4 text-sm leading-8 text-ink-200">{data.episode.overviewAr}</p>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-ink-400">
            لا يوجد وصف مسجّل لهذه الحلقة بعد. الحقول الغائبة تُخفى بدل عرض قيمة وهمية.
          </p>
        )}

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {data.previous ? (
            <Link
              href={`/series/${slug}/season/${seasonNumber}/episode/${data.previous.number}`}
              className="group rounded-xl border border-white/8 bg-ink-900/50 p-4 transition hover:border-ember-400/30"
            >
              <span className="flex items-center gap-1.5 text-[0.65rem] text-ink-500">
                <ChevronRight className="h-3 w-3" /> الحلقة السابقة
              </span>
              <span className="mt-1.5 block truncate text-sm text-ink-100 group-hover:text-ember-200">
                <span className="num me-1.5">{data.previous.number}.</span>
                {data.previous.nameAr}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {data.next ? (
            <Link
              href={`/series/${slug}/season/${seasonNumber}/episode/${data.next.number}`}
              className="group rounded-xl border border-white/8 bg-ink-900/50 p-4 text-end transition hover:border-ember-400/30"
            >
              <span className="flex items-center justify-end gap-1.5 text-[0.65rem] text-ink-500">
                الحلقة التالية <ChevronLeft className="h-3 w-3" />
              </span>
              <span className="mt-1.5 block truncate text-sm text-ink-100 group-hover:text-ember-200">
                <span className="num me-1.5">{data.next.number}.</span>
                {data.next.nameAr}
              </span>
            </Link>
          ) : (
            <Link
              href={`/series/${slug}/season/${seasonNumber}`}
              className="flex items-center justify-center rounded-xl border border-white/8 bg-ink-900/50 p-4 text-xs text-ink-300 transition hover:border-white/20"
            >
              العودة إلى قائمة الحلقات
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
