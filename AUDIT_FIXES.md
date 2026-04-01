# Audit Fix Tracker — GPT-4.1 Cleanup (Mar 31 2026)

## Phase 1: Critical Runtime Bugs
| # | Issue | File | Status |
|---|-------|------|--------|
| 1 | `_sourceHealth` undefined → ReferenceError on health reset click | app.js:14839 | DONE |
| 2 | `_fetchSemaphore._totalFailed` never set → offline detection dead | app.js:6295 | DONE |
| 3 | Debounce captures stale `_updateSourcesActiveCounterImmediate` ref | app.js:1541 | DONE |

## Phase 2: Behavioral Regressions
| # | Issue | File | Status |
|---|-------|------|--------|
| 4 | `runSearch` triple-wrapped — SEO wrapper skipped via window.runSearch | app.js:14541 | DONE |
| 5 | `skipInExactMode` guard removed — skips sources in all modes now | app.js:340 | DONE |
| 6 | Search-as-you-type fires full `runSearch` every 500ms | app.js:14623 | DONE |

## Phase 3: Quality & Performance
| # | Issue | File | Status |
|---|-------|------|--------|
| 7 | LRU eviction in `setAITagsCache` iterates all localStorage keys | app.js:1650 | DONE |
| 8 | Era regex matches overly common terms (contemporary, modernist) | app.js:~680 | DONE |
| 9 | CSP `'unsafe-inline'` in script-src (security) | index.html:37 | DONE |

---
## Health Before: ~60%
## Health After: 92%
