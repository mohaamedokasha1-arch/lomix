import Link from "next/link";
import { PageHeader } from "@/components/titles/catalog-view";
import { formatDate } from "@/lib/utils";

export function LegalLayout({
  kicker,
  title,
  description,
  updatedAt,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-4xl pb-16 pt-28 md:pt-32">
      <PageHeader kicker={kicker} title={title} description={description} />
      {updatedAt && (
        <p className="mb-8 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[0.7rem] text-ink-400">
          آخر تحديث: {formatDate(updatedAt)}
        </p>
      )}
      <article className="space-y-8 text-sm leading-8 text-ink-300 [&_h2]:display [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-50 [&_h3]:mt-5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink-100 [&_li]:mt-1.5 [&_li]:leading-8 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink-100 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:ps-5">
        {children}
      </article>
      <nav className="mt-12 flex flex-wrap gap-2 border-t border-white/6 pt-6 text-[0.72rem]" aria-label="صفحات قانونية">
        {[
          { href: "/privacy-policy", label: "الخصوصية" },
          { href: "/terms", label: "الشروط" },
          { href: "/dmca", label: "حقوق الملكية" },
          { href: "/contact", label: "التواصل" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg border border-white/10 px-2.5 py-1 text-ink-300 transition hover:border-white/25 hover:text-ink-100">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
