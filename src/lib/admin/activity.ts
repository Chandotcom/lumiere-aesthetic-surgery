import "server-only";
import { and, count, desc, eq, gte, inArray, lt, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { documentLabel, editorHref } from "./editor-links";

const { auditLog } = schema;

/** Sections of the activity filter, by the `entity` values each one writes. */
export const activitySections = {
  leads: { label: "Leads", entities: ["lead"] },
  appointments: { label: "Appointments", entities: ["appointment"] },
  content: { label: "Pages, journal & forms", entities: ["procedure", "home", "settings", "seo", "post", "page", "form"] },
  media: { label: "Media", entities: ["media"] },
  gallery: { label: "Gallery", entities: ["gallery_item"] },
  reviews: { label: "Reviews", entities: ["review"] },
  staff: { label: "Staff", entities: ["staff", "staff_invitation"] },
} as const;
export type ActivitySection = keyof typeof activitySections;
export const isActivitySection = (v: unknown): v is ActivitySection => typeof v === "string" && v in activitySections;

export const ACTIVITY_PAGE_SIZE = 50;

export type ActivityFilter = { userId?: string; section?: ActivitySection; from?: Date; to?: Date; page: number };

export async function listActivity(f: ActivityFilter) {
  const where: SQL[] = [];
  if (f.userId) where.push(eq(auditLog.userId, f.userId));
  if (f.section) where.push(inArray(auditLog.entity, [...activitySections[f.section].entities]));
  if (f.from) where.push(gte(auditLog.createdAt, f.from));
  if (f.to) where.push(lt(auditLog.createdAt, f.to));
  const cond = where.length ? and(...where) : undefined;
  const db = getDb();
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(cond)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(ACTIVITY_PAGE_SIZE)
      .offset((f.page - 1) * ACTIVITY_PAGE_SIZE),
    db.select({ total: count() }).from(auditLog).where(cond),
  ]);
  return { rows, total };
}

/** Everyone who has ever done something, for the person filter. */
export async function activityPeople() {
  const rows = await getDb().selectDistinct({ userId: auditLog.userId }).from(auditLog);
  return rows.map((r) => r.userId);
}

const verbs: Record<string, string> = {
  "lead.status_changed": "Changed a lead’s status",
  "lead.responded": "Marked a lead as responded",
  "lead.notes_updated": "Updated lead notes",
  "lead.assigned": "Took a lead",
  "lead.unassigned": "Unassigned a lead",
  "appointment.booked": "Booked an appointment",
  "appointment.status_changed": "Set an appointment outcome",
  "appointment.rescheduled": "Rescheduled an appointment",
  "content.draft_saved": "Saved a draft",
  "content.published": "Published changes",
  "content.draft_discarded": "Discarded a draft",
  "content.reverted_to_default": "Reverted a page to its default",
  "content.revision_restored": "Restored an earlier version",
  "content.post_created": "Created a journal post",
  "content.post_deleted": "Deleted a journal post",
  "content.page_created": "Created a page",
  "content.page_deleted": "Deleted a page",
  "content.form_created": "Created a form",
  "content.form_deleted": "Deleted a form",
  "media.uploaded": "Uploaded an image",
  "media.alt_updated": "Edited image alt text",
  "media.deleted": "Deleted an image",
  "gallery.created": "Created a gallery case",
  "gallery.updated": "Edited a gallery case",
  "gallery.published": "Published a gallery case",
  "gallery.pending": "Moved a gallery case back to review",
  "gallery.hidden": "Hid a gallery case",
  "gallery.deleted": "Deleted a gallery case",
  "gallery.consent_updated": "Updated photo consent",
  "gallery.consent_withdrawn": "Recorded withdrawn consent",
  "gallery.photo_added": "Added a case photo",
  "gallery.photo_replaced": "Replaced a case photo",
  "gallery.photo_removed": "Removed a case photo",
  "review.created": "Added a review",
  "review.updated": "Edited a review",
  "review.published": "Published a review",
  "review.pending": "Moved a review back to pending",
  "review.hidden": "Hid a review",
  "review.deleted": "Deleted a review",
  "staff.invited": "Invited a staff member",
  "staff.invitation_revoked": "Revoked an invitation",
  "staff.role_changed": "Changed a staff role",
  "staff.access_removed": "Removed staff access",
};

const humanize = (s: string) => s.replace(/[_.]/g, " ");

/** "lead.status_changed:consult_booked" → { verb: "Changed a lead’s status", detail: "consult booked" } */
export function describeAction(action: string) {
  const [key, detail] = action.split(":", 2);
  return { verb: verbs[key] ?? humanize(key), detail: detail ? humanize(detail) : null };
}

/** A readable target and, where one exists, a link to it. Never includes patient data. */
export function describeTarget(entity: string, entityId: string | null): { label: string; href?: string } {
  const id = entityId ?? "";
  switch (entity) {
    case "lead":
      return { label: `Lead #${id}`, href: id ? `/admin/leads/${id}` : undefined };
    case "appointment":
      return { label: `Appointment #${id}`, href: "/admin/appointments" };
    case "gallery_item":
      return { label: `Gallery case (id ${id})`, href: id ? `/admin/gallery/${id}` : undefined };
    case "review":
      return { label: `Review #${id}`, href: id ? `/admin/reviews/${id}` : undefined };
    case "media":
      return { label: "Media library", href: "/admin/media" };
    case "procedure":
    case "post":
    case "page":
    case "form":
    case "home":
    case "settings":
    case "seo": {
      const key = id.split("#")[0]; // revision restores log "<key>#<revision id>"
      return { label: documentLabel(entity, key), href: editorHref(entity, key) };
    }
    case "staff":
    case "staff_invitation":
      return { label: entity === "staff" ? "Staff account" : "Invitation", href: "/admin/users" };
    default:
      return { label: humanize(entity) };
  }
}
