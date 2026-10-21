/**
 * تنظيف المحتوى التجريبي (الموسوم `isDemo`) قبل الإطلاق.
 *
 *   npm run demo:flush                  # معاينة فقط: يعرض ما سيُحذف ثم يخرج بكود 1
 *   npm run demo:flush -- --yes         # تنفيذ الحذف
 *   npm run demo:flush -- --yes --people  # حذف الأشخاص التجريبيين أيضًا (بلا أرصدة)
 *
 * - لا يحذف إلا الأعمال الموسومة تجريبيًا؛ الحذف يتسلسل إلى المواسم والحلقات
 *   والتريلرات والطواقم والتصنيفات المرتبطة والمشاهدات وقوائم التحرير.
 * - `--people` اختياري: يحذف الأشخاص المطابقين لكتالوج البذرة **إن لم يبقَ لهم أي رصيد**.
 * - يطفئ `show_demo_notice` بعد التأكد من عدم بقاء أي عمل تجريبي.
 * - محمي: يرفض العمل في `NODE_ENV=production` إلا مع `FLUSH_DEMO=1`، ويسجّل العملية في سجل التدقيق.
 * - لا يحذف ملفات `public/art` (مرفوعة في المستودع)، فالصور تبقى للأعمال الحقيقية التي قد تستخدمها.
 *
 * التشغيل على PGlite يتطلب إيقاف الخادم أولًا (قاعدة بيانات أحادية العملية).
 */
import { config } from "dotenv";
config();

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { CATALOG } from "../db/catalog";
import { slugify } from "../lib/slug";

const args = process.argv.slice(2);
const confirmed = args.includes("--yes");
const withPeople = args.includes("--people");

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FLUSH_DEMO !== "1") {
    fail("رفض الحذف في NODE_ENV=production. للتنفيذ صراحةً: FLUSH_DEMO=1 npm run demo:flush -- --yes");
  }

  const db = await getDb();

  const [demo] = await db
    .select({
      demoTitles: sql<number>`count(*) filter (where ${schema.titles.isDemo})::int`,
      totalTitles: sql<number>`count(*)::int`,
      demoEpisodes: sql<number>`(select count(*)::int from episodes e join seasons s on s.id = e.season_id join titles t on t.id = s.title_id where t.is_demo)`,
      demoTrailers: sql<number>`(select count(*)::int from trailers tr join titles t on t.id = tr.title_id where t.is_demo)`,
      demoPeople: sql<number>`(select count(*)::int from people)`,
    })
    .from(schema.titles);

  const demoTitles = demo?.demoTitles ?? 0;
  if (!demoTitles) {
    console.log("· لا يوجد محتوى تجريبي موسوم — لا شيء يُحذف.");
    const [settings] = await db
      .select({ value: schema.siteSettings.value })
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "show_demo_notice"))
      .limit(1);
    if (settings?.value !== "false") {
      await db
        .insert(schema.siteSettings)
        .values({ key: "show_demo_notice", value: "false" })
        .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: "false", updatedAt: new Date() } });
      console.log("✓ أُطفئ شريط «محتوى تجريبي».");
    }
    process.exit(0);
  }

  console.log("سيُحذف:");
  console.log(`  · أعمال تجريبية: ${demoTitles} من ${demo?.totalTitles ?? 0}`);
  console.log(`  · مواسم/حلقات مرتبطة: ${demo?.demoEpisodes ?? 0} حلقة`);
  console.log(`  · تريلرات مرتبطة: ${demo?.demoTrailers ?? 0}`);
  if (withPeople) console.log(`  · أشخاص بلا أرصدة بعد الحذف (من كتالوج البذرة فقط)`);

  if (!confirmed) {
    console.log("\nلم يُحذف شيء. للتنفيذ: npm run demo:flush -- --yes");
    process.exit(1);
  }

  const ids = await db.select({ id: schema.titles.id }).from(schema.titles).where(eq(schema.titles.isDemo, true));
  const titleIds = ids.map((row) => row.id);

  await db.delete(schema.titles).where(inArray(schema.titles.id, titleIds));

  let removedPeople = 0;
  if (withPeople) {
    const slugs = [...new Set(CATALOG.flatMap((item) => item.credits.map((credit) => slugify(credit.nameEn))))];
    const candidates = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(
        and(
          inArray(schema.people.slug, slugs),
          sql`not exists (select 1 from credits c where c.person_id = ${schema.people.id})`,
        ),
      );
    if (candidates.length) {
      await db.delete(schema.people).where(inArray(schema.people.id, candidates.map((row) => row.id)));
      removedPeople = candidates.length;
    }
  }

  await db
    .insert(schema.siteSettings)
    .values({ key: "show_demo_notice", value: "false" })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: "false", updatedAt: new Date() } });

  await db.insert(schema.auditLogs).values({
    userId: null,
    action: "DEMO_FLUSH",
    entity: "catalog",
    entityId: null,
    details: { titles: titleIds.length, people: removedPeople, withPeople },
  });

  const [after] = await db
    .select({
      titles: sql<number>`count(*)::int`,
      demo: sql<number>`count(*) filter (where ${schema.titles.isDemo})::int`,
    })
    .from(schema.titles);

  console.log("\n✓ تم التنظيف:");
  console.log(`  · أُزيل ${titleIds.length} عملًا تجريبيًا`);
  if (withPeople) console.log(`  · أُزيل ${removedPeople} شخصًا تجريبيًا بلا أرصدة`);
  console.log(`  · المتبقي: ${after?.titles ?? 0} عملًا (منها ${after?.demo ?? 0} موسوم تجريبيًا)`);
  console.log("  · أُطفئ شريط «محتوى تجريبي» وسُجّلت العملية في التدقيق.");
  console.log("\nالخطوة التالية: npm run check:data");
  // PGlite يبقي حلقة الأحداث مفتوحة بعد إغلاق منطقي؛ الخروج صريحًا بعد إنهاء العمل.
  process.exit(0);
}

main().catch((error) => {
  console.error("✗ فشل تنظيف المحتوى التجريبي:", error instanceof Error ? error.message : error);
  process.exit(1);
});
