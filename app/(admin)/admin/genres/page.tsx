import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { GenreDeleteForm, GenreForm } from "@/components/admin/genre-forms";
import { getAllGenres } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminGenresPage() {
  const genres = await getAllGenres();
  const options = genres.map((genre) => ({ id: genre.id, nameAr: genre.nameAr }));
  const totalLinks = genres.reduce((sum, genre) => sum + genre.count, 0);

  return (
    <>
      <AdminPageHeader
        title="التصنيفات"
        description={`${genres.length} تصنيفًا و${totalLinks} ارتباطًا بالأعمال. لا يمكن حذف تصنيف مرتبط بأعمال دون اختيار بديل — منعًا لروابط ميتة.`}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="التصنيفات الحالية">
          <ul className="divide-y divide-white/5">
            {genres.map((genre) => (
              <li key={genre.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="num w-8 text-[0.62rem] text-ink-500">{genre.sort}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.78rem] text-ink-100">{genre.nameAr}</p>
                  <p className="text-[0.6rem] text-ink-500" dir="ltr">
                    /genre/{genre.slug} · {genre.nameEn}
                  </p>
                </div>
                <span className="num rounded-full bg-white/6 px-2 py-0.5 text-[0.6rem] text-ink-400">{genre.count} عملًا</span>
                <div className="w-40">
                  <GenreDeleteForm id={genre.id} nameAr={genre.nameAr} count={genre.count} options={options.filter((o) => o.id !== genre.id)} />
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="تصنيف جديد">
          <GenreForm />
          <p className="mt-3 text-[0.62rem] leading-4 text-ink-500">
            الرابط (slug) يُشتق من الاسم الإنجليزي مرة واحدة عند الإنشاء. تغيير الاسم الإنجليزي لاحقًا لا يغيّر الرابط المنشور.
          </p>
        </AdminCard>
      </div>
    </>
  );
}
