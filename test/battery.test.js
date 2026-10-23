import { test } from "node:test";
import assert from "node:assert/strict";
import { batteryState, formatDuration, batteryNote, watchBattery } from "../src/battery.js";

test("batteryState rounds level and picks the relevant time", () => {
  assert.deepEqual(
    batteryState({ level: 0.804, charging: false, dischargingTime: 7200, chargingTime: Infinity }),
    { pct: 80, charging: false, seconds: 7200 });
  assert.deepEqual(
    batteryState({ level: 0.5, charging: true, dischargingTime: Infinity, chargingTime: 3600 }),
    { pct: 50, charging: true, seconds: 3600 });
  assert.equal(batteryState({ level: 1, charging: false, dischargingTime: Infinity }).seconds, null);
  assert.equal(batteryState(null), null);
  assert.equal(batteryState({ level: NaN }), null);
});

test("formatDuration", () => {
  assert.equal(formatDuration(45 * 60), "45m");
  assert.equal(formatDuration(72 * 60), "1h 12m");
  assert.equal(formatDuration(5), "1m");
});

test("batteryNote", () => {
  assert.equal(batteryNote({ pct: 100, charging: true, seconds: null }), "Fully charged");
  assert.equal(batteryNote({ pct: 50, charging: true, seconds: 3600 }), "Charging · 1h 0m to full");
  assert.equal(batteryNote({ pct: 50, charging: true, seconds: null }), "Charging");
  assert.equal(batteryNote({ pct: 50, charging: false, seconds: 5400 }), "1h 30m remaining");
  assert.equal(batteryNote({ pct: 50, charging: false, seconds: null }), "On battery");
});

test("watchBattery reports now and on events; false when unsupported", async () => {
  const handlers = {};
  const bm = {
    level: 0.9, charging: false, dischargingTime: 600,
    addEventListener: (ev, fn) => { handlers[ev] = fn; },
  };
  const seen = [];
  assert.equal(await watchBattery((s) => seen.push(s.pct), { getBattery: async () => bm }), true);
  bm.level = 0.8;
  handlers.levelchange();
  assert.deepEqual(seen, [90, 80]);
  assert.equal(await watchBattery(() => {}, {}), false);
  assert.equal(await watchBattery(() => {}, { getBattery: async () => { throw new Error("x"); } }), false);
});
