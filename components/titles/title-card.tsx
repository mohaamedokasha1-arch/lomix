import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import { TITLE_TYPE_LABEL, cn, formatNumber } from "@/lib/utils";
import type { TitleCard as TitleCardData } from "@/lib/queries";

const TYPE_ROUTE: Record<string, string> = { MOVIE: "/movie", SERIES: "/series", ANIME: "/anime" };

export function titleHref(title: Pick<TitleCardData, "type" | "slug">) {
  return `${TYPE_ROUTE[title.type] ?? "/movie"}/${title.slug}`;
}

type Props = {
  title: TitleCardData;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  showRank?: number;
  className?: string;
  disableLink?: boolean;
  action?: React.ReactNode;
};

const dims = {
  sm: "(max-width: 640px) 42vw, (max-width: 1024px) 24vw, 15vw",
  md: "(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw",
  lg: "(max-width: 640px) 55vw, (max-width: 1024px) 32vw, 22vw",
};

export function TitleCard({ title, priority, size = "md", showRank, className, action }: Props) {
  const href = titleHref(title);
  const isUnreleased = title.status === "UPCOMING";

  return (
    <article className={cn("group/card relative", className)}>
      <Link
        href={href}
        className="block rounded-xl outline-offset-4"
        aria-label={`${title.titleAr}${title.releaseYear ? ` — ${title.releaseYear}` : ""}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/8 bg-ink-800 shadow-card">
          {title.posterPath ? (
            <Image
              src={title.posterPath}
              alt={`بوستر ${title.titleAr}`}
              fill
              sizes={dims[size]}
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.045]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 text-xs text-ink-400">
              بلا بوستر
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/0 to-ink-950/0 opacity-80 transition-opacity duration-300 group-hover/card:opacity-95" />

          {/* شارات علوية */}
          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            <span className="glass-chip rounded-md px-1.5 py-0.5 text-[0.62rem] font-semibold text-ink-100">
              {TITLE_TYPE_LABEL[title.type]}
            </span>
            {/* التقييم يظهر فقط عند وجود قيمة ومصدر مسجّل — لا أرقام مُفترضة */}
            {title.ratingValue != null && title.ratingSource && (
              <span
                className="glass-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.62rem] font-bold text-brass-200"
                title={`المصدر: ${title.ratingSource}`}
              >
                <Star className="h-2.5 w-2.5 fill-brass-300 text-brass-300" aria-hidden="true" />
                <span className="num tabular">{title.ratingValue.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* ترتيب (للترند) */}
          {showRank !== undefined && (
            <span
              className="rank-number absolute -bottom-1 start-1 text-[2.6rem] opacity-90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              aria-hidden="true"
            >
              {showRank}
            </span>
          )}

          {/* طبقة التحويم */}
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brass-400 px-2.5 py-1 text-[0.68rem] font-bold text-[#171006]">
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              التفاصيل
            </span>
            <div className="mt-2 flex flex-wrap gap-1">
              {title.genres.slice(0, 2).map((g) => (
                <span key={g.slug} className="rounded bg-black/45 px-1.5 py-0.5 text-[0.6rem] text-ink-100 backdrop-blur-sm">
                  {g.nameAr}
                </span>
              ))}
            </div>
          </div>

          {isUnreleased && (
            <span className="absolute inset-x-2 bottom-2 rounded-md border border-signal-amber/30 bg-ink-950/80 px-1.5 py-0.5 text-center text-[0.6rem] font-semibold text-signal-amber backdrop-blur-sm group-hover/card:opacity-0">
              قريبًا
            </span>
          )}
        </div>

        <div className="mt-2.5 space-y-1 px-0.5">
          <h3 className="truncate text-[0.9rem] font-semibold leading-6 text-ink-50 transition-colors group-hover/card:text-brass-200">
            {title.titleAr}
          </h3>
          <p className="flex items-center gap-1.5 text-[0.72rem] text-ink-400">
            {title.releaseYear && <span className="num">{title.releaseYear}</span>}
            {title.releaseYear && title.runtimeMinutes ? <span aria-hidden="true">·</span> : null}
            {title.runtimeMinutes ? <span className="num">{title.runtimeMinutes} د</span> : null}
            {title.type !== "MOVIE" && !title.runtimeMinutes && <span>{TITLE_TYPE_LABEL[title.type]}</span>}
          </p>
        </div>
      </Link>
      {action && <div className="absolute end-2 top-2 z-10">{action}</div>}
    </article>
  );
}

export function TitleCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn("animate-pulse", size === "lg" && "max-w-[22rem]")}>
      <div className="skeleton aspect-[2/3] w-full rounded-xl" />
      <div className="skeleton mt-3 h-3.5 w-3/4 rounded" />
      <div className="skeleton mt-2 h-2.5 w-1/3 rounded" />
    </div>
  );
}

export function RatingPill({ value, source }: { value: number; source?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-brass-400/30 bg-brass-400/10 px-2 py-1 text-xs font-bold text-brass-200">
      <Star className="h-3 w-3 fill-brass-300 text-brass-300" aria-hidden="true" />
      <span className="num">{value.toFixed(1)}</span>
      {source && <span className="hidden text-[0.62rem] font-normal text-ink-400 sm:inline">/ {source}</span>}
    </span>
  );
}

export function ViewsPill({ views }: { views: number }) {
  if (!views) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.7rem] text-ink-300">
      {formatNumber(views)} مشاهدة
    </span>
  );
}
