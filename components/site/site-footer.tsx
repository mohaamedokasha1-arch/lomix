import Link from "next/link";
import { AtSign, Camera, Mail, Play, Send } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getAllSettings } from "@/lib/settings";
import { cachedFooterData } from "@/lib/queries-extra";
import { getFooterSectionLinks } from "@/lib/navigation";

const COLUMNS = [
  {
    title: "اكتشف",
    links: [
      { href: "/movies", label: "أفلام" },
      { href: "/series", label: "مسلسلات" },
      { href: "/anime", label: "أنمي" },
      { href: "/trailers", label: "التريلرات" },
    ],
  },
  {
    title: "لوميكس",
    links: [
      { href: "/contact", label: "التواصل والدعم" },
      { href: "/dmca", label: "حقوق الملكية (DMCA)" },
      { href: "/privacy-policy", label: "سياسة الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
    ],
  },
];

export async function SiteFooter() {
  const [settings, meta, sectionLinks] = await Promise.all([getAllSettings(), cachedFooterData(), getFooterSectionLinks()]);
  // عمود «أقسام» يأتي من إعدادات التنقل، والبقية ثابتة لأنها صفحات قانونية/أساسية.
  const columns = [COLUMNS[0]!, { title: "أقسام", links: sectionLinks }, COLUMNS[1]!];
  const socials = [
    { href: settings.twitter_url, label: "X / تويتر", Icon: AtSign },
    { href: settings.instagram_url, label: "إنستغرام", Icon: Camera },
    { href: settings.youtube_url, label: "يوتيوب", Icon: Play },
    { href: settings.telegram_url, label: "تيليغرام", Icon: Send },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t border-white/8 bg-ink-950">
      {meta.hasDemo && meta.showDemoNotice && (
        <div className="border-b border-brass-400/15 bg-brass-400/[0.06]">
          <div className="container-page flex flex-col gap-1 py-3 text-[0.72rem] leading-6 text-brass-200/90 sm:flex-row sm:items-center sm:justify-between">
            <span>
              نسخة عرض تجريبية: الأعمال المعروضة خيالية وأصلية، والبوسترات مُولّدة داخل المشروع — لا تحتوي أي مادة محمية.
            </span>
            <Link href="/admin/settings" className="shrink-0 underline decoration-brass-400/40 underline-offset-4 hover:text-brass-100">
              إخفاء اللافتة
            </Link>
          </div>
        </div>
      )}

      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size={34} />
            <p className="mt-5 max-w-sm text-sm leading-7 text-ink-300">{settings.meta_description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-200 transition hover:border-brass-400/40 hover:text-brass-200"
              >
                <Mail className="h-3.5 w-3.5" />
                <span dir="ltr">{settings.contact_email}</span>
              </a>
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-ink-300 transition hover:border-brass-400/40 hover:text-brass-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[0.68rem] font-semibold tracking-[0.24em] text-ink-500">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-300 transition-colors hover:text-ink-50">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 max-w-4xl border-t border-white/6 pt-8 text-[0.72rem] leading-6 text-ink-500">
          {settings.footer_note}
        </p>

        <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/6 pt-6 text-[0.7rem] text-ink-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} لوميكس. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="num">{meta.titleCount} عمل</span>
            <span aria-hidden="true">·</span>
            <Link href="/dmca" className="transition hover:text-ink-200">
              الإبلاغ عن محتوى
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/contact" className="transition hover:text-ink-200">
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
