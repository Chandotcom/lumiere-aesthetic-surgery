import "server-only";
import { refresh } from "next/cache";
import { isDemo, type Permission } from "./roles";
import { ForbiddenError, requireStaff, type Staff } from "./session";

export type ActionResult = { ok: true; previewOnly?: boolean } | { ok: false; error: string };

/** Thrown inside `runStaffAction` to show a specific message instead of the generic one. */
export class ActionError extends Error {}

export const DEMO_BLOCKED =
  "This is turned off in the demo, so the sample site stays the same for everyone. In your own site, it works normally.";

/**
 * Wrapper for every admin Server Action: checks the staff session and that their role grants
 * `permission` (also used as the log label), runs the mutation,
 * logs failures without any patient data, and refreshes the page on success.
 *
 * Demo accounts (prospects trying the admin) are refused unless the action opts in with
 * `{ demo: "allow" }`. Only opt in for changes that never reach the public site and that the
 * nightly reset undoes (sample leads, appointments, content drafts).
 */
export async function runStaffAction(
  permission: Permission,
  fn: (staffId: string, staff: Staff) => Promise<void>,
  options: { demo?: "allow" } = {},
): Promise<ActionResult> {
  let staff: Staff;
  try {
    staff = await requireStaff(permission);
  } catch (err) {
    if (err instanceof ForbiddenError) return { ok: false, error: "Your role doesn’t include this. Ask an admin for access." };
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  if (isDemo(staff.role) && options.demo !== "allow") return { ok: false, error: DEMO_BLOCKED };
  try {
    await fn(staff.id, staff);
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error(`[admin/${permission}] action failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  refresh();
  return { ok: true };
}
