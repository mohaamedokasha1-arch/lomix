import { getDb, schema } from "@/db";
import { inArray } from "drizzle-orm";

export const SETTING_DEFAULTS = {
  site_name: "Loomix Film",
  site_name_ar: "لوميكس فيلم",
  tagline_ar: "دليل الاكتشاف السينمائي",
  meta_description:
    "لوميكس فيلم منصة عربية لاكتشاف الأفلام والمسلسلات والأنمي: بيانات دقيقة، تريلرات رسمية، وتجربة تصفح سينمائية هادئة.",
  contact_email: "hello@loomix.tv",
  twitter_url: "",
  instagram_url: "",
  youtube_url: "",
  telegram_url: "",
  footer_note: "لوميكس فيلم دليل اكتشاف سينمائي. لا يستضيف الموقع أي محتوى مصوّر كامل، والتريلرات تُعرض عبر روابط تضمين رسمية فقط.",
  seo_default_title: "{title} — لوميكس فيلم",
  seo_default_description: "{title} (سنة {year}) على لوميكس فيلم: القصة، الطاقم، التريلر الرسمي، وأعمال مشابهة.",
  seo_index_titles: "true",
  seo_index_genres: "true",
  seo_index_people: "true",
  seo_index_search: "false",
  show_demo_notice: "false",
  allow_registration: "true",
  trailers_mailto: "dmca@loomix.tv",
  // JSON مُتحقَّق منه في lib/navigation.ts — ليس HTML حرًّا.
  nav_config: '{"home":{"label":"الرئيسية","visible":true},"movies":{"label":"الأفلام","visible":true},"series":{"label":"المسلسلات","visible":true},"anime":{"label":"الأنمي","visible":true},"trailers":{"label":"التريلرات","visible":true}}',
  footer_links: '[{"label":"أحدث الإضافات","href":"/latest"},{"label":"الرائج الآن","href":"/trending"},{"label":"الأعلى تقييمًا","href":"/top-rated"},{"label":"الأكثر مشاهدة","href":"/most-viewed"}]',
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSettings<K extends SettingKey>(keys: K[]): Promise<Record<K, string>> {
  const result = { ...Object.fromEntries(keys.map((k) => [k, SETTING_DEFAULTS[k] as string])) } as Record<K, string>;
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: schema.siteSettings.key, value: schema.siteSettings.value })
      .from(schema.siteSettings)
      .where(inArray(schema.siteSettings.key, keys as unknown as string[]));
    for (const row of rows) {
      if (row.key in result) result[row.key as K] = row.value;
    }
  } catch (error) {
    console.error("[loomix:settings]", error);
  }
  return result;
}

export async function getAllSettings() {
  const keys = Object.keys(SETTING_DEFAULTS) as SettingKey[];
  return getSettings(keys);
}

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const db = await getDb();
  const entries = Object.entries(values).filter(([, v]) => typeof v === "string") as [SettingKey, string][];
  for (const [key, value] of entries) {
    await db
      .insert(schema.siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }
}
