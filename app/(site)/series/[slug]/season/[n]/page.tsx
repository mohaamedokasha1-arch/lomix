import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, Clock, ListVideo } from "lucide-react";
import { cachedSeason } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { absoluteUrl } from "@/lib/utils";
import { buildSeasonDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const seasonNumber = Number(n);
  const data = Number.isInteger(seasonNumber) ? await cachedSeason(slug, seasonNumber) : null;
  if (!data || data.state !== "PUBLISHED") return { title: "الموسم غير موجود", robots: { index: false } };
  return {
    title: `${data.titleAr} — ${data.season.nameAr ?? `الموسم ${data.season.number}`}`,
    description: buildSeasonDescription(data),
    alternates: { canonical: `/series/${slug}/season/${seasonNumber}` },
    openGraph: {
      title: `${data.titleAr} — الموسم ${seasonNumber}`,
      images: [{ url: data.backdropPath ?? data.posterPath ?? "/art/og-default.webp" }],
      url: absoluteUrl(`/series/${slug}/season/${seasonNumber}`),
    },
  };
}

export default async function SeasonPage({ params }: Props) {
  const { slug, n } = await params;
  const seasonNumber = Number(n);
  if (!Number.isInteger(seasonNumber) || seasonNumber < 0 || seasonNumber > 100) notFound();

  const data = await cachedSeason(slug, seasonNumber);
  if (!data || data.state !== "PUBLISHED") notFound();

  const route = data.titleType === "ANIME" ? `/anime/${slug}` : `/series/${slug}`;

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[340px]">
        {data.backdropPath && <Image src={data.backdropPath} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/85 to-ink-950" />
      </div>

      <div className="container-page relative pb-10 pt-28 md:pt-36">
        <nav aria-label="مسار التنقل" className="mb-6 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-ink-400">
          <Link href="/" className="hover:text-ink-100">الرئيسية</Link>
          <ChevronLeft className="h-3 w-3" />
          <Link href={route} className="hover:text-ink-100">{data.titleAr}</Link>
          <ChevronLeft className="h-3 w-3" />
          <span className="text-ink-300">{data.season.nameAr ?? `الموسم ${data.season.number}`}</span>
        </nav>

        <header className="mb-8">
          <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.28em] text-ember-300/80">
            {data.titleType === "ANIME" ? "أنمي" : "مسلسل"}
          </p>
          <h1 className="display text-3xl font-bold text-ink-50 md:text-4xl">
            {data.titleAr} — {data.season.nameAr ?? `الموسم ${data.season.number}`}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-ink-400">
            <span className="num">{data.episodes.length} حلقة</span>
            {data.season.year && <span className="num">سنة العرض {data.season.year}</span>}
            {data.ratingValue != null && <span className="num text-ember-300">★ {data.ratingValue.toFixed(1)}</span>}
          </p>
          {data.season.overviewAr && <p className="mt-4 max-w-3xl text-sm leading-8 text-ink-300">{data.season.overviewAr}</p>}
        </header>

        <div className="mb-10 flex flex-wrap gap-2">
          {data.siblings.map((sibling) => (
            <Link
              key={sibling.number}
              href={`/series/${slug}/season/${sibling.number}`}
              className={
                sibling.number === data.season.number
                  ? "rounded-lg border border-ember-400/50 bg-ember-400/15 px-3 py-1.5 text-xs font-semibold text-ember-200"
                  : "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-300 transition hover:border-white/25 hover:text-ink-100"
              }
            >
              {sibling.nameAr ?? `الموسم ${sibling.number}`}
              {sibling.year && <span className="num ms-1.5 text-[0.65rem] text-ink-500">{sibling.year}</span>}
            </Link>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ol className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-ink-900/40">
            {data.episodes.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <ListVideo className="h-6 w-6 text-ink-500" />
                <p className="text-sm text-ink-300">لم تتم إضافة حلقات لهذا الموسم بعد.</p>
              </li>
            )}
            {data.episodes.map((episode) => (
              <li key={episode.id}>
                <Link
                  href={`/series/${slug}/season/${seasonNumber}/episode/${episode.number}`}
                  className="group flex items-start gap-3.5 px-4 py-4 transition hover:bg-white/[0.035]"
                >
                  <span className="num mt-0.5 flex h-8 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[0.72rem] text-ink-300 group-hover:border-ember-400/40 group-hover:text-ember-200">
                    {episode.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-100 group-hover:text-ember-200">{episode.nameAr}</span>
                    {episode.overviewAr && <span className="mt-1 line-clamp-2 block text-[0.72rem] leading-6 text-ink-400">{episode.overviewAr}</span>}
                    <span className="mt-1.5 flex items-center gap-3 text-[0.65rem] text-ink-500">
                      {episode.airDate && (
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(episode.airDate)}</span>
                      )}
                      {episode.runtime && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{episode.runtime} د</span>
                      )}
                      {episode.state === "DRAFT" && <span className="text-signal-amber">مسودة</span>}
                    </span>
                  </span>
                  <ChevronLeft className="mt-2 h-3.5 w-3.5 shrink-0 text-ink-500 group-hover:text-ember-200" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>

          <aside className="space-y-3">
            <Link
              href={route}
              className="block rounded-xl border border-white/8 bg-ink-900/50 p-4 text-sm text-ink-100 transition hover:border-ember-400/30 hover:text-ember-200"
            >
              صفحة {data.titleType === "ANIME" ? "الأنمي" : "المسلسل"} الكاملة
            </Link>
            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-4 text-[0.72rem] leading-6 text-ink-400">
              {data.titleEn && <p className="mb-2 font-[family-name:var(--font-latin)] text-[0.7rem] text-ink-300" dir="ltr">{data.titleEn}</p>}
              <p>تُعرض الحلقات بأرقامها الرسمية فقط. الحلقات الخاصة تُسجَّل بموسم مخصص (موسم 0) دون كسر ترتيب المواسم.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
