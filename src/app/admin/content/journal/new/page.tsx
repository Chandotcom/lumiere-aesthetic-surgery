import type { Metadata } from "next";
import { NewPostForm } from "@/components/admin/cms/post-editor";
import { BackToContent } from "@/components/admin/cms/editor-page";

export const metadata: Metadata = { title: "New journal post" };

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <BackToContent />
      <header className="space-y-1">
        <h1 className="font-heading text-3xl">New journal post</h1>
        <p className="text-sm text-stone">
          Starts as a draft. Nothing is public until you publish it.
        </p>
      </header>
      <NewPostForm />
    </div>
  );
}
