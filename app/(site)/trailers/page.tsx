import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { TrailerCard } from "@/components/titles/trailer-card";
import { getTrailers } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "التريلرات",
  description: "أرشيف التريلرات الرسمية على لوميكس، مرتبة بالأحدث. تُعرض عبر تضمين رسمي من المصدر ولا تُعاد استضافتها.",
  alternates: { canonical: "/trailers" },
};

export const dynamic = "force-dynamic";

export default async function TrailersPage() {
  const trailers = await getTrailers(48);
  const official = trailers.filter((t) => t.kind === "OFFICIAL");
  const other = trailers.filter((t) => t.kind !== "OFFICIAL");

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">

      <JsonLd
        data={collectionJsonLd({
          name: "التريلرات",
          description: "أرشيف التريلرات الرسمية على لوميكس، مرتبة بالأحدث.",
          path: "/trailers",
          items: collectionItems(
            trailers.map((trailer) => ({ titleAr: trailer.titleAr, slug: trailer.titleSlug, type: trailer.titleType })),
          ),
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: "التريلرات", path: "/trailers" }],
        })}
      />
      <PageHeader
        kicker="أرشيف"
        title="التريلرات"
        description="كل تريلر في لوميكس مرتبط بعمله، وموسوم بنوعه (رسمي / تشويقي / ترويجي), ومُفحص الحالة. لا تشغيل تلقائي مع صوت في أي صفحة."
      />

      {trailers.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="h-5 w-5" />}
          title="لا توجد تريلرات بعد"
          description="ستظهر التريلرات هنا فور إضافتها من لوحة التحكم وربطها بأعمالها."
        />
      ) : (
        <div className="space-y-14">
          {official.length > 0 && (
            <section>
              <h2 className="display mb-5 flex items-center gap-2.5 text-lg font-bold text-ink-50">
                <span className="h-3.5 w-[3px] rounded-full bg-brass-400" aria-hidden="true" />
                تريلرات رسمية
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {official.map((trailer) => (
                  <TrailerCard key={trailer.id} trailer={trailer} />
                ))}
              </div>
            </section>
          )}
          {other.length > 0 && (
            <section>
              <h2 className="display mb-5 flex items-center gap-2.5 text-lg font-bold text-ink-50">
                <span className="h-3.5 w-[3px] rounded-full bg-white/25" aria-hidden="true" />
                إعلانات تشويقية ومواد ترويجية
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {other.map((trailer) => (
                  <TrailerCard key={trailer.id} trailer={trailer} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
