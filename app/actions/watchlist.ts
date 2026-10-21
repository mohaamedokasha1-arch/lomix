"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";

export type WatchlistResult = { ok: boolean; saved?: boolean; message: string; requiresAuth?: boolean };

export async function toggleWatchlistAction(titleId: string, slug?: string): Promise<WatchlistResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "سجّل الدخول لحفظ الأعمال في قائمتك.", requiresAuth: true };
  }

  const db = await getDb();
  const [existing] = await db
    .select({ id: schema.watchlistItems.id })
    .from(schema.watchlistItems)
    .where(and(eq(schema.watchlistItems.userId, user.id), eq(schema.watchlistItems.titleId, titleId)))
    .limit(1);

  if (existing) {
    await db.delete(schema.watchlistItems).where(eq(schema.watchlistItems.id, existing.id));
    revalidatePath("/watchlist");
    if (slug) revalidatePath(`/movie/${slug}`), revalidatePath(`/series/${slug}`);
    return { ok: true, saved: false, message: "أُزيل من قائمتك." };
  }

  await db.insert(schema.watchlistItems).values({ userId: user.id, titleId });
  revalidatePath("/watchlist");
  if (slug) revalidatePath(`/movie/${slug}`), revalidatePath(`/series/${slug}`);
  return { ok: true, saved: true, message: "أُضيف إلى قائمتك." };
}

export async function removeFromWatchlistAction(titleId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول." };
  const db = await getDb();
  await db
    .delete(schema.watchlistItems)
    .where(and(eq(schema.watchlistItems.userId, user.id), eq(schema.watchlistItems.titleId, titleId)));
  revalidatePath("/watchlist");
  return { ok: true, message: "أُزيل من القائمة." };
}
