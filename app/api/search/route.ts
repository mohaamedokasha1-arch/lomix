import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { searchSuggestions } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limit = await rateLimit(`search:${ip}`, 60, 60);
  if (!limit.ok) {
    return NextResponse.json({ results: [], error: "too_many_requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").slice(0, 80).trim();
  if (query.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await searchSuggestions(query, 7);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    console.error("[loomix:search]", error);
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 500 });
  }
}
