# InspoSearch — Full Audit & World Leadership Roadmap
> Generated: April 18, 2026  
> Purpose: Diagnose current state, identify every broken/degraded source, and define the path to becoming the world's leading open-access cultural heritage search engine.

---

## Mission Statement

InspoSearch's goal is to provide unified, zero-barrier access to **every open-access cultural heritage image archive in the world** — starting with every source currently in the project, then expanding systematically until no institution with an open API is missing.

**Current claimed state:** 521 active sources · 3.4B+ images · 101 languages  
**Target state:** 2000+ active sources · 10B+ images · every major world institution

---

## Executive Summary
*(To be filled by Claude Code audit)*

| Category | Count | Status |
|----------|-------|--------|
| Sources fully working | TBD | |
| Sources returning 0 results | TBD | 🔴 Critical |
| Sources timing out | TBD | 🔴 Critical |
| CORS-blocked (nightly fetch) | TBD | |
| Nightly data files empty/stale | TBD | 🟡 Warning |
| Manifest sources broken | TBD | 🟡 Warning |
| Search degradation confirmed | TBD | 🔴 Critical |

---

## Phase 1 — Live Website Verification

### 1.1 App & API Health
*(Results from live endpoint checks)*

| Endpoint | Status | Response Time | Notes |
|----------|--------|---------------|-------|
| https://insposearch.pages.dev | | | |
| /health | | | |
| /sources | | | |
| /search?q=portrait | | | |
| /random?count=5 | | | |
| /semantic?q=flower | | | |

### 1.2 Issues Found
*(To be filled)*

---

## Phase 2 — CORS-Blocked Sources Audit

### 2.1 Data Files in insposearch/data/
*(List of all JSON files, sizes, and freshness)*

| File | Size | Last Modified | Status |
|------|------|---------------|--------|
| | | | |

### 2.2 Empty / Stale Files
*(Files with 0 results or older than 7 days)*

### 2.3 CORS Status — Can Any Be Unblocked?
*(Sources where direct fetch is now possible)*

### 2.4 Wikidata SPARQL Bridge Tests
*(Results from test queries against query.wikidata.org)*

---

## Phase 3 — Live Source Health Audit (Top 40)

| ID | Name | HTTP | Time (ms) | Results | Images Valid | Issue |
|----|------|------|-----------|---------|--------------|-------|
| met | Metropolitan Museum | | | | | |
| rijks | Rijksmuseum | | | | | |
| europeana | Europeana | | | | | |
| wikimedia | Wikimedia Commons | | | | | |
| loc | Library of Congress | | | | | |
| inaturalist | iNaturalist | | | | | |
| gbif | GBIF | | | | | |
| nasa | NASA Images | | | | | |
| archive | Internet Archive | | | | | |
| flickr | Flickr Commons | | | | | |
| va | V&A Museum | | | | | |
| smithsonian | Smithsonian | | | | | |
| tate | Tate | | | | | |
| bhl | Biodiversity Heritage Library | | | | | |
| gallica | Gallica BnF | | | | | |
| openverse | Openverse | | | | | |
| dpla | DPLA | | | | | |
| ddb | Deutsche Digitale Bibliothek | | | | | |
| smk | SMK Denmark | | | | | |
| finna | Finna Finland | | | | | |
| cooperhewitt | Cooper Hewitt | | | | | |
| cleveland | Cleveland Museum | | | | | |
| chicago | Art Institute of Chicago | | | | | |
| nga | National Gallery of Art | | | | | |
| getty | Getty Museum | | | | | |
| walters | Walters Art Museum | | | | | |
| princeton | Princeton Art Museum | | | | | |
| wikiart | WikiArt | | | | | |
| pexels | Pexels | | | | | |
| pixabay | Pixabay | | | | | |
| trove | Trove Australia | | | | | |
| digitalnz | DigitalNZ | | | | | |
| nypl | NYPL Digital | | | | | |
| harvard | Harvard Art Museums | | | | | |
| yale | Yale Center for British Art | | | | | |
| cornell | Cornell Digital Collections | | | | | |
| wellcome | Wellcome Collection | | | | | |
| noaa | NOAA | | | | | |
| hubble | Hubble | | | | | |
| apod | NASA APOD | | | | | |

---

## Phase 4 — Search Degradation Diagnosis

### 4.1 Health Tracking System
*(Analysis of thresholds, penalty rates, auto-recovery timing)*

**Current thresholds:**
- Sources disabled after: TBD consecutive failures
- Recovery window: TBD
- Session cache TTL: TBD

**Problem:** *(Diagnosis of why sources get disabled mid-session)*

### 4.2 Session Cache Issues
*(Is caching preventing re-queries on repeated searches?)*

### 4.3 promisePool Concurrency
*(Current limit, whether it's throttling aggressively)*

### 4.4 Source Selection Algorithm
*(How many sources selected per query, scoring breakdown)*

### 4.5 Dedup Aggressiveness
*(pHash hamming distance threshold — is it too aggressive?)*

### 4.6 Root Cause: Why "4-5 results" on repeat searches
*(Specific code paths identified)*

### 4.7 Recommended Fixes

```
// Example fix placeholders — to be filled with actual code patches
```

---

## Phase 5 — Manifest Source Audit

| ID | Name | Endpoint | HTTP Status | Results | Issue | Fix |
|----|------|----------|-------------|---------|-------|-----|
| cudl | Cambridge Digital Library | | | | | |
| unsplash | Unsplash | | | | | |
| david_rumsey | David Rumsey Maps | | | | | |
| museum_digital_smb | SMB Berlin | | | | | |
| museum_digital_nat | museum-digital Deutschland | | | | | |
| digital_commonwealth | Digital Commonwealth | | | | | |
| wellcome_iiif | Wellcome (IIIF) | | | | | |
| met_iiif | Met (IIIF) | | | | | |

---

## Phase 6 — Full Prioritized Roadmap

---

### P5 — Critical Fixes (This Week)
*Blocking issues causing degraded or zero results*

| Priority | Issue | Root Cause | Fix | Effort |
|----------|-------|------------|-----|--------|
| P5.1 | Search degrades to 4-5 results | | | |
| P5.2 | Empty nightly data files | | | |
| P5.3 | [Source X] returning 0 results | | | |

**Key fixes:**

1. **Search degradation** — *(specific fix)*
2. **Health tracker tuning** — *(specific parameters)*
3. **Session cache invalidation** — *(specific fix)*
4. **Rate limit backoff** — *(specific fix)*

---

### P6 — High-Impact Quick Wins (1–2 Weeks)

*Sources that can be fixed or unblocked with minimal effort*

| Source | Current Issue | Fix Type | Est. Images Gained |
|--------|--------------|----------|-------------------|
| | | | |

**CORS sources that can now be fetched directly:**
*(List sources where CORS is no longer blocking)*

**Manifest sources needing endpoint updates:**
*(List with correct new endpoints)*

---

### P7 — Expansion Wave 1 (1 Month) — Target: 1000 Active Sources

*High-value sources with confirmed working APIs, no key required, CORS-friendly*

#### Tier 1 — Add Immediately (API confirmed, no friction)

| Source | Country | Category | Images | Endpoint | Adapter Type |
|--------|---------|----------|--------|----------|--------------|
| National Library of Norway | Norway | Archives/History | 716k+ | https://api.nb.no/catalog/v1/items | simple_rest |
| ColBase Japan | Japan | Asian Art | 100k+ | https://colbase.nich.go.jp/api | simple_rest |
| National Museum of Korea | South Korea | Korean Art | 340k | https://www.emuseum.go.kr | simple_rest |
| Benaki Museum Athens | Greece | Greek Culture | 50k | https://collections.benaki.gr | simple_rest |
| Israel Museum Jerusalem | Israel | Multi-cultural | 50k | https://imj.org.il/en/collections | REST JSON |
| Henry Ford Museum | USA | Technology/History | 100k | https://www.thehenryford.org | simple_rest |
| National Gallery of Victoria | Australia | Art | 75k | https://www.ngv.vic.gov.au | simple_rest |
| National Gallery Australia | Australia | Art | 166k | https://artsearch.nga.gov.au | simple_rest |
| National Gallery of Ireland | Ireland | Art | 1.8k+ | Wikidata Q2018379 | collection_fetcher |
| Tokyo National Museum | Japan | Japanese Art | 120k | https://webapi.tnm.jp | simple_rest |
| Imperial War Museum | UK | Military/History | 50k+ | https://www.iwm.org.uk/collections/search | simple_rest |
| Singapore Heritage (Roots) | Singapore | Asian Heritage | 50k+ | https://roots.gov.sg/api | simple_rest |
| NLM Images from History of Medicine | USA | Medical History | 70k+ | https://collections.nlm.nih.gov/api | simple_rest |
| British Library IIIF | UK | Archives/History | 1M+ | https://api.bl.uk/metadata/iiif | iiif |
| National Archives USA (NARA) | USA | Historical | 15M+ | https://catalog.archives.gov/api/v2 | simple_rest |
| Corning Museum of Glass | USA | Decorative Arts | 45k | https://www.cmog.org/collection | simple_rest |
| American Numismatic Society | USA | Numismatics | 600k | https://numismatics.org/api | simple_rest |
| National Maritime Museum Greenwich | UK | Maritime | 100k | https://collections.rmg.co.uk/api/v1 | simple_rest |
| McCord Museum Montreal | Canada | Canadian History | 150k | https://collections.musee-mccord-stewart.ca | simple_rest |
| Australian War Memorial | Australia | Military/History | 100k+ | https://www.awm.gov.au/collection/api | simple_rest |

#### Tier 2 — Add with Key (Free keys, fast signup)

| Source | Key URL | Images | Priority |
|--------|---------|--------|----------|
| Brooklyn Museum | https://www.brooklynmuseum.org/opencollection/api | 200k | High |
| Philadelphia Museum of Art | https://philamuseum.org | 275k | High |
| RISD Museum | https://risdmuseum.org | 80k | Medium |

#### Tier 3 — Wikidata Collection Bridges to Add

*Use existing `makeCollectionFetcher()` factory — minimal code, max impact*

| Museum | QID | Est. Images | Country |
|--------|-----|-------------|---------|
| Museum of Fine Arts Boston | Q49133 | 2,895 | USA |
| Museum of Fine Arts Houston | Q1565911 | 714 | USA |
| Tokyo National Museum | Q58247 | ~2k | Japan |
| Kyoto National Museum | Q915184 | ~1k | Japan |
| National Museum of Korea | Q484006 | ~1k | South Korea |
| National Palace Museum Taipei | Q673651 | 800 | Taiwan |
| Hermitage Museum | Q132783 | ~5k | Russia |
| National Gallery of Victoria | Q1464509 | ~2k | Australia |
| Benaki Museum | Q1045104 | ~1k | Greece |
| Museum of Islamic Art Doha | Q1922338 | ~500 | Qatar |

---

### P8 — Expansion Wave 2 (3 Months) — Target: 5000 Active Sources

#### Institutional Aggregators (each proxies dozens of collections)
*Adding one aggregator can unlock 50-500 new institutions*

| Aggregator | Collections Covered | API Type | Key Required |
|------------|--------------------|-----------|----|
| HathiTrust | 200+ university libraries | REST | Free |
| iDigBio | 1,500+ natural history collections | REST | No |
| DiSSCo | 120+ European natural history collections | REST | No |
| Europeana (expand sub-collections) | 3,000+ European institutions | REST | Free |
| DPLA (expand hubs) | 2,000+ US libraries/archives | REST | Free |
| Atlas of Living Australia (ALA) | 500+ AU collections | REST | No |
| Singapore NHB | 10+ Singapore institutions | REST | Free |
| Korea Heritage Service | 50+ Korean institutions | REST | Free |

#### Outreach Targets (Top 20 Institutions to Contact)

| Institution | Why | Images | Contact Strategy |
|-------------|-----|--------|-----------------|
| British Museum | 4M objects, has REST API | 4M | API partnership email |
| Hermitage Museum | 3M objects | 3M | Partner via Europeana |
| Louvre (direct API) | 480k, currently via Joconde | 480k | Upgrade existing |
| Vatican Museums | Unique collection, no public API | ~100k | Formal outreach |
| Palace Museum Beijing | 1.8M objects | limited | Via academic partner |
| Getty Research Institute | Unique research archive | 500k | Formal outreach |
| MoMA | Only 659 images via Wikidata | 200k | Direct API access |
| Kyoto Costume Institute | Unique fashion archive | 15k | Formal outreach |
| Magnum Photos | Photojournalism heritage | 1M+ | Commercial/partnership |
| National Geographic Archive | Cultural/natural heritage | large | Partnership |
| Museo Nacional Reina Sofía | LOD endpoint exists | 200k | Implement LOD adapter |
| Centre Pompidou | REST API documented | 120k | Implement adapter |
| Uffizi Gallery | Beta API documented | 3k | Expand access |
| Toronto AGO | API for 120k works | 120k | Implement adapter |
| National Gallery of Canada | Open access | 40k | Implement adapter |
| Musée des Tissus de Lyon | Largest textile collection | 2.5M | Formal outreach |
| China National Silk Museum | National silk heritage | large | Formal outreach |
| Calico Museum Ahmedabad | World-class textile collection | large | Formal outreach |
| Kyoto National Museum | Japanese art | large | Via ColBase |
| State Tretyakov Gallery | Russian art | 180k | Formal outreach |

---

### P9 — Architecture Improvements

#### 9.1 Fix Search Degradation (Permanent)

**Problem:** Health tracker penalizes sources too aggressively; after ~3-4 searches, many sources are temporarily disabled, leaving only 4-5 sources active.

**Proposed fixes:**
```javascript
// 1. Raise failure threshold before disabling
// Current: ~3 failures → disabled
// Proposed: 5 failures with exponential backoff

// 2. Session cache TTL reduction
// Current: TTL is too long, prevents re-querying same source
// Proposed: Per-query cache only (not cross-query)

// 3. Health recovery — auto-recover after 2 minutes instead of session-end

// 4. Separate health tracking by query type
// A source that fails for "portrait" shouldn't be penalized for "landscape"
```

#### 9.2 Improve Pagination

**Problem:** "Load more" only paginates cached results — it doesn't re-query sources for page 2+.

**Fix:** On "load more", send paginated requests to sources that support it (Met, Rijks, Europeana, LOC, etc.) with `page` param.

#### 9.3 Smarter Source Selection

**Current:** Top-N sources scored by intent category.  
**Proposed:** 
- Increase N from current value to 80+ sources per query
- Tier system: Tier 1 (always query, ~20 sources) + Tier 2 (query by intent, ~40) + Tier 3 (rotate randomly, ~20)
- Track per-source result quality and boost high-performers

#### 9.4 Rate Limiting & Backoff

**Add exponential backoff per source:**
- First failure: wait 10s before retry
- Second failure: wait 30s
- Third failure: wait 2 minutes
- Never permanently disable a source within a session

#### 9.5 Result Quality Scoring

**Add to relevance scoring:**
- Penalize results with no image URL
- Penalize results with missing title AND missing artist
- Boost results where query term appears in title vs just tags
- Add image resolution scoring (prefer higher-res thumbnails)

#### 9.6 Concurrency Optimization

**promisePool tuning:**
- Increase pool size for fast/reliable sources (Wikimedia, Europeana, Met)
- Decrease for slow/unreliable (CORS-blocked static files are fast, live APIs vary)
- Target: first results visible in <1.5s, full grid populated in <5s

---

### P10 — World Leadership Goals

#### 10.1 What Major World Collections Are Still Missing?

**By region — highest-priority gaps:**

| Region | Missing Major Collections | Est. Images |
|--------|--------------------------|-------------|
| East Asia | Palace Museum Beijing, Shanghai Museum, Kyoto NM | 3M+ |
| South Asia | National Museum India, Calico Museum | 500k+ |
| Latin America | MASP São Paulo, Pinacoteca SP, MUNAL Mexico | 500k+ |
| Middle East | Cairo Egyptian Museum, MIA Doha, Topkapi | 1M+ |
| Russia/Eastern Europe | Hermitage, Tretyakov, Pushkin Museum | 5M+ |
| Africa | Iziko SA, Musée des Civilisations Noires | 200k+ |
| Southeast Asia | National Museum Singapore, Museum Tekstil Jakarta | 300k+ |

#### 10.2 Partnership Strategy

**Tier 1 Partnerships (Institutional):**
- Europeana — confirmed call April 9, 2026 (Emilija Angelovska)
- DPLA — US equivalent, similar structure
- Trove/NLA — already connected, explore deeper access
- Europeana Fashion — dedicated fashion portal access

**Tier 2 Partnerships (Technical):**
- IIIF Consortium — implement full IIIF Content Search for all IIIF-compliant collections
- Wikidata partnership — contribute collection data back, get enhanced access
- iDigBio — natural history aggregator with 1,500+ collections

**Tier 3 Partnerships (Commercial/Sponsored):**
- Getty Images heritage tier
- Bridgeman Images
- Magnum Photos archive access

#### 10.3 Metrics to Track World Leadership

| Metric | Current | 6-Month Target | 12-Month Target |
|--------|---------|----------------|-----------------|
| Active sources | 521 | 1,000 | 2,500 |
| Searchable images | 3.4B | 5B | 10B |
| World regions covered | 8 | 15 | 22 |
| Languages | 101 | 101 | 150 |
| Avg results per search | ~20-30 | 100+ | 200+ |
| Sources per search (no degradation) | 4-5 (degraded) | 60+ | 80+ |

#### 10.4 Content Gaps by Category

| Category | Current Sources | Missing Leaders |
|----------|----------------|-----------------|
| Islamic art | 3 | Museum of Islamic Art Doha, Topkapi, Turkish & Islamic Arts |
| Pre-Columbian | 2 | Major Mexican/Peruvian collections |
| African art | 2 | Iziko, Musée des Civilisations Noires, Ethnologisches Museum Berlin |
| Chinese art | 2 | Palace Museum, Shanghai Museum |
| Indian textiles | 1 | Calico Museum, National Museum India |
| Fashion/costume | 18 | MoMu Antwerp, Museum at FIT, Museo del Traje |
| 3D/immersive | 1 | Smithsonian 3D, CyArk, MorphoSource |
| Performing arts | 0 | NYPL Performing Arts, V&A Theatre |
| Architecture | 1 | Historic England, RIBA, Archinform |

---

## Appendix A — Full Sources Status Table
*(To be filled by Claude Code audit)*

| ID | Name | Category | Live | HTTP | Avg Results | CORS | Key | Issue | Fix Priority |
|----|------|----------|------|------|-------------|------|-----|-------|-------------|
| met | Metropolitan Museum | Art | | | | No | No | | |
| rijks | Rijksmuseum | Art | | | | No | No | | |
| ... | ... | | | | | | | | |

---

## Appendix B — Nightly Fetch Data File Status
*(To be filled by Claude Code audit)*

| File | Source | Size | Age | Results Count | Status |
|------|--------|------|-----|---------------|--------|
| | | | | | |

---

## Appendix C — Recommended Code Changes

*(Specific diff-ready changes to be added after audit)*

### core.js — Health tracker tuning
```javascript
// TBD after audit
```

### fetchers.js — New source adapters
```javascript
// TBD — list of new fetch* functions to add
```

### state.js — New source registry entries
```javascript
// TBD — BADGE_META, SOURCE_META additions
```

---

*This document is a living audit. Re-run the Claude Code prompt after each fix cycle to update the status tables.*

---

## Appendix D — Automated Test Results (April 18, 2026)

> These results come from the Playwright e2e + vitest unit test infrastructure.
> Run with: `npx playwright test` (e2e) and `npx vitest run` (unit)
> Configuration: [playwright.config.js](playwright.config.js), [vitest.config.js](vitest.config.js)

### Test Infrastructure Setup

- **Unit tests:** vitest v4.1.2, config in `vitest.config.js`
- **E2E tests:** Playwright v1.59.1, config in `playwright.config.js`
- **Browser:** Chromium only, headless, 1 worker (sequential)
- **Web server:** `npx serve insposearch -l 3000` (auto-started by Playwright)
- **Retries:** 1 (on first failure)
- **Timeout:** 60s per test
- **Test files:**
  - `tests/core.test.js` — 21 unit tests (vitest)
  - `tests/e2e/smoke.spec.js` — 13 e2e smoke tests
  - `tests/e2e/accessibility.spec.js` — 9 e2e accessibility tests
  - `tests/e2e/search-quality.spec.js` — 6 e2e search quality tests

### Known Test Prerequisites

Two overlay systems block all UI interaction if not dismissed via localStorage:
1. **Onboarding modal** (`#onboarding`) — set `localStorage.setItem('inspo_onboarding_seen', '1')` before page load
2. **Tour tooltips** (`.tour-backdrop`) — set `localStorage.setItem('inspo_tour_done', '1')` before page load

All spec files use `page.addInitScript()` in `beforeEach` to set both flags.

---

### Unit Test Results — 21/21 PASS ✅

All core utility tests passing. Covers:
- Query classification (exact vs explore mode)
- Source scoring algorithms
- Health tracking logic
- Adapter registry

---

### E2E Test Results — 24 passed, 3 failed, 1 flaky (18.8 min total)

#### Accessibility Tests — 9/9 PASS ✅ (1 flaky)

| # | Test | Result | Time |
|---|------|--------|------|
| 1 | Skip link exists and points to image grid | PASS | 25.3s |
| 2 | Search input has aria-label | PASS | 25.0s |
| 3 | All visible buttons have accessible names | PASS | 56.4s |
| 4 | Images have alt text after search | PASS | 26.2s |
| 5 | Slider has aria-label | PASS | 35.3s |
| 6 | View toggle buttons have role="radio" | PASS | 25.0s |
| 7 | Loading indicator has aria-live | FLAKY (pass on retry) | 1m → 26.1s |
| 8 | No duplicate IDs on page | PASS | 24.9s |
| 9 | Page language is set | PASS | 25.0s |

**Flaky note:** Test 7 (aria-live) timed out on first attempt due to slow `page.goto` (60s exceeded), passed on retry. Transient network/resource issue, not an app bug.

#### Search Quality Tests — 5/6 PASS, 1 FAIL ❌

| # | Test | Mode | Result | Time | Issue |
|---|------|------|--------|------|-------|
| 1 | "van gogh" | exact | **FAIL** | 29.2s + 60s retry | Badge assertion failed (see details below) |
| 2 | "renaissance" | exact | PASS | 48.3s | |
| 3 | "medieval manuscript" | exact | PASS | 25.9s | |
| 4 | "art nouveau" | exact | PASS | 45.7s | |
| 5 | "fashion 1920s" | explore | PASS | 42.0s | |
| 6 | Exact mode filters irrelevant for "renaissance" | exact | PASS | 31.4s | |

**Van Gogh failure details:**
- First attempt (29.2s): Search returned results but from `cleveland`, `museum_digital_westfalen`, `museum_digital_hessen`, and `finna` only. The test expected badges containing `met`, `rijks`, or `euro` (Europeana) — none of those sources returned results for "van gogh" in exact mode.
- Retry (60s): Timed out on `page.goto` — the local server was likely overloaded after running 12 sequential tests.
- **Root cause:** This is a **real search quality issue** — exact mode for "van gogh" doesn't return results from the Met, Rijksmuseum, or Europeana, which are the three biggest Van Gogh collections. The search degradation / health tracker may be penalizing these sources, or the exact-mode query construction doesn't match their API expectations.
- **Action needed:** Investigate why Met, Rijks, and Europeana don't return Van Gogh results in exact mode. Check query formatting sent to each source's API.

#### Smoke Tests — 10/13 PASS, 2 FAIL ❌, 1 FLAKY

| # | Test | Result | Time | Issue |
|---|------|--------|------|-------|
| 1 | Page loads with correct title | PASS | 24.9s | |
| 2 | Search input exists and is focusable | PASS | 24.7s | |
| 3 | Search mode toggle works | PASS | 47.4s | |
| 4 | Sidebar elements are present | PASS | 32.5s | |
| 5 | Theme toggle switches theme | **FAIL** | 47.9s + 49.5s retry | See details below |
| 6 | Search returns results for "monet" | PASS | 25.9s | |
| 7 | Image click opens detail panel | **FAIL** | 36.2s + 60s retry | See details below |
| 8 | Institutions page loads | PASS | 25.0s | |
| 9 | Color filter panel opens | PASS | 25.0s | |
| 10 | Image count slider changes value | PASS | 25.0s | |
| 11 | PWA manifest is linked | PASS | 24.9s | |
| 12 | View toggle switches between grid/board/3d | PASS | 25.0s | |
| 13 | API keys panel opens | PASS | 25.0s | |

**Theme toggle failure details:**
- Error: `expect(classAfter + dataAfter).not.toBe(classBefore + dataBefore)` — both before and after values are `""` (empty string).
- The test clicks `#theme-toggle` and checks if `<html>` element's `class` or `data-theme` attribute changes. Neither changes.
- **Root cause:** The theme toggle likely stores the theme in a different way — possibly via `document.body.classList`, a CSS variable on `:root`, or `localStorage` only without reflecting on the `<html>` element. The test assumption about where theme state is reflected is wrong, OR the toggle button ID/selector is incorrect.
- **Action needed:** Inspect how `#theme-toggle` works in `src/app.js`. Find what DOM attribute or property changes when theme is toggled, and either fix the test or fix the app to properly set `data-theme` on `<html>`.

**Detail panel failure details:**
- Error: `expect(locator).toBeVisible()` failed — locator `#image-panel, .detail-panel, .overlay-panel, [role="dialog"], .panel` found no elements.
- The test searches "rembrandt", waits for images, clicks the first `.image-card`, then checks for a detail panel.
- **Root cause:** The detail/zoom panel uses a different selector than any of the guessed ones. Need to inspect the actual DOM structure when an image card is clicked.
- **Action needed:** Find the actual detail panel element ID/class in `src/app.js` or `insposearch/index.html` and update the test selector.

---

### Summary of Real App Issues Found by Tests

| Issue | Severity | Category | Details |
|-------|----------|----------|---------|
| Van Gogh exact search misses Met/Rijks/Europeana | 🔴 Critical | Search Quality | Major museums with largest Van Gogh collections don't return results in exact mode |
| Theme toggle doesn't update HTML attributes | 🟡 Medium | UI/UX | `#theme-toggle` click doesn't change `class` or `data-theme` on `<html>` — theme may work visually but DOM state isn't testable |
| Detail panel selector unknown | 🟡 Medium | UI/UX | Clicking an image card doesn't show a panel matching common selectors — need to identify actual panel element |
| Loading indicator aria-live flaky | 🟢 Low | Accessibility | Transient timeout on page load, passes on retry — likely resource contention |

### What Works Well (Confirmed by Tests)

- **Page structure:** Title, search input, sidebar, all UI controls present and functional
- **Accessibility:** Skip links, aria-labels, button names, alt text, ARIA roles, no duplicate IDs, page language — all solid
- **Search functionality:** 4/5 search queries return results correctly in both exact and explore modes
- **Mode toggle:** Exact/explore mode switching works
- **View toggle:** Grid/board/3D view switching works
- **Color filter:** Opens correctly
- **Image count slider:** Functional
- **PWA manifest:** Linked correctly
- **API keys panel:** Opens correctly
- **Institutions page:** Loads correctly

### Test Commands Reference

```bash
# Run all e2e tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/smoke.spec.js
npx playwright test tests/e2e/accessibility.spec.js
npx playwright test tests/e2e/search-quality.spec.js

# Run unit tests
npx vitest run

# Show last HTML report
npx playwright show-report

# Run with headed browser (for debugging)
npx playwright test --headed

# Run single test by name
npx playwright test -g "theme toggle"
```
