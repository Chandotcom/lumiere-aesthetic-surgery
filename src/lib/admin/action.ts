import "server-only";
import { refresh } from "next/cache";
import type { Permission } from "./roles";
import { ForbiddenError, requireStaff } from "./session";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Thrown inside `runStaffAction` to show a specific message instead of the generic one. */
export class ActionError extends Error {}

/**
 * Wrapper for every admin Server Action: checks the staff session and that their role grants
 * `permission` (also used as the log label), runs the mutation,
 * logs failures without any patient data, and refreshes the page on success.
 */
export async function runStaffAction(
  permission: Permission,
  fn: (staffId: string) => Promise<void>,
): Promise<ActionResult> {
  let staffId: string;
  try {
    staffId = (await requireStaff(permission)).id;
  } catch (err) {
    if (err instanceof ForbiddenError) return { ok: false, error: "Your role doesn’t include this. Ask an admin for access." };
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  try {
    await fn(staffId);
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error(`[admin/${permission}] action failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  refresh();
  return { ok: true };
}
