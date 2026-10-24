#!/bin/bash
# Installs the Dashboard Bluetooth helper for Chrome on macOS.
#
#   native/install.sh [<extension-id> ...]
#
# With no arguments, allows Dashboard's private Chrome Web Store listing
# (STORE_ID below). With one or more IDs, allows exactly those instead, e.g. an
# unpacked copy, which has its own ID on its Details page in chrome://extensions.
# Pass every ID you use (the store ID too, to run both). Only the allowed IDs may
# talk to the helper. Re-run after the IDs change. Remove with --uninstall.
set -euo pipefail

NAME="dev.dashboard.bluetooth"
STORE_ID="akjlmhmbflomlldkmkmcfodacnijfkcl"
SRC="$(cd "$(dirname "$0")" && pwd)/dashboard-bluetooth-host"
DEST_DIR="$HOME/Library/Application Support/Dashboard"
DEST="$DEST_DIR/dashboard-bluetooth-host"
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
MANIFEST="$MANIFEST_DIR/$NAME.json"

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$MANIFEST" "$DEST"
  echo "Removed $NAME."
  exit 0
fi

ids=("$@")
[ "${#ids[@]}" -eq 0 ] && ids=("$STORE_ID")
origins=""
for id in "${ids[@]}"; do
  [[ "$id" =~ ^[a-p]{32}$ ]] || { echo "Not an extension ID: $id" >&2; exit 1; }
  origins="${origins:+$origins, }\"chrome-extension://$id/\""
done

mkdir -p "$DEST_DIR" "$MANIFEST_DIR"
cp "$SRC" "$DEST"
chmod +x "$DEST"

cat > "$MANIFEST" <<JSON
{
  "name": "$NAME",
  "description": "Dashboard Bluetooth battery helper",
  "path": "$DEST",
  "type": "stdio",
  "allowed_origins": [$origins]
}
JSON

echo "Installed $NAME. Reload the extension and open a new tab."
