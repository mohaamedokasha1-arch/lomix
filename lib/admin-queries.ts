import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getAdminStats, getAdminTitleList } from "@/lib/queries-extra";

export { getAdminStats, getAdminTitleList };

export async function getTitleForEdit(id: string) {
  const db = await getDb();
  const [title] = await db.select().from(schema.titles).where(eq(schema.titles.id, id)).limit(1);
  if (!title) return null;
  const [genres, credits, trailers, seasons] = await Promise.all([
    db
      .select({ genreId: schema.titleGenres.genreId, slug: schema.genres.slug })
      .from(schema.titleGenres)
      .innerJoin(schema.genres, eq(schema.titleGenres.genreId, schema.genres.id))
      .where(eq(schema.titleGenres.titleId, id)),
    db
      .select({
        personId: schema.credits.personId,
        role: schema.credits.role,
        characterName: schema.credits.characterName,
        nameAr: schema.people.nameAr,
        sort: schema.credits.sort,
      })
      .from(schema.credits)
      .innerJoin(schema.people, eq(schema.credits.personId, schema.people.id))
      .where(eq(schema.credits.titleId, id))
      .orderBy(asc(schema.credits.sort)),
    db.select().from(schema.trailers).where(eq(schema.trailers.titleId, id)).orderBy(desc(schema.trailers.isPrimary)),
    db
      .select({
        season: schema.seasons,
        episodeCount: sql<number>`(select count(*) from ${schema.episodes} where ${schema.episodes.seasonId} = ${schema.seasons.id})::int`,
      })
      .from(schema.seasons)
      .where(eq(schema.seasons.titleId, id))
      .orderBy(asc(schema.seasons.number)),
  ]);
  return { title, genres, credits, trailers, seasons };
}

export async function getAllGenres() {
  const db = await getDb();
  return db
    .select({
      id: schema.genres.id,
      slug: schema.genres.slug,
      nameAr: schema.genres.nameAr,
      nameEn: schema.genres.nameEn,
      sort: schema.genres.sort,
      count: sql<number>`(select count(*) from ${schema.titleGenres} where ${schema.titleGenres.genreId} = ${schema.genres.id})::int`,
    })
    .from(schema.genres)
    .orderBy(asc(schema.genres.sort), asc(schema.genres.nameAr));
}

export async function getAllPeople(query?: string) {
  const db = await getDb();
  const where = query?.trim()
    ? sql`(${schema.people.nameAr} like ${`%${query.trim()}%`} or coalesce(${schema.people.nameEn}, '') like ${`%${query.trim()}%`})`
    : undefined;
  return db
    .select({
      id: schema.people.id,
      slug: schema.people.slug,
      nameAr: schema.people.nameAr,
      nameEn: schema.people.nameEn,
      imagePath: schema.people.imagePath,
      birthYear: schema.people.birthYear,
      creditCount: sql<number>`(select count(*) from ${schema.credits} where ${schema.credits.personId} = ${schema.people.id})::int`,
    })
    .from(schema.people)
    .where(where)
    .orderBy(asc(schema.people.nameAr))
    .limit(300);
}

export async function getAllTrailers() {
  const db = await getDb();
  return db
    .select({
      id: schema.trailers.id,
      youtubeId: schema.trailers.youtubeId,
      nameAr: schema.trailers.nameAr,
      kind: schema.trailers.kind,
      health: schema.trailers.health,
      isPrimary: schema.trailers.isPrimary,
      lastCheckedAt: schema.trailers.lastCheckedAt,
      publishedAt: schema.trailers.publishedAt,
      titleId: schema.titles.id,
      titleAr: schema.titles.titleAr,
      titleSlug: schema.titles.slug,
    })
    .from(schema.trailers)
    .innerJoin(schema.titles, eq(schema.trailers.titleId, schema.titles.id))
    .orderBy(desc(schema.trailers.publishedAt))
    .limit(500);
}

export async function getHomeSectionsAdmin() {
  const db = await getDb();
  return db.select().from(schema.homeSections).orderBy(asc(schema.homeSections.sort));
}

export async function getCuratedAdmin() {
  const db = await getDb();
  const lists = await db.select().from(schema.curatedLists);
  const items = await db
    .select({
      id: schema.curatedItems.id,
      listId: schema.curatedItems.listId,
      rank: schema.curatedItems.rank,
      pinned: schema.curatedItems.pinned,
      titleId: schema.titles.id,
      titleAr: schema.titles.titleAr,
      titleSlug: schema.titles.slug,
      posterPath: schema.titles.posterPath,
      type: schema.titles.type,
      state: schema.titles.state,
    })
    .from(schema.curatedItems)
    .innerJoin(schema.titles, eq(schema.curatedItems.titleId, schema.titles.id))
    .orderBy(desc(schema.curatedItems.pinned), asc(schema.curatedItems.rank));
  return { lists, items };
}

export async function getTitleOptions() {
  const db = await getDb();
  return db
    .select({ id: schema.titles.id, titleAr: schema.titles.titleAr, type: schema.titles.type, state: schema.titles.state })
    .from(schema.titles)
    .orderBy(asc(schema.titles.titleAr))
    .limit(600);
}

export async function getMessagesAdmin(status?: string) {
  const db = await getDb();
  const where = status && ["NEW", "IN_PROGRESS", "RESOLVED"].includes(status)
    ? eq(schema.contactMessages.status, status as "NEW" | "IN_PROGRESS" | "RESOLVED")
    : undefined;
  return db.select().from(schema.contactMessages).where(where).orderBy(desc(schema.contactMessages.createdAt)).limit(300);
}

export async function getUsersAdmin() {
  const db = await getDb();
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      isActive: schema.users.isActive,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
      sessionCount: sql<number>`(select count(*) from ${schema.sessions} where ${schema.sessions.userId} = ${schema.users.id} and ${schema.sessions.expiresAt} > now())::int`,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.createdAt));
}

export async function getAuditLogs(page = 1, perPage = 50) {
  const db = await getDb();
  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entity: schema.auditLogs.entity,
        entityId: schema.auditLogs.entityId,
        details: schema.auditLogs.details,
        ip: schema.auditLogs.ip,
        createdAt: schema.auditLogs.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.auditLogs),
  ]);
  return { rows, total: count?.count ?? 0, page, perPage, totalPages: Math.max(1, Math.ceil((count?.count ?? 0) / perPage)) };
}

export async function getImportJobs(limit = 50) {
  const db = await getDb();
  return db
    .select({
      id: schema.importJobs.id,
      kind: schema.importJobs.kind,
      filename: schema.importJobs.filename,
      status: schema.importJobs.status,
      total: schema.importJobs.total,
      processed: schema.importJobs.processed,
      succeeded: schema.importJobs.succeeded,
      failed: schema.importJobs.failed,
      createdAt: schema.importJobs.createdAt,
      userName: schema.users.name,
    })
    .from(schema.importJobs)
    .leftJoin(schema.users, eq(schema.importJobs.userId, schema.users.id))
    .orderBy(desc(schema.importJobs.createdAt))
    .limit(limit);
}

export async function getImportJob(id: string) {
  const db = await getDb();
  const [job] = await db.select().from(schema.importJobs).where(eq(schema.importJobs.id, id)).limit(1);
  return job ?? null;
}

export async function getMediaAssets(limit = 200) {
  const db = await getDb();
  return db
    .select({
      id: schema.mediaAssets.id,
      path: schema.mediaAssets.path,
      alt: schema.mediaAssets.alt,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      mimeType: schema.mediaAssets.mimeType,
      sizeBytes: schema.mediaAssets.sizeBytes,
      createdAt: schema.mediaAssets.createdAt,
      uploadedByName: schema.users.name,
    })
    .from(schema.mediaAssets)
    .leftJoin(schema.users, eq(schema.mediaAssets.uploadedById, schema.users.id))
    .orderBy(desc(schema.mediaAssets.createdAt))
    .limit(limit);
}

export async function getAnalytics(days = 14) {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400000);
  const [daily, top, totals] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${schema.titleViews.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.titleViews)
      .where(gte(schema.titleViews.createdAt, since))
      .groupBy(sql`date_trunc('day', ${schema.titleViews.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.titleViews.createdAt})`),
    db
      .select({
        slug: schema.titles.slug,
        titleAr: schema.titles.titleAr,
        type: schema.titles.type,
        views: sql<number>`count(${schema.titleViews.id})::int`,
      })
      .from(schema.titleViews)
      .innerJoin(schema.titles, eq(schema.titleViews.titleId, schema.titles.id))
      .where(gte(schema.titleViews.createdAt, since))
      .groupBy(schema.titles.slug, schema.titles.titleAr, schema.titles.type)
      .orderBy(sql`count(${schema.titleViews.id}) desc`)
      .limit(10),
    db
      .select({
        totalViews: sql<number>`count(*)::int`,
        last7: sql<number>`count(*) filter (where ${schema.titleViews.createdAt} > now() - interval '7 days')::int`,
      })
      .from(schema.titleViews),
  ]);
  return { daily, top, totals: totals[0] ?? { totalViews: 0, last7: 0 } };
}

export async function getWatchlistCounts(limit = 10) {
  const db = await getDb();
  return db
    .select({
      titleAr: schema.titles.titleAr,
      slug: schema.titles.slug,
      saves: sql<number>`count(*)::int`,
    })
    .from(schema.watchlistItems)
    .innerJoin(schema.titles, eq(schema.watchlistItems.titleId, schema.titles.id))
    .groupBy(schema.titles.titleAr, schema.titles.slug)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}

export async function getSessionCount() {
  const db = await getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.sessions)
    .where(and(gte(schema.sessions.expiresAt, new Date())));
  return row?.count ?? 0;
}

export async function getSeasonsForTitle(titleId: string) {
  const db = await getDb();
  return db
    .select({
      id: schema.seasons.id,
      number: schema.seasons.number,
      nameAr: schema.seasons.nameAr,
      year: schema.seasons.year,
      overviewAr: schema.seasons.overviewAr,
      episodeCount: sql<number>`(select count(*) from ${schema.episodes} where ${schema.episodes.seasonId} = ${schema.seasons.id})::int`,
      publishedEpisodeCount: sql<number>`(select count(*) from ${schema.episodes} where ${schema.episodes.seasonId} = ${schema.seasons.id} and ${schema.episodes.state} = 'PUBLISHED')::int`,
    })
    .from(schema.seasons)
    .where(eq(schema.seasons.titleId, titleId))
    .orderBy(asc(schema.seasons.number));
}

export async function getSeasonDetail(seasonId: string) {
  const db = await getDb();
  const [season] = await db.select().from(schema.seasons).where(eq(schema.seasons.id, seasonId)).limit(1);
  if (!season) return null;
  const [title] = await db
    .select({ id: schema.titles.id, titleAr: schema.titles.titleAr, type: schema.titles.type, slug: schema.titles.slug })
    .from(schema.titles)
    .where(eq(schema.titles.id, season.titleId))
    .limit(1);
  if (!title) return null;
  const episodes = await db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.seasonId, seasonId))
    .orderBy(asc(schema.episodes.number));
  return { season, title, episodes };
}

export async function getTitleBrief(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.titles.id, titleAr: schema.titles.titleAr, type: schema.titles.type, slug: schema.titles.slug, state: schema.titles.state })
    .from(schema.titles)
    .where(eq(schema.titles.id, id))
    .limit(1);
  return row ?? null;
}
