import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { EpisodeForm } from "@/components/admin/episode-form";
import { EpisodeBulkForm } from "@/components/admin/episode-bulk-form";
import { EpisodeRowActions } from "@/components/admin/episode-row-actions";
import { SeasonForm } from "@/components/admin/season-form";
import { getSeasonDetail } from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SeasonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; seasonId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id, seasonId } = await params;
  const { edit } = await searchParams;
  const data = await getSeasonDetail(seasonId);
  if (!data || data.season.titleId !== id) notFound();

  const { season, title, episodes } = data;
  const editing = edit ? episodes.find((episode) => episode.id === edit) : null;
  const nextNumber = episodes.length ? Math.max(...episodes.map((e) => e.number)) + 1 : 1;

  return (
    <>
      <AdminPageHeader
        title={`${title.titleAr} — ${season.nameAr ?? `الموسم ${season.number}`}`}
        description={`${episodes.length} حلقة · ${episodes.filter((e) => e.state === "PUBLISHED").length} منشورة. الحلقات غير المنشورة لا تظهر للجمهور.`}
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
          { href: `/admin/titles/${id}/seasons`, label: "المواسم" },
        ]}
        actions={
          <Link href={`/series/${title.slug}/season/${season.number}`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
            معاينة الموسم
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCard title="الحلقات" description={`موسم رقم ${season.number}`}>
          {episodes.length === 0 ? (
            <p className="py-8 text-center text-[0.72rem] text-ink-500">لا حلقات بعد. أضف حلقة واحدة أو دفعة من العمود الجانبي.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {episodes.map((episode) => (
                <li key={episode.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="num w-7 text-[0.68rem] text-ink-500">{episode.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.76rem] text-ink-100">{episode.nameAr}</p>
                    <p className="mt-0.5 text-[0.6rem] text-ink-500">
                      {episode.state === "PUBLISHED" ? "منشورة" : "مسودة"}
                      {episode.runtime ? ` · ${episode.runtime} د` : ""}
                      {episode.airDate ? ` · ${formatDate(episode.airDate)}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`?edit=${episode.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-ink-400 hover:bg-white/8 hover:text-brass-200"
                    aria-label={`تعديل الحلقة ${episode.number}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <EpisodeRowActions id={episode.id} titleId={id} label={episode.nameAr} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title={editing ? `تعديل: ${editing.nameAr}` : "إضافة حلقة"}>
            <EpisodeForm
              key={editing?.id ?? "new"}
              values={{
                id: editing?.id,
                seasonId,
                titleId: id,
                number: editing?.number ?? nextNumber,
                nameAr: editing?.nameAr ?? "",
                overviewAr: editing?.overviewAr ?? null,
                airDate: editing?.airDate ? new Date(editing.airDate).toISOString().slice(0, 10) : null,
                runtime: editing?.runtime ?? null,
                state: editing?.state ?? "DRAFT",
              }}
            />
            {editing && (
              <Link href={`/admin/titles/${id}/seasons/${seasonId}`} className="mt-2 inline-block text-[0.65rem] text-ink-400 hover:text-brass-200">
                إلغاء التعديل — فتح نموذج إضافة جديد
              </Link>
            )}
          </AdminCard>

          <AdminCard title="إضافة دفعة" description="مفيد للمواسم الكاملة">
            <EpisodeBulkForm seasonId={seasonId} titleId={id} nextNumber={nextNumber} />
          </AdminCard>

          <AdminCard title="تعديل الموسم">
            <SeasonForm
              values={{
                id: season.id,
                titleId: id,
                number: season.number,
                nameAr: season.nameAr,
                year: season.year,
                overviewAr: season.overviewAr,
              }}
            />
          </AdminCard>
        </div>
      </div>
    </>
  );
}
