<p align="center">
  <img src="assets/icons/icon-128.png" width="96" height="96" alt="Dashboard icon" />
</p>

<h1 align="center">Dashboard</h1>

<p align="center">
  A calm new tab that shows your timezones at a glance — with day and night at each.
</p>

<p align="center">
  Based on <a href="https://github.com/seanoliver/solstice"><strong>Solstice</strong></a> by Sean Oliver
</p>

<p align="center">
  <img src="assets/screenshots/hero.png" width="820" alt="Dashboard new tab — a big local clock above a row of timezone cards and a 24-hour timeline" />
</p>

Dashboard replaces Chrome's new tab with a single, quiet world clock. A big
local time up top, a card for every place you care about, and a 24-hour
timeline that makes the whole day legible at once. Each clock is shaded by
where the sun actually is — so you can tell, without doing the math, who's
asleep, who's mid-morning, and who's wrapping up their day.

No accounts, no feeds, no clutter. Open a tab, get your bearings, move on.

> **Credit.** Dashboard is a fork of
> [Solstice](https://github.com/seanoliver/solstice), created by
> [Sean Oliver](https://github.com/seanoliver). The time zone cards, daylight
> bands, timeline scrubbing, edit panel, and the website are his work, and this
> project's git history keeps his commits. Dashboard adds local weather and
> battery panels on top. Sean isn't involved in this fork and isn't responsible
> for the changes made here. See [License](#license).

> **Read the [disclaimers](#disclaimers) before installing.** This fork asks for
> more access than the original and includes an optional helper that runs
> outside Chrome.

## Why you might like it

- **Glanceable.** One screen answers "what time is it for them, and is now a
  good time to ping?"
- **Day & night, for real.** Sunrise and sunset are computed for each city's
  coordinates, so the colored bands reflect the actual day — not a guess.
- **Yours in seconds.** Add or remove cities, drag to reorder, rename a zone
  to a person's name, flip the whole page between 12h and 24h.
- **Plan across zones.** Drag any timeline marker and every clock jumps to
  that moment — so you can find an hour that's civil for everyone.
- **Quiet by design.** Muted palette, monospace numerals, nothing blinking
  for your attention.

## Day & night at a glance

Every clock — the cards and the timeline — is banded by time of day, with the
light hours derived from real sunrise/sunset for that location:

- **Morning** — sunrise → 9am
- **Work** — 9am → 5pm
- **Evening** — 5pm → sunset
- **Night**

A dot marks "now" on each track, and the part of the day still ahead is dimmed
so the current moment reads instantly. Cities on a different calendar day get a
small `+1` / `−1` chip.

## Edit your zones

<p align="center">
  <img src="assets/screenshots/edit.png" width="820" alt="Dashboard edit panel — reorder, rename, remove zones, and search to add any city" />
</p>

Click **Edit** (bottom-right) to open the panel:

- **Drag** the `≡` handle to reorder — cards (left→right) and timeline
  (top→bottom) follow.
- **Rename** a zone by clicking its label (e.g. "Madrid" → "Steve").
- **Remove** with the `×` (in the panel or on the card).
- **Add** by searching — type a few letters and pick a match. Bundled cities
  resolve instantly; anything else falls back to a free geocoding lookup so
  you can add essentially any city on earth.

The big local clock has the current weather beside it: temperature, conditions,
feels-like, wind, humidity, and cloud cover (click the temperature to switch
°C/°F). It uses Open-Meteo and is not shown on the website.

Beneath it, a "This device" row shows the battery level, charging state, and
time remaining (Chrome's Battery Status API). It reads only the computer
running the browser and stays local.

### Bluetooth device batteries (macOS, optional)

Chrome can't read the battery of AirPods, keyboards, or other Bluetooth
devices, so Dashboard uses a small helper that asks macOS and hands the result
to the extension through Chrome native messaging. It makes no network requests.

1. Find the extension's ID on `chrome://extensions` (Developer mode on).
2. Run `native/install.sh <extension-id>`. Only the IDs you pass can talk to
   the helper, so pass the ID of each copy of the extension you use.
3. Reload the extension and open a new tab. Devices appear under "This device"
   and refresh every 5 minutes.

If Logi Options+ is installed, the helper also shows Logitech devices on a USB
receiver (such as an MX Master mouse or MX Keys keyboard), using the last
battery level that app saved. That level can lag the Options+ window, and
Logitech may change the format in an update. After updating the helper, re-run
`native/install.sh <extension-id>`.

Remove it with `native/install.sh --uninstall`. Without the helper nothing
changes. macOS doesn't report charging state for these devices, so there's no
charging indicator on them.

Your local card is anchored first and labels itself with your city
automatically. Don't like the guess? Type your own home label and it sticks.

A **12h / 24h** toggle in the top-right switches every time on the page at
once. Everything you change persists locally between tabs.

## Scrub to any moment

<p align="center">
  <img src="assets/screenshots/scrub.png" width="820" alt="Dashboard scrubbed to 4:30 PM — the big clock, every card, and every timeline frozen at the same instant, with a pause pill in the top-right showing the scrubbed time" />
</p>

Planning a call? Grab the marker on any timeline row and drag. The big local
clock, every card, and every other timeline jump to the same instant — so you
can read straight across: noon in San Francisco is 3pm in New York, 8pm in
London, tomorrow morning in Tokyo. Times snap to the quarter-hour as you go.

The page freezes while you explore, with a **⏸** pill up top showing the
moment you're parked at. Click it — or press **Esc** — to drop back to now.

## Disclaimers

Dashboard is a personal project, provided as is with no warranty. It is not
affiliated with or endorsed by Sean Oliver, Logitech, Apple, Open-Meteo, or any
other company named here. It is also more intrusive than a typical new-tab
extension, so know what it does before you install it:

- **It replaces your new tab page** and runs on every new tab you open.
- **Location.** It can ask for your browser's geolocation. If you allow it,
  your precise coordinates go to BigDataCloud to look up a city name. If you
  deny it, your IP address goes to ipwho.is, ipapi.co, or get.geojs.io instead.
- **Weather.** Your local zone's coordinates (rounded to about a kilometre) go
  to Open-Meteo every 30 minutes. Search text for city lookups goes to
  Open-Meteo too.
- **Battery.** "This device" uses Chrome's Battery Status API. It stays local.
- **Broad permissions.** `geolocation`, `nativeMessaging`, and host access to
  six domains (see `manifest.json`). Chrome will warn about some of them.
- **The macOS helper is optional and is native code.** `native/install.sh`
  installs a Perl script that Chrome launches **outside its sandbox, with your
  user's privileges**. It reads connected Bluetooth devices and their
  batteries from `system_profiler` and `ioreg`, and, if Logi Options+ is
  installed, the last battery levels in its settings database. It makes no
  network requests and stores nothing, but you should read `native/` before
  running it. Only the extension IDs you pass to the installer may talk to it.
  Remove it with `native/install.sh --uninstall`.
- **Unofficial data sources.** The Logitech levels come from Logi Options+'s
  internal files and may be stale or stop working after an update. Nothing
  here is supported by Logitech or Apple.
- **Not for shared or managed machines.** This is meant for devices you own.
  Review [PRIVACY.md](PRIVACY.md) for the full data flow.

## Install

Dashboard is distributed privately; there is no public Chrome Web Store
listing. To load it unpacked:

1. Clone or download this repo.
2. Open `chrome://extensions` and enable **Developer mode** (top right).
3. Click **Load unpacked** and select the project folder.
4. Open a new tab.

## Configure defaults

The starting set of cities lives in `config.js`, but it's only the first-run
seed — once you edit zones in the UI, your choices (stored locally) take over.
To change the out-of-box defaults, edit the `ZONES` array:

```js
export const ZONES = [
  { label: "You",    tz: "local",         lat: 40.7128, lon: -74.0060 },
  { label: "London", tz: "Europe/London", lat: 51.5074, lon: -0.1278  },
];
```

Each entry has a `label`, an IANA `tz` (or `"local"` for the browser's own
timezone), and `lat`/`lon` used to compute sunrise/sunset. Array order is the
display order; the `"local"` zone always renders first.

## Privacy

The extension has no servers, no accounts, no analytics, no tracking. Your
settings live in your browser. Location, if you allow it, is used to label
your local card and calculate its daylight accurately; the detected city and
coordinates are cached locally for 24 hours. The website runs the same new tab, stores its
settings in that site's `localStorage`, and never detects your location. Full
details in [PRIVACY.md](PRIVACY.md).

## Development

The extension has no build step — it uses vanilla ES modules. Run its unit
tests (time model, sun math, day-part bands) with:

```bash
node --test
```

The public website is an isolated Astro project:

```bash
cd web
pnpm install
pnpm dev       # local server
pnpm check     # Astro and TypeScript diagnostics
pnpm build     # static output in web/dist/
```

Project layout:

- `manifest.json` — MV3 manifest; overrides the new-tab page.
- `newtab.html` / `newtab.css` / `newtab.js` — page, styles, app wiring.
- `config.js` — first-run default zones. `cities.js` — bundled city dataset.
- `src/` — `timeModel.js`, `sun.js` (sunrise/sunset), `bands.js`,
  `dayPart.js`, `zones.js` (storage), `geo.js` (location), `layout.js`
  (responsive grid), `cityLookup.js` (remote search), `render.js`.
- `test/` — `node:test` unit suites. `web/` — Astro website.
- `docs/` — durable project memory, design notes, and roadmap.

Contributions welcome — see [docs/ROADMAP.md](docs/ROADMAP.md) for ideas.

## License

[MIT](LICENSE). Copyright © 2026 Sean Oliver (original Solstice) and © 2026
Sugu Sougoumarane (Dashboard changes). The MIT license requires keeping both
notices.
