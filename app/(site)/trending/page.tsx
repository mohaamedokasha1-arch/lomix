import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader, PosterGrid } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getEditorsPicks, getTrending } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "الرائج الآن",
  description: "الأعمال الرائجة على لوميكس فيلم: قائمة يُنسّقها المحررون، مدعومة بعدّاد مشاهدات حقيقي ومسجّل.",
  alternates: { canonical: "/trending" },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrendingPage() {
  const [items, editors] = await Promise.all([getTrending(24), getEditorsPicks(24)]);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <JsonLd
        data={collectionJsonLd({
          name: "الرائج",
          path: "/trending",
          items: collectionItems(items),
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: "الرائج", path: "/trending" }],
        })}
      />
      <PageHeader
        kicker="اكتشف"
        title="الرائج الآن"
        description="قائمة الترند تُبنى يدويًا من لوحة التحكم، وتُسند بعدّاد مشاهدات حقيقي مسجّل في قاعدة البيانات. لا نعرض عملًا كـ«رائج» دون مصدر ترتيب واضح."
      />

      <div className="mb-7 flex items-start gap-2.5 rounded-xl border border-white/8 bg-ink-900/50 px-4 py-3 text-[0.75rem] leading-6 text-ink-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ember-300" aria-hidden="true" />
        <p>
          الترتيب الحالي: <strong className="font-semibold text-ink-100">ترند الأسبوع</strong> — يمكن للإدارة تثبيت عمل أو
          إزالته من القائمة أو إعادة ترتيبه بالكامل من لوحة التحكم.
        </p>
      </div>

      {items.length ? (
        <>
          <PosterGrid items={items} />
          {editors.length > 0 && (
            <section className="mt-16">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="h-3.5 w-[3px] rounded-full bg-ember-400" aria-hidden="true" />
                <h2 className="display text-xl font-bold text-ink-50 md:text-2xl">اختيارات المحرر</h2>
              </div>
              <PosterGrid items={editors} />
            </section>
          )}
        </>
      ) : (
        <EmptyState
          title="لم يُحدَّد ترند بعد"
          description="لم تُضف الإدارة أي عمل إلى قائمة الترند. يمكنك تصفح أحدث الإضافات في الانتظار."
          action={<ButtonLink href="/latest" variant="secondary" size="sm">أحدث الإضافات</ButtonLink>}
        />
      )}
    </div>
  );
}
