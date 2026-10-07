ALTER TABLE "organizations" ADD COLUMN "slug" text;
ALTER TABLE "organizations" ADD COLUMN "status" text NOT NULL DEFAULT 'pending_verification';
ALTER TABLE "organizations" ADD COLUMN "plan" text NOT NULL DEFAULT 'trial';
--> statement-breakpoint
-- Existing tenants keep working and receive stable, collision-free slugs.
UPDATE "organizations" SET "slug" = 'org-' || "id" WHERE "slug" IS NULL;
UPDATE "organizations" SET "status" = 'active';
--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");
