#!/bin/bash
# Installs the Dashboard Bluetooth helper for Chrome on macOS.
#
#   native/install.sh [<extension-id> ...]
#
# Always allows Dashboard's private Chrome Web Store listing (STORE_ID below).
# An unpacked copy has its own ID (see its Details page in chrome://extensions),
# so pass it to allow that copy too. Only these IDs may talk to the helper.
# Re-run after the IDs change. Remove with --uninstall.
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

origins="\"chrome-extension://$STORE_ID/\""
for id in "$@"; do
  [[ "$id" =~ ^[a-p]{32}$ ]] || { echo "Not an extension ID: $id" >&2; exit 1; }
  origins="$origins, \"chrome-extension://$id/\""
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
