# Chrome Web Store — listing copy & submission guide

Everything needed to publish Dashboard. Copy/paste the listing fields, upload
the prepared assets, and follow the submission steps. Items marked **(you)**
require your own Chrome Web Store developer account and can't be automated.
This fork is meant for **private distribution** (see "Private distribution" below).

## Package

Upload artifact: `dashboard-<version>.zip` (repo root, git-ignored — rebuild
any time; the version is read from `manifest.json`, which must be bumped
before each upload):

```bash
V=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
rm -f dashboard-*.zip
zip -rq "dashboard-$V.zip" \
  manifest.json newtab.html newtab.css newtab.js config.js cities.js \
  src assets/icons assets/fonts -x '*.DS_Store'
```

Contains only runtime files, icons, and the bundled font — no docs, tests, screenshots, or README.

## Listing fields

- **Name:** `Dashboard`
- **Summary** (short description, ≤132 chars) — NOT editable in the dashboard;
  it is read from `manifest.json`'s `description`, so changing it means a new
  package upload:
  `A calm new tab with a clock for every time zone, daylight at a glance, local weather, and battery levels for your devices.`
- **Category:** Functionality & UI _(alternate: Workflow & Planning)_ — new-tab
  overrides cluster here, which helps the "similar extensions" rail surface
  Dashboard alongside peers. Reversible post-launch.
- **Language:** English

### Detailed description

```
Dashboard turns your new tab into a calm map of time: a big local clock up top,
a card for every place you care about, and a 24-hour timeline below.

Day and night bands follow each city's actual sunrise and sunset. Warm is
daytime, gray is night, and a teal band marks 9-to-5. Night fades into day
through twilight. You can tell who's asleep, who's mid-morning, and who's
already into their evening.

• Jump to any time: drag any timeline marker and every clock moves to that
  time, so you can find an hour that works for the whole group.
• Daylight saving warnings: a zone shows "−1h in 4d" the week before daylight
  saving starts or ends.
• Light, dark, and accent colors: follow your system or pick a theme, then
  choose from five accent colors.
• Yours in seconds: add or remove cities, drag to reorder, rename a zone to a
  person's name, and switch between 12h and 24h.
• Local weather: temperature, conditions, wind, humidity, and cloud cover for
  your local zone, beside the big clock.
• Battery: this computer's battery, plus (macOS, optional helper) connected
  Bluetooth devices and Logitech devices on a USB receiver.
• Quiet by design: muted palette, monospace numerals, nothing blinking for
  your attention.

Dashboard has no accounts, feeds, analytics, or tracking. Your settings are
stored in your browser. Open a tab, get your bearings, move on.

Before you install: Dashboard replaces your new tab, can use your location, and
sends rounded coordinates to Open-Meteo for weather. The optional macOS helper
is native code that runs outside Chrome with your user's privileges. It is a
personal project based on Solstice by Sean Oliver, is not affiliated with him
or with Logitech or Apple, and is provided as is. See the README disclaimers.
```

## Assets (all prepared in `assets/store/`)

- **Store icon:** `assets/icons/icon-128.png` (128×128).
- **Screenshots** (1280×800, upload all 5; the store allows up to 5). Captured
  from the 1.2.0 package at Wed, Oct 21, 2026, 10:00 in San Francisco, so
  London shows the daylight saving chip:
  - `assets/store/store-hero.png`: the default dark view.
  - `assets/store/store-light.png`: the light theme.
  - `assets/store/store-scrub.png`: scrubbed to 4:30 PM.
  - `assets/store/store-edit.png`: Edit panel with theme, accent, and city search.
  - `assets/store/store-accent.png`: light theme, violet accent, Edit panel open.
- **Small promo tile** (440×280, required): `assets/store/store-promo.jpg`
  (JPEG — the dashboard rejects PNGs with an alpha channel).
  Minimal icon-on-dark tile.

## Privacy tab (required before submission)

- **Single purpose:** "A new-tab dashboard that shows the current time across
  multiple time zones with day-night shading, plus local weather and device
  battery levels."
- **Permission justifications:**
  - `geolocation` — Optional. Used to label the user's local card with a
    nearby city name and calculate accurate sunrise/sunset bands for that
    location. The user is never forced to grant it; the card falls back to IP
    location or the browser's time-zone name. The detected city and coordinates
    are cached locally for 24 hours; coordinates are sent only to the
    reverse-geocoding endpoint to resolve the city name.
  - Host `api.bigdatacloud.net` — reverse-geocode granted coordinates → city name.
  - Hosts `ipwho.is`, `ipapi.co`, `get.geojs.io` — IP-based city fallback when
    geolocation is denied or unavailable (tried in order).
  - Host `geocoding-api.open-meteo.com` — city search when adding a zone whose
    name isn't in the bundled dataset.
  - `nativeMessaging` — Optional. Talks to a user-installed macOS helper
    (`native/install.sh`) that reads battery levels of connected Bluetooth
    devices, plus the last battery levels Logi Options+ saved for Logitech
    devices on a USB receiver. Web pages can't read these. The helper makes no network requests;
    without it the feature stays off.
  - Host `api.open-meteo.com` — current weather for the local zone (rounded
    coordinates; cached locally for 30 minutes).
- **Data usage disclosures:** Declare **location** (approximate or precise,
  only if the user allows it, otherwise derived from the IP address). It is
  sent to third-party services as described in `PRIVACY.md` (BigDataCloud,
  Open-Meteo, and the IP lookup providers) and is not stored by the developer
  or sold. No analytics, no remote logging, no accounts. A detected city and
  coordinates are cached locally for 24 hours to label the local card and
  calculate daylight; weather is cached for 30 minutes.
- **Privacy policy URL:** `https://github.com/sougou/dashboard/blob/main/PRIVACY.md`
  (the repo must be public so reviewers and testers can open it)
- **Website (Store listing → Additional fields → Official URL / Homepage URL):** `https://github.com/sougou/dashboard`

## Submission steps **(you)**

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
   If this is the first publish, pay the one-time **$5** developer registration.
2. **New item** → upload `dashboard-<version>.zip`.
3. Fill the **Store listing** tab with the fields above; upload the icon and
   2–3 screenshots (and the promo tile if you want).
4. Fill the **Privacy practices** tab with the single-purpose statement, the
   per-permission justifications, the data-usage disclosures, and the policy URL.
5. Set **Distribution** to **Private** (trusted testers, by Google account) or **Unlisted**, not Public.
6. **Submit for review.** New-tab overrides get extra scrutiny — review can take
   a few days. If rejected, the reason is usually a permission justification;
   tighten the wording above and resubmit.

## Store item

- **Store ID:** `akjlmhmbflomlldkmkmcfodacnijfkcl` (draft created 2026-10-23).
  It stays the same for the life of the item, across versions and visibility
  changes. `native/install.sh` has it built in as `STORE_ID`.

## Test instructions (Access → Test instructions)

Paste this for reviewers:

```
No account or login is needed. Open a new tab to see the clock, weather, and
"This device" battery. Location is optional: deny the prompt and it falls back
to an IP lookup or the time zone. The nativeMessaging permission is used only by
an optional macOS helper that the user installs separately from the GitHub repo
(native/install.sh). Without it, the extension works and the Bluetooth and
Logitech battery rows are simply absent. The helper makes no network requests.
```

## Private distribution

- The store package never includes `native/`. The macOS helper is installed
  separately with `native/install.sh`, which always allows this listing's
  `STORE_ID` plus any unpacked IDs you pass. Sean's original listing never has
  access.
- Keep the README disclaimers and the paragraph in the description; they are
  what reviewers and testers see about the extension's reach.

## Notes

- The 5 remote host permissions are the most likely review question. They're all
  small, single-call geocoding/IP lookups with no data collection — the
  justifications above map each host to its one job. If review pushes back, the
  fallback is to drop the IP-geolocation hosts (`ipwho.is`, `ipapi.co`,
  `get.geojs.io`) and rely on the browser geolocation prompt alone.
- Version stays `1.0.0` for the first publish; bump on each subsequent upload.
```
