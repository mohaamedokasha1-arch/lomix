/**
 * تطبيق ملفات الهجرة على قاعدة البيانات الحالية.
 * محليًا: PGlite. في الإنتاج: Postgres عبر DATABASE_URL.
 */
import { isLocalDatabase, isServerlessRuntime } from "./index";

async function main() {
  const url = process.env.DATABASE_URL ?? "";

  // على Vercel (حتى أثناء البناء) يجب أن تكون DATABASE_URL مضبوطة.
  // بدونها نفشل بوضوح بدل أن نكتب قاعدة PGlite محلية على خادم البناء ونُبلغ بالنجاح.
  if (isServerlessRuntime() && isLocalDatabase(url)) {
    console.error("✗ DATABASE_URL غير مضبوط في Vercel — أضفه في Environment Variables (Production وPreview) ثم أعد النشر.");
    process.exit(1);
  }

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
