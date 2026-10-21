import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { deleteTitleAction } from "@/app/actions/admin";
import { getTitleForEdit } from "@/lib/admin-queries";
import { TITLE_TYPE_LABEL, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * تأكيد الحذف — صفحة حقيقية لا `confirm()`.
 *
 * السبب: `window.confirm` يحتاج JavaScript، ولو أبقينا الحذف في الصف لعمل بلا JS
 * لحذف العمل بضغطة واحدة بلا رجعة. هنا يرى المستخدم بالضبط ما سيذهب معه.
 */
export default async function DeleteTitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTitleForEdit(id);
  if (!data) notFound();

  const { title, seasons, trailers, credits, genres } = data;
  const episodes = seasons.reduce((total, row) => total + Number(row.episodeCount), 0);
  const seriesRoute = title.type === "ANIME" ? "anime" : title.type === "SERIES" ? "series" : "movie";

  const losses = [
    { label: "المواسم", value: seasons.length },
    { label: "الحلقات", value: episodes },
    { label: "التريلرات", value: trailers.length },
    { label: "الأدوار والطاقم", value: credits.length },
    { label: "التصنيفات المرتبطة", value: genres.length },
  ].filter((item) => item.value > 0);

  return (
    <>
      <AdminPageHeader
        title="حذف العمل"
        description="خطوة تأكيد أخيرة — لا يمكن التراجع بعد التنفيذ."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
          { href: `/admin/titles/${title.id}`, label: title.titleAr },
        ]}
      />

      <div className="max-w-2xl">
      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-signal-red/25 bg-signal-red/[0.07] text-signal-red">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-50">
              سيُحذف «{title.titleAr}» نهائيًا
            </p>
            <p className="mt-1 text-xs leading-6 text-ink-400">
              {TITLE_TYPE_LABEL[title.type]} · {title.state === "PUBLISHED" ? "منشور" : "مسودة"} ·{" "}
              <Link href={`/${seriesRoute}/${title.slug}`} target="_blank" className="text-ember-300 underline-offset-4 hover:underline">
                معاينة الصفحة
              </Link>
            </p>
          </div>
        </div>

        {losses.length ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.7rem] font-bold text-ink-200">سيُحذف معه كذلك:</p>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.72rem] text-ink-400">
              {losses.map((item) => (
                <li key={item.label}>
                  {item.label}: <span className="font-bold text-ink-100">{formatNumber(item.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[0.72rem] text-ink-400">
            لا مواسم ولا تريلرات مرتبطة بهذا العمل.
          </p>
        )}

        <p className="mt-4 text-[0.7rem] leading-6 text-ink-500">
          يبقى أثر الحذف في سجل التتبع (اسم العمل ونوعه) حتى بعد حذف الصف.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <form action={deleteTitleAction}>
            <input type="hidden" name="id" value={title.id} />
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-signal-red px-5 text-sm font-bold text-white transition hover:brightness-110"
            >
              <AlertTriangle className="h-4 w-4" /> حذف نهائي
            </button>
          </form>
          <Link
            href={`/admin/titles/${title.id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 px-4 text-sm text-ink-100 transition hover:border-white/30"
          >
            <ArrowRight className="h-4 w-4" /> إلغاء والعودة للتعديل
          </Link>
          <Link
            href="/admin/titles"
            className="inline-flex h-10 items-center rounded-xl px-3 text-sm text-ink-400 transition hover:text-ink-100"
          >
            كل الأعمال
          </Link>
        </div>
      </AdminCard>
      </div>
    </>
  );
}
