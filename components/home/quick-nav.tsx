import Link from "next/link";

type Chip = { href: string; label: string; count?: number };

/**
 * شريط تصفح سريع أفقي: الأنواع الأساسية ثم أكثر التصنيفات عددًا.
 * كل عنصر رابط عادي، ويعمل بالكيبورد بدون سكربت.
 */
export function QuickNav({ genres }: { genres: { slug: string; nameAr: string; count: number }[] }) {
  const types: Chip[] = [
    { href: "/movies", label: "أفلام" },
    { href: "/series", label: "مسلسلات" },
    { href: "/anime", label: "أنمي" },
    { href: "/trailers", label: "تريلرات" },
    { href: "/latest", label: "الأحدث" },
    { href: "/top-rated", label: "الأعلى تقييمًا" },
  ];
  const genreChips: Chip[] = [...genres]
    .sort((a, b) => b.count - a.count)
    .slice(0, 14)
    .map((g) => ({ href: `/genre/${g.slug}`, label: g.nameAr, count: g.count }));

  return (
    <nav aria-label="تصفح سريع" className="border-b border-white/8 bg-ink-950/80">
      <div className="container-page no-scrollbar flex gap-2 overflow-x-auto py-3">
        {[...types, ...genreChips].map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-[0.78rem] text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
          >
            {chip.label}
            {chip.count !== undefined && <span className="num text-[0.65rem] text-ink-500">{chip.count}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
