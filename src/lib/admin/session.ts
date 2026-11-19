import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

export type StaffRole = "admin" | "staff";
export type Staff = { id: string; name: string; role: StaffRole };

function isRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "staff";
}

/**
 * The signed-in staff member, or null when signed out or missing a role.
 * Roles live in Clerk `publicMetadata.role` ("admin" | "staff").
 * Deduplicated per request with React `cache`.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  if (!user || !isRole(role)) return null;
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.primaryEmailAddress?.emailAddress ||
    "Staff member";
  return { id: userId, name, role };
});

/**
 * Guard for every admin Server Action and API route. Layouts don't protect those,
 * because they can be called directly with a POST request.
 */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new Error("Unauthorized");
  return staff;
}
