import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { HomeSectionEditor } from "@/components/admin/home-section-editor";
import { moveHomeSectionAction, toggleHomeSectionAction } from "@/app/actions/admin-system";
import { getHomeSectionsAdmin } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  HERO: "واجهة رئيسية",
  BANNER: "بانر",
  CAROUSEL: "كاروسيل أفلام",
  GRID: "شبكة",
  ROW: "صف أفقي",
  CURATED: "قائمة منسّقة",
  TRAILERS: "تريلرات",
  GENRES: "تصنيفات",
};

export default async function AdminHomepagePage() {
  const sections = await getHomeSectionsAdmin();
  const hidden = sections.filter((section) => !section.visible).length;

  return (
    <>
      <AdminPageHeader
        title="الصفحة الرئيسية"
        description={`${sections.length} قسمًا · ${hidden} مخفيًا. الترتيب هنا هو الترتيب الفعلي على الصفحة من الأعلى للأسفل.`}
        actions={
          <Link href="/" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
            فتح الصفحة الرئيسية
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.id} className="rounded-xl border border-white/8 bg-ink-900/50 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num flex h-7 w-7 items-center justify-center rounded-md bg-white/6 text-[0.65rem] text-ink-300">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-medium text-ink-100">{section.titleAr}</p>
                  <p className="truncate text-[0.6rem] text-ink-500">
                    {KIND_LABEL[section.kind] ?? section.kind} · مفتاح: <span dir="ltr">{section.key}</span>
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[0.58rem] ${
                    section.visible ? "bg-signal-teal/12 text-signal-teal" : "bg-white/8 text-ink-500"
                  }`}
                >
                  {section.visible ? "ظاهر" : "مخفي"}
                </span>

                <form action={moveHomeSectionAction}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label={`تحريك ${section.titleAr} لأعلى`}
                    className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-ink-300 hover:border-white/25 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                </form>
                <form action={moveHomeSectionAction}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === sections.length - 1}
                    aria-label={`تحريك ${section.titleAr} لأسفل`}
                    className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-ink-300 hover:border-white/25 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </form>
                <form action={toggleHomeSectionAction}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="visible" value={String(section.visible)} />
                  <button
                    type="submit"
                    aria-label={section.visible ? `إخفاء ${section.titleAr}` : `إظهار ${section.titleAr}`}
                    className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-ink-300 hover:border-white/25"
                  >
                    {section.visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </form>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-[0.62rem] text-ink-500 hover:text-ink-300">تعديل العنوان والوصف</summary>
                <div className="mt-2">
                  <HomeSectionEditor
                    id={section.id}
                    titleAr={section.titleAr}
                    subtitleAr={section.subtitleAr}
                    visible={section.visible}
                  />
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <AdminCard title="كيف يعمل الترتيب">
            <ul className="space-y-2 text-[0.65rem] leading-5 text-ink-400">
              <li>• أزرار السهم تُبدّل ترتيب القسم مع جاره فورًا، ويُحدَّث الموقع تلقائيًا (on-demand revalidation).</li>
              <li>• الإخفاء يزيل القسم من الصفحة فقط — لا يحذف بياناته.</li>
              <li>• أقسام «الترند» و«الأكثر مشاهدة» تُبنى من عدّاد حقيقي أو قائمة منسّقة يدويًا، لا من أرقام مُفترضة.</li>
              <li>• الواجهة الرئيسية (HERO) تعرض أعمالًا منشورة فقط.</li>
            </ul>
          </AdminCard>

          <AdminCard title="محتويات الأقسام">
            <p className="text-[0.68rem] leading-6 text-ink-400">
              اختيار الأعمال داخل قوائم «مختارة المحرر» و«ترند» يتم من صفحة{" "}
              <Link href="/admin/curated" className="text-brass-200 underline">
                القوائم المنسّقة
              </Link>
              . أقسام مثل «أحدث الإضافات» و«الأعلى تقييمًا» تُحسب من بيانات المنشور فقط.
            </p>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
