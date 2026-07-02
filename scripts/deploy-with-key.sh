#!/usr/bin/env bash
#
# Rebuild + redeploy the Velo admin dashboard (velo-frontend container) with the
# REAL backend API key injected at build time. Run this ON THE VPS.
#
# Why: the admin sends x-api-key on every /admin/* call. It shipped with the
# placeholder 'your-api-key-here', so the backend (which requires
# x-api-key === API_KEY) 403'd every request. This reads the real key straight
# from the running backend pod and bakes it into the build via Vite's VITE_API_KEY.
#
# Usage:  bash deploy-with-key.sh
#
set -euo pipefail

NS=velo
DIR=/home/devkojo/apps/velo-admin/velo-admin
CLIENT="$DIR/src/api/base44Client.js"

echo "==> Reading API_KEY from the running backend pod"
KEY=$(kubectl exec -n "$NS" deploy/velo-api -- printenv API_KEY)
if [ -z "$KEY" ]; then echo "ERROR: API_KEY came back empty"; exit 1; fi
echo "    got a key of length ${#KEY} (value not printed)"

echo "==> Making base44Client read the key from VITE_API_KEY (fixed-string edit, no secret in this file)"
# Handle both the old hardcoded placeholder and any prior value.
sed -i "s|const API_KEY = 'your-api-key-here';|const API_KEY = import.meta.env.VITE_API_KEY;|" "$CLIENT" || true
grep -q "import.meta.env.VITE_API_KEY" "$CLIENT" || {
  echo "ERROR: could not update $CLIENT - open it and set: const API_KEY = import.meta.env.VITE_API_KEY;"; exit 1;
}

echo "==> Writing build-time env (the only place the key is stored)"
printf 'VITE_API_KEY=%s\n' "$KEY" > "$DIR/.env.production"

echo "==> Building the image"
cd "$DIR"
docker build -t velo-frontend:latest .

echo "==> Recreating the container (brief downtime)"
docker rm -f velo-frontend 2>/dev/null || true
docker run -d --name velo-frontend --restart always -p 8080:80 velo-frontend:latest

echo "==> Verifying the built bundle carries a key (length only)"
BUILT=$(docker run --rm --entrypoint sh velo-frontend:latest -c "grep -rhoE 'x-api-key[^,]{0,40}' /usr/share/nginx/html/assets 2>/dev/null | head -1" || true)
echo "    bundle api-key marker present: $([ -n "$BUILT" ] && echo yes || echo unknown)"

echo "==> Done. Test: open https://admin.velocouriersvc.com (or http://<vps-ip>:8080) and log in."
echo "    Optional: keep .env.production out of git (add it to .gitignore)."
