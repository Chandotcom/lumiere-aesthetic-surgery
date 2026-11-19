import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { InviteForm, RevokeInviteButton, RoleSelect } from "@/components/admin/staff/staff-controls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/admin/format";
import { roleDescription, roleLabel, STAFF_ROLES } from "@/lib/admin/roles";
import { getStaff } from "@/lib/admin/session";
import { listPendingInvites, listStaff } from "@/lib/admin/staff";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Who can sign in to this dashboard, and what each person can do. Changes apply on their next click.
        </p>
      </div>

      <section className="space-y-3 rounded-sm border border-line p-5">
        <h2 className="font-heading text-xl">Invite someone</h2>
        <InviteForm />
      </section>

      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <Team />
      </Suspense>

      <section className="space-y-2">
        <h2 className="font-heading text-xl">Roles</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          {STAFF_ROLES.map((r) => (
            <div key={r} className="rounded-sm border border-line p-4">
              <dt className="font-medium">{roleLabel[r]}</dt>
              <dd className="mt-1 text-sm text-stone">{roleDescription[r]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

async function load() {
  const [team, invites, me] = await Promise.all([listStaff(), listPendingInvites(), getStaff()]);
  return { team, invites, me };
}

async function Team() {
  // Outside the try: during prerendering connection() rejects on purpose, and that must not be caught.
  await connection();
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (err) {
    console.warn("[admin/users] Couldn't load staff from Clerk:", err instanceof Error ? err.message : err);
    data = { team: [], invites: [], me: null };
  }
  const { team, invites, me } = data;
  if (!me) {
    return <p className="rounded-sm border border-line p-6 text-sm text-stone">Couldn’t reach the sign-in service. Try again shortly.</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-xl">Team</h2>
        <div className="rounded-sm border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="font-medium text-ink">{m.name}</span>
                    {m.id === me.id && (
                      <Badge variant="outline" className="ml-2 border-line text-stone">
                        You
                      </Badge>
                    )}
                    <div className="text-xs text-stone">{m.email}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {m.lastSignInAt ? formatDateTime(m.lastSignInAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    {m.id === me.id ? (
                      <span className="text-sm">{roleLabel[me.role]}</span>
                    ) : (
                      <RoleSelect userId={m.id} name={m.name} role={m.role} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-stone">
          “No access” keeps the account but blocks the dashboard. You can’t change your own role, and there’s always at
          least one admin.
        </p>
      </section>

      {invites.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-xl">Pending invitations</h2>
          <ul className="divide-y divide-line rounded-sm border border-line">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="text-ink">{i.email}</span>
                  <span className="text-stone">
                    {" "}
                    · {i.role ? roleLabel[i.role] : "No role"} · sent {formatDateTime(i.createdAt)}
                  </span>
                </span>
                <RevokeInviteButton id={i.id} email={i.email} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
