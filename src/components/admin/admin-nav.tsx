"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FilePenLine, Inbox, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

// Add sections here as they're built (appointments, gallery, reviews, journal, settings).
const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Inbox, exact: false },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays, exact: false },
  { href: "/admin/content", label: "Site content", icon: FilePenLine, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 md:flex-col">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
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
