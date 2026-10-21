CREATE TYPE "public"."credit_role" AS ENUM('ACTOR', 'DIRECTOR', 'WRITER', 'COMPOSER');--> statement-breakpoint
CREATE TYPE "public"."curated_list_key" AS ENUM('TRENDING_DAY', 'TRENDING_WEEK', 'EDITORS_PICK', 'FEATURED_HERO');--> statement-breakpoint
CREATE TYPE "public"."episode_state" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."home_section_kind" AS ENUM('HERO', 'POSTER_ROW', 'TRAILER_ROW', 'GENRE_ROW', 'EDITORIAL');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('QUEUED', 'RUNNING', 'DONE', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."message_kind" AS ENUM('CONTACT', 'DMCA');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('NEW', 'IN_PROGRESS', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."publish_state" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."release_status" AS ENUM('RELEASED', 'ONGOING', 'UPCOMING', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."title_type" AS ENUM('MOVIE', 'SERIES', 'ANIME');--> statement-breakpoint
CREATE TYPE "public"."trailer_health" AS ENUM('OK', 'BROKEN', 'CHECKING', 'UNVERIFIED');--> statement-breakpoint
CREATE TYPE "public"."trailer_kind" AS ENUM('OFFICIAL', 'TEASER', 'PROMO');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "message_kind" DEFAULT 'CONTACT' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" "message_status" DEFAULT 'NEW' NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role" "credit_role" NOT NULL,
	"character_name" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curated_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"title_id" text NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curated_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"key" "curated_list_key" NOT NULL,
	"name_ar" text NOT NULL,
	CONSTRAINT "curated_lists_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"number" integer NOT NULL,
	"name_ar" text NOT NULL,
	"overview_ar" text,
	"air_date" timestamp with time zone,
	"runtime" integer,
	"state" "episode_state" DEFAULT 'PUBLISHED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "home_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"title_ar" text NOT NULL,
	"subtitle_ar" text,
	"kind" "home_section_kind" DEFAULT 'POSTER_ROW' NOT NULL,
	"source" text DEFAULT 'LATEST' NOT NULL,
	"source_value" text,
	"visible" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "home_sections_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'CSV' NOT NULL,
	"filename" text,
	"status" "import_status" DEFAULT 'QUEUED' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"succeeded" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"report" jsonb,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"ip" text,
	"email" text,
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"alt" text,
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"mime_type" text,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text,
	"image_path" text,
	"bio_ar" text,
	"birth_year" integer,
	CONSTRAINT "people_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"number" integer NOT NULL,
	"name_ar" text,
	"overview_ar" text,
	"year" integer,
	"poster_path" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_genres" (
	"title_id" text NOT NULL,
	"genre_id" text NOT NULL,
	CONSTRAINT "title_genres_title_id_genre_id_pk" PRIMARY KEY("title_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "title_views" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "title_type" NOT NULL,
	"slug" text NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text,
	"search_text" text DEFAULT '' NOT NULL,
	"tagline_ar" text,
	"overview_ar" text NOT NULL,
	"release_year" integer,
	"release_date" timestamp with time zone,
	"runtime_minutes" integer,
	"status" "release_status" DEFAULT 'RELEASED' NOT NULL,
	"country_code" text,
	"country_name_ar" text,
	"language" text,
	"poster_path" text,
	"backdrop_path" text,
	"rating_value" double precision,
	"rating_source" text,
	"rating_count" integer,
	"seo_title" text,
	"seo_description" text,
	"state" "publish_state" DEFAULT 'DRAFT' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"editor_note_ar" text,
	"external_source" text,
	"external_id" text,
	"last_synced_at" timestamp with time zone,
	"views_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "titles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trailers" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text,
	"season_id" text,
	"youtube_id" text NOT NULL,
	"name_ar" text NOT NULL,
	"kind" "trailer_kind" DEFAULT 'OFFICIAL' NOT NULL,
	"language" text DEFAULT 'ar' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"health" "trailer_health" DEFAULT 'UNVERIFIED' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'VIEWER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curated_items" ADD CONSTRAINT "curated_items_list_id_curated_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."curated_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curated_items" ADD CONSTRAINT "curated_items_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_views" ADD CONSTRAINT "title_views_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trailers" ADD CONSTRAINT "trailers_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trailers" ADD CONSTRAINT "trailers_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_date_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_date_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credits_unique_idx" ON "credits" USING btree ("title_id","person_id","role");--> statement-breakpoint
CREATE INDEX "credits_person_idx" ON "credits" USING btree ("person_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "curated_unique_idx" ON "curated_items" USING btree ("list_id","title_id");--> statement-breakpoint
CREATE INDEX "curated_rank_idx" ON "curated_items" USING btree ("list_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "episodes_unique_idx" ON "episodes" USING btree ("season_id","number");--> statement-breakpoint
CREATE INDEX "episodes_season_idx" ON "episodes" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "genres_sort_idx" ON "genres" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "home_sections_sort_idx" ON "home_sections" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "import_jobs_date_idx" ON "import_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_date_idx" ON "login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_date_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prt_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "people_name_idx" ON "people" USING btree ("name_ar");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_unique_idx" ON "seasons" USING btree ("title_id","number");--> statement-breakpoint
CREATE INDEX "seasons_title_idx" ON "seasons" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_exp_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tg_genre_idx" ON "title_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "title_views_title_idx" ON "title_views" USING btree ("title_id","created_at");--> statement-breakpoint
CREATE INDEX "titles_type_state_idx" ON "titles" USING btree ("type","state");--> statement-breakpoint
CREATE INDEX "titles_state_pub_idx" ON "titles" USING btree ("state","published_at");--> statement-breakpoint
CREATE INDEX "titles_year_idx" ON "titles" USING btree ("release_year");--> statement-breakpoint
CREATE INDEX "titles_rating_idx" ON "titles" USING btree ("rating_value");--> statement-breakpoint
CREATE INDEX "titles_country_idx" ON "titles" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "titles_views_idx" ON "titles" USING btree ("views_count");--> statement-breakpoint
CREATE INDEX "trailers_title_idx" ON "trailers" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "trailers_primary_idx" ON "trailers" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "trailers_pub_idx" ON "trailers" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_unique_idx" ON "watchlist_items" USING btree ("user_id","title_id");