# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Bundle src/ → insposearch/app.js via esbuild
npm run build:watch    # Watch mode for development
npm start              # Serve insposearch/ at http://localhost:3000
npm test               # Run vitest unit tests
npm run test:watch     # Watch unit tests
npm run test:e2e       # Run Playwright e2e tests (requires built app + server)
npm run lint           # ESLint on insposearch/app.js
npm run format         # Prettier format
npm run validate       # Validate source manifests (also runs in CI)
node scripts/test-source.js <sourceName>  # Test a single source adapter
```

E2E tests require the app to be built first (`npm run build`), then Playwright starts the server automatically via `npx serve insposearch -l 3000`.

## Architecture

InspoSearch is a **zero-dependency, client-side visual research engine** — pure vanilla JS with no runtime npm packages. The build step (esbuild) bundles 6 ES modules into `insposearch/app.js`.

### Module Dependency Order (no circular imports)

```
src/state.js     → Constants, source registry, query classification, ALL_SOURCES array
src/core.js      → Health tracking, session cache, safeFetch, source scoring utilities
src/fetchers.js  → 100+ source adapter functions, keyword expansion, populates ADAPTERS map
src/app.js       → Search orchestration, grid rendering, DOM events, AI features, board/3D views
src/i18n.js      → 101-language strings, DOM attribute binding
src/main.js      → Import orchestrator (loads the above in order)
```

`src/main.js` is the esbuild entry point. `insposearch/app.js` is the minified IIFE output — **edit source files in `src/`, never the build output directly**.

### Search Data Flow

1. **Query classification** (`classifyQueryExtended` / `classifyQueryV2` in state.js) — detects intent (nature, space, art, history, design, science, photo)
2. **Dynamic source selection** (`selectDynamicSources` in core.js) — scores 2487+ sources by intent, picks top-N
3. **Keyword expansion** (fetchers.js) — Datamuse API synonyms + Wikidata SPARQL translations + art-period/species aliases
4. **Parallel fetching** — `promisePool` dispatches adapter calls concurrently; each adapter lives in `ADAPTERS` map
5. **Health tracking** (core.js) — sources that miss repeatedly are temporarily disabled; auto-recovers
6. **Dedup & render** — URL-level deduplication, relevance scoring, lazy-loaded image grid

### Source System

Sources are defined in two ways:
- **Hardcoded adapters** in `src/fetchers.js` (one `fetch*` function per source)
- **Community manifests** in `insposearch/sources/*.json` (validated by CI via `scripts/validate-sources.js`)

`BADGE_META`, `SOURCE_META`, `SOURCE_GROUPS`, and `SOURCE_DOMAINS` in state.js map source IDs to display metadata. When adding a new source, update all four plus write a `fetch*` function and register it in `ADAPTERS`.

### CORS-Blocked Sources

Some APIs can't be fetched client-side. `scripts/fetch-cors-blocked.js` runs nightly (GitHub Actions `nightly-fetch.yml`) and writes pre-fetched data to `insposearch/data/`. Adapters for these sources read from `/data/` instead of live APIs.

### Cloudflare Infrastructure

- **Pages:** hosts `insposearch/` (static site)
- **Workers:** `api/worker.js` (REST: `/search`, `/sources`, `/random`, `/health`, `/semantic`, `/caption`, `/board`) and `api/image-proxy.js`
- **KV:** `BOARDS` namespace — shared board state with 30-day TTL

### AI Features

Optional AI vision analysis (no keys required for basic search). Keys stored in `localStorage`. Supported providers: Gemini free tier, Claude, OpenAI, Ollama. Entry points in `src/app.js`.

### i18n

6 base locales hardcoded in `src/i18n.js`; 95 generated locales in `src/i18n-generated.json`. The `applyI18n()` function binds `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, and `data-i18n-aria` DOM attributes. Locale persisted in `localStorage.insposearch_locale`.

### Testing

- Unit tests: `tests/core.test.js` (vitest, currently 21 tests) — focuses on core utilities and source logic
- E2E: `tests/e2e/` — smoke, search-quality (exact/explore mode), accessibility
- E2E viewport: 1280×800, Chromium only, 60s timeout, 1 retry

### ESLint Globals

The project uses `OpenSeadragon`, `THREE`, `html2canvas`, `fabric`, and `Fuse` as CDN-loaded globals — they appear in `index.html` script tags and are declared as globals in `.eslintrc.json`.
