CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"supabase_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'teacher' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"class_id" text,
	"student_ref" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"program" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"class_id" text,
	"filename" text NOT NULL,
	"status" text DEFAULT 'staged' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_staging" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"import_id" text NOT NULL,
	"row_index" integer NOT NULL,
	"data" jsonb NOT NULL,
	"problems" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"group_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"access" text DEFAULT 'closed' NOT NULL,
	"security" text DEFAULT 'medium' NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"pass_mark_pct" integer DEFAULT 50 NOT NULL,
	"total_marks" integer DEFAULT 0 NOT NULL,
	"exam_key" text NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_version_id" text,
	"results_released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"mode" text DEFAULT 'blocks' NOT NULL,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"pdf_page_urls" jsonb,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"section_id" text NOT NULL,
	"source_question_id" text,
	"type" text NOT NULL,
	"stem" text DEFAULT '' NOT NULL,
	"marks" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"pinned" boolean,
	"options" jsonb,
	"blanks" jsonb,
	"language" text,
	"char_limit" integer,
	"shuffle_options" boolean,
	"reviewed" boolean,
	"confidence" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"total_marks" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"exam_version_id" text NOT NULL,
	"student_id" text NOT NULL,
	"presented_order" jsonb NOT NULL,
	"presented_options" jsonb NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"lock_reason" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"option_ids" jsonb,
	"blank_answers" jsonb,
	"text" text,
	"file_url" text,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"auto_score" double precision,
	"awarded_marks" double precision,
	"comment" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proctoring_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"type" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"duration_ms" integer,
	"char_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_supabase_uid_idx" ON "users" USING btree ("supabase_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_org_ref_idx" ON "students" USING btree ("organization_id","student_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "exams_org_key_idx" ON "exams" USING btree ("organization_id","exam_key");--> statement-breakpoint
CREATE UNIQUE INDEX "answers_attempt_question_idx" ON "answers" USING btree ("attempt_id","question_id");