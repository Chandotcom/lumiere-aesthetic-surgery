"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPost, deletePost } from "@/app/admin/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { journalTopics, postSchema, type PostFields } from "@/lib/cms/schemas";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ImageField, TextField } from "./fields";

type F = PostFields;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PostEditor({
  slug,
  initial,
  state,
  builtIn,
  procedureOptions,
}: {
  slug: string;
  initial: F;
  state: ContentState;
  builtIn: boolean;
  procedureOptions: { slug: string; name: string }[];
}) {
  const form = useForm<F>({ resolver: zodResolver(postSchema), defaultValues: initial, mode: "onBlur" });

  return (
    <ContentForm
      form={form}
      kind="post"
      contentKey={slug}
      state={state}
      revertLabel={builtIn ? "Revert live article to the original" : "Unpublish"}
      unpublishedText={builtIn ? undefined : "Not published yet"}
      extraActions={builtIn ? null : <DeletePostButton slug={slug} />}
    >
      <Section title="Basics">
        <TextField<F> name="title" label="Title" maxLength={120} />
        <TextField<F> name="excerpt" label="Summary" multiline maxLength={300} hint="Shown on cards and as the search-result description." />
        <div className="grid gap-4 sm:grid-cols-3">
          <TopicSelect />
          <DateField />
          <TextField<F> name="readTime" label="Reading time" maxLength={20} hint="e.g. 5 min read" />
        </div>
        <VisibleToggle />
      </Section>

      <Section title="Cover photo">
        <ImageField<F> name="image" label="Cover" />
      </Section>

      <Section title="Article" description="Markdown: ## for headings, **bold**, - for bullet lists, [text](https://…) for links. Use Preview to see it on the real page.">
        <TextField<F> name="content" label="Body" multiline rows={22} maxLength={30_000} className="[&_textarea]:font-mono [&_textarea]:text-[13px]" />
      </Section>

      <Section title="Related procedures" description="Linked at the end of the article, up to 4.">
        <RelatedProcedures options={procedureOptions} />
      </Section>
    </ContentForm>
  );
}

function TopicSelect() {
  const id = useId();
  const { register } = useFormContext<F>();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Topic</Label>
      <select id={id} className={selectClass} {...register("category")}>
        {journalTopics.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField() {
  const id = useId();
  const { register } = useFormContext<F>();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Date</Label>
      <Input id={id} type="date" {...register("publishedAt")} />
    </div>
  );
}

function VisibleToggle() {
  const { register } = useFormContext<F>();
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-bronze" {...register("visible")} />
      <span>
        Show on the site
        <span className="block text-xs text-stone">Untick and publish to hide the article without deleting it.</span>
      </span>
    </label>
  );
}

function RelatedProcedures({ options }: { options: { slug: string; name: string }[] }) {
  const { register, formState } = useFormContext<F>();
  const error = formState.errors.relatedProcedures?.message;
  return (
    <fieldset>
      <legend className="sr-only">Related procedures</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label key={o.slug} className="flex items-center gap-2 text-sm">
            <input type="checkbox" value={o.slug} className="size-4 accent-bronze" {...register("relatedProcedures")} />
            {o.name}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>
        Delete post
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      Delete this post and all its versions?
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await deletePost(slug);
            if (res.ok) {
              toast.success("Post deleted");
              router.push("/admin/content/journal");
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

/** "New post": title + address, then opens the full editor. */
export function NewPostForm() {
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
      .slice(0, 80);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await createPost(slug, title);
          if (res.ok) {
            toast.success("Draft created");
            router.push(`/admin/content/journal/${slug}`);
          } else toast.error(res.error);
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-title`}>Title</Label>
        <Input
          id={`${uid}-title`}
          required
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-slug`}>Web address</Label>
        <div className="flex items-center gap-1 text-sm text-stone">
          <span>/blog/</span>
          <Input
            id={`${uid}-slug`}
            required
            maxLength={80}
            value={slug}
            aria-describedby={`${uid}-slug-hint`}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <p id={`${uid}-slug-hint`} className="text-xs text-stone">
          Lowercase words joined by hyphens. It can&rsquo;t be changed later, because links to the article would break.
        </p>
      </div>
      <Button type="submit" disabled={pending || !title.trim() || slug.length < 3}>
        Create draft
      </Button>
    </form>
  );
}
