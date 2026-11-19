"use client";

import { useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { createReview, updateReview } from "@/app/admin/reviews/actions";
import { ImageField, TextField } from "@/components/admin/cms/fields";
import { selectClass } from "@/components/admin/gallery/case-details-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { categories, procedures } from "@/lib/content/procedures";
import { reviewSchema, reviewSources, type ReviewFields } from "@/lib/reviews/meta";
import { cn } from "@/lib/utils";

type F = ReviewFields;

/** Add or edit a review. Once a real review is published, its words and rating are locked. */
export function ReviewForm({ reviewId, defaults, locked = false }: { reviewId?: number; defaults: F; locked?: boolean }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<F>({ resolver: zodResolver(reviewSchema), defaultValues: defaults });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = reviewId ? await updateReview(reviewId, values) : await createReview(values);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Review saved");
        reset(values);
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {locked && (
          <p className="flex items-start gap-2 rounded-sm border border-line bg-cream/60 p-3 text-sm text-stone">
            <Lock className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
            This review has been published, so its words and rating are locked. Reviews are never edited after
            publishing. You can still change the details below, or hide it with a reason.
          </p>
        )}

        {locked ? (
          <figure className="space-y-2 rounded-sm border border-line p-4">
            <blockquote className="text-sm whitespace-pre-line text-ink">{defaults.body}</blockquote>
            <figcaption className="text-sm" aria-label={`${defaults.rating} out of 5 stars`}>
              <span className="text-bronze">{"★".repeat(defaults.rating)}</span>
              <span className="text-line">{"★".repeat(5 - defaults.rating)}</span>
            </figcaption>
          </figure>
        ) : (
        <div className="space-y-6">
          <TextField<F>
            name="body"
            label="Review"
            multiline
            rows={5}
            maxLength={600}
            hint="Copy the patient’s words exactly. Leave out any health details they’d rather keep private."
          />

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Rating</legend>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Rating" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label
                      key={n}
                      className={cn(
                        "grid size-10 cursor-pointer place-items-center rounded-sm border border-line text-lg transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                        n <= field.value ? "text-bronze" : "text-line",
                      )}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={n}
                        checked={field.value === n}
                        onChange={() => field.onChange(n)}
                        className="sr-only"
                      />
                      <span aria-hidden>★</span>
                      <span className="sr-only">
                        {n} {n === 1 ? "star" : "stars"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
          </fieldset>
        </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField<F> name="name" label="Name" maxLength={40} hint="First name and last initial only, like “Sarah M.”" />
          <div className="space-y-1.5">
            <Label htmlFor="procedureSlug">Procedure (optional)</Label>
            <select id="procedureSlug" className={selectClass} {...register("procedureSlug")}>
              <option value="">Not specified</option>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Where it came from</Label>
            <select id="source" className={selectClass} {...register("source")}>
              {Object.entries(reviewSources).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-3 pt-6 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-bronze" {...register("verified")} />
            <span>
              Confirmed patient
              <span className="block text-xs text-stone">You checked this person was treated at the clinic.</span>
            </span>
          </label>
        </div>

        <ImageField<F> name="photo" label="Reviewer photo (optional)" />
        <p className="-mt-3 text-xs text-stone">
          Only with the patient’s permission. Leave the URL empty to show a monogram instead.
        </p>

        <Button type="submit" disabled={pending || (Boolean(reviewId) && !isDirty)}>
          {reviewId ? "Save review" : "Add review"}
        </Button>
      </form>
    </FormProvider>
  );
}
