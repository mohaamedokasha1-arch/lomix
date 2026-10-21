import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { SeasonForm } from "@/components/admin/season-form";
import { SeasonRowActions } from "@/components/admin/season-row-actions";
import { getSeasonsForTitle, getTitleBrief } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function SeasonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [title, seasons] = await Promise.all([getTitleBrief(id), getSeasonsForTitle(id)]);
  if (!title) notFound();

  return (
    <>
      <AdminPageHeader
        title={`مواسم ${title.titleAr}`}
        description="كل موسم يجب أن يحمل رقمًا فريدًا داخل العمل. الحلقات تُدار داخل كل موسم."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
          { href: `/admin/titles/${id}`, label: title.titleAr },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCard title="المواسم" description={`${seasons.length} موسمًا`}>
          {seasons.length === 0 ? (
            <p className="py-8 text-center text-[0.72rem] text-ink-500">لا مواسم بعد — أضف الموسم الأول من النموذج المجاور.</p>
          ) : (
            <ul className="space-y-2">
              {seasons.map((season) => (
                <li key={season.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-ink-950/40 p-3">
                  <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/6 text-[0.72rem] text-ink-200">
                    {season.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/titles/${id}/seasons/${season.id}`} className="block truncate text-[0.78rem] font-medium text-ink-100 hover:text-brass-200">
                      {season.nameAr ?? `الموسم ${season.number}`}
                    </Link>
                    <p className="mt-0.5 text-[0.62rem] text-ink-500">
                      {season.episodeCount} حلقة · {season.publishedEpisodeCount} منشورة
                      {season.year ? ` · ${season.year}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/admin/titles/${id}/seasons/${season.id}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-white/12 px-2 text-[0.62rem] text-ink-200 hover:border-brass-400/40 hover:text-brass-200"
                  >
                    <Plus className="h-3 w-3" /> إدارة الحلقات
                  </Link>
                  <SeasonRowActions id={season.id} titleId={id} label={season.nameAr ?? `الموسم ${season.number}`} episodeCount={season.episodeCount} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="إضافة موسم">
          <SeasonForm values={{ titleId: id, number: seasons.length + 1, nameAr: null, year: null, overviewAr: null }} />
        </AdminCard>
      </div>
    </>
  );
}
