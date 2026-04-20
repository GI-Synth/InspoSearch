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
- [ ] **Step 5** — Scope health misses by intent-tag instead of globally.
- [ ] **Step 6** — Raise fetch concurrency to 40 + adaptive timeout ceiling to 12s.

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
