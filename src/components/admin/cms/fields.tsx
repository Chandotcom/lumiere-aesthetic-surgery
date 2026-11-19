"use client";

import { useId } from "react";
import Image from "next/image";
import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
  type ArrayPath,
  type FieldArray,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_IMAGE_PREFIX } from "@/lib/cms/schemas";
import { cn } from "@/lib/utils";

/** Read a nested error message ("faqs.2.answer") from react-hook-form's errors object. */
function errorAt(errors: unknown, path: string): string | undefined {
  let cur: unknown = errors;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  const message = (cur as { message?: unknown } | undefined)?.message;
  // Array-level errors (e.g. "Add at least one item") live under `root`.
  const root = (cur as { root?: { message?: unknown } } | undefined)?.root?.message;
  return typeof message === "string" ? message : typeof root === "string" ? root : undefined;
}

function useFieldError(name: string) {
  const { errors } = useFormState();
  return errorAt(errors, name);
}

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField<T extends FieldValues>({
  name,
  label,
  hint,
  multiline,
  rows = 3,
  maxLength,
  placeholder,
  className,
}: {
  name: Path<T>;
  label: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const common = { id, "aria-invalid": !!error || undefined, "aria-describedby": describedBy, maxLength, placeholder };
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      {multiline ? <Textarea rows={rows} {...common} {...register(name)} /> : <Input {...common} {...register(name)} />}
    </FieldShell>
  );
}

export function NumberField<T extends FieldValues>({
  name,
  label,
  hint,
  step = 1,
  className,
}: {
  name: Path<T>;
  label: string;
  hint?: string;
  step?: number;
  className?: string;
}) {
  const id = useId();
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        step={step}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name, { valueAsNumber: true })}
      />
    </FieldShell>
  );
}

/** Image URL + alt text, with a live thumbnail when the URL is from an allowed host. */
export function ImageField<T extends FieldValues>({ name, label }: { name: Path<T>; label: string }) {
  const { control } = useFormContext<T>();
  const src = useWatch({ control, name: `${name}.src` as Path<T> }) as string | undefined;
  const valid = typeof src === "string" && src.startsWith(ALLOWED_IMAGE_PREFIX);
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
        <div className="relative aspect-[4/5] w-28 overflow-hidden rounded-sm bg-cream">
          {valid && <Image src={src} alt="" fill sizes="112px" className="object-cover" />}
        </div>
        <div className="space-y-3">
          <TextField<T>
            name={`${name}.src` as Path<T>}
            label="Image URL"
            hint={`Unsplash image URL (starts with ${ALLOWED_IMAGE_PREFIX}). Uploads come later.`}
          />
          <TextField<T>
            name={`${name}.alt` as Path<T>}
            label="Alt text"
            hint="Describe the image for screen-reader users."
            maxLength={200}
          />
        </div>
      </div>
    </fieldset>
  );
}

/** A repeatable list (FAQs, timeline steps…) with add, remove and reorder. */
export function ListField<T extends FieldValues, N extends ArrayPath<T>>({
  name,
  label,
  itemLabel,
  newItem,
  max,
  renderItem,
}: {
  name: N;
  label: string;
  itemLabel: string;
  newItem: FieldArray<T, N>;
  max: number;
  renderItem: (index: number) => React.ReactNode;
}) {
  const { control } = useFormContext<T>();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const error = useFieldError(name);
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <ol className="space-y-3">
        {fields.map((field, i) => (
          <li key={field.id} className="rounded-sm border border-line p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone">
                {itemLabel} {i + 1}
              </span>
              <div className="flex gap-1">
                <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} up`}>
                  <ArrowUp />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} down`}>
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" disabled={fields.length <= 1} onClick={() => remove(i)} aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}>
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="space-y-3">{renderItem(i)}</div>
          </li>
        ))}
      </ol>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="button" variant="outline" size="sm" disabled={fields.length >= max} onClick={() => append(newItem)}>
        <Plus /> Add {itemLabel.toLowerCase()}
      </Button>
    </fieldset>
  );
}
