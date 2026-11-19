ALTER TABLE "reviews" ALTER COLUMN "is_sample" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "procedure_slug" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "photo_alt" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source" text DEFAULT 'clinic' NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "created_by" text;--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status","published_at");