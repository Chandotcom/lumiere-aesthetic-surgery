import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Heading } from "@/components/ds";
import { formatPrice, type Procedure } from "@/lib/content/procedures";

export function ProcedureCard({ p, headingLevel = 3 }: { p: Procedure; headingLevel?: 2 | 3 | 4 }) {
  return (
    // prefetch: per-link prefetching resolves this page's params ahead of the click (instant nav)
    <Link href={`/procedures/${p.slug}`} prefetch className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        <Image
          src={p.image.src}
          alt={p.image.alt}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 840px) 30vw, (min-width: 480px) 50vw, 100vw"
          className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <Heading level={headingLevel} size="h4" className="transition-colors group-hover:text-bronze">
            {p.name}
          </Heading>
          <ArrowUpRight
            aria-hidden
            className="mt-1 size-5 shrink-0 text-bronze transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
        <p className="text-sm text-stone">{p.tagline}</p>
        <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-xs tracking-wide text-stone uppercase">
          <span>Recovery {p.facts.recovery}</span>
          <span className="text-bronze">From {formatPrice(p.price.from)}</span>
        </p>
      </div>
    </Link>
  );
}
