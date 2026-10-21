import Link from "next/link";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { PersonForm } from "@/components/admin/person-form";
import { PersonDeleteButton } from "@/components/admin/person-delete-button";
import { getAllPeople } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const people = await getAllPeople(params.q);
  const editing = params.edit ? people.find((person) => person.id === params.edit) : null;

  return (
    <>
      <AdminPageHeader
        title="الأشخاص"
        description={`${people.length} شخصًا${params.q ? ` مطابقًا لـ«${params.q}»` : ""}. الأشخاص يظهرون في صفحات الطاقم وأعمالهم.`}
        actions={
          <Link href="/admin/people/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ember-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-ember-300">
            <Plus className="h-3.5 w-3.5" /> شخص جديد
          </Link>
        }
      />

      <form method="get" className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" aria-hidden="true" />
          <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="ابحث بالاسم…" className="field h-9 pe-9 text-xs" aria-label="بحث في الأشخاص" />
        </div>
        <button type="submit" className="rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
          بحث
        </button>
      </form>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="القائمة" description="مرتبة أبجديًا">
          {people.length === 0 ? (
            <p className="py-8 text-center text-[0.72rem] text-ink-500">لا نتائج.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3 py-2">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink-800">
                    {person.imagePath ? (
                      <Image src={person.imagePath} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[0.6rem] text-ink-500">{person.nameAr.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.78rem] text-ink-100">{person.nameAr}</p>
                    <p className="truncate text-[0.6rem] text-ink-500" dir="ltr">
                      {person.nameEn ?? person.slug}
                    </p>
                  </div>
                  <span className="num shrink-0 text-[0.62rem] text-ink-500">{person.creditCount}</span>
                  <Link
                    href={`/admin/people?edit=${person.id}`}
                    className="shrink-0 rounded border border-white/12 px-2 py-1 text-[0.6rem] text-ink-200 hover:border-white/30"
                  >
                    تعديل
                  </Link>
                  <PersonDeleteButton id={person.id} nameAr={person.nameAr} creditCount={person.creditCount} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title={editing ? `تعديل: ${editing.nameAr}` : "إضافة سريعة"}>
          <PersonForm
            key={editing?.id ?? "new"}
            values={
              editing
                ? {
                    id: editing.id,
                    nameAr: editing.nameAr,
                    nameEn: editing.nameEn,
                    imagePath: editing.imagePath,
                    bioAr: null,
                    birthYear: editing.birthYear,
                  }
                : undefined
            }
          />
          {editing && (
            <Link href="/admin/people" className="mt-2 inline-block text-[0.65rem] text-ink-400 hover:text-ember-200">
              إلغاء التعديل
            </Link>
          )}
        </AdminCard>
      </div>
    </>
  );
}
