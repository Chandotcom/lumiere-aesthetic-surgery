import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "consult_booked",
  "won",
  "lost",
]);
export const appointmentType = pgEnum("appointment_type", [
  "consultation",
  "virtual",
  "surgery",
  "follow_up",
]);
export const appointmentStatus = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
]);
export const procedureCategory = pgEnum("procedure_category", [
  "face",
  "breast",
  "body",
  "non_surgical",
]);
export const moderationStatus = pgEnum("moderation_status", [
  "pending",
  "approved",
  "hidden",
]);
export const publishStatus = pgEnum("publish_status", ["draft", "published"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// Shared SEO columns for content with its own public page.
const seoColumns = {
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImageUrl: text("og_image_url"),
  focusKeyword: text("focus_keyword"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
};

// ── Tables ───────────────────────────────────────────────────────────────
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: procedureCategory("category").notNull(),
  priceFrom: integer("price_from"),
  priceTo: integer("price_to"),
  summary: text("summary").notNull(),
  ...seoColumns,
  ...timestamps,
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  procedureId: integer("procedure_id").references(() => procedures.id),
  // Free-text interests from the consultation form (multiple procedures allowed)
  procedureInterest: text("procedure_interest"),
  consultType: text("consult_type"), // in_person | virtual
  timeframe: text("timeframe"), // asap | 1-3_months | 3-6_months | researching
  contactMethod: text("contact_method"), // email | phone | text
  status: leadStatus("status").default("new").notNull(),
  message: text("message"),
  smsConsent: boolean("sms_consent").default(false).notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  // Attribution (first touch) — captured client-side, no third-party pixels.
  source: text("source").default("website").notNull(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  referrer: text("referrer"),
  landingPage: text("landing_page"),
  // Custom forms (admin → Forms): the form's slug (null = consultation form) and the answers that
  // don't map onto the columns above, with each question's label snapshotted at submission time.
  formSlug: text("form_slug"),
  formAnswers: jsonb("form_answers").$type<{ label: string; value: string }[]>(),
  firstRespondedAt: timestamp("first_responded_at", { withTimezone: true }),
  assignedTo: text("assigned_to"), // Clerk user id
  notes: text("notes"),
  ...timestamps,
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .references(() => leads.id, { onDelete: "cascade" })
    .notNull(),
  type: appointmentType("type").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: appointmentStatus("status").default("scheduled").notNull(),
  depositPaid: boolean("deposit_paid").default(false).notNull(),
  depositAmount: integer("deposit_amount"),
  ...timestamps,
});

// ── Before/after gallery ─────────────────────────────────────────────────
// One row per patient case. It shows on the public site only when status = "approved", and
// approval requires consentSigned. Photos live in the PRIVATE gallery Blob store and are served
// through /api/gallery-image/[id], which repeats those checks. Sample (demo) cases have no photos
// and render placeholder art.
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: serial("id").primaryKey(),
    number: integer("number").notNull().unique(), // public case number, slug = <procedure>-<number>
    procedureSlug: text("procedure_slug").notNull(),
    ageRange: text("age_range").notNull(),
    timeAfter: text("time_after").notNull(),
    notes: text("notes").notNull().default(""),
    views: text("views").array().notNull(), // photo angles, in display order: Front | Profile | Oblique
    consentSigned: boolean("consent_signed").default(false).notNull(),
    consentScope: text("consent_scope").default("website").notNull(), // website | website_social
    consentRecordedAt: timestamp("consent_recorded_at", { withTimezone: true }),
    consentRecordedBy: text("consent_recorded_by"), // Clerk user id
    showFace: boolean("show_face").default(false).notNull(),
    isSample: boolean("is_sample").default(false).notNull(), // demo case with placeholder art
    status: moderationStatus("status").default("pending").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }), // first approval
    createdBy: text("created_by"),
    ...timestamps,
  },
  (t) => [index("gallery_items_status_idx").on(t.status, t.publishedAt)],
);

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .references(() => galleryItems.id, { onDelete: "cascade" })
      .notNull(),
    view: text("view").notNull(),
    side: text("side").notNull(), // before | after
    pathname: text("pathname").notNull(), // in the private store; never a public URL
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("gallery_photos_slot_idx").on(t.itemId, t.view, t.side)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // first name + initial only
    rating: integer("rating").notNull(), // 1-5
    body: text("body").notNull(),
    procedureSlug: text("procedure_slug"), // optional, from src/lib/content/procedures.ts
    photoUrl: text("photo_url"), // optional reviewer portrait, from the media library
    photoAlt: text("photo_alt"),
    source: text("source").default("clinic").notNull(), // clinic | google | email | other
    verified: boolean("verified").default(false).notNull(), // staff confirmed a real patient
    isSample: boolean("is_sample").default(false).notNull(), // demo label "Sample review"
    status: moderationStatus("status").default("pending").notNull(),
    hiddenReason: text("hidden_reason"), // why a review was removed (policy, never the rating)
    publishedAt: timestamp("published_at", { withTimezone: true }), // first publication; locks quote + rating
    createdBy: text("created_by"),
    ...timestamps,
  },
  (t) => [index("reviews_status_idx").on(t.status, t.publishedAt)],
);

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(), // markdown
  coverUrl: text("cover_url"),
  coverAlt: text("cover_alt"),
  status: publishStatus("status").default("draft").notNull(),
  authorId: text("author_id"), // Clerk user id
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...seoColumns,
  ...timestamps,
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  procedureId: integer("procedure_id").references(() => procedures.id), // null = general FAQ
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: publishStatus("status").default("draft").notNull(),
  ...timestamps,
});

// Per-path SEO overrides for static pages (home, about, contact…).
export const seoMeta = pgTable(
  "seo_meta",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ogImageUrl: text("og_image_url"),
    noindex: boolean("noindex").default(false).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("seo_meta_path_idx").on(t.path)],
);

// ── Media library ────────────────────────────────────────────────────────
// Site imagery uploaded by staff (public Vercel Blob store). Never patient photos: those
// belong to the consent-gated gallery, which uses a private store.
export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull().unique(),
    pathname: text("pathname").notNull(),
    alt: text("alt").notNull().default(""),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    uploadedBy: text("uploaded_by"), // Clerk user id
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("media_created_idx").on(t.createdAt)],
);

// ── Editable site content (CMS) ──────────────────────────────────────────
// One row per editable document, e.g. kind "procedure" + key "rhinoplasty", or "home" + "main".
// The public site reads `published`. `draft` holds unpublished edits (previewed with Draft Mode).
// Code defaults in src/lib/content/* apply wherever a document has never been published.
export const contentDocuments = pgTable(
  "content_documents",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    draft: jsonb("draft"),
    published: jsonb("published"),
    draftUpdatedAt: timestamp("draft_updated_at", { withTimezone: true }),
    draftUpdatedBy: text("draft_updated_by"), // Clerk user id
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by"), // Clerk user id
    ...timestamps,
  },
  (t) => [uniqueIndex("content_documents_kind_key_idx").on(t.kind, t.key)],
);

/** A snapshot of every published version, so earlier versions can be restored. */
export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .references(() => contentDocuments.id, { onDelete: "cascade" })
      .notNull(),
    data: jsonb("data").notNull(),
    publishedBy: text("published_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("content_revisions_document_idx").on(t.documentId, t.createdAt)],
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user id
  action: text("action").notNull(), // e.g. "lead.status_changed"
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
