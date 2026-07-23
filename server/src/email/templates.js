// Email templates. Each builder returns { subject, html, text }.
// Links are built from APP_URL so they work in any environment.

function appUrl() {
  return (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function revealUrl(id) {
  return `${appUrl()}/t/${id}`;
}

export function confirmUrl(id, token) {
  return `${appUrl()}/api/email/confirm?id=${id}&token=${token}`;
}

export function unsubscribeUrl(id, token) {
  return `${appUrl()}/api/email/unsubscribe?id=${id}&token=${token}`;
}

function fmt(date) {
  try {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return "";
  }
}

// Shared shell — inline styles only, safe across email clients.
function layout({ preheader, heading, bodyHtml, footerHtml = "" }) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4ede2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#171225;">
    <span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em;margin-bottom:24px;">
        <span style="display:inline-block;width:26px;height:26px;background:#111827;border-radius:8px;vertical-align:middle;text-align:center;line-height:26px;color:#f97316;">✦</span>
        <span style="vertical-align:middle;margin-left:6px;">Plot Twist</span>
      </div>
      <div style="background:#ffffff;border:1px solid #ece1d2;border-radius:20px;padding:28px 26px;">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.2;letter-spacing:-0.02em;">${heading}</h1>
        ${bodyHtml}
      </div>
      <div style="color:#6c6478;font-size:12px;line-height:1.6;margin-top:20px;text-align:center;">
        ${footerHtml}
        <div style="margin-top:8px;">Plot Twist — surprise reveal invites.</div>
      </div>
    </div>
  </body>
</html>`;
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#f97316;color:#111827;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">${label}</a>`;
}

// Optional "RSVP on Partiful" line, shown only when the invite has a link.
// The URL was validated + normalized to https at creation time.
function partifulLine(invite) {
  if (!invite.partifulUrl) return "";
  return `<p style="margin:16px 0 0;">
    <a href="${invite.partifulUrl}" style="color:#e8620f;font-weight:600;text-decoration:none;">RSVP on Partiful →</a>
  </p>`;
}

function unsubFooter(id, unsubToken) {
  return `You're receiving this because this address was added to a Plot Twist.
    <a href="${unsubscribeUrl(id, unsubToken)}" style="color:#6c6478;">Unsubscribe</a>.`;
}

// 1. Confirmation prompt — intentionally contains no reveal link or invite
// content, so a mistyped/malicious address gets one harmless, ignorable email.
export function confirmationEmail(invite, confirmToken) {
  const url = confirmUrl(invite._id, confirmToken);
  return {
    subject: "Confirm your Plot Twist updates",
    text: `Someone added this address to receive updates about a Plot Twist.

Confirm to get updates (your share link, plus a note when it goes live and when it expires):
${url}

If this wasn't you, you can safely ignore this email — no further messages will be sent.`,
    html: layout({
      preheader: "Confirm to receive updates about your Plot Twist.",
      heading: "Confirm your updates",
      bodyHtml: `
        <p style="margin:0 0 16px;color:#4a4458;line-height:1.6;">
          Someone added this address to receive updates about a Plot Twist. Confirm to
          get your share link and a heads-up when it goes live and when it expires.
        </p>
        <p style="margin:0 0 22px;">${button(url, "Confirm updates")}</p>
        <p style="margin:0;color:#6c6478;font-size:13px;line-height:1.6;">
          If this wasn't you, just ignore this email — no further messages will be sent.
        </p>`
    })
  };
}

// 2. Confirmed — now safe to include the reveal link + unsubscribe.
export function confirmedEmail(invite, unsubToken) {
  const link = revealUrl(invite.shareId);
  const scheduled =
    new Date(invite.unlockAt).getTime() > new Date(invite.createdAt || Date.now()).getTime();
  return {
    subject: "You're all set — here's your Plot Twist link",
    text: `You're confirmed. Here's your share link:
${link}

${scheduled ? `It goes live ${fmt(invite.unlockAt)}. ` : ""}It expires ${fmt(invite.expiresAt)}.
${scheduled ? "We'll email you when it goes live and " : "We'll email you "}when it expires.
${invite.partifulUrl ? `\nRSVP on Partiful: ${invite.partifulUrl}\n` : ""}
Unsubscribe: ${unsubscribeUrl(invite._id, unsubToken)}`,
    html: layout({
      preheader: "You're confirmed — here's your Plot Twist share link.",
      heading: "You're all set",
      bodyHtml: `
        <p style="margin:0 0 16px;color:#4a4458;line-height:1.6;">Here's your share link:</p>
        <p style="margin:0 0 18px;word-break:break-all;">
          <a href="${link}" style="color:#e8620f;font-weight:600;">${link}</a>
        </p>
        <p style="margin:0 0 20px;color:#4a4458;line-height:1.6;">
          ${scheduled ? `It goes live <strong>${fmt(invite.unlockAt)}</strong>. ` : ""}
          It expires <strong>${fmt(invite.expiresAt)}</strong>.
          ${scheduled ? "We'll email you when it goes live and when it expires." : "We'll email you when it expires."}
        </p>
        <p style="margin:0;">${button(link, "Open your reveal page")}</p>
        ${partifulLine(invite)}`,
      footerHtml: unsubFooter(invite._id, unsubToken)
    })
  };
}

// 3. Went live (scheduled invites only).
export function liveEmail(invite, unsubToken) {
  const link = revealUrl(invite.shareId);
  return {
    subject: "Your Plot Twist is live 🎉",
    text: `Your Plot Twist "${invite.revealTitle}" is now live — recipients can reveal it.

${link}

It expires ${fmt(invite.expiresAt)}.
${invite.partifulUrl ? `\nRSVP on Partiful: ${invite.partifulUrl}\n` : ""}
Unsubscribe: ${unsubscribeUrl(invite._id, unsubToken)}`,
    html: layout({
      preheader: "Your Plot Twist just went live.",
      heading: "It's live 🎉",
      bodyHtml: `
        <p style="margin:0 0 16px;color:#4a4458;line-height:1.6;">
          Your Plot Twist <strong>"${invite.revealTitle}"</strong> is now live — anyone with
          the link can reveal it. It expires <strong>${fmt(invite.expiresAt)}</strong>.
        </p>
        <p style="margin:0;">${button(link, "Open your reveal page")}</p>
        ${partifulLine(invite)}`,
      footerHtml: unsubFooter(invite._id, unsubToken)
    })
  };
}

// 4. Expired.
export function expiredEmail(invite, unsubToken) {
  return {
    subject: "Your Plot Twist has expired",
    text: `Your Plot Twist "${invite.revealTitle}" has expired and is no longer viewable.

Create another anytime at ${appUrl()}/create

Unsubscribe: ${unsubscribeUrl(invite._id, unsubToken)}`,
    html: layout({
      preheader: "Your Plot Twist has expired.",
      heading: "That twist has expired",
      bodyHtml: `
        <p style="margin:0 0 20px;color:#4a4458;line-height:1.6;">
          Your Plot Twist <strong>"${invite.revealTitle}"</strong> has expired and is no
          longer viewable. Thanks for the drama.
        </p>
        <p style="margin:0;">${button(`${appUrl()}/create`, "Create another")}</p>`,
      footerHtml: unsubFooter(invite._id, unsubToken)
    })
  };
}
