# InspoSearch — Current State

> Snapshot: April 6, 2026 · commit `dd71b74` (main)

---

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| App | https://insposearch.pages.dev | ✅ 200 |
| Docs | https://insposearch-docs.pages.dev | ✅ live |
| API Worker | https://insposearch-api.official-ndsclsd.workers.dev | ✅ deployed |
| Image Proxy | https://insposearch-img.official-ndsclsd.workers.dev | ✅ deployed |
| Institutions | https://insposearch.pages.dev/institutions | ✅ live |

---

## Git State

- **Branch:** main
- **HEAD:** `dd71b74` — "fix: correct GitHub repo link"
- **Recent commits:**
  - `dd71b74` fix: correct GitHub repo link
  - `a9371c8` Merge PR #4 (deploy/p2-p3-p4)
  - `224ae00` fix: nightly workflow always exits green
  - `d0088aa` fix: stop second-wave clear replacing first-wave images
  - `40e3cd6` deploy: activate Cloudflare Web Analytics
  - `429054a` deploy: wire real worker URLs + KV namespace ID
  - `31552c1` phase 5 (P4): polish
  - `cb5345a` phase 4 (P3): intelligence layer
  - `e66f890` phase 3 (P2): i18n

---

## Bundle

- **Entry:** `src/main.js` → `insposearch/app.js` (esbuild IIFE)
- **Size:** ~395 KB (minified, no sourcemap in prod)
- **Module chain:** state.js → core.js → fetchers.js → app.js
- **Tests:** 21/21 passing (vitest)

---

## Cloudflare Resources

| Resource | Type | ID/Details |
|----------|------|-----------|
| insposearch | Pages project | Connected to GI-Synth/InspoSearch |
| insposearch-api | Worker | 8 endpoints, AI + KV bindings |
| insposearch-img | Worker | Image proxy, CORS, resize |
| BOARDS | KV Namespace | `cae86ef085bd4f6fb1cf9d44f7bc7079` |
| Web Analytics | Token | `a6bdef67...` (active) |

---

## Source Statistics (live)

- **521** total active sources
- **3.2B+** searchable images
- **248** no-key sources (work out of the box)
- **20** Europeana sub-collections (static)
- **~100+** CORS-blocked sources (nightly-fetched static JSON)

---

## i18n State

- 6 locales: EN (default), FR, DE, ES, NL, IT
- Module: `src/i18n.js` — ~35 keys per locale
- Persistence: `localStorage.insposearch_locale`
- HTML: `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria`
- Language selector in settings panel

---

## Known Issues / Gaps

1. **Europeana sub-collection badges** — `euro_*` sources fall through to default `badge-wiki` class and display raw source ID (e.g. `euro_rijksmuseum`) instead of a clean label
2. **Europeana attribution** — no special treatment; no logo, no "aggregated via Europeana" text, no link back to europeana.eu
3. **Institutions page** — no Europeana mention at all; no "Featured Partner" section
4. **No /partners page** — institutions page covers "how to add" but not partnership pitch
5. **No "Save to Cosmos" integration** — no external save buttons
6. **No "Verified cultural source" badge** — all sources treated identically
7. **Rogue Workers project** on Cloudflare dashboard — auto-created by Git integration, should be deleted (user was told)
8. **nightly-data-update branch** — nightly fetch pushes here but never auto-merges; user does it manually

---

## CI/CD Workflows

| Workflow | Trigger | Status |
|----------|---------|--------|
| `nightly-fetch.yml` | cron 2am UTC | ✅ Fixed — pushes to side branch, continue-on-error |
| `lighthouse.yml` | push/PR to main | ✅ Fixed — single pass, all checks warn-level |
| `validate-sources.yml` | push/PR | ✅ Working |

---

## Extensions

| Platform | Manifest | Status |
|----------|----------|--------|
| Chrome | `extension/manifest.json` (MV3) | ✅ Built |
| Firefox | `extension-firefox/manifest.json` (MV2) | ✅ Built |
| Edge | Uses Chrome MV3 version | ✅ Compatible |

---

## API Endpoints (`insposearch-api`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Status check |
| GET | /sources | Proxy sources manifest |
| GET | /search?q=&limit= | Art Institute of Chicago proxy |
| GET | /random?count= | Random artworks |
| GET | /semantic?q= | Workers AI concept expansion |
| POST | /caption | Workers AI image captioning |
| POST | /board | Save board to KV (30-day TTL) |
| GET | /board/:id | Retrieve shared board |
