"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { navLinks, serviceGroups } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const navLinkClass =
  "relative py-2 text-label tracking-label uppercase text-ink transition-colors hover:text-bronze after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-bronze after:transition-transform after:duration-500 after:ease-luxe hover:after:scale-x-100";

export function SiteHeader({ phone }: { phone: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tel = `tel:${phone.replace(/[^+\d]/g, "")}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Small hover-intent delay so the panel doesn't flicker when the pointer crosses gaps.
  const open = () => {
    clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  };
  const close = () => setMenuOpen(false);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        solid
          ? "border-line bg-ivory/90 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/80"
          : "border-transparent bg-ivory",
      )}
      onMouseLeave={scheduleClose}
    >
      <div className="container-wide flex h-(--header-h) items-center justify-between gap-4 xl:gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-10">
            <li onMouseEnter={open}>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="procedures-menu"
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(navLinkClass, "inline-flex items-center gap-1.5", menuOpen && "text-bronze")}
              >
                Procedures
                <ChevronDown
                  aria-hidden
                  className={cn("size-3.5 transition-transform duration-300", menuOpen && "rotate-180")}
                />
              </button>
            </li>
            {navLinks.map((l) => (
              <li key={l.href} onMouseEnter={scheduleClose}>
                <Link href={l.href} className={navLinkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:gap-6">
          <a
            href={tel}
            className="hidden items-center gap-2 text-sm text-stone transition-colors hover:text-bronze xl:inline-flex"
          >
            <Phone className="size-4" aria-hidden />
            {phone}
          </a>
          <ButtonLink size="cta" className="hidden md:inline-flex lg:max-xl:px-4" href="/consultation">
            Request a consultation
          </ButtonLink>
          <div className="lg:hidden">
            <MobileNav phone={phone} />
          </div>
        </div>
      </div>

      {/* Mega menu */}
      <div
        id="procedures-menu"
        onMouseEnter={open}
        className={cn(
          "absolute inset-x-0 top-full hidden border-b border-line bg-ivory shadow-[0_30px_60px_-30px_rgb(29_27_24/0.25)] transition-[opacity,transform] duration-500 ease-luxe lg:block",
          menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <div className="container-wide grid grid-cols-12 gap-10 py-12">
          <div className="col-span-8 flex flex-col gap-10">
          <div className="grid grid-cols-4 gap-8">
            {serviceGroups.map((g) => (
              <div key={g.category}>
                <Link
                  href={g.href}
                  onClick={close}
                  className="font-heading text-h4 text-ink transition-colors hover:text-bronze"
                >
                  {g.category}
                </Link>
                <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                  {g.procedures.map((x) => (
                    <li key={x.href}>
                      <Link
                        href={x.href}
                        onClick={close}
                        className="text-sm text-stone transition-colors hover:text-bronze"
                      >
                        {x.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
            <Link
              href="/procedures"
              onClick={close}
              className="link-underline inline-flex items-center gap-2 self-start text-sm"
            >
              View all procedures <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <Link
            href="/consultation"
            onClick={close}
            className="group col-span-4 grid grid-cols-5 items-center gap-5 bg-cream p-4"
          >
            <div className="relative col-span-2 aspect-[4/5] overflow-hidden">
              <Image
                src={serviceGroups[0].image.src}
                alt=""
                fill
                sizes="12rem"
                className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
              />
            </div>
            <div className="col-span-3 stack gap-3!">
              <p className="eyebrow">Not sure where to start?</p>
              <p className="font-heading text-h4 text-ink">
                Plan your treatment with Dr. Marsh.
              </p>
              <span className="link-underline self-start text-sm">Request a consultation</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
