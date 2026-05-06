import crypto from "node:crypto";
import { Router } from "express";
import { Invite } from "../models/Invite.js";

const router = Router();
const defaultExpirationHours = 24;

router.post("/", async (req, res, next) => {
  try {
    const unlockAt = req.body.unlockAt ? new Date(req.body.unlockAt) : new Date();

    if (Number.isNaN(unlockAt.getTime())) {
      return res.status(400).json({ message: "unlockAt must be a valid date" });
    }

    const expirationHours = Number(req.body.expirationHours) || defaultExpirationHours;
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
      permanentLink: req.body.permanentLink,
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

function hashIp(ip = "") {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default router;
