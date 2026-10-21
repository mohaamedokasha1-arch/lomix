import type { Metadata } from "next";
import { Activity, Info } from "lucide-react";
import { PageHeader, PosterGrid } from "@/components/titles/catalog-view";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getMostViewed } from "@/lib/queries";
import { collectionItems, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "الأكثر مشاهدة",
  description: "الأعمال الأكثر مشاهدة على لوميكس فيلم حسب عدّاد مشاهدات حقيقي مسجّل في قاعدة البيانات.",
  alternates: { canonical: "/most-viewed" },
};

export const dynamic = "force-dynamic";

export default async function MostViewedPage() {
  const items = await getMostViewed(36);

  return (
    <div className="container-page pb-10 pt-28 md:pt-32">
      <JsonLd
        data={collectionJsonLd({
          name: "الأكثر مشاهدة",
          path: "/most-viewed",
          items: collectionItems(items),
          breadcrumb: [{ name: "الرئيسية", path: "/" }, { name: "الأكثر مشاهدة", path: "/most-viewed" }],
        })}
      />
      <PageHeader
        kicker="اكتشف"
        title="الأكثر مشاهدة"
        description="هذه القائمة مبنية على عدّاد مشاهدات فعلي لصفحات الأعمال، مُسجّل في قاعدة البيانات بمعدل محدود لمنع التضخيم الآلي."
      />

      <div className="mb-7 flex items-start gap-2.5 rounded-xl border border-white/8 bg-ink-900/50 px-4 py-3 text-[0.75rem] leading-6 text-ink-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ember-300" aria-hidden="true" />
        <p>
          لا يظهر هنا أي عمل لم تُسجَّل له مشاهدة واحدة على الأقل. عند تجاوز عدّاد المشاهدات لأي سبب تقني، تُخفى هذه الصفحة
          من التنقل بدل عرض أرقام غير موثوقة.
        </p>
      </div>

      {items.length ? (
        <PosterGrid items={items} />
      ) : (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="لم تُسجَّل مشاهدات بعد"
          description="يبدأ العدّاد من أول زيارة حقيقية لصفحة أي عمل. عُد لاحقًا أو تصفح أحدث الإضافات."
          action={<ButtonLink href="/latest" variant="secondary" size="sm">أحدث الإضافات</ButtonLink>}
        />
      )}
    </div>
  );
}
