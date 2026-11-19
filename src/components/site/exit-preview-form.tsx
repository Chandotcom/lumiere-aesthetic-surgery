"use client";

import { usePathname } from "next/navigation";

export function ExitPreviewForm() {
  const pathname = usePathname();
  return (
    <form method="post" action="/api/preview/exit">
      <input type="hidden" name="path" value={pathname} />
      <button
        type="submit"
        className="rounded-sm border border-white/70 px-3 py-1 text-xs font-medium tracking-wide uppercase hover:bg-white hover:text-bronze-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Exit preview
      </button>
    </form>
  );
}
