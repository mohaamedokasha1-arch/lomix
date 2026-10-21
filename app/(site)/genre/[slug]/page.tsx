import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedGenres, cachedList, getGenreBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) return { title: "تصنيف غير موجود" };
  return {
    title: `أفلام ومسلسلات ${genre.nameAr}`,
    description: `كل أعمال ${genre.nameAr} على لوميكس مع بياناتها وتريلراتها الرسمية.`,
    alternates: { canonical: `/genre/${genre.slug}` },
  };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) notFound();

  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets, genres] = await Promise.all([
    cachedList({
      genre: slug,
      type: value("type") as "MOVIE" | "SERIES" | "ANIME" | undefined,
      year: value("year") ? Number(value("year")) : undefined,
      country: value("country"),
      sort: (value("sort") as "latest" | "rating" | "trending" | "title" | "year") ?? "rating",
      page: value("page") ? Number(value("page")) : 1,
      perPage: 24,
    }),
    cachedFacets(),
    cachedGenres(),
  ]);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="تصنيف"
        title={genre.nameAr}
        description={`${result.total} عملًا مصنّفًا تحت «${genre.nameAr}» — أفلام ومسلسلات وأنمي، بترتيب قابل للتغيير.`}
      >
        <div className="mt-5 flex flex-wrap gap-1.5">
          {genres.map((g) => (
            <a
              key={g.slug}
              href={`/genre/${g.slug}`}
              className={
                g.slug === slug
                  ? "rounded-full border border-brass-400/50 bg-brass-400/15 px-2.5 py-1 text-[0.7rem] font-semibold text-brass-200"
                  : "rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-ink-300 transition hover:border-white/25 hover:text-ink-100"
              }
            >
              {g.nameAr}
            </a>
          ))}
        </div>
      </PageHeader>

      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath={`/genre/${slug}`}
        params={{ type: value("type"), year: value("year"), country: value("country"), sort: value("sort") }}
        showSearch={false}
        lockedType={value("type")}
        emptyTitle={`لا توجد أعمال في «${genre.nameAr}» بعد`}
      />
    </div>
  );
}
