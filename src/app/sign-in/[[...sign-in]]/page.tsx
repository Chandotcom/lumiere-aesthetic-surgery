import { Suspense } from "react";
import { ClerkProvider, SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={null}>
        <ClerkProvider>
          <SignIn />
        </ClerkProvider>
      </Suspense>
    </main>
  );
}
