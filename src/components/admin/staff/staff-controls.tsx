"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff, revokeInvite, setStaffRole } from "@/app/admin/users/actions";
import { selectClass } from "@/components/admin/gallery/case-details-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleDescription, roleLabel, STAFF_ROLES, type StaffRole } from "@/lib/admin/roles";

/** Role picker for one account. "No access" removes the role. */
export function RoleSelect({ userId, name, role }: { userId: string; name: string; role: StaffRole | null }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label={`Role for ${name}`}
      className={`${selectClass} w-40`}
      value={role ?? ""}
      disabled={pending}
      onChange={(e) => {
        const next = (e.target.value || null) as StaffRole | null;
        startTransition(async () => {
          const res = await setStaffRole(userId, next);
          if (res.ok) toast.success(next ? `${name} is now ${roleLabel[next]}` : `${name} no longer has access`);
          else toast.error(res.error);
        });
      }}
    >
      {STAFF_ROLES.map((r) => (
        <option key={r} value={r}>
          {roleLabel[r]}
        </option>
      ))}
      <option value="">No access</option>
    </select>
  );
}

export function RevokeInviteButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Revoke the invitation for ${email}`}
      onClick={() =>
        startTransition(async () => {
          const res = await revokeInvite(id);
          if (res.ok) toast.success("Invitation revoked");
          else toast.error(res.error);
        })
      }
    >
      Revoke
    </Button>
  );
}

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("front_desk");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await inviteStaff({ email, role });
          if (res.ok) {
            toast.success(`Invitation sent to ${email}`);
            setEmail("");
          } else toast.error(res.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@clinic.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            className={selectClass}
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            aria-describedby="invite-role-hint"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending || !email}>
          {pending ? "Sending…" : "Send invitation"}
        </Button>
      </div>
      <p id="invite-role-hint" className="text-xs text-stone">
        {roleLabel[role]}: {roleDescription[role]}
      </p>
    </form>
  );
}
