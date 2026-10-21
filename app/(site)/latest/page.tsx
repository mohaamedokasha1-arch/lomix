import type { Metadata } from "next";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";

export const metadata: Metadata = {
  title: "أحدث الإضافات",
  description: "أحدث الأعمال المضافة إلى مكتبة لوميكس، مرتبة تلقائيًا حسب تاريخ النشر.",
  alternates: { canonical: "/latest" },
};

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function LatestPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [result, facets] = await Promise.all([
    cachedList({
      genre: value("genre"),
      country: value("country"),
      query: value("q"),
      sort: "latest",
      page: value("page") ? Number(value("page")) : 1,
      perPage: 24,
    }),
    cachedFacets(),
  ]);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="اكتشف"
        title="أحدث الإضافات"
        description="ترتيب تلقائي بحت حسب تاريخ الإضافة إلى قاعدة البيانات — بلا تدخل يدوي ولا تفضيل."
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath="/latest"
        params={{ genre: value("genre"), country: value("country"), q: value("q") }}
        showSort={false}
      />
    </div>
  );
}
