"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FilePenLine, GalleryHorizontalEnd, Images, Inbox, LayoutDashboard, MessageSquareQuote, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

// Add sections here as they're built (users, activity).
const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/content", label: "Pages", icon: FilePenLine },
  { href: "/admin/content/journal", label: "Journal", icon: Newspaper },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontalEnd },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
] as const;

/** The item whose href is the longest prefix of the current path (so Journal wins over Pages). */
function activeHref(pathname: string) {
  return items
    .map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

export function AdminNav() {
  const pathname = usePathname();
  const current = activeHref(pathname);
  return (
    <nav aria-label="Admin">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-stone transition-colors hover:bg-cream hover:text-ink",
                  active && "bg-cream font-medium text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
