import crypto from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Invite } from "../models/Invite.js";
import { createToken } from "../email/tokens.js";
import { isValidEmail, normalizeEmail, sendEmail } from "../email/resend.js";
import { confirmationEmail } from "../email/templates.js";

const router = Router();
const defaultExpirationHours = 24;
const maxExpirationHours = 24 * 30; // Reveal links are temporary: cap at 30 days.
const confirmWindowMs = 24 * 60 * 60 * 1000;

// Whitelist of fields safe to return to any client. Everything else — email,
// tokens, send flags, creatorIpHash — stays server-side only.
const publicFields = [
  "_id",
  "hostName",
  "teaserMessage",
  "revealTitle",
  "description",
  "imageUrl",
  "imageAlt",
  "unlockAt",
  "expiresAt",
  "moreInfoEnabled",
  "moreInfoTitle",
  "moreInfoDescription",
  "createdAt",
  "updatedAt"
];

export function toPublicInvite(doc) {
  const source = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const out = {};
  for (const key of publicFields) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  // Signal (without leaking the address) whether email updates are pending.
  out.emailPending = Boolean(source.email && !source.emailConfirmedAt && !source.unsubscribedAt);
  return out;
}

// Limit invite creation per IP so the email path can't be used to blast mail.
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many invites created from this device. Try again later." }
});

router.post("/", createLimiter, async (req, res, next) => {
  try {
    const now = new Date();
    const unlockAt = req.body.unlockAt ? new Date(req.body.unlockAt) : now;

    if (Number.isNaN(unlockAt.getTime())) {
      return res.status(400).json({ message: "unlockAt must be a valid date" });
    }

    const expirationHours = resolveExpirationHours(req.body.expirationHours);

    if (expirationHours === null) {
      return res.status(400).json({
        message: `expirationHours must be a number between 1 and ${maxExpirationHours}`
      });
    }

    const expiresAt = new Date(unlockAt.getTime() + expirationHours * 60 * 60 * 1000);
    const wasScheduled = unlockAt.getTime() > now.getTime() + 1000;

    // Optional creator email: validate server-side and set up double opt-in.
    let emailData = {};
    let confirmToken = null;
    const email = normalizeEmail(req.body.email);
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }
      const confirm = createToken();
      confirmToken = confirm.token;
      const unsub = createToken();
      emailData = {
        email,
        emailConfirmTokenHash: confirm.hash,
        emailConfirmExpiresAt: new Date(
          Math.min(now.getTime() + confirmWindowMs, expiresAt.getTime())
        ),
        unsubToken: unsub.token
      };
    }

    const invite = await Invite.create({
      hostName: req.body.hostName,
      teaserMessage: req.body.teaserMessage,
      revealTitle: req.body.revealTitle,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      imageAlt: req.body.imageAlt,
      unlockAt,
      expiresAt,
      wasScheduled,
      moreInfoEnabled: Boolean(req.body.moreInfoEnabled),
      moreInfoTitle: req.body.moreInfoTitle,
      moreInfoDescription: req.body.moreInfoDescription,
      creatorIpHash: hashIp(req.ip),
      ...emailData
    });

    // Fire the confirmation email but never fail invite creation over it.
    if (confirmToken) {
      const { subject, html, text } = confirmationEmail(invite, confirmToken);
      sendEmail({ to: invite.email, subject, html, text }).catch(() => {});
    }

    res.status(201).json(toPublicInvite(invite));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const invite = await Invite.findById(req.params.id).lean();

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    res.json(toPublicInvite(invite));
  } catch (error) {
    next(error);
  }
});

// Returns a valid expiration window in hours, the default when none was sent,
// or null when the caller sent something invalid (so the route can 400).
function resolveExpirationHours(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return defaultExpirationHours;
  }

  const hours = Number(raw);

  if (!Number.isFinite(hours) || hours <= 0 || hours > maxExpirationHours) {
    return null;
  }

  return hours;
}

function hashIp(ip = "") {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default router;
