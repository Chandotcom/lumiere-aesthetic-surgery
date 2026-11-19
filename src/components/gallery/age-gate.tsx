"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

const KEY = "lumiere:gallery-confirmed";

/**
 * Shared 18+ confirmation (gallery pages + homepage preview). Remembered for this browser
 * session only, so confirming in one place unlocks the others.
 */
export function useAgeConfirmed() {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage after mount
      if (sessionStorage.getItem(KEY) === "1") setConfirmed(true);
    } catch {
      /* storage unavailable — ask every time */
    }
  }, []);

  const confirm = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setConfirmed(true);
  };

  return { confirmed, confirm };
}

/**
 * Before/after galleries contain nudity. Nothing in `children` is rendered (so no images load)
 * until the visitor confirms they are 18+.
 */
export function AgeGate({ children, preview }: { children: React.ReactNode; preview: React.ReactNode }) {
  const { confirmed, confirm } = useAgeConfirmed();

  if (confirmed) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred, inert preview of the layout — contains no images */}
      <div inert aria-hidden className="pointer-events-none blur-sm select-none">
        {preview}
      </div>

      <div
        role="region"
        aria-labelledby="age-gate-title"
        className="absolute inset-x-0 top-0 flex justify-center px-4 pt-10 md:pt-16"
      >
        <div className="stack w-full min-w-0 max-w-lg items-center border border-line bg-ivory p-6 text-center sm:p-8 shadow-[0_30px_60px_-30px_rgb(29_27_24/0.35)] md:p-12">
          <span className="grid size-14 place-items-center rounded-full bg-cream text-bronze">
            <EyeOff className="size-6" aria-hidden />
          </span>
          <h2 id="age-gate-title" className="font-heading text-h3">
            This gallery contains nudity
          </h2>
          <p className="text-stone">
            Before-and-after photos show real surgical results, which may include unclothed bodies.
            Please confirm you are 18 or older to continue.
          </p>
          {/* Stacked full-width: two long labels side by side would overflow the panel */}
          <div data-slot="actions" className="flex w-full flex-col gap-3">
            <Button size="cta-lg" className="h-auto min-h-12 w-full whitespace-normal py-3" onClick={confirm}>
              I am 18+ — view gallery
            </Button>
            <ButtonLink size="cta-lg" variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-3" href="/procedures">
              Browse procedures instead
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
