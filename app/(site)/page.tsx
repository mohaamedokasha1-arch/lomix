import Link from "next/link";
import { ArrowLeft, Clapperboard, Sparkles } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { TitleRow } from "@/components/titles/title-row";
import { TrailerCard } from "@/components/titles/trailer-card";
import { SectionHeader } from "@/components/site/section-header";
import { TitleCard } from "@/components/titles/title-card";
import {
  cachedEditors,
  cachedFacets,
  cachedGenres,
  cachedHero,
  cachedHomeSections,
  cachedLatest,
  cachedTopRated,
  cachedTrailers,
  cachedTrending,
  getPrimaryTrailersForSlugs,
} from "@/lib/queries";
import { GENRE_SOURCE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, hero, trending, latest, editors, topRated, trailers, genres, facets] = await Promise.all([
    cachedHomeSections(),
    cachedHero(4),
    cachedTrending(12),
    cachedLatest(12),
    cachedEditors(12),
    cachedTopRated(12),
    cachedTrailers(8),
    cachedGenres(),
    cachedFacets(),
  ]);

  const trailerMap = await getPrimaryTrailersForSlugs(hero.map((h) => h.slug));
  const heroTrailers = Object.fromEntries(hero.map((h) => [h.slug, trailerMap.get(h.slug) ?? null]));

  const sourceData: Record<string, { items: typeof latest; href: string; subtitle?: string | null }> = {
    TRENDING: { items: trending, href: "/trending" },
    LATEST: { items: latest, href: "/latest" },
    EDITORS: { items: editors.length ? editors : trending, href: "/trending" },
    TOP_RATED: { items: topRated, href: "/top-rated" },
  };

  const visibleSections = sections.length
    ? sections
    : [
        { key: "trending", titleAr: "الرائج الآن", kind: "POSTER_ROW", source: "TRENDING", subtitleAr: null, id: "x", visible: true, sort: 1, sourceValue: null },
      ];

  return (
    <>
      <Hero items={hero} trailers={heroTrailers} />

      <div className="container-page space-y-16 pt-14 md:space-y-20 md:pt-20">
        {visibleSections.map((section, position) => {
          if (section.kind === "HERO") return null;

          if (section.kind === "GENRE_ROW") {
            const topGenres = [...facets.genres].sort((a, b) => b.count - a.count).slice(0, 8);
            return (
              <section key={section.key} aria-labelledby={`section-${section.key}`}>
                <SectionHeader id={`section-${section.key}`} title={section.titleAr} subtitle={section.subtitleAr} moreHref="/movies" moreLabel="تصفح الأفلام" />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {topGenres.map((genre) => (
                    <Link
                      key={genre.slug}
                      href={`/genre/${genre.slug}`}
                      className="group relative overflow-hidden rounded-xl border border-white/8 bg-ink-900/70 px-4 py-4 transition hover:border-brass-400/35 hover:bg-ink-850"
                    >
                      <span className="flex items-center justify-between">
                        <span className="display text-[0.95rem] font-semibold text-ink-100 group-hover:text-brass-200">
                          {genre.nameAr}
                        </span>
                        <span className="num text-[0.65rem] text-ink-500">{genre.count}</span>
                      </span>
                      <span className="mt-3 block h-px w-full bg-gradient-to-l from-white/12 to-transparent" />
                      <span className="mt-2 flex items-center gap-1 text-[0.65rem] text-ink-400 transition group-hover:text-brass-300/80">
                        استكشف <ArrowLeft className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          if (section.kind === "TRAILER_ROW" || section.source === "TRAILERS") {
            if (!trailers.length) return null;
            return (
              <section key={section.key} aria-labelledby={`section-${section.key}`}>
                <SectionHeader id={`section-${section.key}`} title={section.titleAr} subtitle={section.subtitleAr} moreHref="/trailers" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {trailers.slice(0, 4).map((trailer) => (
                    <TrailerCard key={trailer.id} trailer={trailer} />
                  ))}
                </div>
              </section>
            );
          }

          const data = sourceData[section.source];
          if (!data || !data.items.length) return null;

          return (
            <section key={section.key} aria-labelledby={`section-${section.key}`}>
              <SectionHeader
                id={`section-${section.key}`}
                title={section.titleAr}
                subtitle={section.subtitleAr}
                moreHref={data.href}
              />
              <TitleRow items={data.items} showRank={section.source === "TRENDING"} />
            </section>
          );
        })}

        {/* فاصل تحريري: يشرح فلسفة Loomix */}
        <section aria-labelledby="editorial-band" className="relative overflow-hidden rounded-2xl border border-white/8">
          <div
            className="absolute inset-0 bg-[url('/art/pattern.webp')] bg-cover bg-center opacity-25"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/85 to-ink-950/40" />
          <div className="relative grid gap-8 p-7 md:grid-cols-[1.4fr_1fr] md:p-12">
            <div>
              <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.3em] text-brass-300/80">
                <Sparkles className="h-3.5 w-3.5" /> فلسفة لوميكس
              </p>
              <h2 id="editorial-band" className="display mt-4 max-w-xl text-balance text-2xl font-bold leading-snug text-ink-50 md:text-3xl">
                دليل اكتشاف سينمائي، لا مكتبة بث.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-300">
                نعرض بيانات الأعمال وتريلراتها الرسمية عبر روابط تضمين، ونحرص على فصل واضح تمامًا بين ما يمكنك مشاهدته الآن
                وما يمكنك اكتشافه. لا أزرار وهمية، ولا أرقام مختلقة، ولا محتوى غير مرخّص.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/trailers"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brass-400 px-4 text-xs font-bold text-[#171006] transition hover:bg-brass-300"
                >
                  <Clapperboard className="h-3.5 w-3.5" /> أرشيف التريلرات
                </Link>
                <Link
                  href="/top-rated"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-ink-100 transition hover:border-white/30"
                >
                  الأعلى تقييمًا
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 self-center">
              {[
                { label: "عمل في المكتبة", value: facets.genres.reduce((acc, g) => acc + g.count, 0) ? latest.length + topRated.length + trending.length : 0 },
                { label: "تصنيفًا سينمائيًا", value: genres.length },
                { label: "صنّاع أعمال", value: "" },
                { label: "تريلر رسمي", value: trailers.length },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/8 bg-ink-900/60 p-3.5 backdrop-blur-sm">
                  <dt className="text-[0.65rem] text-ink-400">{stat.label}</dt>
                  <dd className="num mt-1 text-xl font-bold text-ink-50">{stat.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {!hero.length && (
          <section className="rounded-2xl border border-dashed border-white/12 p-10 text-center">
            <h2 className="display text-xl font-semibold text-ink-100">لا يوجد محتوى منشور بعد</h2>
            <p className="mt-2 text-sm text-ink-300">ابدأ بإضافة أول عمل من لوحة التحكم، أو نفّذ أمر التعبئة التجريبية.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/admin/titles/new" className="rounded-xl bg-brass-400 px-4 py-2 text-sm font-semibold text-[#171006]">
                إضافة عمل
              </Link>
              <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-ink-100">
                لوحة التحكم
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
