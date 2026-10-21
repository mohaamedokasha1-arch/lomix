import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, arabicCount, formatDate, truncate } from "@/lib/utils";
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

  return {
    title: titleText,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: title.type === "MOVIE" ? "video.movie" : "video.tv_show",
      title: titleText,
      description,
      url: absoluteUrl(path),
      // الصورة تأتي من ملف `opengraph-image.tsx` لكل مسار (بطاقة مرسومة بالعنوان
      // والغلاف) — لا نكرّرها هنا حتى لا نُلغي ملف الاصطلاح.
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description,
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
  // تاريخ كامل فقط (YYYY-MM-DD). لا نُصدر سنة مجرّدة لأن schema.org يتوقّع Date،
  // والسنة وحدها قد تُسقط النتيجة الغنية بدل أن تفيدها.
  if (title.releaseDate) {
    const published = new Date(title.releaseDate);
    if (!Number.isNaN(published.getTime())) data.datePublished = published.toISOString().slice(0, 10);
  }
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
    }));
  }
  // التقييم في البيانات المنظّمة يتبع نفس قاعدة الواجهة: قيمة + مصدر مسجّل.
  // بلا مصدر لا نُخرج تقييمًا إطلاقًا حتى لو وُجدت قيمة في الصف.
  if (title.ratingValue != null && title.ratingSource && title.ratingCount && title.ratingCount > 0) {
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

export type CollectionItem = { name: string; path: string };

/**
 * بيانات منظّمة لصفحة قائمة (أفلام/أنمي/تصنيف/سنة/دولة/تريلرات…).
 *
 * لا نُصدر تقييمًا ولا ترتيبًا ولا عددًا لم نحسبه: `numberOfItems` يُمرَّر من نتيجة
 * الاستعلام نفسها التي رسمت الصفحة، و`itemListElement` يمثّل العناصر المعروضة فعلًا
 * بترتيبها على الشاشة. إن كانت الصفحة فارغة نحذف `ItemList` كلها بدل إرسال قائمة صفرية.
 */
export function collectionJsonLd({
  name,
  description,
  path,
  items,
  total,
  breadcrumb,
}: {
  name: string;
  description?: string;
  path: string;
  items: CollectionItem[];
  total?: number;
  breadcrumb?: { name: string; path: string }[];
}) {
  const page: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(path)}#page`,
    name,
    url: absoluteUrl(path),
    inLanguage: "ar",
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  };
  if (description) page.description = description;
  if (items.length) {
    page.mainEntity = {
      "@type": "ItemList",
      numberOfItems: total ?? items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    };
  }

  const graph: Record<string, unknown>[] = [page];
  if (breadcrumb?.length) {
    graph.push({
      ...breadcrumbJsonLd(breadcrumb),
      "@context": undefined,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * يحوّل بطاقات الصفحة إلى عناصر بيانات منظّمة.
 * نُمرّر المسار كما يظهر في الواجهة (نوع العمل + slug) لا مسارًا مخمَّنًا.
 */
export function collectionItems(
  titles: { titleAr: string; slug: string; type: string }[],
): CollectionItem[] {
  return titles.map((title) => ({
    name: title.titleAr,
    path: `${ROUTE[title.type] ?? "/movie"}/${title.slug}`,
  }));
}

/* -------------------------------------------------------------------------- */
/*                         أوصاف SEO للصفحات الديناميكية                       */
/* -------------------------------------------------------------------------- */

/**
 * أوصاف صفحات الشخص/الموسم/الحلقة/التصنيف.
 *
 * القاعدة: كل وصف يُبنى من بيانات مسجّلة فعلًا (عدد الأعمال، مجالاتها، سنواتها،
 * الحلقات وتواريخها ومدّتها) — لا عبارات تسويقية فارغة ولا أرقام مخترعة. الهدف
 * طول قراءة مفيد (70 حرفًا على الأقل، وسقف ~158 حتى لا يُقتطع في نتائج البحث).
 */

const PERSON_ROLE_LABEL: Record<string, string> = {
  ACTOR: "التمثيل",
  DIRECTOR: "الإخراج",
  WRITER: "الكتابة",
  COMPOSER: "الموسيقى",
};

export function buildPersonDescription(
  person: { nameAr: string; bioAr: string | null },
  works: { role: string; releaseYear: number | null }[],
) {
  const bio = person.bioAr?.trim();
  if (bio && bio.length >= 70) return truncate(bio, 158);

  if (!works.length) {
    return `صفحة ${person.nameAr} على لوميكس: لم تُسجَّل لها أعمال منشورة بعد، وستُضاف السيرة والأعمال والتريلرات الرسمية عند توفّرها.`;
  }

  const order = Object.keys(PERSON_ROLE_LABEL);
  const roles = [...new Set(works.map((w) => w.role))]
    .filter((role) => role in PERSON_ROLE_LABEL)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((role) => PERSON_ROLE_LABEL[role]);

  // المدى الزمني من سنوات الإصدار المسجّلة فقط؛ لا نخمّن سنة غير موجودة.
  const years = works.map((w) => w.releaseYear).filter((y): y is number => typeof y === "number");
  const span = years.length
    ? (() => {
        const min = Math.min(...years);
        const max = Math.max(...years);
        return min === max ? ` سنة ${min}` : ` بين ${min} و${max}`;
      })()
    : "";

  const count = arabicCount(works.length, "عمل واحد", "عملان", "أعمال", "عملًا");
  const rolePart = roles.length ? ` في ${roles.join(" و")}` : "";

  return truncate(
    `أعمال ${person.nameAr} على لوميكس: ${count}${rolePart}${span}، مع بيانات كل عمل وطاقمه والتريلرات الرسمية المتاحة.`,
    158,
  );
}

function totalRuntimeLabel(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const hourText = arabicCount(hours, "ساعة واحدة", "ساعتان", "ساعات", "ساعة");
  const minuteText = arabicCount(minutes, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة");
  if (!hours) return minuteText;
  return minutes ? `${hourText} و${minuteText}` : hourText;
}

export function buildSeasonDescription(data: {
  titleAr: string;
  titleType: string;
  releaseYear: number | null;
  season: { nameAr: string | null; number: number; year: number | null };
  episodes: { airDate: Date | string | null; runtime: number | null }[];
  siblings?: { number: number }[];
}) {
  const seasonName = data.season.nameAr?.trim() || `الموسم ${data.season.number}`;
  const seasonYear = data.season.year ?? data.releaseYear;
  const year = seasonYear ? ` (${seasonYear})` : "";
  const kind = data.titleType === "ANIME" ? "أنمي" : "مسلسل";
  const count = arabicCount(data.episodes.length, "حلقة واحدة", "حلقتان", "حلقات", "حلقة");

  const dated = data.episodes.filter((episode) => episode.airDate);
  const first = dated[0]?.airDate;
  const last = dated.length > 1 ? dated[dated.length - 1]?.airDate : null;
  const monthYear = (value: Date | string | null | undefined) =>
    formatDate(value, { day: undefined, month: "long", year: "numeric" });
  const firstLabel = first ? monthYear(first) : "";
  const lastLabel = last ? monthYear(last) : "";
  // إن وقعت كل الحلقات في الشهر نفسه فلا معنى لصيغة «بين … و…».
  const dates = firstLabel
    ? lastLabel && lastLabel !== firstLabel
      ? `، عُرضت بين ${firstLabel} و${lastLabel}`
      : `، عُرضت في ${firstLabel}`
    : "";

  // مجموع المدّة يُذكر فقط إذا كانت كل حلقات الموسم مسجّلة المدّة — وإلا فهو ناقص.
  const runtimes = data.episodes.map((episode) => episode.runtime).filter((r): r is number => !!r && r > 0);
  const runtime =
    data.episodes.length > 0 && runtimes.length === data.episodes.length
      ? `، بمجموع ${totalRuntimeLabel(runtimes.reduce((sum, r) => sum + r, 0))}`
      : "";

  const hasSiblings = (data.siblings?.length ?? 0) > 1;
  const head = `${data.titleAr}${year} — ${seasonName} (${kind}): ${count}${dates}${runtime}.`;
  const tail = hasSiblings
    ? " مع أسماء الحلقات وتواريخ العرض والمدّة والتنقّل بين المواسم."
    : " مع أسماء الحلقات وتواريخ العرض والمدّة.";
  const full = `${head}${tail}`;
  return full.length <= 165 ? full : truncate(head, 158);
}

export function buildEpisodeDescription(data: {
  titleAr: string;
  season: { nameAr: string | null; number: number };
  episode: {
    number: number;
    nameAr: string;
    overviewAr: string | null;
    airDate: Date | string | null;
    runtime: number | null;
  };
}) {
  const seasonName = data.season.nameAr?.trim() || `الموسم ${data.season.number}`;
  const head = `الحلقة ${data.episode.number} «${data.episode.nameAr}» من ${seasonName} من ${data.titleAr}`;
  const facts = [
    data.episode.airDate ? `عُرضت في ${formatDate(data.episode.airDate)}` : null,
    data.episode.runtime ? `مدّتها ${data.episode.runtime} دقيقة` : null,
  ]
    .filter(Boolean)
    .join("، ");

  const overview = data.episode.overviewAr?.trim();
  if (overview && overview.length >= 60) {
    const room = Math.max(60, 158 - head.length - 2);
    return `${head}: ${truncate(overview, room)}`;
  }

  const full = `${head}${facts ? `، ${facts}` : ""}. تفاصيل الحلقة والحلقات السابقة والتالية في الموسم.`;
  return full.length <= 165 ? full : truncate(full, 158);
}

export function buildGenreDescription(nameAr: string) {
  return `تصفّح أعمال ${nameAr} على لوميكس — أفلام ومسلسلات وأنمي — مع الفلاتر حسب النوع والسنة والبلد، وبيانات كل عمل وطاقمه وتريلراته الرسمية.`;
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

/**
 * بيانات الموقع المنظّمة: منظمة + موقع + صندوق بحث داخلي.
 * لا تُضاف أي حقول لا نملكها فعلًا (لا عنوان، لا تقييم، لا عملاء).
 */
export function siteJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: "Loomix",
        alternateName: "لوميكس",
        url,
        logo: absoluteUrl("/icon.svg"),
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: "لوميكس",
        alternateName: "Loomix",
        url,
        inLanguage: "ar",
        publisher: { "@id": `${url}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
