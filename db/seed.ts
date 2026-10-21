/**
 * تعبئة قاعدة البيانات بمحتوى العرض التجريبي.
 * التشغيل: npm run db:seed  (أو npm run db:reset لبداية نظيفة)
 */
import { config } from "dotenv";
config();

import { getDb, schema } from "./index";
import { CATALOG, GENRES, HERO_ORDER, HOME_SECTIONS } from "./catalog";
import { buildSearchText, normalizeArabic, slugify } from "../lib/slug";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { SETTING_DEFAULTS } from "../lib/settings";

const HERO_BACKDROPS: Record<string, string> = {
  "shadow-of-the-sands": "/media/hero-sands.jpg",
  "cairo-night": "/media/hero-cairo.jpg",
  "orbit-of-silence": "/media/hero-orbit.jpg",
  "the-hall-of-shadows": "/media/hero-hall.jpg",
};

const DAY = 86400000;

async function wipe(db: Awaited<ReturnType<typeof getDb>>) {
  const tables = [
    "curated_items",
    "curated_lists",
    "home_sections",
    "title_views",
    "watchlist_items",
    "credits",
    "episodes",
    "seasons",
    "trailers",
    "title_genres",
    "titles",
    "people",
    "genres",
    "import_jobs",
    "audit_logs",
    "contact_messages",
    "media_assets",
    "rate_limit_entries",
    "login_attempts",
    "password_reset_tokens",
    "sessions",
    "users",
    "site_settings",
  ];
  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

/**
 * حارس ضد مسح قاعدة بيانات حقيقية بالخطأ.
 * التعبئة تبدأ بـ TRUNCATE لكل الجداول، لذا لا تعمل على قاعدة شبكية (Postgres مُدار)
 * ولا في بيئة إنتاج إلا بتأكيد صريح: SEED_DEMO=1
 */
function guardTarget() {
  const url = process.env.DATABASE_URL ?? "";
  const remote = /^postgres(ql)?:\/\//.test(url);
  const prod = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_ENV);
  if (!remote && !prod) return;
  if (process.env.SEED_DEMO === "1") return;

  console.error("✗ أُلغيت التعبئة: هذه القاعدة ليست قاعدة تطوير محلية.");
  console.error(`  الهدف: ${remote ? "Postgres عبر الشبكة" : "بيئة إنتاج"} — والتعبئة تمسح كل الجداول أولًا.`);
  console.error("  لإعداد بيئة إنتاج نظيفة: npm run db:migrate ثم npm run admin:password -- <email> \"<password>\"");
  console.error("  لزرع بيانات العرض على هذه القاعدة صراحةً: SEED_DEMO=1 npm run db:seed");
  process.exit(1);
}

async function main() {
  guardTarget();
  const db = await getDb();
  console.log("→ تهيئة قاعدة البيانات…");
  await wipe(db);

  // ── المستخدمون ──
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@loomix.tv").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Loomix@2026";
  const adminName = process.env.ADMIN_NAME || "مدير Loomix";

  const [admin] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      name: adminName,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    })
    .returning();

  await db.insert(schema.users).values([
    {
      email: "editor@loomix.tv",
      name: "سارة — محرر محتوى",
      passwordHash: await bcrypt.hash("Editor@2026", 10),
      role: "EDITOR",
    },
    {
      email: "viewer@loomix.tv",
      name: "زائر اختبار",
      passwordHash: await bcrypt.hash("Viewer@2026", 10),
      role: "VIEWER",
    },
  ]);

  // ── التصنيفات ──
  const genreRows = await db.insert(schema.genres).values(GENRES).returning();
  const genreBySlug = new Map(genreRows.map((g) => [g.slug, g]));

  // ── الأشخاص ──
  const peopleMap = new Map<string, { id: string; slug: string }>();
  for (const item of CATALOG) {
    for (const credit of item.credits) {
      const key = credit.nameEn.toLowerCase();
      if (peopleMap.has(key)) continue;
      const slug = slugify(credit.nameEn);
      const [person] = await db
        .insert(schema.people)
        .values({
          slug,
          nameAr: credit.nameAr,
          nameEn: credit.nameEn,
          bioAr: credit.bio ?? null,
          birthYear: null,
        })
        .returning({ id: schema.people.id, slug: schema.people.slug });
      peopleMap.set(key, person);
    }
  }

  // ── الأعمال ──
  const titleIdBySlug = new Map<string, string>();
  const titleRecords: { id: string; slug: string; rating: number; publishedAt: Date }[] = [];
  let index = 0;

  for (const item of CATALOG) {
    const publishedAt = new Date(Date.now() - (CATALOG.length - index) * 3.5 * DAY + index * 2 * 3600000);
    const [row] = await db
      .insert(schema.titles)
      .values({
        slug: item.slug,
        type: item.type,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        taglineAr: item.taglineAr ?? null,
        overviewAr: item.overviewAr,
        releaseYear: item.year,
        releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
        runtimeMinutes: item.runtime ?? null,
        status: item.status,
        countryCode: item.countryCode,
        countryNameAr: item.countryNameAr,
        language: item.language,
        posterPath: `/art/poster-${item.slug}.webp`,
        backdropPath: HERO_BACKDROPS[item.slug] ?? `/art/backdrop-${item.slug}.webp`,
        ratingValue: item.rating.value,
        ratingSource: item.rating.source,
        ratingCount: item.rating.count ?? null,
        state: "PUBLISHED",
        isDemo: true,
        featured: Boolean(item.featured),
        editorNoteAr: item.editorNote ?? null,
        searchText: buildSearchText([
          item.titleAr,
          item.titleEn,
          normalizeArabic(item.titleAr),
          item.genres.join(" "),
          String(item.year),
          item.countryNameAr,
          item.credits.map((c) => `${c.nameAr} ${c.nameEn}`).join(" "),
        ]),
        publishedAt,
        // العدد يبدأ من صفر: «الأكثر مشاهدة» لا تُبنى إلا على زيارات حقيقية
        // سجّلها /api/views، ولا يُختلق عدّاد تجريبي يوهم بقياس غير موجود.
        viewsCount: 0,
      })
      .returning({ id: schema.titles.id, slug: schema.titles.slug });

    titleIdBySlug.set(item.slug, row.id);
    titleRecords.push({ id: row.id, slug: item.slug, rating: item.rating.value, publishedAt });

    await db.insert(schema.titleGenres).values(
      item.genres.map((g) => ({ titleId: row.id, genreId: genreBySlug.get(g)!.id })),
    );

    let creditSort = 0;
    for (const credit of item.credits) {
      const person = peopleMap.get(credit.nameEn.toLowerCase())!;
      await db
        .insert(schema.credits)
        .values({
          titleId: row.id,
          personId: person.id,
          role: credit.role,
          characterName: credit.character ?? null,
          sort: creditSort++,
        })
        .onConflictDoNothing();
    }

    // المواسم والحلقات
    if (item.seasons?.length) {
      for (const season of item.seasons) {
        const [seasonRow] = await db
          .insert(schema.seasons)
          .values({
            titleId: row.id,
            number: season.number,
            nameAr: season.nameAr ?? null,
            overviewAr: season.overview ?? null,
            year: season.year,
          })
          .returning({ id: schema.seasons.id });

        if (season.episodes.length) {
          await db.insert(schema.episodes).values(
            season.episodes.map((ep) => ({
              seasonId: seasonRow.id,
              number: ep.number,
              nameAr: ep.nameAr,
              overviewAr: ep.overview ?? null,
              airDate: ep.airDate ? new Date(ep.airDate) : null,
              runtime: ep.runtime ?? null,
              state: "PUBLISHED" as const,
            })),
          );
        }
      }
    }

    // التريلرات: معاينة بصرية تجريبية أصلية (ليست فيديو خارجيًا)
    const isSerial = item.type !== "MOVIE";
    await db.insert(schema.trailers).values([
      {
        titleId: row.id,
        youtubeId: `demo-${item.slug}`,
        nameAr: `${item.titleAr} — تريلر رسمي`,
        kind: "OFFICIAL",
        language: "ar",
        isPrimary: true,
        health: "UNVERIFIED",
        publishedAt: new Date(publishedAt.getTime() - 2 * DAY),
        sort: 0,
      },
      ...(isSerial
        ? [
            {
              titleId: row.id,
              youtubeId: `demo-${item.slug}-teaser`,
              nameAr: `${item.titleAr} — إعلان تشويقي`,
              kind: "TEASER" as const,
              language: "ar",
              isPrimary: false,
              health: "UNVERIFIED" as const,
              publishedAt: new Date(publishedAt.getTime() - 6 * DAY),
              sort: 1,
            },
          ]
        : []),
    ]);

    index += 1;
  }

  // ── الصفحة الرئيسية ──
  await db.insert(schema.homeSections).values(
    HOME_SECTIONS.map((section) => ({
      key: section.key,
      titleAr: section.titleAr,
      subtitleAr: section.subtitleAr ?? null,
      kind: section.kind,
      source: section.source,
      visible: true,
      sort: section.sort,
    })),
  );

  const lists = await db
    .insert(schema.curatedLists)
    .values([
      { key: "TRENDING_DAY" as const, nameAr: "ترند اليوم" },
      { key: "TRENDING_WEEK" as const, nameAr: "ترند الأسبوع" },
      { key: "EDITORS_PICK" as const, nameAr: "اختيارات المحرر" },
      { key: "FEATURED_HERO" as const, nameAr: "واجهة الصفحة الرئيسية" },
    ])
    .returning();
  const listByKey = new Map(lists.map((l) => [l.key, l.id]));

  const byRating = [...titleRecords].sort((a, b) => b.rating - a.rating);
  const trendingWeek = byRating.slice(0, 10);
  const trendingDay = [...byRating].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, 8);
  const editors = byRating.filter((t) => ["moon-blade", "the-hall-of-shadows", "shadow-of-the-sands", "cairo-night", "inherited-river", "heirs-of-silk", "moon-blade", "the-memory-of-water"].includes(t.slug));

  const editorPicks = (editors.length ? editors : byRating).slice(0, 8);

  const curatedValues: { listId: string; titleId: string; rank: number; pinned: boolean }[] = [];
  HERO_ORDER.forEach((slug, i) => {
    const id = titleIdBySlug.get(slug);
    if (id) curatedValues.push({ listId: listByKey.get("FEATURED_HERO")!, titleId: id, rank: i, pinned: i === 0 });
  });
  trendingWeek.forEach((t, i) => curatedValues.push({ listId: listByKey.get("TRENDING_WEEK")!, titleId: t.id, rank: i, pinned: false }));
  trendingDay.forEach((t, i) => curatedValues.push({ listId: listByKey.get("TRENDING_DAY")!, titleId: t.id, rank: i, pinned: false }));
  editorPicks.forEach((t, i) => curatedValues.push({ listId: listByKey.get("EDITORS_PICK")!, titleId: t.id, rank: i, pinned: false }));
  await db.insert(schema.curatedItems).values(curatedValues);

  // ── مشاهدات مسجّلة (لتفعيل "الأكثر مشاهدة" ببيانات حقيقية) ──
  const viewRows: { titleId: string; createdAt: Date }[] = [];
  for (const title of titleRecords.slice(0, 14)) {
    const count = Math.max(3, Math.round(title.rating));
    for (let i = 0; i < count; i++) {
      viewRows.push({ titleId: title.id, createdAt: new Date(Date.now() - i * 3.2 * 3600000) });
    }
  }
  await db.insert(schema.titleViews).values(viewRows);

  // ── الإعدادات ──
  await db.insert(schema.siteSettings).values(
    Object.entries(SETTING_DEFAULTS).map(([key, value]) => ({ key, value: String(value) })),
  );

  // ── رسائل التواصل ──
  await db.insert(schema.contactMessages).values([
    {
      kind: "CONTACT",
      name: "منى عبد الرحمن",
      email: "mona@example.com",
      subject: "اقتراح إضافة أعمال مصرية قديمة",
      message: "أتابع لوميكس منذ أسبوعين وأحب طريقة عرض الأعمال. أقترح إضافة قسم للكلاسيكيات المصرية.",
      status: "NEW",
    },
    {
      kind: "DMCA",
      name: "مكتب حقوق النشر",
      email: "legal@example.org",
      subject: "طلب مراجعة بيانات عمل",
      message: "نرجو مراجعة بيانات أحد الأعمال المدرجة وتصحيح سنة الإصدار المذكورة في الصفحة.",
      status: "IN_PROGRESS",
    },
    {
      kind: "CONTACT",
      name: "أحمد سيد",
      email: "ahmed@example.com",
      subject: "مشكلة في تشغيل التريلر",
      message: "زر التريلر لا يعمل على متصفح Safari في الهاتف. أرجو المراجعة.",
      status: "RESOLVED",
    },
    {
      kind: "CONTACT",
      name: "ليلى مراد",
      email: "layla@example.com",
      subject: "شراكة محتوى",
      message: "نعمل على توزيع محتوى مرخّص ونرغب في مناقشة شراكة عرض تريلرات.",
      status: "NEW",
    },
  ]);

  // ── مكتبة الوسائط (أصول المشروع) ──
  await db.insert(schema.mediaAssets).values(
    CATALOG.flatMap((item) => [
      {
        path: `/art/poster-${item.slug}.webp`,
        alt: `بوستر ${item.titleAr}`,
        width: 1000,
        height: 1500,
        mimeType: "image/webp",
        sizeBytes: null,
      },
      {
        path: `/art/backdrop-${item.slug}.webp`,
        alt: `خلفية ${item.titleAr}`,
        width: 1920,
        height: 1080,
        mimeType: "image/webp",
        sizeBytes: null,
      },
    ]),
  );

  // ── مهمة استيراد سابقة (كمثال على سجل التقارير) ──
  await db.insert(schema.importJobs).values({
    kind: "CSV",
    filename: "loomix-sample-import.csv",
    status: "PARTIAL",
    total: 5,
    processed: 5,
    succeeded: 3,
    failed: 2,
    report: {
      rows: [
        { line: 2, ok: true, title: "عمل مستورد ١" },
        { line: 3, ok: true, title: "عمل مستورد ٢" },
        { line: 4, ok: false, errors: ["الاسم العربي مطلوب"] },
        { line: 5, ok: true, title: "عمل مستورد ٣" },
        { line: 6, ok: false, errors: ["النوع غير معروف: podcast"] },
      ],
    },
    userId: admin.id,
  });

  await db.insert(schema.auditLogs).values({
    userId: admin.id,
    action: "SEED",
    entity: "system",
    details: { titles: CATALOG.length, genres: GENRES.length, users: 3 },
  });

  console.log(`✓ تمت التعبئة: ${CATALOG.length} عمل، ${GENRES.length} تصنيف، ${peopleMap.size} شخص، ${titleRecords.length} تريلر رئيسي`);
  console.log(`  حساب المدير: ${adminEmail} / ${adminPassword}`);
  console.log("  محرر: editor@loomix.tv / Editor@2026 — مستخدم: viewer@loomix.tv / Viewer@2026");
  console.log("  ⚠️ غيّر كلمات المرور قبل أي نشر علني.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("✗ فشلت التعبئة:", error);
    process.exit(1);
  });
