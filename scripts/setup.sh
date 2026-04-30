#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js (includes npm) first." >&2
  exit 1
fi

echo "Installing dependencies..."
npm install

mkdir -p "$ROOT_DIR/docs" "$ROOT_DIR/docs/templates" "$ROOT_DIR/scripts" >/dev/null 2>&1 || true

ENV_EXAMPLE="$ROOT_DIR/.env.example"
ENV_LOCAL="$ROOT_DIR/.env.local"
ENV_TEST="$ROOT_DIR/.env.test"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  cat > "$ENV_EXAMPLE" <<'EOF'
# Copy this file to .env.local and fill values as needed.
# Next.js public env vars must start with NEXT_PUBLIC_*

# Example:
# NEXT_PUBLIC_APP_NAME="My App"
EOF
  echo "Created .env.example"
fi

if [[ ! -f "$ENV_LOCAL" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_LOCAL"
  echo "Created .env.local (from .env.example)"
fi

if [[ ! -f "$ENV_TEST" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_TEST"
  echo "Created .env.test (from .env.example)"
fi

echo "Setup complete."
