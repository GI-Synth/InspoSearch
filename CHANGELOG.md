# Changelog

All notable changes to InspoSearch are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · Versioning: [SemVer](https://semver.org/)

---

## [Unreleased]

### Added
- Search history dropdown (recent queries, stored locally)
- "Did you mean?" suggestions for zero-result searches
- Multilingual query translation for 200+ art/cultural terms
- Query classification v2 (artist / era / medium / species detection)

---

## [1.1.0] — 2026-03-30

### Added
- **Cloudflare Pages deployment** — insposearch.pages.dev, free, unlimited bandwidth
- **Fetch concurrency semaphore** — max 25 in-flight requests, prevents browser connection exhaustion
- **AI cache LRU eviction** — caps at 200 entries, evicts oldest 10 on overflow
- **Gemini per-minute rate limit** — 55 req/min cap with `isGeminiRateLimited()`
- **Per-provider AI rate limits** — Claude and OpenAI now tracked independently (50/min each)
- **Exponential backoff on 429** — retries with 2s → 4s delay (up to 2 retries)
- **Memory cleanup** — `_gridItemMap` and `_lazyObserver` properly cleared between searches
- **Cache key includes search mode** — exact and explore results no longer share cache entries
- **Health tracker decay** — miss counters halve between searches instead of resetting
- **Health recovery toast** — "source X recovered" shown when a paused source succeeds
- **Onboarding backdrop click** — clicking outside the modal closes and persists the "seen" flag
- **Touch targets ≥44px** — floating bar buttons meet WCAG 2.1 AA minimum
- **Tablet panel breakpoint** — panel caps at `min(280px, 50vw)` on 481–768px screens
- **Badge opacity 0.75** — readable on dark images (was 0.55)
- **Datamuse timeout** — 3s AbortController on keyword expansion calls
- **Round-robin source interleaving** — fair multi-source display, not random shuffle
- **GPU acceleration** — `will-change: filter` on sketch/bw image modes
- **NATURE_QUERY_TERMS expanded** — +12 botanical/zoological terms
- **SPACE_QUERY_TERMS expanded** — +8 astronomy terms
- **theme-color meta tags** — dark/light mode browser chrome
- **CSP meta tag** — Content Security Policy applied
- **SVG favicon** — clean vector icon at any size
- **`:focus-visible` ring** — keyboard-only focus indicators
- **`prefers-reduced-motion`** — all animations respecting user preference
- **`.sr-only` class** — screen-reader utility

### Changed
- `HEALTH_MISS_LIMIT` 3 → 5 (fewer false positives on flaky APIs)
- Grid gap 2px → 4px
- Scrollbar width 4px → 6px with visible track
- Dark mode contrast bump: `--ink-2` #7A7870 → #9A9890
- Version bump 1.0.0 → 1.1.0

### Infrastructure
- `npm start` — `npx serve insposearch`
- `npm run validate` — validate source manifests
- `npm run fetch-cache` — run nightly CORS-blocked fetch manually
- fetch-cors-blocked.js: proper exit codes, data validation, Wikidata rate limiting (1000ms)

---

## [1.0.0] — 2026-03-01

### Initial Release
- 120+ sources across museums, archives, nature databases, photography
- Exact / Explore search modes
- Board view with Fabric.js canvas
- AI research assistant (Gemini, Claude, OpenAI, Ollama)
- Deep zoom with OpenSeadragon
- 3D constellation view with Three.js
- B&W and sketch filter modes
- Source filtering by category, region, key requirement
- Onboarding carousel with animated stats
- Dark mode with auto-detect + manual override
- Mobile-responsive layout (480px breakpoint)
- Export board as PNG
- Cross-reference / concept connection mode (Interpret ✦)
