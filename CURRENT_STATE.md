# Current State — InspoSearch

**Last Updated:** March 22, 2026

---

## Codebase Snapshot

**Single file app:** `insposearch/index.html` — 11,282 lines (HTML + CSS + JS)
**No git repository.** No version history. Risk: one bad save = total loss. Recommend `git init` immediately.

---

## Phase Completion Status

### Phase 1 — UX Polish & Onboarding ✅ COMPLETE
- **1.1 Favicons:** `createSourceIdentity()` fetches `favicon.ico` with monogram fallback. Applied in right panel and keys panel.
- **1.2 Exact Mode toggle:** `#btn-search-mode` button, `STATE.searchMode`, full relevance scoring in `getDisplayResults()`, domain-aware `skipInExactMode()` filtering. Keyboard shortcut `Ctrl/Cmd+Shift+E` wired.
- **1.3 Onboarding:** 5-step modal (`#onboarding`). Pre-fires search from `ONBOARDING_TERMS = ['shadow','texture','light','ruins']` on dismiss. `pendingOnboardingSearch` flag. `showQuietTip()` fires once each for palette, connect, boards.
- **1.4 Empty states:** Grid (`#empty-state`), panel hint (`#panel-empty-hint`), chat panel starters (`.chat-starter`), board overlay, all covered.

### Phase 2 — Scale to 1000 Sources ⚠️ ~40% COMPLETE
- **2.1 Source Manifest Architecture:** ✅ Done — `sources.manifest.json` v2.0.0 live. `loadSourceManifest()` registered. Generic `fetchIIIFCollection()` adapter. `/sources/` directory with `_template.json` and `README.md`.
- **2.2 IIIF Universal Connector:** ⚠️ Partial — adapter exists, but only Bodleian, BSB, CUDL active. Big IIIF institutions (Stanford, Princeton, etc.) not yet added to manifest.
- **2.3 Aggregator Sub-Collections:** ⚠️ Partial — 2 inactive DPLA hub entries in manifest; Europeana sub-collections not surfaced.
- **2.4 Specialized DB Expansion:** ⚠️ Partial — Botanicus, David Rumsey in manifest but `active: false`. No adapter tested for them yet. Maps/Fashion/Film/Vintage DBs not in manifest.
- **2.5 Source Categories & Filtering:** ✅ Done — All 11 preset group buttons, region + access filter pills, live source count badge.

### Phase 3 — AI Layer ✅ COMPLETE
- **3.1 Multi-Provider:** Gemini (default free tier), Claude (`claude-opus-4-5`), OpenAI (`gpt-4o`), OpenAI-compatible endpoint all wired. Central `callAI()` / `callAIChat()` dispatchers.
- **3.2 Canvas Snapshot:** `captureGridSnapshot()` using html2canvas 1.4.1. Compresses to <200KB JPEG with metadata object.
- **3.3 AI Chat Panel:** Full `#ai-chat-panel`, `sendChatMessage()`, conversation history, suggested-search pill injection, provider badge, context refresh button. Empty state with topic starters.
- **3.4 Preserve existing AI:** Interpret + Analyse buttons intact, rate-limited (2s), 24h image-level cache, daily counter (1500/day cap).

### Phase 4 — Community & Growth 🔲 NOT STARTED
- GitHub repo is not even public yet (no git at all).
- `CONTRIBUTING.md` file exists but GitHub Actions for manifest validation not created.
- Anthropic pitch doc in `ANTHROPIC_PITCH.md` exists.

---

## Source Registry

**Total sources in `ALL_SOURCES` array:** 89
**Sources in `sources.manifest.json`:** 11 entries, 4 `active: true` (bodleian, bsb, cudl, unsplash), 7 `active: false`
**Inactive manifest sources needing activation:** heidelberg, kb_nl, dpla_nypl, dpla_digital_commonwealth, botanicus, david_rumsey (+ 1 more)

Hardcoded fetch functions: wikimedia, met, archive, nasa, inaturalist, loc, openlibrary, chicago, cleveland, va, wikiart, nordic, flickr, europeana, rijksmuseum, harvard, smithsonian, pexels, pixabay, getty, nga, gbif, eol, apod, gallica, chronicling, openverse, trove, digitalnz, bhl, carnegie, prado, parismusees, yale, picsum, usgs, cooperhewitt, tate, finna, soch, joconde, mnw, tepapa, dpla, artsy, pas, smg, auckland, photogrammar, wellcome, maas, smk, thyssen, wdl, walters, princeton, wikidata, noaa, hubble, cornell, folger, onb, nypl, mak, mna, louvre + Batch 7 (mia, lacma, munch, mauritshuis, nationalmuseumse, naturalis, nmaahc, nasm, whitney, nationalzoo, gbiflit, freersackler, ago, pem, npg, louvread) + Phase 2 (unsplash, bodleian, bsb, cudl).

---

## Known Issues / Code Health

1. **⚠️ No git.** `git init && git add . && git commit -m "baseline"` before any further edits.
2. **Claude model is `claude-opus-4-5`** — masterplan says `claude-sonnet`. Opus is expensive; worth switching to `claude-sonnet-4-5` unless premium quality is intentional.
3. **`perSource + 2` inconsistency** — Phase 2 sources use `+2` buffer; main batch uses `+4`. Minor, not breaking.
4. **Manifest `_totalSources: 4`** — accurate for active sources, but the file has 11 total entries. Could confuse contributors.
5. **No TODO/FIXME/HACK comments** — code is clean.
6. **fetchAll is ~80+ parallel calls** in one `Promise.allSettled` — functional but hard to debug individual source failures without browser console.

---

## Agent Reference

| Agent | File | Purpose |
|---|---|---|
| **InspoSearch Frontend Engineer** | `insposearch-frontend.agent.md` | Phase-by-phase feature implementation |
| **InspoSearch Design & Code Reviewer** | `insposearch-reviewer.agent.md` | Aesthetic, spec, empty state, mobile review |
| **InspoSearch Source Integrator** | `insposearch-source-integrator.agent.md` | Add/validate sources using manifest schema |

---

## Immediate Next Steps (in priority order)

1. **`git init`** — protect the 11k-line file before any more edits
2. **Activate manifest sources** — set `heidelberg`, `botanicus`, `david_rumsey` to `active: true`, verify their IIIF endpoints work with `fetchIIIFCollection()`
3. **Fix Claude model** — change `claude-opus-4-5` → `claude-sonnet-4-5` in three places (lines ~8448, ~8474, ~9502)
4. **Expand manifest** — add more IIIF institutions (Stanford, Harvard IIIF, BnF, NGA IIIF) as individual JSON files in `/sources/`
5. **Phase 4 kickoff** — `git init` → public repo → `CONTRIBUTING.md` polish → GitHub Actions manifest validator
