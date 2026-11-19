"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { STAFF_ROLES } from "@/lib/admin/roles";
import { getStaff } from "@/lib/admin/session";
import { listStaff } from "@/lib/admin/staff";

const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("users", fn);
const roleSchema = z.enum(STAFF_ROLES);

/** Clerk errors carry a readable message for things like "already invited". */
function clerkMessage(err: unknown, fallback: string) {
  const first = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return first?.longMessage || first?.message || fallback;
}

/** Email an invitation. The role is applied automatically when they accept and sign up. */
export async function inviteStaff(input: { email: string; role: string }): Promise<ActionResult> {
  const parsed = z
    .object({ email: z.email("Enter a valid email address.").trim().toLowerCase(), role: roleSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  return run(async (staffId) => {
    let id: string;
    try {
      const invitation = await (await clerkClient()).invitations.createInvitation({
        emailAddress: parsed.data.email,
        publicMetadata: { role: parsed.data.role },
        notify: true,
        expiresInDays: 7,
      });
      id = invitation.id;
    } catch (err) {
      throw new ActionError(clerkMessage(err, "The invitation couldn’t be sent."));
    }
    // The email address is personal data, so the log records only the invitation id and role.
    await logAudit(staffId, `staff.invited:${parsed.data.role}`, "staff_invitation", id);
  });
}

export async function revokeInvite(invitationId: string): Promise<ActionResult> {
  if (!/^inv_[A-Za-z0-9]+$/.test(invitationId)) return { ok: false, error: "Invalid invitation." };
  return run(async (staffId) => {
    try {
      await (await clerkClient()).invitations.revokeInvitation(invitationId);
    } catch (err) {
      throw new ActionError(clerkMessage(err, "The invitation couldn’t be revoked."));
    }
    await logAudit(staffId, "staff.invitation_revoked", "staff_invitation", invitationId);
  });
}

/**
 * Change someone's role, or remove their access with `null`. It takes effect on their next
 * request. You can't change your own role, and the last admin can't be demoted, so the
 * dashboard can never be left without an admin.
 */
export async function setStaffRole(userId: string, role: string | null): Promise<ActionResult> {
  if (!/^user_[A-Za-z0-9]+$/.test(userId)) return { ok: false, error: "Invalid user." };
  const parsedRole = role === null ? null : roleSchema.safeParse(role);
  if (parsedRole && !parsedRole.success) return { ok: false, error: "Invalid role." };
  const nextRole = parsedRole ? parsedRole.data : null;

  return run(async (staffId) => {
    if (userId === (await getStaff())?.id) throw new ActionError("You can’t change your own role. Ask another admin.");
    const team = await listStaff();
    const target = team.find((m) => m.id === userId);
    if (!target) throw new ActionError("This account no longer exists.");
    const admins = team.filter((m) => m.role === "admin");
    if (target.role === "admin" && nextRole !== "admin" && admins.length <= 1) {
      throw new ActionError("There must always be at least one admin.");
    }
    await (await clerkClient()).users.updateUserMetadata(userId, { publicMetadata: { role: nextRole } });
    await logAudit(staffId, nextRole ? `staff.role_changed:${nextRole}` : "staff.access_removed", "staff", userId);
  });
}
