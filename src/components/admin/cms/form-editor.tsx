"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useFormContext, useFormState, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createForm, deleteForm } from "@/app/admin/content/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FIELD_TYPES,
  fieldTypes,
  formSchema,
  isChoice,
  mapsToLabel,
  newField,
  newFieldId,
  type FieldType,
  type FormField,
  type FormFields,
} from "@/lib/cms/form-schema";
import { cn } from "@/lib/utils";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ListField, TextField } from "./fields";

type F = FormFields;
const p = (s: string) => s as Path<F>; // field paths are built from the index at runtime

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

/** Name and email always feed the lead, so those questions keep their type and can't be removed. */
const isLocked = (f: Pick<FormField, "mapsTo">) => f.mapsTo === "name" || f.mapsTo === "email";

export function FormEditor({ slug, initial, state }: { slug: string; initial: F; state: ContentState }) {
  const form = useForm<F>({ resolver: zodResolver(formSchema), defaultValues: initial, mode: "onBlur" });
  return (
    <ContentForm
      form={form}
      kind="form"
      contentKey={slug}
      state={state}
      revertLabel="Unpublish"
      unpublishedText="Not published yet"
      extraActions={<DeleteFormButton slug={slug} />}
    >
      <Section title="Basics">
        <TextField<F> name="title" label="Form title" maxLength={120} hint="The heading above the form, and the browser tab title." />
        <TextField<F> name="intro" label="Intro (optional)" multiline rows={3} maxLength={400} hint="A sentence or two beside the form." />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="submitLabel" label="Button text" maxLength={40} placeholder="Send" />
          <TextField<F> name="successMessage" label="Thank-you message" multiline rows={2} maxLength={300} hint="Shown after sending." />
        </div>
        <MarketingToggle />
      </Section>

      <Section
        title="Questions"
        description="Shown top to bottom. A privacy-policy checkbox is always added at the end, and every submission arrives in Leads."
      >
        <FieldList />
      </Section>
    </ContentForm>
  );
}

function MarketingToggle() {
  const { register } = useFormContext<F>();
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-bronze" {...register("showMarketingConsent")} />
      <span>
        Ask for marketing consent
        <span className="block text-xs text-stone">Adds an optional, unticked “send me news and offers” checkbox. Never required.</span>
      </span>
    </label>
  );
}

function FieldList() {
  const { control, getValues } = useFormContext<F>();
  const { fields, append, insert, remove, move } = useFieldArray({ control, name: "fields", keyName: "key" });
  const { errors } = useFormState({ control, name: "fields" });
  const values = useWatch({ control, name: "fields" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<FieldType>("shortText");
  const addId = useId();
  const listError = errors.fields as { message?: string; root?: { message?: string } } | undefined;
  const rootError = listError?.root?.message ?? listError?.message;

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {fields.map((field, i) => {
          const current = values?.[i] ?? field;
          const locked = isLocked(field);
          const isCollapsed = collapsed[field.key];
          const hasError = Boolean((errors.fields as unknown[] | undefined)?.[i]);
          const bodyId = `${field.key}-body`;
          return (
            <li key={field.key} className={cn("rounded-sm border", hasError ? "border-destructive/60" : "border-line")}>
              <div className="flex items-center justify-between gap-2 border-b border-line bg-cream/40 px-3 py-2">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left text-sm"
                  aria-expanded={!isCollapsed}
                  aria-controls={bodyId}
                  onClick={() => setCollapsed((c) => ({ ...c, [field.key]: !isCollapsed }))}
                >
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", isCollapsed && "-rotate-90")} aria-hidden />
                  <span className="min-w-0 truncate">
                    <span className="font-medium">
                      {i + 1}. {current.label || "Untitled question"}
                    </span>{" "}
                    <span className="text-stone">· {fieldTypes[current.type].label}</span>
                  </span>
                  {current.mapsTo && <Badge className="shrink-0 bg-sand/40 text-ink">Used for the lead</Badge>}
                  {hasError && <span className="shrink-0 text-xs text-destructive">needs attention</span>}
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move question ${i + 1} up`}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move question ${i + 1} down`}>
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={fields.length >= 20 || locked}
                    // A copy gets its own id and isn't used for the lead (only one question can be).
                    onClick={() => insert(i + 1, { ...structuredClone(getValues(`fields.${i}`)), id: newFieldId(), mapsTo: "" })}
                    aria-label={`Duplicate question ${i + 1}`}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={fields.length <= 2 || locked}
                    onClick={() => remove(i)}
                    aria-label={locked ? `Question ${i + 1} is used for the lead and can’t be removed` : `Remove question ${i + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div id={bodyId} hidden={isCollapsed} className="space-y-4 p-4">
                <FieldBody i={i} locked={locked} />
              </div>
            </li>
          );
        })}
      </ol>
      {rootError && <p className="text-xs text-destructive">{rootError}</p>}

      <div className="flex flex-col gap-2 rounded-sm border border-dashed border-line p-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={addId}>Add a question</Label>
          <select id={addId} className={selectClass} value={adding} onChange={(e) => setAdding(e.target.value as FieldType)}>
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {fieldTypes[t].label}: {fieldTypes[t].description}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" disabled={fields.length >= 20} onClick={() => append(newField(adding))}>
          <Plus /> Add question
        </Button>
      </div>
    </div>
  );
}

function FieldBody({ i, locked }: { i: number; locked: boolean }) {
  const { register, control, setValue, getValues } = useFormContext<F>();
  const { errors } = useFormState({ control });
  const type = useWatch({ control, name: `fields.${i}.type` });
  const mapsTo = useWatch({ control, name: `fields.${i}.mapsTo` });
  const typeId = useId();
  const mapsId = useId();
  const fieldErrors = (errors.fields as Record<string, { mapsTo?: { message?: string }; required?: { message?: string } }> | undefined)?.[i];
  const b = `fields.${i}`;

  // Which lead column this question may fill, given its type.
  const mapChoices = [
    ...(type === "phone" ? (["phone"] as const) : []),
    ...(type === "longText" || type === "shortText" ? (["message"] as const) : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={typeId}>Type</Label>
          <select
            id={typeId}
            className={selectClass}
            disabled={locked}
            {...register(p(`${b}.type`), {
              onChange: (e) => {
                const next = e.target.value as FieldType;
                // Choice questions need options; give them two to start from.
                if (isChoice(next) && getValues(`fields.${i}.options`).length < 2) {
                  setValue(`fields.${i}.options`, [{ label: "Option 1" }, { label: "Option 2" }], { shouldDirty: true });
                }
                // A lead column only fits certain types; drop the link if it no longer fits.
                const m = getValues(`fields.${i}.mapsTo`);
                if ((m === "phone" && next !== "phone") || (m === "message" && next !== "longText" && next !== "shortText")) {
                  setValue(`fields.${i}.mapsTo`, "", { shouldDirty: true });
                }
              },
            })}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {fieldTypes[t].label}
              </option>
            ))}
          </select>
        </div>
        {locked ? (
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Used for</span>
            <p className="text-sm text-stone">{mapsTo ? mapsToLabel[mapsTo] : ""}. Always required.</p>
          </div>
        ) : mapChoices.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor={mapsId}>Save as</Label>
            <select
              id={mapsId}
              className={selectClass}
              aria-invalid={!!fieldErrors?.mapsTo || undefined}
              aria-describedby={fieldErrors?.mapsTo ? `${mapsId}-error` : `${mapsId}-hint`}
              {...register(p(`${b}.mapsTo`))}
            >
              <option value="">Just an answer</option>
              {mapChoices.map((m) => (
                <option key={m} value={m}>
                  {mapsToLabel[m]}
                </option>
              ))}
            </select>
            {fieldErrors?.mapsTo?.message ? (
              <p id={`${mapsId}-error`} className="text-xs text-destructive">
                {fieldErrors.mapsTo.message}
              </p>
            ) : (
              <p id={`${mapsId}-hint`} className="text-xs text-stone">
                Fills the lead’s own field, so staff can call or read it at a glance.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <TextField<F> name={p(`${b}.label`)} label="Question" maxLength={120} />
      <TextField<F> name={p(`${b}.hint`)} label="Help text (optional)" maxLength={200} hint="Shown under the question." />

      {!locked && (
        <div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-4 accent-bronze" {...register(p(`${b}.required`))} />
            Required
          </label>
          {fieldErrors?.required?.message && <p className="mt-1 text-xs text-destructive">{fieldErrors.required.message}</p>}
        </div>
      )}

      {type && isChoice(type) && (
        <ListField<F, never>
          name={`${b}.options` as never}
          label="Options"
          itemLabel="Option"
          newItem={{ label: "" } as never}
          max={12}
          renderItem={(j) => <TextField<F> name={p(`${b}.options.${j}.label`)} label="Option text" maxLength={80} />}
        />
      )}
    </>
  );
}

function DeleteFormButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>
        Delete form
      </Button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      Delete this form and all its versions? Leads it created are kept.
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await deleteForm(slug);
            if (res.ok) {
              toast.success("Form deleted");
              router.push("/admin/forms");
            } else {
              toast.error(res.error);
              setConfirming(false);
            }
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

/** "New form": title + address, then opens the editor with name, email and message questions. */
export function NewFormForm() {
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
          const res = await createForm(slug, title);
          if (res.ok) {
            toast.success("Draft form created");
            router.push(`/admin/forms/${slug}`);
          } else toast.error(res.error);
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-title`}>Form title</Label>
        <Input
          id={`${uid}-title`}
          required
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          placeholder="e.g. Callback request"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-slug`}>Web address</Label>
        <div className="flex items-center gap-1 text-sm">
          <span className="shrink-0 text-stone">/forms/</span>
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
          Can’t be changed later.
        </p>
      </div>
      <Button type="submit" disabled={pending || !title || slug.length < 3}>
        Create draft form
      </Button>
    </form>
  );
}
