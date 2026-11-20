import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RevisionList } from "./revision-list";

/** Shared frame for content editor pages: back link, title, live-page link and version history. */
export function EditorPage({
  eyebrow,
  title,
  description,
  livePath,
  kind,
  contentKey,
  revisions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  livePath: string;
  kind: string;
  contentKey: string;
  revisions: { id: number; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_18rem]">
      <div className="min-w-0 space-y-6">
        <header className="space-y-1">
          {eyebrow && <p className="text-xs tracking-wide text-stone uppercase">{eyebrow}</p>}
          <h1 className="font-heading text-3xl">{title}</h1>
          <p className="text-sm text-stone">
            {description}{" "}
            <a href={livePath} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-bronze hover:underline">
              View live page <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </header>
        {children}
      </div>
      <aside className="space-y-3 xl:sticky xl:top-6 xl:h-fit">
        <h2 className="font-heading text-lg">Published versions</h2>
        <RevisionList kind={kind} contentKey={contentKey} revisions={revisions} />
      </aside>
    </div>
  );
}

export function BackToContent({ to = "pages" }: { to?: "pages" | "journal" }) {
  return (
    <Link
      href={to === "journal" ? "/admin/content/journal" : "/admin/content"}
      className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {to === "journal" ? "Journal" : "Pages"}
    </Link>
  );
}

/** A titled group of fields inside an editor form. */
export function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-line pt-8 lg:grid-cols-[14rem_1fr]">
      <header>
        <h2 className="font-heading text-lg">{title}</h2>
        {description && <p className="mt-1 text-xs text-stone">{description}</p>}
      </header>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

export function BackToForms() {
  return (
    <Link href="/admin/forms" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      Forms
    </Link>
  );
}
