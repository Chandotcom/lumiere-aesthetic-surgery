import "server-only";
import type { z } from "zod";
import { getPost } from "@/lib/content/journal";
import { getProcedure, procedures } from "@/lib/content/procedures";
import { homeDefaults } from "./home";
import { procedureToFields } from "./procedures";
import { isBuiltInPost, postToFields } from "./journal";
import { pageSchema, pageSlugSchema } from "./page-schema";
import { homeSchema, postSchema, postSlugSchema, procedureFieldsSchema, seoSchema, settingsSchema } from "./schemas";
import { seoDefaults, settingsDefaults } from "./settings";

/**
 * Every editable content kind. The admin actions only accept kinds and keys listed here,
 * and preview redirects are built from `previewPath` (never from user input).
 */
type ContentKind = {
  label: string;
  schema: z.ZodType;
  /** Whether a document key is allowed for this kind. */
  isKey: (key: string) => boolean;
  /** Current code defaults for a key, in form shape. */
  defaults: (key: string) => unknown;
  previewPath: (key: string) => string;
};

export const contentKinds = {
  procedure: {
    label: "Procedure",
    schema: procedureFieldsSchema,
    isKey: (key) => procedures.some((p) => p.slug === key),
    defaults: (key) => procedureToFields(getProcedure(key)!),
    previewPath: (key) => `/procedures/${key}`,
  },
  home: {
    label: "Homepage",
    schema: homeSchema,
    isKey: (key) => key === "main",
    defaults: () => homeDefaults(),
    previewPath: () => "/",
  },
  settings: {
    label: "Contact details",
    schema: settingsSchema,
    isKey: (key) => key === "main",
    defaults: () => settingsDefaults(),
    previewPath: () => "/contact",
  },
  seo: {
    label: "SEO",
    schema: seoSchema,
    isKey: (key) => key === "main",
    defaults: () => seoDefaults(),
    previewPath: () => "/",
  },
  post: {
    label: "Journal post",
    schema: postSchema,
    // Built-in articles, or any valid new address (created from the admin).
    isKey: (key) => isBuiltInPost(key) || postSlugSchema.safeParse(key).success,
    defaults: (key) => {
      const builtIn = getPost(key);
      return builtIn ? postToFields(builtIn) : null;
    },
    previewPath: (key) => `/blog/${key}`,
  },
  page: {
    label: "Page",
    schema: pageSchema,
    // Pages exist only once created in the admin; they have no code defaults.
    isKey: (key) => pageSlugSchema.safeParse(key).success,
    defaults: () => null,
    previewPath: (key) => `/${key}`,
  },
} satisfies Record<string, ContentKind>;

export type ContentKindName = keyof typeof contentKinds;

export function resolveKind(kind: string, key: string) {
  if (!Object.hasOwn(contentKinds, kind)) return null;
  const def = contentKinds[kind as ContentKindName] as ContentKind;
  if (!def.isKey(key)) return null;
  return def;
}
