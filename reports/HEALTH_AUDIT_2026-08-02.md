# InspoSearch — Health Audit & Improvement Plan

**Date:** 2026-08-02
**Scope:** live site, Cloudflare workers, search pipeline, source coverage
**Method:** live endpoint probing, burst rate-limit testing, coverage-report analysis, source code review

---

## 1. Health check results

| Check | Result |
|---|---|
| `insposearch.org` loads | ✅ HTTP 200, 265 ms, 53 KB |
| API worker `/health` | ✅ HTTP 200, 110 ms |
| API worker `/sources` | ✅ HTTP 200, 15 sources listed |
| Image proxy | ⚠️ alive, but 404s on valid upstream images |
| Unit tests | ✅ 51/51 pass |
| Source coverage (real browser audit) | ❌ **18 of 297 sources fire (6.1%)** |
| Console errors per search | ❌ ~800 |

The **static site** is healthy and fast. The **search engine behind it** is not.

---

## 2. Critical findings

### 2.1 The API worker rate-limits the app at 60 req/min per IP

Verified live — 70 concurrent requests to `/health`:

```
60 × HTTP 200
10 × HTTP 429  (rate limit exceeded)
```

`api/worker.js` sets `RATE_LIMIT = 60` per minute per IP, applied to **every** endpoint
including `/proxy`.

A single search fires **120–200 source calls** (`src/app.js` — `selectDynamicSources(keyword, 120)`
and `selectDynamicSources(keyword, 200)`). The `safeFetch` CORS-retry path in `src/core.js`
routes every CORS-blocked source through `/proxy`. One search can therefore consume the
entire per-minute budget; the next search inside that minute gets 429s across the board.

**This is the root cause of "search quality degrades the more I search."**

### 2.2 `/proxy` access control was too permissive — FIXED and deployed 2026-08-02

The proxy decided access using a request header that cannot be trusted from non-browser
clients. The practical effect was that the destination set was unbounded rather than
limited to the cultural-heritage APIs the proxy exists to serve — a cost exposure on the
project's Cloudflare account, and a reputational one.

Access is now decided by destination host only, against an explicit allowlist plus an
institution-domain suffix list. The pre-existing SSRF guard for private, loopback and
link-local addresses was verified correct and left in place.

Verified against the deployed worker.

*(Detail deliberately omitted — this repository is public. See the commit diff for the
implementation.)*

### 2.3 Deployed code was not committed

The `api/worker.js` changes above were live in production but uncommitted in git, so the
repository did not describe what was running. Resolved 2026-08-02.

---

## 3. Answers to the five questions

### Q1 — Why does search quality drop the more I search?

Ranked by impact:

1. **The 60/min worker rate limit** (§2.1). Sources begin returning empty responses.
2. **Empty responses are punished.** `src/core.js` — 5 consecutive empty results pauses a
   source for 5 minutes. A rate-limited source is indistinguishable from a dead one, so
   HTTP 429s get healthy sources benched.
3. **Load-more drifts off-query.** `src/app.js` — page 2 uses `keywords[1]`, page 3 uses
   `keywords[2]`; these are Datamuse synonyms, not the user's term. Deep scrolling stops
   searching for what was typed.
4. **`_unavailableSources` never resets.** `src/core.js` — a source whose data file 404s
   once is excluded for the remainder of the browser tab session. The pool only shrinks.
5. **Upstream throttling.** The Met, Europeana, and Cleveland all rate-limit bursts.

### Q2 — Why do many subjects have very few good images?

Because roughly 16 sources are doing all the work, not 297.

The 10-category sweep returned 2,349 cards from 16 distinct sources. Cleveland, Wellcome,
the Met, and the V&A account for about two-thirds. Two nominally "active" sources returned
1 and 5 cards in total.

Three causes:

- **15 upstream APIs are fully dead** — 0 successes / 10 attempts in every category:
  Cooper Hewitt, WikiArt, Gallica BnF, Carnegie, MNW Poland, Te Papa, Auckland Museum,
  MAAS, Cornell, Folger, ÖNB, NYPL, Louvre Abu Dhabi, NHM data, Kulturarvsdata.
- **10 of 12 endpoints in the proxy allowlist return 403/404/405** — dead URLs in config.
- **8 high-inventory sources are key-gated and switched off**: Europeana, Harvard, DPLA,
  Smithsonian, Trove, Pexels, Pixabay, Unsplash. Adapters already exist for all of them.

A narrow query such as "sculpture" or "textile" is effectively querying four museums.

### Q3 — Why do specific queries still return poor images?

- **Ranking is text-only.** `scoreItemRelevance` in `src/core.js` scores title, artist,
  tags, and description strings. Nothing inspects the image. A well-titled catalogue card
  with a poor scan outranks a strong image with a blank title.
- **The junk filter only runs in exact mode.** In `src/app.js` the conference-photo /
  book-metadata / generic-title filters sit inside `if (STATE.searchMode === 'exact')`.
  Explore mode gets none of them.
- **Zero-relevance items are retained** — the filter is `score >= 0`, a deliberate choice
  to protect rare queries. Good for recall, poor for precision.
- **Broken images stay in the grid.** ~800 console errors per search; many are images that
  will never load.

### Q4 — What else should be improved?

- `insposearch/app.js` (the esbuild output) is committed **and** modified — source and
  bundle are both in git and drifting apart.
- `src/app.js` is 9,401 lines covering search, rendering, AI, boards, and 3D in one file.
- The image proxy 404s a plain Wikimedia URL (their bot policy rejects the current
  User-Agent) and collapses all upstream failures into 404/502, so clients cannot tell
  "permanently gone" from "retry later."
- Five Digital Commonwealth IIIF IDs 404 repeatedly within one session — stale records
  that nothing prunes.
- 51 tests for 17,500 lines, concentrated on core utilities. The source adapters — where
  the failures actually are — are untested.
- Sweep JSONs, console logs, and trace scripts are loose in the repository root.

### Q5 — Can it be faster, and can results be much better?

**Faster.** The page itself is already fast (265 ms). The latency is in the search:

- Stop spending calls on the 15 permanently dead sources.
- Stop tripping the app's own rate limit.
- Cache popular queries at the edge in Cloudflare KV — repeat searches become instant.

**Better.** Yes, substantially, and mostly without adding sources. Enabling the 8
key-gated sources alone roughly triples available inventory.

---

## 4. Plan

### Week 1 — stop the bleeding

1. Raise the worker rate limit and give `/proxy` its own, larger budget sized to a real
   search; keep a tight budget on KV-writing endpoints.
2. Close the open proxy: restrict trusted-Origin proxying to cultural-heritage hosts
   rather than the entire internet. Retain the SSRF guard.
3. Commit the deployed worker code so git matches production.
4. Stop counting HTTP 429 as a source "miss" — a throttled source is not a broken one.

### Week 2 — restore the sources

5. Add the 8 missing API keys (Europeana, Harvard, DPLA, Smithsonian, Trove, Pexels,
   Pixabay, Unsplash). Largest single quality gain available.
6. Triage the 15 dead APIs: locate the current endpoint, move to nightly pre-fetch, or
   delete. As-is they contribute only latency.
7. Remove the dead endpoints from the proxy allowlist.

### Week 3 — quality

8. Apply the junk-title filter in explore mode, not just exact mode.
9. Add image signals to ranking: dimensions, aspect ratio, and whether the image loaded.
10. Fix load-more to keep paginating the user's own term; fall back to synonyms only on
    genuine exhaustion.
11. Reset `_unavailableSources` at the start of each new query.

### Week 4 — speed and structure

12. Cache hot queries in Cloudflare KV at the edge.
13. Split `src/app.js` into search / render / AI / board modules.
14. Add a nightly automated source-health check so upstream API changes surface within
    24 hours.

---

## 4b. Dead-source triage (Week 2, item 6) — verified 2026-08-02

Every failing upstream was called directly with the project User-Agent and the
exact URL its adapter builds. Results below are what the endpoint actually
returned, not what the sweep inferred.

### A — Alive; was failing only on browser CORS

These return valid data server-side. The `safeFetch` proxy-retry shipped in
Week 1 should recover them with no further work; confirm on the next sweep.

| Source | Evidence |
|---|---|
| `wikiart` | HTTP 200, 58 KB JSON |
| `nhm_london` (`data.nhm.ac.uk`) | HTTP 200, 68 KB JSON (CKAN API) |

### B — Alive; needs a free API key

| Source | Evidence | Action |
|---|---|---|
| `cooperhewitt` | HTTP 400 `"Required access token missing"` | register for a free token |
| `nypl` | HTTP 401 | NYPL requires an `Authorization: Token` header |
| `tepapa` | `collections.` 308-redirects to the public website | real API is `data.tepapa.govt.nz`, key required |

### C — Alive; adapter is wrong

| Source | Evidence | Fix |
|---|---|---|
| `soch` (`kulturarvsdata.se`) | HTTP 400 — *"recordSchema http://kulturarvsdata.se/json# does not exist or is not supported"* | request a supported recordSchema |
| `gallica` | returns XML despite `format=json`; also intermittently `403 Access Interdit` | parse SRU XML; add backoff |
| `auckland` | the `?q=` search endpoint returns `image/jpeg`, not JSON | wrong endpoint for search |
| `chronicling` | `chroniclingamerica.loc.gov` 308-redirects to `www.loc.gov/chroniclingamerica/` | follow redirect, or move to the LOC collections JSON API (verified 200, 2 MB) |

### D — Retired: DNS no longer resolves

Added to `RETIRED_SOURCES` in `src/state.js` and removed from the proxy
allowlist. They consumed a request slot every search and always returned empty.

| Source | Host |
|---|---|
| `carnegie` | `api.collection.carnegieart.org` — NXDOMAIN |
| `mnw` | `api.mnw.art.pl` — NXDOMAIN |
| `folger` | `collections.folger.edu` — NXDOMAIN |

### E — Blocked or moved; left in place, needs investigation

Not retired, because these are recoverable rather than gone.

| Source | Evidence |
|---|---|
| `cornell` | HTTP 202 + HTML — bot challenge page |
| `maas` | HTTP 429 + 34 KB HTML — bot/CDN block |
| `louvre` (Abu Dhabi) | HTTP 403; the target is a web page, not an API |
| `ago` | HTTP 526 — upstream TLS failure |
| `mak` | HTTP 200 but HTML, not JSON |
| `onb` | HTTP 404 — endpoint moved |
| `mna` (INAH) | HTTP 404 |
| `lacma` | HTTP 404 |
| `munch`, `pem`, `npg`, `mauritshuis` | HTTP 301/308 — endpoints moved |

### Recommendation on API keys

The 8 key-gated sources (Europeana, Harvard, DPLA, Smithsonian, Trove, Pexels,
Pixabay, Unsplash) are currently read from `localStorage`, so they only work for
users who register their own keys — which is approximately nobody. Registering
one set of keys and holding them as Cloudflare Worker secrets, served through
the API worker, would switch these on for **every** visitor. That is the single
largest available gain in result quality and should lead Week 2.

---

## 5. Summary

insposearch.org is up and fast, but it is running on approximately 6% of its sources and
rate-limits itself after a single search. Fixing the rate limit and adding the missing API
keys will produce a dramatic improvement before a single new adapter is written.
