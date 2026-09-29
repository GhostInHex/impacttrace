#!/usr/bin/env bash
# Code Cubicle Impact MVP — interactive setup wizard (Full: Cloudinary + OpenRouter -> .env.local).
# Run: bash scripts/setup-wizard.sh  (or chmod +x scripts/setup-wizard.sh && ./scripts/setup-wizard.sh)
# Ephemeral by default; commit only if you want a repeatable setup path.
set -euo pipefail

TOTAL_STAGES=6
ENV_FILE=".env.local"
ENV_EXAMPLE=".env.example"
CURRENT_STAGE=0

# ---------------- library (do not hand-edit pattern; helpers shared by all wizards) ----------------
say() { printf '\n%s\n' "$*"; }
step() { printf '  - %s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

stage() {
  CURRENT_STAGE="$1"; shift
  clear 2>/dev/null || printf '\n\n'
  printf '=== Stage %s/%s: %s ===\n' "$CURRENT_STAGE" "$TOTAL_STAGES" "$*"
  printf '(%s stage(s) left after this: %s)\n\n' "$(( TOTAL_STAGES - CURRENT_STAGE ))" "$(( TOTAL_STAGES - CURRENT_STAGE ))"
}

open_url() {
  local url="$1"
  say "Opening: $url"
  say "If no browser opens, copy-paste the URL manually."
  if grep -qi microsoft /proc/version 2>/dev/null && command -v wslview >/dev/null 2>&1; then
    wslview "$url" >/dev/null 2>&1 || true; return 0
  fi
  case "$(uname -s 2>/dev/null || echo Windows)" in
    Darwin*) open "$url" >/dev/null 2>&1 || true ;;
    Linux*) (xdg-open "$url" >/dev/null 2>&1 || wslview "$url" >/dev/null 2>&1) || true ;;
    MINGW*|MSYS*|CYGWIN*|WindowsNT*|Windows*) (cmd //c start "" "$url" 2>/dev/null || powershell.exe -NoProfile -Command "Start-Process '$url'" 2>/dev/null) || true ;;
    *) printf 'Please open the URL above.\n' ;;
  esac
}

pause() { read -r -p "${1:-Press Enter to continue...}" _dummy || true; }
confirm() {
  local prompt="${1:-Continue? [y/N]} " ans
  read -r -p "$prompt" ans || return 1
  case "$ans" in [yY][eE][sS]|[yY]) return 0 ;; *) say "Skipped / answered no."; return 1 ;; esac
}

ask() {
  # ask VAR "Prompt" "default"
  local var="$1" prompt="$2" def="${3:-}" val
  if [ -n "$def" ]; then read -r -p "$prompt [$def]: " val || true; val="${val:-$def}"
  else read -r -p "$prompt: " val || true; fi
  printf -v "$var" '%s' "$val"
}

ask_secret() {
  # ask_secret VAR "Prompt" — hidden entry, never echoed
  local var="$1" prompt="$2" val
  read -r -s -p "$prompt (hidden): " val || true; echo
  printf -v "$var" '%s' "$val"
  if [ -z "${!var:-}" ]; then err "Empty value entered; you can re-run this stage."; fi
}

write_env() {
  # write_env KEY VALUE — idempotent upsert into .env.local, creates file if missing
  local key="$1" value="$2" tmp
  [ -f "$ENV_FILE" ] || : > "$ENV_FILE"
  tmp="$(mktemp)"
  awk -v k="$key" -v v="$value" 'BEGIN{done=0} $0 ~ "^"k"=" {$0=k"="v; done=1} {print} END{if(!done) print k"="v}' "$ENV_FILE" > "$tmp"
  cat "$tmp" > "$ENV_FILE"; rm -f "$tmp"
  step "Wrote $key to $ENV_FILE"
}

mask() { local v="${1:-}"; [ "${#v}" -le 4 ] && printf '****' || printf '%s****' "${v:0:2}"; }

set_secret() {
  # set_secret NAME VALUE — writes a GitHub Actions secret only if CI needs it.
  # This repo has no .github/workflows secrets.* references, so this is a documented no-op.
  step "Skipping gh secret '$1': no CI secret reference in this repo (value stays in $ENV_FILE only)."
}

set_var() {
  step "Skipping gh variable '$1': no CI vars.* reference in this repo (value stays in $ENV_FILE only)."
}
# ---------------- end library — STAGES below ----------------

stage 1 "Prerequisites + .env.local"
say "Writes to .env.local only (no CI secrets: no workflows found)."
step "Needs: Node 20+, npm, Cloudinary + OpenRouter accounts."
if [ -f "$ENV_FILE" ]; then step "$ENV_FILE exists — values upserted, never duplicated."
else
  if [ -f "$ENV_EXAMPLE" ]; then cp "$ENV_EXAMPLE" "$ENV_FILE"; step "Created $ENV_FILE from $ENV_EXAMPLE."
  else err "$ENV_EXAMPLE missing."; : > "$ENV_FILE"; fi
fi
if ! command -v node >/dev/null 2>&1; then err "node missing — install Node 20+."; exit 1; fi
if ! command -v npm >/dev/null 2>&1; then err "npm missing."; exit 1; fi
step "node: $(node --version 2>/dev/null || echo unknown)"
if [ ! -d node_modules ]; then say "Installing deps…"; npm install; else step "node_modules present."; fi
confirm "Prereqs OK. Continue? [y/N]" || exit 0

stage 2 "Cloudinary cloud name (public)"
say "Path: https://cloudinary.com sign-in -> https://console.cloudinary.com/console -> top Product Environment -> Cloud name -> copy."
say "Path: WARNING - the script runs under Git Bash here, and its"
say "open_url uses start/xdg-open, which often fails silently on Windows."
say "If nothing opens, copy-paste each Opening: URL manually."
open_url "https://console.cloudinary.com/console"
ask CLOUD_NAME "Paste Cloudinary cloud name"
[ -n "${CLOUD_NAME:-}" ] || { err "Cloud name required."; exit 1; }
write_env "CLOUDINARY_CLOUD_NAME" "$CLOUD_NAME"
confirm "Saved. Continue to API key + secret? [y/N]" || exit 0

stage 3 "Cloudinary API key (public) + secret (secret)"
say "Path: console gear Settings -> Security / API Keys (or Go to API Keys) -> copy Key; eye/Reveal Secret (may ask password) -> copy."
say "Docs: https://cloudinary.com/documentation/finding_your_credentials_tutorial"
open_url "https://console.cloudinary.com/settings/security"
ask CLOUD_KEY "Paste CLOUDINARY_API_KEY"
[ -n "${CLOUD_KEY:-}" ] || { err "API key required."; exit 1; }
ask_secret CLOUD_SECRET "Paste CLOUDINARY_API_SECRET"
[ -n "${CLOUD_SECRET:-}" ] || { err "API secret required."; exit 1; }
write_env "CLOUDINARY_API_KEY" "$CLOUD_KEY"
write_env "CLOUDINARY_API_SECRET" "$CLOUD_SECRET"
set_secret "CLOUDINARY_API_SECRET" "$CLOUD_SECRET"
step "Secret saved locally, masked here: $(mask "$CLOUD_SECRET")"
confirm "Credentials saved. Continue to folder + add-ons? [y/N]" || exit 0

stage 4 "Upload folder + analysis add-ons (action)"
ask UPLOAD_FOLDER "Cloudinary upload folder" "code-cubicle-impact"
write_env "CLOUDINARY_UPLOAD_FOLDER" "${UPLOAD_FOLDER:-code-cubicle-impact}"
say "Enable manually (Subscribe/Enable per plan):"
say "Console path: login -> left sidebar puzzle-piece Add-ons icon"
say "(or Settings -> Add-ons) -> All Add-ons / Available add-ons"
say "-> pick each add-on -> Free plan -> Install Add-on."
open_url "https://console.cloudinary.com/console/addons"
pause "Press Enter after Add-ons marketplace opens…"
open_url "https://cloudinary.com/documentation/cloudinary_add_ons"
pause "Press Enter after add-ons docs open…"
step "Needed: Cloudinary AI Content Analysis, Google Automatic Video Tagging,"
step "Google OCR Text Detection and Extraction, Google AI Video Transcription."
say "Upload route sends google_tagging + google_text_detection (images), auto_tagging + google_video_transcription (video)."
confirm "Add-ons reviewed. Continue to OpenRouter? [y/N]" || exit 0

stage 5 "OpenRouter key (secret) + models (public)"
say "Path: https://openrouter.ai sign-in -> https://openrouter.ai/keys -> Create Key -> copy once -> paste below."
open_url "https://openrouter.ai/keys"
ask_secret OR_KEY "Paste OPENROUTER_API_KEY"
[ -n "${OR_KEY:-}" ] || { err "Key required (or quit and use demo fallbacks)."; exit 1; }
write_env "OPENROUTER_API_KEY" "$OR_KEY"
set_secret "OPENROUTER_API_KEY" "$OR_KEY"
ask GROUP_MODEL "Grouping model (free router default)" "openrouter/free"
ask REPORT_MODEL "Report model (free router default)" "openrouter/free"
ask APP_URL "App URL for attribution headers" "http://localhost:3000"
write_env "OPENROUTER_GROUP_MODEL" "${GROUP_MODEL:-openrouter/free}"
write_env "OPENROUTER_REPORT_MODEL" "${REPORT_MODEL:-openrouter/free}"
write_env "NEXT_PUBLIC_APP_URL" "${APP_URL:-http://localhost:3000}"
step "Key saved locally (masked: $(mask "$OR_KEY")). 1 grouping + 1 report call per project; invalid JSON never auto-retried."
confirm "OpenRouter saved. Continue to verify + demo? [y/N]" || exit 0

stage 6 "Verify + demo journey"
say "Verify with the real demo path (docs/demo-journey.md):"
step "1. npm run dev -> open ${APP_URL:-http://localhost:3000} (set above)."
step "2. Create project or Start with sample field journal -> Tree plantation."
step "3. Upload 1 image (<25MB): expect publicId + secure_url + tags/caption/OCR."
step "4. Organize evidence: 1 compact OpenRouter request, no raw bytes sent."
step "5. Review: Confirm/Reject/Edit; check timeline + before/after."
step "6. Generate report: 6 headings required; missing => Not enough evidence."
step "7. Print / save PDF via browser print dialog."
if confirm "Start 'npm run dev' now? [y/N]"; then npm run dev; else say "Run later: npm run dev"; fi

say "Done ($TOTAL_STAGES/$TOTAL_STAGES). Summary:"
step ".env.local: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (secret), CLOUDINARY_UPLOAD_FOLDER, OPENROUTER_API_KEY (secret), GROUP/REPORT models, NEXT_PUBLIC_APP_URL."
step "No GitHub secrets written (no CI). Secrets stay server-side; browser only calls src/app/api/*."
step "Recovery: 503 cloudinary_not_configured -> recheck keys; 429 -> continue manually; invalid grouping JSON -> manual continue; empty sections -> Not enough evidence."



