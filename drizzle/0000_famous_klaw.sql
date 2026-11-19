CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('consultation', 'virtual', 'surgery', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'consult_booked', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."procedure_category" AS ENUM('face', 'breast', 'body', 'non_surgical');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"type" "appointment_type" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"deposit_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_url" text,
	"cover_alt" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp with time zone,
	"meta_title" text,
	"meta_description" text,
	"og_image_url" text,
	"focus_keyword" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedure_id" integer,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedure_id" integer,
	"before_url" text NOT NULL,
	"after_url" text NOT NULL,
	"alt_text" text NOT NULL,
	"caption" text,
	"consent_signed" boolean DEFAULT false NOT NULL,
	"consent_scope" text DEFAULT 'website' NOT NULL,
	"show_face" boolean DEFAULT false NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"procedure_id" integer,
	"procedure_interest" text,
	"consult_type" text,
	"timeframe" text,
	"contact_method" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"message" text,
	"sms_consent" boolean DEFAULT false NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"referrer" text,
	"landing_page" text,
	"first_responded_at" timestamp with time zone,
	"assigned_to" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "procedure_category" NOT NULL,
	"price_from" integer,
	"price_to" integer,
	"summary" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"og_image_url" text,
	"focus_keyword" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procedures_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"procedure_id" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"og_image_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seo_meta_path_idx" ON "seo_meta" USING btree ("path");