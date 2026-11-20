"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FilePenLine,
  GalleryHorizontalEnd,
  History,
  Images,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  Newspaper,
  UsersRound,
} from "lucide-react";
import { can, type Permission, type StaffRole } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: typeof Inbox; permission: Permission }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/admin/leads", label: "Leads", icon: Inbox, permission: "leads" },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays, permission: "appointments" },
  { href: "/admin/content", label: "Pages", icon: FilePenLine, permission: "content" },
  { href: "/admin/content/journal", label: "Journal", icon: Newspaper, permission: "content" },
  { href: "/admin/forms", label: "Forms", icon: ClipboardList, permission: "content" },
  { href: "/admin/media", label: "Media", icon: Images, permission: "media" },
  { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontalEnd, permission: "gallery" },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, permission: "reviews" },
  { href: "/admin/users", label: "Staff", icon: UsersRound, permission: "users" },
  { href: "/admin/activity", label: "Activity", icon: History, permission: "activity" },
];

/** The item whose href is the longest prefix of the current path (so Journal wins over Pages). */
function activeHref(pathname: string) {
  return items
    .map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Sidebar, showing only the sections the signed-in role can open (the server enforces it too). */
export function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const current = activeHref(pathname);
  return (
    <nav aria-label="Admin">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {items
          // Editors have no KPI dashboard; their /admin is the website overview instead.
          .map((i) =>
            i.href === "/admin" && !can(role, "dashboard") ? { ...i, label: "Overview", permission: "content" as const } : i,
          )
          .filter((i) => can(role, i.permission))
          .map(({ href, label, icon: Icon }) => {
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
