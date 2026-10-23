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
  if (/keyboard/.test(s)) return "keyboard";
  if (/mouse/.test(s)) return "mouse";
  if (/trackpad/.test(s)) return "trackpad";
  return "other";
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
