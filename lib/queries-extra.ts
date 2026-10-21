import "server-only";
import { unstable_cache } from "next/cache";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";

export const cachedFooterData = unstable_cache(
  async () => {
    const db = await getDb();
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        demo: sql<number>`sum(case when ${schema.titles.isDemo} then 1 else 0 end)::int`,
      })
      .from(schema.titles)
      .where(eq(schema.titles.state, "PUBLISHED"));
    const settings = await getSettings(["show_demo_notice"]);
    return {
      titleCount: row?.total ?? 0,
      hasDemo: (row?.demo ?? 0) > 0,
      showDemoNotice: settings.show_demo_notice !== "false",
    };
  },
  ["footer-data"],
  { tags: ["catalog"], revalidate: 600 },
);

export async function getAdminStats() {
  const db = await getDb();
  const [counts] = await db
    .select({
      movies: sql<number>`count(*) filter (where ${schema.titles.type} = 'MOVIE')::int`,
      series: sql<number>`count(*) filter (where ${schema.titles.type} = 'SERIES')::int`,
      anime: sql<number>`count(*) filter (where ${schema.titles.type} = 'ANIME')::int`,
      drafts: sql<number>`count(*) filter (where ${schema.titles.state} = 'DRAFT')::int`,
      published: sql<number>`count(*) filter (where ${schema.titles.state} = 'PUBLISHED')::int`,
      titles: sql<number>`count(*)::int`,
    })
    .from(schema.titles);

  const [seasons] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.seasons);
  const [episodes] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.episodes);
  const [trailers] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.trailers);
  const [brokenTrailers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.trailers)
    .where(eq(schema.trailers.health, "BROKEN"));
  const [newMessages] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.contactMessages)
    .where(eq(schema.contactMessages.status, "NEW"));
  const [people] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.people);
  const [views] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.titleViews);
  const [users] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
  const [failedImports] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.importJobs)
    .where(sql`${schema.importJobs.status} in ('FAILED','PARTIAL')`);

  return {
    ...counts,
    seasons: seasons?.count ?? 0,
    episodes: episodes?.count ?? 0,
    trailers: trailers?.count ?? 0,
    brokenTrailers: brokenTrailers?.count ?? 0,
    newMessages: newMessages?.count ?? 0,
    people: people?.count ?? 0,
    views: views?.count ?? 0,
    users: users?.count ?? 0,
    failedImports: failedImports?.count ?? 0,
  };
}

export async function getAdminTitleList(opts: {
  query?: string;
  type?: string;
  state?: string;
  page?: number;
  perPage?: number;
}) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(100, opts.perPage ?? 20);
  const conditions = [];
  if (opts.type && ["MOVIE", "SERIES", "ANIME"].includes(opts.type)) {
    conditions.push(eq(schema.titles.type, opts.type as "MOVIE" | "SERIES" | "ANIME"));
  }
  if (opts.state && ["DRAFT", "PUBLISHED"].includes(opts.state)) {
    conditions.push(eq(schema.titles.state, opts.state as "DRAFT" | "PUBLISHED"));
  }
  if (opts.query?.trim()) {
    const q = `%${opts.query.trim()}%`;
    conditions.push(sql`(${schema.titles.titleAr} like ${q} or coalesce(${schema.titles.titleEn}, '') like ${q})`);
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: schema.titles.id,
        slug: schema.titles.slug,
        titleAr: schema.titles.titleAr,
        titleEn: schema.titles.titleEn,
        type: schema.titles.type,
        state: schema.titles.state,
        releaseYear: schema.titles.releaseYear,
        posterPath: schema.titles.posterPath,
        ratingValue: schema.titles.ratingValue,
        viewsCount: schema.titles.viewsCount,
        updatedAt: schema.titles.updatedAt,
        isDemo: schema.titles.isDemo,
      })
      .from(schema.titles)
      .where(where)
      .orderBy(desc(schema.titles.updatedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.titles).where(where),
  ]);

  return { rows, total: count?.count ?? 0, page, perPage, totalPages: Math.max(1, Math.ceil((count?.count ?? 0) / perPage)) };
}

export async function getRecentTrailers(limit = 8) {
  const db = await getDb();
  return db
    .select({
      id: schema.trailers.id,
      nameAr: schema.trailers.nameAr,
      youtubeId: schema.trailers.youtubeId,
      kind: schema.trailers.kind,
      health: schema.trailers.health,
      isPrimary: schema.trailers.isPrimary,
      publishedAt: schema.trailers.publishedAt,
      titleAr: schema.titles.titleAr,
      titleSlug: schema.titles.slug,
    })
    .from(schema.trailers)
    .leftJoin(schema.titles, eq(schema.trailers.titleId, schema.titles.id))
    .orderBy(desc(schema.trailers.publishedAt))
    .limit(limit);
}

export async function getTrendingSnapshot(days = 7, limit = 6) {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400000);
  return db
    .select({
      slug: schema.titles.slug,
      titleAr: schema.titles.titleAr,
      views: sql<number>`count(${schema.titleViews.id})::int`,
      type: schema.titles.type,
    })
    .from(schema.titleViews)
    .innerJoin(schema.titles, eq(schema.titleViews.titleId, schema.titles.id))
    .where(and(gte(schema.titleViews.createdAt, since), eq(schema.titles.state, "PUBLISHED")))
    .groupBy(schema.titles.slug, schema.titles.titleAr, schema.titles.type)
    .orderBy(sql`count(${schema.titleViews.id}) desc`)
    .limit(limit);
}
