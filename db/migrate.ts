/**
 * تطبيق ملفات الهجرة على قاعدة البيانات الحالية.
 * محليًا: PGlite. في الإنتاج: Postgres عبر DATABASE_URL.
 */
import { isLocalDatabase } from "./index";

async function main() {
  const url = process.env.DATABASE_URL ?? "";

  if (isLocalDatabase(url)) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = await PGlite.create(process.env.PGLITE_DIR || ".data/pglite");
    await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
    await client.close();
  } else {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 1, prepare: false });
    await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
    await client.end();
  }

  console.log("✓ تم تطبيق هجرات قاعدة البيانات بنجاح");
}

main().catch((error) => {
  console.error("✗ فشل تطبيق الهجرات:", error);
  process.exit(1);
});
