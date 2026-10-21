import "server-only";
import { getSettings } from "@/lib/settings";

/**
 * التنقل الرئيسي: المسارات ثابتة في الكود (لا يمكن للمحرر إدخال رابط خارجي أو
 * مسار مكسور)، لكن العنوان والظهور قابلان للتحكم من اللوحة.
 */
export const NAV_BLUEPRINT = [
  { key: "home", href: "/", label: "الرئيسية" },
  { key: "movies", href: "/movies", label: "الأفلام" },
  { key: "series", href: "/series", label: "المسلسلات" },
  { key: "anime", href: "/anime", label: "الأنمي" },
  { key: "trailers", href: "/trailers", label: "التريلرات" },
] as const;

export type NavKey = (typeof NAV_BLUEPRINT)[number]["key"];
export type NavItem = { key: NavKey; href: string; label: string; visible: boolean };

export type FooterLink = { label: string; href: string };

export const FOOTER_LINK_DEFAULTS: FooterLink[] = [
  { label: "أحدث الإضافات", href: "/latest" },
  { label: "الرائج الآن", href: "/trending" },
  { label: "الأعلى تقييمًا", href: "/top-rated" },
  { label: "الأكثر مشاهدة", href: "/most-viewed" },
];

/** مسارات داخلية فقط، بلا بروتوكول أو `//` (منع إعادة التوجيه المفتوح). */
export function isSafeInternalPath(value: string) {
  return /^\/(?!\/)[A-Za-z0-9\-_/]*$/.test(value.trim());
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getNavigation(): Promise<NavItem[]> {
  const settings = await getSettings(["nav_config"]);
  const parsed = parseJson(settings.nav_config);
  const stored = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};

  return NAV_BLUEPRINT.map((item) => {
    const entry = stored[item.key];
    const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const label = typeof record.label === "string" && record.label.trim() ? record.label.trim().slice(0, 24) : item.label;
    const visible = typeof record.visible === "boolean" ? record.visible : true;
    return { key: item.key, href: item.href, label, visible };
  });
}

export async function getFooterSectionLinks(): Promise<FooterLink[]> {
  const settings = await getSettings(["footer_links"]);
  const parsed = parseJson(settings.footer_links);
  if (!Array.isArray(parsed)) return FOOTER_LINK_DEFAULTS;

  const links = parsed
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    .map((entry) => ({
      label: typeof entry.label === "string" ? entry.label.trim().slice(0, 40) : "",
      href: typeof entry.href === "string" ? entry.href.trim().slice(0, 120) : "",
    }))
    .filter((link) => link.label.length > 0 && isSafeInternalPath(link.href))
    .slice(0, 10);

  return links.length ? links : FOOTER_LINK_DEFAULTS;
}

/** يحوّل ما يرسله النموذج إلى JSON صالح للتحقق قبل الحفظ. */
export function buildNavConfig(entries: { key: string; label: string; visible: boolean }[]) {
  const config: Record<string, { label: string; visible: boolean }> = {};
  for (const item of NAV_BLUEPRINT) {
    const entry = entries.find((row) => row.key === item.key);
    config[item.key] = {
      label: entry?.label.trim().slice(0, 24) || item.label,
      visible: entry ? entry.visible : true,
    };
  }
  return JSON.stringify(config);
}

export function buildFooterLinks(links: FooterLink[]) {
  return JSON.stringify(
    links
      .map((link) => ({ label: link.label.trim().slice(0, 40), href: link.href.trim().slice(0, 120) }))
      .filter((link) => link.label.length > 0 && isSafeInternalPath(link.href))
      .slice(0, 10),
  );
}
