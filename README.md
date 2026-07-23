# Plot Twist

Plot Twist is a mobile-first MERN app for creating **temporary, scratch-to-reveal invite
links** — for trips, parties, concerts, and any plan that deserves a little drama. A host
builds a reveal page, picks when it unlocks, and shares one link; the recipient sees a
locked teaser and countdown, then scratches to reveal the surprise. The link expires and
the surprise is gone.

## Features

- 🎁 **Scratch-to-reveal** — a canvas overlay you swipe away, with the image blurring into
  focus and a full-screen confetti burst on reveal.
- ⏳ **Time-based lifecycle** — every invite is `locked` → `revealed` → `expired`, derived
  purely from `unlockAt` / `expiresAt` (never stored as state).
- 📆 **Event date** — optional single day or date range, shown on the reveal and folded
  into the calendar file.
- 🎉 **Partiful integration** — attach a Partiful event link and guests get an "RSVP on
  Partiful" button (validated server-side to a real `partiful.com` https URL).
- 📄 **More Information page** — an optional second page for details/itinerary plus the
  RSVP link, keeping the reveal itself minimal.
- 📅 **Add to calendar** — generates an `.ics` file (all-day for event dates, with the
  Partiful link attached).
- 🔎 **Image search** — pick a reveal photo from Unsplash, proxied and rate-limited
  server-side so the API key never reaches the browser.
- 📨 **Optional email updates** — the creator can opt in (double opt-in) to be emailed a
  confirmation, their link, and notes when the twist goes live and expires.
- 📱 **Native sharing** — Web Share API with a copy-to-clipboard fallback.
- 🎨 **Bold, mobile-first UI** — a dark, high-contrast "party invite" theme (Space Grotesk
  display type, gradient accents, glassy cards) that respects `prefers-reduced-motion`.
- ♿ **Accessibility-minded** — semantic landmarks, labeled form controls, keyboard
  navigation, visible focus states, and reduced-motion fallbacks.

## Tech stack

- **Client:** Vite, React 19, React Router 7, Tailwind CSS, lucide-react
- **Server:** Express 4, Mongoose 8 (MongoDB Atlas), Resend (email), node-cron
- **Tooling:** ESLint 9 (flat config), Prettier, Vitest

Structured as an npm-workspaces monorepo (`client` and `server`).

## Project structure

```
client/                 Vite + React SPA
  src/pages/            Landing, Create, Created, Reveal, MoreInfo
  src/components/       ScratchReveal, CountdownTimer, RevealImage, …
  src/utils/            getRevealState() and time helpers
server/
  src/routes/           invites, images, email (confirm/unsubscribe)
  src/email/            Resend client, templates, tokens
  src/jobs/             notification sweep (cron)
  src/models/Invite.js  Mongoose schema
deploy/                 Azure VM artifacts (systemd unit, runbook, env template)
```

## Getting started (local dev)

Requires **Node 20+** (developed on 22).

```bash
npm install
cp server/.env.example server/.env   # then fill in the values below
npm run dev
```

The React app runs on `http://localhost:5173` and proxies `/api` calls to the Express
server on `http://localhost:5050`. (Dev uses `5050` rather than `5000` because macOS's
AirPlay Receiver occupies `5000`; production sets `PORT` explicitly.)

### Environment variables (`server/.env`)

| Variable              | Required | Purpose                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `MONGODB_URI`         | yes      | MongoDB connection string (local `mongod` or Atlas).                     |
| `UNSPLASH_ACCESS_KEY` | optional | Enables image search; without it, search returns an empty result set.    |
| `RESEND_API_KEY`      | optional | Enables email updates; unset → email is a logged no-op, app still works. |
| `EMAIL_FROM`          | w/ email | Sender header, e.g. `Plot Twist <updates@yourdomain.com>`.               |
| `APP_URL`             | w/ email | Base URL used to build links inside emails (`http://localhost:5173`).    |

See [`server/.env.example`](server/.env.example) for the full list.

## Enabling email notifications (Resend)

Email is off until a Resend key is present. To turn it on:

1. Create a free account at [resend.com](https://resend.com) and make an **API key**
   (Dashboard → API Keys).
2. Pick a sender:
   - **Testing:** use `Plot Twist <onboarding@resend.dev>` (only sends to your own account
     email).
   - **Real use:** verify a domain (Dashboard → Domains) by adding its DKIM/SPF/DMARC
     records at your registrar — a subdomain like `send.yourdomain.com` is recommended —
     then send from `updates@send.yourdomain.com`.
3. Add to `server/.env` (or the production env), then restart:

   ```bash
   RESEND_API_KEY=re_your_key
   EMAIL_FROM=Plot Twist <updates@send.yourdomain.com>
   APP_URL=http://localhost:5173   # your public origin in production
   ```

4. Create an invite with your email, then confirm the link in your inbox. Scheduled
   invites get a "went live" email within ~a minute of unlocking, and an "expired" email
   after expiry (a `node-cron` sweep runs every minute).

Design and anti-abuse details (double opt-in, token security, rate limiting) are in
[`EMAIL_PLAN.md`](EMAIL_PLAN.md).

## Scripts

| Command              | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Run server + client together (watch mode).        |
| `npm run build`      | Build the client into `client/dist`.              |
| `npm start`          | Run the server (no watch).                        |
| `npm run start:prod` | Run in production mode (serves the built client). |
| `npm test`           | Run the Vitest suites (client + server).          |
| `npm run lint`       | ESLint across both workspaces.                    |
| `npm run format`     | Prettier write across the repo.                   |

## Testing

```bash
npm test
```

Covers the reveal-state boundaries (`getRevealState`), the email token/serializer logic,
and the notification sweep (confirmed-only gate, idempotency, retry-on-failure) against an
in-memory MongoDB.

## Routes

**Frontend**

| Path           | Page                                           |
| -------------- | ---------------------------------------------- |
| `/`            | Landing                                        |
| `/create`      | Create a Plot Twist                            |
| `/created/:id` | Share-link confirmation                        |
| `/t/:id`       | Recipient: locked countdown / reveal / expired |
| `/t/:id/more`  | Optional "more information" page               |

**Backend**

| Endpoint                         | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `GET  /api/health`               | Health check                                 |
| `POST /api/invites`              | Create an invite                             |
| `GET  /api/invites/:id`          | Fetch an invite (sensitive fields stripped)  |
| `GET  /api/images/search?query=` | Unsplash search proxy                        |
| `GET  /api/email/confirm`        | Double opt-in confirmation (from email link) |
| `GET  /api/email/unsubscribe`    | One-click unsubscribe (from email link)      |
| `POST /api/tasks/notifications`  | Protected notification sweep (external cron) |

## Deployment

Production runs as a single Node service (Express serves the built SPA **and** the API).
See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full plan and [`deploy/`](deploy/) for the
Azure VM artifacts (systemd unit, redeploy script, env template, runbook).

```bash
npm run build && npm run start:prod
```
