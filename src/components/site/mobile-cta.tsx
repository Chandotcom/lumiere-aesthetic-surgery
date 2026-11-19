"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

/** Fixed bottom action bar on phones (hidden from 840px up, and on the consultation page itself). */
export function MobileCta({ phone }: { phone: string }) {
  const pathname = usePathname();
  if (pathname === "/consultation") return null;
  const tel = `tel:${phone.replace(/[^+\d]/g, "")}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-ivory pb-[env(safe-area-inset-bottom)] md:hidden">
      <a
        href={tel}
        className="flex h-14 items-center justify-center gap-2 text-label tracking-label uppercase text-ink"
      >
        <Phone className="size-4" aria-hidden /> Call
      </a>
      <Link
        href="/consultation"
        className="flex h-14 items-center justify-center bg-bronze px-2 text-center text-label tracking-wider uppercase text-white"
      >
        Request a consultation
      </Link>
    </div>
  );
}
