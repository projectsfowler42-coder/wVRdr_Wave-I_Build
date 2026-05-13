#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

echo "wVRdr~ Local Secret Bootstrap"
echo "Enter secrets only in this local terminal."
echo ""

ENV_FILE=".env"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE" || true

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  local line
  local found=0

  tmp="$(mktemp)"

  if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        "$key="*)
          printf '%s=%s\n' "$key" "$value" >> "$tmp"
          found=1
          ;;
        *)
          printf '%s\n' "$line" >> "$tmp"
          ;;
      esac
    done < "$ENV_FILE"
  fi

  if [ "$found" -eq 0 ]; then
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi

  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE" || true
}

ask_secret() {
  local name="$1"
  local label="$2"
  local yn
  local value
  local ghyn

  read -r -p "Set $label? [y/N] " yn
  case "$yn" in
    [Yy]*)
      read -r -s -p "Enter $label: " value
      echo ""

      if [ -z "$value" ]; then
        echo "Skipped empty value for $name."
        unset value
        return 0
      fi

      upsert_env "$name" "$value"
      echo "Stored locally in $ENV_FILE: $name"

      if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        read -r -p "Also store $label as a GitHub Actions repo secret? [y/N] " ghyn
        case "$ghyn" in
          [Yy]*)
            printf "%s" "$value" | gh secret set "$name"
            echo "Stored GitHub Actions secret: $name"
            ;;
        esac
      else
        echo "GitHub CLI is not available/authenticated; skipped GitHub secret storage for $name."
      fi

      unset value
      ;;
  esac
}

ask_secret "MARKET_DATA_API_KEY" "market data API key"
ask_secret "FRED_API_KEY" "FRED API key"
ask_secret "NEWS_API_KEY" "news API key"
ask_secret "ALPHA_VANTAGE_API_KEY" "Alpha Vantage API key"
ask_secret "BROKER_API_KEY" "broker API key"
ask_secret "BROKER_API_SECRET" "broker API secret"
ask_secret "DATABASE_URL" "database URL"

echo ""
echo "Local .env updated with chmod 600."
echo "Reminder: never commit .env."
