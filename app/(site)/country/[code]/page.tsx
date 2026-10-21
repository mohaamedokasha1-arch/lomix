import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { cachedFacets, cachedList } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const facets = await cachedFacets();
  const country = facets.countries.find((c) => c.code.toLowerCase() === code.toLowerCase());
  return {
    title: country ? `أعمال ${country.name}` : "أعمال حسب الدولة",
    description: `أعمال ${country?.name ?? "هذه الدولة"} على لوميكس فيلم مع بياناتها وتريلراتها.`,
    alternates: { canonical: `/country/${code.toUpperCase()}` },
  };
}

export default async function CountryPage({ params, searchParams }: Props) {
  const { code } = await params;
  if (!/^[A-Za-z]{2,3}$/.test(code)) notFound();
  const upper = code.toUpperCase();

  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [facets, result] = await Promise.all([
    cachedFacets(),
    cachedList({
      country: upper,
      genre: value("genre"),
      year: value("year") ? Number(value("year")) : undefined,
      type: value("type") as "MOVIE" | "SERIES" | "ANIME" | undefined,
      sort: (value("sort") as "latest" | "rating" | "trending" | "title" | "year") ?? "rating",
      page: value("page") ? Number(value("page")) : 1,
      perPage: 24,
    }),
  ]);

  const country = facets.countries.find((c) => c.code === upper);
  if (!country && result.total === 0) notFound();

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <JsonLd
        data={collectionJsonLd({
          name: `أعمال ${country?.name ?? upper}`,
          path: `/country/${upper}`,
          items: collectionItems(result.items),
          total: result.total,
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: country?.name ?? upper, path: `/country/${upper}` }],
        })}
      />
      <PageHeader
        kicker="حسب الدولة"
        title={`أعمال ${country?.name ?? upper}`}
        description={`${result.total} عملًا من هذه الدولة داخل مكتبة لوميكس فيلم.`}
      />
      <CatalogView
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={facets}
        basePath={`/country/${upper}`}
        params={{ genre: value("genre"), year: value("year"), type: value("type"), sort: value("sort") }}
        showSearch={false}
        emptyTitle="لا توجد أعمال من هذه الدولة بعد"
      />
    </div>
  );
}
