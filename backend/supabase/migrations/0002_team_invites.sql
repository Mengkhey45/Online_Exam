ALTER TABLE "users" ALTER COLUMN "supabase_user_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_org_email_idx" ON "users" USING btree ("organization_id","email");