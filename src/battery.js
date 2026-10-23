// Battery status for the device the browser runs on, via the Battery Status
// API (Chrome only). It reads this device alone — connected accessories such as
// AirPods or keyboards aren't exposed to web pages. Nothing leaves the browser.

// {pct, charging, seconds} from a BatteryManager. `seconds` is the time to
// full (charging) or to empty (discharging), or null when unknown.
export function batteryState(bm) {
  if (!bm || !Number.isFinite(bm.level)) return null;
  const pick = (s) => (Number.isFinite(s) && s > 0 ? s : null);
  return {
    pct: Math.round(bm.level * 100),
    charging: !!bm.charging,
    seconds: pick(bm.charging ? bm.chargingTime : bm.dischargingTime),
  };
}

// "1h 12m" / "45m". Rounds to the nearest minute, minimum 1m.
export function formatDuration(seconds) {
  const mins = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function batteryNote(state) {
  if (state.charging) {
    if (state.pct >= 100) return "Fully charged";
    return state.seconds ? `Charging · ${formatDuration(state.seconds)} to full` : "Charging";
  }
  return state.seconds ? `${formatDuration(state.seconds)} remaining` : "On battery";
}

// Calls onChange(state) now and on every change. Resolves to false when the
// API is unavailable.
export async function watchBattery(onChange, nav = globalThis.navigator) {
  if (!nav || typeof nav.getBattery !== "function") return false;
  try {
    const bm = await nav.getBattery();
    const push = () => onChange(batteryState(bm));
    for (const ev of ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"]) {
      bm.addEventListener(ev, push);
    }
    push();
    return true;
  } catch {
    return false;
  }
}
