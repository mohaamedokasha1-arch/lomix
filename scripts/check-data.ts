/**
 * فحص سلامة البيانات — يتحقق من القواعد التي وُضعت لمنع الأرقام المُفترضة
 * والصفوف المكسورة. لا يعدّل شيئًا؛ يطبع تقريرًا ويخرج بكود 1 عند وجود أخطاء.
 *
 * التشغيل: npm run check:data
 */
import { config } from "dotenv";
config();

import { sql } from "drizzle-orm";
import { getDb } from "../db";

type Check = {
  name: string;
  sql: string;
  severity: "error" | "warning";
  hint: string;
};

const CHECKS: Check[] = [
  {
    name: "عمل منشور بلا رابط (slug)",
    sql: `select count(*)::int as count from titles where state = 'PUBLISHED' and (slug is null or length(trim(slug)) = 0)`,
    severity: "error",
    hint: "كل عمل منشور يحتاج رابطًا ثابتًا.",
  },
  {
    name: "عمل بلا وصف كافٍ",
    sql: `select count(*)::int as count from titles where length(trim(overview_ar)) < 10`,
    severity: "error",
    hint: "الوصف القصير يجعل الصفحة فقيرة للمستخدم وللفهرسة.",
  },
  {
    name: "تقييم بلا مصدر",
    sql: `select count(*)::int as count from titles where rating_value is not null and (rating_source is null or length(trim(rating_source)) = 0)`,
    severity: "error",
    hint: "سياسة §4: لا تقييم بدون مصدر مسجّل.",
  },
  {
    name: "تقييم خارج النطاق 0–10",
    sql: `select count(*)::int as count from titles where rating_value is not null and (rating_value < 0 or rating_value > 10)`,
    severity: "error",
    hint: "التقييم المعروض يفترض مقياسًا من 10.",
  },
  {
    name: "عمل منشور بلا صورة واحدة",
    sql: `select count(*)::int as count from titles where state = 'PUBLISHED' and poster_path is null and backdrop_path is null`,
    severity: "warning",
    hint: "الصفحة ستعمل لكن بدون صورة — أضف بوسترًا أو خلفية.",
  },
  {
    name: "عمل منشور بلا تاريخ نشر",
    sql: `select count(*)::int as count from titles where state = 'PUBLISHED' and published_at is null`,
    severity: "warning",
    hint: "يُستخدم في الترتيب «أحدث الإضافات».",
  },
  {
    name: "عمل منشور بلا تصنيف",
    sql: `select count(*)::int as count from titles t where t.state = 'PUBLISHED' and not exists (select 1 from title_genres tg where tg.title_id = t.id)`,
    severity: "warning",
    hint: "التصنيفات تُستخدم في الفلترة والأعمال المشابهة.",
  },
  {
    name: "نص بحث فارغ",
    sql: `select count(*)::int as count from titles where length(trim(search_text)) = 0`,
    severity: "error",
    hint: "بدون search_text لن يجد البحث هذا العمل.",
  },
  {
    name: "تكرار (الاسم العربي + السنة)",
    sql: `select count(*)::int as count from (select title_ar, release_year from titles group by title_ar, release_year having count(*) > 1) d`,
    severity: "error",
    hint: "قيد التفرد يجب أن يمنع هذا — تحقق من الهجرات المطبقة.",
  },
  {
    name: "تريلر بمعرّف غير صالح",
    sql: `select count(*)::int as count from trailers where not (youtube_id ~ '^[A-Za-z0-9_-]{11}$' or youtube_id like 'demo-%')`,
    severity: "error",
    hint: "معرّفات يوتيوب 11 حرفًا، والمعاينات التجريبية تبدأ بـ demo-.",
  },
  {
    name: "موسم مكرر داخل عمل",
    sql: `select count(*)::int as count from (select title_id, number from seasons group by title_id, number having count(*) > 1) d`,
    severity: "error",
    hint: "قيد التفرد (title_id, number).",
  },
  {
    name: "حلقة مكررة داخل موسم",
    sql: `select count(*)::int as count from (select season_id, number from episodes group by season_id, number having count(*) > 1) d`,
    severity: "error",
    hint: "قيد التفرد (season_id, number).",
  },
  {
    name: "حلقة يشير موسمها لعمل مفقود",
    sql: `select count(*)::int as count from episodes e left join seasons s on s.id = e.season_id where s.id is null`,
    severity: "error",
    hint: "سلامة المفاتيح الأجنبية.",
  },
  {
    name: "عنصر قائمة منسّقة يشير لعمل مفقود",
    sql: `select count(*)::int as count from curated_items ci left join titles t on t.id = ci.title_id where t.id is null`,
    severity: "error",
    hint: "سلامة المفاتيح الأجنبية.",
  },
  {
    name: "عنصر منسّق لعمل مسودة (لن يظهر)",
    sql: `select count(*)::int as count from curated_items ci join titles t on t.id = ci.title_id where t.state <> 'PUBLISHED'`,
    severity: "warning",
    hint: "القوائم تعرض المنشور فقط — نظّف العناصر أو انشر الأعمال.",
  },
  {
    name: "لا أقسام رئيسية ظاهرة",
    sql: `select case when count(*) = 0 then 1 else 0 end as count from home_sections where visible = true`,
    severity: "error",
    hint: "الصفحة الرئيسية ستظهر بدون أقسام.",
  },
  {
    name: "تريلر أساسي مكرر لنفس العمل",
    sql: `select count(*)::int as count from (select title_id from trailers where is_primary = true group by title_id having count(*) > 1) d`,
    severity: "warning",
    hint: "الأفضل تحديد تريلر أساسي واحد لكل عمل.",
  },
];

async function main() {
  const db = await getDb();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const check of CHECKS) {
    const result = (await db.execute(sql.raw(check.sql))) as unknown as { rows: { count: number }[] };
    const count = Number(result.rows[0]?.count ?? 0);
    if (count === 0) {
      console.log(`✓ ${check.name}`);
      continue;
    }
    const line = `${check.name}: ${count} — ${check.hint}`;
    if (check.severity === "error") {
      console.error(`✗ ${line}`);
      errors.push(line);
    } else {
      console.warn(`! ${line}`);
      warnings.push(line);
    }
  }

  const summary = (await db.execute(sql`
    select
      (select count(*)::int from titles) as titles,
      (select count(*)::int from titles where state = 'PUBLISHED') as published,
      (select count(*)::int from titles where is_demo = true) as demo,
      (select count(*)::int from seasons) as seasons,
      (select count(*)::int from episodes) as episodes,
      (select count(*)::int from trailers) as trailers,
      (select count(*)::int from people) as people,
      (select count(*)::int from users) as users
  `)) as unknown as { rows: Record<string, number>[] };

  const row = summary.rows[0] ?? {};
  console.log("\n— ملخص —");
  console.log(
    `الأعمال: ${row.titles ?? 0} (منشور ${row.published ?? 0}، تجريبي ${row.demo ?? 0}) · المواسم ${row.seasons ?? 0} · الحلقات ${row.episodes ?? 0} · التريلرات ${row.trailers ?? 0} · الأشخاص ${row.people ?? 0} · المستخدمون ${row.users ?? 0}`,
  );

  if (warnings.length) console.log(`\n${warnings.length} تحذيرًا — لا تمنع التشغيل لكنها تحتاج مراجعة.`);
  if (errors.length) {
    console.error(`\n${errors.length} خطأً في سلامة البيانات.`);
    process.exit(1);
  }
  console.log("\n✓ سلامة البيانات سليمة.");
  // إغلاق صريح: PGlite يُبقي مؤشر الحدث حيًّا إن لم نخرج.
  process.exit(0);
}

main().catch((error) => {
  console.error("✗ فشل فحص البيانات:", error instanceof Error ? error.message : error);
  process.exit(1);
});
