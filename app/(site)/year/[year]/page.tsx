import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ year: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `أعمال سنة ${year}`,
    description: `كل الأعمال الصادرة في سنة ${year} على لوميكس، مع بياناتها وتريلراتها.`,
    alternates: { canonical: `/year/${year}` },
  };
}

export default async function YearPage({ params, searchParams }: Props) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) notFound();

  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets] = await Promise.all([
    cachedList({
      year,
      genre: value("genre"),
      type: value("type") as "MOVIE" | "SERIES" | "ANIME" | undefined,
      sort: (value("sort") as "latest" | "rating" | "trending" | "title" | "year") ?? "rating",
      page: value("page") ? Number(value("page")) : 1,
      perPage: 24,
    }),
    cachedFacets(),
  ]);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="حسب السنة"
        title={`أعمال سنة ${year}`}
        description={`${result.total} عملًا صدر في هذه السنة، مرتبة حسب التقييم افتراضيًا.`}
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath={`/year/${year}`}
        params={{ genre: value("genre"), type: value("type"), sort: value("sort") }}
        showSearch={false}
        emptyTitle={`لا توجد أعمال مسجّلة لسنة ${year}`}
      />
    </div>
  );
}
