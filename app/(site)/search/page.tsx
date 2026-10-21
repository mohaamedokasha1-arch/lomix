import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, SearchX } from "lucide-react";
import { CatalogView, PageHeader } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { cachedFacets, cachedList, getTopRated, getTrending } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const settings = await getSettings(["seo_index_search"]);
  return {
    title: q ? `نتائج البحث عن «${q}»` : "البحث",
    description: "ابحث في مكتبة لوميكس فيلم عن الأفلام والمسلسلات والأنمي بالاسم العربي أو الأصلي.",
    robots: settings.seo_index_search === "true" ? undefined : { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const [facets, result] = await Promise.all([
    cachedFacets(),
    query.trim()
      ? cachedList({
          query: query.trim(),
          genre: value("genre"),
          year: value("year") ? Number(value("year")) : undefined,
          country: value("country"),
          type: value("type") as "MOVIE" | "SERIES" | "ANIME" | undefined,
          sort: (value("sort") as "latest" | "rating" | "trending" | "title" | "year") ?? "rating",
          page: value("page") ? Number(value("page")) : 1,
          perPage: 24,
        })
      : Promise.resolve(null),
  ]);

  const [trending, topRated] = result && result.total === 0 ? await Promise.all([getTrending(6), getTopRated(6)]) : [await getTrending(12), []];
  const suggestions = result && result.total === 0 ? [...trending.slice(0, 4), ...topRated.slice(0, 4)] : [];

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <PageHeader
        kicker="بحث"
        title={query.trim() ? `نتائج «${query.trim()}»` : "ابحث في لوميكس فيلم"}
        description={
          query.trim()
            ? "البحث يشمل الاسم العربي والاسم الأصلي والتصنيفات، ويتعامل مع اختلافات الألف والتاء المربوطة."
            : "اكتب اسم الفيلم أو المسلسل أو الأنمي بالعربية أو الإنجليزية. يمكنك البحث بأي جزء من الاسم."
        }
      />

      <form action="/search" className="relative mb-7 max-w-xl">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="…اسم العمل"
          aria-label="كلمة البحث"
          className="field h-12 ps-10 text-base"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute end-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-ember-400 px-4 text-xs font-bold text-[#171006]"
        >
          ابحث
        </button>
      </form>

      {result ? (
        result.total > 0 ? (
          <CatalogView
            items={result.items}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            facets={facets}
            basePath="/search"
            params={{ q: query.trim(), genre: value("genre"), year: value("year"), country: value("country"), type: value("type") }}
            showSearch={false}
          />
        ) : (
          <div className="space-y-10">
            <EmptyState
              icon={<SearchX className="h-5 w-5" />}
              title="لا توجد نتائج مطابقة"
              description={`لم نعثر على عمل يطابق «${query.trim()}». تحقق من التهجئة أو جرّب الاسم الأصلي بالإنجليزية.`}
              action={
                <Link href="/search" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-ink-100 transition hover:border-white/30">
                  بحث جديد
                </Link>
              }
            />
            {suggestions.length > 0 && (
              <section>
                <h2 className="display mb-4 text-lg font-semibold text-ink-100">قد يعجبك أيضًا</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {suggestions.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      href={`${item.type === "MOVIE" ? "/movie" : item.type === "ANIME" ? "/anime" : "/series"}/${item.slug}`}
                      className="rounded-xl border border-white/8 bg-ink-900/60 p-3 text-sm text-ink-100 transition hover:border-ember-400/35 hover:text-ember-200"
                    >
                      {item.titleAr}
                      {item.releaseYear && <span className="num ms-2 text-[0.7rem] text-ink-400">{item.releaseYear}</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.slice(0, 9).map((item) => (
            <Link
              key={item.id}
              href={`${item.type === "MOVIE" ? "/movie" : item.type === "ANIME" ? "/anime" : "/series"}/${item.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-white/8 bg-ink-900/50 p-3 transition hover:border-ember-400/35"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-ink-300 group-hover:text-ember-200">
                <SearchIcon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink-100 group-hover:text-ember-200">{item.titleAr}</span>
                <span className="mt-0.5 block text-[0.7rem] text-ink-400">{item.genres.map((g) => g.nameAr).join(" · ")}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
