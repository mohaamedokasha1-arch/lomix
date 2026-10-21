import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  const withGaps: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) withGaps.push("gap");
    withGaps.push(p);
  });

  return (
    <nav aria-label="ترقيم الصفحات" className="mt-10 flex items-center justify-center gap-1.5">
      <Link
        href={buildHref(page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : 0}
        className={cn(
          "flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-ink-200 transition hover:border-white/25 hover:text-ink-50",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-3.5 w-3.5" /> السابق
      </Link>

      {withGaps.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-500" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "num flex h-9 w-9 items-center justify-center rounded-lg border text-xs transition",
              item === page
                ? "border-ember-400/50 bg-ember-400/15 font-bold text-ember-200"
                : "border-white/10 text-ink-200 hover:border-white/25 hover:text-ink-50",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={buildHref(page + 1)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : 0}
        className={cn(
          "flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-ink-200 transition hover:border-white/25 hover:text-ink-50",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        التالي <ChevronLeft className="h-3.5 w-3.5" />
      </Link>
    </nav>
  );
}
