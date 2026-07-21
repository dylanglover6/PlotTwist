# Email Notifications

How Plot Twist's optional creator email updates work — the messages, the
scheduling model, and the security/anti-abuse design.

Optional email updates for the **creator** of a Plot Twist. Providing an email
is never required; it's a convenience for people who want to be told when things
happen to their invite.

## The emails

| #   | Email                                       | When it fires                                                     |
| --- | ------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **Confirmation** ("confirm to get updates") | Immediately on create, if an email was provided                   |
| 2   | **Confirmed + your link**                   | When the creator clicks the confirmation link                     |
| 3   | **"Your Plot Twist is live"**               | At `unlockAt` — only for **scheduled** invites, only if confirmed |
| 4   | **"Your Plot Twist expired"**               | At `expiresAt` — only if confirmed                                |

> The link is delivered **after confirmation** (email 2), not in the first
> email — see the anti-abuse note below. The creator also always sees the link
> on-screen on the confirmation page, so nothing is gated behind email.

## Why double opt-in (confirmed opt-in)

The email address is typed by whoever fills the form, so someone could enter a
**stranger's** address. To prevent using Plot Twist as a spam/harassment relay:

- The **first** email is only a confirmation prompt — it contains **no reveal
  link and no invite content**, just "someone added this address to a Plot
  Twist; confirm to receive updates, or ignore this."
- The recurring notifications (live / expired) and the link email are sent
  **only after the address is confirmed**.
- Net effect: a mistyped or malicious address receives **at most one** generic,
  ignorable email, and never any invite content.

## Architecture

Two building blocks:

1. **Sending** — [Resend](https://resend.com) via its Node SDK. If
   `RESEND_API_KEY` is unset, all email is a logged no-op, so the app still runs
   locally without email configured (same pattern as the Unsplash proxy).
2. **Time-based firing** — emails 3 and 4 fire long after any request, so a
   small **polling sweep** runs on a schedule (`node-cron`, in-process):

   ```
   every minute:
     invites where email confirmed AND scheduled AND unlockAt <= now
       AND liveEmailSentAt is null   → send "is live",  set liveEmailSentAt
     invites where email confirmed AND expiresAt <= now
       AND expiredEmailSentAt is null → send "expired", set expiredEmailSentAt
   ```

   State lives in MongoDB (already there), so the sweep is **idempotent** and
   **restart-safe**: the `...SentAt` writes are guarded atomic updates, so a
   crash or overlapping run never double-sends. Minute-level latency is
   invisible for these notifications.

   A protected `POST /api/tasks/notifications` endpoint (guarded by
   `TASKS_SECRET`) runs the same sweep, so a host that sleeps idle instances can
   drive it from an **external cron** instead of the in-process timer.

## Data model additions (`Invite`)

| Field                                    | Purpose                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `email`                                  | Normalized (lowercased) creator email, or `""`                                    |
| `emailConfirmTokenHash`                  | SHA-256 of the single-use confirm token (plaintext only ever in the emailed link) |
| `emailConfirmExpiresAt`                  | Confirm link expiry (min of now+24h and `expiresAt`)                              |
| `emailConfirmedAt`                       | Set when confirmed; gates all recurring sends                                     |
| `unsubToken`                             | Reusable unsubscribe token; low-sensitivity plaintext, never exposed by the API   |
| `unsubscribedAt`                         | Set on unsubscribe; stops all sends                                               |
| `liveEmailSentAt` / `expiredEmailSentAt` | Idempotency flags for the sweep                                                   |

## Security & anti-abuse features

- **Double opt-in** (above) — the core anti-spam control.
- **No PII leakage** — `GET /api/invites/:id` and the create response are run
  through a whitelist serializer, so `email`, all tokens, the send flags, and
  `creatorIpHash` are **never** returned to clients. (This also fixes a
  pre-existing leak of `creatorIpHash` in the public GET.)
- **Cryptographic tokens** — 256-bit random tokens. The confirm token is
  single-use and expiring, and only its SHA-256 hash is stored. The
  reusable unsubscribe token is stored as low-sensitivity plaintext. Both are
  compared in constant time.
- **Unsubscribe** — every notification email carries a one-click unsubscribe
  link that clears the address and stops all further mail.
- **Rate limiting** — `express-rate-limit` on invite creation (per IP) and on
  the confirm/unsubscribe endpoints, so the feature can't be used to blast mail.
  `trust proxy` is set in production so limits key off the real client IP.
- **Server-side validation** — email format validated and normalized on the
  server, not just the client.
- **Graceful degradation** — with no Resend key, invites still work; email is
  skipped and logged.

## Environment variables

| Var              | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Resend API key. Unset → email disabled (logged no-op).                    |
| `EMAIL_FROM`     | From header, e.g. `Plot Twist <updates@yourdomain.com>`.                  |
| `APP_URL`        | Public base URL used to build confirm/unsubscribe/reveal links in emails. |
| `TASKS_SECRET`   | Shared secret for the external-cron sweep endpoint.                       |

## Cost

- **Resend:** free tier (3,000 emails/mo, 100/day) — $0 at this app's volume.
- **Scheduler:** in-process `node-cron` — $0.
- **Sending domain (recommended for deliverability):** ~$10–15/year; until then,
  Resend's `onboarding@resend.dev` works for testing.
- Only reaches paid tiers at tens of thousands of emails/month.

## Deployment note

The in-process cron only fires while the Node process is awake. On hosts that
**sleep** idle free instances, drive the sweep from an external cron hitting
`POST /api/tasks/notifications` with the `TASKS_SECRET`, or deploy somewhere
always-on.
