# Deployment

> **Production:** Plot Twist runs on an **Azure VM**, reverse-proxied by Caddy at
> **https://plottwist.dylanglover.com**. The VM runbook is in
> [deploy/README.md](deploy/README.md) and the artifacts (systemd unit, redeploy
> script, prod env template) are in [deploy/](deploy/). It also runs on any
> generic Node PaaS (Render / Railway / Fly) — the single-service model, build
> commands, and env vars are the same everywhere.

Plot Twist ships as a **single Node service**: in production the Express server
serves the built React SPA _and_ the `/api` routes from one process, so there
is no separate frontend host and no CORS/proxy juggling between origins.

```
                 ┌─────────────────────────────────────────┐
  Browser  ───▶  │  Express (server/src/index.js)           │
                 │   • /api/*  → JSON API (Mongoose)         │
                 │   • /*      → client/dist SPA + fallback  │
                 └───────────────┬─────────────────────────┘
                                 │
                        ┌────────▼────────┐        ┌──────────────┐
                        │  MongoDB Atlas  │        │ Unsplash API │
                        └─────────────────┘        └──────────────┘
```

## Build & run

```bash
npm install          # installs root + both workspaces
npm run build        # builds the client into client/dist
npm run start:prod   # cross-env NODE_ENV=production node server/src/index.js
# or, in one step for local production testing:
npm run serve        # build + start:prod
```

- `start:prod` sets `NODE_ENV=production`, which is what flips the server from
  "API only + dev status route" to "also serve `client/dist` with an SPA
  fallback to `index.html`."
- Deploy the **whole repo** (client and server stay siblings): the server
  resolves the build at `../../client/dist` relative to `server/src/`.

### Production: Azure VM behind Caddy

The app runs under systemd as the `plottwist` user and listens on
`127.0.0.1:3000` (loopback only). Caddy fronts it at
`https://plottwist.dylanglover.com` and handles HTTPS; the reverse-proxy config
lives on the host, outside this repo. Full steps and the artifacts
(`plottwist.service`, `redeploy.sh`, `plottwist.env.example`) are in
[deploy/](deploy/). Key points:

- Install **including devDependencies** (`vite`/`tailwind` build the client;
  `cross-env` runs `start:prod`) — do not set `NODE_ENV=production` for
  `npm install`.
- The build must run on the box (`npm run build`) so `client/dist` exists next
  to the server.
- Redeploy: `deploy/redeploy.sh` (`git pull && npm install && npm run build &&
systemctl restart plottwist`).

### On a generic PaaS (Render / Railway / Fly.io)

| Setting       | Value                          |
| ------------- | ------------------------------ |
| Build command | `npm install && npm run build` |
| Start command | `npm run start:prod`           |
| Node version  | 20+ (developed on 22)          |

Most platforms set `NODE_ENV=production` and `PORT` automatically; `start:prod`
sets `NODE_ENV` explicitly so it works even where the platform doesn't.

## Required environment variables

Set these in the host's dashboard (never commit `server/.env` — it is
gitignored). See [server/.env.example](server/.env.example).

| Var                   | Required           | Purpose                                                                                              |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`         | yes                | MongoDB Atlas connection string.                                                                     |
| `CLIENT_ORIGIN`       | yes                | Deployed origin for the CORS allow-list. On the VM: `https://plottwist.dylanglover.com`.             |
| `UNSPLASH_ACCESS_KEY` | optional           | Enables image search; without it search returns an empty set with a message. Stays server-side only. |
| `PORT`                | yes                | Port Express listens on. On the VM: `3000` (Caddy proxies to it).                                    |
| `HOST`                | optional           | Bind address. Defaults to `127.0.0.1` in production (loopback, behind Caddy), `0.0.0.0` in dev.      |
| `NODE_ENV`            | yes (`production`) | Enables static serving of the client build. Set by `start:prod`.                                     |
| `RESEND_API_KEY`      | optional           | Enables creator email notifications. Unset → email is a logged no-op; the app still works.           |
| `EMAIL_FROM`          | with email         | From header for outgoing mail (use a verified domain in production).                                 |
| `APP_URL`             | with email         | Public base URL used to build confirm/unsubscribe/reveal links inside emails.                        |
| `TASKS_SECRET`        | optional           | Shared secret for `POST /api/tasks/notifications`, so an external cron can drive the sweep.          |

See [EMAIL_PLAN.md](EMAIL_PLAN.md) for the full email-notifications design.

## Hosting

- **App:** an **Azure VM** (Ubuntu, B1s), one long-lived Node process under
  systemd behind Caddy. See [deploy/README.md](deploy/README.md).
- **Database:** MongoDB Atlas **M0 (free)** — allow-list the VM's public IP
  (not `0.0.0.0/0`).
- **Images:** an Unsplash developer application for `UNSPLASH_ACCESS_KEY`.

The app needs the Express API and a database, so a static-only host
(Netlify/Vercel static) is not sufficient on its own — which is why it lives on
the VM rather than a static tier.

## Dependencies and why they're here

### Server runtime

| Package              | Why                                                                |
| -------------------- | ------------------------------------------------------------------ |
| `express`            | HTTP server, routing, static file serving, error middleware.       |
| `mongoose`           | MongoDB ODM; the `Invite` schema also enforces field validation.   |
| `cors`               | Restricts which browser origin may call the API (`CLIENT_ORIGIN`). |
| `dotenv`             | Loads `server/.env` in local dev (prod uses real env vars).        |
| `resend`             | Sends the creator notification emails (confirm / live / expired).  |
| `express-rate-limit` | Rate-limits invite creation and the email action endpoints.        |
| `node-cron`          | Runs the in-process notification sweep every minute.               |

### Client runtime

| Package              | Why                                                                            |
| -------------------- | ------------------------------------------------------------------------------ |
| `react`, `react-dom` | UI framework.                                                                  |
| `react-router-dom`   | Client-side routing (`/`, `/create`, `/created/:id`, `/t/:id`, `/t/:id/more`). |
| `lucide-react`       | Icon set used across the UI.                                                   |

### Build & dev tooling

| Package                                  | Why                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `vite`, `@vitejs/plugin-react`           | Dev server (with `/api` proxy) and production bundler.                           |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling; design tokens live in `styles.css`, wired through `tailwind.config.js`. |
| `nodemon`                                | Auto-restarts the server in dev.                                                 |
| `concurrently`                           | Runs client + server together via `npm run dev`.                                 |
| `cross-env`                              | Cross-platform `NODE_ENV=production` for the prod start script.                  |

### Quality tooling

| Package                                           | Why                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `eslint` + React plugins, `@eslint/js`, `globals` | Linting for both workspaces (flat config).                                       |
| `prettier`, `eslint-config-prettier`              | Formatting; ESLint defers stylistic rules to Prettier.                           |
| `vitest`                                          | Unit + integration tests (reveal-state, tokens, serializer, notification sweep). |
| `mongodb-memory-server`                           | Ephemeral MongoDB for the server integration tests (dev-only).                   |

> Note: Playwright and axe-core were used ad hoc during the polish pass for
> visual, accessibility, and production-serve verification. They were installed
> transiently and are **not** project dependencies.

## Pre-publish checklist

Verified in the repo:

- [x] `npm run lint` clean, `npm test` green, `npm run build` succeeds.
- [x] Production server verified: `/` and `/t/:id` serve the SPA, `/api/*` stays JSON.
- [x] No secrets reach the client bundle; `.env` and `deploy/*.env` are gitignored.
- [x] Meta tags + favicon + `og-image.png` present for link previews.
- [x] axe-core: 0 WCAG 2.1 A/AA violations across all pages.

On the VM (see [deploy/README.md](deploy/README.md)):

- [ ] Node 22 installed (NodeSource); `plottwist` user + `/opt/plottwist/.env` (chmod 600).
- [ ] `MONGODB_URI` set; VM public IP allow-listed in Atlas.
- [ ] `CLIENT_ORIGIN=https://plottwist.dylanglover.com`, `PORT=3000`.
- [ ] `plottwist.service` enabled; `plottwist` A record resolves; Caddy reloaded.
- [ ] Smoke test: full invite lifecycle, `/api/*` JSON, og:image preview renders.
