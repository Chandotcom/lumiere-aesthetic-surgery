"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCase, updateCase } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories, procedures } from "@/lib/content/procedures";
import { GALLERY_AGE_RANGES, GALLERY_VIEWS } from "@/lib/gallery/meta";
import { caseFieldsSchema, type CaseFields } from "@/lib/gallery/schemas";

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive";

function Error({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

/** Case details (procedure, patient age range, timing, notes, angles). Creates or updates. */
export function CaseDetailsForm({ caseId, defaults }: { caseId?: number; defaults: CaseFields }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<CaseFields>({ resolver: zodResolver(caseFieldsSchema), defaultValues: defaults });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = caseId ? await updateCase(caseId, values) : await createCase(values);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Case details saved");
        reset(values);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="procedureSlug">Procedure</Label>
          <select
            id="procedureSlug"
            className={selectClass}
            aria-invalid={Boolean(errors.procedureSlug)}
            aria-describedby="procedureSlug-error"
            {...register("procedureSlug")}
          >
            <option value="">Choose…</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {procedures
                  .filter((p) => p.category === cat.name)
                  .map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <Error id="procedureSlug-error" message={errors.procedureSlug?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ageRange">Patient age range</Label>
          <select
            id="ageRange"
            className={selectClass}
            aria-invalid={Boolean(errors.ageRange)}
            aria-describedby="ageRange-hint ageRange-error"
            {...register("ageRange")}
          >
            {GALLERY_AGE_RANGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <p id="ageRange-hint" className="text-xs text-stone">
            A range only. Never the exact age.
          </p>
          <Error id="ageRange-error" message={errors.ageRange?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timeAfter">After photo taken</Label>
          <Input
            id="timeAfter"
            placeholder="e.g. 6 months"
            aria-invalid={Boolean(errors.timeAfter)}
            aria-describedby="timeAfter-error"
            {...register("timeAfter")}
          />
          <Error id="timeAfter-error" message={errors.timeAfter?.message} />
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Photo angles</legend>
          <div className="flex flex-wrap gap-4 pt-1.5">
            {GALLERY_VIEWS.map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={v} className="size-4 accent-bronze" {...register("views")} />
                {v}
              </label>
            ))}
          </div>
          <Error id="views-error" message={errors.views?.message ?? errors.views?.root?.message} />
        </fieldset>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Case notes</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="e.g. Dorsal hump reduction and tip refinement."
          aria-invalid={Boolean(errors.notes)}
          aria-describedby="notes-hint notes-error"
          {...register("notes")}
        />
        <p id="notes-hint" className="text-xs text-stone">
          Shown publicly. Describe the treatment only: no names, dates or anything that could identify the patient.
        </p>
        <Error id="notes-error" message={errors.notes?.message} />
      </div>

      <Button type="submit" disabled={pending || (Boolean(caseId) && !isDirty)}>
        {caseId ? "Save details" : "Create case"}
      </Button>
    </form>
  );
}
