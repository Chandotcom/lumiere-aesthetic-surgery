"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE, type GalleryCase } from "@/lib/content/gallery";
import { categories, getProcedure, type Category } from "@/lib/content/procedures";
import { cn } from "@/lib/utils";
import { ThumbPair } from "./thumb-pair";

/**
 * Filters + "Load more" live in the URL (?category=face&procedure=rhinoplasty&page=2), so views
 * are shareable and Back returns to the same spot. `cases` are the published cases (cached on
 * the server), newest first.
 */
export function GalleryBrowser({ cases }: { cases: GalleryCase[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const procedureSlug = params.get("procedure");
  const fromProcedure = procedureSlug ? getProcedure(procedureSlug)?.category : undefined;
  const categoryId = params.get("category");
  const category: Category | "All" =
    fromProcedure ?? categories.find((c) => c.id === categoryId)?.name ?? "All";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const setQuery = (next: { category?: string; procedure?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (next.category) q.set("category", next.category);
    if (next.procedure) q.set("procedure", next.procedure);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
  };
  const categoryIdOf = (cat: Category | "All") => categories.find((c) => c.name === cat)?.id;

  const inCategory = category === "All" ? cases : cases.filter((c) => c.category === category);
  const matching = procedureSlug ? inCategory.filter((c) => c.procedureSlug === procedureSlug) : inCategory;
  const visible = matching.slice(0, page * PAGE_SIZE);
  const remaining = matching.length - visible.length;

  // Procedures in the current area that have cases, with counts (React Compiler memoizes this)
  const procedureOptions = [...new Set(inCategory.map((c) => c.procedureSlug))].map((s) => ({
    p: getProcedure(s)!,
    count: inCategory.filter((c) => c.procedureSlug === s).length,
  }));
  const count = (cat: Category | "All") =>
    cat === "All" ? cases.length : cases.filter((c) => c.category === cat).length;

  // After "Load more", move focus to the first newly revealed case (keyboard/screen readers).
  const firstNewRef = useRef<HTMLAnchorElement>(null);
  const prevPage = useRef(page);
  useEffect(() => {
    if (page > prevPage.current) firstNewRef.current?.focus({ preventScroll: false });
    prevPage.current = page;
  }, [page]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Filter by area" className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] md:gap-9">
          {(["All", ...categories.map((c) => c.name)] as const).map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setQuery({ category: categoryIdOf(cat) })}
                className={cn(
                  "shrink-0 border-b py-2 text-label tracking-label whitespace-nowrap uppercase transition-colors",
                  active ? "border-bronze text-ink" : "border-transparent text-stone hover:text-ink",
                )}
              >
                {cat} <span className="text-stone/70">({count(cat)})</span>
              </button>
            );
          })}
        </div>

        {category !== "All" && procedureOptions.length > 1 && (
          <label className="flex items-center gap-3 text-sm text-stone">
            Procedure
            <select
              value={procedureSlug ?? ""}
              onChange={(e) => setQuery({ category: categoryIdOf(category), procedure: e.target.value || undefined })}
              className="h-11 rounded-sm border border-input bg-white px-3 pr-8 text-ink"
            >
              <option value="">
                All {category.toLowerCase()} ({inCategory.length})
              </option>
              {procedureOptions.map(({ p, count }) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({count})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="mt-6 text-sm text-stone" aria-live="polite">
        Showing {visible.length} of {matching.length} {matching.length === 1 ? "case" : "cases"}
        {procedureSlug && getProcedure(procedureSlug) ? ` for ${getProcedure(procedureSlug)!.name}` : ""}
        {" "}· newest first
      </p>

      {/* Cases */}
      {visible.length > 0 ? (
        <>
          <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c, i) => {
              const p = getProcedure(c.procedureSlug)!;
              const isFirstNew = page > 1 && i === (page - 1) * PAGE_SIZE;
              return (
                <li key={c.slug}>
                  <Link
                    ref={isFirstNew ? firstNewRef : undefined}
                    href={`/gallery/${c.slug}`}
                    prefetch
                    className="group block"
                  >
                    <ThumbPair category={c.category} pair={c.photos?.[c.views[0]]} label={`${p.name}, case ${c.number}`} />
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-h4 text-ink transition-colors group-hover:text-bronze">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-sm text-stone">{c.notes}</p>
                      </div>
                      <span className="numeral shrink-0 text-xs text-stone">#{c.number}</span>
                    </div>
                    <p className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs tracking-wide text-stone uppercase">
                      <span>
                        Age {c.ageRange} · {c.timeAfter} after · {c.views.length} {c.views.length === 1 ? "view" : "views"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-bronze">
                        View case <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>

          {remaining > 0 && (
            <div className="mt-16 flex flex-col items-center gap-4">
              <div className="h-0.5 w-48 bg-line" aria-hidden>
                <div className="h-full bg-bronze transition-[width] duration-500" style={{ width: `${(visible.length / matching.length) * 100}%` }} />
              </div>
              <p className="text-sm text-stone">
                You’ve viewed {visible.length} of {matching.length} cases
              </p>
              <Button
                type="button"
                variant="outline"
                size="cta-lg"
                onClick={() =>
                  setQuery({ category: categoryIdOf(category), procedure: procedureSlug ?? undefined, page: page + 1 })
                }
              >
                <Plus /> Load {Math.min(PAGE_SIZE, remaining)} more cases
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-10 border border-line bg-cream p-10 text-center">
          <p className="font-heading text-h4">No cases to show yet.</p>
          <p className="mt-2 text-stone">
            We add new results regularly.{" "}
            <button type="button" onClick={() => setQuery({})} className="link-underline">
              View all cases
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

/** Static, image-free preview shown (blurred) behind the age gate. */
export function GalleryPreview() {
  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[8/5] bg-[linear-gradient(160deg,#e6e1da,#d8c3a5)]" />
          <div className="mt-5 h-5 w-1/2 bg-line" />
          <div className="mt-3 h-3 w-3/4 bg-line/70" />
        </li>
      ))}
    </ul>
  );
}
