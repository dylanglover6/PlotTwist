import crypto from "node:crypto";

// Single-use email tokens. We generate a 256-bit random token, hand the
// plaintext to the recipient in the email link, and store only its SHA-256
// hash. Verification hashes the incoming token and compares in constant time.

export function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

// Constant-time comparison of a presented token against a stored hash.
export function tokenMatches(token, storedHash) {
  if (!token || !storedHash) return false;
  const presented = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(String(storedHash), "hex");
  if (presented.length !== stored.length) return false;
  return crypto.timingSafeEqual(presented, stored);
}
