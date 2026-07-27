CREATE TABLE "converted_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"import_id" text NOT NULL,
	"page_id" text NOT NULL,
	"number" integer NOT NULL,
	"block" jsonb NOT NULL,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"numeric_mismatch" jsonb
);
--> statement-breakpoint
CREATE TABLE "import_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"import_id" text NOT NULL,
	"page_index" integer NOT NULL,
	"label" text NOT NULL,
	"source_text" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"exam_id" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"filename" text NOT NULL,
	"source_url" text NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"pages_done" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
