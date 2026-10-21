import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

const ARABIC_MAP: Record<string, string> = {
  ء: "ا", آ: "ا", أ: "ا", إ: "ا", ٱ: "ا",
  ة: "ه", ى: "ي", ئ: "ي", ؤ: "و",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** يوحّد الحروف العربية لتفادي اختلاف الأشكال في الروابط والبحث. */
export function normalizeArabic(input: string) {
  return input
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // تشكيل وتطويل
    .split("")
    .map((ch) => ARABIC_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .trim();
}

/** slug آمن يدعم العربية والإنجليزية (يُستخدم في الروابط الثابتة). */
export function slugify(input: string, maxLength = 80) {
  const normalized = normalizeArabic(input)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized.slice(0, maxLength).replace(/-+$/, "") || "untitled";
}

/** يضمن تفرّد الرابط داخل الجدول. */
export async function uniqueSlug(base: string, table: "titles" | "people" | "genres", excludeId?: string) {
  const db = await getDb();
  const model =
    table === "titles" ? schema.titles : table === "people" ? schema.people : schema.genres;
  let candidate = slugify(base);
  let suffix = 2;

  for (;;) {
    const rows = await db
      .select({ id: model.id })
      .from(model)
      .where(eq(model.slug, candidate))
      .limit(1);
    const taken = rows.some((row) => row.id !== excludeId);
    if (!taken) return candidate;
    candidate = `${slugify(base, 70)}-${suffix++}`;
    if (suffix > 500) return `${slugify(base, 60)}-${Date.now().toString(36)}`;
  }
}

/** نص البحث الموحّد: عربي + إنجليزي في حقل واحد. */
export function buildSearchText(parts: (string | null | undefined)[]) {
  return normalizeArabic(parts.filter(Boolean).join(" "));
}
