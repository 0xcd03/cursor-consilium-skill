#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_LOCAL="$DIR/.env.local"
EXAMPLE="$DIR/.env.local.example"

cd "$DIR"
npm install --silent 2>/dev/null || npm install

if [[ ! -f "$ENV_LOCAL" ]]; then
  cp "$EXAMPLE" "$ENV_LOCAL"
  echo "Created: $ENV_LOCAL"
  echo "Paste your API key from Cursor Dashboard → Integrations"
fi

if command -v open >/dev/null 2>&1; then
  open "https://cursor.com/dashboard/integrations"
else
  echo "Open: https://cursor.com/dashboard/integrations"
fi

KEY="$(grep -E '^CURSOR_API_KEY=' "$ENV_LOCAL" 2>/dev/null | cut -d= -f2- || true)"
KEY="${KEY//\"/}"
KEY="${KEY//\'/}"
if [[ -z "$KEY" || "$KEY" == *REPLACE_ME* ]]; then
  echo ""
  echo "Edit $ENV_LOCAL then run:"
  echo "  node concilium.mjs --list-models"
  exit 2
fi

node concilium.mjs --list-models
