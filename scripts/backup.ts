/**
 * نسخة احتياطية JSON من قاعدة البيانات.
 * التشغيل: npm run backup        (يكتب في backups/)
 *          npm run backup -- --out /path/file.json
 *
 * لا يحتوي الملف على أسرار البيئة؛ يحتوي صفوف الجداول فقط (ومنها تجزئات كلمات المرور).
 * تعامل معه كبيانات حساسة، ولا ترفعه إلى مستودع عام.
 */
import { config } from "dotenv";
config();

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

const TABLES = [
  "genres",
  "people",
  "titles",
  "title_genres",
  "credits",
  "seasons",
  "episodes",
  "trailers",
  "home_sections",
  "curated_lists",
  "curated_items",
  "site_settings",
  "users",
  "watchlist_items",
  "contact_messages",
  "media_assets",
  "audit_logs",
  "import_jobs",
] as const;

async function main() {
  const outIndex = process.argv.indexOf("--out");
  const explicit = outIndex !== -1 ? process.argv[outIndex + 1] : undefined;

  const db = await getDb();
  const data: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const result = (await db.execute(sql.raw(`select * from "${table}"`))) as unknown as { rows: unknown[] };
    data[table] = result.rows ?? [];
  }

  const payload = {
    meta: {
      app: "Loomix",
      version: 1,
      createdAt: new Date().toISOString(),
      tables: TABLES,
      counts: Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length])),
    },
    data,
  };

  const dir = path.join(process.cwd(), "backups");
  const filename = explicit ?? path.join(dir, `loomix-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, JSON.stringify(payload), "utf8");

  const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`✓ نسخة احتياطية: ${filename}`);
  console.log(`  ${Object.keys(data).length} جدولًا · ${total} صفًا`);
  console.log("  الملف يحتوي تجزئات كلمات المرور — احفظه في مكان آمن ولا ترفعه للمستودع.");
  // إغلاق صريح: PGlite يُبقي مؤشر الحدث حيًّا إن لم نخرج.
  process.exit(0);
}

main().catch((error) => {
  console.error("✗ فشل النسخ الاحتياطي:", error instanceof Error ? error.message : error);
  process.exit(1);
});
