import "server-only";

// Plain, table-free HTML that renders in every mail client. Every value is escaped.
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f4ef;font-family:Inter,Arial,sans-serif;color:#1d1b18">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#82633f">Lumière Aesthetic Surgery</p>
${body}
<p style="margin:32px 0 0;font-size:12px;color:#6b645b">Demo practice. This message was sent automatically.</p>
</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#82633f;color:#fff;text-decoration:none;padding:12px 20px;font-size:14px">${esc(label)}</a></p>`;

/**
 * Staff alert. Deliberately minimal: no message, procedure, email or phone, because inboxes can be
 * forwarded or read outside the clinic. Everything else is one click away in the dashboard.
 */
export function newLeadAlert(p: { displayName: string; receivedAt: string; source: string; leadUrl: string; formTitle?: string }) {
  const what = p.formTitle ? `New enquiry (${p.formTitle})` : "New consultation request";
  const subject = `${what}: ${p.displayName}`;
  const text = [
    // displayName usually ends with an initial ("Maria L."), so don't add a second full stop.
    `${what} from ${p.displayName}${p.displayName.endsWith(".") ? "" : "."}`,
    `Received: ${p.receivedAt}`,
    `Came from: ${p.source}`,
    "",
    `Open it in the dashboard: ${p.leadUrl}`,
    "",
    "Patient details are only shown in the dashboard, never in email.",
  ].join("\n");
  const html = layout(`
<h1 style="margin:0 0 12px;font-size:22px;font-weight:400">${esc(what)}</h1>
<p style="margin:0;font-size:15px;line-height:1.6"><strong>${esc(p.displayName)}</strong> ${p.formTitle ? `sent the “${esc(p.formTitle)}” form` : "asked for a consultation"}.</p>
<p style="margin:8px 0 0;font-size:14px;color:#6b645b">Received ${esc(p.receivedAt)} · came from ${esc(p.source)}</p>
${button(p.leadUrl, "Open the lead")}
<p style="margin:0;font-size:13px;color:#6b645b">Patient details are only shown in the dashboard, never in email.</p>`);
  return { subject, text, html };
}

/** Patient confirmation. Never repeats what they asked about. */
export function requestReceived(p: { firstName: string; phone: string; siteUrl: string; isForm?: boolean }) {
  const what = p.isForm ? "message" : "consultation request";
  const subject = `We’ve received your ${what}`;
  const text = [
    `Hi ${p.firstName},`,
    "",
    `Thank you for reaching out. We’ve received your ${what}, and a member of our team will contact you within one business day.`,
    "",
    `If you need us sooner, call ${p.phone}.`,
    "",
    "Please don’t reply to this email with medical details. We’ll discuss everything privately with you.",
    "",
    "Lumière Aesthetic Surgery",
    p.siteUrl,
  ].join("\n");
  const html = layout(`
<h1 style="margin:0 0 12px;font-size:22px;font-weight:400">Thank you, ${esc(p.firstName)}</h1>
<p style="margin:0;font-size:15px;line-height:1.6">We’ve received your ${esc(what)}. A member of our team will contact you within one business day.</p>
<p style="margin:16px 0 0;font-size:15px;line-height:1.6">Need us sooner? Call <a href="tel:${esc(p.phone.replace(/[^+\d]/g, ""))}" style="color:#82633f">${esc(p.phone)}</a>.</p>
<p style="margin:16px 0 0;font-size:13px;color:#6b645b">Please don’t reply with medical details. We’ll discuss everything privately with you.</p>`);
  return { subject, text, html };
}
