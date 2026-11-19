"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  hasGlobalPrivacyControl,
  onOpenConsentSettings,
  openConsentSettings,
  saveConsent,
  useConsent,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Consent banner + preferences dialog for the public site. Nothing optional runs until the visitor
 * chooses. "Accept all" and "Reject optional" carry equal weight (no nudging), and the banner never
 * blocks the page. Reopen it from the footer's "Cookie settings".
 */
export function CookieConsent() {
  const consent = useConsent();
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenConsentSettings(() => setOpen(true)), []);

  const undecided = consent === null;

  return (
    <>
      {undecided && !open && (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-50 border border-ivory/10 bg-ink p-5 text-ivory shadow-[0_24px_48px_-16px_rgb(29_27_24/0.5)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md"
        >
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 size-5 shrink-0 text-sand" aria-hidden />
            <div className="space-y-2">
              <h2 className="font-heading text-lg">Your privacy, your choice</h2>
              <p className="text-sm text-ivory/75">
                We’d like to measure visits with privacy-friendly analytics and note which campaign brought you here.
                No advertising cookies, and nothing optional runs unless you agree.{" "}
                <Link href="/privacy#cookies" className="text-sand underline-offset-4 hover:underline">
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline-light" size="cta" onClick={() => saveConsent({ analytics: false, marketing: false })}>
              Reject optional
            </Button>
            <Button variant="outline-light" size="cta" onClick={() => saveConsent({ analytics: true, marketing: true })}>
              Accept all
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 w-full text-center text-xs tracking-wide text-ivory/70 underline-offset-4 hover:text-ivory hover:underline"
          >
            Choose what to allow
          </button>
        </section>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {/* key: re-read the saved choice each time the dialog opens */}
          {open && (
            <Preferences
              initial={consent && consent !== "pending" ? consent : { analytics: false, marketing: false }}
              onSave={(choice) => {
                saveConsent(choice);
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Preferences({
  initial,
  onSave,
}: {
  initial: { analytics: boolean; marketing: boolean };
  onSave: (choice: { analytics: boolean; marketing: boolean }) => void;
}) {
  const gpc = hasGlobalPrivacyControl();
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [marketing, setMarketing] = useState(initial.marketing && !gpc);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl">Cookie settings</DialogTitle>
        <DialogDescription>
          Choose what this site may store or measure in your browser. You can change this at any time from “Cookie
          settings” at the bottom of every page.
        </DialogDescription>
      </DialogHeader>

      <ul className="divide-y divide-line border-y border-line">
        <Category
          title="Strictly necessary"
          description="Remembers this choice and your 18+ confirmation for the gallery. Staff sign-in uses secure cookies on staff pages only. These can’t be turned off."
          checked
          disabled
        />
        <Category
          title="Analytics"
          description="Anonymous, aggregated page views (Vercel Web Analytics). No cookies, no cross-site tracking, nothing sold."
          checked={analytics}
          onChange={setAnalytics}
        />
        <Category
          title="Marketing attribution"
          description="Remembers, for this visit only, which campaign or website brought you here, so we can see which channels lead to consultation requests. We don’t use advertising pixels."
          checked={marketing}
          onChange={setMarketing}
          disabled={gpc}
          note={gpc ? "Off because your browser sends a Global Privacy Control signal." : undefined}
        />
      </ul>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={() => onSave({ analytics: false, marketing: false })}>
          Reject optional
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onSave({ analytics: true, marketing: true })}>
            Accept all
          </Button>
          <Button onClick={() => onSave({ analytics, marketing })}>Save choices</Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Category({
  title,
  description,
  checked,
  onChange,
  disabled,
  note,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  const id = useId();
  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div>
        <label htmlFor={id} className="font-medium text-ink">
          {title}
        </label>
        <p id={`${id}-desc`} className="mt-1 text-sm text-stone">
          {description}
        </p>
        {note && <p className="mt-1 text-xs text-bronze">{note}</p>}
      </div>
      {/* A native checkbox drawn as a switch, so keyboard, labels and screen readers work for free. */}
      <label className={cn("relative mt-1 inline-flex shrink-0", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={`${id}-desc`}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-11 items-center rounded-full bg-stone/40 p-0.5 transition-colors",
            "peer-checked:bg-bronze peer-checked:[&>span]:translate-x-5",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze",
            "peer-disabled:opacity-60",
          )}
        >
          <span className="size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none" />
        </span>
      </label>
    </li>
  );
}

/** Footer link that reopens the preferences. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Cookie settings
    </button>
  );
}
