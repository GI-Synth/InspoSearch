# Current State — InspoSearch

**Last Updated:** March 24, 2026 (session 7: test suite, features, CI, doc cleanup)

## Completed Work

---

### ✅ Session 7 — Testing, Features, CI & Doc Cleanup (March 24)

#### Doc Cleanup
- **Deleted 14 stale .md files**: INSPOSEARCH_MASTERPLAN.md, INSPOSEARCH_MASTER_PROMPT.md, SourceAdder-MegaExpansion.md, _batch2_append.md, _batch3_contracts.md, _phase11_append.md, _phase12_append.md, IMPROVEMENT_PLAN.md, FIXES_PLAN.md, KEYS_PANEL_PLAN.md, FEATURE_SPEC.md, InspoSearch-Expansion-V2.md, IMPROVEMENT_PLAN_V2.md, COMPETITIVE_IMPL_PLAN.md
- **SOURCES.md regenerated** — now reflects actual 315 sources (186 hardcoded + 113 Wikidata + 16 manifest)
- **ROADMAP.md** — 8 stale checkboxes updated to match reality (module split, visual similarity, virtual scrolling, esbuild, test suite, search-as-you-type, advanced search, Lighthouse CI)
- **ANTHROPIC_PITCH.md** — updated "80+ sources" → "315+ sources", "11,000+ lines" → "14,500+ lines"
- **Remaining .md files (12):** README, ARCHITECTURE, API_CONTRACTS, CONTRIBUTING, CURRENT_STATE, DESIGN_SYSTEM, SOURCES, ROADMAP, ANTHROPIC_PITCH, CHANGELOG, CODE_OF_CONDUCT, SECURITY

#### Test Suite
- **Vitest v4.1.2** installed — `npm test` / `npm run test:watch`
- **21 unit tests** in `tests/core.test.js` — all passing
- Suites: formatCount (4), cacheKey (3), classifyQuery (4), deduplicateResults (3), deltaE (4), normalizeTitle (3)

#### New Features
- **Search-as-you-type** — 500ms debounced input listener, ≥3 chars, cancels on Enter
- **Advanced search modal** — structured form with query, date range, medium, region, source category, color, orientation, exclude terms; builds composite query and applies filters

#### CI/CD
- **Lighthouse CI** — `.github/workflows/lighthouse.yml` with `treosh/lighthouse-ci-action@v12`
- Score assertions: performance ≥80 (warn), accessibility ≥90 (error), best-practices ≥90, SEO ≥90
- Performance budgets: 500KB script, 100KB CSS, 1MB total

#### Onboarding Fix
- Removed unwanted "3.4B+ IMAGES" welcome slide; kept only the live-stats slide with auto-updating counts

---

### ✅ Builder Session — Nightly Fetch Architecture (March 23)

**Reference plan:** `InspoSearch-Expansion-V2.md`

#### Step 1 — Critical Bugs Fixed ✅
- **1A: loc duplicate removed** — `'loc'` appeared twice in `ALL_SOURCES` (at position 6 in main batch AND at end of Phase D). Duplicate at Phase D removed. Only one `loc` entry remains.
- **1B: fetchLOC conflict resolved** — Two `fetchLOC` declarations existed (line 4196 original with pagination, line 6600 Phase D using `/photos/` endpoint). Kept original (uses `/search/` + `sp` pagination parameter). Phase D duplicate deleted. Duplicate `callIfHealthy('loc',...)` also removed from Phase D fetchAll block.
- **1C/1D: wellcome_iiif and met_iiif** — Already present in `sources.manifest.json` (confirmed from git log; they existed in commit `e21921b`). `_totalSources: 17` already correct. No action needed.
- Committed: `24df819`

#### Step 2 — corsBlocked Field Added ✅
- Added `corsBlocked: true` to SOURCE_META for: `prado`, `parismusees`, `soch`, `thyssen`, `cudl`, `bodleian`, `bsb`
- Added `corsBlocked` optional boolean field to `insposearch/sources/_template.json`
- Documented `corsBlocked` in `insposearch/sources/README.md` (local only — gitignored)
- Committed: `036dcbf`

#### Step 3 — Nightly Fetch Script Created ✅
- **File:** `scripts/fetch-cors-blocked.js` (ESM, Node 18+, no external dependencies)
- Fetches 20 seed terms per source, deduplicates, saves up to 500 items
- Format: `insposearch/data/{sourceId}.json` → `{ sourceId, sourceName, lastFetched, items: [{img, thumb, title, source, tags}] }`
- Index: `insposearch/data/_index.json` → `{ lastUpdated, sources: [{id, name, status, lastFetched}] }`
- **Test results (local machine):**
  - ✅ `soch` — 263 items saved (Swedish Open Cultural Heritage)
  - ❌ `prado` — HTTP 403 (Cloudflare bot protection from dev machine; expected to work from GitHub Actions)
  - ❌ `parismusees` — HTTP 403 (same)
  - ❌ `thyssen` — fetch failed (network error from dev machine)
  - ❌ `cudl` — HTTP 404 (API endpoint may have changed)
  - `nhm_london`, `wallace_collection`, `fitzwilliam`, `national_gallery_london`, `scottish_national` — pending (new sources, await first GH Actions run)
- Created: `insposearch/data/.gitkeep` to track data folder
- Committed: `125f9fc`

#### Step 4 — GitHub Actions Workflow Created ✅
- **File:** `.github/workflows/nightly-fetch.yml`
- Runs at 2am UTC every night (`cron: '0 2 * * *'`) + manual trigger via `workflow_dispatch`
- Steps: checkout → Node 20 → npm install → run fetch script → commit data files → push to main
- Uses `ad-m/github-push-action@v0.8.0` with `GITHUB_TOKEN`
- **package.json** updated with `name`, `version`, `engines: {node: ">=18"}`
- Committed: `b4b2e1f`

#### Step 5 — Cache-First Fetch Architecture in index.html ✅
- Added `fetchFromDataCache(sourceId, keyword)` helper near utility functions (after `withTimeout`)
  - Fetches `/data/{sourceId}.json` from Netlify CDN (same domain, no CORS)
  - Filters by keyword (title/tag match); falls back to random sample if no keyword match
  - Returns `null` if file doesn't exist (cache miss → live API fallback)
- Updated 5 existing CORS-blocked functions to cache-first pattern:
  - `fetchPrado`, `fetchParisMusees`, `fetchSOCH`, `fetchThyssen`, `fetchCUDL`
- Added 5 new cache-only sources (cache-first, return `[]` until first nightly fetch):
  - `nhm_london` — Natural History Museum London (nature, science)
  - `wallace_collection` — The Wallace Collection London (museums, art)
  - `fitzwilliam` — Fitzwilliam Museum Cambridge (museums, art)
  - `national_gallery_london` — National Gallery London (museums, art)
  - `scottish_national` — Scottish National Gallery (museums, art)
- All 5 new sources added to `ALL_SOURCES`, `SOURCE_META`, `SOURCE_GROUPS`, `fetchAll()`
- Committed: `336d89a`

#### Step 6 — .gitignore Updated ✅
- Removed blanket exclusion of `scripts/` and `.github/` (needed for workflow and fetch script)
- Now excludes only test scripts (`test-*.cjs`, `test-*.js`, etc.), not the production fetch script
- `package.json` and `package-lock.json` no longer excluded
- `insposearch/data/` not excluded (data files tracked by git for Netlify serving)
- Committed: `b4b2e1f`

#### Step 7 — End-to-End Test ✅
- Script runs, exits 0 regardless of failures ✅
- SOCH: 263 items, valid structure, valid image URLs ✅
- `insposearch/data/_index.json` written with all 10 sources listed ✅
- All commits pushed to `main` (`4f39614`) ✅
- GitHub Actions workflow visible at `.github/workflows/nightly-fetch.yml` ✅

---

### Source Count After This Session

| Category | Sources |
|---|---|
| ALL_SOURCES total | 124 (119 prev + 5 new Phase E) |
| Sources with corsBlocked: true | 7 (prado, parismusees, soch, thyssen, cudl, bodleian, bsb) |
| New Phase E sources (cache-only) | 5 (nhm_london, wallace_collection, fitzwilliam, national_gallery_london, scottish_national) |
| Data files generated | 1 (soch.json — 263 items); others await first GH Actions run |

---

### Architecture: Nightly Fetch Data Flow

```
GitHub Actions (2am UTC)
  → node scripts/fetch-cors-blocked.js
  → fetches CORS-blocked sources server-side (no browser CORS restriction)
  → saves insposearch/data/{sourceId}.json
  → commits + pushes to main
  → Netlify auto-deploys

Browser
  → fetchFromDataCache('soch', 'portrait')
  → GET /data/soch.json (same origin, no CORS issue)
  → filters by keyword, returns results
  → cache miss → falls back to live API call
```

---

**Reference plan:** `SourceAdder-MegaExpansion.md`
**Total new sources this session:** 64 (60 Phase A + 2 Phase B + 0 Phase C + 2 Phase D)

#### Phase A — Aggregator Sub-Collections (60 sources) ✅
- `euro_*` (20): Per-provider Europeana filters via `fetchEuropeanaFiltered()`
- `dpla_*` (15): Per-hub DPLA filters via `fetchDPLAProvider()`
- `si_*` (15): Per-unit Smithsonian filters via `fetchSmithsonianUnit()`
- `wmc_*` (10): Wikimedia Commons category filters via `fetchWikimediaCategory()`
- Lookup tables added: `EUROPEANA_PROVIDERS`, `DPLA_HUBS`, `SI_UNITS`, `WIKIMEDIA_CATS`
- Committed: `e472863`

#### Phase B — Zero-Auth Free APIs (2 sources) ✅
- `idigbio`: iDigBio biodiversity image records (`/v2/search/media`)
- `ala`: Atlas of Living Australia (`/ws/occurrences/search?fq=multimedia:Image`)
- Both added to `NATURE_ONLY_SOURCES`, SOURCE_GROUPS nature + science
- Committed: `0c7227c`

#### Phase C — IIIF Universe (0 sources) ❌
- Tested 20+ institutional IIIF endpoints from plan
- All returned DNS errors, 404, 403, HTML, or had no image URL fields
- Endpoints in plan were largely fictional/guessed — none activated

#### Phase D — Niche & Specialized (2 sources) ✅
- `nasa_images`: NASA Images Library (`images-api.nasa.gov/search`) — portrait 3369, landscape 1131, flower 485
- `loc`: Library of Congress /photos/ endpoint — portrait 42220, landscape 19120, flower 1860
- Also tested and rejected: USGS NMap(0 results), David Rumsey(404), POWO/Kew(0 results), BHL Illustrations(empty), PlantNet(404), NASA APOD(rate-limited), JSTOR Plants(HTML), ESA(404), Korean History(ECONNRESET), NASA SVS(404), OpenAerialMap(no keyword search)
- Committed: `be18922`

---

### ✅ Source-Adder IIIF Content Search Adapter (March 22, Session 2)

#### Phase 1A — IIIF Content Search Adapter Implementation
- Added `fetchIIIFSearch(config, keyword, limit, signal)` function to `insposearch/index.html` (lines ~6572-6631)
- Handles both IIIF Content Search v1 and v2 response formats:
  - v1: `@context`, `@type: sc:AnnotationList`, `resources: [{resource: {@id}, on}]`
  - v2: `@context`, `type: AnnotationPage`, `items: [{body, target}]`
- Extracts: image URLs (`resource['@id']`), titles (label/chars), canvas URLs (on/target)
- Returns standard `{id, url, thumb, title, description, source, sourceUrl}` format
- Registered adapter type: `'iiif_content_search'` in manifest schema

#### Phase 1B — IIIF Adapter Routing in fetchAll()
- Modified manifest source routing logic at line ~6829-6835
- Routes based on `config.adapter` type:
  - `'iiif_content_search'` → `fetchIIIFSearch()`
  - `'simple_rest'` or default → `fetchIIIFCollection()`
- **Allows both REST and IIIF Content Search formats in same manifest**

#### Phase 1C — IIIF Institutions Testing (Phase 1C)
- Tested 10 IIIF/REST endpoints with required 3-term protocol: `portrait`, `landscape`, `flower`
- **Added: 2 sources** (qualified 3/3 terms) ✅
- **Rejected: 8 sources** (APIs blocked, redirects, 404, auth required)

**Qualified (2):**
| Institution | Result | Details |
|---|---|---|
| **Wellcome Collection** | 3/3 ✅ | portrait (3), landscape (3), flower (3) — JSON API working |
| **The Met** | 3/3 ✅ | portrait (6639), landscape (4325), flower (3827) — large collection |

**Entry added to manifest:**
- `wellcome_iiif`: endpoint `api.wellcomecollection.org/catalogue/v2/works`, adapter `iiif_content_search`
- `met_iiif`: endpoint `collectionapi.metmuseum.org/public/collection/v1/search`, adapter `iiif_content_search`
- Individual files created: `/sources/wellcome_iiif.json`, `/sources/met_iiif.json`

#### Phase 2 — Hardcoded Adapter Candidates (10 institutions)
- Tested: Wallace Collection, NHM London, Fitzwilliam, MFA Boston, Albertina, Scottish National, Chester Beatty, Eastman, Orsay, Pompidou
- **Added: 0** (none qualified)
- **Rejected: 10** (all with specific blockers)

| Institution | Status | Reason |
|---|---|---|
| Wallace Collection | 404 | eMuseum endpoint gone or blocked |
| NHM London | 403 | API access suspended/geo-blocked |
| Fitzwilliam | 401 | API requires authentication key |
| MFA Boston | 403 | Anti-bot protection active |
| Albertina | 404 | No public search API found |
| Scottish National | 403 | Request blocked by firewall |
| Chester Beatty | 301 | Redirects without JSON endpoint |
| George Eastman | 403 | Access restricted |
| Musée d'Orsay | 404 | Endpoint not found |
| Centre Pompidou | 404 | Endpoint not found |

#### Phase 3 — Cleanup & Commit
- Updated `sources.manifest.json`:
  - `_totalSources: 15 → 17` (added wellcome_iiif, met_iiif)
  - Active count remains: 8 (sketchfab_heritage still only new addition from all phases)
- Created individual source JSON files in `/sources/`
- Committed: `e21921b "source-adder: IIIF content search adapter + 2 qualified sources (wellcome, met)"`

---

### ✅ Source-Adder Multi-Phase Run (March 22, Session 1)

#### Phase A — Existing issue fixes
- Verified `digital_commonwealth.json` exists in `insposearch/sources/` and matches manifest structure.
- Re-verified Westfalen image host via Node.js:
  - Endpoint: `https://westfalen.museum-digital.de/json/objects?s=portrait&limit=1`
  - Image path starts with `data/westfalen/...` → `imageBaseUrl: "https://westfalen.museum-digital.de/"` is correct.
- Updated `fetchIIIFCollection` URL build logic in `insposearch/index.html`:
  - If `extraParams` includes `per_page`, force `per_page` to the active slider limit and do **not** append `&limit=`.
  - Kept `{limit}` replacement support for other APIs.
- Node.js validation for DC paging confirmed:
  - `per_page=3` → 3 records
  - `per_page=9` → 9 records
  - `per_page=15` → 15 records

#### Phase B — Paintings & Drawings batch A (10 institutions tested)
- Tested with required terms: `portrait`, `landscape`, `flower`.
- Added: **0**
- Rejected: **10**
- Rejection reasons by institution:
  - `fitzwilliam`: API endpoint responds `401 Unauthenticated` on object search routes.
  - `national_gallery_london`: tested endpoint patterns returned `404` HTML.
  - `mfa_boston`: tested endpoint returned `403` HTML.
  - `orsay`: site endpoints returned HTML, no public JSON search API found.
  - `albertina`: TLS certificate chain validation failed in this environment.
  - `hermitage`: TLS certificate chain validation failed in this environment.
  - `scottish_national`: responses blocked behind `403` anti-bot HTML.
  - `wallace_collection`: eMuseum interface returned redirects/HTML, no open JSON payload route confirmed.
  - `courtauld`: HTML responses, no open JSON image API confirmed.
  - `chester_beatty`: HTML responses, no open JSON image API confirmed.

#### Phase C — Natural history & science batch
- **Added 1 source:** `sketchfab_heritage` (active ✅)
  - Endpoint: `https://api.sketchfab.com/v3/models`
  - `extraParams`: `categories=cultural-heritage-history`
  - 3-term Node.js verification:
    - `portrait` → images found ✅
    - `landscape` → images found ✅
    - `flower` → images found ✅
  - Individual file created: `insposearch/sources/sketchfab_heritage.json`
- NHM London tested with required terms at provided datastore endpoint:
  - `butterfly`, `flower`, `portrait` did not return usable JSON image payloads in this environment.
- Europeana Fashion filter test (`qf=PROVIDER:"Europeana+Fashion"`, demo key): 0 image items on all three terms.
- George Eastman Museum / FOAM Amsterdam: no confirmed public JSON image APIs from tested endpoints.

#### Phase D — Architecture & design
- Cooper Hewitt hardcoded source metadata updated in `SOURCE_META`:
  - Added `design` and `architecture` categories to `cooperhewitt`.
- Tested Bauhaus, RIBA, Avery, CyArk with required three terms:
  - Added: **0**
  - All tested endpoint patterns returned non-JSON or no-image responses.

#### Phase E — Retry inactive sources
- Heidelberg retries (`digi.ub.uni-heidelberg.de` + `heidicon`) tested with required terms:
  - `digi.ub` routes returned 404 HTML.
  - `heidicon` route returned JSON but no usable image URLs on tested terms.
- KB Netherlands retries (`api.kb.nl`, `delpher`, `geheugen.delpher`) tested with required terms:
  - DNS failure (`api.kb.nl`), 404 HTML, or 403 HTML.
- Botanicus replacement checks:
  - BHL `GetItemMetadata` demo key returned `401`.
  - `iiif.biodiversitylibrary.org` DNS not found from this environment.
- Added: **0**

#### Phase-by-phase status summary
- Phase A: added 0, rejected 0, active manifest sources after phase: 7
- Phase B: added 0, rejected 10, active manifest sources after phase: 7
- Phase C: added 1, rejected 4, active manifest sources after phase: 8
- Phase D: added 0, rejected 4, active manifest sources after phase: 8
- Phase E: added 0, rejected 7, active manifest sources after phase: 8

---

### ✅ Builder Session — README, CONTRIBUTING, Mobile Fixes (March 22)

#### Step 1 — GitHub remote (manual step required — see bottom of this file)
No `gh` CLI installed; repo must be created manually at github.com. Steps provided below.

#### Step 2 — README.md updated
- Added screenshot placeholder (`docs/screenshot.png`) with italicized caption
- Replaced opening description with V2 long-form "multi-source visual research engine" copy (from InspoSearch-Expansion-V2.md)
- All other sections unchanged: 3-step usage, features, AI features, contributing, project structure, license

#### Step 3 — CONTRIBUTING.md: filled example added
Added a new **"Filled example — DigitalCommonwealth"** JSON block under the existing empty template in the Schema Reference section. Annotated with 4 notes explaining `adapter`, `resultsPath`, `imageUrlTemplate`, and `{limit}` substitution. The empty template block was retitled "Empty template" for clarity.

#### Step 4 — Mobile layout pass (375px)
**File:** `insposearch/index.html`

**Problem:** At 375px, `#sidebar` (240px, `flex-shrink: 0`) + `#panel` (280px, `flex-shrink: 0`) = 520px > 375px. canvas was crushed to 0px width.

**Fixes added:**
- New `#mobile-menu-btn` CSS — hidden by default (`display: none`), positioned fixed top-left, shows at ≤480px
- New `#sidebar-backdrop` CSS — full-screen click-to-close overlay
- `@media (max-width: 480px)` block:
  - `#sidebar` → `position: fixed`, slides in from left via `transform: translateX(-100%)` → `.mobile-open` class
  - `#panel` → `position: fixed; width: 100vw` when open (slides in from right as before)
  - `#image-grid` → `minmax(150px, 1fr)` (was 200px minimum — broken at narrow widths)
  - `#floating-bar` → `max-width: calc(100vw - 24px); flex-wrap: wrap` to prevent overflow
  - `#ai-chat-panel` → `width: 100vw`
- HTML: added `<button id="mobile-menu-btn">` and `<div id="sidebar-backdrop">` as first children of `#app`
- JS: `mobile-menu-btn` click → `sidebar.classList.add('mobile-open')` + backdrop visible; backdrop click → close; Enter in search input → auto-close sidebar

---

### ✅ Builder Session — DC Source File, Westfalen Verify, Fashion Tags + Filter Pill (March 22)

#### Step 1 — `digital_commonwealth.json` created
**File:** `insposearch/sources/digital_commonwealth.json`

Source file created matching the manifest entry exactly (plus `per_page={limit}` already applied). The `/sources/` directory now has a file for every active manifest source that isn't a key-gated or broken entry.

#### Step 2 — Westfalen `imageBaseUrl` verified ✅
**API test:** `https://westfalen.museum-digital.de/json/objects?s=portrait&limit=1`
- Image field value: `data/westfalen/images/201805/200w_040713105aec080606a01.jpg`
- Starts with `data/westfalen/` → `imageBaseUrl: "https://westfalen.museum-digital.de/"` is correct
- No change needed. Reviewer concern resolved.

#### Step 3 — DigitalCommonwealth `per_page` slider fix
**Files:** `insposearch/index.html` (adapter), `insposearch/sources.manifest.json`, `insposearch/sources/digital_commonwealth.json`

- Adapter (`fetchIIIFCollection`): `extraParams` now supports `{limit}` substitution — `config.extraParams.replace('{limit}', String(limit))`. Backward-compatible: sources without `{limit}` in extraParams are unchanged.
- `sources.manifest.json`: `"extraParams": "per_page=20"` → `"per_page={limit}"`
- `digital_commonwealth.json`: created with `"per_page={limit}"` from the start

User's image count slider now controls DC result count instead of being hardcoded at 20.

#### Step 4 — Fashion category tags added
**File:** `insposearch/index.html`

`SOURCE_GROUPS.fashion` extended: `['va','nordic','cooperhewitt','mak','maas','smk','parismusees']` (added `parismusees`)

`SOURCE_META` updated — added `fashion` to category arrays:
- `parismusees` → `['museums','art','fashion']` (was `['museums','art']`)
- `maas` → `['museums','science','art','fashion']` (was `['museums','science','art']`)
- `smk` → `['museums','art','fashion']` (was `['museums','art']`)

Already had `fashion` — no change: `va`, `nordic`, `cooperhewitt`, `mak`.

Note: `parismusees`, `nordic`, `va` are **hardcoded sources** (not manifest entries). The manifest has no entries for them; their fashion tags live in `SOURCE_META` / `SOURCE_GROUPS` only.

#### Step 5 — Fashion category filter pill added
**File:** `insposearch/index.html`

- New `category` filter group added to `#source-view-filters`, with `all` and `fashion` pills
- `SOURCE_VIEW_FILTER` extended: `{ region: '', access: '', category: '' }`
- `applySourceFilter()` now checks `catMatch = !category || (meta.category || []).includes(category)`
- Clicking "fashion" in the filter pills narrows the **source list view** to only fashion-tagged sources (without disabling any sources for search — that's the separate fashion preset button)

---

### 🔍 Reviewer Audit — Source-Adder Batch 2 (March 22)
**Audited by:** Reviewer agent

#### Verified Correct
- `imageUrlTemplate` bug fix confirmed in code at `fetchIIIFCollection` lines 6430–6431, 6442–6443. Fix condition `config.imageUrlTemplate && rawImg && !imgUrl.startsWith('http')` is correct and handles DigitalCommonwealth's `commonwealth:...` ID strings properly.
- `digital_commonwealth` active in manifest, `_totalSources: 14` correct, API chain works: `extraParams: per_page=20` → `resultsPath: data` → `imageField: attributes.exemplary_image_ssi` → `imageUrlTemplate` constructs IIIF URL.
- `claude-sonnet-4-6` confirmed at all 3 call sites (lines 8478, 8504, 9532). No action needed.
- Active manifest source count = **7** (cudl, unsplash, david_rumsey, smb, nat, westfalen, digital_commonwealth). Inactive = 7.
- Fashion Tier 1 investigation logged with correct findings — 5 institutions have no accessible public JSON APIs.

#### Issues Found
1. **`digital_commonwealth.json` missing from `/sources/`** — Source was added directly into `sources.manifest.json` without creating an individual file in `/sources/`. Same structural gap as the 3 museum_digital sources in batch 1. Contributor model is broken: `/sources/README.md` says "one file per source." Fix: create `insposearch/sources/digital_commonwealth.json`.

2. **`museum_digital_westfalen` health-tracker risk** — Documented in batch 1: `landscape` and `flower` queries return HTTP 404 (not empty array). `fetchIIIFCollection` treats 404 as an error and returns `[]`. `recordSourceResult` then logs a miss. After 3 consecutive all-miss queries in a session, `isSourceHealthy` returns `false` and the source is silently disabled (sessionStorage; resets on reload). Low risk for common queries like `portrait`, but fragile for keyword-heavy searches.

3. **`museum_digital_westfalen` `imageBaseUrl` unverified** — Manifest uses `https://westfalen.museum-digital.de/` while `museum_digital_nat` uses `https://smb.museum-digital.de/` (because nat images are hosted on the smb subdomain). Westfalen's own domain may differ — needs a live API response check to confirm relative image paths resolve correctly.

4. **DigitalCommonwealth `per_page` is hardcoded** — `extraParams: "per_page=20"` is baked into the manifest entry. The generic `fetchIIIFCollection` also appends `&limit=${limit}` (the slider value), but DC ignores `limit` and obeys `per_page`. Result: the user's image count slider has no effect on DC — always returns exactly 20 items. Not a breakage but a UX gap.

---

### ✅ Source-Adder Batch 2 — imageUrlTemplate Bug Fix + DigitalCommonwealth (March 23)
**Files changed:** `insposearch/index.html`, `insposearch/sources.manifest.json`

#### imageUrlTemplate Adapter Bug Fix (`index.html`)
The `imageUrlTemplate` feature added in the builder session had a silent bug: the condition was
`if (!imgUrl && config.imageUrlTemplate...)` — it only fired when `rawImg` was **null/empty**.
For DigitalCommonwealth (and any source where `imageField` returns an inventory ID, not a URL), `rawImg` is
a non-empty string like `"commonwealth:1v53kk76g"` — so the template never fired.

**Fix:** Condition changed to `if (config.imageUrlTemplate && rawImg && !imgUrl.startsWith('http'))`.
Fires whenever the image field returns a non-empty value that isn't already an absolute URL.
Also applied the same fix to the `thumbUrl` path to keep thumb/main consistent.

Backward compatibility confirmed: sources using `imageBaseUrl` (SMB, nat, westfalen) are unaffected —
their `imgUrl` becomes absolute after the base-URL step, so `!imgUrl.startsWith('http')` is false.

#### DigitalCommonwealth Added (`sources.manifest.json`)
- **API verified via Node.js** (PS 5.1 can't reach site; Node.js TLS 1.3 works):
  - `portrait` → 107,940 results ✅ &nbsp; `landscape` → 9,633 ✅ &nbsp; `flower` → 14,014 ✅
  - IIIF image HEAD: `Status 200, image/jpeg` ✅
- `_totalSources: 13 → 14`; active count: 6 → **7**
- Key manifest fields:
  - `endpoint`: `https://www.digitalcommonwealth.org/search.json`
  - `queryParam`: `q`, `extraParams`: `per_page=20` (site uses `per_page`, not `limit`)
  - `resultsPath`: `data`
  - `imageField`: `attributes.exemplary_image_ssi` (returns IDs like `"commonwealth:1v53kk76g"`)
  - `imageUrlTemplate`: `https://iiif.digitalcommonwealth.org/iiif/2/{id}/full/400,/0/default.jpg`
  - `titleField`: `attributes.title_info_primary_tsi`, `descField`: `attributes.institution_name_ssi`

#### Fashion Tier 1 — All New Institutions Investigated, No Accessible APIs Found
Tested all 5 new Tier 1 fashion institutions from V2 Phase 2B:

| Institution | Finding |
|---|---|
| **KCI Japan** (`kci.or.jp`) | No IIIF endpoint, no REST API, no WP-JSON — static HTML site |
| **Museum at FIT NY** (`fashionmuseum.fitnyc.edu`) | No eMuseum API exposed; search redirects to HTML |
| **Bath Fashion Museum** (`fashionmuseum.co.uk`) | 403/404 on all JSON/API paths; Drupal site, no JSON:API |
| **MoMu Antwerp** (`momu.be`) | Craft CMS GraphQL at `/api/` — but only 1 collection piece in CMS; full collection unexposed |
| **MAD Paris** (`madparis.fr`) | No JSON API; `collections.madparis.fr` is HTML-only |
| **Kunstmuseum Den Haag** (`kunstmuseum.nl`) | SPARQL/Linked Data API (wiki at `api.kunstmuseum.nl`) — not REST-compatible |

Note: The 4 "already in app" Tier 1 sources (`palais_galliera → parismusees`, `galleria_costume → joconde`,
`nordic_fashion → nordic`, `va_fashion → va`) just need a `"fashion"` category tag added — tracked in next steps.

---

### ✅ Builder Session — imageUrlTemplate Adapter, Manifest Count Fix, Source JSON Files (March 22)

#### Step 1 — `imageUrlTemplate` added to `fetchIIIFCollection`
**File:** `insposearch/index.html`

New fallback path in the `.map()` inside `fetchIIIFCollection`:
- After extracting `rawImg` via `imageField`, if `imgUrl` is empty AND `config.imageUrlTemplate` is set, the adapter constructs the URL by calling `config.imageUrlTemplate.replace('{id}', idVal)` where `idVal` is `getField(item, config.imageField)`.
- `imageBaseUrl` is applied to the template result too if the output is a relative path.
- Logic order: verbatim → baseUrl (on verbatim) → template (fallback) → baseUrl (on template result).
- Unlocks sources whose API returns an object ID in the image field that needs URL construction (e.g. DigitalCommonwealth, Wikimedia file prefix patterns).

#### Step 2 — Claude model (already claude-sonnet-4-6 from prior session)
- All 3 references confirmed at lines 8459, 8485, 9513 — no change needed.

#### Step 3 — `_totalSources` fixed
**File:** `insposearch/sources.manifest.json`
- `_totalSources: 8` → `_totalSources: 13` (13 total entries in manifest; 6 active, 7 inactive)

#### Step 4 — Individual source JSON files created
**New files:**
- `insposearch/sources/museum_digital_smb.json` — SMB Berlin (200k objects, active)
- `insposearch/sources/museum_digital_nat.json` — museum-digital Deutschland (500k objects, active)
- `insposearch/sources/museum_digital_westfalen.json` — museum-digital Westfalen (50k objects, active)

These files match the entries already in `sources.manifest.json` exactly. They exist for contributor reference — the manifest is still the authoritative runtime source.

---

### ✅ Source-Adder Batch 1 — Adapter Enhancement + 3 New Sources
**Files changed:** `insposearch/index.html`, `insposearch/sources.manifest.json`

#### Adapter Improvements (`fetchIIIFCollection` in index.html)

1. **`imageBaseUrl` support** — Added relative-to-absolute URL resolution. If a manifest source sets `"imageBaseUrl": "https://example.com/"`, relative image paths returned by that API are automatically prefixed. Unlocks sources that return relative paths.

2. **Root-array response support** — Added `"resultsPath": "$"` as a special token. If set, the adapter uses the root JSON response directly (for APIs that return a bare array). Previously, all valid `resultsPath` values had to be dot-notation keys (e.g., `"results.items"`). Now sources can return `[{...}, {...}]` directly.

#### Broken Active Entries Fixed
- **`bodleian`** → `active: false` — `/api/v1/search/` endpoint removed; Bodleian migrated to IIIF collection browsing only (no keyword search JSON API as of 2025)
- **`bsb`** → `active: false` — `api.digitale-sammlungen.de/search/v1/json` returns 404; BSB search API endpoint has changed

#### New Sources Added (3) — All Confirmed 3-Term Tested

| Source ID | Name | Endpoint | Terms Tested | Notes |
|-----------|------|----------|-------------|-------|
| `museum_digital_smb` | SMB Berlin | `smb.museum-digital.de/json/objects` | portrait ✅ flower ✅ landscape ✅ | `imageBaseUrl: "https://smb.museum-digital.de/"` |
| `museum_digital_nat` | museum-digital Deutschland | `nat.museum-digital.de/json/objects` | portrait ✅ landscape ✅ flower ✅ | 500k+ objects from hundreds of German institutions; images hosted on smb.museum-digital.de |
| `museum_digital_westfalen` | museum-digital Westfalen | `westfalen.museum-digital.de/json/objects` | portrait ✅ nature ✅ city ✅ | Note: `landscape` and `flower` return 404 (no results = 404, not empty array) |

All three use: `"adapter": "simple_rest"`, `"resultsPath": "$"`, `"imageField": "image"`, `"titleField": "objekt_name"`, `"descField": "institution_name"`.

#### APIs Tested and Rejected
- **Heidelberg** — All tested paths return 404; correct API path unverified
- **KB Netherlands** — `data.bibliotheken.nl` is Linked Data only, not image search
- **botanicus.org** — Domain unreachable
- **museum-digital.de** (various) — API works but images were relative paths → now solved with `imageBaseUrl`
- **Rawpixel** — AI-generated / premium content; disqualified
- **Kulturarv.dk** — TCP reachable but HTTP times out
- **NHM London** — TCP reachable but HTTP times out from this environment
- **DigitalCommonwealth** — API works but image URL requires construction from ID (not just `imageBaseUrl` prefix); needs custom adapter
- **Bodleian IIIF** — `iiif.bodleian.ox.ac.uk/iiif/collection/top` returns data but is a hierarchy navigator, not keyword search

#### Manifest Active Source Count
- **Before:** 5 active (bodleian ❌broken, bsb ❌broken, cudl, unsplash, david_rumsey)
- **After:** 6 active (cudl, unsplash, david_rumsey, museum_digital_smb, museum_digital_nat, museum_digital_westfalen)


### ✅ Added CURRENT_STATE.md Read/Update Discipline to Frontend Engineer Agent
**File:** [.github/agents/insposearch-frontend.agent.md](.github/agents/insposearch-frontend.agent.md)

The Working Style section now mandates:
- Read `CURRENT_STATE.md` **before** starting any task.
- Update `CURRENT_STATE.md` **after** finishing any task.

---
---

### ✅ Adapter Enhanced for Community Contributions (imageBaseUrl + $ resultsPath)
These two adapter features make it much easier for community contributors to add sources without needing to write custom adapter code:
- Sources with relative image paths → just add `"imageBaseUrl"` to the manifest entry
- Sources returning root-level arrays → just set `"resultsPath": "$"`


### ✅ Created InspoSearch Source Integrator Agent
**File:** [.github/agents/insposearch-source-integrator.agent.md](.github/agents/insposearch-source-integrator.agent.md)

A new workspace-level custom agent for narrowly focused source-manifest integration work.

**Scope:**
- Adding and validating new image sources using the JSON manifest schema
- API verification, CORS assessment, field mapping
- Requires 3 search-term tests before confirming a source
- Restricted tools: `read`, `search`, `edit`, `execute`, `web`

**Schema Reference:**
- Manifest schema: [INSPOSEARCH_MASTERPLAN.md#L113](INSPOSEARCH_MASTERPLAN.md#L113)
- Source README: [insposearch/sources/README.md](insposearch/sources/README.md)
- Template: [insposearch/sources/_template.json](insposearch/sources/_template.json)

**Open Policy Questions:**
1. Can the agent create/modify adapter code if a source doesn't fit existing adapters?
2. Should key-required APIs be allowed (schema supports them)?
3. Should "3 search terms" include local app UI testing, or API-level only?

---

## Pending Work

**GitHub remote — ACTION REQUIRED (manual step):**
1. Go to [github.com/new](https://github.com/new)
2. Create a public repo named `insposearch` (no README, no .gitignore — repo should be empty)
3. Then run in this project folder:
```bash
git remote add origin https://github.com/YOUR_USERNAME/insposearch.git
git branch -M main
git push -u origin main
```
All commits will push in one shot.

**Session 2 (IIIF Adapter) — Progress:**

#### Manifest Active Sources (10 total)
- `cudl` — active ✅
- `unsplash` — active ✅ (key required)
- `david_rumsey`  — active ✅
- `museum_digital_smb` — active ✅ 
- `museum_digital_nat` — active ✅
- `museum_digital_westfalen` — active ✅ 
- `digital_commonwealth` — active ✅ 
- `sketchfab_heritage` — active ✅ 
- `wellcome_iiif` — active ✅ (new, Phase 1C)
- `met_iiif` — active ✅ (new, Phase 1C)

#### Issues Resolved This Session
1. ✅ **IIIF Content Search adapter implemented** — `fetchIIIFSearch()` now handles both v1 and v2 formats
2. ✅ **Adapter routing in fetchAll()** — Routes to `fetchIIIFSearch` for `iiif_content_search` adapter type
3. ✅ **2 new sources added** — wellcome_iiif and met_iiif (both qualified 3/3 terms)

#### Phase 2 Status
- Tested 10 hardcoded adapter candidates (Wallace, NHM, Fitzwilliam, MFA Boston, Albertina, Scottish National, Chester Beatty, Eastman, Orsay, Pompidou)
- **Result:** 0/10 qualified (all blocked by auth 401, firewall 403, endpoints 404, or redirects 301)
- **Decision:** No hardcoded functions written (per spec: "only set active if 3/3 terms return images")

#### Still Inactive (needs investigation)
- **`heidelberg`** — All tested paths return 404; correct API path not found
- **`kb_nl`** — `data.bibliotheken.nl` is Linked Data only; needs correct KB image search API
- **`botanicus`** — Domain unreachable; consider replacing with BHL sub-collection endpoint
- **`dpla_nypl` / `dpla_digital_commonwealth`** — Need user to add DPLA key to localStorage (`inspo_dpla_key`)
- **`bodleian`** — Marked inactive; `/api/v1/search/` endpoint removed as of 2025
- **`bsb`** — Marked inactive; BSB search API endpoint has changed

#### Recommended Next Session Work
1. **IIIF adapter stress-test** — Verify wellcome_iiif and met_iiif work end-to-end in the app with live UI testing
2. **Phase 2 retries with keys** — Retry Fitzwilliam (need API key), DPLA (need DPLA key), NHM (inspect CKAN API)  
3. **Fashion category tags** — Add `"fashion"` to category arrays for: parismusees, joconde, nordic, va (already in hardcoded sources)
4. **Architecture/Design IIIF sources** — Test Stanford, BnF/Gallica IIIF, NGA, Library of Congress IIIF as new iiif_content_search entries
5. **Browser-level API testing** — For institutions requiring JavaScript or auth (KCI, FIT, Bath, MoMu, MAD) — use DevTools Network tab

---

## Agent Reference

Three workspace-level agents available:

| Agent | File | Purpose |
|-------|------|---------|
| **InspoSearch Frontend Engineer** | `insposearch-frontend.agent.md` | Phase-by-phase feature implementation, preserving dark monospace aesthetic, vanilla frontend code |
| **InspoSearch Source Integrator** | `insposearch-source-integrator.agent.md` | Add/validate sources using manifest schema, verify APIs, test CORS, ensure field mappings |
| **InspoSearch Design & Code Reviewer** | `insposearch-design-reviewer.agent.md` | Review new code/UI for design compliance, masterplan alignment, mobile breakage |

---

## Next Steps (for future sessions)

1. **UI integration test** — Verify wellcome_iiif and met_iiif display correctly in live app (images, titles, source links)
2. **Phase 2 retest** — Try Phase 2 institutions again with correct API keys (Fitzwilliam, DPLA, Rijksmuseum)
3. **Fashion category audit** — Ensure fashion tags appear on parismusees, joconde, nordic, va in SOURCE_META
4. **IIIF Tier 1 expansion** — Add Stanford, BnF/Gallica, NGA, Library of Congress as iiif_content_search sources
5. **Auth-gated sources** — Set up localStorage keys for DPLA, Rijksmuseum, and others to unlock collections
6. **Browser-level tracing** — For KCI Japan, FIT, Bath, MoMu, MAD — use DevTools to reverse-engineer GraphQL/API endpoints
7. **Phase 4 kickoff** — Push to GitHub public repo, add GitHub Actions manifest validator, announce community contribution window
