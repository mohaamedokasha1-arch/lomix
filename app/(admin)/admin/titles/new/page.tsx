import { AdminPageHeader } from "@/components/admin/page-header";
import { TitleForm } from "@/components/admin/title-form";
import { getAllGenres, getAllPeople } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewTitlePage() {
  const [genres, people] = await Promise.all([getAllGenres(), getAllPeople()]);

  return (
    <>
      <AdminPageHeader
        title="عمل جديد"
        description="أضف عملًا يدويًا. الحقول الفارغة لا تُخترع قيمًا — تبقى مخفية في الواجهة حتى تُوثَّق."
        breadcrumb={[
          { href: "/admin", label: "اللوحة" },
          { href: "/admin/titles", label: "الأعمال" },
        ]}
      />
      <TitleForm genres={genres} selectedGenres={[]} people={people} credits={[]} />
    </>
  );
}
