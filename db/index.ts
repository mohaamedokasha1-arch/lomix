import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type DbGlobal = {
  dbPromise?: Promise<Db>;
  driver?: "pglite" | "memory" | "postgres";
};

const globalForDb = globalThis as unknown as { __loomixDb?: DbGlobal };
const g: DbGlobal = (globalForDb.__loomixDb ??= {});

export function isLocalDatabase(url = process.env.DATABASE_URL ?? "") {
  return !url || url.startsWith("file:") || url.startsWith("pglite:");
}

/**
 * Vercel/Lambda: نظام الملفات للقراءة فقط إلا /tmp، ويُعاد بناء المجلد عند كل
 * بدء دالة. لذلك لا نحاول أبدًا إنشاء `.data/pglite` هناك (كان يسبب 500 بـ ENOENT).
 */
export function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL ?? "";

  if (isLocalDatabase(url) && isServerlessRuntime()) {
    // لا توجد قاعدة إنتاج مضبوطة: نُقلع PGlite في الذاكرة بالهجرات كاملة حتى لا
    // تنهار الصفحات، لكنها تُفقد عند كل بدء دالة. الخطأ يُسجَّل بوضوح ليُصلَح
    // بضبط DATABASE_URL في إعدادات Vercel (Neon/Postgres).
    console.error(
      "[loomix:db] DATABASE_URL غير مضبوط في Vercel — تعمل الصفحات على قاعدة مؤقتة في الذاكرة ولا تُحفظ البيانات. اضبط DATABASE_URL.",
    );
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const { join } = await import("node:path");
    const client = await PGlite.create();
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: join(process.cwd(), "db", "migrations") });
    g.driver = "memory";
    return db as unknown as Db;
  }

  if (isLocalDatabase(url)) {
    // تطوير محلي: PGlite — Postgres كامل (WASM) مع تخزين على القرص.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = process.env.PGLITE_DIR || ".data/pglite";
    const client = await PGlite.create(dir);
    g.driver = "pglite";
    return drizzle(client, { schema }) as unknown as Db;
  }

  // إنتاج: Postgres مُدار عبر اتصال Serverless-friendly.
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const client = postgres(url, {
    prepare: false, // مطلوب مع Poolers (Neon/Supabase/PgBouncer)
    max: 3, // اتصالات قليلة لكل دالة Serverless
    idle_timeout: 20,
    connect_timeout: 10,
  });
  g.driver = "postgres";
  return drizzle(client, { schema }) as unknown as Db;
}

/** يعيد نسخة قاعدة بيانات واحدة (singleton) متوافقة مع Postgres وPGlite. */
export function getDb(): Promise<Db> {
  g.dbPromise ??= createDb();
  return g.dbPromise;
}

export function dbDriver() {
  return g.driver ?? (isLocalDatabase() ? "pglite" : "postgres");
}

/** يمنع تكرار العمل عند تحميل الصفحة أكثر من مرة (HMR في التطوير). */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[loomix:db]", error instanceof Error ? error.message : error);
    return fallback;
  }
}

export { schema };
