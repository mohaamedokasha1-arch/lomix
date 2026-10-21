"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { AuthError, getSessionUser, requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isUniqueViolation } from "@/lib/db-errors";
import { buildSearchText, normalizeArabic, slugify, uniqueSlug } from "@/lib/slug";
import { extractYouTubeId } from "@/lib/utils";
import { clientIpFromHeaders } from "@/lib/rate-limit";

export type AdminState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; message?: string } | null;

async function guard() {
  try {
    const user = await requireStaff();
    const h = await headers();
    return { user, ip: clientIpFromHeaders(h) };
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message } as const;
    throw error;
  }
}

function invalidateCatalog(slug?: string, type?: string) {
  revalidateTag("catalog");
  revalidateTag("homepage");
  revalidatePath("/");
  revalidatePath("/movies");
  revalidatePath("/series");
  revalidatePath("/anime");
  revalidatePath("/latest");
  revalidatePath("/trending");
  revalidatePath("/top-rated");
  revalidatePath("/most-viewed");
  revalidatePath("/trailers");
  revalidatePath("/sitemap.xml");
  if (slug) {
    const route = type === "SERIES" ? "series" : type === "ANIME" ? "anime" : "movie";
    revalidatePath(`/${route}/${slug}`);
  }
}

const titleSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["MOVIE", "SERIES", "ANIME"]),
  titleAr: z.string().trim().min(1, "الاسم العربي مطلوب").max(200),
  titleEn: z.string().trim().max(200).optional().or(z.literal("")),
  slug: z.string().trim().max(200).optional().or(z.literal("")),
  taglineAr: z.string().trim().max(240).optional().or(z.literal("")),
  overviewAr: z.string().trim().min(10, "الوصف العربي مطلوب (10 أحرف على الأقل)").max(4000),
  releaseYear: z.coerce.number().int().min(1888).max(2100).optional(),
  releaseDate: z.string().optional().or(z.literal("")),
  runtimeMinutes: z.coerce.number().int().min(1).max(1200).optional(),
  status: z.enum(["RELEASED", "ONGOING", "UPCOMING", "ENDED", "CANCELLED"]),
  countryCode: z.string().trim().max(3).optional().or(z.literal("")),
  countryNameAr: z.string().trim().max(80).optional().or(z.literal("")),
  language: z.string().trim().max(60).optional().or(z.literal("")),
  posterPath: z.string().trim().max(400).optional().or(z.literal("")),
  backdropPath: z.string().trim().max(400).optional().or(z.literal("")),
  ratingValue: z.coerce.number().min(0).max(10).optional(),
  ratingSource: z.string().trim().max(120).optional().or(z.literal("")),
  ratingCount: z.coerce.number().int().min(0).optional(),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(400).optional().or(z.literal("")),
  state: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.string().optional(),
  isDemo: z.string().optional(),
  editorNoteAr: z.string().trim().max(600).optional().or(z.literal("")),
  externalSource: z.string().trim().max(80).optional().or(z.literal("")),
  externalId: z.string().trim().max(120).optional().or(z.literal("")),
  genres: z.string().optional(),
  credits: z.string().optional(),
});

type CreditInput = { personId: string; role: "ACTOR" | "DIRECTOR" | "WRITER" | "COMPOSER"; characterName?: string };

function parseCredits(raw?: string): CreditInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is CreditInput => Boolean(row && typeof row === "object" && typeof (row as CreditInput).personId === "string"))
      .filter((row) => ["ACTOR", "DIRECTOR", "WRITER", "COMPOSER"].includes(row.role))
      .slice(0, 200)
      .map((row) => ({ personId: row.personId, role: row.role, characterName: row.characterName?.slice(0, 120) }));
  } catch {
    return [];
  }
}

function parseGenres(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is string => typeof row === "string").slice(0, 12);
  } catch {
    return [];
  }
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function syncRelations(
  titleId: string,
  genreSlugs: string[],
  credits: CreditInput[],
) {
  const db = await getDb();
  await db.delete(schema.titleGenres).where(eq(schema.titleGenres.titleId, titleId));
  if (genreSlugs.length) {
    const rows = await db.select({ id: schema.genres.id, slug: schema.genres.slug }).from(schema.genres);
    const bySlug = new Map(rows.map((r) => [r.slug, r.id]));
    const values = genreSlugs
      .map((slug) => bySlug.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((genreId) => ({ titleId, genreId }));
    if (values.length) await db.insert(schema.titleGenres).values(values).onConflictDoNothing();
  }

  await db.delete(schema.credits).where(eq(schema.credits.titleId, titleId));
  if (credits.length) {
    const seen = new Set<string>();
    const values = credits
      .filter((credit) => {
        const key = `${credit.personId}:${credit.role}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((credit, index) => ({
        titleId,
        personId: credit.personId,
        role: credit.role,
        characterName: credit.characterName || null,
        sort: index,
      }));
    if (values.length) await db.insert(schema.credits).values(values).onConflictDoNothing();
  }
}

export async function saveTitleAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = titleSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // التقييم اختياري، لكن إن وُجد يجب أن يكون له مصدر مسجّل.
  if (data.ratingValue && !data.ratingSource) {
    return { fieldErrors: { ratingSource: "أدخل مصدر التقييم عند تسجيل قيمة تقييم." } };
  }

  const db = await getDb();

  // منع تكرار العمل: نفس الاسم العربي ونفس السنة (سياسة §4 في المواصفات).
  const [duplicate] = await db
    .select({ id: schema.titles.id })
    .from(schema.titles)
    .where(
      and(
        eq(schema.titles.titleAr, data.titleAr),
        data.releaseYear ? eq(schema.titles.releaseYear, data.releaseYear) : sql`${schema.titles.releaseYear} is null`,
      ),
    )
    .limit(1);
  if (duplicate && duplicate.id !== data.id) {
    return { fieldErrors: { titleAr: "يوجد عمل آخر بنفس الاسم العربي والسنة. عدّل الاسم أو السنة أو افتح العمل الموجود." } };
  }

  try {
    const baseSlug = data.slug || data.titleEn || data.titleAr;
    const genres = parseGenres(data.genres);
    const credits = parseCredits(data.credits);

    if (data.id) {
      const [existing] = await db.select().from(schema.titles).where(eq(schema.titles.id, data.id)).limit(1);
      if (!existing) return { error: "العمل غير موجود." };

      const slug = await uniqueSlug(baseSlug, "titles", data.id);
      const publishing = data.state === "PUBLISHED" && existing.state === "DRAFT";
      await db
        .update(schema.titles)
        .set({
          type: data.type,
          slug,
          titleAr: data.titleAr,
          titleEn: data.titleEn || null,
          taglineAr: data.taglineAr || null,
          overviewAr: data.overviewAr,
          releaseYear: data.releaseYear ?? null,
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
          runtimeMinutes: data.runtimeMinutes ?? null,
          status: data.status,
          countryCode: data.countryCode ? data.countryCode.toUpperCase() : null,
          countryNameAr: data.countryNameAr || null,
          language: data.language || null,
          posterPath: data.posterPath || null,
          backdropPath: data.backdropPath || null,
          ratingValue: data.ratingValue ?? null,
          ratingSource: data.ratingValue ? data.ratingSource || null : null,
          ratingCount: data.ratingCount ?? null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          state: data.state,
          featured: data.featured === "on",
          isDemo: data.isDemo === "on",
          editorNoteAr: data.editorNoteAr || null,
          externalSource: data.externalSource || null,
          externalId: data.externalId || null,
          searchText: buildSearchText([
            data.titleAr,
            data.titleEn,
            normalizeArabic(data.titleAr),
            genres.join(" "),
            data.releaseYear ? String(data.releaseYear) : "",
            data.countryNameAr,
          ]),
          publishedAt: publishing ? new Date() : data.state === "DRAFT" ? existing.publishedAt : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.titles.id, data.id));

      await syncRelations(data.id, genres, credits);
      await logAudit({
        userId: guarded.user.id,
        action: "TITLE_UPDATE",
        entity: "title",
        entityId: data.id,
        details: { titleAr: data.titleAr, state: data.state },
        ip: guarded.ip,
      });
      invalidateCatalog(slug, data.type);
      return { ok: true, message: "حُفظ العمل." };
    }

    const slug = await uniqueSlug(baseSlug, "titles");
    const [created] = await db
      .insert(schema.titles)
      .values({
        type: data.type,
        slug,
        titleAr: data.titleAr,
        titleEn: data.titleEn || null,
        taglineAr: data.taglineAr || null,
        overviewAr: data.overviewAr,
        releaseYear: data.releaseYear ?? null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        runtimeMinutes: data.runtimeMinutes ?? null,
        status: data.status,
        countryCode: data.countryCode ? data.countryCode.toUpperCase() : null,
        countryNameAr: data.countryNameAr || null,
        language: data.language || null,
        posterPath: data.posterPath || null,
        backdropPath: data.backdropPath || null,
        ratingValue: data.ratingValue ?? null,
        ratingSource: data.ratingValue ? data.ratingSource || null : null,
        ratingCount: data.ratingCount ?? null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        state: data.state,
        featured: data.featured === "on",
        isDemo: data.isDemo === "on",
        editorNoteAr: data.editorNoteAr || null,
        externalSource: data.externalSource || null,
        externalId: data.externalId || null,
        publishedAt: data.state === "PUBLISHED" ? new Date() : null,
        searchText: buildSearchText([
          data.titleAr,
          data.titleEn,
          normalizeArabic(data.titleAr),
          genres.join(" "),
          data.releaseYear ? String(data.releaseYear) : "",
          data.countryNameAr,
        ]),
      })
      .returning({ id: schema.titles.id });

    await syncRelations(created.id, genres, credits);
    await logAudit({
      userId: guarded.user.id,
      action: "TITLE_CREATE",
      entity: "title",
      entityId: created.id,
      details: { titleAr: data.titleAr, type: data.type },
      ip: guarded.ip,
    });
    invalidateCatalog(slug, data.type);
    redirect(`/admin/titles/${created.id}?created=1`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("[loomix:save-title]", error);
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    return { error: "تعذّر حفظ العمل. تحقق من الحقول وحاول مرة أخرى." };
  }
}

export async function deleteTitleAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  const [title] = await db.select().from(schema.titles).where(eq(schema.titles.id, id)).limit(1);
  if (!title) return;
  await db.delete(schema.titles).where(eq(schema.titles.id, id));
  await logAudit({
    userId: guarded.user.id,
    action: "TITLE_DELETE",
    entity: "title",
    entityId: id,
    details: { titleAr: title.titleAr, type: title.type },
    ip: guarded.ip,
  });
  invalidateCatalog(title.slug, title.type);
  redirect("/admin/titles?deleted=1");
}

export async function toggleTitleStateAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const db = await getDb();
  const [title] = await db.select().from(schema.titles).where(eq(schema.titles.id, id)).limit(1);
  if (!title) return;

  const nextState = title.state === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  await db
    .update(schema.titles)
    .set({
      state: nextState,
      publishedAt: nextState === "PUBLISHED" ? title.publishedAt ?? new Date() : title.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.titles.id, id));

  await logAudit({
    userId: guarded.user.id,
    action: nextState === "PUBLISHED" ? "TITLE_PUBLISH" : "TITLE_UNPUBLISH",
    entity: "title",
    entityId: id,
    details: { titleAr: title.titleAr },
    ip: guarded.ip,
  });
  invalidateCatalog(title.slug, title.type);
}

export async function bulkTitleAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");
  if (!ids.length || !["publish", "draft", "delete"].includes(action)) return;

  const db = await getDb();
  const titles = await db.select().from(schema.titles).where(inArray(schema.titles.id, ids));

  if (action === "delete") {
    await db.delete(schema.titles).where(inArray(schema.titles.id, ids));
  } else {
    await db
      .update(schema.titles)
      .set({
        state: action === "publish" ? "PUBLISHED" : "DRAFT",
        publishedAt: action === "publish" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(inArray(schema.titles.id, ids));
  }

  await logAudit({
    userId: guarded.user.id,
    action: `TITLE_BULK_${action.toUpperCase()}`,
    entity: "title",
    details: { count: ids.length, titles: titles.map((t) => t.titleAr) },
    ip: guarded.ip,
  });
  invalidateCatalog();
  titles.forEach((t) => invalidateCatalog(t.slug, t.type));
}

/* ───────────────────────────── المواسم والحلقات ───────────────────────────── */

export async function saveSeasonAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const titleId = String(formData.get("titleId") ?? "");
  const id = String(formData.get("id") ?? "");
  const number = Number(formData.get("number"));
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const overviewAr = String(formData.get("overviewAr") ?? "").trim();

  if (!titleId) return { error: "العمل غير محدد." };
  if (!Number.isInteger(number) || number < 0 || number > 100) return { fieldErrors: { number: "رقم الموسم بين 0 و100." } };

  const db = await getDb();
  try {
    if (id) {
      await db
        .update(schema.seasons)
        .set({ number, nameAr: nameAr || null, year, overviewAr: overviewAr || null })
        .where(eq(schema.seasons.id, id));
      await logAudit({ userId: guarded.user.id, action: "SEASON_UPDATE", entity: "season", entityId: id, ip: guarded.ip });
    } else {
      const [row] = await db
        .insert(schema.seasons)
        .values({ titleId, number, nameAr: nameAr || null, year, overviewAr: overviewAr || null })
        .returning({ id: schema.seasons.id });
      await logAudit({ userId: guarded.user.id, action: "SEASON_CREATE", entity: "season", entityId: row.id, ip: guarded.ip });
    }
    invalidateCatalog();
    revalidatePath(`/admin/titles/${titleId}`);
    return { ok: true, message: "حُفظ الموسم." };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { number: "يوجد موسم بهذا الرقم لهذا العمل بالفعل." } };
    }
    console.error("[loomix:season]", error);
    return { error: "تعذّر حفظ الموسم." };
  }
}

export async function deleteSeasonAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.seasons).where(eq(schema.seasons.id, id));
  await logAudit({ userId: guarded.user.id, action: "SEASON_DELETE", entity: "season", entityId: id, details: { titleId }, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath(`/admin/titles/${titleId}`);
}

export async function saveEpisodeAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const seasonId = String(formData.get("seasonId") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  const id = String(formData.get("id") ?? "");
  const number = Number(formData.get("number"));
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const overviewAr = String(formData.get("overviewAr") ?? "").trim();
  const airDate = String(formData.get("airDate") ?? "");
  const runtime = formData.get("runtime") ? Number(formData.get("runtime")) : null;
  const state = formData.get("state") === "DRAFT" ? "DRAFT" : "PUBLISHED";

  if (!seasonId) return { error: "الموسم غير محدد." };
  if (!Number.isInteger(number) || number < 0 || number > 2000) return { fieldErrors: { number: "رقم الحلقة غير صالح." } };
  if (nameAr.length < 1) return { fieldErrors: { nameAr: "اسم الحلقة مطلوب." } };

  const db = await getDb();
  try {
    if (id) {
      await db
        .update(schema.episodes)
        .set({
          number,
          nameAr,
          overviewAr: overviewAr || null,
          airDate: airDate ? new Date(airDate) : null,
          runtime,
          state,
        })
        .where(eq(schema.episodes.id, id));
      await logAudit({ userId: guarded.user.id, action: "EPISODE_UPDATE", entity: "episode", entityId: id, ip: guarded.ip });
    } else {
      const [row] = await db
        .insert(schema.episodes)
        .values({ seasonId, number, nameAr, overviewAr: overviewAr || null, airDate: airDate ? new Date(airDate) : null, runtime, state })
        .returning({ id: schema.episodes.id });
      await logAudit({ userId: guarded.user.id, action: "EPISODE_CREATE", entity: "episode", entityId: row.id, ip: guarded.ip });
    }
    invalidateCatalog();
    if (titleId) revalidatePath(`/admin/titles/${titleId}`);
    return { ok: true, message: "حُفظت الحلقة." };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { number: "رقم الحلقة مستخدم في هذا الموسم بالفعل." } };
    }
    console.error("[loomix:episode]", error);
    return { error: "تعذّر حفظ الحلقة." };
  }
}

export async function deleteEpisodeAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.episodes).where(eq(schema.episodes.id, id));
  await logAudit({ userId: guarded.user.id, action: "EPISODE_DELETE", entity: "episode", entityId: id, ip: guarded.ip });
  invalidateCatalog();
  if (titleId) revalidatePath(`/admin/titles/${titleId}`);
}

/** إضافة دفعة حلقات لموسم واحد (بدل فتح نموذج لكل حلقة). */
export async function bulkEpisodesAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const seasonId = String(formData.get("seasonId") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  const count = Number(formData.get("count"));
  const startNumber = Number(formData.get("startNumber") || 1);
  const runtime = formData.get("runtime") ? Number(formData.get("runtime")) : null;

  if (!seasonId) return { error: "الموسم غير محدد." };
  if (!Number.isInteger(count) || count < 1 || count > 60) return { fieldErrors: { count: "عدد الحلقات بين 1 و60 في الدفعة." } };

  const db = await getDb();
  const existing = await db
    .select({ number: schema.episodes.number })
    .from(schema.episodes)
    .where(eq(schema.episodes.seasonId, seasonId));
  const taken = new Set(existing.map((row) => row.number));

  const values = Array.from({ length: count }, (_, index) => startNumber + index)
    .filter((number) => !taken.has(number))
    .map((number) => ({
      seasonId,
      number,
      nameAr: `الحلقة ${number}`,
      runtime,
      state: "DRAFT" as const,
    }));

  if (!values.length) return { error: "كل أرقام الحلقات المطلوبة موجودة بالفعل." };
  await db.insert(schema.episodes).values(values);
  await logAudit({
    userId: guarded.user.id,
    action: "EPISODES_BULK_CREATE",
    entity: "season",
    entityId: seasonId,
    details: { count: values.length, startNumber },
    ip: guarded.ip,
  });
  invalidateCatalog();
  if (titleId) revalidatePath(`/admin/titles/${titleId}`);
  return { ok: true, message: `أُضيفت ${values.length} حلقة كمسودات — عدّل أسماءها ثم انشرها.` };
}

/* ───────────────────────────── الأشخاص ───────────────────────────── */

export async function savePersonAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const id = String(formData.get("id") ?? "");
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const imagePath = String(formData.get("imagePath") ?? "").trim();
  const bioAr = String(formData.get("bioAr") ?? "").trim();
  const birthYear = formData.get("birthYear") ? Number(formData.get("birthYear")) : null;

  if (nameAr.length < 2) return { fieldErrors: { nameAr: "الاسم العربي مطلوب." } };

  const db = await getDb();
  if (id) {
    await db
      .update(schema.people)
      .set({ nameAr, nameEn: nameEn || null, imagePath: imagePath || null, bioAr: bioAr || null, birthYear })
      .where(eq(schema.people.id, id));
    await logAudit({ userId: guarded.user.id, action: "PERSON_UPDATE", entity: "person", entityId: id, ip: guarded.ip });
  } else {
    const slug = await uniqueSlug(nameEn || nameAr, "people");
    const [row] = await db
      .insert(schema.people)
      .values({ slug, nameAr, nameEn: nameEn || null, imagePath: imagePath || null, bioAr: bioAr || null, birthYear })
      .returning({ id: schema.people.id });
    await logAudit({ userId: guarded.user.id, action: "PERSON_CREATE", entity: "person", entityId: row.id, ip: guarded.ip });
  }
  invalidateCatalog();
  revalidatePath("/admin/people");
  return { ok: true, message: "حُفظت بيانات الشخص." };
}

export async function deletePersonAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.people).where(eq(schema.people.id, id));
  await logAudit({ userId: guarded.user.id, action: "PERSON_DELETE", entity: "person", entityId: id, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath("/admin/people");
}

/* ───────────────────────────── التصنيفات ───────────────────────────── */

export async function saveGenreAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const id = String(formData.get("id") ?? "");
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const sort = Number(formData.get("sort") || 100);

  if (nameAr.length < 2) return { fieldErrors: { nameAr: "الاسم العربي مطلوب." } };
  if (nameEn.length < 2) return { fieldErrors: { nameEn: "الاسم الإنجليزي مطلوب (يُستخدم في رابط التصنيف)." } };

  const db = await getDb();
  try {
    if (id) {
      await db.update(schema.genres).set({ nameAr, nameEn, sort }).where(eq(schema.genres.id, id));
      await logAudit({ userId: guarded.user.id, action: "GENRE_UPDATE", entity: "genre", entityId: id, ip: guarded.ip });
    } else {
      const slug = await uniqueSlug(nameEn, "genres");
      const [row] = await db.insert(schema.genres).values({ slug, nameAr, nameEn, sort }).returning({ id: schema.genres.id });
      await logAudit({ userId: guarded.user.id, action: "GENRE_CREATE", entity: "genre", entityId: row.id, ip: guarded.ip });
    }
    invalidateCatalog();
    revalidatePath("/admin/genres");
    return { ok: true, message: "حُفظ التصنيف." };
  } catch (error) {
    console.error("[loomix:genre]", error);
    return { error: "تعذّر حفظ التصنيف." };
  }
}

export async function deleteGenreAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };
  const id = String(formData.get("id") ?? "");
  const reassignTo = String(formData.get("reassignTo") ?? "");
  if (!id) return { error: "التصنيف غير محدد." };

  const db = await getDb();
  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.titleGenres)
    .where(eq(schema.titleGenres.genreId, id));

  if ((count?.count ?? 0) > 0) {
    if (!reassignTo) {
      return { error: `هذا التصنيف مرتبط بـ${count!.count} عملًا. اختر تصنيفًا بديلًا لإعادة التصنيف قبل الحذف.` };
    }
    if (reassignTo === id) return { error: "لا يمكن إعادة التصنيف إلى نفس التصنيف." };
    // نقل الارتباطات مع تجاهل التكرار
    const links = await db.select({ titleId: schema.titleGenres.titleId }).from(schema.titleGenres).where(eq(schema.titleGenres.genreId, id));
    if (links.length) {
      await db.insert(schema.titleGenres).values(links.map((l) => ({ titleId: l.titleId, genreId: reassignTo }))).onConflictDoNothing();
    }
    await db.delete(schema.titleGenres).where(eq(schema.titleGenres.genreId, id));
  }

  await db.delete(schema.genres).where(eq(schema.genres.id, id));
  await logAudit({ userId: guarded.user.id, action: "GENRE_DELETE", entity: "genre", entityId: id, details: { reassignTo }, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath("/admin/genres");
  return { ok: true, message: "حُذف التصنيف." };
}

/* ───────────────────────────── التريلرات ───────────────────────────── */

export async function saveTrailerAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const id = String(formData.get("id") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  const input = String(formData.get("youtubeId") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OFFICIAL") as "OFFICIAL" | "TEASER" | "PROMO";
  const language = String(formData.get("language") ?? "ar");
  const isPrimary = formData.get("isPrimary") === "on";

  if (!titleId) return { fieldErrors: { titleId: "اختر العمل المرتبط بالتريلر." } };
  if (!nameAr) return { fieldErrors: { nameAr: "اسم التريلر مطلوب." } };

  const youtubeId = extractYouTubeId(input);
  if (!youtubeId) return { fieldErrors: { youtubeId: "رابط يوتيوب غير صالح. الصق رابط الفيديو أو المعرّف (11 حرفًا)." } };

  const db = await getDb();
  if (id) {
    await db
      .update(schema.trailers)
      .set({ titleId, youtubeId, nameAr, kind, language, isPrimary, health: "UNVERIFIED", lastCheckedAt: null })
      .where(eq(schema.trailers.id, id));
    await logAudit({ userId: guarded.user.id, action: "TRAILER_UPDATE", entity: "trailer", entityId: id, ip: guarded.ip });
  } else {
    const [row] = await db
      .insert(schema.trailers)
      .values({ titleId, youtubeId, nameAr, kind, language, isPrimary })
      .returning({ id: schema.trailers.id });
    await logAudit({ userId: guarded.user.id, action: "TRAILER_CREATE", entity: "trailer", entityId: row.id, ip: guarded.ip });
  }

  if (isPrimary) {
    await db
      .update(schema.trailers)
      .set({ isPrimary: false })
      .where(and(eq(schema.trailers.titleId, titleId), id ? ne(schema.trailers.id, id) : sql`true`));
  }

  invalidateCatalog();
  revalidatePath("/admin/trailers");
  return { ok: true, message: "حُفظ التريلر." };
}

export async function setPrimaryTrailerAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const titleId = String(formData.get("titleId") ?? "");
  if (!id || !titleId) return;
  const db = await getDb();
  await db.update(schema.trailers).set({ isPrimary: false }).where(eq(schema.trailers.titleId, titleId));
  await db.update(schema.trailers).set({ isPrimary: true }).where(eq(schema.trailers.id, id));
  await logAudit({ userId: guarded.user.id, action: "TRAILER_SET_PRIMARY", entity: "trailer", entityId: id, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath("/admin/trailers");
}

export async function deleteTrailerAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.trailers).where(eq(schema.trailers.id, id));
  await logAudit({ userId: guarded.user.id, action: "TRAILER_DELETE", entity: "trailer", entityId: id, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath("/admin/trailers");
}

/**
 * فحص صلاحية رابط التريلر عبر oEmbed الرسمي.
 * عند تعذّر الاتصال بالشبكة لا نخمّن: نُبقي الحالة «لم يُفحص» ونُبلغ المدير.
 */
export async function checkTrailerHealthAction(formData: FormData): Promise<AdminState> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "التريلر غير محدد." };

  const db = await getDb();
  const [trailer] = await db.select().from(schema.trailers).where(eq(schema.trailers.id, id)).limit(1);
  if (!trailer) return { error: "التريلر غير موجود." };

  if (trailer.youtubeId.startsWith("demo-")) {
    await db.update(schema.trailers).set({ health: "UNVERIFIED", lastCheckedAt: new Date() }).where(eq(schema.trailers.id, id));
    return { ok: true, message: "معاينة تجريبية أصلية — لا يوجد رابط خارجي لفحصه." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${trailer.youtubeId}&format=json`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timeout);
    const health = response.ok ? "OK" : "BROKEN";
    await db.update(schema.trailers).set({ health, lastCheckedAt: new Date() }).where(eq(schema.trailers.id, id));
    invalidateCatalog();
    revalidatePath("/admin/trailers");
    return { ok: true, message: health === "OK" ? "الرابط يعمل." : "الرابط لا يعمل — تم وسمه كمعطل." };
  } catch {
    await db.update(schema.trailers).set({ lastCheckedAt: new Date() }).where(eq(schema.trailers.id, id));
    return { error: "تعذّر الوصول إلى المصدر للفحص الآن. لم تُغيَّر حالة الرابط." };
  }
}

export async function markTrailerBrokenAction(formData: FormData) {
  const guarded = await guard();
  if ("error" in guarded) return;
  const id = String(formData.get("id") ?? "");
  const health = formData.get("health") === "OK" ? "OK" : "BROKEN";
  if (!id) return;
  const db = await getDb();
  await db.update(schema.trailers).set({ health, lastCheckedAt: new Date() }).where(eq(schema.trailers.id, id));
  await logAudit({ userId: guarded.user.id, action: "TRAILER_HEALTH_MANUAL", entity: "trailer", entityId: id, details: { health }, ip: guarded.ip });
  invalidateCatalog();
  revalidatePath("/admin/trailers");
}

export { slugify };

/* ───────────────────────── تحديث جماعي مع سجل تغييرات ───────────────────────── */

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "اختر عملًا واحدًا على الأقل"),
  reason: z.string().trim().min(6, "سبب التحديث مطلوب (6 أحرف على الأقل)").max(300),
  state: z.enum(["", "DRAFT", "PUBLISHED"]).optional(),
  countryCode: z.string().trim().max(3).optional(),
  language: z.string().trim().max(60).optional(),
  status: z.enum(["", "RELEASED", "ONGOING", "UPCOMING", "ENDED", "CANCELLED"]).optional(),
  protectManual: z.boolean(),
});

export type BulkUpdateResult = {
  ok?: boolean;
  error?: string;
  message?: string;
  updated?: { titleAr: string; changes: string[] }[];
  skipped?: { titleAr: string; reason: string }[];
};

/** تحديث جماعي محدود الحقول، مع تسجيل «قبل/بعد» لكل عمل وحماية التعديلات اليدوية. */
export async function bulkUpdateTitlesAction(_prev: BulkUpdateResult | null, formData: FormData): Promise<BulkUpdateResult> {
  const guarded = await guard();
  if ("error" in guarded) return { error: guarded.error };

  const parsed = bulkUpdateSchema.safeParse({
    ids: formData.getAll("ids").map(String).filter(Boolean),
    reason: String(formData.get("reason") ?? ""),
    state: String(formData.get("state") ?? ""),
    countryCode: String(formData.get("countryCode") ?? ""),
    language: String(formData.get("language") ?? ""),
    status: String(formData.get("status") ?? ""),
    protectManual: formData.get("protectManual") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة." };
  const input = parsed.data;

  const updates: Record<string, unknown> = {};
  if (input.state) {
    updates.state = input.state;
    if (input.state === "PUBLISHED") updates.publishedAt = new Date();
  }
  if (input.countryCode) updates.countryCode = input.countryCode.toUpperCase();
  if (input.language) updates.language = input.language;
  if (input.status) updates.status = input.status;

  if (!Object.keys(updates).length) return { error: "لم تختر أي حقل للتحديث." };

  const db = await getDb();
  const rows = await db.select().from(schema.titles).where(inArray(schema.titles.id, input.ids));
  const updated: { titleAr: string; changes: string[] }[] = [];
  const skipped: { titleAr: string; reason: string }[] = [];

  for (const title of rows) {
    if (input.protectManual && title.editorNoteAr) {
      skipped.push({ titleAr: title.titleAr, reason: "محمي: تعديل يدوي مسجّل" });
      continue;
    }

    const changes: string[] = [];
    if (input.state && input.state !== title.state) changes.push(`الحالة: ${title.state} → ${input.state}`);
    if (input.countryCode && input.countryCode.toUpperCase() !== title.countryCode) {
      changes.push(`الدولة: ${title.countryCode ?? "—"} → ${input.countryCode.toUpperCase()}`);
    }
    if (input.language && input.language !== title.language) changes.push(`اللغة: ${title.language ?? "—"} → ${input.language}`);
    if (input.status && input.status !== title.status) changes.push(`حالة الإصدار: ${title.status} → ${input.status}`);
    if (!changes.length) {
      skipped.push({ titleAr: title.titleAr, reason: "لا تغيير" });
      continue;
    }

    await db
      .update(schema.titles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.titles.id, title.id));

    updated.push({ titleAr: title.titleAr, changes });
    invalidateCatalog(title.slug, title.type);
  }

  await logAudit({
    userId: guarded.user.id,
    action: "TITLES_BULK_UPDATE",
    entity: "title",
    details: { reason: input.reason, count: updated.length, skipped: skipped.length, changes: updated },
    ip: guarded.ip,
  });

  revalidatePath("/admin/titles");
  return {
    ok: true,
    message: `حُدّث ${updated.length} عملًا${skipped.length ? ` وتُخطّي ${skipped.length}` : ""}. السبب مسجّل في سجل العمليات.`,
    updated,
    skipped,
  };
}
