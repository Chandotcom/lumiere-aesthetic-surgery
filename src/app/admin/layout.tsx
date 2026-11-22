import { Suspense } from "react";
import { ClerkProvider, SignOutButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { isDemo, roleLabel } from "@/lib/admin/roles";
import { getStaff, type Staff } from "@/lib/admin/session";

// Clerk is scoped to staff routes so the public site stays static (better SEO + speed).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <ClerkProvider>
        <RequireStaff>
          {(staff) => (
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-line px-6 py-3">
              <span className="font-heading text-xl">Lumière · Staff</span>
              <span className="flex items-center gap-3">
                <span className="hidden text-xs text-stone sm:inline">{roleLabel[staff.role]}</span>
                <UserButton />
              </span>
            </header>
            {isDemo(staff.role) && (
              <p role="note" className="border-b border-line bg-cream px-6 py-2.5 text-sm">
                <strong className="font-medium">You&rsquo;re trying the demo.</strong> The enquiries are samples. Try
                anything: Publish shows your change in a preview only you can see, and everything resets every night.
                Please don&rsquo;t enter real patient details.
              </p>
            )}
            <div className="flex flex-1 flex-col md:flex-row">
              <aside className="border-b border-line p-3 md:w-56 md:shrink-0 md:border-r md:border-b-0">
                <AdminNav role={staff.role} />
              </aside>
              <main className="min-w-0 flex-1 p-6">{children}</main>
            </div>
          </div>
          )}
        </RequireStaff>
      </ClerkProvider>
    </Suspense>
  );
}

/**
 * Redirects signed-out visitors to /sign-in, and blocks signed-in users without a
 * staff role. Server Actions repeat this check with `requireStaff()`.
 */
async function RequireStaff({ children }: { children: (staff: Staff) => React.ReactNode }) {
  await auth.protect();
  const staff = await getStaff();
  if (!staff) return <NoStaffRole />;
  return children(staff);
}

function NoStaffRole() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="font-heading text-2xl">No staff access</h1>
        <p className="text-sm text-stone">
          You&rsquo;re signed in, but your account doesn&rsquo;t have a staff role. Ask an admin to
          give you access under <strong>Staff</strong> in the dashboard.
        </p>
        <SignOutButton redirectUrl="/">
          <Button variant="outline">Sign out</Button>
        </SignOutButton>
      </div>
    </main>
  );
}
