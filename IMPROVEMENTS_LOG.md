# Result-Yield Improvements Log

Tracks incremental changes aimed at increasing the number of relevant images returned per search. One step at a time — each step is pushed, tested, confirmed, then the next begins.

## Baseline problem

Searches yield far fewer results than source inventories suggest. Root causes identified:
1. Single wave of raw keyword — no synonym expansion across sources per call.
2. `perSource ≈ 12` per source is too low; high-inventory APIs support 50+.
3. Exact-mode filter requires single-word queries to match **in the title** (discards most results).
4. Intent penalty excludes 2300+ sources for weakly-classified queries.
5. Global health-miss tracking pauses sources across unrelated queries.
6. Fetch concurrency (25) + 5s timeout drops slow sources silently.

## Planned steps (in order)

- [x] **Step 1** — Relax exact-mode single-word filter from title-only to title/tags/artist/desc.
- [x] **Step 2** — Multi-wave fetching with synonym expansion (reuse existing Datamuse/Wikidata expansion already in fetchers.js).
- [x] **Step 3** — Raise per-source floors + add pagination on "load more".
- [x] **Step 4** — Fix intent penalty for unclassified/weakly-classified queries.
- [x] **Step 5** — Scope health misses by intent-tag instead of globally.
- [x] **Step 6** — Raise fetch concurrency to 40 + adaptive timeout ceiling to 12s.
- [x] **Step 6b** — Extend 12s slow-source ceiling to 12 more known-slow adapters (Wave A).
- [x] **Step 7** — Fix load-more / infinite-scroll: paginated-only fan-out + synonym variety + exhausted-state guard.

---

## Step 1 — Relax exact-mode single-word filter ✅

**Date:** 2026-04-20
**File:** `src/app.js` lines 173-176
**Change:** Single-word exact queries no longer require the term in the title. Now they match against `title | description | artist | tags` (same haystack as multi-word). Relevance scoring in `scoreItemRelevance` still boosts title matches — so title-matched items rank first, but off-title matches (previously discarded) now appear further down instead of vanishing.

**Before:**
```js
if (isSingleWord) {
  return matchesAsWholeWord(title, terms[0]);
}
```

**After:**
```js
// Match across title/desc/artist/tags — scoring boosts title hits so
// title-matched items still rank first; off-title matches appear below.
const hay = `${title} ${item.description || ''} ${item.artist || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
return terms.some(t => matchesAsWholeWord(hay, t));
```

**Expected effect:** More results on single-word exact queries (e.g. "brutalism", "renaissance", "bauhaus"). Title-first ranking preserved via `scoreItemRelevance`.

**Rollback:** Revert the edit in `src/app.js` (collapse to single `matchesAsWholeWord(title, terms[0])` path), then `npm run build`.

**How to test:**
- Search `brutalism` in exact mode — should return noticeably more results than before.
- Confirm title-matched items still appear at the top of the grid.
- Try a known tight query (`van gogh`) to ensure relevance ranking still works.

---

## Step 2 — Multi-wave fetching with synonym expansion ✅

**Date:** 2026-04-20
**File:** `src/app.js` — hoisted `_PAGE2_FETCHERS` map out of Phase 2 block; added new Wave 2 synonym block before the "no results" check (~line 453).

**Change:**
1. Moved `_PAGE2_FETCHERS` (Harvard, Smithsonian, V&A, Cleveland, Flickr, NGA, Gallica, DPLA, Wellcome, Europeana, Chicago — all paginated adapters) from inside the Phase 2 `if` block up to module scope within `fetchAll`, so it can be reused.
2. Added a new Wave 2 after Phase 2 that fires expanded keywords against top productive sources:

```js
if (keywords.length > 1 && all.length < totalCount && !signal.aborted) {
  const synTerms = keywords.slice(1, 4).filter(k => k && k !== keyword);
  if (synTerms.length) {
    const topSources = [...sourceYield.entries()]
      .filter(([id]) => _PAGE2_FETCHERS[id])
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    if (topSources.length) {
      const deficit = totalCount - all.length;
      const perCall = Math.max(8, Math.ceil(deficit / (topSources.length * synTerms.length)));
      await Promise.allSettled(
        topSources.flatMap(([sourceId]) =>
          synTerms.map(term =>
            trackSource(sourceId, _PAGE2_FETCHERS[sourceId](term, perCall, signal, 1))
          )
        )
      );
    }
  }
}
```

**Expected effect:** In explore mode, after initial results come back, up to 3 synonym variants (from existing `expandKeywords` → Datamuse + Wikidata) are fired against the 6 most productive sources. Adds fresh items via URL-dedup. Exact mode untouched because `STATE.keywords` stays length 1.

**Safety:**
- No-op in exact mode (keywords.length === 1).
- No-op if already hit target (`all.length >= totalCount`).
- Only uses paginated adapters that already exist — no new adapter code.
- URL dedup prevents duplicates from synonym overlap with original wave.

**Rollback:** In `src/app.js`, (1) move `_PAGE2_FETCHERS` definition back inside the Phase 2 `if` block, (2) delete the entire "Wave 2: Synonym expansion" block, then `npm run build`.

**How to test:**
- Explore mode: search niche term like `wabi sabi`, `bauhaus`, or `art nouveau`. Should load more results over ~2-3 seconds as synonym wave fires. Check Network tab for second burst of requests to Harvard/Smithsonian/Europeana/etc with different query params (synonyms).
- Exact mode: same queries should behave identically to Step 1 — no change, no extra requests.
- Multi-word (e.g. `van gogh`) — should still work, relevance-ranked normally.

---

## Step 3 — Raise per-source floors + pagination ✅

**Date:** 2026-04-20
**Files:** `src/state.js` (PER_SOURCE_LIMIT map), `src/app.js` (base floor + limitFor switches).

**Changes:**
1. **`src/state.js` — expanded `PER_SOURCE_LIMIT`:**
   - Bumped existing: met 40→60, chicago/cleveland/va/rijks/loc 30→50, europeana 30→60, flickr 25→50, nga/gbif/inat 30→40, carnegie/cudl/folger/hallwyl/nivaagaard 12→20.
   - Added new: harvard 40, smithsonian 40, dpla 50, wellcome 40, gallica 40, bhl 30, yale 30, getty 30, nypl 30.

2. **`src/app.js` line 104 — raised base floor:**
   ```js
   // Before: Math.max(12, …) / perSource+6
   // After:  Math.max(20, …) / perSource+8
   ```

3. **`src/app.js` — switched proven-capacity sources from `fetchBatch` to `limitFor(id)`:**
   flickr, rijksmuseum, harvard, smithsonian, gallica, bhl, dpla, wellcome, getty, yale, nypl.

**Expected effect:** Sources with proper search APIs now pull 30-60 items per call instead of ~18. Should significantly increase initial result volume on popular queries. Pagination (load-more / infinite scroll) was already in place at `fetchMoreResults()` — untouched.

**Safety:**
- Load-more path (`fetchMoreResults`) uses its own offset-based perSource calculation; unaffected by these floor changes.
- Sources not in PER_SOURCE_LIMIT still get `fetchBatch` (now 28), so small-catalog sources aren't over-asked.

**Rollback:** Revert `PER_SOURCE_LIMIT` entries in `src/state.js` to previous values, revert `Math.max(20,…)`→`Math.max(12,…)` and `perSource+8`→`perSource+6` in `src/app.js`, and switch the limitFor() calls back to `fetchBatch`. Then `npm run build`.

**How to test:**
- Search a broad term (`castle`, `flower`, `portrait`). Count should be substantially higher on first wave.
- Scroll to bottom — load-more should still work identically, appending more results.
- Niche term — should still return results; no regression.

---

## Step 4 — Fix intent penalty for weakly-classified queries ✅

**Date:** 2026-04-20
**File:** `src/core.js` — `selectDynamicSources` (around lines 44-60).

**Change:** The zero-overlap penalty (`score -= 1`) now only fires when the query has **high-confidence classification** from `classifyQueryV2` — i.e. when one of `{isArtist, era, movement, isSpecies, medium}` is truthy. Weakly-classified queries (relying on keyword-heuristic `classifyQueryExtended` intent flags alone) no longer exclude the long tail of sources.

**Before:**
```js
if (overlap === 0 && intentTags.length >= 2) score -= 1;
```

**After:**
```js
const isHighConfidence = !!(qcv2.isArtist || qcv2.era || qcv2.movement ||
                            qcv2.isSpecies || qcv2.medium);
// ...
if (overlap === 0 && isHighConfidence && intentTags.length >= 2) score -= 1;
```

**Expected effect:** Ambiguous queries (e.g. `blue`, `pattern`, `morning`, `sketch`) will now reach 2300+ sources that were previously down-ranked out of the top-N. Focused queries (`van gogh`, `1920s`, `baroque`, `Panthera leo`) still get the penalty so their ranking stays tight.

**Rollback:** In `src/core.js`, remove the `isHighConfidence` block and revert the penalty line to `if (overlap === 0 && intentTags.length >= 2) score -= 1;`. Then `npm run build`.

**How to test:**
- Search an ambiguous term (`blue`, `pattern`, `morning`) — result count should be higher than before.
- Search a focused term (`van gogh`, `baroque`, `1920s`) — ranking should still be tight and relevance-ordered.
- No regression on explore vs exact mode behavior.

---

## Step 5 — Scope health misses by intent-tag ✅

**Date:** 2026-04-20
**File:** `src/core.js` — `recordSourceResult` and `isSourceHealthy` rewritten.

**Change:** Source health miss counters are now tracked **per intent key** derived from the current query's classification (e.g. `art+history`, `nature`, `generic`). A source that fails on "baroque" (intent: art+history) no longer gets paused for "hummingbird" (intent: nature). New nested shape:

```js
sourceHealth[sourceName] = {
  hits, misses (legacy mirror), lastSeen,
  intent: {
    'art+history': { misses, pausedAt, notified },
    'nature':      { misses, pausedAt, notified },
    'generic':     { misses, pausedAt, notified },
  }
}
```

Added `_currentIntentKey()` helper that reads `STATE.query`, runs `classifyQueryExtended`, and joins the matched intent tags (sorted) or returns `'generic'`. `isSourceHealthy` gates on the current intent's slot only. `recordSourceResult` increments/clears the current intent's slot. Auto-recovery via `HEALTH_RECOVERY_MS` is now also per-intent.

**Expected effect:** Sources no longer get globally paused by a failing query on an unrelated topic. The long tail of niche sources stays available across diverse searches within a session. Legacy global `misses` field mirrored so the active-counter UI still works.

**Safety:**
- Old `sourceHealth` entries without `.intent` get migrated lazily on first access via `_ensureHealthEntry`.
- Legacy `entry.misses` kept in sync for any UI code reading it.
- Same `HEALTH_MISS_LIMIT` / `HEALTH_RECOVERY_MS` constants — just scoped differently.

**Rollback:** In `src/core.js`, revert `recordSourceResult` and `isSourceHealthy` to the previous shape (single global `h.misses`). Remove `_currentIntentKey` and `_ensureHealthEntry`. Then `npm run build`.

**How to test:**
- Run several unrelated queries in one session (e.g. `brutalism`, `hummingbird`, `van gogh`, `quilt`, `galaxy`). A source that gets paused on one intent should still be tried on the next intent.
- Reload the page — stored health should still load without error (legacy shape migrated silently).
- Active-sources counter should still update normally.

---

## Step 5b — Reset health on every new query ✅

**Date:** 2026-04-20
**Files:** `src/core.js` (new `resetHealthForNewQuery`), `src/app.js` (call it on search).

**Change:** Every distinct new query clears miss counters and pause timers across all sources. Hits / lastSeen are preserved. Previously, a paused source had to wait out `HEALTH_RECOVERY_MS` (5 min) before retrying — too long when the user changes topic and the block was from an unrelated query.

```js
// core.js
export function resetHealthForNewQuery() { /* zeroes misses + pauses, keeps hits */ }

// app.js — in the search entry, right after STATE.query is set
if (STATE.query && STATE.query !== _priorQuery) resetHealthForNewQuery();
```

**Expected effect:** Changing query instantly gives every source another chance — no 5-minute penalty carrying over. Combined with Step 5 (intent-scoped pauses), sources are now only paused *within* a single active search.

**Rollback:** Remove `resetHealthForNewQuery` from `src/core.js`, remove the import and the call site in `src/app.js`. `npm run build`.

**How to test:**
- Run a query that pauses several sources (a niche term producing many empty sources).
- Immediately run a different query — previously-paused sources should be retried straight away (no "paused" toast carrying over).

---

## Step 6 — Raise concurrency + slow-source timeout ceiling ✅

**Date:** 2026-04-20
**File:** `src/core.js`

**Change 1 — Fetch concurrency semaphore 25 → 40.** More sources can fly in parallel, so the long tail of slow-but-valid responses no longer gets queued behind the fastest 25.

**Change 2 — Adaptive timeout ceiling is per-source.** Known-slow sources (Gallica, BHL, LoC, BnF, Internet Archive, Europeana) now get a 12s ceiling instead of 8s. Other sources keep 8s. First request with no timing history: slow sources start at 12s (not the 5s default) so cold-start responses aren't aborted.

**Before:**
```js
export const _fetchSemaphore = { running: 0, queue: [], limit: 25, _totalFailed: 0 };
// …
const timeout = timing
  ? Math.min(8000, Math.max(4000, Math.round(timing.avg * 2)))
  : CONSTANTS.FETCH_TIMEOUT;
```

**After:**
```js
export const _fetchSemaphore = { running: 0, queue: [], limit: 40, _totalFailed: 0 };
// …
const _SLOW_SOURCES = new Set(['gallica', 'bhl', 'loc', 'bnf', 'internetarchive', 'europeana']);
export function sourceFetch(url, opts = {}, sourceName) {
  const timing = _sourceTimings[sourceName];
  const ceiling = _SLOW_SOURCES.has(sourceName) ? 12000 : 8000;
  const timeout = timing
    ? Math.min(ceiling, Math.max(4000, Math.round(timing.avg * 2)))
    : (_SLOW_SOURCES.has(sourceName) ? ceiling : CONSTANTS.FETCH_TIMEOUT);
```

**Expected effect:**
- More parallel fetches → more sources contribute per wave.
- Slow-source first-hit success rate rises (Gallica/BHL commonly return in 6-10s on cold cache).
- Small risk of more memory pressure / more 429s; mitigated by existing per-source backoff + health tracking.

**Rollback:** Revert `limit: 40` to `25` and remove the `_SLOW_SOURCES` set + ceiling logic. `npm run build`.

**How to test:**
- Search a term that hits Gallica/BHL (e.g. `botanical illustration`) — they should contribute results more often than before.
- Watch the Network panel during search — you should see up to ~40 concurrent in-flight requests.

---

## Step 6b — Extend slow-source ceiling to 12 more adapters ✅

**Date:** 2026-04-20
**File:** `src/core.js` — `_SLOW_SOURCES` set

**Motivation:** After Step 6, only 6 adapters (Gallica, BHL, LoC, BnF, Internet Archive, Europeana) got the 12s ceiling. A broader audit identified 12 more adapters that are structurally slow: national libraries with SRU/OAI endpoints, large aggregators, and regional databases that routinely respond in 7-11s on cold cache and were silently timing out at 8s.

**Before:**
```js
const _SLOW_SOURCES = new Set(['gallica', 'bhl', 'loc', 'bnf', 'internetarchive', 'europeana']);
```

**After (Wave A additions):**
```js
const _SLOW_SOURCES = new Set([
  'gallica', 'bhl', 'loc', 'bnf', 'internetarchive', 'europeana',
  'trove', 'chronicling', 'dpla', 'digitalnz', 'ddb', 'finna',
  'joconde', 'bodleian', 'bsb', 'cudl', 'onb', 'mnw',
]);
```

**Wave A rationale (by source):**
- `trove` — National Library of Australia; API often 8-10s.
- `chronicling` — Chronicling America (LoC newspaper archive); full-text search latency.
- `dpla` — Digital Public Library of America aggregator; multi-provider fan-out.
- `digitalnz` — National Library of New Zealand aggregator.
- `ddb` — Deutsche Digitale Bibliothek; national aggregator, heavy SPARQL backend.
- `finna` — Finnish Heritage Agency aggregator.
- `joconde` — French national museum database (data.culture.gouv.fr); OpenData platform adds latency.
- `bodleian`, `bsb`, `cudl`, `onb` — University / national library SRU endpoints; SRU is inherently slow.
- `mnw` — Muzeum Narodowe w Warszawie; slow cold-cache.

**Wave B (deferred, measure first):** smithsonian, harvard, wellcome, nypl, soch, parismusees, folger — borderline; will add only if observed timings justify it.

**Expected effect:**
- These 12 sources should contribute results on queries where they were previously dropped at the 8s mark.
- Non-Western and non-English coverage improves meaningfully (Joconde, MNW, ONB, DDB, Finna, Trove).
- Risk: if one of these is actually broken (returning 200 slowly forever), the 12s wait adds up; existing health-miss tracking + per-intent scoping (Step 5) should contain that.

**Rollback:** Remove the Wave A additions from the set. `npm run build`.

**How to test:**
- Query a French term ("impressionnisme") and confirm Joconde contributes.
- Query a German term ("Bauhaus") and confirm DDB / ONB contribute.
- Query something with clear Australian relevance ("indigenous art") and confirm Trove contributes.
- Watch DevTools Network panel — requests to these domains should now have ~12s timeouts instead of ~8s.

---

## Step 7 — Fix load-more / infinite-scroll ✅

**Date:** 2026-04-20
**Files:** `src/app.js` (hoisted `PAGE2_FETCHERS`, rewrote `fetchMoreResults`, `updateLoadMoreLabel`, added `initInfiniteScroll()` calls), `src/state.js` (added `exhausted` + `emptyStreak`).

**Root cause:**
The old `fetchMoreResults` fanned out to **every** source in the pool with `adapter(kw, perSource, signal, offset)`. Only ~11 adapters actually honor the `offset`/`page` argument — the other 2,800+ ignored it and returned their page-1 results, which were then dedup-filtered into oblivion. On many queries this meant load-more fired ~2,000 wasteful requests and added zero new items to the grid.

The infinite-scroll observer then had no way to stop: sentinel stays intersected, but `IntersectionObserver` doesn't refire without a state change, so the UI silently froze in "nothing happens when I scroll" mode.

**Fix summary:**
1. **Hoisted `PAGE2_FETCHERS` to module scope** (was a local `const` inside `fetchAll`). This is the canonical set of adapters that support offset/page pagination: `harvard, smithsonian, va, cleveland, flickr, nga, gallica, dpla, wellcome, europeana, chicago`.
2. **Rewrote `fetchMoreResults` with two strategies:**
   - **Strategy A** — call only `PAGE2_FETCHERS` with the primary keyword at the incremented page. Real pagination, real new items.
   - **Strategy B** — in explore mode only, fan out a *synonym* (cycling through `STATE.keywords` per page) to the top ~10 non-paginated sources that already contributed. This pulls in fresh results from adapters that don't paginate but do respond to different query terms.
3. **Added exhausted-state guard:** after 2 consecutive load-more calls that yield zero novel items, set `STATE.exhausted = true`, disconnect the infinite-scroll observer, and update the button label to `no more results`. Prevents the silent spin and the "infinite scroll is doing nothing" feeling.
4. **Re-initialize the infinite-scroll observer on each new search** (`initInfiniteScroll()` now also called when `more-container` becomes visible), so a previously-exhausted query doesn't disable scroll on the next one.
5. **Reset `exhausted` and `emptyStreak` at the top of every `runSearch`.**

**Expected effect:**
- Load-more actually adds items on most queries (previously: silent no-op on many).
- Infinite scroll triggers cleanly and stops cleanly when the paginated pool is drained.
- Network tab shows ~11 requests per load-more instead of ~2,000.
- Explore mode benefits most — synonym cycling pulls variety from non-paginated adapters.

**Rollback:**
- `src/app.js`: revert `fetchMoreResults` to the pre-Step-7 version (fan-out to all sources with naive offset), move `PAGE2_FETCHERS` back into `fetchAll` as `_PAGE2_FETCHERS`, remove `initInfiniteScroll()` calls from the two `more-container` display-flex spots, revert `updateLoadMoreLabel` to drop the exhausted branch.
- `src/state.js`: remove `exhausted` and `emptyStreak` fields.
- `npm run build`.

**How to test:**
- Broad query (`castle`, `portrait`) — scroll to bottom, button should go from `load more · N shown` → `loading…` → `load more · M shown` with M > N.
- Run a narrow query with few paginated sources hitting — after 2 empty pages the button should say `no more results` and auto-scroll triggering should stop.
- Switch queries — load-more/infinite-scroll should work again on the new query (observer reattached).
- Exact mode: load-more only uses paginated adapters (no synonym fan-out); should still yield items for queries that have depth in Met/Harvard/Europeana.
- DevTools Network panel: confirm load-more fires ~11 paginated requests + up to ~10 synonym requests (explore mode), not thousands.
