import { getDb, schema } from "@/db";
import { eq, sql } from "drizzle-orm";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * تحديد معدل الطلبات المخزَّن في قاعدة البيانات (يعمل على بيئات Serverless
 * بدون حالة داخلية). عند فشل قاعدة البيانات نرفض الطلب بأمان بدل السماح بلا حد.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date();
  try {
    const db = await getDb();
    const [existing] = await db
      .select()
      .from(schema.rateLimitEntries)
      .where(eq(schema.rateLimitEntries.key, key))
      .limit(1);

    if (!existing || existing.resetAt <= now) {
      await db
        .insert(schema.rateLimitEntries)
        .values({ key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) })
        .onConflictDoUpdate({
          target: schema.rateLimitEntries.key,
          set: { count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
        });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
      };
    }

    const [updated] = await db
      .update(schema.rateLimitEntries)
      .set({ count: sql`${schema.rateLimitEntries.count} + 1` })
      .where(eq(schema.rateLimitEntries.key, key))
      .returning({ count: schema.rateLimitEntries.count });

    return {
      ok: true,
      remaining: Math.max(0, limit - (updated?.count ?? existing.count + 1)),
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
    };
  } catch (error) {
    console.error("[loomix:rate-limit]", error);
    // سلوك آمن: تعطيل العملية عند تعطّل آلية الحماية المؤقتة.
    return { ok: false, remaining: 0, retryAfterSeconds: 30 };
  }
}

export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
