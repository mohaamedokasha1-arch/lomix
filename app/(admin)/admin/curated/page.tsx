import Link from "next/link";
import { ArrowDown, ArrowUp, Pin, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { CuratedAddForm } from "@/components/admin/curated-add-form";
import { addCuratedAction, moveCuratedAction, pinCuratedAction, removeCuratedAction } from "@/app/actions/admin-system";
import { getCuratedAdmin, getTitleOptions } from "@/lib/admin-queries";
import { TITLE_TYPE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIST_META: Record<string, { label: string; description: string; use: string }> = {
  TRENDING_DAY: { label: "ترند اليوم", description: "ترتيب يدوي يومي", use: "يظهر في /trending وفي قسم الترند بالرئيسية" },
  TRENDING_WEEK: { label: "ترند الأسبوع", description: "ترتيب يدوي أسبوعي", use: "بديل عند تعطّل العدّاد" },
  EDITORS_PICK: { label: "اختيارات المحرر", description: "قائمة تحريرية", use: "قسم «اختيارات المحرر» في الرئيسية" },
  FEATURED_HERO: { label: "واجهة الرئيسية", description: "ترتيب الشرائح الكبرى", use: "أول ما يراه الزائر" },
};

export default async function AdminCuratedPage() {
  const [{ lists, items }, titles] = await Promise.all([getCuratedAdmin(), getTitleOptions()]);
  const sortedLists = [...lists].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <>
      <AdminPageHeader
        title="القوائم المنسّقة"
        description="ترتيب يدوي صريح للترند والاختيارات. لا تُبنى هذه القوائم على أرقام مُفترضة — إما ترتيب بشري أو عدّاد مشاهدات حقيقي."
        actions={
          <Link href="/trending" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
            معاينة /trending
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {sortedLists.map((list) => {
          const listItems = items.filter((item) => item.listId === list.id);
          const meta = LIST_META[list.key] ?? { label: list.key, description: "", use: "" };
          return (
            <AdminCard key={list.id} title={`${meta.label} (${listItems.length})`} description={meta.use}>
              <CuratedAddForm listKey={list.key} titles={titles} />

              {listItems.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-white/10 p-4 text-center text-[0.68rem] text-ink-500">
                  القائمة فارغة. أضف أعمالًا لتظهر بالترتيب المطلوب.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {listItems.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-ink-950/40 px-2 py-1.5">
                      <span className="num w-5 text-[0.6rem] text-ink-600">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.72rem] text-ink-100">
                          {item.titleAr}
                          {item.state === "DRAFT" && <span className="ms-1 text-[0.58rem] text-signal-amber">مسودة (لن تظهر)</span>}
                        </p>
                        <p className="text-[0.55rem] text-ink-500">{TITLE_TYPE_LABEL[item.type] ?? item.type}</p>
                      </div>
                      <form action={pinCuratedAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          aria-label={item.pinned ? `إلغاء تثبيت ${item.titleAr}` : `تثبيت ${item.titleAr}`}
                          className={`flex h-6 w-6 items-center justify-center rounded ${item.pinned ? "text-brass-300" : "text-ink-500 hover:text-ink-200"}`}
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                      </form>
                      <form action={moveCuratedAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit" disabled={index === 0} aria-label="أعلى" className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-white/8 disabled:opacity-25">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                      </form>
                      <form action={moveCuratedAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === listItems.length - 1}
                          aria-label="أسفل"
                          className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-white/8 disabled:opacity-25"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </form>
                      <form action={removeCuratedAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" aria-label={`إزالة ${item.titleAr}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-signal-red/10 hover:text-signal-red">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          );
        })}
      </div>

      <AdminCard title="ملاحظة شفافية" description="لماذا ترتيب يدوي؟">
        <p className="text-[0.68rem] leading-6 text-ink-400">
          عدّاد المشاهدات عندنا يبدأ من الصفر ولا يمثل جمهورًا حقيقيًا بعد. لذلك «ترند» في Loomix هو ترتيب تحريري صريح،
          وصفحة /trending تُعلن مصدر الترتيب للمستخدم. عند توفر بيانات مشاهدات كافية يمكن الاعتماد على العدّاد في
          /most-viewed بشرط بقاء التوضيح.
        </p>
      </AdminCard>
    </>
  );
}
