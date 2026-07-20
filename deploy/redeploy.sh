#!/usr/bin/env bash
# Redeploy Plot Twist on the Azure VM.
# Run from the source checkout, as the user that owns /opt/plottwist/src
# (that user needs sudo rights for `systemctl restart plottwist`).
set -euo pipefail

cd /opt/plottwist/src

git pull --ff-only

# Install INCLUDING devDependencies — the build (vite, tailwind) and the prod
# start script (cross-env) live in devDependencies, so do NOT set
# NODE_ENV=production for this step.
npm install

npm run build

sudo systemctl restart plottwist
echo "Plot Twist redeployed and restarted."
