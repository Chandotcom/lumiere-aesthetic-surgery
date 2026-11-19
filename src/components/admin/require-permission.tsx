import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { can, homeFor, roleLabel, type Permission } from "@/lib/admin/roles";
import { getStaff } from "@/lib/admin/session";

/**
 * Section guard for admin pages (used in each section's layout). The page is not rendered at all
 * without the permission, so none of its data is loaded. Actions and API routes check again.
 */
export async function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const staff = await getStaff();
  if (staff && can(staff.role, permission)) return children;
  return (
    <div className="max-w-md space-y-4 rounded-sm border border-line p-6">
      <ShieldAlert className="size-6 text-bronze" aria-hidden />
      <h1 className="font-heading text-2xl">You don’t have access to this section</h1>
      <p className="text-sm text-stone">
        {staff ? `Your role (${roleLabel[staff.role]}) doesn’t include it.` : "Your account doesn’t have a staff role."} An
        admin can change your role under Staff.
      </p>
      {staff && <ButtonLink href={homeFor(staff.role)} variant="outline">Go to your start page</ButtonLink>}
    </div>
  );
}
