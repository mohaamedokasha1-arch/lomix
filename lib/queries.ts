import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, exists, gte, inArray, lte, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalizeArabic } from "@/lib/slug";

export type TitleCard = {
  id: string;
  slug: string;
  type: "MOVIE" | "SERIES" | "ANIME";
  titleAr: string;
  titleEn: string | null;
  releaseYear: number | null;
  ratingValue: number | null;
  ratingSource: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  status: string;
  runtimeMinutes: number | null;
  genres: { slug: string; nameAr: string }[];
};

const cardColumns = {
  id: schema.titles.id,
  slug: schema.titles.slug,
  type: schema.titles.type,
  titleAr: schema.titles.titleAr,
  titleEn: schema.titles.titleEn,
  releaseYear: schema.titles.releaseYear,
  ratingValue: schema.titles.ratingValue,
  ratingSource: schema.titles.ratingSource,
  posterPath: schema.titles.posterPath,
  backdropPath: schema.titles.backdropPath,
  status: schema.titles.status,
  runtimeMinutes: schema.titles.runtimeMinutes,
};

type WithId = { id: string };

async function attachGenres<T extends WithId>(items: T[]): Promise<(T & { genres: { slug: string; nameAr: string }[] })[]> {
  if (!items.length) return [];
  const db = await getDb();
  const ids = items.map((t) => t.id);
  const rows = await db
    .select({
      titleId: schema.titleGenres.titleId,
      slug: schema.genres.slug,
      nameAr: schema.genres.nameAr,
    })
    .from(schema.titleGenres)
    .innerJoin(schema.genres, eq(schema.titleGenres.genreId, schema.genres.id))
    .where(inArray(schema.titleGenres.titleId, ids))
    .orderBy(asc(schema.genres.sort));

  const map = new Map<string, { slug: string; nameAr: string }[]>();
  for (const row of rows) {
    const list = map.get(row.titleId) ?? [];
    list.push({ slug: row.slug, nameAr: row.nameAr });
    map.set(row.titleId, list);
  }
  return items.map((item) => ({ ...item, genres: map.get(item.id) ?? [] }));
}

export type TitleFilters = {
  type?: "MOVIE" | "SERIES" | "ANIME";
  genre?: string;
  year?: number;
  country?: string;
  language?: string;
  query?: string;
  minRating?: number;
  sort?: "latest" | "rating" | "trending" | "title" | "year";
  page?: number;
  perPage?: number;
  includeDrafts?: boolean;
};

export type TitleListResult = {
  items: TitleCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function likeToken(token: string) {
  return `%${token.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
}

async function buildConditions(filters: TitleFilters) {
  const conditions = [];
  if (!filters.includeDrafts) conditions.push(eq(schema.titles.state, "PUBLISHED"));
  if (filters.type) conditions.push(eq(schema.titles.type, filters.type));
  if (filters.year) conditions.push(eq(schema.titles.releaseYear, filters.year));
  if (filters.country) conditions.push(eq(schema.titles.countryCode, filters.country.toUpperCase()));
  if (filters.language) conditions.push(eq(schema.titles.language, filters.language));
  if (filters.minRating) conditions.push(gte(schema.titles.ratingValue, filters.minRating));

  if (filters.genre) {
    conditions.push(
      exists(
        (await getDb())
          .select({ one: sql`1` })
          .from(schema.titleGenres)
          .innerJoin(schema.genres, eq(schema.titleGenres.genreId, schema.genres.id))
          .where(and(eq(schema.titleGenres.titleId, schema.titles.id), eq(schema.genres.slug, filters.genre))),
      ),
    );
  }

  const raw = filters.query?.trim();
  if (raw) {
    const normalized = normalizeArabic(raw);
    const tokens = normalized.split(/\s+/).filter(Boolean).slice(0, 6);
    const searchable = [sql`${schema.titles.titleAr}`, sql`coalesce(${schema.titles.titleEn}, '')`];
    const tokenMatches = tokens.map((token) =>
      or(sql`${schema.titles.searchText} like ${likeToken(token)}`, ...searchable.map((col) => sql`${col} like ${likeToken(token)}`)),
    );
    conditions.push(and(...tokenMatches)!);
  }
  return conditions;
}

function orderFor(sort: TitleFilters["sort"]) {
  switch (sort) {
    case "rating":
      return [sql`${schema.titles.ratingValue} desc nulls last`, desc(schema.titles.viewsCount)];
    case "trending":
      return [desc(schema.titles.viewsCount), sql`${schema.titles.ratingValue} desc nulls last`];
    case "title":
      return [asc(schema.titles.titleAr)];
    case "year":
      return [sql`${schema.titles.releaseYear} desc nulls last`, desc(schema.titles.createdAt)];
    default:
      return [desc(schema.titles.publishedAt), desc(schema.titles.createdAt)];
  }
}

export async function listTitles(filters: TitleFilters = {}): Promise<TitleListResult> {
  const db = await getDb();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 18));
  const conditions = await buildConditions(filters);
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(where)
    .orderBy(...orderFor(filters.sort))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.titles)
    .where(where);

  const total = countRow?.count ?? 0;
  return {
    items: await attachGenres(rows),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

async function curatedCards(listKey: "TRENDING_DAY" | "TRENDING_WEEK" | "EDITORS_PICK" | "FEATURED_HERO", limit: number) {
  const db = await getDb();
  const rows = await db
    .select({ ...cardColumns, rank: schema.curatedItems.rank })
    .from(schema.curatedItems)
    .innerJoin(schema.curatedLists, eq(schema.curatedItems.listId, schema.curatedLists.id))
    .innerJoin(schema.titles, eq(schema.curatedItems.titleId, schema.titles.id))
    .where(and(eq(schema.curatedLists.key, listKey), eq(schema.titles.state, "PUBLISHED")))
    .orderBy(desc(schema.curatedItems.pinned), asc(schema.curatedItems.rank))
    .limit(limit);
  return attachGenres(rows);
}

export async function getLatest(limit = 12) {
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(eq(schema.titles.state, "PUBLISHED"))
    .orderBy(desc(schema.titles.publishedAt), desc(schema.titles.createdAt))
    .limit(limit);
  return attachGenres(rows);
}

export async function getTopRated(limit = 12) {
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(eq(schema.titles.state, "PUBLISHED"))
    .orderBy(sql`${schema.titles.ratingValue} desc nulls last`)
    .limit(limit);
  return attachGenres(rows);
}

/** الترند: قائمة مُنسّقة يدويًا أولًا، وإلا الأعلى مشاهدة المسجّلة فعليًا. */
export async function getTrending(limit = 12) {
  const curated = await curatedCards("TRENDING_WEEK", limit);
  if (curated.length >= Math.min(limit, 4)) return curated;
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(eq(schema.titles.state, "PUBLISHED"))
    .orderBy(desc(schema.titles.viewsCount))
    .limit(limit);
  return attachGenres(rows);
}

export async function getEditorsPicks(limit = 12) {
  return curatedCards("EDITORS_PICK", limit);
}

export async function getHeroTitles(limit = 4) {
  const curated = await curatedCards("FEATURED_HERO", limit);
  if (curated.length) return curated;
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(and(eq(schema.titles.state, "PUBLISHED"), eq(schema.titles.featured, true)))
    .orderBy(sql`${schema.titles.ratingValue} desc nulls last`)
    .limit(limit);
  if (rows.length) return attachGenres(rows);
  return getLatest(limit);
}

export async function getGenres() {
  const db = await getDb();
  return db.select().from(schema.genres).orderBy(asc(schema.genres.sort), asc(schema.genres.nameAr));
}

export async function getGenreBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.genres).where(eq(schema.genres.slug, slug)).limit(1);
  return row ?? null;
}

export type TrailerCard = {
  id: string;
  youtubeId: string;
  nameAr: string;
  kind: string;
  health: string;
  publishedAt: Date;
  titleSlug: string;
  titleAr: string;
  titleType: string;
  posterPath: string | null;
  backdropPath: string | null;
};

export async function getTrailers(limit = 12): Promise<TrailerCard[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.trailers.id,
      youtubeId: schema.trailers.youtubeId,
      nameAr: schema.trailers.nameAr,
      kind: schema.trailers.kind,
      health: schema.trailers.health,
      publishedAt: schema.trailers.publishedAt,
      titleSlug: schema.titles.slug,
      titleAr: schema.titles.titleAr,
      titleType: schema.titles.type,
      posterPath: schema.titles.posterPath,
      backdropPath: schema.titles.backdropPath,
    })
    .from(schema.trailers)
    .innerJoin(schema.titles, eq(schema.trailers.titleId, schema.titles.id))
    .where(and(eq(schema.titles.state, "PUBLISHED"), ne(schema.trailers.health, "BROKEN")))
    .orderBy(desc(schema.trailers.publishedAt))
    .limit(limit);
  return rows;
}

export async function getTitleBySlug(slug: string) {
  const db = await getDb();
  const [title] = await db.select().from(schema.titles).where(eq(schema.titles.slug, slug)).limit(1);
  if (!title) return null;

  const [genres, creditRows, trailerRows, seasonRows] = await Promise.all([
    db
      .select({ slug: schema.genres.slug, nameAr: schema.genres.nameAr })
      .from(schema.titleGenres)
      .innerJoin(schema.genres, eq(schema.titleGenres.genreId, schema.genres.id))
      .where(eq(schema.titleGenres.titleId, title.id))
      .orderBy(asc(schema.genres.sort)),
    db
      .select({
        role: schema.credits.role,
        characterName: schema.credits.characterName,
        sort: schema.credits.sort,
        personId: schema.people.id,
        slug: schema.people.slug,
        nameAr: schema.people.nameAr,
        nameEn: schema.people.nameEn,
        imagePath: schema.people.imagePath,
      })
      .from(schema.credits)
      .innerJoin(schema.people, eq(schema.credits.personId, schema.people.id))
      .where(eq(schema.credits.titleId, title.id))
      .orderBy(asc(schema.credits.sort)),
    db
      .select()
      .from(schema.trailers)
      .where(eq(schema.trailers.titleId, title.id))
      .orderBy(desc(schema.trailers.isPrimary), asc(schema.trailers.sort), desc(schema.trailers.publishedAt)),
    db
      .select()
      .from(schema.seasons)
      .where(eq(schema.seasons.titleId, title.id))
      .orderBy(asc(schema.seasons.number)),
  ]);

  const seasonIds = seasonRows.map((s) => s.id);
  const episodeRows = seasonIds.length
    ? await db
        .select()
        .from(schema.episodes)
        .where(and(inArray(schema.episodes.seasonId, seasonIds), eq(schema.episodes.state, "PUBLISHED")))
        .orderBy(asc(schema.episodes.number))
    : [];

  const seasons = seasonRows.map((season) => ({
    ...season,
    episodes: episodeRows.filter((ep) => ep.seasonId === season.id),
  }));

  return {
    ...title,
    genres,
    cast: creditRows.filter((c) => c.role === "ACTOR"),
    crew: creditRows.filter((c) => c.role !== "ACTOR"),
    trailers: trailerRows,
    primaryTrailer: trailerRows.find((t) => t.isPrimary) ?? trailerRows[0] ?? null,
    seasons,
  };
}

export type TitleDetail = NonNullable<Awaited<ReturnType<typeof getTitleBySlug>>>;

export async function getRelated(titleId: string, genreSlugs: string[], limit = 6) {
  const db = await getDb();
  if (genreSlugs.length) {
    const rows = await db
      .selectDistinct(cardColumns)
      .from(schema.titles)
      .innerJoin(schema.titleGenres, eq(schema.titleGenres.titleId, schema.titles.id))
      .innerJoin(schema.genres, eq(schema.titleGenres.genreId, schema.genres.id))
      .where(
        and(
          eq(schema.titles.state, "PUBLISHED"),
          ne(schema.titles.id, titleId),
          inArray(schema.genres.slug, genreSlugs),
        ),
      )
      .orderBy(sql`${schema.titles.ratingValue} desc nulls last`)
      .limit(limit);
    if (rows.length) return attachGenres(rows);
  }
  const fallback = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(and(eq(schema.titles.state, "PUBLISHED"), ne(schema.titles.id, titleId)))
    .orderBy(desc(schema.titles.viewsCount))
    .limit(limit);
  return attachGenres(fallback);
}

export async function getSeason(titleSlug: string, seasonNumber: number) {
  const db = await getDb();
  const [row] = await db
    .select({
      season: schema.seasons,
      titleId: schema.titles.id,
      titleSlug: schema.titles.slug,
      titleAr: schema.titles.titleAr,
      titleEn: schema.titles.titleEn,
      titleType: schema.titles.type,
      posterPath: schema.titles.posterPath,
      backdropPath: schema.titles.backdropPath,
      ratingValue: schema.titles.ratingValue,
      releaseYear: schema.titles.releaseYear,
      state: schema.titles.state,
    })
    .from(schema.seasons)
    .innerJoin(schema.titles, eq(schema.seasons.titleId, schema.titles.id))
    .where(and(eq(schema.titles.slug, titleSlug), eq(schema.seasons.number, seasonNumber)))
    .limit(1);
  if (!row) return null;

  const episodes = await db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.seasonId, row.season.id))
    .orderBy(asc(schema.episodes.number));

  const siblings = await db
    .select({ number: schema.seasons.number, nameAr: schema.seasons.nameAr, year: schema.seasons.year })
    .from(schema.seasons)
    .where(eq(schema.seasons.titleId, row.titleId))
    .orderBy(asc(schema.seasons.number));

  return { ...row, episodes, siblings };
}

export async function getEpisode(titleSlug: string, seasonNumber: number, episodeNumber: number) {
  const season = await getSeason(titleSlug, seasonNumber);
  if (!season) return null;
  const episode = season.episodes.find((e) => e.number === episodeNumber);
  if (!episode) return null;
  const index = season.episodes.findIndex((e) => e.number === episodeNumber);
  return {
    ...season,
    episode,
    previous: season.episodes[index - 1] ?? null,
    next: season.episodes[index + 1] ?? null,
  };
}

export async function getPersonBySlug(slug: string) {
  const db = await getDb();
  const [person] = await db.select().from(schema.people).where(eq(schema.people.slug, slug)).limit(1);
  if (!person) return null;
  const works = await db
    .select({ ...cardColumns, role: schema.credits.role, characterName: schema.credits.characterName })
    .from(schema.credits)
    .innerJoin(schema.titles, eq(schema.credits.titleId, schema.titles.id))
    .where(and(eq(schema.credits.personId, person.id), eq(schema.titles.state, "PUBLISHED")))
    .orderBy(desc(schema.titles.releaseYear))
    .limit(40);
  return { person, works: await attachGenres(works) };
}

export async function getFilterFacets() {
  const db = await getDb();
  const [yearRows, countryRows, languageRows] = await Promise.all([
    db
      .select({ year: schema.titles.releaseYear, count: sql<number>`count(*)::int` })
      .from(schema.titles)
      .where(and(eq(schema.titles.state, "PUBLISHED"), sql`${schema.titles.releaseYear} is not null`))
      .groupBy(schema.titles.releaseYear)
      .orderBy(sql`${schema.titles.releaseYear} desc`)
      .limit(30),
    db
      .select({
        code: schema.titles.countryCode,
        name: schema.titles.countryNameAr,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.titles)
      .where(and(eq(schema.titles.state, "PUBLISHED"), sql`${schema.titles.countryCode} is not null`))
      .groupBy(schema.titles.countryCode, schema.titles.countryNameAr)
      .orderBy(sql`count(*) desc`)
      .limit(20),
    db
      .select({ language: schema.titles.language, count: sql<number>`count(*)::int` })
      .from(schema.titles)
      .where(and(eq(schema.titles.state, "PUBLISHED"), sql`${schema.titles.language} is not null`))
      .groupBy(schema.titles.language)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  ]);
  const genres = await db
    .select({
      slug: schema.genres.slug,
      nameAr: schema.genres.nameAr,
      count: sql<number>`count(${schema.titleGenres.titleId})::int`,
    })
    .from(schema.genres)
    .leftJoin(schema.titleGenres, eq(schema.genres.id, schema.titleGenres.genreId))
    .leftJoin(schema.titles, and(eq(schema.titleGenres.titleId, schema.titles.id), eq(schema.titles.state, "PUBLISHED")))
    .groupBy(schema.genres.slug, schema.genres.nameAr, schema.genres.sort)
    .orderBy(asc(schema.genres.sort));

  return {
    years: yearRows.map((r) => ({ year: r.year!, count: r.count })),
    countries: countryRows.filter((r) => r.code).map((r) => ({ code: r.code!, name: r.name ?? r.code!, count: r.count })),
    languages: languageRows.filter((r) => r.language).map((r) => ({ language: r.language!, count: r.count })),
    genres,
  };
}

export async function searchSuggestions(query: string, limit = 6) {
  const db = await getDb();
  const normalized = normalizeArabic(query);
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean).slice(0, 4);
  return db
    .select({
      slug: schema.titles.slug,
      titleAr: schema.titles.titleAr,
      titleEn: schema.titles.titleEn,
      type: schema.titles.type,
      releaseYear: schema.titles.releaseYear,
      posterPath: schema.titles.posterPath,
      ratingValue: schema.titles.ratingValue,
      ratingSource: schema.titles.ratingSource,
    })
    .from(schema.titles)
    .where(
      and(
        eq(schema.titles.state, "PUBLISHED"),
        ...tokens.map((token) => sql`${schema.titles.searchText} like ${likeToken(token)}`),
      ),
    )
    .orderBy(sql`${schema.titles.ratingValue} desc nulls last`)
    .limit(limit);
}

export async function getHomeSections() {
  const db = await getDb();
  return db
    .select()
    .from(schema.homeSections)
    .where(eq(schema.homeSections.visible, true))
    .orderBy(asc(schema.homeSections.sort));
}

export async function getWatchlist(userId: string) {
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.watchlistItems)
    .innerJoin(schema.titles, eq(schema.watchlistItems.titleId, schema.titles.id))
    .where(eq(schema.watchlistItems.userId, userId))
    .orderBy(desc(schema.watchlistItems.createdAt));
  return attachGenres(rows);
}

export async function isInWatchlist(userId: string, titleId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.watchlistItems.id })
    .from(schema.watchlistItems)
    .where(and(eq(schema.watchlistItems.userId, userId), eq(schema.watchlistItems.titleId, titleId)))
    .limit(1);
  return Boolean(row);
}

/** عدّاد مشاهدات حقيقي (يُستدعى من نقطة API محدودة المعدل). */
export async function recordView(titleId: string) {
  const db = await getDb();
  await db.insert(schema.titleViews).values({ titleId });
  await db
    .update(schema.titles)
    .set({ viewsCount: sql`${schema.titles.viewsCount} + 1` })
    .where(eq(schema.titles.id, titleId));
}

export async function getMostViewed(limit = 24) {
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(schema.titles)
    .where(and(eq(schema.titles.state, "PUBLISHED"), gte(schema.titles.viewsCount, 1)))
    .orderBy(desc(schema.titles.viewsCount))
    .limit(limit);
  return attachGenres(rows);
}

/** بيانات مختصرة للـ sitemap. */
export async function getSitemapEntries() {
  const db = await getDb();
  const [titles, people, genres] = await Promise.all([
    db
      .select({ slug: schema.titles.slug, updatedAt: schema.titles.updatedAt, type: schema.titles.type })
      .from(schema.titles)
      .where(eq(schema.titles.state, "PUBLISHED")),
    db.select({ slug: schema.people.slug }).from(schema.people),
    db.select({ slug: schema.genres.slug }).from(schema.genres),
  ]);
  return { titles, people, genres };
}

/* ───────────────────────── نسخ مُخزَّنة مؤقتًا ───────────────────────── */

const CATALOG_TAGS = ["catalog"];
const REVALIDATE = 300;

export const cachedLatest = unstable_cache(getLatest, ["home-latest"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedTopRated = unstable_cache(getTopRated, ["home-top"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedTrending = unstable_cache(getTrending, ["home-trending"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedEditors = unstable_cache(getEditorsPicks, ["home-editors"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedHero = unstable_cache(getHeroTitles, ["home-hero"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedTrailers = unstable_cache(getTrailers, ["home-trailers"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedGenres = unstable_cache(getGenres, ["genres"], { tags: CATALOG_TAGS, revalidate: 3600 });
export const cachedHomeSections = unstable_cache(getHomeSections, ["home-sections"], {
  tags: ["homepage", ...CATALOG_TAGS],
  revalidate: REVALIDATE,
});
export const cachedList = unstable_cache(listTitles, ["title-list"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedFacets = unstable_cache(getFilterFacets, ["facets"], { tags: CATALOG_TAGS, revalidate: 600 });
export const cachedTitleBySlug = unstable_cache(getTitleBySlug, ["title-detail"], {
  tags: CATALOG_TAGS,
  revalidate: REVALIDATE,
});
export const cachedRelated = unstable_cache(getRelated, ["title-related"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedPerson = unstable_cache(getPersonBySlug, ["person"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedSeason = unstable_cache(getSeason, ["season"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedEpisode = unstable_cache(getEpisode, ["episode"], { tags: CATALOG_TAGS, revalidate: REVALIDATE });
export const cachedMostViewed = unstable_cache(getMostViewed, ["most-viewed"], { tags: CATALOG_TAGS, revalidate: 120 });
export const cachedSitemap = unstable_cache(getSitemapEntries, ["sitemap"], { tags: CATALOG_TAGS, revalidate: 3600 });

export { lte };

export async function getPrimaryTrailersForSlugs(slugs: string[]) {
  if (!slugs.length) return new Map<string, { id: string; youtubeId: string; nameAr: string; kind: string; health: string }>();
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.trailers.id,
      youtubeId: schema.trailers.youtubeId,
      nameAr: schema.trailers.nameAr,
      kind: schema.trailers.kind,
      health: schema.trailers.health,
      slug: schema.titles.slug,
      isPrimary: schema.trailers.isPrimary,
    })
    .from(schema.trailers)
    .innerJoin(schema.titles, eq(schema.trailers.titleId, schema.titles.id))
    .where(inArray(schema.titles.slug, slugs))
    .orderBy(desc(schema.trailers.isPrimary), asc(schema.trailers.sort));

  const map = new Map<string, { id: string; youtubeId: string; nameAr: string; kind: string; health: string }>();
  for (const row of rows) {
    if (!map.has(row.slug)) {
      map.set(row.slug, { id: row.id, youtubeId: row.youtubeId, nameAr: row.nameAr, kind: row.kind, health: row.health });
    }
  }
  return map;
}
