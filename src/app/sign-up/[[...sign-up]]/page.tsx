import { Suspense } from "react";
import type { Metadata } from "next";
import { ClerkProvider, SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Create your staff account", robots: { index: false, follow: false } };

/**
 * Where staff invitations land (inviteStaff sets this as Clerk's redirectUrl). Signing up here
 * through the invitation applies the invited role; a direct sign-up gets it on first sign-in too
 * (claimPendingInvitation). Either way the account then opens the admin.
 */
export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={null}>
        <ClerkProvider>
          <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/admin" />
        </ClerkProvider>
      </Suspense>
    </main>
  );
}
