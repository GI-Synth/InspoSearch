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
- [ ] **Step 2** — Multi-wave fetching with synonym expansion (reuse existing Datamuse/Wikidata expansion already in fetchers.js).
- [ ] **Step 3** — Raise per-source floors + add pagination on "load more".
- [ ] **Step 4** — Fix intent penalty for unclassified/weakly-classified queries.
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
