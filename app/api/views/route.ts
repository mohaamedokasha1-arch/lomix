import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { recordView } from "@/lib/queries";

export const runtime = "nodejs";

/** عدّاد مشاهدات حقيقي — محدود المعدل لمنع التضخيم الآلي. */
export async function POST(request: Request) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);

  let titleId: unknown;
  try {
    const body = (await request.json()) as { titleId?: unknown };
    titleId = body.titleId;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof titleId !== "string" || titleId.length < 8 || titleId.length > 64) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const limit = await rateLimit(`views:${ip}:${titleId}`, 3, 60 * 60);
  if (!limit.ok) return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });

  try {
    const db = await getDb();
    const [title] = await db
      .select({ id: schema.titles.id })
      .from(schema.titles)
      .where(eq(schema.titles.id, titleId))
      .limit(1);
    if (!title) return NextResponse.json({ ok: false }, { status: 404 });

    await recordView(titleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[loomix:views]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
