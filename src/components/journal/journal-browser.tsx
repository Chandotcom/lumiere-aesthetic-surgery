"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { journalCategories, type JournalCategory, type Post } from "@/lib/content/journal";
import { cn } from "@/lib/utils";
import { PostCard } from "./post-card";

/** Topic filter in the URL (?topic=recovery). The newest article is featured on "All". */
export function JournalBrowser({ posts }: { posts: Post[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const topicParam = params.get("topic");
  const topic = journalCategories.find((c) => c.toLowerCase().replace(/\s+/g, "-") === topicParam) ?? "All";
  const slug = (c: JournalCategory) => c.toLowerCase().replace(/\s+/g, "-");

  const list = topic === "All" ? posts : posts.filter((p) => p.category === topic);
  const [featured, ...rest] = topic === "All" ? list : [undefined, ...list];

  return (
    <div>
      <div role="group" aria-label="Filter by topic" className="-mb-px flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none] md:gap-9">
        {(["All", ...journalCategories] as const).map((c) => {
          const active = c === topic;
          const count = c === "All" ? posts.length : posts.filter((p) => p.category === c).length;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => router.replace(c === "All" ? pathname : `${pathname}?topic=${slug(c)}`, { scroll: false })}
              className={cn(
                "shrink-0 border-b py-3 text-label tracking-label whitespace-nowrap uppercase transition-colors",
                active ? "border-bronze text-ink" : "border-transparent text-stone hover:text-ink",
              )}
            >
              {c} <span className="text-stone/70">({count})</span>
            </button>
          );
        })}
      </div>

      {featured && (
        <div className="mt-12 border-b border-line pb-(--section-intro) md:mt-16">
          <PostCard post={featured} featured />
        </div>
      )}

      <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
        {rest.map((p) => (
          <li key={p!.slug}>
            <PostCard post={p!} />
          </li>
        ))}
      </ul>
    </div>
  );
}
