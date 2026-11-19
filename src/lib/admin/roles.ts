// Staff roles and what each one may do. Client-safe (the sidebar uses it); enforcement happens on
// the server in session.ts (`requireStaff(permission)`), section layouts and API routes.

export const STAFF_ROLES = ["admin", "editor", "front_desk"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const roleLabel: Record<StaffRole, string> = {
  admin: "Admin",
  editor: "Editor",
  front_desk: "Front desk",
};

export const roleDescription: Record<StaffRole, string> = {
  admin: "Everything, including staff accounts and the activity log.",
  editor: "Website content: pages, journal, media, gallery and reviews. No patient enquiries.",
  front_desk: "Patient enquiries: dashboard, leads and appointments. No website editing.",
};

export type Permission =
  | "dashboard"
  | "leads"
  | "appointments"
  | "content"
  | "media"
  | "gallery"
  | "reviews"
  | "users"
  | "activity";

const grants: Record<StaffRole, readonly Permission[]> = {
  admin: ["dashboard", "leads", "appointments", "content", "media", "gallery", "reviews", "users", "activity"],
  editor: ["content", "media", "gallery", "reviews"],
  front_desk: ["dashboard", "leads", "appointments"],
};

/**
 * Role from Clerk `publicMetadata.role`. The original "staff" role maps to front desk, so accounts
 * created before roles existed keep their access to enquiries. Anything else means no access.
 */
export function parseRole(value: unknown): StaffRole | null {
  if (value === "staff") return "front_desk";
  return (STAFF_ROLES as readonly unknown[]).includes(value) ? (value as StaffRole) : null;
}

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  return Boolean(role && grants[role].includes(permission));
}

/** Where to land after sign-in: the first section this role can open. */
export function homeFor(role: StaffRole) {
  return can(role, "dashboard") ? "/admin" : "/admin/content";
}
