import type { Metadata } from "next";
import { BackToForms } from "@/components/admin/cms/editor-page";
import { NewFormForm } from "@/components/admin/cms/form-editor";

export const metadata: Metadata = { title: "New form" };

export default function NewFormPage() {
  return (
    <div className="space-y-6">
      <BackToForms />
      <header className="space-y-1">
        <h1 className="font-heading text-3xl">New form</h1>
        <p className="max-w-2xl text-sm text-stone">
          A form for anything beyond the consultation request, such as a callback request or an event sign-up. It starts
          as a draft with name, email and message questions, and nothing is public until you publish it.
        </p>
      </header>
      <NewFormForm />
    </div>
  );
}
