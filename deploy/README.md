# Deploying Plot Twist to an Azure VM

Production runs on an **Azure VM**, reverse-proxied by Caddy at
**https://plottwist.dylanglover.com**, as a single Node service (Express serving
the built React SPA + the API) — see [../DEPLOYMENT.md](../DEPLOYMENT.md).

> This repo provides the app, its systemd unit, and its env. The Caddy
> reverse-proxy config lives on the host, outside this repo — don't add Caddy
> config here.

Prerequisites handled on the host before these steps: the VM exists, Node 22 is
installed (NodeSource), Caddy is running, and the `plottwist` A record points at
the VM's public IP.

## 1. External services

- **MongoDB Atlas M0 (free):** create the cluster in a region near the VM, add a
  database user, and add the **VM's public IP** to Network Access (avoid
  `0.0.0.0/0`). Copy the connection string.
- **Unsplash:** create/reuse a developer app for `UNSPLASH_ACCESS_KEY` (optional
  — image search degrades gracefully without it).

## 2. System user + first deploy

```bash
sudo useradd -r -m -d /opt/plottwist -s /bin/bash plottwist
sudo -u plottwist git clone https://github.com/dylanglover6/PlotTwist.git /opt/plottwist/src
cd /opt/plottwist/src
# Install INCLUDING devDependencies (build + start:prod need them) — do NOT
# export NODE_ENV=production for this step.
sudo -u plottwist bash -c 'npm install && npm run build'
```

## 3. Environment

Copy the template, fill it in, lock it down:

```bash
sudo -u plottwist cp deploy/plottwist.env.example /opt/plottwist/.env
sudo -u plottwist nano /opt/plottwist/.env       # set MONGODB_URI, keys
sudo chmod 600 /opt/plottwist/.env
```

Required: `MONGODB_URI`, `CLIENT_ORIGIN=https://plottwist.dylanglover.com`,
`PORT=3000`. Optional: `UNSPLASH_ACCESS_KEY`, and the email vars — if you enable
Resend, set `APP_URL=https://plottwist.dylanglover.com` so email links resolve.

## 4. systemd service

```bash
sudo cp deploy/plottwist.service /etc/systemd/system/plottwist.service
sudo systemctl daemon-reload
sudo systemctl enable --now plottwist
sudo systemctl status plottwist          # verify it's running
```

The app listens on `127.0.0.1:3000` (loopback only — Caddy reaches it on-box;
the port is never exposed publicly). Caddy's `plottwist.dylanglover.com` block
proxies to it, and HTTPS is automatic once DNS resolves.

## 5. Smoke test

Once `https://plottwist.dylanglover.com` resolves:

- `/` and `/create` render.
- Create an invite and walk a full lifecycle across the `unlockAt` / `expiresAt`
  boundaries (locked → revealed → expired).
- `/api/health` returns JSON; `/api/*` stays JSON.
- Image search works (if the Unsplash key is set).
- Pasting the link into a chat app renders the `og:image` preview.

## 6. Redeploy

```bash
sudo -u plottwist /opt/plottwist/src/deploy/redeploy.sh
```

(`git pull --ff-only && npm install && npm run build && systemctl restart plottwist`.
The `plottwist` user needs sudo rights for the restart.)
