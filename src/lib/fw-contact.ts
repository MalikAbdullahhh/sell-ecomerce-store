// Sends a contact-form message to the inbox through the Fluxwright mail relay,
// which emails it in this project's own design. The Gmail credentials live only in the relay.
const RELAY = "https://mail.fluxwright.co/v1/contact";
const startedAt = Date.now();

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  subject?: string;
  phone?: string;
  fields?: Record<string, string | undefined | null>;
  website?: string; // honeypot: leave empty
};

export async function sendContact(project: string, p: ContactPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const fields = Object.fromEntries(Object.entries(p.fields ?? {}).filter(([, v]) => v != null && String(v).trim() !== "")) as Record<string, string>;
  try {
    const res = await fetch(RELAY, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, ...p, fields, page: typeof location !== "undefined" ? location.href : undefined, startedAt }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: data.error || "Your message couldn't be sent. Please try again." };
  } catch {
    return { ok: false, error: "Network problem. Please check your connection and try again." };
  }
}
