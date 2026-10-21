/**
 * تعيين/تغيير كلمة مرور حساب مدير.
 * التشغيل:
 *   npm run admin:password -- admin@example.com "كلمة-مرور-قوية"
 *
 * - يُنشئ الحساب إن لم يكن موجودًا (دور ADMIN، نشط).
 * - إن كان موجودًا: يحدّث كلمة المرور والدور ويُبقي الاسم.
 * - يُبطل كل الجلسات النشطة للحساب (تسجيل خروج قسري بعد التغيير).
 * لا تُطبع كلمة المرور ولا التجزئة في أي مخرَج.
 */
import { config } from "dotenv";
config();

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "../db";

const MAX_BCRYPT_BYTES = 72;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  const [emailArg, password] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail("الاستخدام: npm run admin:password -- <email> \"<password>\"");
  }
  if (!password) fail("كلمة المرور مطلوبة.");
  if (password.length < 10) fail("كلمة المرور يجب أن تكون 10 أحرف على الأقل.");
  if (Buffer.byteLength(password, "utf8") > MAX_BCRYPT_BYTES) {
    fail("كلمة المرور أطول من الحد الذي يقبله bcrypt (72 بايت).");
  }
  if (["password", "123456789", "loomix2026"].includes(password.toLowerCase())) {
    fail("كلمة المرور شائعة جدًا — اختر كلمة أقوى.");
  }

  const db = await getDb();
  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME?.trim() || "مدير Loomix";

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (existing) {
    await db
      .update(schema.users)
      .set({ passwordHash, role: "ADMIN", isActive: true })
      .where(eq(schema.users.id, existing.id));
    const removed = await db.delete(schema.sessions).where(eq(schema.sessions.userId, existing.id));
    await db.insert(schema.auditLogs).values({
      userId: existing.id,
      action: "PASSWORD_RESET_CLI",
      entity: "user",
      entityId: existing.id,
      details: { via: "scripts/set-admin-password.ts" },
      ip: null,
    });
    console.log(`✓ حُدّثت كلمة مرور ${email} (دور ADMIN) وأُبطلت الجلسات السابقة.`);
    void removed;
  } else {
    const [created] = await db
      .insert(schema.users)
      .values({ name, email, role: "ADMIN", passwordHash, isActive: true })
      .returning({ id: schema.users.id });
    await db.insert(schema.auditLogs).values({
      userId: created.id,
      action: "USER_CREATE_CLI",
      entity: "user",
      entityId: created.id,
      details: { via: "scripts/set-admin-password.ts", role: "ADMIN" },
      ip: null,
    });
    console.log(`✓ أُنشئ حساب مدير جديد: ${email}`);
  }

  const adminCount = (await db.execute(
    sql`select count(*)::int as count from ${schema.users} where role = 'ADMIN'`,
  )) as unknown as { rows: { count: number }[] };
  const count = Number(adminCount.rows[0]?.count ?? 0);

  console.log(`  عدد حسابات المدير الحالية: ${count}`);
  console.log("  لا تُشارك كلمة المرور في أي قناة، وغيّرها فور الاشتباه في تسريبها.");
  // إغلاق صريح: PGlite يُبقي مؤشر الحدث حيًّا إن لم نخرج.
  process.exit(0);
}

main().catch((error) => {
  console.error("✗ فشل تعيين كلمة المرور:", error instanceof Error ? error.message : error);
  process.exit(1);
});
