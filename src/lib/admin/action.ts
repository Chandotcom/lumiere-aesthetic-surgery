import "server-only";
import { refresh } from "next/cache";
import { requireStaff } from "./session";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Thrown inside `runStaffAction` to show a specific message instead of the generic one. */
export class ActionError extends Error {}

/**
 * Wrapper for every admin Server Action: checks the staff session, runs the mutation,
 * logs failures without any patient data, and refreshes the page on success.
 */
export async function runStaffAction(
  label: string,
  fn: (staffId: string) => Promise<void>,
): Promise<ActionResult> {
  let staffId: string;
  try {
    staffId = (await requireStaff()).id;
  } catch {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  try {
    await fn(staffId);
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error(`[admin/${label}] action failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  refresh();
  return { ok: true };
}
