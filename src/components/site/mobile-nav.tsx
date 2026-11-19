"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks, serviceGroups } from "@/lib/content/home";

export function MobileNav({ phone }: { phone: string }) {
  // Controlled so plain <Link>s (real links, not role="button") can close the sheet.
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" />}>
        <Menu className="size-6" />
      </SheetTrigger>
      {/* Full width on phones (the default 3/4 width cramps the CTA label); side panel from 480px */}
      <SheetContent side="right" className="overflow-y-auto bg-ivory p-6 data-[side=right]:w-full sm:p-8 data-[side=right]:sm:max-w-sm">

        <SheetTitle className="eyebrow">Menu</SheetTitle>
        <nav aria-label="Mobile" className="mt-4 flex flex-col">
          {serviceGroups.map((g) => (
            <details key={g.category} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-heading text-3xl font-light [&::-webkit-details-marker]:hidden">
                {g.category}
                <Plus
                  aria-hidden
                  className="size-5 text-bronze transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <ul className="space-y-3 pb-5">
                {g.procedures.map((x) => (
                  <li key={x.href}>
                    <Link href={x.href} onClick={close} className="text-stone hover:text-bronze">
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className="border-b border-line py-4 font-heading text-3xl font-light"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto stack gap-3! pt-8">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="link-underline self-start">
            {phone}
          </a>
          {/* Safeguard: wrap onto two centred lines rather than pressing against the edges */}
          <ButtonLink
            size="cta"
            className="h-auto min-h-12 w-full px-5 py-3 text-center whitespace-normal"
            href="/consultation"
            onClick={close}
          >
            Request a consultation
          </ButtonLink>
        </div>
      </SheetContent>
    </Sheet>
  );
}
