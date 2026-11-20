// Where each kind of editable content is edited in the admin, and how to name it.
// Client-safe; shared by the activity log and the website overview.
import { getProcedure } from "@/lib/content/procedures";

const singletons: Record<string, { label: string; href: string }> = {
  home: { label: "Homepage", href: "/admin/content/home" },
  settings: { label: "Contact details", href: "/admin/content/settings" },
  seo: { label: "SEO", href: "/admin/content/seo" },
  consultation: { label: "Consultation form", href: "/admin/forms/consultation" },
};

/** Admin editor URL for a content document (kind + key). */
export function editorHref(kind: string, key: string): string | undefined {
  if (singletons[kind]) return singletons[kind].href;
  if (kind === "procedure") return `/admin/content/procedures/${key}`;
  if (kind === "post") return `/admin/content/journal/${key}`;
  if (kind === "page") return `/admin/content/pages/${key}`;
  if (kind === "form") return `/admin/forms/${key}`;
  return undefined;
}

/** Human name for a content document, e.g. "Procedure: Rhinoplasty" or "Journal: Fillers or surgery?". */
export function documentLabel(kind: string, key: string, title?: unknown): string {
  if (singletons[kind]) return singletons[kind].label;
  const name = typeof title === "string" && title.trim() ? title.trim() : key;
  if (kind === "procedure") return `Procedure: ${getProcedure(key)?.name ?? key}`;
  if (kind === "post") return `Journal: ${name}`;
  if (kind === "page") return `Page: ${name}`;
  if (kind === "form") return `Form: ${name}`;
  return `${kind}: ${key}`;
}
