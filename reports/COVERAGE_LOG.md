# InspoSearch source coverage log

Running log of every `node scripts/audit-coverage.js` run. Add a new entry on top when you run it. Each entry summarises the bucket counts and links to the full timestamped report in this folder.

**What the audit measures:** for every ID in `ALL_SOURCES` (285 after post-sweep), fires 4 representative queries (`van gogh`, `butterfly`, `cathedral`, `ancient map`) and categorises:
- **active** — at least one query returned >=1 item
- **silent** — every query returned `[]`
- **errored** — every query threw (rare; most fetchers catch and return `[]`)
- **mixed** — some empty, some error, no hits
- **unmapped** — no dispatch path found for the ID

**Known caveats when reading these numbers:**
- Node can't reach API-key-gated sources (Europeana, Harvard, Pexels, Trove, DPLA, Unsplash, Pixabay) — they short-circuit to `[]` and land in `silent`. Real browser users with keys in `localStorage` will see them contribute.
- Relative `/data/*.json` fetches used by `fetchFromDataCache` fail in Node unless the script patches `globalThis.fetch` to read from `insposearch/data/` on disk. Without the shim, all 113 WD_PHASE_H sources falsely bucket as `silent`. The current script includes the shim.
- `loc` and `wdl` bucket as `unmapped` because they dispatch via `PAGE2_FETCHERS` instead of `callIfHealthy`. Both actually work in-browser; the audit script's regex doesn't cover that path yet.
- Adapters pointed at dead upstream URLs still catch the 4xx via `safeFetch` and return `[]` → they show as `silent`, not `errored`.

---

## 2026-04-22 17:13 — first browser-side audit (Playwright vs local server)

Report: [coverage-browser-2026042217133.md](coverage-browser-2026042217133.md)
Script: [scripts/audit-coverage-browser.js](../scripts/audit-coverage-browser.js)

| Bucket | Count | % of 297 |
|--------|------:|---------:|
| active |    17 |     5.7% |
| silent |   280 |    94.3% |

Methodology: real Chromium against `npx serve insposearch -l 3000`, fires the same 4 queries via `window.runSearch`, scrolls to surface lazy-loaded items, then counts distinct `data-source` attrs on rendered cards. Canonical list = `ALL_SOURCES` (284) ∪ manifest IDs in `insposearch/sources.manifest.json` (15) = **297 unique** advertised sources.

**This is the measurement we actually care about.** It supersedes the Node audit's 169/284 number as the realistic ceiling for what users see today.

| Query        | Total cards | Distinct sources |
|--------------|------------:|-----------------:|
| van gogh     |         152 |               13 |
| butterfly    |         254 |               15 |
| cathedral    |         189 |               12 |
| ancient map  |          91 |                7 |

The 17 active set:
```
ala, cleveland, david_rumsey, digital_commonwealth, finna, inaturalist, met,
museum_digital_{bawue, hessen, nat, rhineland, sachsen, smb, westfalen},
smk, va, wellcome
```

**Why the gap with the 169/284 Node number** (the Node audit, run a few hours earlier, called the same adapters directly):
1. **`selectDynamicSources` budget gating** — even a fully-functional adapter doesn't fire on every query. The orchestrator picks top-N sources per query by intent score; everything else is held back. So 4 queries × ~12-15 dispatched sources ≈ ~17 unique distinct contributors. The 152 silent-but-Node-active sources are *eligible*, not *invoked* on this query set.
2. **Browser CORS** — direct adapters that lacked the `Origin: localhost:3000` allowlist on their upstream return 0 in browser even though Node ignored CORS. 813 console errors across the session, mostly `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` (Cornell, NYPL, Maas, NOAA, SMG, Louvre Abu Dhabi, …).
3. **Missing `localStorage` API keys** — Europeana, Harvard, DPLA, Smithsonian, Trove, Pexels, Pixabay, Unsplash adapters all short-circuit on `if (!STATE.xxxKey) return []`. Roadmap step #1 (shared worker-side keys) is the unlock.
4. **`fetchFromDataCache` works in browser too** but those WD_PHASE_H sources never get *picked* by the dispatcher on these 4 queries — the museum_digital_* family contributes because they score high on art queries; the rest sit silent waiting for a matching query.

What this changes for the roadmap:
- The 169 Node number was misleading — it counted *eligibility*, not *contribution*. The honest baseline is **17 of 297 firing on a typical search**.
- Step #1 (shared keys) probably surfaces ~15-25 extra contributors per session since key-gated adapters are heavily weighted in `selectDynamicSources`.
- Step #3 (debug ~62 unknown-silent) is much smaller than it sounded — a meaningful chunk of those are silent-because-not-picked, not silent-because-broken. Need a wider query sweep (10-20 queries spanning all intent classes) before debugging.

Suggested next browser-audit run: **10 queries spanning the homepage categories** (painting/photography/sculpture/architecture/manuscript/map/textile/print/ceramic/botanical) — that matches the original April 22 sweep and gives a fairer denominator for "active across realistic usage."

---

## 2026-04-22 09:22 — placeholder cache repopulation (+8 active sources)

Report: [coverage-2026042209224.md](coverage-2026042209224.md)

| Bucket   | Count | % of 284 |
|----------|------:|---------:|
| active   |   169 |    59.5% |
| silent   |   115 |    40.5% |
| errored  |     0 |     0.0% |
| mixed    |     0 |     0.0% |
| unmapped |     0 |     0.0% |

Changes since 08:43:
- All 8 placeholder cache files now hold real data after fixing their fetchers in `scripts/fetch-cors-blocked.js`. Net delta: **+8 active, −8 silent**.
- Root causes were a mix of two failure modes:
  - **Wrong/stale Wikidata QIDs** (5 sources): `belvedere` Q485700→Q303139 (2732 imgs), `vangogh_museum` Q272671→Q224124 (446), `rmfab` Q2407552→Q377500 (962), `npm_taipei` Q673651→Q540668 (1054), `guimet` Q205963→Q860994 (363). Original QIDs returned 0 items via `wdt:P195` so the nightly run wrote no items each time.
  - **Dead direct API endpoints** (3 sources): `nhm_london` had a stale `resource_id` (HTTP 409) — bumped to `05ff2255-c38a-40c9-b657-4ccb55ab2feb` and rewrote the mapping to use `associatedMedia[].identifier` instead of the non-existent `accessURI` field. `wallace_collection` (HTTP 404 — site moved from `/emuseum/api` to `/eMP/eMuseumPlus`) and `fitzwilliam` (HTTP 401 — API now requires auth) were both rewritten to use Wikidata fallbacks (Q1327919 / Q1421440).
- Added `--only=id1,id2,...` CLI filter to `fetch-cors-blocked.js` so we can re-run a subset without hammering all 154 sources or stomping `_index.json`.

Cache file sizes after the run (was 77 bytes each):

| Source             | Bytes   |
|--------------------|--------:|
| belvedere          | 258,550 |
| fitzwilliam        | 253,449 |
| npm_taipei         | 255,528 |
| wallace_collection | 217,047 |
| rmfab              | 216,340 |
| vangogh_museum     | 180,021 |
| nhm_london         |  97,052 |
| guimet             |  92,654 |

Per-query yields all healthy (15–20 items per query for 7 of 8; `wallace_collection` only returns 1 for `cathedral` but 20 for the rest; `vangogh_museum` returns 5 for `van gogh` because the museum's collection is actually his contemporaries' work, not his own).

Note for the future: there's a separate (out-of-scope) data-correctness bug — `textile_museum_tilburg` uses QID `Q1421440`, which is actually Fitzwilliam Museum. The cache returns 266KB of items, just not the right ones. The proper TextielMuseum Tilburg QID is Q3983824, but it has 0 items in Wikidata, so this can't be fixed by a QID swap alone. Tracked but not actioned.

---

## 2026-04-22 08:43 — quick-fix pass (HEALTH_MISS_LIMIT=5, wdl removed, PAGE2_FETCHERS parsed)

Report: [coverage-2026042208430.md](coverage-2026042208430.md)

| Bucket   | Count | % of 284 |
|----------|------:|---------:|
| active   |   161 |    56.7% |
| silent   |   123 |    43.3% |
| errored  |     0 |     0.0% |
| mixed    |     0 |     0.0% |
| unmapped |     0 |     0.0% |

Changes since 08:25:
- `wdl` removed from `ALL_SOURCES` and 4 intent groups — no `fetchWDL` ever existed (World Digital Library was folded into LoC in 2021). Total drops 285 → 284.
- `loc` now correctly bucketed **active** (butterfly=15, cathedral=15, ancient map=15). Audit script's dispatch regex was extended to parse `PAGE2_FETCHERS` as well as `callIfHealthy(...)`.
- `unmapped` bucket is now empty ✓
- `HEALTH_MISS_LIMIT` raised from 3 → 5 (state.js); doesn't affect audit but makes the live app more forgiving to genuinely slow-but-alive sources.

Also discovered (not a bucket change, but an actionable gap): 8 WD_PHASE_H cache files in `insposearch/data/` are 77-byte placeholders — `{"items":[],"_placeholder":true,"_note":"Awaiting nightly fetch population"}`. Nightly pipeline has never successfully populated them. Affected sources: `belvedere`, `fitzwilliam`, `guimet`, `nhm_london`, `npm_taipei`, `rmfab`, `vangogh_museum`, `wallace_collection`. All 8 currently sit in the silent bucket — populating their caches would move them to active without any code changes.

---

## 2026-04-22 08:25 — post-sweep re-run (with `/data/` fetch shim)

Report: [coverage-2026042208251.md](coverage-2026042208251.md)

| Bucket   | Count | % of 285 |
|----------|------:|---------:|
| active   |   162 |    56.8% |
| silent   |   121 |    42.5% |
| errored  |     0 |     0.0% |
| mixed    |     0 |     0.0% |
| unmapped |     2 |     0.7% |

Delta vs. 08:22 run: **+146 active, −146 silent**. The jump is not a real-world improvement — it's the `patchFetchForDataCache()` shim catching up to what the deployed browser build already reads. WD_PHASE_H sources (Wikidata museum caches) all flipped from `silent` → `active`.

Of the remaining 121 silent:
- **~50 key-gated** (euro_*, dpla_*, harvard/pexels/trove/unsplash/pixabay) — would activate with shared worker-side keys.
- **9 intentional stubs** from the Layer 1 sweep (ago, mak, mna, lacma, munch, mauritshuis, pem, npg, chronicling) — dead upstreams; left returning `[]` deliberately.
- **~62 unknown** — a mix of smithsonian sub-units missing from the Node adapter path, wd_phase_h sources with empty cache JSON, and direct adapters whose upstreams either require headers the Node fetch doesn't send or hit CORS proxies that only run browser-side.

Unmapped: `loc`, `wdl` — both work in-browser via `PAGE2_FETCHERS`; audit regex limitation only.

---

## 2026-04-22 08:22 — first run, pre-shim

Report: [coverage-2026042208225.md](coverage-2026042208225.md)

| Bucket   | Count | % of 285 |
|----------|------:|---------:|
| active   |    16 |     5.6% |
| silent   |   267 |    93.7% |
| errored  |     0 |     0.0% |
| mixed    |     0 |     0.0% |
| unmapped |     2 |     0.7% |

Baseline. Matches the browser-side Playwright sweep from [AUDIT_CATEGORIES_2026-04-22.md](../AUDIT_CATEGORIES_2026-04-22.md) (16 contributing sources across 10 homepage categories). The script was missing the `/data/` fetch shim, so all 113 WD_PHASE_H cache-only sources are under-counted in this row — see the 08:25 re-run above for a corrected picture.

Active (identical to browser sweep): `ala, apod, cleveland, eol, finna, gbif, idigbio, inaturalist, joconde, louvre, met, nasa, nasa_images, smk, va, wellcome`.

---

## How to run

```bash
node scripts/audit-coverage.js
# or with custom knobs:
node scripts/audit-coverage.js --queries "impressionism,fossil,manuscript,celtic" --timeout 20000 --concurrency 10
```

Then add a new entry at the top of this file summarising the bucket counts and calling out anything that shifted vs. the previous run.
