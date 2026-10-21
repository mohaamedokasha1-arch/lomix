"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { destroyCurrentSession, hashPassword, loginWithPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { safeNextPath } from "@/lib/utils";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email.trim())) fieldErrors.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (password.length < 8) fieldErrors.password = "كلمة المرور 8 أحرف على الأقل.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const result = await loginWithPassword(email, password);
  if (!result.ok) return { error: result.error };

  redirect(result.user.role === "VIEWER" ? next : next === "/" ? "/admin" : next);
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const accept = formData.get("accept");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "الاسم قصير جدًا.";
  if (name.length > 80) fieldErrors.name = "الاسم طويل جدًا.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (password.length < 8) fieldErrors.password = "كلمة المرور 8 أحرف على الأقل.";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    fieldErrors.password = "استخدم أحرفًا وأرقامًا معًا.";
  if (password !== confirm) fieldErrors.confirm = "كلمتا المرور غير متطابقتين.";
  if (!accept) fieldErrors.accept = "يجب الموافقة على شروط الاستخدام.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limit = await rateLimit(`register:ip:${ip}`, 5, 60 * 30);
  if (!limit.ok) return { error: "تم إنشاء حسابات كثيرة من هذا الجهاز. حاول لاحقًا." };

  const db = await getDb();
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return { fieldErrors: { email: "هذا البريد مستخدم بالفعل." } };

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({ email, name, passwordHash, role: "VIEWER" })
    .returning({ id: schema.users.id });

  await logAudit({ userId: user.id, action: "REGISTER", entity: "user", entityId: user.id, ip });
  await loginWithPassword(email, password);
  redirect("/");
}

export async function logoutAction() {
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAllAction() {
  const { requireUser, destroyAllUserSessions } = await import("@/lib/auth");
  const user = await requireUser();
  await destroyAllUserSessions(user.id);
  await destroyCurrentSession();
  redirect("/login");
}

export type ProfileState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { requireUser } = await import("@/lib/auth");
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { fieldErrors: { name: "الاسم بين 2 و80 حرفًا." } };

  const db = await getDb();
  await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
  await logAudit({ userId: user.id, action: "PROFILE_UPDATE", entity: "user", entityId: user.id });
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { requireUser, verifyPassword, hashPassword, destroyAllUserSessions, destroyCurrentSession } = await import("@/lib/auth");
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8) return { fieldErrors: { next: "كلمة المرور الجديدة 8 أحرف على الأقل." } };
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return { fieldErrors: { next: "استخدم أحرفًا وأرقامًا معًا." } };
  if (next !== confirm) return { fieldErrors: { confirm: "كلمتا المرور غير متطابقتين." } };

  const db = await getDb();
  const [row] = await db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { fieldErrors: { current: "كلمة المرور الحالية غير صحيحة." } };
  }

  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, user.id));
  await logAudit({ userId: user.id, action: "PASSWORD_CHANGE", entity: "user", entityId: user.id });
  await destroyAllUserSessions(user.id);
  await destroyCurrentSession();
  redirect("/login?reset=1");
}
