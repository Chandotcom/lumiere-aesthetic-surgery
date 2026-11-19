CREATE TABLE "content_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"draft" jsonb,
	"published" jsonb,
	"draft_updated_at" timestamp with time zone,
	"draft_updated_by" text,
	"published_at" timestamp with time zone,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_document_id_content_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."content_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_documents_kind_key_idx" ON "content_documents" USING btree ("kind","key");--> statement-breakpoint
CREATE INDEX "content_revisions_document_idx" ON "content_revisions" USING btree ("document_id","created_at");