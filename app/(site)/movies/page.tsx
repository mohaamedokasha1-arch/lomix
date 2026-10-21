import type { Metadata } from "next";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";

export const metadata: Metadata = {
  title: "الأفلام",
  description: "تصفح كل الأفلام على لوميكس مع فلاتر حسب النوع والسنة والدولة والتقييم، وتريلرات رسمية لكل عمل.",
  alternates: { canonical: "/movies" },
};

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MoviesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets] = await Promise.all([
    cachedList({
      type: "MOVIE",
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
        title="الأفلام"
        description="كل فيلم في لوميكس ببطاقته وبياناته وتريلره الرسمي. استخدم الفلاتر للوصول إلى ما يناسب ليلتك."
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath="/movies"
        params={{ genre: value("genre"), year: value("year"), country: value("country"), q: value("q"), rating: value("rating"), sort: value("sort") }}
        lockedType="MOVIE"
      />
    </div>
  );
}
