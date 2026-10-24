// Battery levels of connected Bluetooth devices (AirPods, keyboards, mice…).
// Web pages can't read these, so the extension asks a small native helper
// (native/dashboard-bluetooth-host, macOS only) through Chrome native messaging.
// Everything here is local; the helper makes no network calls.

export const HOST = "dev.dashboard.bluetooth";

const pctOf = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

// "38-09-fb-06-cd-7a" and "38:09:FB:06:CD:7A" → "38:09:fb:06:cd:7a"
const normAddr = (a) => String(a ?? "").toLowerCase().replace(/-/g, ":");

// ioreg lines → Map(address → percent) for accessories reporting BatteryPercent.
export function parseIoreg(text) {
  const out = new Map();
  let cur = {};
  const flush = () => {
    const pct = pctOf(cur.pct);
    if (cur.addr && pct !== null) out.set(normAddr(cur.addr), pct);
    cur = {};
  };
  for (const line of String(text ?? "").split("\n")) {
    if (line.includes("+-o ")) flush();
    const pct = line.match(/"BatteryPercent" = (\d+)/);
    const addr = line.match(/"DeviceAddress" = "([^"]+)"/);
    if (pct) cur.pct = pct[1];
    if (addr) cur.addr = addr[1];
  }
  flush();
  return out;
}

function kindOf(name, minorType) {
  const s = `${name} ${minorType ?? ""}`.toLowerCase();
  if (/airpods|buds|headphone|headset|earbud/.test(s)) return "audio";
  if (/keyboard|keys/.test(s)) return "keyboard";
  if (/mouse|master|anywhere|lift/.test(s)) return "mouse";
  if (/trackpad/.test(s)) return "trackpad";
  return "other";
}

// "mx-keys-s-for-mac-2b37c" → "MX Keys S for Mac". Logi Options+ ids end with a
// 5-character hex suffix, dropped here.
export function logiName(id) {
  return String(id).replace(/-[0-9a-f]{5}$/, "").split("-").map((w) => {
    if (w === "for") return w;
    if (w === "mx" || /\d/.test(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}

// Model id of a Logi Options+ slot id: "mx-keys-s-for-mac-2b37c" → "2b37c".
const logiModel = (id) => String(id).match(/-([0-9a-f]{5})$/)?.[1] ?? null;

// Logitech devices on a USB receiver, from the helper's Logi Options+ data.
// `known` is the model ids Options+ currently manages ("2b034_ext10", …).
// Records for devices not in it (removed hardware) are dropped. An empty or
// missing list means the format is unknown, so nothing is filtered.
export function parseLogi(entries, known) {
  const current = new Set((known ?? []).map((k) => String(k).split("_")[0]));
  const rows = [];
  for (const e of entries ?? []) {
    const pct = pctOf(e?.level);
    if (pct === null || !e?.id) continue;
    if (current.size && !current.has(logiModel(e.id))) continue;
    const name = logiName(e.id);
    rows.push({ name, pct, kind: kindOf(name) });
  }
  return rows;
}

// Helper payload → rows [{name, pct, kind}] for devices that report a battery.
// Earbuds report left, right, and case: one row for the buds (the lower of
// the two) and one for the case, like the macOS battery widget.
export function parseBluetooth(payload) {
  const accessories = parseIoreg(payload?.ioreg);
  const rows = [];
  for (const entry of payload?.devices ?? []) {
    for (const [name, v] of Object.entries(entry ?? {})) {
      const kind = kindOf(name, v?.device_minorType);
      const l = pctOf(v?.device_batteryLevelLeft);
      const r = pctOf(v?.device_batteryLevelRight);
      const c = pctOf(v?.device_batteryLevelCase);
      const main = pctOf(v?.device_batteryLevelMain);
      const buds = l !== null && r !== null ? Math.min(l, r) : l ?? r;
      if (buds !== null) rows.push({ name, pct: buds, kind });
      if (c !== null) rows.push({ name: `${name} Case`, pct: c, kind: "case" });
      if (main !== null) rows.push({ name, pct: main, kind });
      if (buds === null && c === null && main === null) {
        const pct = accessories.get(normAddr(v?.device_address));
        if (pct !== undefined) rows.push({ name, pct, kind });
      }
    }
  }
  // Earbuds appear twice (classic and BLE entries) with the same name; keep the
  // first row for each name.
  rows.push(...parseLogi(payload?.logi, payload?.logi_known));
  const seen = new Set();
  return rows.filter((r) => !seen.has(r.name) && seen.add(r.name));
}

// Resolves to rows, or null when the helper isn't installed or fails.
export function fetchBluetooth(chromeApi = globalThis.chrome) {
  const send = chromeApi?.runtime?.sendNativeMessage;
  if (typeof send !== "function") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      send.call(chromeApi.runtime, HOST, { cmd: "battery" }, (res) => {
        if (chromeApi.runtime.lastError || !res) return resolve(null);
        resolve(parseBluetooth(res));
      });
    } catch {
      resolve(null);
    }
  });
}
