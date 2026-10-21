import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * صيانة دورية (Cron يومي): حذف الصفوف المنتهية التي لا تُحذف تلقائيًا.
 *
 * - `sessions`: الجلسات المنتهية تُستبعد من القراءة لكن صفوفها تبقى.
 * - `rate_limit_entries`: نافذة كل مفتاح تنتهي، والصف يبقى بلا فائدة.
 * - `password_reset_tokens`: رموز منتهية أو مستعملة.
 * - `login_attempts`: نحتفظ بها 30 يومًا كأثر أمني ثم تُحذف.
 *
 * الحماية: لا يعمل المسار إلا إذا كان `CRON_SECRET` مضبوطًا، ويقارن الترويسة
 * `Authorization: Bearer <secret>` بمقارنة ثابتة الزمن. Vercel يرسل هذه الترويسة
 * تلقائيًا عند وجود المتغيّر. بلا المتغيّر نرفض (503) بدل ترك المسار مفتوحًا.
 */

const LOGIN_ATTEMPTS_RETENTION_DAYS = 30;

function secretMatches(header: string | null, secret: string) {
  if (!header) return false;
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided) return false;
  // مقارنة على بصمات ثابتة الطول: لا تكشف طول السر عبر فرق ردّ الفعل.
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET غير مضبوط — المهمة معطّلة." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const now = new Date();
  const attemptCutoff = new Date(now.getTime() - LOGIN_ATTEMPTS_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const db = await getDb();
    const [sessions, rateLimits, resetTokens, loginAttempts] = await Promise.all([
      db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now)).returning({ id: schema.sessions.id }),
      db
        .delete(schema.rateLimitEntries)
        .where(lt(schema.rateLimitEntries.resetAt, now))
        .returning({ key: schema.rateLimitEntries.key }),
      db
        .delete(schema.passwordResetTokens)
        .where(lt(schema.passwordResetTokens.expiresAt, now))
        .returning({ id: schema.passwordResetTokens.id }),
      db
        .delete(schema.loginAttempts)
        .where(lt(schema.loginAttempts.createdAt, attemptCutoff))
        .returning({ id: schema.loginAttempts.id }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        deleted: {
          sessions: sessions.length,
          rateLimits: rateLimits.length,
          resetTokens: resetTokens.length,
          loginAttempts: loginAttempts.length,
        },
        ranAt: now.toISOString(),
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[loomix:cron-maintenance]", error);
    return NextResponse.json(
      { ok: false, error: "تعذّرت الصيانة." },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
