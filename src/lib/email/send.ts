import "server-only";

/**
 * Sends one email through Resend's REST API (provisioned via the Vercel Marketplace).
 *
 * - No API key → does nothing (local dev, or before Resend is connected).
 * - Never throws: an email problem must never break the action that triggered it.
 * - Logs failures without addresses or content (they may identify a patient).
 *
 * Sender: EMAIL_FROM (an address on a domain verified in Resend). Without it we use Resend's test
 * sender, which can only deliver to the Resend account owner.
 */
export const hasEmail = () => Boolean(process.env.RESEND_API_KEY);
export const hasVerifiedSender = () => Boolean(process.env.EMAIL_FROM);

const TEST_SENDER = "Lumière (demo) <onboarding@resend.dev>";

export async function sendEmail(msg: { to: string[]; subject: string; html: string; text: string; tag: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || msg.to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || TEST_SENDER,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        tags: [{ name: "type", value: msg.tag }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[email] "${msg.tag}" not sent: Resend answered ${res.status}.`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[email] "${msg.tag}" not sent:`, err instanceof Error ? err.message : "unknown error");
    return false;
  }
}
