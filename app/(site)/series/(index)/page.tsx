import type { Metadata } from "next";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "المسلسلات",
  description: "كل المسلسلات على لوميكس فيلم مع المواسم والحلقات وتريلراتها الرسمية، وفلاتر دقيقة حسب النوع والسنة.",
  alternates: { canonical: "/series" },
};

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function SeriesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets] = await Promise.all([
    cachedList({
      type: "SERIES",
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
      <JsonLd
        data={collectionJsonLd({
          name: "المسلسلات",
          path: "/series",
          items: collectionItems(result.items),
          total: result.total,
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: "المسلسلات", path: "/series" }],
        })}
      />
      <PageHeader
        kicker="المكتبة"
        title="المسلسلات"
        description="من المسلسلات القصيرة إلى الأعمال الممتدة عبر مواسم — كل ما تحتاجه لاختيار التالي."
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath="/series"
        params={{ genre: value("genre"), year: value("year"), country: value("country"), q: value("q"), rating: value("rating"), sort: value("sort") }}
        lockedType="SERIES"
      />
    </div>
  );
}
