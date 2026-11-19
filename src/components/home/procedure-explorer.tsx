"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { serviceGroups } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * Desktop: an index list of categories; hovering/focusing one cross-fades the large image.
 * Phones: stacked image cards (no hover on touch).
 */
export function ProcedureExplorer() {
  const [active, setActive] = useState(0);

  return (
    <>
      {/* Desktop index */}
      <div className="hidden grid-cols-12 gap-12 md:grid">
        <ul className="col-span-7 border-t border-ivory/15">
          {serviceGroups.map((g, i) => (
            <li key={g.category} className="border-b border-ivory/15">
              <Link
                href={g.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group grid grid-cols-12 items-baseline gap-4 py-8 lg:py-10"
              >
                <span className={cn("numeral col-span-1 text-sm transition-colors", active === i ? "text-sand" : "text-ivory/40")}>
                  0{i + 1}
                </span>
                <span className="col-span-11 flex flex-col gap-4">
                  <span className="flex items-center justify-between gap-6">
                    <span
                      className={cn(
                        "font-heading text-h1 font-light transition-colors duration-500 ease-luxe",
                        active === i ? "text-ivory" : "text-ivory/45",
                      )}
                    >
                      {g.category}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className={cn("size-7 shrink-0 transition-all duration-500", active === i ? "text-sand opacity-100" : "opacity-0")}
                    />
                  </span>
                  <span
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-500 ease-luxe",
                      active === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="block max-w-md text-ivory/70">{g.blurb}</span>
                      <span className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs tracking-wide text-ivory/60 uppercase">
                        {g.procedures.map((x) => (
                          <span key={x.href}>{x.name}</span>
                        ))}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="relative col-span-5 self-start md:sticky md:top-[calc(var(--header-h)+2rem)]">
          <div className="relative aspect-[4/5] overflow-hidden">
            {serviceGroups.map((g, i) => (
              <Image
                key={g.category}
                src={g.image.src}
                alt={g.image.alt}
                fill
                sizes="40vw"
                className={cn(
                  "object-cover transition-[opacity,transform] duration-1000 ease-luxe",
                  active === i ? "scale-100 opacity-100" : "scale-105 opacity-0",
                )}
              />
            ))}
          </div>
          <p className="mt-4 flex justify-between text-xs tracking-wide text-ivory/50 uppercase">
            <span>{serviceGroups[active].category}</span>
            <span className="numeral">
              0{active + 1} / 0{serviceGroups.length}
            </span>
          </p>
        </div>
      </div>

      {/* Phone cards */}
      <ul className="grid gap-10 md:hidden">
        {serviceGroups.map((g, i) => (
          <li key={g.category}>
            <Link href={g.href} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={g.image.src} alt={g.image.alt} fill sizes="100vw" className="object-cover" />
              </div>
              <div className="mt-5 flex items-baseline gap-4">
                <span className="numeral text-sm text-sand">0{i + 1}</span>
                <span className="font-heading text-h2 font-light text-ivory">{g.category}</span>
              </div>
              <p className="mt-2 text-ivory/70">{g.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
