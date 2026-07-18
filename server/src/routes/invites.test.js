import { describe, expect, it } from "vitest";
import { toPublicInvite } from "./invites.js";

// A full invite doc as stored, including all the sensitive fields.
function fullInvite(overrides = {}) {
  return {
    _id: "abc123",
    hostName: "Dylan",
    teaserMessage: "A surprise",
    revealTitle: "Tokyo!",
    description: "Pack a bag",
    imageUrl: "https://img",
    imageAlt: "alt",
    unlockAt: new Date("2026-01-01T12:00:00Z"),
    expiresAt: new Date("2026-01-02T12:00:00Z"),
    moreInfoEnabled: false,
    moreInfoTitle: "",
    moreInfoDescription: "",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    // sensitive — must never be exposed
    email: "creator@example.com",
    emailConfirmTokenHash: "hash",
    emailConfirmExpiresAt: new Date(),
    emailConfirmedAt: null,
    unsubToken: "secret-unsub",
    unsubscribedAt: null,
    liveEmailSentAt: null,
    expiredEmailSentAt: null,
    creatorIpHash: "iphash",
    wasScheduled: true,
    ...overrides
  };
}

const SENSITIVE = [
  "email",
  "emailConfirmTokenHash",
  "emailConfirmExpiresAt",
  "emailConfirmedAt",
  "unsubToken",
  "unsubscribedAt",
  "liveEmailSentAt",
  "expiredEmailSentAt",
  "creatorIpHash",
  "wasScheduled"
];

describe("toPublicInvite", () => {
  it("never leaks sensitive fields", () => {
    const out = toPublicInvite(fullInvite());
    for (const key of SENSITIVE) {
      expect(out).not.toHaveProperty(key);
    }
  });

  it("keeps the fields the client needs", () => {
    const out = toPublicInvite(fullInvite());
    expect(out.revealTitle).toBe("Tokyo!");
    expect(out.hostName).toBe("Dylan");
    expect(out.imageUrl).toBe("https://img");
    expect(out.unlockAt).toBeInstanceOf(Date);
  });

  it("flags emailPending only while an unconfirmed, non-unsubscribed email is set", () => {
    expect(toPublicInvite(fullInvite()).emailPending).toBe(true);
    expect(toPublicInvite(fullInvite({ email: "" })).emailPending).toBe(false);
    expect(toPublicInvite(fullInvite({ emailConfirmedAt: new Date() })).emailPending).toBe(false);
    expect(toPublicInvite(fullInvite({ unsubscribedAt: new Date() })).emailPending).toBe(false);
  });

  it("supports Mongoose docs via toObject()", () => {
    const doc = fullInvite();
    const asMongoose = { toObject: () => doc };
    const out = toPublicInvite(asMongoose);
    expect(out).not.toHaveProperty("email");
    expect(out.revealTitle).toBe("Tokyo!");
  });
});
