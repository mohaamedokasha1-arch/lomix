import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logAudit } from "@/lib/audit";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "loomix_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 أيام
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 ساعة لحسابات الإدارة
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** الجلسة الحالية — تُحسب مرة واحدة لكل طلب عبر cache(). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const db = await getDb();
    const [row] = await db
      .select({
        sessionId: schema.sessions.id,
        expiresAt: schema.sessions.expiresAt,
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        isActive: schema.users.isActive,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, new Date())))
      .limit(1);

    if (!row || !row.isActive) return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  } catch (error) {
    console.error("[loomix:session]", error);
    return null;
  }
});

export async function createSession(userId: string, role: SessionUser["role"]) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const ttl = role === "ADMIN" || role === "EDITOR" ? ADMIN_SESSION_TTL_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  const h = await headers();

  await db.insert(schema.sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
    ip: clientIpFromHeaders(h),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

/** إنهاء الجلسة على الخادم فورًا (لا يكفي حذف الكوكي في المتصفح). */
export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllUserSessions(userId: string) {
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; retryAfter?: number };

export async function loginWithPassword(emailInput: string, password: string): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const h = await headers();
  const ip = clientIpFromHeaders(h);

  const ipLimit = await rateLimit(`login:ip:${ip}`, 10, 60 * 10);
  if (!ipLimit.ok) {
    return { ok: false, error: "محاولات كثيرة من هذا الجهاز. حاول بعد قليل.", retryAfter: ipLimit.retryAfterSeconds };
  }
  const identifierLimit = await rateLimit(`login:id:${email}`, 8, 60 * 15);
  if (!identifierLimit.ok) {
    return { ok: false, error: "محاولات كثيرة على هذا الحساب. حاول لاحقًا.", retryAfter: identifierLimit.retryAfterSeconds };
  }

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  // مقارنة وهمية عند عدم وجود المستخدم لتقليل فرق التوقيت (timing).
  if (!user) {
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBp7cYJq0hGS5u2Zg0Jz0nJ0nJ0nJe");
    return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }

  if (!user.isActive) {
    return { ok: false, error: "هذا الحساب معطّل. تواصل مع الإدارة." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { ok: false, error: `الحساب مقفل مؤقتًا. حاول بعد ${minutes} دقيقة.` };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  await db.insert(schema.loginAttempts).values({ ip, email, success: valid });

  if (!valid) {
    const attempts = user.failedAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await db
      .update(schema.users)
      .set({
        failedAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
      })
      .where(eq(schema.users.id, user.id));

    await logAudit({
      userId: user.id,
      action: "LOGIN_FAILED",
      entity: "user",
      entityId: user.id,
      details: { attempts, locked: shouldLock },
      ip,
    });

    return {
      ok: false,
      error: shouldLock
        ? `تم قفل الحساب ${LOCK_MINUTES} دقيقة بعد محاولات فاشلة متكررة.`
        : "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  await db
    .update(schema.users)
    .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));

  await createSession(user.id, user.role);
  await logAudit({ userId: user.id, action: "LOGIN_SUCCESS", entity: "user", entityId: user.id, ip });

  return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("يجب تسجيل الدخول للمتابعة.", 401);
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new AuthError("لا تملك صلاحية الوصول إلى لوحة التحكم.", 403);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("هذه العملية تتطلب صلاحية مدير عام.", 403);
  return user;
}

export function canManageContent(role: SessionUser["role"]) {
  return role === "ADMIN" || role === "EDITOR";
}

export function isAdmin(role: SessionUser["role"]) {
  return role === "ADMIN";
}

/** مقارنة آمنة للرموز (reset / invites). */
export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function createPasswordResetToken(userId: string) {
  const db = await getDb();
  const token = randomBytes(24).toString("base64url");
  await db.insert(schema.passwordResetTokens).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  });
  return token;
}

export async function consumePasswordResetToken(token: string, newPassword: string) {
  const db = await getDb();
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false as const, error: "رابط الاستعادة غير صالح أو منتهي." };
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(schema.users).set({ passwordHash, failedAttempts: 0, lockedUntil: null }).where(eq(schema.users.id, row.userId));
  await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, row.id));
  await destroyAllUserSessions(row.userId);
  return { ok: true as const, userId: row.userId };
}

export async function cleanupExpiredSessions() {
  const db = await getDb();
  await db.delete(schema.sessions).where(sql`${schema.sessions.expiresAt} < now()`);
}
