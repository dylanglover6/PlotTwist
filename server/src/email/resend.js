import { Resend } from "resend";

// Lazily construct the Resend client so the module can be imported even when
// email is not configured. With no API key, email is a logged no-op and the
// rest of the app keeps working (same pattern as the Unsplash proxy).
let client = null;

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getClient() {
  if (!client && isEmailEnabled()) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

const defaultFrom = "Plot Twist <onboarding@resend.dev>";

// Sends one email. Returns true on success, false on failure/disabled — the
// caller decides what to do (e.g. not mark a notification as sent so the sweep
// retries it next run). Never throws.
export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailEnabled()) {
    console.log(`[email] disabled — would send "${subject}" to ${to}`);
    return false;
  }

  try {
    const from = process.env.EMAIL_FROM || defaultFrom;
    const { error } = await getClient().emails.send({ from, to, subject, html, text });
    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw:", error.message);
    return false;
  }
}

// Conservative email validation + normalization for server-side use.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return emailPattern.test(email) && email.length <= 254;
}
