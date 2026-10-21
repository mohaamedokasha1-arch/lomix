import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_ROUTE: Record<string, string> = { MOVIE: "/movie", SERIES: "/series", ANIME: "/anime" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/movies"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/series"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/anime"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/latest"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/trending"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/top-rated"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/most-viewed"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/trailers"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/dmca"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const db = await getDb();
    const [titles, genres, people, seasons, episodes] = await Promise.all([
      db
        .select({
          slug: schema.titles.slug,
          type: schema.titles.type,
          updatedAt: schema.titles.updatedAt,
        })
        .from(schema.titles)
        .where(eq(schema.titles.state, "PUBLISHED")),
      db.select({ slug: schema.genres.slug }).from(schema.genres).orderBy(asc(schema.genres.sort)),
      db.select({ slug: schema.people.slug }).from(schema.people).limit(5000),
      db
        .select({ number: schema.seasons.number, slug: schema.titles.slug, updatedAt: schema.titles.updatedAt })
        .from(schema.seasons)
        .innerJoin(schema.titles, eq(schema.seasons.titleId, schema.titles.id))
        .where(eq(schema.titles.state, "PUBLISHED")),
      db
        .select({
          seasonNumber: schema.seasons.number,
          episodeNumber: schema.episodes.number,
          slug: schema.titles.slug,
        })
        .from(schema.episodes)
        .innerJoin(schema.seasons, eq(schema.episodes.seasonId, schema.seasons.id))
        .innerJoin(schema.titles, eq(schema.seasons.titleId, schema.titles.id))
        .where(eq(schema.titles.state, "PUBLISHED"))
        .limit(5000),
    ]);

    const titleEntries: MetadataRoute.Sitemap = titles.map((title) => ({
      url: absoluteUrl(`${TYPE_ROUTE[title.type] ?? "/movie"}/${title.slug}`),
      lastModified: title.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const genreEntries: MetadataRoute.Sitemap = genres.map((genre) => ({
      url: absoluteUrl(`/genre/${genre.slug}`),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const personEntries: MetadataRoute.Sitemap = people.map((person) => ({
      url: absoluteUrl(`/person/${person.slug}`),
      changeFrequency: "monthly",
      priority: 0.4,
    }));

    const seasonEntries: MetadataRoute.Sitemap = seasons.map((season) => ({
      url: absoluteUrl(`/series/${season.slug}/season/${season.number}`),
      lastModified: season.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    const episodeEntries: MetadataRoute.Sitemap = episodes.map((episode) => ({
      url: absoluteUrl(`/series/${episode.slug}/season/${episode.seasonNumber}/episode/${episode.episodeNumber}`),
      changeFrequency: "monthly",
      priority: 0.35,
    }));

    return [...staticRoutes, ...titleEntries, ...genreEntries, ...seasonEntries, ...episodeEntries, ...personEntries];
  } catch (error) {
    console.error("[loomix:sitemap]", error);
    return staticRoutes;
  }
}
