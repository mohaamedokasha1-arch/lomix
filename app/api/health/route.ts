import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * فحص صحة بسيط لمراقبة التشغيل (uptime monitor / منصة النشر).
 * - لا يكشف أي سر أو نص خطأ داخلي: الحالة فقط.
 * - لا يُخزَّن مؤقتًا، ومحركات البحث لا تفهرسه.
 * - الاستعلام خفيف (`select 1`) ولا يمسّ جداول المحتوى.
 */
export async function GET() {
  const startedAt = Date.now();
  let db: "up" | "down" = "down";

  try {
    const client = await getDb();
    await client.execute(sql`select 1`);
    db = "up";
  } catch {
    db = "down";
  }

  const body = {
    status: db === "up" ? "ok" : "degraded",
    db,
    uptimeMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: db === "up" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
