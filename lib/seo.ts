import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, truncate } from "@/lib/utils";
import type { TitleDetail } from "@/lib/queries";

const ROUTE: Record<string, string> = { MOVIE: "/movie", SERIES: "/series", ANIME: "/anime" };

export function titlePath(title: Pick<TitleDetail, "type" | "slug">) {
  return `${ROUTE[title.type] ?? "/movie"}/${title.slug}`;
}

export function buildTitleMetadata(title: TitleDetail): Metadata {
  const path = titlePath(title);
  const year = title.releaseYear ? ` (${title.releaseYear})` : "";
  const titleText = title.seoTitle || `${title.titleAr}${year}`;
  const description = title.seoDescription || truncate(title.overviewAr, 158);
  const image = title.backdropPath ?? title.posterPath ?? "/art/og-default.webp";

  return {
    title: titleText,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: title.type === "MOVIE" ? "video.movie" : "video.tv_show",
      title: titleText,
      description,
      url: absoluteUrl(path),
      images: [{ url: image, alt: `بوستر ${title.titleAr}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description,
      images: [image],
    },
  };
}

/**
 * بيانات منظّمة Schema.org — تُدرج الحقول المتوفرة فقط.
 * لا يتم اختلاق تقييم أو تاريخ أو طاقم غير مسجّل في قاعدة البيانات.
 */
export function buildTitleJsonLd(title: TitleDetail) {
  const path = titlePath(title);
  const isMovie = title.type === "MOVIE";
  const directors = title.crew.filter((c) => c.role === "DIRECTOR");
  const actors = title.cast.slice(0, 12);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": isMovie ? "Movie" : "TVSeries",
    name: title.titleAr,
    url: absoluteUrl(path),
    description: title.overviewAr,
  };

  if (title.titleEn) data.alternateName = title.titleEn;
  if (title.posterPath) data.image = absoluteUrl(title.posterPath);
  if (title.releaseDate) {
    const published = new Date(title.releaseDate);
    if (!Number.isNaN(published.getTime())) data.datePublished = published.toISOString().slice(0, 10);
  }
  if (!data.datePublished && title.releaseYear) data.datePublished = String(title.releaseYear);
  if (title.genres.length) data.genre = title.genres.map((g) => g.nameAr);
  if (title.countryNameAr) data.countryOfOrigin = title.countryNameAr;
  if (title.language) data.inLanguage = title.language;
  if (isMovie && title.runtimeMinutes) data.duration = `PT${title.runtimeMinutes}M`;
  if (directors.length) {
    data.director = directors.map((d) => ({ "@type": "Person", name: d.nameAr, url: absoluteUrl(`/person/${d.slug}`) }));
  }
  if (actors.length) {
    data.actor = actors.map((a) => ({
      "@type": "Person",
      name: a.nameAr,
      url: absoluteUrl(`/person/${a.slug}`),
      ...(a.characterName ? { characterName: a.characterName } : {}),
    }));
  }
  if (!isMovie && title.seasons.length) {
    data.numberOfSeasons = title.seasons.length;
    data.containsSeason = title.seasons.map((s) => ({
      "@type": "TVSeason",
      seasonNumber: s.number,
      numberOfEpisodes: s.episodes.length,
      url: absoluteUrl(`/series/${title.slug}/season/${s.number}`),
      ...(s.year ? { datePublished: String(s.year) } : {}),
    }));
  }
  if (title.ratingValue != null && title.ratingCount && title.ratingCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: title.ratingValue,
      ratingCount: title.ratingCount,
      bestRating: 10,
      worstRating: 1,
    };
  }

  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function personJsonLd(person: { nameAr: string; nameEn: string | null; slug: string; bioAr: string | null; imagePath: string | null }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.nameAr,
    url: absoluteUrl(`/person/${person.slug}`),
  };
  if (person.nameEn) data.alternateName = person.nameEn;
  if (person.bioAr) data.description = person.bioAr;
  if (person.imagePath) data.image = absoluteUrl(person.imagePath);
  return data;
}

/** robots مبني على إعدادات SEO في اللوحة — التحكم المعلن يجب أن يعمل فعليًا. */
export async function robotsFor(key: "seo_index_titles" | "seo_index_genres" | "seo_index_people"): Promise<Metadata["robots"]> {
  const settings = await getSettings([key]);
  return settings[key] === "true" ? undefined : { index: false, follow: true };
}
