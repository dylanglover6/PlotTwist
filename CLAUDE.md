# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Plot Twist is a mobile-first MERN app for creating temporary "surprise reveal" invite links. A host creates an invite that stays locked until `unlockAt`, becomes revealable between `unlockAt` and `expiresAt`, then permanently expires. Recipients open a link at `/t/:id` and see a locked countdown, the reveal, or an expired notice depending on the current time.

## Commands

Run all commands from the repo root. This is an npm workspaces monorepo (`client`, `server`).

```bash
npm install            # installs deps for root + both workspaces
npm run dev            # runs server (nodemon) + client (vite) concurrently
npm run dev:server     # server only, http://localhost:5000
npm run dev:client     # client only, http://localhost:5173
npm run build          # production build of the client
npm run start          # run the server with node (no watch)
npm run start:prod     # production mode: serve the built client + API from one process
npm run lint           # ESLint across both workspaces
npm run format         # Prettier --write across the repo
npm test               # Vitest — client + server suites
```

Run a single test file with `npm test --workspace client -- src/utils/revealState.test.js` (server suites live under `server/src/**/*.test.js`).

Linting is flat-config ESLint 9 ([eslint.config.js](eslint.config.js)); formatting is Prettier ([.prettierrc.json](.prettierrc.json)). Tests use Vitest and are colocated as `*.test.js` in both workspaces; the server suites run against an in-memory MongoDB.

Before running the server, create `server/.env` from `server/.env.example` and set `MONGODB_URI` (MongoDB Atlas or local). `UNSPLASH_ACCESS_KEY` (image search) and the email vars (`RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`) are optional — each feature degrades to a no-op when its key is absent.

## Architecture

### Time-based reveal lifecycle (the core domain concept)

An invite's state is derived purely from timestamps, never stored as a status field:

- `unlockAt` — when the reveal unlocks.
- `expiresAt` — computed at creation as `unlockAt + expirationHours` (default 24h; see [server/src/routes/invites.js](server/src/routes/invites.js)).

The single source of truth for interpreting these is [client/src/utils/revealState.js](client/src/utils/revealState.js), `getRevealState(invite, now)`, which returns `locked` / `revealed` / `expired` / `invalid`. Any UI or logic that branches on invite state should go through this helper rather than re-deriving from raw dates.

### Client (`client/`) — Vite + React 19 + React Router 7 + Tailwind

- Routing is centralized in [client/src/App.jsx](client/src/App.jsx): `/`, `/create`, `/created/:id`, `/t/:id`, and the optional `/t/:id/more` page. `/t/:id/reveal` is a legacy path that redirects to `/t/:id`.
- API access is isolated in [client/src/api/](client/src/api/) (`invites.js`, `images.js`) — these `fetch` relative `/api/*` paths, which Vite proxies to the server (see `vite.config.js`). Prefer adding new network calls here rather than inline in components.
- Tailwind theme extends brand colors `ink`, `ember`, `plum` and a `glow` shadow ([client/tailwind.config.js](client/tailwind.config.js)).

### Server (`server/`) — Express + Mongoose, ES modules

- Entry point [server/src/index.js](server/src/index.js) wires CORS (locked to `CLIENT_ORIGIN`), JSON parsing, routers, and a centralized error middleware. The error handler maps Mongoose `ValidationError` → 400 and `CastError` → 404, so route handlers can simply `next(error)` instead of formatting these themselves.
- The `Invite` model ([server/src/models/Invite.js](server/src/models/Invite.js)) enforces field validation/length limits; input trust boundaries live here.
- [server/src/routes/images.js](server/src/routes/images.js) is a backend-only proxy to Unsplash — the access key never reaches the client. If `UNSPLASH_ACCESS_KEY` is unset it returns empty results with a helpful message rather than erroring.
- Creator IPs are stored only as a SHA-256 hash (`creatorIpHash`), never raw.
- Responses are sanitized: `toPublicInvite()` in [server/src/routes/invites.js](server/src/routes/invites.js) whitelists client-safe fields, so `email`, tokens, send flags, and `creatorIpHash` are never returned.
- Invite creation is rate-limited per IP ([express-rate-limit](server/src/routes/invites.js)); `trust proxy` is set in production so limits key off the real client IP behind a reverse proxy.
- In production the server also serves the built client (`client/dist`) with an SPA fallback, so the whole app runs as one process — see the production block in [server/src/index.js](server/src/index.js).

### Email notifications (optional, double opt-in)

- [server/src/email/](server/src/email/) holds the Resend client, HTML templates, and token helpers; all email is a logged no-op unless `RESEND_API_KEY` is set.
- Creators may opt in with an email. Double opt-in: the first message is a content-free confirmation, and the link plus the "went live" / "expired" notices are sent only after confirming — so an unconfirmed address never receives invite content. Confirm/unsubscribe are handled in [server/src/routes/email.js](server/src/routes/email.js) (confirm tokens hashed + single-use; unsubscribe token constant-time compared).
- The time-based emails fire from a per-minute sweep in [server/src/jobs/notifications.js](server/src/jobs/notifications.js): it finds confirmed invites that crossed `unlockAt`/`expiresAt` and claims each send with a guarded atomic update, so a crash or overlapping run never double-sends.

### API surface

- `GET /api/health`
- `POST /api/invites` — body includes `hostName`, `teaserMessage`, `revealTitle`, `unlockAt`, `expirationHours`, optional `description`/image/moreInfo fields, and an optional creator `email`.
- `GET /api/invites/:id` (sanitized — see `toPublicInvite`)
- `GET /api/images/search?query=...`
- `GET /api/email/confirm` and `GET /api/email/unsubscribe` (opened from email links; return small HTML pages)
- `POST /api/tasks/notifications` — runs the notification sweep; guarded by `TASKS_SECRET` for an external cron on hosts that sleep idle instances.

## Deployment

Production runs as a single Node service (Express serving the built SPA + the API). The runbook and artifacts (systemd unit, redeploy script, env template) live in [DEPLOYMENT.md](DEPLOYMENT.md) and [deploy/](deploy/).

## Conventions

- Server uses ES modules (`"type": "module"`) with `.js` extensions required in imports.
- `dotenv` is loaded with `override: true` against `server/.env` resolved relative to the source file, so env vars in the file take precedence over the shell environment.
