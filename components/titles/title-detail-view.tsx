import Link from "next/link";
import { CalendarDays, Clapperboard, Globe2, Languages, Layers, Star, Timer } from "lucide-react";
import { TitleHero } from "@/components/titles/title-hero";
import { CastGrid, CrewList } from "@/components/titles/cast-grid";
import { SeasonsPanel } from "@/components/titles/seasons-panel";
import { TitleRow } from "@/components/titles/title-row";
import { ViewTracker } from "@/components/titles/view-tracker";
import { SectionHeader } from "@/components/site/section-header";
import { TRAILER_KIND_LABEL, formatDate, runtimeLabel } from "@/lib/utils";
import { breadcrumbJsonLd, buildTitleJsonLd, titlePath } from "@/lib/seo";
import type { TitleCard, TitleDetail } from "@/lib/queries";

export function TitleDetailView({
  title,
  related,
  saved,
  isAuthenticated,
}: {
  title: TitleDetail;
  related: TitleCard[];
  saved: boolean;
  isAuthenticated: boolean;
}) {
  const isSerial = title.type !== "MOVIE";
  const seasonCount = title.seasons.length;
  const episodeCount = title.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
  const runtime = runtimeLabel(title.runtimeMinutes);

  const facts: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];
  facts.push({ icon: <Layers className="h-3.5 w-3.5" />, label: "النوع", value: title.type === "MOVIE" ? "فيلم" : title.type === "ANIME" ? "أنمي" : "مسلسل" });
  if (title.releaseYear)
    facts.push({
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      label: "السنة",
      value: (
        <Link href={`/year/${title.releaseYear}`} className="num underline-offset-4 transition hover:text-brass-200 hover:underline">
          {title.releaseYear}
        </Link>
      ),
    });
  if (title.releaseDate) facts.push({ icon: <CalendarDays className="h-3.5 w-3.5" />, label: "تاريخ الإصدار", value: formatDate(title.releaseDate) });
  if (!isSerial && runtime) facts.push({ icon: <Timer className="h-3.5 w-3.5" />, label: "المدة", value: runtime });
  if (isSerial && seasonCount) facts.push({ icon: <Layers className="h-3.5 w-3.5" />, label: "المواسم", value: <span className="num">{seasonCount}</span> });
  if (isSerial && episodeCount) facts.push({ icon: <Clapperboard className="h-3.5 w-3.5" />, label: "الحلقات", value: <span className="num">{episodeCount}</span> });
  if (title.countryNameAr && title.countryCode)
    facts.push({
      icon: <Globe2 className="h-3.5 w-3.5" />,
      label: "الدولة",
      value: (
        <Link href={`/country/${title.countryCode}`} className="underline-offset-4 transition hover:text-brass-200 hover:underline">
          {title.countryNameAr}
        </Link>
      ),
    });
  if (title.language) facts.push({ icon: <Languages className="h-3.5 w-3.5" />, label: "اللغة", value: title.language });
  if (title.ratingValue != null)
    facts.push({
      icon: <Star className="h-3.5 w-3.5" />,
      label: "التقييم",
      value: (
        <span className="num">
          {title.ratingValue.toFixed(1)} / 10
          {title.ratingSource ? <span className="text-[0.62rem] text-ink-500"> ({title.ratingSource})</span> : null}
        </span>
      ),
    });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildTitleJsonLd(title)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "الرئيسية", path: "/" },
              { name: title.type === "MOVIE" ? "الأفلام" : title.type === "ANIME" ? "الأنمي" : "المسلسلات", path: title.type === "MOVIE" ? "/movies" : title.type === "ANIME" ? "/anime" : "/series" },
              { name: title.titleAr, path: titlePath(title) },
            ]),
          ),
        }}
      />
      <ViewTracker titleId={title.id} />
      <TitleHero title={title} trailer={title.primaryTrailer} saved={saved} isAuthenticated={isAuthenticated} />

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <div className="min-w-0 space-y-12">
            {isSerial && (
              <section aria-labelledby="seasons-heading">
                <SectionHeader id="seasons-heading" title="المواسم والحلقات" subtitle="اختر الموسم لعرض حلقاته وتفاصيلها" />
                <SeasonsPanel slug={title.slug} seasons={title.seasons} />
              </section>
            )}

            {title.cast.length > 0 && (
              <section aria-labelledby="cast-heading">
                <SectionHeader id="cast-heading" title="طاقم التمثيل" subtitle="اضغط على أي اسم لعرض صفحته وأعماله" />
                <CastGrid cast={title.cast} />
              </section>
            )}

            {title.trailers.length > 0 && (
              <section aria-labelledby="trailers-heading">
                <SectionHeader id="trailers-heading" title="تريلرات العمل" subtitle="التريلر الرئيسي يُعرض أولًا، والباقي حسب نوعه" />
                <ul className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-ink-900/40">
                  {title.trailers.map((trailer) => (
                    <li key={trailer.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink-100">{trailer.nameAr}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-[0.65rem] text-ink-500">
                          <span>{TRAILER_KIND_LABEL[trailer.kind] ?? trailer.kind}</span>
                          {trailer.isPrimary && <span className="text-brass-300/80">· رئيسي</span>}
                          {trailer.health === "BROKEN" && <span className="text-signal-amber">· غير متاح حاليًا</span>}
                        </p>
                      </div>
                      <span className="shrink-0 text-[0.65rem] text-ink-500">{formatDate(trailer.publishedAt, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.65rem] text-ink-500">تُعرض التريلرات عبر تضمين رسمي داخل مشغّل الموقع، ولا تُستضاف على خوادم لوميكس.</p>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-ink-900/50 p-4 lg:sticky lg:top-24">
              <h2 className="display mb-3.5 text-sm font-bold text-ink-100">تفاصيل العمل</h2>
              <dl className="space-y-2.5">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-center justify-between gap-3 text-[0.78rem]">
                    <dt className="flex items-center gap-2 text-ink-500">
                      <span className="text-ink-500">{fact.icon}</span>
                      {fact.label}
                    </dt>
                    <dd className="text-end text-ink-100">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              {title.crew.length > 0 && (
                <div className="mt-5 border-t border-white/6 pt-4">
                  <h3 className="mb-3 text-[0.7rem] font-semibold tracking-wide text-ink-400">صنّاع العمل</h3>
                  <CrewList crew={title.crew} />
                </div>
              )}

              {title.editorNoteAr && (
                <div className="mt-5 rounded-xl border border-brass-400/20 bg-brass-400/[0.06] p-3.5">
                  <p className="mb-1.5 text-[0.65rem] font-semibold tracking-wide text-brass-300/90">ملاحظة المحرر</p>
                  <p className="text-[0.75rem] leading-6 text-ink-200">{title.editorNoteAr}</p>
                </div>
              )}

              <p className="mt-5 border-t border-white/6 pt-3.5 text-[0.62rem] leading-5 text-ink-500">
                لوميكس دليل اكتشاف: يعرض بيانات العمل وتريلره الرسمي فقط، ولا يوفّر مشاهدة العمل كاملًا.
              </p>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <SectionHeader id="related-heading" title="أعمال مشابهة" subtitle="اختيارات مبنية على التصنيفات المشتركة" />
            <TitleRow items={related} />
          </section>
        )}

        <nav className="mt-12 flex flex-wrap gap-2 border-t border-white/6 pt-6 text-[0.72rem] text-ink-400" aria-label="روابط سريعة">
          <Link href="/latest" className="rounded-lg border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:text-ink-100">أحدث الإضافات</Link>
          <Link href="/trending" className="rounded-lg border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:text-ink-100">الرائج الآن</Link>
          <Link href="/trailers" className="rounded-lg border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:text-ink-100">التريلرات</Link>
          {title.genres[0] && (
            <Link href={`/genre/${title.genres[0].slug}`} className="rounded-lg border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:text-ink-100">
              المزيد في {title.genres[0].nameAr}
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
