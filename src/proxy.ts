import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk only attaches the session here. The actual "must be signed in" check lives in
// src/app/admin/layout.tsx (auth.protect()) and must be repeated in every admin
// Server Action / API route — Clerk deprecated path-matching auth in middleware.
export default clerkMiddleware();

// Run Clerk only on staff routes — public pages never touch auth (faster, and they work
// even before Clerk keys are configured).
export const config = {
  matcher: ["/admin/:path*", "/sign-in/:path*", "/api/admin/:path*"],
};
