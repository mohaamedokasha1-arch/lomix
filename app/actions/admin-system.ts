"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { AuthError, hashPassword, requireAdmin, requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { normalizeArabic, slugify } from "@/lib/slug";
import { saveSettings, type SettingKey } from "@/lib/settings";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SysState = { ok?: boolean; error?: string; message?: string; data?: unknown } | null;

async function guardStaff() {
  try {
    const user = await requireStaff();
    const h = await headers();
    return { user, ip: clientIpFromHeaders(h) };
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message } as const;
    throw error;
  }
}

async function guardAdmin() {
  try {
    const user = await requireAdmin();
    const h = await headers();
    return { user, ip: clientIpFromHeaders(h) };
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message } as const;
    throw error;
  }
}

function refreshPublic() {
  revalidateTag("catalog");
  revalidateTag("homepage");
  revalidatePath("/");
  revalidatePath("/trending");
  revalidatePath("/latest");
}

/* ───────────────────────── الصفحة الرئيسية ───────────────────────── */

export async function saveHomeSectionAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { error: guarded.error };
  const id = String(formData.get("id") ?? "");
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const subtitleAr = String(formData.get("subtitleAr") ?? "").trim();
  const visible = formData.get("visible") === "on";
  if (!id || titleAr.length < 2) return { error: "عنوان القسم مطلوب." };

  const db = await getDb();
  await db.update(schema.homeSections).set({ titleAr, subtitleAr: subtitleAr || null, visible }).where(eq(schema.homeSections.id, id));
  await logAudit({ userId: guarded.user.id, action: "HOME_SECTION_UPDATE", entity: "home_section", entityId: id, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/homepage");
  return { ok: true, message: "حُفظ القسم." };
}

export async function moveHomeSectionAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "up");
  if (!id) return;

  const db = await getDb();
  const sections = await db.select().from(schema.homeSections).orderBy(asc(schema.homeSections.sort));
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= sections.length) return;

  const a = sections[index]!;
  const b = sections[swapWith]!;
  await db.update(schema.homeSections).set({ sort: b.sort }).where(eq(schema.homeSections.id, a.id));
  await db.update(schema.homeSections).set({ sort: a.sort }).where(eq(schema.homeSections.id, b.id));
  await logAudit({ userId: guarded.user.id, action: "HOME_SECTION_MOVE", entity: "home_section", entityId: id, details: { direction }, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/homepage");
}

export async function toggleHomeSectionAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const visible = formData.get("visible") === "true";
  if (!id) return;
  const db = await getDb();
  await db.update(schema.homeSections).set({ visible: !visible }).where(eq(schema.homeSections.id, id));
  await logAudit({ userId: guarded.user.id, action: "HOME_SECTION_TOGGLE", entity: "home_section", entityId: id, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/homepage");
}

/* ───────────────────────── قوائم الترند ───────────────────────── */

const CURATED_LABEL: Record<string, string> = {
  TRENDING_DAY: "ترند اليوم",
  TRENDING_WEEK: "ترند الأسبوع",
  EDITORS_PICK: "اختيارات المحرر",
  FEATURED_HERO: "واجهة الصفحة الرئيسية",
};

export async function addCuratedAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { error: guarded.error };
  const listKey = String(formData.get("listKey") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  if (!listKey || !titleId) return { error: "اختر القائمة والعمل." };

  const db = await getDb();
  const [list] = await db.select().from(schema.curatedLists).where(eq(schema.curatedLists.key, listKey as "TRENDING_DAY")).limit(1);
  if (!list) return { error: "القائمة غير موجودة." };

  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${schema.curatedItems.rank}), 0)::int` })
    .from(schema.curatedItems)
    .where(eq(schema.curatedItems.listId, list.id));

  try {
    await db.insert(schema.curatedItems).values({ listId: list.id, titleId, rank: (maxRow?.max ?? 0) + 1 });
  } catch {
    return { error: "هذا العمل موجود في القائمة بالفعل." };
  }
  await logAudit({ userId: guarded.user.id, action: "CURATED_ADD", entity: "curated_list", entityId: list.id, details: { listKey, titleId }, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/curated");
  return { ok: true, message: `أُضيف إلى ${CURATED_LABEL[listKey] ?? listKey}.` };
}

export async function removeCuratedAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.curatedItems).where(eq(schema.curatedItems.id, id));
  await logAudit({ userId: guarded.user.id, action: "CURATED_REMOVE", entity: "curated_item", entityId: id, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/curated");
}

export async function moveCuratedAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "up");
  if (!id) return;

  const db = await getDb();
  const [item] = await db.select().from(schema.curatedItems).where(eq(schema.curatedItems.id, id)).limit(1);
  if (!item) return;
  const siblings = await db
    .select()
    .from(schema.curatedItems)
    .where(eq(schema.curatedItems.listId, item.listId))
    .orderBy(asc(schema.curatedItems.rank));
  const index = siblings.findIndex((s) => s.id === id);
  const target = siblings[direction === "up" ? index - 1 : index + 1];
  if (!target) return;

  await db.update(schema.curatedItems).set({ rank: target.rank }).where(eq(schema.curatedItems.id, item.id));
  await db.update(schema.curatedItems).set({ rank: item.rank }).where(eq(schema.curatedItems.id, target.id));
  await logAudit({ userId: guarded.user.id, action: "CURATED_MOVE", entity: "curated_item", entityId: id, details: { direction }, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/curated");
}

export async function pinCuratedAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  const [item] = await db.select().from(schema.curatedItems).where(eq(schema.curatedItems.id, id)).limit(1);
  if (!item) return;
  await db.update(schema.curatedItems).set({ pinned: !item.pinned }).where(eq(schema.curatedItems.id, id));
  await logAudit({ userId: guarded.user.id, action: "CURATED_PIN", entity: "curated_item", entityId: id, ip: guarded.ip });
  refreshPublic();
  revalidatePath("/admin/curated");
}

/* ───────────────────────── الرسائل ───────────────────────── */

export async function setMessageStatusAction(formData: FormData) {
  const guarded = await guardStaff();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["NEW", "IN_PROGRESS", "RESOLVED"].includes(status)) return;
  const db = await getDb();
  await db.update(schema.contactMessages).set({ status: status as "NEW" }).where(eq(schema.contactMessages.id, id));
  await logAudit({ userId: guarded.user.id, action: "MESSAGE_STATUS", entity: "message", entityId: id, details: { status }, ip: guarded.ip });
  revalidatePath("/admin/messages");
}

/* ───────────────────────── المستخدمون ───────────────────────── */

const userSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

export async function createUserAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardAdmin();
  if ("error" in guarded) return { error: guarded.error };
  const parsed = userSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة." };

  const db = await getDb();
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (existing) return { error: "البريد مستخدم بالفعل." };

  const [row] = await db
    .insert(schema.users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning({ id: schema.users.id });
  await logAudit({ userId: guarded.user.id, action: "USER_CREATE", entity: "user", entityId: row.id, details: { email: parsed.data.email, role: parsed.data.role }, ip: guarded.ip });
  revalidatePath("/admin/users");
  return { ok: true, message: "أُنشئ الحساب." };
}

export async function setUserRoleAction(formData: FormData) {
  const guarded = await guardAdmin();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id || !["ADMIN", "EDITOR", "VIEWER"].includes(role)) return;
  if (id === guarded.user.id) return;
  const db = await getDb();
  await db.update(schema.users).set({ role: role as "ADMIN" }).where(eq(schema.users.id, id));
  await logAudit({ userId: guarded.user.id, action: "USER_ROLE_CHANGE", entity: "user", entityId: id, details: { role }, ip: guarded.ip });
  revalidatePath("/admin/users");
}

export async function toggleUserActiveAction(formData: FormData) {
  const guarded = await guardAdmin();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id || id === guarded.user.id) return;
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!user) return;
  await db.update(schema.users).set({ isActive: !user.isActive }).where(eq(schema.users.id, id));
  if (user.isActive) await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
  await logAudit({ userId: guarded.user.id, action: user.isActive ? "USER_DEACTIVATE" : "USER_ACTIVATE", entity: "user", entityId: id, ip: guarded.ip });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const guarded = await guardAdmin();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id || id === guarded.user.id) return;
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!user) return;
  if (user.role === "ADMIN") {
    const [admins] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, "ADMIN"));
    if ((admins?.count ?? 0) <= 1) return;
  }
  await db.delete(schema.users).where(eq(schema.users.id, id));
  await logAudit({ userId: guarded.user.id, action: "USER_DELETE", entity: "user", entityId: id, details: { email: user.email }, ip: guarded.ip });
  revalidatePath("/admin/users");
}

/* ───────────────────────── الإعدادات ───────────────────────── */

const SETTINGS_ALLOWLIST = [
  "site_name",
  "site_name_ar",
  "tagline_ar",
  "meta_description",
  "contact_email",
  "twitter_url",
  "instagram_url",
  "youtube_url",
  "telegram_url",
  "footer_note",
  "trailers_mailto",
  "seo_default_title",
  "seo_default_description",
  "seo_index_titles",
  "seo_index_genres",
  "seo_index_people",
  "seo_index_search",
  "show_demo_notice",
  "allow_registration",
] as const;

/** مفاتيح لا يغيّرها إلا مدير عام، حتى لو وصلت من صفحة أخرى غير محمية في الواجهة. */
const ADMIN_ONLY_SETTINGS = [
  "seo_default_title",
  "seo_default_description",
  "seo_index_titles",
  "seo_index_genres",
  "seo_index_people",
  "seo_index_search",
] as const;

export async function saveSiteSettingsAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { error: guarded.error };

  // صفحة SEO مقصورة على المدير، وهذا الحارس يمنع تمرير نفس الحقول من نموذج آخر
  // بواسطة محرر (نموذج إعدادات الموقع لا يرسل هذه المفاتيح أصلًا).
  const touchesAdminOnly = ADMIN_ONLY_SETTINGS.some((key) => formData.has(key));
  if (touchesAdminOnly && guarded.user.role !== "ADMIN") {
    return { error: "إعدادات SEO والفهرسة تتطلب صلاحية مدير عام." };
  }

  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of SETTINGS_ALLOWLIST) {
    if (formData.has(key)) {
      const value = String(formData.get(key) ?? "").slice(0, 2000);
      values[key] = value;
    }
  }
  // مربعات الاختيار: تُحفظ فقط إن وُجدت في النموذج المرسَل، حتى لا تمسح
  // صفحة SEO قيم إعدادات أخرى موجودة في صفحة الإعدادات.
  for (const toggle of ["seo_index_titles", "seo_index_genres", "seo_index_people", "seo_index_search", "show_demo_notice", "allow_registration"] as const) {
    if (formData.has(toggle)) {
      values[toggle] = formData.getAll(toggle).some((value) => value === "on" || value === "true") ? "true" : "false";
    }
  }

  await saveSettings(values);
  await logAudit({ userId: guarded.user.id, action: "SETTINGS_UPDATE", entity: "settings", details: { keys: Object.keys(values) }, ip: guarded.ip });
  // إعدادات SEO تُقرأ داخل generateMetadata المخزّن — يجب إبطال الكاش معها.
  revalidateTag("catalog");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/seo");
  return { ok: true, message: "حُفظت الإعدادات." };
}

/* ───────────────────────── النسخ الاحتياطي ───────────────────────── */

const BACKUP_DIR = path.join(process.cwd(), "backups");
const BACKUP_TABLES = [
  "genres",
  "people",
  "titles",
  "title_genres",
  "credits",
  "seasons",
  "episodes",
  "trailers",
  "home_sections",
  "curated_lists",
  "curated_items",
  "site_settings",
  "users",
  "watchlist_items",
  "contact_messages",
  "media_assets",
  "audit_logs",
  "import_jobs",
] as const;

async function collectBackup() {
  const db = await getDb();
  const data: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    const result = (await db.execute(sql.raw(`select * from "${table}"`))) as unknown as { rows: unknown[] };
    data[table] = result.rows ?? [];
  }
  return {
    meta: {
      app: "Loomix",
      version: 1,
      createdAt: new Date().toISOString(),
      tables: BACKUP_TABLES,
      counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
    },
    data,
  };
}

export async function createBackupAction(): Promise<SysState> {
  const guarded = await guardAdmin();
  if ("error" in guarded) return { error: guarded.error };

  const payload = await collectBackup();
  const filename = `loomix-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    await writeFile(path.join(BACKUP_DIR, filename), JSON.stringify(payload), "utf8");
    await logAudit({ userId: guarded.user.id, action: "BACKUP_CREATE", entity: "system", details: { filename }, ip: guarded.ip });
    revalidatePath("/admin/backup");
    return { ok: true, message: `أُنشئت نسخة احتياطية: ${filename}`, data: { filename } };
  } catch {
    return { error: "تعذّر حفظ النسخة محليًا. على Vercel يجب استخدام تخزين كائنات خارجي (انظر docs/DEPLOYMENT.md)." };
  }
}

export async function listBackupsAction(): Promise<{ filename: string; size: number; createdAt: string }[]> {
  const guarded = await guardAdmin();
  if ("error" in guarded) return [];
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    const files = (await readdir(BACKUP_DIR)).filter((file) => file.endsWith(".json"));
    const stats = await Promise.all(
      files.map(async (file) => {
        const content = await readFile(path.join(BACKUP_DIR, file), "utf8");
        return { filename: file, size: Buffer.byteLength(content), createdAt: file.replace("loomix-backup-", "").replace(".json", "") };
      }),
    );
    return stats.sort((a, b) => (a.filename < b.filename ? 1 : -1)).slice(0, 20);
  } catch {
    return [];
  }
}

const restoreSchema = z.object({
  meta: z.object({ app: z.literal("Loomix"), version: z.number() }),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export async function restoreBackupAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardAdmin();
  if ("error" in guarded) return { error: guarded.error };

  const file = formData.get("file");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "RESTORE") return { error: "اكتب RESTORE في حقل التأكيد للمتابعة." };
  if (!(file instanceof File) || file.size === 0) return { error: "اختر ملف نسخة احتياطية JSON." };
  if (file.size > 30 * 1024 * 1024) return { error: "الملف أكبر من الحد المسموح (30MB)." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { error: "الملف ليس JSON صالحًا." };
  }
  const result = restoreSchema.safeParse(parsed);
  if (!result.success) return { error: "بنية النسخة غير متوافقة مع Loomix." };

  const db = await getDb();
  const data = result.data.data as Record<string, Record<string, unknown>[]>;
  try {
    await db.transaction(async (tx) => {
      const reversed = [...BACKUP_TABLES].reverse();
      for (const table of reversed) await tx.execute(sql.raw(`delete from "${table}"`));
      // ترتيب الإدخال: الأب قبل الابن
      for (const table of BACKUP_TABLES) {
        const rows = data[table];
        if (!rows?.length) continue;
        const columns = Object.keys(rows[0]!);
        const columnSql = sql.join(columns.map((c) => sql.identifier(c)), sql`, `);
        const rowSql = sql.join(
          rows.map((row) => sql`(${sql.join(columns.map((c) => sql`${row[c] ?? null}`), sql`, `)})`),
          sql`, `,
        );
        await tx.execute(sql`insert into ${sql.identifier(table)} (${columnSql}) values ${rowSql}`);
      }
    });
  } catch (error) {
    console.error("[loomix:restore]", error);
    return { error: "فشلت الاستعادة وتم التراجع عن العملية. لم تتغيّر البيانات." };
  }

  await logAudit({ userId: guarded.user.id, action: "BACKUP_RESTORE", entity: "system", details: { tables: Object.keys(data).length }, ip: guarded.ip });
  revalidatePath("/", "layout");
  return { ok: true, message: "اكتملت الاستعادة. أعد تسجيل الدخول إذا لزم الأمر." };
}

export async function backupDownloadDataAction(): Promise<{ json?: string; error?: string }> {
  const guarded = await guardAdmin();
  if ("error" in guarded) return { error: guarded.error };
  const payload = await collectBackup();
  return { json: JSON.stringify(payload) };
}

/* ───────────────────────── الاستيراد الجماعي ───────────────────────── */

type ImportRow = {
  line: number;
  titleAr?: string;
  titleEn?: string;
  type?: string;
  year?: string;
  overview?: string;
  genres?: string;
  country?: string;
  language?: string;
  rating?: string;
  ratingSource?: string;
  state?: string;
};

const TYPE_MAP: Record<string, "MOVIE" | "SERIES" | "ANIME"> = {
  movie: "MOVIE",
  film: "MOVIE",
  فيلم: "MOVIE",
  series: "SERIES",
  tv: "SERIES",
  مسلسل: "SERIES",
  anime: "ANIME",
  أنمي: "ANIME",
  انمي: "ANIME",
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim().toLowerCase());
  return { headers, rows: nonEmpty };
}

function validateRow(row: ImportRow, index: number): { ok: true; value: ImportRow & { type: "MOVIE" | "SERIES" | "ANIME" } } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!row.titleAr?.trim()) errors.push("الاسم العربي مطلوب");
  if (!row.type?.trim()) errors.push("النوع مطلوب");
  const type = TYPE_MAP[normalizeArabic(row.type ?? "").trim()] ?? TYPE_MAP[(row.type ?? "").trim().toLowerCase()];
  if (row.type?.trim() && !type) errors.push(`النوع غير معروف: ${row.type}`);
  if (!row.overview?.trim() || row.overview.trim().length < 10) errors.push("الوصف مطلوب (10 أحرف على الأقل)");
  if (row.year && !/^\d{4}$/.test(row.year.trim())) errors.push("السنة يجب أن تكون 4 أرقام");
  if (row.rating && (Number.isNaN(Number(row.rating)) || Number(row.rating) < 0 || Number(row.rating) > 10)) errors.push("التقييم بين 0 و10");
  if (row.rating && !row.ratingSource?.trim()) errors.push("مصدر التقييم مطلوب عند وجود تقييم");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...row, line: row.line || index + 2, type: type! } };
}

export type ImportPreview = {
  headers: string[];
  rows: { line: number; data: ImportRow; errors: string[] }[];
  validCount: number;
  invalidCount: number;
  jobId?: string;
};

export async function previewImportAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { error: guarded.error };

  const file = formData.get("file");
  const pasted = String(formData.get("text") ?? "").trim();
  let content = pasted;
  let filename: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: "حجم الملف أكبر من 2MB. قسّمه إلى دفعات." };
    content = await file.text();
    filename = file.name;
  }
  if (!content) return { error: "ارفع ملف CSV أو الصق البيانات." };

  let rows: Record<string, string>[] = [];
  let headers: string[] = [];

  if (content.trim().startsWith("[") || content.trim().startsWith("{")) {
    try {
      const json = JSON.parse(content) as unknown;
      const array = Array.isArray(json) ? json : (json as { items?: unknown[] }).items;
      if (!Array.isArray(array)) return { error: "ملف JSON يجب أن يحتوي مصفوفة أعمال." };
      rows = array.slice(0, 500).map((item, index) => ({ _line: String(index + 2), ...(item as Record<string, string>) }));
      headers = Object.keys(rows[0] ?? {});
    } catch {
      return { error: "ملف JSON غير صالح." };
    }
  } else {
    const parsedCsv = parseCsv(content);
    if (parsedCsv.rows.length === 0) return { error: "الملف لا يحتوي صفوفًا." };
    headers = parsedCsv.headers;
    rows = parsedCsv.rows.slice(0, 500).map((cells, index) => {
      const record: Record<string, string> = { _line: String(index + 2) };
      parsedCsv.headers.forEach((header, column) => {
        record[header] = cells[column] ?? "";
      });
      return record;
    });
  }

  const mapped = rows.map((record) => {
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const found = Object.entries(record).find(([header]) => normalizeArabic(header) === normalizeArabic(key));
        if (found && found[1]) return String(found[1]).trim();
      }
      return "";
    };
    return {
      line: Number(record._line ?? 0),
      titleAr: get("titleAr", "title_ar", "الاسم العربي", "الاسم", "العنوان"),
      titleEn: get("titleEn", "title_en", "الاسم الأصلي", "الاسم الانجليزي"),
      type: get("type", "النوع"),
      year: get("year", "releaseYear", "السنة", "سنة الإصدار"),
      overview: get("overviewAr", "overview", "الوصف", "القصة"),
      genres: get("genres", "genre", "التصنيفات", "النوع الفني"),
      country: get("country", "countryCode", "الدولة"),
      language: get("language", "اللغة"),
      rating: get("rating", "ratingValue", "التقييم"),
      ratingSource: get("ratingSource", "مصدر التقييم"),
      state: get("state", "الحالة"),
    } satisfies ImportRow;
  });

  const checked = mapped.map((row, index) => {
    const result = validateRow(row, index);
    return { line: row.line, data: row, errors: result.ok ? [] : result.errors };
  });
  const validCount = checked.filter((row) => row.errors.length === 0).length;

  const db = await getDb();
  const [job] = await db
    .insert(schema.importJobs)
    .values({
      kind: filename?.toLowerCase().endsWith(".json") || content.trim().startsWith("[") ? "JSON" : "CSV",
      filename,
      status: "QUEUED",
      total: checked.length,
      processed: 0,
      succeeded: 0,
      failed: checked.length - validCount,
      report: { headers, rows: checked, mode: "new" },
      userId: guarded.user.id,
    })
    .returning({ id: schema.importJobs.id });

  await logAudit({ userId: guarded.user.id, action: "IMPORT_PREVIEW", entity: "import_job", entityId: job.id, details: { total: checked.length, valid: validCount }, ip: guarded.ip });
  revalidatePath("/admin/imports");

  return {
    ok: true,
    message: "تم تحليل الملف. راجع الصفوف ثم ابدأ الاستيراد.",
    data: { headers, rows: checked, validCount, invalidCount: checked.length - validCount, jobId: job.id } satisfies ImportPreview,
  };
}

export type ImportProgress = { processed: number; total: number; succeeded: number; failed: number; done: boolean; errors: string[] };

/** يعالج دفعة صغيرة (10 صفوف) — مصمّم لحدود الدوال قصيرة العمر على Vercel. */
export async function commitImportChunkAction(jobId: string): Promise<{ ok: boolean; error?: string; progress?: ImportProgress }> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { ok: false, error: guarded.error };

  const db = await getDb();
  const [job] = await db.select().from(schema.importJobs).where(eq(schema.importJobs.id, jobId)).limit(1);
  if (!job) return { ok: false, error: "مهمة الاستيراد غير موجودة." };
  const report = job.report as { rows: ImportPreview["rows"]; mode?: string; headers: string[] };
  if (!report?.rows) return { ok: false, error: "تقرير المهمة غير صالح." };

  await db.update(schema.importJobs).set({ status: "RUNNING", updatedAt: new Date() }).where(eq(schema.importJobs.id, jobId));

  const chunk = report.rows.slice(job.processed, job.processed + 10);
  let succeeded = job.succeeded;
  let failed = job.failed;
  const errors: string[] = [];
  const genreRows = await db.select().from(schema.genres);
  const genreBySlug = new Map(genreRows.map((g) => [g.slug, g.id]));
  const genreByName = new Map(genreRows.map((g) => [normalizeArabic(g.nameAr), g.id]));

  for (const row of chunk) {
    if (row.errors.length) {
      errors.push(`سطر ${row.line}: ${row.errors.join(" — ")}`);
      continue;
    }
    const data = row.data;
    try {
      const [existing] = await db
        .select({ id: schema.titles.id })
        .from(schema.titles)
        .where(and(eq(schema.titles.titleAr, data.titleAr!), data.year ? eq(schema.titles.releaseYear, Number(data.year)) : sql`true`))
        .limit(1);
      if (existing) {
        failed += 1;
        errors.push(`سطر ${row.line}: «${data.titleAr}» موجود مسبقًا — تم تجاهله (سياسة «إضافة الجديد فقط»).`);
        continue;
      }

      const slugBase = slugify(data.titleEn || data.titleAr!);
      let slug = slugBase;
      let attempt = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [taken] = await db.select({ id: schema.titles.id }).from(schema.titles).where(eq(schema.titles.slug, slug)).limit(1);
        if (!taken) break;
        slug = `${slugBase}-${attempt++}`;
        if (attempt > 200) break;
      }

      const [created] = await db
        .insert(schema.titles)
        .values({
          type: data.type as "MOVIE",
          slug,
          titleAr: data.titleAr!,
          titleEn: data.titleEn || null,
          overviewAr: data.overview!,
          releaseYear: data.year ? Number(data.year) : null,
          countryCode: data.country ? data.country.slice(0, 3).toUpperCase() : null,
          language: data.language || null,
          ratingValue: data.rating ? Number(data.rating) : null,
          ratingSource: data.rating ? data.ratingSource || "استيراد جماعي" : null,
          state: data.state === "PUBLISHED" || data.state === "منشور" ? "PUBLISHED" : "DRAFT",
          publishedAt: data.state === "PUBLISHED" || data.state === "منشور" ? new Date() : null,
          searchText: normalizeArabic(`${data.titleAr} ${data.titleEn ?? ""} ${data.genres ?? ""} ${data.year ?? ""} ${data.language ?? ""}`),
        })
        .returning({ id: schema.titles.id });

      if (data.genres) {
        const ids = data.genres
          .split(/[,،|]/)
          .map((g) => g.trim())
          .filter(Boolean)
          .map((g) => genreBySlug.get(slugify(g)) ?? genreByName.get(normalizeArabic(g)))
          .filter((id): id is string => Boolean(id));
        if (ids.length) {
          await db.insert(schema.titleGenres).values(ids.map((genreId) => ({ titleId: created.id, genreId }))).onConflictDoNothing();
        }
      }
      succeeded += 1;
    } catch (error) {
      console.error("[loomix:import-row]", error);
      failed += 1;
      errors.push(`سطر ${row.line}: خطأ غير متوقع أثناء الإدراج.`);
    }
  }

  const processed = job.processed + chunk.length;
  const done = processed >= job.total;
  await db
    .update(schema.importJobs)
    .set({
      processed,
      succeeded,
      failed,
      status: done ? (failed > 0 ? "PARTIAL" : "DONE") : "RUNNING",
      report: { ...report, errors: [...((report as { errors?: string[] }).errors ?? []), ...errors].slice(-200) },
      updatedAt: new Date(),
    })
    .where(eq(schema.importJobs.id, jobId));

  if (done) {
    await logAudit({
      userId: guarded.user.id,
      action: "IMPORT_COMMIT",
      entity: "import_job",
      entityId: jobId,
      details: { total: job.total, succeeded, failed },
      ip: guarded.ip,
    });
    refreshPublic();
    revalidatePath("/admin/titles");
    revalidatePath("/admin/imports");
  }

  return { ok: true, progress: { processed, total: job.total, succeeded, failed, done, errors } };
}

/* ───────────────────────── التنقل والتذييل ───────────────────────── */

export async function saveNavigationAction(_prev: SysState, formData: FormData): Promise<SysState> {
  const guarded = await guardStaff();
  if ("error" in guarded) return { error: guarded.error };

  const { NAV_BLUEPRINT, buildNavConfig, buildFooterLinks, isSafeInternalPath } = await import("@/lib/navigation");

  const entries = NAV_BLUEPRINT.map((item) => ({
    key: item.key,
    label: String(formData.get(`label:${item.key}`) ?? item.label),
    visible: formData.get(`visible:${item.key}`) === "on",
  }));

  if (!entries.some((entry) => entry.visible)) {
    return { error: "يجب إبقاء رابط تنقل واحد ظاهرًا على الأقل." };
  }
  if (entries.some((entry) => entry.label.trim().length === 0)) {
    return { error: "لا يمكن ترك عنوان رابط فارغًا." };
  }

  const labels = formData.getAll("footerLabel").map(String);
  const hrefs = formData.getAll("footerHref").map(String);
  const footerLinks = labels
    .map((label, index) => ({ label, href: hrefs[index] ?? "" }))
    .filter((link) => link.label.trim() || link.href.trim());

  if (footerLinks.length > 10) return { error: "الحد الأقصى 10 روابط في التذييل." };
  const unsafe = footerLinks.find((link) => !isSafeInternalPath(link.href));
  if (unsafe) {
    return { error: `مسار غير صالح: «${unsafe.href}». المسموح مسار داخلي يبدأ بـ / فقط.` };
  }

  await saveSettings({ nav_config: buildNavConfig(entries), footer_links: buildFooterLinks(footerLinks) });
  await logAudit({
    userId: guarded.user.id,
    action: "NAVIGATION_UPDATE",
    entity: "settings",
    details: { nav: entries.map((e) => `${e.key}:${e.visible ? "on" : "off"}`), footerLinks: footerLinks.length },
    ip: guarded.ip,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
  return { ok: true, message: "حُفظ التنقل والتذييل، وظهر التغيير في كل الصفحات." };
}
