import "server-only";
import { getSessionUser } from "@/lib/auth";
import { cachedRelated, cachedTitleBySlug, isInWatchlist } from "@/lib/queries";

/** يجهّز بيانات صفحة العمل العامة، ويرفض الأعمال غير المنشورة أو من نوع غير مطابق للمسار. */
export async function loadTitlePage(slug: string, allowedTypes?: ("MOVIE" | "SERIES" | "ANIME")[]) {
  const title = await cachedTitleBySlug(slug);
  if (!title || title.state !== "PUBLISHED") return null;
  if (allowedTypes && !allowedTypes.includes(title.type)) return null;

  const user = await getSessionUser();
  const [related, saved] = await Promise.all([
    cachedRelated(title.id, title.genres.map((g) => g.slug), 12),
    user ? isInWatchlist(user.id, title.id) : Promise.resolve(false),
  ]);

  return { title, related, saved, user };
}
