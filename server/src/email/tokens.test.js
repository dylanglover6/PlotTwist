import { describe, expect, it } from "vitest";
import { createToken, hashToken, tokenMatches } from "./tokens.js";

describe("email tokens", () => {
  it("creates a random token with its matching hash", () => {
    const a = createToken();
    const b = createToken();
    expect(a.token).toHaveLength(64); // 32 bytes hex
    expect(a.token).not.toBe(b.token); // random
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toBe(a.token); // stored value is the hash, not the token
  });

  it("matches a token against its stored hash", () => {
    const { token, hash } = createToken();
    expect(tokenMatches(token, hash)).toBe(true);
  });

  it("rejects a wrong or empty token", () => {
    const { hash } = createToken();
    expect(tokenMatches(createToken().token, hash)).toBe(false);
    expect(tokenMatches("", hash)).toBe(false);
    expect(tokenMatches("abc", hash)).toBe(false);
    expect(tokenMatches("deadbeef", "")).toBe(false);
  });
});
