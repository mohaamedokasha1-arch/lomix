"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterFacets = {
  genres: { slug: string; nameAr: string; count: number }[];
  years: { year: number; count: number }[];
  countries: { code: string; name: string; count: number }[];
  languages: { language: string; count: number }[];
};

const SORTS = [
  { value: "latest", label: "الأحدث إضافة" },
  { value: "rating", label: "الأعلى تقييمًا" },
  { value: "trending", label: "الأكثر تفاعلًا" },
  { value: "year", label: "سنة الإصدار" },
  { value: "title", label: "أبجديًا" },
];

export function FilterBar({
  facets,
  total,
  showSort = true,
  showSearch = true,
  lockedType,
}: {
  facets: FilterFacets;
  total: number;
  showSort?: boolean;
  showSearch?: boolean;
  lockedType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const activeCount = ["genre", "year", "country", "language", "rating", "q"].filter((k) => params.get(k)).length;

  const reset = () => {
    const next = new URLSearchParams();
    if (lockedType) next.set("type", lockedType);
    startTransition(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-3.5 backdrop-blur-sm md:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          {showSearch && (
            <form
              className="relative flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("q");
                update("q", String(value ?? "").trim());
              }}
              role="search"
            >
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                defaultValue={params.get("q") ?? ""}
                placeholder="ابحث بالاسم العربي أو الأصلي…"
                aria-label="البحث داخل القائمة"
                className="field ps-9"
              />
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="filter-genre">
              النوع
            </label>
            <select
              id="filter-genre"
              className="field w-auto min-w-32"
              value={params.get("genre") ?? ""}
              onChange={(e) => update("genre", e.target.value)}
            >
              <option value="">كل الأنواع</option>
              {facets.genres.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.nameAr} ({g.count})
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-year">
              السنة
            </label>
            <select
              id="filter-year"
              className="field w-auto min-w-24"
              value={params.get("year") ?? ""}
              onChange={(e) => update("year", e.target.value)}
            >
              <option value="">السنة</option>
              {facets.years.map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-country">
              الدولة
            </label>
            <select
              id="filter-country"
              className="field w-auto min-w-28"
              value={params.get("country") ?? ""}
              onChange={(e) => update("country", e.target.value)}
            >
              <option value="">الدولة</option>
              {facets.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-rating">
              أدنى تقييم
            </label>
            <select
              id="filter-rating"
              className="field w-auto min-w-28"
              value={params.get("rating") ?? ""}
              onChange={(e) => update("rating", e.target.value)}
            >
              <option value="">التقييم</option>
              <option value="8">8+</option>
              <option value="7">7+</option>
              <option value="6">6+</option>
            </select>

            {showSort && (
              <>
                <label className="sr-only" htmlFor="filter-sort">
                  الترتيب
                </label>
                <select
                  id="filter-sort"
                  className="field w-auto min-w-32"
                  value={params.get("sort") ?? "latest"}
                  onChange={(e) => update("sort", e.target.value)}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-2.5 text-xs text-ink-400">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="num font-semibold text-ink-200">{total}</span> عمل مطابق
            {pending && <Loader2 className="h-3 w-3 animate-spin" aria-label="جارٍ التحديث" />}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[0.7rem] transition hover:border-white/25 hover:text-ink-100",
              )}
            >
              <RotateCcw className="h-3 w-3" />
              إزالة الفلاتر ({activeCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
