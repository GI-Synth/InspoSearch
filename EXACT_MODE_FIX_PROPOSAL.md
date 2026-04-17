# Exact Mode: Substring Matching Fix & Result Count Proposal

## Problem 1: "demon" matches "demonstration"

### Root cause

Every exact-mode filter uses **`String.includes()`** — a plain substring check with no word-boundary awareness.

Three locations all share this bug:

| Location | Code | Line |
|---|---|---|
| `onSourceResult()` filter | `title.includes(terms[0])` | [app.js](src/app.js#L172) |
| `getDisplayResults()` filter | `terms.some(t => hay.includes(t))` | [core.js](core.js#L743) |
| `scoreItemRelevance()` | `title.includes(q)`, `title.includes(t)`, etc. | [core.js](src/core.js#L637-L653) |

So searching **"demon"** matches any of: `demonstration`, `lemonade`, `Daemon`, `Vandemonium`, as well as artist/person names containing "demon" (e.g. last-name "Demon").

### Proposed fix

Replace every `haystack.includes(term)` in exact-mode paths with a **word-boundary regex test**:

```js
// Utility — create once per search, reuse everywhere
function matchesAsWholeWord(hay, term) {
  // \b = word boundary: matches edges between \w and \W (or string start/end)
  // Escaped term to handle any special regex chars in user input
  const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
  return re.test(hay);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**Behaviour**:
- `matchesAsWholeWord("red demon mask", "demon")` → **true** ✓
- `matchesAsWholeWord("ancient demon", "demon")` → **true** ✓
- `matchesAsWholeWord("demonstration", "demon")` → **false** ✓
- `matchesAsWholeWord("Portrait by J. Demon", "demon")` → **true** (word boundary matches — this is correct since "Demon" appears as a standalone word; the person's name IS the word "demon")

### Artist-name awareness (smart demotion, not blocking)

If someone searches "demon" and an item's artist is named "Demon" but the title/description/tags have nothing to do with demons, that result is noise. **But** if someone searches "Monet" they obviously want works by Monet — so we can't blindly penalize artist-only matches.

**Solution: detect whether the query is likely an artist-name search by checking the results themselves.**

After the initial batch of results arrives, count how many items have the query in their `artist` field. If a significant portion do (e.g. ≥3 items), the query is likely an artist name → don't demote artist matches. If very few do (0-2), it's likely a subject/concept search → demote items where the term only appears in the artist field.

```js
// In scoreItemRelevance(), after computing field matches:
if (STATE.searchMode === 'exact') {
  const inTitle  = matchesAsWholeWord(title, q);
  const inDesc   = matchesAsWholeWord(desc, q);
  const inTags   = matchesAsWholeWord(tags, q);
  const inArtist = matchesAsWholeWord(artist, q);

  // Artist-only match: demote UNLESS query looks like an artist search
  // (detected via _isLikelyArtistQuery flag set during getDisplayResults)
  if (inArtist && !inTitle && !inDesc && !inTags && !STATE._isLikelyArtistQuery) {
    score -= 8; // strong demotion — pushes to bottom but doesn't hide
  }
}
```

The detection logic runs once in `getDisplayResults()` before scoring:

```js
// Inside getDisplayResults(), before the .map(scoreItemRelevance) step:
if (STATE.searchMode === 'exact' && terms.length) {
  const q = terms.join(' ');
  const artistMatchCount = base.filter(item =>
    matchesAsWholeWord((item.artist || '').toLowerCase(), q)
  ).length;
  // If 3+ items have the query in artist field, it's likely an artist search
  STATE._isLikelyArtistQuery = artistMatchCount >= 3;
}
```

**Examples**:
- Search "Monet" → 50+ items have "Monet" in artist → `_isLikelyArtistQuery = true` → no demotion → all Monet works shown ✓
- Search "demon" → 1 item has artist "Demon" → `_isLikelyArtistQuery = false` → that item demoted to bottom ✓
- Search "Rembrandt" → many artist matches → shown normally ✓
- Search "angel" → 0-1 artist matches → subject search, artist-only matches demoted ✓

### Files to change

1. **`src/core.js`** — Add `escapeRegExp()` and `matchesAsWholeWord()` utility functions (or inline the regex). Update:
   - `scoreItemRelevance()`: replace all `.includes()` term checks with `matchesAsWholeWord()`
   - `getDisplayResults()`: replace `terms.some(t => hay.includes(t))` with `terms.some(t => matchesAsWholeWord(hay, t))`
   - Add artist-only demotion with `_isLikelyArtistQuery` check
   - Add `_isLikelyArtistQuery` detection before scoring loop

2. **`src/app.js`** — `onSourceResult()` filter: replace `title.includes(terms[0])` and `terms.some(t => hay.includes(t))` with `matchesAsWholeWord()` calls

3. **`src/app.js`** — Post-processing rogue-source filter (~line 2250): replace `.includes(lq)` with word-boundary check

4. **`src/state.js`** — Add `_isLikelyArtistQuery: false` to STATE initialization

Total: ~25-30 line changes across 3 files.

---

## Problem 2: Requesting 300 results often returns far fewer

### Root causes (in order of impact)

**A. Per-source limits are too low for high counts**

The dynamic formula is: `perSource = ceil(imageCount / 60)`. With 300 requested, each source only gets **5 items**. After exact-mode filtering drops non-matching items, many sources contribute 0-2 items. With ~150 active sources × ~2 surviving items = ~300 max, but many sources return nothing for niche queries.

**B. Deep pagination only covers 3 sources**

Only Met (160 IDs), Europeana (180 items), and Chicago (150 items) get deep pagination in exact mode. The other ~147 sources get a single shallow fetch of 5-9 items each.

**C. 12-second wall-clock timeout**

`runSearch()` has a hard 12s abort. Slow sources that haven't responded by then contribute nothing.

**D. Exact-mode filtering discards heavily**

The `.includes()` filters (currently substring, proposed word-boundary) reject many items. This is by design but compounds the low per-source limits.

### Proposed fixes

**Fix A — Adaptive follow-up fetching from productive sources (primary fix)**

Instead of a static per-source limit, use a **two-phase fetch strategy** in exact mode:

**Phase 1** (current): Fetch the initial batch from all sources with current limits.

**Phase 2** (new): After Phase 1 completes, check which sources yielded a high ratio of valid results (survived exact-mode filtering). Fetch additional pages from those sources only.

```js
// After initial Promise.allSettled completes, in exact mode:
if (STATE.searchMode === 'exact' && all.length < totalCount && !signal.aborted) {
  // Track per-source yield: how many items survived exact-mode filtering
  // (sourceYield is populated inside onSourceResult)
  const topSources = [...sourceYield.entries()]
    .filter(([, count]) => count >= 3)           // source returned 3+ valid items
    .sort((a, b) => b[1] - a[1])                 // sort by yield descending
    .slice(0, 8);                                 // top 8 most productive

  const deficit = totalCount - all.length;        // how many more we need
  const perFollowUp = Math.ceil(deficit / Math.max(topSources.length, 1));

  // Fetch page 2 (and maybe 3) from top sources only
  await Promise.allSettled(topSources.map(([sourceId]) => {
    // Each source's fetcher supports page/offset params
    return fetchNextPage(sourceId, keyword, perFollowUp, signal, 2)
      .then(onSourceResult(sourceId))
      .catch(() => {});
  }));
}
```

**Where `sourceYield` is tracked**: Inside `onSourceResult()`, after the exact-mode filter, count how many items survived per source:

```js
const sourceYield = new Map();  // declared alongside seenIds, all, etc.

// Inside onSourceResult, after exact-mode filtering:
const prevCount = sourceYield.get(sourceName) || 0;
sourceYield.set(sourceName, prevCount + (items?.length || 0));
```

**Where `fetchNextPage()` comes from**: A new lightweight dispatcher that calls the existing fetcher with a page/offset parameter. Most APIs already support this:

| Source | Pagination param | Already supported? |
|---|---|---|
| Harvard | `page=N` (via `&page=N` URL param) | Needs `page` param added to `fetchHarvard()` |
| Smithsonian | `start=N` (offset) | Needs `start` param added to `fetchSmithsonian()` |
| Europeana | `start=N` | Already supported (`fetchEuropeana(kw, limit, signal, start)`) |
| Chicago | `page=N` | Already supported (`fetchChicagoArt(kw, limit, signal, page)`) |
| V&A | `page=N` | Needs `page` param added to `fetchVA()` |
| Cleveland | `skip=N` | Needs `skip` param added to `fetchCleveland()` |
| Flickr | `page=N` | Needs `page` param added to `fetchFlickrCommons()` |
| DPLA | `page=N` | Needs `page` param added to `fetchDPLA()` |
| Wellcome | `page=N` | Needs `page` param added to `fetchWellcome()` |

Most fetchers just need an optional `page` or `offset` parameter appended to their URL. The existing function signatures already take `(keyword, limit, signal)` — adding an optional 4th param is trivial.

**Why this is better than static limit increases**: 
- Doesn't waste API calls on sources that return 0 results for the query
- Automatically focuses bandwidth on sources that actually have relevant content
- Scales naturally — niche queries get more from the few sources that have them
- Doesn't slow down searches where the first batch already has enough results

**Fix B — Also raise the base per-source limit slightly for exact mode**

```js
const PRODUCTIVE_SOURCE_ESTIMATE = STATE.searchMode === 'exact'
  ? Math.max(30, 30 + Math.floor(dynamicActive * 0.3))
  : Math.max(60, 60 + Math.floor(dynamicActive * 0.4));
```

This gives ~10 items per source instead of 5 in Phase 1, providing more data to identify productive sources.

**Fix C — Increase deep pagination limits for the 3 existing deep sources**

Current: Met 40×4=160, Europeana 60×3=180, Chicago 50×3=150

Proposed: Met 40×6=240, Europeana 60×5=300, Chicago 50×5=250

These are already proven reliable. More pages = more candidates.

**Fix D — Extend exact-mode timeout**

```js
const SEARCH_TIMEOUT = STATE.searchMode === 'exact' ? 18000 : 12000;
```

The extra 6 seconds accommodates the Phase 2 follow-up fetches.

### Expected impact

| Change | Extra items (est.) |
|---|---|
| Adaptive follow-up (Phase 2) | +100-300 (from top producing sources) |
| Higher base per-source limits | +50-100 |
| More deep pagination pages | +150-200 |
| Longer timeout | +30-50 (from slow sources) |
| **Combined** | **+350-650 candidates before filtering** |

This should make reaching 300 displayed results achievable for most queries, and for popular queries could yield 400+.

---

## Summary of changes

| Priority | Change | Risk | Effort |
|---|---|---|---|
| **P0** | Word-boundary matching (`\b`) for all exact-mode filters | Low — strictly more correct | Small (~20 lines) |
| **P0** | Artist-name auto-detection + smart demotion | Low — adaptive, no false positives for artist searches | Small (~15 lines) |
| **P1** | Adaptive Phase 2 follow-up fetching from productive sources | Medium — new fetch logic | Medium (~40 lines + ~10 per fetcher needing page param) |
| **P1** | Raise base per-source limits for exact mode | Low — more API calls | Tiny (~3 lines) |
| **P1** | Increase deep pagination page counts (Met/Europeana/Chicago) | Low — well-tested APIs | Tiny (~3 lines) |
| **P2** | Extend exact-mode timeout to 18s | Low | Tiny (1 line) |
