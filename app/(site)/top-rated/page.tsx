import type { Metadata } from "next";
import { PageHeader, PosterGrid } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { getTopRated } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "الأعلى تقييمًا",
  description: "الأعمال الأعلى تقييمًا على لوميكس. التقييم يُعرض فقط مع مصدره المسجّل في قاعدة البيانات.",
  alternates: { canonical: "/top-rated" },
};

export const dynamic = "force-dynamic";

export default async function TopRatedPage() {
  const items = await getTopRated(36);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <JsonLd
        data={collectionJsonLd({
          name: "الأعلى تقييمًا",
          path: "/top-rated",
          items: collectionItems(items),
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: "الأعلى تقييمًا", path: "/top-rated" }],
        })}
      />
      <PageHeader
        kicker="اكتشف"
        title="الأعلى تقييمًا"
        description="ترتيب آلي حسب حقل التقييم المسجّل. كل تقييم يُعرض بجانبه مصدره، ولا تُملأ الحقول الفارغة بقيم تقديرية."
      />
      {items.length ? (
        <PosterGrid items={items} />
      ) : (
        <EmptyState title="لا توجد تقييمات مسجّلة" description="لم تُضف أي تقييمات بعد. ستظهر الأعمال هنا فور تسجيلها مع مصدرها." />
      )}
    </div>
  );
}
