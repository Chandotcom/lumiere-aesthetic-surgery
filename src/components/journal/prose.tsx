import Link from "next/link";
import Markdown, { type Components } from "react-markdown";

// Long-form article typography, mapped onto the design system (no typography plugin needed).
const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-14 mb-5 font-heading text-h3 text-ink first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-10 mb-4 font-heading text-h4 text-ink">{children}</h3>,
  p: ({ children }) => <p className="mb-6 text-[1.0625rem] leading-[1.85] text-ink/85">{children}</p>,
  ul: ({ children }) => <ul className="mb-8 space-y-3 border-l border-line pl-6">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-8 list-none space-y-3 pl-0 [counter-reset:item] [&>li]:[counter-increment:item] [&>li]:before:mr-3 [&>li]:before:font-heading [&>li]:before:text-bronze [&>li]:before:content-[counter(item,decimal-leading-zero)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-[1.0625rem] leading-relaxed text-ink/85 marker:text-bronze">{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
  blockquote: ({ children }) => (
    // Pull quote: the inner <p> must be resized here — it otherwise keeps the body-text size
    <blockquote className="my-12 border-l-2 border-bronze bg-cream px-7 py-6 [&_p]:mb-0 [&_p]:font-heading [&_p]:text-h4 [&_p]:leading-snug [&_p]:font-light [&_p]:text-ink">
      {children}
    </blockquote>
  ),
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link href={href} className="link-underline">
        {children}
      </Link>
    ) : (
      <a href={href} className="link-underline" rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    ),
};

/** Renders trusted article markdown. Raw HTML is not allowed (react-markdown default). */
export function Prose({ markdown }: { markdown: string }) {
  return <Markdown components={components}>{markdown}</Markdown>;
}
