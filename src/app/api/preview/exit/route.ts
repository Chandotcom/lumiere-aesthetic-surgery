import { draftMode } from "next/headers";

/** Leave Draft Mode (preview) and go back to the page the visitor was on. */
export async function POST(request: Request) {
  (await draftMode()).disable();
  const form = await request.formData();
  const path = String(form.get("path") ?? "/");
  // Only same-site relative paths; "//host" would be an open redirect.
  const safe = path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
  return new Response(null, { status: 303, headers: { Location: safe } });
}
