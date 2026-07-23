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
  "partifulUrl",
  "eventStartDate",
  "eventEndDate",
  "eventIsRange",
  "unlockAt",
  "expiresAt",
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

    // Optional Partiful link: normalize + validate (empty is fine; a bad or
    // non-Partiful/unsafe URL is a 400 so we never store a junk/hostile link).
    const partifulUrl = normalizePartifulUrl(req.body.partifulUrl);
    if (partifulUrl === null) {
      return res.status(400).json({
        message: "Enter a valid Partiful link (e.g. https://partiful.com/e/...)."
      });
    }

    // Optional event date (single day or a range). Empty is fine; anything that
    // isn't a real YYYY-MM-DD, or an end before the start, is a 400.
    const eventStartDate = normalizeDateOnly(req.body.eventStartDate);
    const rawEnd = normalizeDateOnly(req.body.eventEndDate);
    if (eventStartDate === null || rawEnd === null) {
      return res.status(400).json({ message: "Enter a valid event date (YYYY-MM-DD)." });
    }
    const eventIsRange = Boolean(req.body.eventIsRange) && Boolean(eventStartDate) && Boolean(rawEnd);
    const eventEndDate = eventIsRange ? rawEnd : "";
    if (eventIsRange && eventEndDate < eventStartDate) {
      return res.status(400).json({ message: "The event end date must be on or after the start." });
    }

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
      partifulUrl,
      eventStartDate,
      eventEndDate,
      eventIsRange,
      unlockAt,
      expiresAt,
      wasScheduled,
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

// Returns "" for no link, a normalized https URL for a valid Partiful link, or
// null when the caller sent something that isn't a safe Partiful URL (so the
// route can 400). Guards the protocol so javascript:/data: links can't be stored.
export function normalizePartifulUrl(raw) {
  if (raw === undefined || raw === null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const isPartiful =
    host === "partiful.com" || host.endsWith(".partiful.com") || host === "prtf.co";
  if (!isPartiful) return null;

  // Store canonical https; drop any credentials/hash noise but keep the path/query.
  url.protocol = "https:";
  url.username = "";
  url.password = "";
  return url.toString();
}

// Returns "" for no date, the "YYYY-MM-DD" string for a real calendar date, or
// null when the caller sent something that isn't a valid date (so the route can
// 400). Rejects impossible dates like 2026-02-31 by round-tripping through Date.
export function normalizeDateOnly(raw) {
  if (raw === undefined || raw === null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  const roundTrips =
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d);

  return roundTrips ? trimmed : null;
}

function hashIp(ip = "") {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default router;
