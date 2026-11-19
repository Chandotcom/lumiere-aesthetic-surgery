import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { can, parseRole, type Permission, type StaffRole } from "./roles";

export type { StaffRole } from "./roles";
export type Staff = { id: string; name: string; role: StaffRole };

/**
 * The signed-in staff member, or null when signed out or without a role.
 * Roles live in Clerk `publicMetadata.role` (see roles.ts). Deduplicated per request.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const role = parseRole(user?.publicMetadata?.role);
  if (!user || !role) return null;
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.primaryEmailAddress?.emailAddress ||
    "Staff member";
  return { id: userId, name, role };
});

/** The signed-in staff member if their role grants `permission`, else null. */
export async function getStaffWith(permission: Permission): Promise<Staff | null> {
  const staff = await getStaff();
  return staff && can(staff.role, permission) ? staff : null;
}

export class ForbiddenError extends Error {}

/**
 * Guard for every admin Server Action and API route. Layouts don't protect those, because they
 * can be called directly with a POST request. Throws "Unauthorized" when signed out (or without
 * a role) and ForbiddenError when the role doesn't include `permission`.
 */
export async function requireStaff(permission?: Permission): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new Error("Unauthorized");
  if (permission && !can(staff.role, permission)) throw new ForbiddenError("Forbidden");
  return staff;
}
