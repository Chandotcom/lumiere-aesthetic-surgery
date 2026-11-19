import { marquee } from "@/lib/content/home";

/** Slow, continuous band of procedure names — decorative (screen readers get a plain list). */
export function Marquee() {
  const items = [...marquee, ...marquee]; // duplicated for a seamless -50% loop
  return (
    <section aria-label="Procedures we offer" className="overflow-hidden border-b border-line bg-ivory py-7 md:py-9">
      <ul className="sr-only">
        {marquee.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <div aria-hidden className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {items.map((m, i) => (
          <span
            key={i}
            className="flex items-center gap-10 pr-10 font-heading text-h3 font-light whitespace-nowrap text-ink/80 md:gap-14 md:pr-14"
          >
            {m}
            <span className="size-1.5 rounded-full bg-bronze/70" />
          </span>
        ))}
      </div>
    </section>
  );
}
