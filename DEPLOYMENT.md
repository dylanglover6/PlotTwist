# Deployment & Publishing Plan

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

### On a PaaS (Render / Railway / Fly.io / Heroku-style)

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
| `CLIENT_ORIGIN`       | yes                | Your deployed origin, for the CORS allow-list. Same-origin in prod, but keep it set.                 |
| `UNSPLASH_ACCESS_KEY` | optional           | Enables image search; without it search returns an empty set with a message. Stays server-side only. |
| `PORT`                | usually auto       | Port Express listens on (platform-provided).                                                         |
| `NODE_ENV`            | yes (`production`) | Enables static serving of the client build. Set by `start:prod`.                                     |
| `RESEND_API_KEY`      | optional           | Enables creator email notifications. Unset → email is a logged no-op; the app still works.           |
| `EMAIL_FROM`          | with email         | From header for outgoing mail (use a verified domain in production).                                 |
| `APP_URL`             | with email         | Public base URL used to build confirm/unsubscribe/reveal links inside emails.                        |
| `TASKS_SECRET`        | optional           | Shared secret for `POST /api/tasks/notifications`, so an external cron can drive the sweep.          |

See [EMAIL_PLAN.md](EMAIL_PLAN.md) for the full email-notifications design.

## Recommended hosting

- **App:** any Node host that runs a long-lived process (Render Web Service,
  Railway, Fly.io, or a VPS). A single instance is enough.
- **Database:** MongoDB Atlas (managed). The app only needs one database.
- **Images:** an Unsplash developer application for `UNSPLASH_ACCESS_KEY`.

A static-only host (Netlify/Vercel static) is **not** sufficient on its own
because the app needs the Express API and a database; if you use one of those
platforms, run the server as a serverless/Node function or use their Node
service tier.

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

## Pre-publish checklist (already verified on the `polish` branch)

- [x] `npm run lint` clean, `npm test` green (13 tests), `npm run build` succeeds.
- [x] Production server verified: `/` and `/t/:id` serve the SPA, `/api/*` stays JSON.
- [x] No secrets reach the client bundle; `server/.env` is gitignored.
- [x] Meta tags + favicon + `og-image.png` present for link previews.
- [x] axe-core: 0 WCAG 2.1 A/AA violations across all pages.
- [ ] Set the production env vars in your host.
- [ ] Point `CLIENT_ORIGIN` at your deployed domain.
