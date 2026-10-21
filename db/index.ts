import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type DbGlobal = {
  dbPromise?: Promise<Db>;
  driver?: "pglite" | "postgres";
};

const globalForDb = globalThis as unknown as { __loomixDb?: DbGlobal };
const g: DbGlobal = (globalForDb.__loomixDb ??= {});

export function isLocalDatabase(url = process.env.DATABASE_URL ?? "") {
  return !url || url.startsWith("file:") || url.startsWith("pglite:");
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL ?? "";

  if (isLocalDatabase(url)) {
    // تطوير محلي: PGlite — Postgres كامل (WASM) مع تخزين على القرص.
    // لا يُستخدم في الإنتاج لأن ملفاته غير دائمة على بيئات Serverless.
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
