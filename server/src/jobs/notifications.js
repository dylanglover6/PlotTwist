import cron from "node-cron";
import { Invite } from "../models/Invite.js";
import { isEmailEnabled, sendEmail } from "../email/resend.js";
import { liveEmail, expiredEmail } from "../email/templates.js";

const batchLimit = 100;
let running = false;

// Atomically claim one notification slot so overlapping runs or a crash can
// never double-send: only the run that flips the flag from null wins. If the
// send then fails, we release the flag so the next sweep retries.
async function claimAndSend(invite, flag, build) {
  const claimed = await Invite.findOneAndUpdate(
    { _id: invite._id, [flag]: null },
    { $set: { [flag]: new Date() } },
    { new: true }
  );
  if (!claimed) return false;

  const { subject, html, text } = build(claimed, claimed.unsubToken);
  const ok = await sendEmail({ to: claimed.email, subject, html, text });
  if (!ok) {
    await Invite.updateOne({ _id: claimed._id }, { $set: { [flag]: null } });
  }
  return ok;
}

const confirmedRecipient = {
  email: { $ne: "" },
  emailConfirmedAt: { $ne: null },
  unsubscribedAt: null
};

// One sweep: send "is live" for scheduled invites that just unlocked, and
// "expired" for invites that just expired. Returns counts for logging/tests.
export async function runNotificationSweep(now = new Date()) {
  let live = 0;
  let expired = 0;

  const wentLive = await Invite.find({
    ...confirmedRecipient,
    wasScheduled: true,
    unlockAt: { $lte: now },
    expiresAt: { $gt: now }, // if already expired, let the expiry pass handle it
    liveEmailSentAt: null
  }).limit(batchLimit);
  for (const invite of wentLive) {
    if (await claimAndSend(invite, "liveEmailSentAt", liveEmail)) live += 1;
  }

  const didExpire = await Invite.find({
    ...confirmedRecipient,
    expiresAt: { $lte: now },
    expiredEmailSentAt: null
  }).limit(batchLimit);
  for (const invite of didExpire) {
    if (await claimAndSend(invite, "expiredEmailSentAt", expiredEmail)) expired += 1;
  }

  return { live, expired };
}

// Guarded wrapper so a slow sweep can't overlap the next tick.
export async function safeSweep() {
  if (running) return { skipped: true };
  running = true;
  try {
    return await runNotificationSweep();
  } catch (error) {
    console.error("[notifications] sweep failed:", error.message);
    return { error: true };
  } finally {
    running = false;
  }
}

// Runs the sweep every minute in-process. Only starts when email is configured;
// hosts that sleep idle instances should drive POST /api/tasks/notifications
// from an external cron instead.
export function startNotificationCron() {
  if (!isEmailEnabled()) {
    console.log("[notifications] email disabled — cron not started");
    return null;
  }
  console.log("[notifications] sweep cron started (every minute)");
  return cron.schedule("* * * * *", () => {
    safeSweep();
  });
}
