import crypto from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { Invite } from "../models/Invite.js";
import { tokenMatches } from "../email/tokens.js";
import { sendEmail } from "../email/resend.js";
import { confirmedEmail } from "../email/templates.js";

const router = Router();

// Confirm/unsubscribe links are clicked from email; limit to blunt any
// brute-forcing (tokens are 256-bit, so this is belt-and-suspenders).
const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false
});

router.get("/confirm", actionLimiter, async (req, res, next) => {
  try {
    const { id, token } = req.query;
    const invite = await findInvite(id);

    if (!invite || !token) {
      return sendPage(
        res,
        400,
        "Link not valid",
        "This confirmation link is missing or incorrect."
      );
    }
    if (invite.emailConfirmedAt) {
      return sendPage(
        res,
        200,
        "Already confirmed",
        "You're all set — you'll get updates about this Plot Twist."
      );
    }
    const expired =
      !invite.emailConfirmExpiresAt || invite.emailConfirmExpiresAt.getTime() < Date.now();
    if (
      !invite.emailConfirmTokenHash ||
      expired ||
      !tokenMatches(token, invite.emailConfirmTokenHash)
    ) {
      return sendPage(
        res,
        400,
        "Link expired",
        "This confirmation link has expired or already been used."
      );
    }

    invite.emailConfirmedAt = new Date();
    invite.emailConfirmTokenHash = ""; // single use
    await invite.save();

    const { subject, html, text } = confirmedEmail(invite, invite.unsubToken);
    sendEmail({ to: invite.email, subject, html, text }).catch(() => {});

    return sendPage(
      res,
      200,
      "You're confirmed 🎉",
      "We'll email you when your Plot Twist goes live and when it expires. Check your inbox for your share link."
    );
  } catch (error) {
    next(error);
  }
});

router.get("/unsubscribe", actionLimiter, async (req, res, next) => {
  try {
    const { id, token } = req.query;
    const invite = await findInvite(id);

    if (!invite || !token || !constantEquals(token, invite.unsubToken)) {
      return sendPage(res, 400, "Link not valid", "This unsubscribe link is missing or incorrect.");
    }

    if (!invite.unsubscribedAt) {
      invite.email = "";
      invite.emailConfirmedAt = null;
      invite.emailConfirmTokenHash = "";
      invite.unsubscribedAt = new Date();
      await invite.save();
    }

    return sendPage(
      res,
      200,
      "Unsubscribed",
      "You won't receive any more emails about this Plot Twist."
    );
  } catch (error) {
    next(error);
  }
});

async function findInvite(id) {
  if (!id || !mongoose.isValidObjectId(id)) return null;
  return Invite.findById(id);
}

function constantEquals(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Minimal branded HTML response for links opened from an email.
function sendPage(res, status, heading, message) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading} — Plot Twist</title>
    <style>
      body { margin:0; min-height:100vh; display:grid; place-items:center;
        background:#0c1020; color:#f4eee4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:24px; }
      .card { max-width:420px; text-align:center; background:#151b30; border:1px solid rgba(255,255,255,0.1);
        border-radius:22px; padding:34px 28px; }
      .mark { width:44px; height:44px; border-radius:13px; background:#f97316; color:#111827;
        display:grid; place-items:center; font-size:22px; margin:0 auto 18px; }
      h1 { margin:0 0 10px; font-size:22px; letter-spacing:-0.02em; }
      p { margin:0 0 20px; color:#9aa1bd; line-height:1.6; }
      a { display:inline-block; background:#f97316; color:#111827; font-weight:700; text-decoration:none;
        padding:11px 20px; border-radius:12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark">✦</div>
      <h1>${heading}</h1>
      <p>${message}</p>
      <a href="${(process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "")}/create">Create a Plot Twist</a>
    </div>
  </body>
</html>`;
  res.status(status).type("html").send(html);
}

export default router;
