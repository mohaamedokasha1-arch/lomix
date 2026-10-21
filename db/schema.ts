/**
 * Loomix — مخطط قاعدة البيانات (PostgreSQL)
 *
 * مصدر واحد للحقيقة: يُستخدم نفس المخطط في الإنتاج (Postgres مُدار)
 * وفي التطوير المحلي (PGlite — Postgres كامل يعمل في WASM).
 */
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ───────────────────────────── Enums ─────────────────────────────

export const roleEnum = pgEnum("role", ["ADMIN", "EDITOR", "VIEWER"]);
export const titleTypeEnum = pgEnum("title_type", ["MOVIE", "SERIES", "ANIME"]);
export const releaseStatusEnum = pgEnum("release_status", [
  "RELEASED",
  "ONGOING",
  "UPCOMING",
  "ENDED",
  "CANCELLED",
]);
export const publishStateEnum = pgEnum("publish_state", ["DRAFT", "PUBLISHED"]);
export const creditRoleEnum = pgEnum("credit_role", [
  "ACTOR",
  "DIRECTOR",
  "WRITER",
  "COMPOSER",
]);
export const episodeStateEnum = pgEnum("episode_state", ["DRAFT", "PUBLISHED"]);
export const trailerKindEnum = pgEnum("trailer_kind", ["OFFICIAL", "TEASER", "PROMO"]);
export const trailerHealthEnum = pgEnum("trailer_health", [
  "OK",
  "BROKEN",
  "CHECKING",
  "UNVERIFIED",
]);
export const homeSectionKindEnum = pgEnum("home_section_kind", [
  "HERO",
  "POSTER_ROW",
  "TRAILER_ROW",
  "GENRE_ROW",
  "EDITORIAL",
]);
export const curatedListKeyEnum = pgEnum("curated_list_key", [
  "TRENDING_DAY",
  "TRENDING_WEEK",
  "EDITORS_PICK",
  "FEATURED_HERO",
]);
export const messageKindEnum = pgEnum("message_kind", ["CONTACT", "DMCA"]);
export const messageStatusEnum = pgEnum("message_status", [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
]);
export const importStatusEnum = pgEnum("import_status", [
  "QUEUED",
  "RUNNING",
  "DONE",
  "PARTIAL",
  "FAILED",
]);

// ───────────────────────────── المستخدمون ─────────────────────────────

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("VIEWER"),
    isActive: boolean("is_active").notNull().default(true),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_exp_idx").on(t.expiresAt)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: id(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("prt_user_idx").on(t.userId)],
);

// ───────────────────────────── المحتوى ─────────────────────────────

export const titles = pgTable(
  "titles",
  {
    id: id(),
    type: titleTypeEnum("type").notNull(),
    slug: text("slug").notNull().unique(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en"),
    searchText: text("search_text").notNull().default(""),
    taglineAr: text("tagline_ar"),
    overviewAr: text("overview_ar").notNull(),
    releaseYear: integer("release_year"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    runtimeMinutes: integer("runtime_minutes"),
    status: releaseStatusEnum("status").notNull().default("RELEASED"),
    countryCode: text("country_code"),
    countryNameAr: text("country_name_ar"),
    language: text("language"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    ratingValue: doublePrecision("rating_value"),
    ratingSource: text("rating_source"),
    ratingCount: integer("rating_count"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    state: publishStateEnum("state").notNull().default("DRAFT"),
    isDemo: boolean("is_demo").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    editorNoteAr: text("editor_note_ar"),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    viewsCount: integer("views_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("titles_type_state_idx").on(t.type, t.state),
    index("titles_state_pub_idx").on(t.state, t.publishedAt),
    index("titles_year_idx").on(t.releaseYear),
    index("titles_rating_idx").on(t.ratingValue),
    index("titles_country_idx").on(t.countryCode),
    index("titles_views_idx").on(t.viewsCount),
    // منع تكرار العمل نفسه (نفس الاسم العربي ونفس السنة).
    uniqueIndex("titles_unique_name_year_idx").on(t.titleAr, t.releaseYear),
  ],
);

export const genres = pgTable(
  "genres",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("genres_sort_idx").on(t.sort)],
);

export const titleGenres = pgTable(
  "title_genres",
  {
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.titleId, t.genreId] }),
    index("tg_genre_idx").on(t.genreId),
  ],
);

export const people = pgTable(
  "people",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en"),
    imagePath: text("image_path"),
    bioAr: text("bio_ar"),
    birthYear: integer("birth_year"),
  },
  (t) => [index("people_name_idx").on(t.nameAr)],
);

export const credits = pgTable(
  "credits",
  {
    id: id(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    role: creditRoleEnum("role").notNull(),
    characterName: text("character_name"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    uniqueIndex("credits_unique_idx").on(t.titleId, t.personId, t.role),
    index("credits_person_idx").on(t.personId, t.role),
  ],
);

export const seasons = pgTable(
  "seasons",
  {
    id: id(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    nameAr: text("name_ar"),
    overviewAr: text("overview_ar"),
    year: integer("year"),
    posterPath: text("poster_path"),
  },
  (t) => [
    uniqueIndex("seasons_unique_idx").on(t.titleId, t.number),
    index("seasons_title_idx").on(t.titleId),
  ],
);

export const episodes = pgTable(
  "episodes",
  {
    id: id(),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    nameAr: text("name_ar").notNull(),
    overviewAr: text("overview_ar"),
    airDate: timestamp("air_date", { withTimezone: true }),
    runtime: integer("runtime"),
    state: episodeStateEnum("state").notNull().default("PUBLISHED"),
  },
  (t) => [
    uniqueIndex("episodes_unique_idx").on(t.seasonId, t.number),
    index("episodes_season_idx").on(t.seasonId),
  ],
);

export const trailers = pgTable(
  "trailers",
  {
    id: id(),
    titleId: text("title_id").references(() => titles.id, { onDelete: "cascade" }),
    seasonId: text("season_id").references(() => seasons.id, { onDelete: "cascade" }),
    youtubeId: text("youtube_id").notNull(),
    nameAr: text("name_ar").notNull(),
    kind: trailerKindEnum("kind").notNull().default("OFFICIAL"),
    language: text("language").notNull().default("ar"),
    isPrimary: boolean("is_primary").notNull().default(false),
    health: trailerHealthEnum("health").notNull().default("UNVERIFIED"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    index("trailers_title_idx").on(t.titleId),
    index("trailers_primary_idx").on(t.isPrimary),
    index("trailers_pub_idx").on(t.publishedAt),
  ],
);

// ───────────────────────────── الصفحة الرئيسية والترند ─────────────────────────────

export const homeSections = pgTable(
  "home_sections",
  {
    id: id(),
    key: text("key").notNull().unique(),
    titleAr: text("title_ar").notNull(),
    subtitleAr: text("subtitle_ar"),
    kind: homeSectionKindEnum("kind").notNull().default("POSTER_ROW"),
    source: text("source").notNull().default("LATEST"),
    sourceValue: text("source_value"),
    visible: boolean("visible").notNull().default(true),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("home_sections_sort_idx").on(t.sort)],
);

export const curatedLists = pgTable("curated_lists", {
  id: id(),
  key: curatedListKeyEnum("key").notNull().unique(),
  nameAr: text("name_ar").notNull(),
});

export const curatedItems = pgTable(
  "curated_items",
  {
    id: id(),
    listId: text("list_id")
      .notNull()
      .references(() => curatedLists.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull().default(0),
    pinned: boolean("pinned").notNull().default(false),
  },
  (t) => [
    uniqueIndex("curated_unique_idx").on(t.listId, t.titleId),
    index("curated_rank_idx").on(t.listId, t.rank),
  ],
);

export const titleViews = pgTable(
  "title_views",
  {
    id: id(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("title_views_title_idx").on(t.titleId, t.createdAt)],
);

// ───────────────────────────── الحسابات ─────────────────────────────

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("watchlist_unique_idx").on(t.userId, t.titleId)],
);

// ───────────────────────────── الإدارة ─────────────────────────────

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    kind: messageKindEnum("kind").notNull().default("CONTACT"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: messageStatusEnum("status").notNull().default("NEW"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("messages_status_idx").on(t.status), index("messages_date_idx").on(t.createdAt)],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    path: text("path").notNull().unique(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    mimeType: text("mime_type"),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [index("media_date_idx").on(t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown> | null>(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_date_idx").on(t.createdAt),
    index("audit_entity_idx").on(t.entity, t.entityId),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const importJobs = pgTable(
  "import_jobs",
  {
    id: id(),
    kind: text("kind").notNull().default("CSV"),
    filename: text("filename"),
    status: importStatusEnum("status").notNull().default("QUEUED"),
    total: integer("total").notNull().default(0),
    processed: integer("processed").notNull().default(0),
    succeeded: integer("succeeded").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    report: jsonb("report").$type<unknown>(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("import_jobs_date_idx").on(t.createdAt)],
);

export const rateLimitEntries = pgTable("rate_limit_entries", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    ip: text("ip"),
    email: text("email"),
    success: boolean("success").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_date_idx").on(t.createdAt)],
);

// ───────────────────────────── أنواع مساعدة ─────────────────────────────

export type TitleRow = typeof titles.$inferSelect;
export type TitleInsert = typeof titles.$inferInsert;
export type GenreRow = typeof genres.$inferSelect;
export type TrailerRow = typeof trailers.$inferSelect;
export type SeasonRow = typeof seasons.$inferSelect;
export type EpisodeRow = typeof episodes.$inferSelect;
export type PersonRow = typeof people.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type HomeSectionRow = typeof homeSections.$inferSelect;

export const sqlNow = sql`now()`;
