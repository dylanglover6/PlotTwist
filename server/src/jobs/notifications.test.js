import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mock the mailer so no real email is sent and we can assert on calls.
const sendEmail = vi.fn().mockResolvedValue(true);
vi.mock("../email/resend.js", () => ({
  isEmailEnabled: () => true,
  sendEmail: (...args) => sendEmail(...args)
}));

const { Invite } = await import("../models/Invite.js");
const { runNotificationSweep } = await import("./notifications.js");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Invite.deleteMany({});
  sendEmail.mockClear();
});

const HOUR = 60 * 60 * 1000;

// A confirmed, opted-in, scheduled invite that unlocked an hour ago and is
// still within its window.
function confirmedLiveInvite(overrides = {}) {
  const now = Date.now();
  return {
    hostName: "Dylan",
    teaserMessage: "surprise",
    revealTitle: "Tokyo",
    unlockAt: new Date(now - HOUR),
    expiresAt: new Date(now + HOUR),
    wasScheduled: true,
    email: "creator@example.com",
    emailConfirmedAt: new Date(now - 2 * HOUR),
    unsubToken: "unsub-token",
    ...overrides
  };
}

describe("notification sweep", () => {
  it("sends the live email to a confirmed scheduled invite that unlocked", async () => {
    await Invite.create(confirmedLiveInvite());
    const result = await runNotificationSweep();
    expect(result.live).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe("creator@example.com");
    const doc = await Invite.findOne();
    expect(doc.liveEmailSentAt).toBeInstanceOf(Date);
  });

  it("never emails an unconfirmed address (double opt-in gate)", async () => {
    await Invite.create(confirmedLiveInvite({ emailConfirmedAt: null }));
    const result = await runNotificationSweep();
    expect(result.live).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never emails an unsubscribed recipient", async () => {
    await Invite.create(confirmedLiveInvite({ unsubscribedAt: new Date() }));
    const result = await runNotificationSweep();
    expect(result.live).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not send the live email twice across sweeps (idempotent)", async () => {
    await Invite.create(confirmedLiveInvite());
    await runNotificationSweep();
    sendEmail.mockClear();
    const second = await runNotificationSweep();
    expect(second.live).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips the live email for a non-scheduled (unlock-now) invite", async () => {
    await Invite.create(confirmedLiveInvite({ wasScheduled: false }));
    const result = await runNotificationSweep();
    expect(result.live).toBe(0);
  });

  it("sends expired (not live) for an invite past its expiry", async () => {
    const now = Date.now();
    await Invite.create(
      confirmedLiveInvite({
        unlockAt: new Date(now - 3 * HOUR),
        expiresAt: new Date(now - HOUR)
      })
    );
    const result = await runNotificationSweep();
    expect(result.expired).toBe(1);
    expect(result.live).toBe(0);
    const doc = await Invite.findOne();
    expect(doc.expiredEmailSentAt).toBeInstanceOf(Date);
  });

  it("releases the flag so a failed send retries next sweep", async () => {
    await Invite.create(confirmedLiveInvite());
    sendEmail.mockResolvedValueOnce(false); // first attempt fails
    const first = await runNotificationSweep();
    expect(first.live).toBe(0);
    expect((await Invite.findOne()).liveEmailSentAt).toBeNull(); // released
    const second = await runNotificationSweep(); // retries and succeeds
    expect(second.live).toBe(1);
  });
});
