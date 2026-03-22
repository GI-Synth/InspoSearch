
## BATCH 2 — PHASE 11: 20 New Sources Implementation

Build order within this phase:
1. Zero-setup sources first (B01–B08, B11–B17, B19–B20)
2. Light-key sources second (B09 Trove, B10 DigitalNZ)
3. Europeana bonus calls (B18) — no new function
4. Wikimedia featured call (B20) — no new function

---

### F-100 — All Batch 2 fetch functions present
- `fetchGetty()` present, returns `[]` on error
- `fetchNGA()` present, returns `[]` on error
- `fetchGBIF()` present, returns `[]` on error
- `fetchEOL()` present, two-step fetch, returns `[]` on error
- `fetchAPOD()` present, filters `media_type=image`
- `fetchGallica()` present, returns `[]` on error
- `fetchChroniclingAmerica()` present, builds image URL from `id`
- `fetchOpenverse()` present, returns `[]` on error
- `fetchTrove()` present, returns `[]` when no key
- `fetchDigitalNZ()` present, returns `[]` when no key
- `fetchBHL()` present, two-step, uses public demo key
- `fetchCarnegie()` present, returns `[]` on error
- `fetchPrado()` present, CORS try/catch, returns `[]` silently
- `fetchParisMusees()` present, POST GraphQL, returns `[]` silently
- `fetchYale()` present, builds IIIF url, returns `[]` on error
- `fetchPicsum()` present, keyword-gated to texture searches only
- `fetchUSGS()` present, returns `[]` on error
- `fetchCooperHewitt()` present, uses demo token
- 2 extra Europeana calls in `fetchAll` (fashion + textile)
- 1 extra Wikimedia featured call in `fetchAll`

---

### F-101 — fetchAll updated
- All new sources in `Promise.allSettled`
- Total parallel calls: ~40 (including all bonus calls)
- `perSource = Math.ceil(totalCount / 40)`
- All use `withTimeout(signal, 3000)`
- All use `onSourceResult()` pattern
- All wrapped in `.catch(() => {})` 

---

### F-102 — New state keys
- `STATE.troveKey` — `null` in STATE object, loaded from `localStorage.getItem('inspo_trove_key')` on init
- `STATE.digitalnzKey` — `null` in STATE object, loaded from `localStorage.getItem('inspo_digitalnz_key')` on init

---

### F-103 — New badge CSS
All 18 new badge classes present in `<style>`:
```css
.badge-getty       { background: rgba(180,140,20,0.75); }
.badge-nga         { background: rgba(20,60,120,0.75); }
.badge-gbif        { background: rgba(20,140,60,0.75); }
.badge-eol         { background: rgba(0,120,80,0.75); }
.badge-apod        { background: rgba(10,20,80,0.8); }
.badge-gallica     { background: rgba(0,80,160,0.75); }
.badge-chronicling { background: rgba(120,20,20,0.75); }
.badge-openverse   { background: rgba(200,80,0,0.75); }
.badge-trove       { background: rgba(0,100,60,0.75); }
.badge-digitalnz   { background: rgba(0,60,140,0.75); }
.badge-bhl         { background: rgba(60,120,20,0.75); }
.badge-carnegie    { background: rgba(160,40,40,0.75); }
.badge-prado       { background: rgba(140,0,20,0.8); }
.badge-parismusees { background: rgba(0,60,120,0.8); }
.badge-yale        { background: rgba(0,40,100,0.8); }
.badge-picsum      { background: rgba(80,80,80,0.6); }
.badge-usgs        { background: rgba(80,60,20,0.75); }
.badge-cooperhewitt{ background: rgba(200,60,0,0.75); }
```
Correct badge class and label text assigned per `item.source` in `renderGrid()`.

---

### F-104 — Keys panel updated
New rows in `KEY_SOURCES` array:
- Getty — always active, no key, `alwaysOn: true`
- NGA — always active, no key, `alwaysOn: true` 
- GBIF — always active, no key, `alwaysOn: true`
- EOL — always active, no key, `alwaysOn: true`
- NASA APOD — always active, DEMO_KEY built in, `alwaysOn: true`
- Gallica — always active, no key, `alwaysOn: true`
- Chronicling America — always active, no key, `alwaysOn: true`
- Openverse — always active, no key, `alwaysOn: true`
- BHL — always active, public key built in, `alwaysOn: true`
- Carnegie — always active, no key, `alwaysOn: true`
- Prado — always active (CORS best-effort), `alwaysOn: true`
- Paris Musées — always active (CORS best-effort), `alwaysOn: true`
- Yale — always active, no key, `alwaysOn: true`
- Picsum — always active (texture searches only), `alwaysOn: true`
- USGS — always active, no key, `alwaysOn: true`
- Cooper Hewitt — always active, demo token built in, `alwaysOn: true`
- Trove — key input, `alwaysOn: false`, `stateKey: 'troveKey'`, `storageKey: 'inspo_trove_key'`, getKeyUrl: `https://trove.nla.gov.au/about/create-something/using-api`
- DigitalNZ — key input, `alwaysOn: false`, `stateKey: 'digitalnzKey'`, `storageKey: 'inspo_digitalnz_key'`, getKeyUrl: `https://digitalnz.org/developers`

---

### F-105 — No regressions
- All existing 20 sources still wired in `fetchAll`
- No duplicate card IDs (`seenIds` Set prevents duplication)
- Slider `max` updated to `150`
- Default image count stays `24`
- `IMAGE_COUNT_MAX` constant updated to `150`
