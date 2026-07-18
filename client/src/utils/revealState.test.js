import { afterEach, describe, expect, it, vi } from "vitest";
import { getRevealState } from "./revealState.js";

// Server-authored timestamps (ISO strings, as they arrive over JSON).
const UNLOCK_ISO = "2026-01-01T12:00:00.000Z";
const EXPIRES_ISO = "2026-01-02T12:00:00.000Z"; // unlock + 24h
const unlockMs = Date.parse(UNLOCK_ISO);
const expiresMs = Date.parse(EXPIRES_ISO);

const invite = { unlockAt: UNLOCK_ISO, expiresAt: EXPIRES_ISO };

// `now` is passed as a Date, matching how RevealPage calls getRevealState.
const at = (ms) => new Date(ms);

afterEach(() => {
  vi.useRealTimers();
});

describe("getRevealState — unlock boundary", () => {
  it("is locked just before unlockAt", () => {
    expect(getRevealState(invite, at(unlockMs - 1)).status).toBe("locked");
  });

  it("is revealed exactly at unlockAt (inclusive lower bound)", () => {
    expect(getRevealState(invite, at(unlockMs)).status).toBe("revealed");
  });

  it("is revealed just after unlockAt", () => {
    expect(getRevealState(invite, at(unlockMs + 1)).status).toBe("revealed");
  });
});

describe("getRevealState — expiry boundary", () => {
  it("is revealed just before expiresAt", () => {
    expect(getRevealState(invite, at(expiresMs - 1)).status).toBe("revealed");
  });

  it("is revealed exactly at expiresAt (inclusive upper bound)", () => {
    expect(getRevealState(invite, at(expiresMs)).status).toBe("revealed");
  });

  it("is expired just after expiresAt", () => {
    expect(getRevealState(invite, at(expiresMs + 1)).status).toBe("expired");
  });
});

describe("getRevealState — well outside the window", () => {
  it("is locked long before unlock", () => {
    expect(getRevealState(invite, at(unlockMs - 60 * 60 * 1000)).status).toBe("locked");
  });

  it("is expired long after expiry", () => {
    expect(getRevealState(invite, at(expiresMs + 60 * 60 * 1000)).status).toBe("expired");
  });
});

describe("getRevealState — invalid input", () => {
  it("is invalid when unlockAt cannot be parsed", () => {
    expect(getRevealState({ unlockAt: "not-a-date", expiresAt: EXPIRES_ISO }).status).toBe(
      "invalid"
    );
  });

  it("is invalid when expiresAt cannot be parsed", () => {
    expect(getRevealState({ unlockAt: UNLOCK_ISO, expiresAt: "nope" }).status).toBe("invalid");
  });

  it("returns unlockAt/expiresAt as Date objects for valid invites", () => {
    const result = getRevealState(invite, at(unlockMs));
    expect(result.unlockAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.unlockAt.getTime()).toBe(unlockMs);
  });
});

describe("getRevealState — derives from server timestamps, not the client clock", () => {
  it("ignores the ambient system clock when `now` is supplied", () => {
    // Freeze the real wall clock to a time far in the future (as if the
    // viewer's device clock were badly wrong).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T00:00:00.000Z"));

    // With an explicit `now` inside the window, the result must follow the
    // invite's server timestamps + the injected now — NOT Date.now().
    expect(getRevealState(invite, at(unlockMs + 1000)).status).toBe("revealed");
    // And a `now` before unlock is still locked despite the future system clock.
    expect(getRevealState(invite, at(unlockMs - 1000)).status).toBe("locked");
  });

  it("two viewers at different reference times see different states for the same invite", () => {
    const early = getRevealState(invite, at(unlockMs - 1000));
    const during = getRevealState(invite, at(unlockMs + 1000));
    const late = getRevealState(invite, at(expiresMs + 1000));
    expect([early.status, during.status, late.status]).toEqual(["locked", "revealed", "expired"]);
  });
});
