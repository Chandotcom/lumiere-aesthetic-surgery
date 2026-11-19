import type { Metadata } from "next";
import { BackToContent } from "@/components/admin/cms/editor-page";
import { NewPageForm } from "@/components/admin/cms/page-editor";

export const metadata: Metadata = { title: "New page" };

export default function NewPagePage() {
  return (
    <div className="space-y-6">
      <BackToContent />
      <header className="space-y-1">
        <h1 className="font-heading text-3xl">New page</h1>
        <p className="max-w-2xl text-sm text-stone">
          Build a page from ready-made sections, such as a landing page for a campaign. It starts as a draft with a
          headline and a closing banner, and nothing is public until you publish it.
        </p>
      </header>
      <NewPageForm />
    </div>
  );
}
