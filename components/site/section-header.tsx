import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  moreHref,
  moreLabel = "عرض الكل",
  id,
}: {
  title: string;
  subtitle?: string | null;
  moreHref?: string;
  moreLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="h-3.5 w-[3px] rounded-full bg-brass-400" aria-hidden="true" />
          <h2 id={id} className="display text-xl font-bold text-ink-50 md:text-2xl">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-[0.78rem] text-ink-400 md:text-sm">{subtitle}</p>}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-300 transition hover:text-brass-200"
        >
          {moreLabel}
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
