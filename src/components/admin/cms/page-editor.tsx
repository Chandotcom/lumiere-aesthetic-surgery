"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useFormContext, useFormState, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPage, deletePage } from "@/app/admin/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  blockTypes,
  newBlock,
  pageSchema,
  TONES,
  type Block,
  type BlockType,
  type PageFields,
} from "@/lib/cms/page-schema";
import { cn } from "@/lib/utils";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ImageField, ListField, TextField } from "./fields";

type F = PageFields;
const p = (s: string) => s as Path<F>; // block field paths are built from the index at runtime

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const ACCENT_HINT = "Wrap words in *asterisks* to show them in the bronze accent.";
const toneLabel = { default: "Light", alt: "Cream", dark: "Dark" } as const;

export function PageEditor({
  slug,
  initial,
  state,
  procedureOptions,
}: {
  slug: string;
  initial: F;
  state: ContentState;
  procedureOptions: { slug: string; name: string }[];
}) {
  const form = useForm<F>({ resolver: zodResolver(pageSchema), defaultValues: initial, mode: "onBlur" });
  return (
    <ContentForm
      form={form}
      kind="page"
      contentKey={slug}
      state={state}
      revertLabel="Unpublish"
      unpublishedText="Not published yet"
      extraActions={<DeletePageButton slug={slug} />}
    >
      <Section title="Basics">
        <TextField<F> name="title" label="Page title" maxLength={120} hint="Used in the browser tab and as the search title if you leave that empty." />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="seo.title" label="Search title (optional)" maxLength={70} />
          <TextField<F> name="seo.description" label="Search description (optional)" maxLength={220} multiline rows={2} />
        </div>
        <NoindexToggle />
      </Section>

      <Section title="Sections" description="The page is built from these sections, top to bottom. Use the arrows to reorder them.">
        <BlockList procedureOptions={procedureOptions} />
      </Section>
    </ContentForm>
  );
}

function NoindexToggle() {
  const { register } = useFormContext<F>();
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-bronze" {...register("noindex")} />
      <span>
        Hide from search engines
        <span className="block text-xs text-stone">For pages only shared directly, like a campaign landing page.</span>
      </span>
    </label>
  );
}

function BlockList({ procedureOptions }: { procedureOptions: { slug: string; name: string }[] }) {
  const { control, getValues } = useFormContext<F>();
  const { fields, append, insert, remove, move } = useFieldArray({ control, name: "blocks" });
  const { errors } = useFormState({ control, name: "blocks" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<BlockType>("text");
  const addId = useId();
  const listError = (errors.blocks as { message?: string; root?: { message?: string } } | undefined);
  const rootError = listError?.root?.message ?? listError?.message;

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {fields.map((field, i) => {
          const type = (field as unknown as Block).type;
          const isCollapsed = collapsed[field.id];
          const hasError = Boolean((errors.blocks as unknown[] | undefined)?.[i]);
          const bodyId = `${field.id}-body`;
          return (
            <li key={field.id} className={cn("rounded-sm border", hasError ? "border-destructive/60" : "border-line")}>
              <div className="flex items-center justify-between gap-2 border-b border-line bg-cream/40 px-3 py-2">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left text-sm"
                  aria-expanded={!isCollapsed}
                  aria-controls={bodyId}
                  onClick={() => setCollapsed((c) => ({ ...c, [field.id]: !isCollapsed }))}
                >
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", isCollapsed && "-rotate-90")} aria-hidden />
                  <span className="font-medium">
                    Section {i + 1}: {blockTypes[type].label}
                  </span>
                  {hasError && <span className="text-xs text-destructive">needs attention</span>}
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move section ${i + 1} up`}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move section ${i + 1} down`}>
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={fields.length >= 20}
                    onClick={() => insert(i + 1, structuredClone(getValues(`blocks.${i}`)))}
                    aria-label={`Duplicate section ${i + 1}`}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={fields.length <= 1}
                    onClick={() => remove(i)}
                    aria-label={`Remove section ${i + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div id={bodyId} hidden={isCollapsed} className="space-y-4 p-4">
                <BlockFields type={type} i={i} procedureOptions={procedureOptions} />
              </div>
            </li>
          );
        })}
      </ol>
      {rootError && <p className="text-xs text-destructive">{rootError}</p>}

      <div className="flex flex-col gap-2 rounded-sm border border-dashed border-line p-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={addId}>Add a section</Label>
          <select id={addId} className={selectClass} value={adding} onChange={(e) => setAdding(e.target.value as BlockType)}>
            {(Object.keys(blockTypes) as BlockType[]).map((t) => (
              <option key={t} value={t}>
                {blockTypes[t].label}: {blockTypes[t].description}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" disabled={fields.length >= 20} onClick={() => append(newBlock(adding))}>
          <Plus /> Add section
        </Button>
      </div>
    </div>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  const id = useId();
  const { register } = useFormContext<F>();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={selectClass} {...register(p(name))}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const ToneSelect = ({ i }: { i: number }) => (
  <Select name={`blocks.${i}.tone`} label="Background" options={TONES.map((t) => ({ value: t, label: toneLabel[t] }))} />
);

function CtaFields({ base, title }: { base: string; title: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField<F> name={p(`${base}.label`)} label="Button text" maxLength={40} />
        <TextField<F> name={p(`${base}.href`)} label="Link" maxLength={200} placeholder="/consultation" hint="A page on this site, starting with /." />
      </div>
    </fieldset>
  );
}

function ProcedurePicker({ i, options }: { i: number; options: { slug: string; name: string }[] }) {
  const { register, control } = useFormContext<F>();
  const { errors } = useFormState({ control });
  const error = (errors.blocks as { slugs?: { message?: string; root?: { message?: string } } }[] | undefined)?.[i]?.slugs;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Procedures to show</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label key={o.slug} className="flex items-center gap-2 text-sm">
            <input type="checkbox" value={o.slug} className="size-4 accent-bronze" {...register(p(`blocks.${i}.slugs`))} />
            {o.name}
          </label>
        ))}
      </div>
      {(error?.message ?? error?.root?.message) && <p className="mt-2 text-xs text-destructive">{error?.message ?? error?.root?.message}</p>}
    </fieldset>
  );
}

function BlockFields({ type, i, procedureOptions }: { type: BlockType; i: number; procedureOptions: { slug: string; name: string }[] }) {
  const b = `blocks.${i}`;
  switch (type) {
    case "hero":
      return (
        <>
          <TextField<F> name={p(`${b}.eyebrow`)} label="Eyebrow (optional)" maxLength={80} hint="Small label above the headline." />
          <TextField<F> name={p(`${b}.heading`)} label="Headline" maxLength={120} hint={ACCENT_HINT} />
          <TextField<F> name={p(`${b}.intro`)} label="Intro (optional)" multiline rows={3} maxLength={400} />
          <ImageField<F> name={p(`${b}.image`)} label="Photo" />
          <CtaFields base={`${b}.primary`} title="Main button (optional)" />
          <CtaFields base={`${b}.secondary`} title="Second button (optional)" />
        </>
      );
    case "text":
      return (
        <>
          <ToneSelect i={i} />
          <TextField<F> name={p(`${b}.heading`)} label="Heading (optional)" maxLength={120} hint={ACCENT_HINT} />
          <TextField<F>
            name={p(`${b}.body`)}
            label="Text"
            multiline
            rows={10}
            maxLength={10_000}
            hint="Markdown: ## for headings, **bold**, - for lists, [text](/page) for links."
            className="[&_textarea]:font-mono [&_textarea]:text-[13px]"
          />
        </>
      );
    case "mediaText":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ToneSelect i={i} />
            <Select name={`${b}.imageSide`} label="Photo position" options={[{ value: "right", label: "Right of the text" }, { value: "left", label: "Left of the text" }]} />
          </div>
          <TextField<F> name={p(`${b}.eyebrow`)} label="Eyebrow (optional)" maxLength={80} />
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <TextField<F> name={p(`${b}.body`)} label="Text" multiline rows={5} maxLength={2_000} />
          <ImageField<F> name={p(`${b}.image`)} label="Photo" />
          <CtaFields base={`${b}.cta`} title="Button (optional)" />
        </>
      );
    case "features":
      return (
        <>
          <ToneSelect i={i} />
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <TextField<F> name={p(`${b}.intro`)} label="Intro (optional)" multiline rows={2} maxLength={300} />
          <ListField<F, never>
            name={`${b}.items` as never}
            label="Points"
            itemLabel="Point"
            newItem={{ title: "", text: "" } as never}
            max={6}
            renderItem={(j) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <TextField<F> name={p(`${b}.items.${j}.title`)} label="Title" maxLength={60} />
                <TextField<F> name={p(`${b}.items.${j}.text`)} label="Text" maxLength={240} />
              </div>
            )}
          />
        </>
      );
    case "stats":
      return (
        <>
          <ToneSelect i={i} />
          <ListField<F, never>
            name={`${b}.items` as never}
            label="Numbers"
            itemLabel="Number"
            newItem={{ value: "", label: "" } as never}
            max={4}
            renderItem={(j) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <TextField<F> name={p(`${b}.items.${j}.value`)} label="Figure" maxLength={20} placeholder="15+" />
                <TextField<F> name={p(`${b}.items.${j}.label`)} label="Label" maxLength={60} placeholder="Years of experience" />
              </div>
            )}
          />
        </>
      );
    case "faq":
      return (
        <>
          <ToneSelect i={i} />
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <ListField<F, never>
            name={`${b}.items` as never}
            label="Questions"
            itemLabel="Question"
            newItem={{ question: "", answer: "" } as never}
            max={12}
            renderItem={(j) => (
              <>
                <TextField<F> name={p(`${b}.items.${j}.question`)} label="Question" maxLength={200} />
                <TextField<F> name={p(`${b}.items.${j}.answer`)} label="Answer" multiline rows={3} maxLength={1500} />
              </>
            )}
          />
        </>
      );
    case "procedures":
      return (
        <>
          <ToneSelect i={i} />
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <ProcedurePicker i={i} options={procedureOptions} />
        </>
      );
    case "testimonials":
      return (
        <>
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <p className="text-sm text-stone">Shows the newest published reviews from Reviews. Used once per page.</p>
        </>
      );
    case "galleryTeaser":
      return <p className="text-sm text-stone">Shows the newest before &amp; after case behind the 18+ confirmation. No settings. Used once per page.</p>;
    case "cta":
      return (
        <>
          <TextField<F> name={p(`${b}.heading`)} label="Heading" maxLength={120} hint={ACCENT_HINT} />
          <TextField<F> name={p(`${b}.intro`)} label="Intro (optional)" multiline rows={2} maxLength={300} />
          <CtaFields base={`${b}.button`} title="Button" />
        </>
      );
  }
}

function DeletePageButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>
        Delete page
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      Delete this page and all its versions?
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await deletePage(slug);
            if (res.ok) {
              toast.success("Page deleted");
              router.push("/admin/content");
            } else toast.error(res.error);
          })
        }
      >
        Yes, delete
      </Button>
      <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}

/** "New page": title + address, then opens the full editor with a starter hero and closing banner. */
export function NewPageForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const uid = useId();
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await createPage(slug, title);
          if (res.ok) {
            toast.success("Draft page created");
            router.push(`/admin/content/pages/${slug}`);
          } else toast.error(res.error);
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-title`}>Page title</Label>
        <Input
          id={`${uid}-title`}
          required
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          placeholder="e.g. Spring consultation offer"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-slug`}>Web address</Label>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-stone">/</span>
          <Input
            id={`${uid}-slug`}
            required
            maxLength={60}
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugEdited(true);
            }}
            aria-describedby={`${uid}-slug-hint`}
          />
        </div>
        <p id={`${uid}-slug-hint`} className="text-xs text-stone">
          Can’t be changed later. Names already used by the site (like about or gallery) aren’t allowed.
        </p>
      </div>
      <Button type="submit" disabled={pending || !title || slug.length < 3}>
        Create draft page
      </Button>
    </form>
  );
}
