import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Film, Plus } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { TitleForm } from "@/components/admin/title-form";
import { TitleRelations } from "@/components/admin/title-relations";
import { getAllGenres, getAllPeople, getTitleForEdit } from "@/lib/admin-queries";
import { TITLE_TYPE_LABEL, TRAILER_HEALTH_LABEL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditTitlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const [data, genres, people] = await Promise.all([getTitleForEdit(id), getAllGenres(), getAllPeople()]);
  if (!data) notFound();

  const { title, genres: titleGenres, credits, trailers, seasons } = data;
  const seriesRoute = title.type === "ANIME" ? "anime" : title.type === "SERIES" ? "series" : "movie";

  return (
    <>
      <AdminPageHeader
        title={title.titleAr}
        description={`${TITLE_TYPE_LABEL[title.type]} · ${title.state === "PUBLISHED" ? "منشور" : "مسودة"} · آخر تحديث ${formatDate(title.updatedAt)}`}
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
        ]}
        actions={
          <>
            <Link href={`/${seriesRoute}/${title.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
              <ExternalLink className="h-3.5 w-3.5" /> معاينة
            </Link>
            {title.type !== "MOVIE" && (
              <Link href={`/admin/titles/${id}/seasons`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ember-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-ember-300">
                <Film className="h-3.5 w-3.5" /> المواسم والحلقات
              </Link>
            )}
            {title.type === "MOVIE" && (
              <Link href={`/admin/trailers?titleId=${id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
                <Plus className="h-3.5 w-3.5" /> تريلرات العمل
              </Link>
            )}
          </>
        }
      />

      {created && (
        <p role="status" className="mb-4 rounded-lg border border-signal-teal/25 bg-signal-teal/[0.06] px-3 py-2 text-[0.72rem] text-signal-teal">
          أُنشئ العمل. أضف له التريلرات والمواسم إن كان مسلسلًا/أنميًا، ثم انشره.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <TitleForm
          values={{
            id: title.id,
            type: title.type,
            titleAr: title.titleAr,
            titleEn: title.titleEn,
            slug: title.slug,
            taglineAr: title.taglineAr,
            overviewAr: title.overviewAr,
            releaseYear: title.releaseYear,
            releaseDate: title.releaseDate ? new Date(title.releaseDate).toISOString().slice(0, 10) : null,
            runtimeMinutes: title.runtimeMinutes,
            status: title.status,
            countryCode: title.countryCode,
            countryNameAr: title.countryNameAr,
            language: title.language,
            posterPath: title.posterPath,
            backdropPath: title.backdropPath,
            ratingValue: title.ratingValue,
            ratingSource: title.ratingSource,
            ratingCount: title.ratingCount,
            seoTitle: title.seoTitle,
            seoDescription: title.seoDescription,
            state: title.state,
            featured: title.featured,
            isDemo: title.isDemo,
            editorNoteAr: title.editorNoteAr,
            externalSource: title.externalSource,
            externalId: title.externalId,
          }}
          genres={genres}
          selectedGenres={titleGenres.map((g) => g.slug)}
          people={people}
          credits={credits.map((c) => ({ personId: c.personId, role: c.role, characterName: c.characterName }))}
        />

        <aside className="space-y-4">
          <AdminCard title="التريلرات" description={`${trailers.length} تريلرًا مرتبطًا`}>
            {trailers.length === 0 ? (
              <p className="text-[0.7rem] leading-5 text-ink-500">لا يوجد تريلر. أضف تريلرًا رسميًا من صفحة التريلرات — لا تُضِف فيديو غير رسمي.</p>
            ) : (
              <ul className="space-y-2">
                {trailers.map((trailer) => (
                  <li key={trailer.id} className="rounded-lg border border-white/8 p-2">
                    <p className="truncate text-[0.72rem] text-ink-100">{trailer.nameAr}</p>
                    <p className="mt-1 flex items-center gap-2 text-[0.6rem] text-ink-500">
                      <span className={trailer.health === "BROKEN" ? "text-signal-amber" : ""}>{TRAILER_HEALTH_LABEL[trailer.health]}</span>
                      {trailer.isPrimary && <span className="text-ember-300">· أساسي</span>}
                      {trailer.youtubeId.startsWith("demo-") && <span>· تجريبي</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/admin/trailers?titleId=${id}`} className="mt-3 inline-flex text-[0.68rem] text-ember-200 hover:underline">
              إدارة تريلرات هذا العمل
            </Link>
          </AdminCard>

          {title.type !== "MOVIE" && (
            <AdminCard title="المواسم" description={`${seasons.length} موسمًا`}>
              {seasons.length === 0 ? (
                <p className="text-[0.7rem] text-ink-500">لا مواسم بعد.</p>
              ) : (
                <ul className="space-y-1.5">
                  {seasons.map(({ season, episodeCount }) => (
                    <li key={season.id}>
                      <Link
                        href={`/admin/titles/${id}/seasons/${season.id}`}
                        className="flex items-center justify-between rounded-md border border-white/8 px-2 py-1.5 text-[0.7rem] text-ink-200 hover:border-ember-400/30 hover:text-ember-200"
                      >
                        <span>
                          {season.nameAr ?? `الموسم ${season.number}`}
                          {season.year && <span className="num ms-1 text-ink-500">({season.year})</span>}
                        </span>
                        <span className="num text-[0.6rem] text-ink-500">{episodeCount} حلقة</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/admin/titles/${id}/seasons`} className="mt-3 inline-flex text-[0.68rem] text-ember-200 hover:underline">
                إدارة المواسم والحلقات
              </Link>
            </AdminCard>
          )}

          <AdminCard title="حذف العمل">
            <TitleRelations id={id} titleAr={title.titleAr} type={title.type} />
          </AdminCard>

          <div className="rounded-xl border border-white/8 bg-ink-900/40 p-3.5 text-[0.62rem] leading-5 text-ink-500">
            <p className="mb-1 font-semibold text-ink-300">بيانات تقنية</p>
            <p dir="ltr" className="truncate">slug: {title.slug}</p>
            <p>أُنشئ: {formatDate(title.createdAt)}</p>
            <p>نُشر: {title.publishedAt ? formatDate(title.publishedAt) : "لم يُنشر بعد"}</p>
            <p>المعرّف: <span className="num" dir="ltr">{title.id.slice(0, 8)}</span></p>
          </div>
        </aside>
      </div>
    </>
  );
}
