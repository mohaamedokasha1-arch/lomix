import Link from "next/link";
import Image from "next/image";
import { Eye, Plus, Search } from "lucide-react";
import { AdminPageHeader, AdminCard } from "@/components/admin/page-header";
import { getAdminTitleList } from "@/lib/admin-queries";
import { formatDate, formatNumber, TITLE_TYPE_LABEL } from "@/lib/utils";
import { TitleRowActions } from "@/components/admin/title-row-actions";
import { bulkTitleAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { value: "", label: "الكل" },
  { value: "MOVIE", label: "أفلام" },
  { value: "SERIES", label: "مسلسلات" },
  { value: "ANIME", label: "أنمي" },
];

const STATE_TABS = [
  { value: "", label: "كل الحالات" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "DRAFT", label: "مسودة" },
];

export default async function AdminTitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; state?: string; page?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { rows, total, totalPages } = await getAdminTitleList({
    query: params.q,
    type: params.type,
    state: params.state,
    page,
    perPage: 20,
  });

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, type: params.type, state: params.state, page: undefined, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, String(value));
    }
    const query = next.toString();
    return `/admin/titles${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="الأعمال"
        description={`${formatNumber(total)} عملًا في قاعدة البيانات — أفلام ومسلسلات وأنمي.`}
        actions={
          <>
            <Link href="/admin/imports/new" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
              استيراد جماعي
            </Link>
            <Link href="/admin/titles/bulk" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
              تحديث جماعي
            </Link>
            <Link href="/admin/titles/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ember-400 px-3.5 text-xs font-bold text-[#171006] hover:bg-ember-300">
              <Plus className="h-3.5 w-3.5" /> عمل جديد
            </Link>
          </>
        }
      />

      {params.deleted && (
        <p role="status" className="mb-4 rounded-lg border border-signal-teal/25 bg-signal-teal/[0.06] px-3 py-2 text-[0.72rem] text-signal-teal">
          حُذف العمل وسُجّلت العملية في سجل التتبع.
        </p>
      )}

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        {params.type && <input type="hidden" name="type" value={params.type} />}
        {params.state && <input type="hidden" name="state" value={params.state} />}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="ابحث بالاسم العربي أو الأصلي…"
            className="field h-9 pe-9 text-xs"
            aria-label="بحث في الأعمال"
          />
        </div>
        <button type="submit" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
          بحث
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-white/8 bg-ink-900/40 p-1">
        {TYPE_TABS.map((tab) => {
          const active = (params.type ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={buildHref({ type: tab.value || undefined })}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-[0.7rem] transition ${active ? "bg-white/10 text-ink-50" : "text-ink-400 hover:text-ink-100"}`}
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="mx-1 w-px bg-white/10" aria-hidden="true" />
        {STATE_TABS.map((tab) => {
          const active = (params.state ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={buildHref({ state: tab.value || undefined })}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-[0.7rem] transition ${active ? "bg-white/10 text-ink-50" : "text-ink-400 hover:text-ink-100"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-ink-300">لا نتائج مطابقة.</p>
            <p className="mt-1 text-[0.7rem] text-ink-500">جرّب تعديل البحث أو أضف عملًا جديدًا.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-[0.75rem]">
                <thead>
                  <tr className="border-b border-white/8 text-[0.65rem] text-ink-500">
                    <th className="w-8 py-2" />
                    <th className="py-2 text-start font-medium">العمل</th>
                    <th className="py-2 text-start font-medium">النوع</th>
                    <th className="py-2 text-start font-medium">السنة</th>
                    <th className="py-2 text-start font-medium">الحالة</th>
                    <th className="py-2 text-start font-medium">المشاهدات</th>
                    <th className="py-2 text-start font-medium">آخر تحديث</th>
                    <th className="py-2 text-start font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          name="ids"
                          value={row.id}
                          form="bulk-titles"
                          className="h-3.5 w-3.5 accent-ember-400"
                          aria-label={`تحديد ${row.titleAr}`}
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-ink-800">
                            {row.posterPath && <Image src={row.posterPath} alt="" fill sizes="32px" className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/titles/${row.id}`} className="block truncate font-medium text-ink-100 hover:text-ember-200">
                              {row.titleAr}
                            </Link>
                            <p className="truncate text-[0.62rem] text-ink-500" dir="ltr">
                              {row.titleEn ?? row.slug}
                              {row.isDemo && <span className="ms-1 text-signal-amber">· تجريبي</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-ink-300">{TITLE_TYPE_LABEL[row.type] ?? row.type}</td>
                      <td className="num py-2 text-ink-400">{row.releaseYear ?? "—"}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[0.62rem] ${
                            row.state === "PUBLISHED" ? "bg-signal-teal/12 text-signal-teal" : "bg-white/8 text-ink-400"
                          }`}
                        >
                          {row.state === "PUBLISHED" ? "منشور" : "مسودة"}
                        </span>
                      </td>
                      <td className="num py-2 text-ink-400">{formatNumber(row.viewsCount)}</td>
                      <td className="py-2 text-[0.65rem] text-ink-500">{formatDate(row.updatedAt)}</td>
                      <td className="py-2">
                        <TitleRowActions id={row.id} state={row.state} titleAr={row.titleAr} />
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* نموذج العمليات الجماعية منفصل لتجنب تعشيش النماذج */}
      <form id="bulk-titles" action={bulkTitleAction} className="mt-3 flex flex-wrap items-center gap-2">
        <select name="bulkAction" className="field h-9 w-44 text-xs" aria-label="العملية الجماعية" required>
          <option value="">— عملية جماعية —</option>
          <option value="publish">نشر المحدد</option>
          <option value="draft">تحويل إلى مسودة</option>
          <option value="delete">حذف المحدد</option>
        </select>
        <button type="submit" className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-xs text-ink-100 hover:border-white/30">
          تطبيق على المحدد
        </button>
        <span className="text-[0.62rem] text-ink-500">حدّد الصفوف من مربعات الاختيار ثم طبّق.</span>
      </form>

      {totalPages > 1 && (
        <nav aria-label="صفحات الأعمال" className="mt-5 flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <Link href={buildHref({ page: String(page - 1) })} className="rounded border border-white/12 px-3 py-1.5 text-ink-200 hover:border-white/25">
              السابق
            </Link>
          )}
          <span className="num px-2 text-ink-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildHref({ page: String(page + 1) })} className="rounded border border-white/12 px-3 py-1.5 text-ink-200 hover:border-white/25">
              التالي
            </Link>
          )}
        </nav>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[0.62rem] text-ink-500">
        <Eye className="h-3 w-3" /> كل الإجراءات تُسجَّل في سجل العمليات مع هوية المنفّذ.
      </p>
    </>
  );
}
