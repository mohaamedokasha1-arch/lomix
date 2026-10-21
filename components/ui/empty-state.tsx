import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-ink-900/40 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-300">
          {icon}
        </div>
      )}
      <h3 className="display text-lg font-semibold text-ink-50">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-7 text-ink-300">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
