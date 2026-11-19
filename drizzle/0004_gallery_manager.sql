CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"procedure_slug" text NOT NULL,
	"age_range" text NOT NULL,
	"time_after" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"views" text[] NOT NULL,
	"consent_signed" boolean DEFAULT false NOT NULL,
	"consent_scope" text DEFAULT 'website' NOT NULL,
	"consent_recorded_at" timestamp with time zone,
	"consent_recorded_by" text,
	"show_face" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_items_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"view" text NOT NULL,
	"side" text NOT NULL,
	"pathname" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_item_id_gallery_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."gallery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_items_status_idx" ON "gallery_items" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_photos_slot_idx" ON "gallery_photos" USING btree ("item_id","view","side");