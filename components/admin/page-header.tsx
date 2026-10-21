import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function AdminPageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: { href: string; label: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="مسار الصفحة" className="mb-2 flex items-center gap-1 text-[0.68rem] text-ink-500">
            {breadcrumb.map((item) => (
              <span key={item.href} className="flex items-center gap-1">
                <Link href={item.href} className="transition hover:text-ink-200">
                  {item.label}
                </Link>
                <ChevronLeft className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
            ))}
          </nav>
        )}
        <h1 className="display text-2xl font-bold text-ink-50">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[0.8rem] leading-6 text-ink-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminCard({ title, description, children, actions }: { title?: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/8 bg-ink-900/50">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink-100">{title}</h2>}
            {description && <p className="mt-0.5 text-[0.7rem] text-ink-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  tone?: "default" | "accent" | "warning" | "danger";
}) {
  const toneClass =
    tone === "accent"
      ? "border-brass-400/25 bg-brass-400/[0.06]"
      : tone === "warning"
        ? "border-signal-amber/25 bg-signal-amber/[0.05]"
        : tone === "danger"
          ? "border-signal-red/25 bg-signal-red/[0.05]"
          : "border-white/8 bg-ink-900/50";

  const content = (
    <>
      <p className="text-[0.68rem] text-ink-400">{label}</p>
      <p className="num mt-1.5 text-2xl font-bold text-ink-50">{value}</p>
      {hint && <p className="mt-1 text-[0.62rem] text-ink-500">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`rounded-xl border p-4 transition hover:border-white/20 ${toneClass}`}>
        {content}
      </Link>
    );
  }
  return <div className={`rounded-xl border p-4 ${toneClass}`}>{content}</div>;
}
