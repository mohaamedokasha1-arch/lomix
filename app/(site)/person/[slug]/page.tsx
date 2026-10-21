import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { PageHeader, PosterGrid } from "@/components/titles/catalog-view";
import { cachedPerson } from "@/lib/queries";
import { personJsonLd, robotsFor } from "@/lib/seo";
import { initials } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await cachedPerson(slug);
  if (!data) return { title: "الصفحة غير موجودة", robots: { index: false } };
  return {
    title: data.person.nameAr,
    description: data.person.bioAr ?? `أعمال ${data.person.nameAr} على لوميكس.`,
    alternates: { canonical: `/person/${slug}` },
    robots: await robotsFor("seo_index_people"),
  };
}

const ROLE_TITLE: Record<string, string> = {
  ACTOR: "تمثيل",
  DIRECTOR: "إخراج",
  WRITER: "كتابة",
  COMPOSER: "موسيقى",
};

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const data = await cachedPerson(slug);
  if (!data) notFound();

  const { person, works } = data;
  const grouped = works.reduce<Record<string, typeof works>>((acc, work) => {
    (acc[work.role] ??= []).push(work);
    return acc;
  }, {});

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }} />
      <div className="container-page pb-10 pt-28 md:pt-32">
        <div className="flex flex-col gap-6 border-b border-white/6 pb-8 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 text-xl font-bold text-ink-200">
            {person.imagePath ? (
              <Image src={person.imagePath} alt={`صورة ${person.nameAr}`} fill sizes="96px" className="object-cover" />
            ) : (
              initials(person.nameAr)
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold tracking-[0.28em] text-brass-300/80">صفحة شخص</p>
            <h1 className="display text-3xl font-bold text-ink-50 md:text-4xl">{person.nameAr}</h1>
            {person.nameEn && (
              <p className="mt-1 font-[family-name:var(--font-latin)] text-sm text-ink-300" dir="ltr">{person.nameEn}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[0.72rem] text-ink-400">
              {person.birthYear && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> <span className="num">{person.birthYear}</span>
                </span>
              )}
              <span className="num">{works.length} عمل في لوميكس</span>
            </div>
          </div>
        </div>

        {person.bioAr && <p className="mt-6 max-w-3xl text-sm leading-8 text-ink-300">{person.bioAr}</p>}

        <div className="mt-10 space-y-12">
          {Object.entries(grouped).map(([role, items]) => (
            <section key={role}>
              <PageHeader kicker={ROLE_TITLE[role] ?? role} title={`أعمال ${ROLE_TITLE[role] ?? role}`} />
              <PosterGrid items={items} />
            </section>
          ))}
          {works.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-ink-400">
              لا توجد أعمال منشورة مرتبطة بهذا الشخص بعد.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
