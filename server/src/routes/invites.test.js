import { describe, expect, it } from "vitest";
import { normalizeDateOnly, normalizePartifulUrl, toPublicInvite } from "./invites.js";

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

  it("exposes partifulUrl when present", () => {
    const out = toPublicInvite(fullInvite({ partifulUrl: "https://partiful.com/e/abc" }));
    expect(out.partifulUrl).toBe("https://partiful.com/e/abc");
  });

  it("exposes event date fields when present", () => {
    const out = toPublicInvite(
      fullInvite({ eventStartDate: "2026-08-01", eventEndDate: "2026-08-03", eventIsRange: true })
    );
    expect(out.eventStartDate).toBe("2026-08-01");
    expect(out.eventEndDate).toBe("2026-08-03");
    expect(out.eventIsRange).toBe(true);
  });
});

describe("normalizeDateOnly", () => {
  it("treats missing/empty input as no date", () => {
    expect(normalizeDateOnly(undefined)).toBe("");
    expect(normalizeDateOnly(null)).toBe("");
    expect(normalizeDateOnly("  ")).toBe("");
  });

  it("accepts real calendar dates", () => {
    expect(normalizeDateOnly("2026-08-01")).toBe("2026-08-01");
    expect(normalizeDateOnly("2026-12-31")).toBe("2026-12-31");
  });

  it("rejects malformed strings and impossible dates as null", () => {
    expect(normalizeDateOnly("2026-02-31")).toBeNull();
    expect(normalizeDateOnly("2026-13-01")).toBeNull();
    expect(normalizeDateOnly("08/01/2026")).toBeNull();
    expect(normalizeDateOnly("tomorrow")).toBeNull();
  });
});

describe("normalizePartifulUrl", () => {
  it("treats missing/empty input as no link", () => {
    expect(normalizePartifulUrl(undefined)).toBe("");
    expect(normalizePartifulUrl(null)).toBe("");
    expect(normalizePartifulUrl("   ")).toBe("");
  });

  it("accepts partiful.com and prtf.co links, normalized to https", () => {
    expect(normalizePartifulUrl("https://partiful.com/e/abc123")).toBe(
      "https://partiful.com/e/abc123"
    );
    expect(normalizePartifulUrl("http://partiful.com/e/abc123")).toBe(
      "https://partiful.com/e/abc123"
    );
    expect(normalizePartifulUrl("https://www.partiful.com/e/x")).toBe(
      "https://www.partiful.com/e/x"
    );
    expect(normalizePartifulUrl("https://prtf.co/abc")).toBe("https://prtf.co/abc");
  });

  it("strips embedded credentials", () => {
    expect(normalizePartifulUrl("https://user:pass@partiful.com/e/abc")).toBe(
      "https://partiful.com/e/abc"
    );
  });

  it("rejects non-Partiful hosts, unsafe protocols, and garbage as null", () => {
    expect(normalizePartifulUrl("https://evil.com/e/abc")).toBeNull();
    expect(normalizePartifulUrl("https://partiful.com.evil.com/e/abc")).toBeNull();
    expect(normalizePartifulUrl("javascript:alert(1)")).toBeNull();
    expect(normalizePartifulUrl("not a url")).toBeNull();
  });
});
