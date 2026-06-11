#!/usr/bin/env bash
# Run once after `npm run dev:daemon` + `npx pm2 save` — installs PM2 launchd hook (needs your password).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "$ROOT"
nvm use
PM2_BIN="$ROOT/node_modules/pm2/bin/pm2"
NODE_BIN="$(dirname "$(command -v node)")"
echo "Installing PM2 startup (launchd). You may be prompted for your macOS password."
sudo env PATH="$PATH:$NODE_BIN" "$PM2_BIN" startup launchd -u "$(whoami)" --hp "$HOME"
