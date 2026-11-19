import "server-only";
import { clerkClient, type User } from "@clerk/nextjs/server";
import { parseRole, type StaffRole } from "./roles";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole | null;
  imageUrl: string;
  lastSignInAt: Date | null;
};

const displayName = (u: User) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.primaryEmailAddress?.emailAddress || "Unnamed user";

function toMember(u: User): StaffMember {
  return {
    id: u.id,
    name: displayName(u),
    email: u.primaryEmailAddress?.emailAddress ?? "",
    role: parseRole(u.publicMetadata?.role),
    imageUrl: u.imageUrl,
    lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt) : null,
  };
}

/** Every account in the Clerk app, people with a role first. Fine for a clinic-sized team. */
export async function listStaff(): Promise<StaffMember[]> {
  const { data } = await (await clerkClient()).users.getUserList({ limit: 200, orderBy: "-created_at" });
  return data.map(toMember).sort((a, b) => Number(Boolean(b.role)) - Number(Boolean(a.role)));
}

export async function getStaffMember(userId: string) {
  try {
    return toMember(await (await clerkClient()).users.getUser(userId));
  } catch {
    return null;
  }
}

export type PendingInvite = { id: string; email: string; role: StaffRole | null; createdAt: Date };

export async function listPendingInvites(): Promise<PendingInvite[]> {
  const { data } = await (await clerkClient()).invitations.getInvitationList({ status: "pending", limit: 100 });
  return data.map((i) => ({
    id: i.id,
    email: i.emailAddress,
    role: parseRole(i.publicMetadata?.role),
    createdAt: new Date(i.createdAt),
  }));
}

/** Display names for user ids (for the activity log). Unknown or deleted users get a fallback. */
export async function staffNames(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds)];
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  try {
    const { data } = await (await clerkClient()).users.getUserList({ userId: ids, limit: ids.length });
    for (const u of data) out.set(u.id, displayName(u));
  } catch {
    // Clerk unreachable: fall through to the fallbacks below.
  }
  for (const id of ids) if (!out.has(id)) out.set(id, "Former staff member");
  return out;
}
