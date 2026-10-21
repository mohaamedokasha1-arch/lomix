/**
 * فحص جاهزية النشر — لا يعدّل شيئًا.
 *
 * يتحقّق من: الأسرار، رابط قاعدة البيانات، بيانات الدخول التجريبية، صلاحية الحسابات
 * الإدارية، وجود الجداول، حالة المحتوى التجريبي، وإعدادات المسارات العامة.
 *
 * التشغيل:
 *   npm run preflight              # بيئة تطوير
 *   npm run preflight -- --prod    # فحص إنتاج (يتشدّد في الأسرار والبيانات التجريبية)
 */
import { config } from "dotenv";
config();

import { existsSync } from "node:fs";
import path from "node:path";
import { compare } from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

type Level = "error" | "warn" | "ok" | "info";
type Result = { level: Level; label: string; detail?: string };

const results: Result[] = [];
const add = (level: Level, label: string, detail?: string) => results.push({ level, label, detail });

const prod = process.argv.includes("--prod") || process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_ENV);
const env = process.env;

/* ─────────────────────────── الأسرار ─────────────────────────── */

const APP_SECRET_PLACEHOLDER = "change-me-to-a-long-random-string";
const secret = env.APP_SECRET?.trim() ?? "";
if (!secret) {
  add("error", "APP_SECRET غير مضبوط", "ولّد قيمة عشوائية 32 حرفًا على الأقل.");
} else if (secret.length < 32) {
  add("error", `APP_SECRET قصير (${secret.length} حرفًا)`, "المطلوب 32 حرفًا على الأقل.");
} else if (secret === APP_SECRET_PLACEHOLDER) {
  add(prod ? "error" : "warn", "APP_SECRET ما زال قيمة المثال", "استبدله بقيمة عشوائية حقيقية.");
} else {
  add("ok", "APP_SECRET مضبوط بطول كافٍ");
}

if (!env.SESSION_COOKIE_NAME?.trim()) {
  add("warn", "SESSION_COOKIE_NAME غير مضبوط", "سيُستخدم الافتراضي loomix_session.");
} else {
  add("ok", "SESSION_COOKIE_NAME مضبوط");
}

/* ─────────────────────────── محتوى حساس في متغيرات عامة ─────────────────────────── */

const publicSecrets = Object.keys(env).filter(
  (key) => key.startsWith("NEXT_PUBLIC_") && /secret|token|password|api[_-]?key/i.test(key),
);
if (publicSecrets.length) {
  add("error", "متغيّرات سرّية ببادئة NEXT_PUBLIC_", publicSecrets.join(", ") + " — تُرسل إلى المتصفح.");
} else {
  add("ok", "لا أسرار في متغيّرات NEXT_PUBLIC_*");
}

/* ─────────────────────────── قاعدة البيانات ─────────────────────────── */

const databaseUrl = env.DATABASE_URL?.trim() ?? "";
if (!databaseUrl) {
  add("error", "DATABASE_URL غير مضبوط");
} else if (databaseUrl.startsWith("pglite://")) {
  add(prod ? "error" : "ok", prod ? "PGlite في بيئة إنتاج" : "قاعدة البيانات: PGlite محلية", prod ? "ملفات PGlite على قرص مؤقت (Vercel) — استخدم Postgres مُدارًا." : undefined);
} else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  add("error", "صيغة DATABASE_URL غير معروفة", "المتوقع postgresql://… أو pglite://…");
} else {
  add("ok", "قاعدة بيانات Postgres عبر شبكة");
}

const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
if (!siteUrl) {
  add("error", "NEXT_PUBLIC_SITE_URL غير مضبوط", "يُستخدم في canonical وOG وsitemap.");
} else if (prod && /localhost|127\.0\.0\.1/.test(siteUrl)) {
  add("error", "NEXT_PUBLIC_SITE_URL يشير إلى localhost في الإنتاج", siteUrl);
} else {
  add("ok", "NEXT_PUBLIC_SITE_URL مضبوط", siteUrl);
}

if (prod && env.SHOW_DEMO_CREDENTIALS === "1") {
  add("error", "SHOW_DEMO_CREDENTIALS مفعّل في الإنتاج", "يعرض بريد المدير وكلمة مروره لكل زائر.");
} else if (env.SHOW_DEMO_CREDENTIALS === "1") {
  add("warn", "بيانات الدخول التجريبية معروضة في صفحة الدخول", "مناسب للعرض المحلي فقط.");
} else {
  add("ok", "بيانات الدخول التجريبية مخفية");
}

/* ─────────────────────────── كلمة مرور المدير ─────────────────────────── */

const DEMO_PASSWORDS = ["Loomix@2026", "Editor@2026", "Viewer@2026", "admin123", "password"];
const envAdminPassword = env.ADMIN_PASSWORD?.trim() ?? "";
if (envAdminPassword && DEMO_PASSWORDS.includes(envAdminPassword)) {
  add(prod ? "error" : "warn", "ADMIN_PASSWORD قيمة افتراضية معروفة", "غيّرها عبر npm run admin:password قبل النشر.");
} else if (envAdminPassword) {
  add("ok", "ADMIN_PASSWORD ليس من القيم الافتراضية");
}

/* ─────────────────────────── فحوص قاعدة البيانات ─────────────────────────── */

const fileChecks: [string, string, Level][] = [
  ["app/sitemap.ts", "مسار sitemap.xml موجود", "error"],
  ["app/robots.ts", "مسار robots.txt موجود", "error"],
  ["docs/DEPLOYMENT.md", "خطة النشر موثّقة", "warn"],
];

for (const [file, label, level] of fileChecks) {
  if (!existsSync(path.join(process.cwd(), file))) add(level, `ملف مفقود: ${file}`, label);
  else add("ok", label);
}

if (!existsSync(path.join(process.cwd(), "next.config.ts"))) {
  add("error", "next.config.ts مفقود");
}

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (blobToken) {
  add("ok", "تخزين الصور: Vercel Blob مُهيّأ");
} else if (prod) {
  add(
    "warn",
    "رفع الصور إلى قرص محلي في بيئة بلا تخزين دائم",
    "اربط مخزن Vercel Blob بالمشروع (BLOB_READ_WRITE_TOKEN) أو استخدم S3/R2 — انظر docs/DEPLOY-VERCEL.md §7.",
  );
} else if (!existsSync(uploadsDir)) {
  add("info", "مجلد public/uploads غير موجود بعد", "يُنشأ تلقائيًا عند أول رفع.");
} else {
  add("ok", "مجلد الرفع موجود (تخزين محلي)");
}

async function checkDatabase() {
  let db;
  try {
    db = await getDb();
    await db.execute(sql`select 1`);
  } catch (error) {
    add("error", "تعذّر الاتصال بقاعدة البيانات", error instanceof Error ? error.message.slice(0, 160) : String(error));
    return;
  }

  try {
    const tables = (await db.execute(
      sql`select count(*)::int as count from information_schema.tables where table_schema = 'public'`,
    )) as unknown as { rows?: { count: number }[] };
    const tableCount = Number(tables.rows?.[0]?.count ?? 0);
    if (tableCount < 15) add("error", `عدد الجداول قليل (${tableCount})`, "نفّذ npm run db:migrate.");
    else add("ok", `المخطط جاهز (${tableCount} جدولًا)`);

    const counts = (await db.execute(sql`
      select
        (select count(*)::int from titles) as titles,
        (select count(*)::int from seasons) as seasons,
        (select count(*)::int from episodes) as episodes,
        (select count(*)::int from people) as people,
        (select count(*)::int from users where role = 'ADMIN') as admins,
        (select count(*)::int from titles where is_demo) as demo
    `)) as unknown as { rows?: { titles: number; seasons: number; episodes: number; people: number; admins: number; demo: number }[] };
    const row = counts.rows?.[0];
    if (!row) {
      add("warn", "تعذّر قراءة إحصاءات المحتوى");
      return;
    }
    add("info", "المحتوى", `${row.titles} عملًا · ${row.seasons} موسمًا · ${row.episodes} حلقة · ${row.people} شخصًا`);
    if (Number(row.admins) === 0) add("error", "لا يوجد حساب مدير", "شغّل npm run db:seed أو أنشئ حسابًا من اللوحة.");
    else add("ok", `حساب إدارة موجود (${row.admins})`);

    if (Number(row.demo) > 0) {
      const notice = (await db.execute(
        sql`select value from site_settings where key = 'show_demo_notice'`,
      )) as unknown as { rows?: { value: string }[] };
      const noticeOn = notice.rows?.[0]?.value === "true";
      add(
        noticeOn ? "warn" : "error",
        `محتوى تجريبي: ${row.demo} عملًا`,
        noticeOn ? "اللافتة مفعّلة — نظّفه قبل الانطلاق (npm run db:reset يمسح كل شيء)." : "اللافتة مطفأة والمحتوى التجريبي ظاهر للجمهور!",
      );
    } else {
      add("ok", "لا محتوى تجريبي موسوم");
    }

    // هل تستخدم أي لوحة إدارة كلمة مرور تجريبية معروفة؟
    const users = (await db.execute(
      sql`select email, password_hash, role from users where role in ('ADMIN','EDITOR')`,
    )) as unknown as { rows?: { email: string; password_hash: string; role: string }[] };
    const weak: string[] = [];
    for (const user of users.rows ?? []) {
      for (const candidate of DEMO_PASSWORDS) {
        if (await compare(candidate, user.password_hash)) {
          weak.push(user.email);
          break;
        }
      }
    }
    if (weak.length) {
      add(prod ? "error" : "warn", "حساب إداري بكلمة مرور افتراضية", weak.join(", ") + " — بدّلها عبر npm run admin:password.");
    } else {
      add("ok", "لا حساب إداري بكلمة مرور تجريبية معروفة");
    }
  } catch (error) {
    add("error", "فشل فحص قاعدة البيانات", error instanceof Error ? error.message.slice(0, 160) : String(error));
  }
}

const ICON: Record<Level, string> = { error: "✖", warn: "!", ok: "✓", info: "·" };

async function main() {
  await checkDatabase();

  console.log(`\nفحص جاهزية Loomix — ${prod ? "إنتاج" : "تطوير"}\n`);
  for (const r of results) {
    const detail = r.detail ? `  ${r.detail}` : "";
    console.log(`  ${ICON[r.level]} ${r.label}${detail}`);
  }

  const errors = results.filter((r) => r.level === "error").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log(`\nالنتيجة: ${errors} خطأ · ${warns} تحذير\n`);
  if (errors) {
    console.log("لن يُنصح بالنشر قبل معالجة الأخطاء.\n");
    process.exit(1);
  }
  process.exit(0);
}

void main();
