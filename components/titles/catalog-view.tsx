import { SearchX } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import { FilterBar, type FilterFacets } from "@/components/titles/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import type { TitleCard as TitleCardData } from "@/lib/queries";

export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-7 border-b border-white/6 pb-6">
      {kicker && <p className="mb-2.5 text-[0.65rem] font-semibold tracking-[0.28em] text-brass-300/80">{kicker}</p>}
      <h1 className="display text-3xl font-bold text-ink-50 md:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-300">{description}</p>}
      {children}
    </header>
  );
}

export function PosterGrid({ items }: { items: TitleCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((item, index) => (
        <TitleCard key={item.id} title={item} priority={index < 6} />
      ))}
    </div>
  );
}

export function CatalogView({
  items,
  total,
  page,
  totalPages,
  facets,
  basePath,
  params,
  showSort = true,
  showSearch = true,
  lockedType,
  emptyTitle = "لا توجد نتائج مطابقة",
  emptyDescription = "جرّب تعديل الفلاتر أو البحث بكلمة أخرى. يمكنك أيضًا تصفح الأعمال الرائجة للبدء من مكان آخر.",
}: {
  items: TitleCardData[];
  total: number;
  page: number;
  totalPages: number;
  facets: FilterFacets;
  basePath: string;
  params: Record<string, string | undefined>;
  showSort?: boolean;
  showSearch?: boolean;
  lockedType?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const buildHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") sp.set(key, value);
    });
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <FilterBar facets={facets} total={total} showSort={showSort} showSearch={showSearch} lockedType={lockedType} />

      <div className="mt-7">
        {items.length ? (
          <PosterGrid items={items} />
        ) : (
          <EmptyState
            icon={<SearchX className="h-5 w-5" />}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink href="/trending" variant="secondary" size="sm">
                  الأعمال الرائجة
                </ButtonLink>
                <ButtonLink href={basePath} variant="ghost" size="sm">
                  مسح الفلاتر
                </ButtonLink>
              </div>
            }
          />
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </>
  );
}
