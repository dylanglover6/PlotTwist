import crypto from "node:crypto";
import { Router } from "express";
import { Invite } from "../models/Invite.js";

const router = Router();
const defaultExpirationHours = 24;
const maxExpirationHours = 24 * 30; // Reveal links are temporary: cap at 30 days.

router.post("/", async (req, res, next) => {
  try {
    const unlockAt = req.body.unlockAt ? new Date(req.body.unlockAt) : new Date();

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

    const invite = await Invite.create({
      hostName: req.body.hostName,
      teaserMessage: req.body.teaserMessage,
      revealTitle: req.body.revealTitle,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      imageAlt: req.body.imageAlt,
      unlockAt,
      expiresAt,
      moreInfoEnabled: Boolean(req.body.moreInfoEnabled),
      moreInfoTitle: req.body.moreInfoTitle,
      moreInfoDescription: req.body.moreInfoDescription,
      creatorIpHash: hashIp(req.ip)
    });

    res.status(201).json(invite);
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

    res.json(invite);
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
