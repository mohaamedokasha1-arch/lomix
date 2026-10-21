import { cn } from "@/lib/utils";

/** هيكل تحميل موحّد لصفحات القوائم — يُستخدم في loading.tsx لكل مسار قائمة. */
export function CatalogSkeleton({ cards = 12, filters = true }: { cards?: number; filters?: boolean }) {
  return (
    <div className="container-page pb-16 pt-28 md:pt-32" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="skeleton h-9 w-64 rounded-lg" />
      <div className="skeleton mt-4 h-3 w-full max-w-xl rounded" />
      <div className="skeleton mt-2 h-3 w-2/3 max-w-md rounded" />

      {filters && (
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={cn("skeleton h-9 rounded-full", index === 0 ? "w-24" : "w-20")} />
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-x-2.5 gap-y-5 sm:grid-cols-4 sm:gap-x-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index}>
            <div className="skeleton aspect-[2/3] w-full rounded-xl" />
            <div className="skeleton mt-3 h-3.5 w-3/4 rounded" />
            <div className="skeleton mt-2 h-2.5 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
