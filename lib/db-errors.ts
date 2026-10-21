/**
 * أخطاء قاعدة البيانات تصل مغلّفة: Drizzle يضع الخطأ الأصلي في `cause`
 * ورسالته السطحية «Failed query: …» لا تحتوي كلمة unique. لذلك نفتّش السلسلة
 * كلها عن رمز Postgres 23505 أو عن نص القيد الفريد.
 */
type ErrorLike = { code?: unknown; message?: unknown; cause?: unknown };

export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (typeof current !== "object") return false;
    const candidate = current as ErrorLike;
    if (candidate.code === "23505") return true;
    if (typeof candidate.message === "string" && /duplicate key|unique constraint/i.test(candidate.message)) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}
