import type { Metadata } from "next";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";

export const metadata: Metadata = {
  title: "الأنمي",
  description: "أعمال الأنمي على لوميكس: مواسم وحلقات وتريلرات رسمية، مع فلاتر حسب النوع والسنة.",
  alternates: { canonical: "/anime" },
};

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AnimePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets] = await Promise.all([
    cachedList({
      type: "ANIME",
      genre: value("genre"),
      year: value("year") ? Number(value("year")) : undefined,
      country: value("country"),
      query: value("q"),
      minRating: value("rating") ? Number(value("rating")) : undefined,
      sort: (value("sort") as "latest" | "rating" | "trending" | "title" | "year") ?? "latest",
      page: value("page") ? Number(value("page")) : 1,
      perPage: 24,
    }),
    cachedFacets(),
  ]);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="المكتبة"
        title="الأنمي"
        description="حكايات مرسومة بخطوط دقيقة: مواسم، حلقات، وتريلرات رسمية في مكان واحد."
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath="/anime"
        params={{ genre: value("genre"), year: value("year"), country: value("country"), q: value("q"), rating: value("rating"), sort: value("sort") }}
        lockedType="ANIME"
      />
    </div>
  );
}
