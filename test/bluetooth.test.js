import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIoreg, parseBluetooth, parseLogi, logiName, fetchBluetooth, HOST } from "../src/bluetooth.js";

const IOREG = [
  '+-o AppleDeviceManagementHIDEventService  <class X, id 0x1>',
  '  |   "Product" = ',
  '  |   "BatteryPercent" = 96',
  '  |   "DeviceAddress" = "38-09-fb-06-cd-7a"',
  '  +-o IOHIDEventServiceUserClient  <class Y>',
].join("\n");

const PAYLOAD = {
  devices: [
    { "AirPods Pro": {
      device_address: "DB:1C:F1:87:74:DB",
      device_batteryLevelCase: "89%",
      device_batteryLevelLeft: "100%",
      device_batteryLevelRight: "92%",
    } },
    { "Sugu’s Magic Keyboard": { device_address: "38:09:FB:06:CD:7A", device_minorType: "Keyboard" } },
    { "Speaker": { device_address: "AA:BB:CC:DD:EE:FF" } }, // no battery info
  ],
  ioreg: IOREG,
};

test("parseIoreg maps normalized addresses to percentages", () => {
  assert.deepEqual([...parseIoreg(IOREG)], [["38:09:fb:06:cd:7a", 96]]);
  assert.equal(parseIoreg("").size, 0);
  assert.equal(parseIoreg(undefined).size, 0);
});

test("parseBluetooth: earbuds split into buds and case, accessories via ioreg", () => {
  assert.deepEqual(parseBluetooth(PAYLOAD), [
    { name: "AirPods Pro", pct: 92, kind: "audio" },
    { name: "AirPods Pro Case", pct: 89, kind: "case" },
    { name: "Sugu’s Magic Keyboard", pct: 96, kind: "keyboard" },
  ]);
});

test("parseBluetooth drops duplicate entries for the same device name", () => {
  const rows = parseBluetooth({ devices: [
    { "AirPods Pro": { device_batteryLevelLeft: "100%", device_batteryLevelRight: "100%", device_batteryLevelCase: "89%" } },
    { "AirPods Pro": { device_batteryLevelCase: "89%" } }, // BLE entry
  ] });
  assert.deepEqual(rows.map((r) => r.name), ["AirPods Pro", "AirPods Pro Case"]);
});

test("parseBluetooth handles main-battery devices and junk", () => {
  const rows = parseBluetooth({ devices: [{ Mouse: { device_batteryLevelMain: "40%" } }, null, {}] });
  assert.deepEqual(rows, [{ name: "Mouse", pct: 40, kind: "mouse" }]);
  assert.deepEqual(parseBluetooth({}), []);
  assert.deepEqual(parseBluetooth(null), []);
});

test("fetchBluetooth: null when unsupported or helper missing, rows when installed", async () => {
  assert.equal(await fetchBluetooth(undefined), null);
  assert.equal(await fetchBluetooth({ runtime: {} }), null);
  const missing = { runtime: { lastError: { message: "not found" },
    sendNativeMessage: (_h, _m, cb) => cb(undefined) } };
  assert.equal(await fetchBluetooth(missing), null);
  let host;
  const ok = { runtime: { lastError: undefined,
    sendNativeMessage: (h, _m, cb) => { host = h; cb(PAYLOAD); } } };
  assert.equal((await fetchBluetooth(ok)).length, 3);
  assert.equal(host, HOST);
});

test("logiName turns Options+ ids into display names", () => {
  assert.equal(logiName("mx-keys-s-for-mac-2b37c"), "MX Keys S for Mac");
  assert.equal(logiName("mx-master-3s-2b034"), "MX Master 3S");
});

test("parseLogi builds rows and skips bad entries; parseBluetooth appends them", () => {
  const logi = [
    { id: "mx-keys-s-for-mac-2b37c", level: 80, time: "1" },
    { id: "mx-master-3s-2b034", level: 95, time: "2" },
    { id: "broken", level: "n/a" },
    null,
  ];
  assert.deepEqual(parseLogi(logi), [
    { name: "MX Keys S for Mac", pct: 80, kind: "keyboard" },
    { name: "MX Master 3S", pct: 95, kind: "mouse" },
  ]);
  assert.deepEqual(parseLogi(undefined), []);
  const rows = parseBluetooth({ devices: [{ Mouse: { device_batteryLevelMain: "40%" } }], logi });
  assert.deepEqual(rows.map((r) => r.name), ["Mouse", "MX Keys S for Mac", "MX Master 3S"]);
});
