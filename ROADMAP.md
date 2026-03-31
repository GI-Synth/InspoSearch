# InspoSearch — Grand Roadmap
## From Side Project → Institution-Backed Open Source Standard

**Vision**: The world's unified search layer for humanity's visual heritage.  
Every museum, archive, library, and dataset — one search, one interface, one open standard.

---

## WHY INSTITUTIONS WOULD BACK THIS

Right now InspoSearch is a clever tool. To become institution-worthy it needs:
1. **A documented contribution pipeline** — museums can add their own source in under 1 hour
2. **A governance model** — clear licensing, code of conduct, contributor roles
3. **Reliability guarantees** — uptime, data freshness, schema stability
4. **A community** — not just a repo but a place researchers discuss sources
5. **Visibility** — Product Hunt, Hacker News, academic DH (Digital Humanities) circles

---

## TIER 1 — FOUNDATION (Do First)
*Prerequisites for any institution to take this seriously*

### 1.1 — Open Source Infrastructure
- [x] `CONTRIBUTING.md` — step-by-step guide to add a source (already exists, needs work)
- [x] `CODE_OF_CONDUCT.md` — Contributor Covenant (standard in OSS)
- [x] `SECURITY.md` — how to report vulnerabilities
- [x] `.github/ISSUE_TEMPLATE/` — bug report, feature request, new source templates
- [x] `.github/PULL_REQUEST_TEMPLATE.md` — checklist for PRs
- [x] `CHANGELOG.md` — semver history starting from v1.0
- [ ] GitHub Topics/Tags — `open-source`, `museum`, `digital-humanities`, `image-search`, `cultural-heritage`
- [ ] GitHub Discussions enabled — community Q&A

### 1.2 — Source Contribution Pipeline
- [x] `scripts/validate-sources.js` — actually implemented (referenced in package.json but missing)
- [ ] Source schema v2 — documented JSON contract that museums can fill in themselves
- [x] Source tester — `npm run test-source <id>` that validates a new source works correctly
- [ ] Gallery of sources page in README with logos, counts, and links

### 1.3 — Code Health
- [x] Split `app.js` into modules — esbuild config (`build.js`), `src/` scaffolded with migration plan, `npm run build`
  - Full extraction of 14,500-line monolith still in progress
- [x] Add `eslint` with simple ruleset — catches real bugs, signals professionalism
- [x] Add `prettier` — consistent formatting for contributors
- [x] Basic test suite — Vitest, 21 unit tests on core functions (cacheKey, normalizers, health tracker, deltaE, dedup)

---

## TIER 2 — SEARCH QUALITY (Most Impactful for Users)
*This is where "Google level" comes from*

### 2.1 — Smarter Query Understanding
- [x] **Query classification v2** — detect entity type: person, place, era, medium, movement, species, object
  - "Rembrandt" → artist → hit art sources harder, boost title matches
  - "1920s" → era → boost historical sources, date-filter where APIs support it
  - "watercolor" → medium → filter by medium in sources that support it
  - "tulip" → botanical → boost BHL, EOL, GBIF, iNaturalist
- [x] **Multilingual search** — auto-translate query to French/German/Dutch/Spanish before hitting Gallica/Rijksmuseum/Prado etc.
  - Use browser-native `navigator.language` + a small static translation map for 200 art terms
  - Or optionally use Gemini/Claude to translate (costs 0 tokens with a small prompt)
- [x] **Synonym expansion v2** — current Datamuse is good; add:
  - Art movement synonyms (Impressionism → Monet, Renoir, Sisley, Pissarro)
  - Species names (owl → Strigiformes, Bubo)
  - Historical period aliases (Belle Époque → 1871-1914)
- [x] **Negative search** — `marble NOT statue` syntax, strip negations before API calls, post-filter results

### 2.2 — Result Quality
- [x] **De-duplication across sources** — same image appears on Met AND Wikimedia → dedupe by title similarity
- [x] **Relevance scoring v2** — current score is basic; add:
  - Source authority weight (Met/Rijksmuseum = high authority for art)
  - Image quality signal (has high-res URL = boost)
  - Completeness score (has title + description + date + tags = boost)
- [x] **"Did you mean?" suggestions** — if < 5 results, suggest alternative query
- [x] **Date range filter** — `1850–1900` slider in search bar (sources that support date filtering)
- [x] **Color search** — pick a color from a palette, find images with dominant that color
  - Openverse, Unsplash, and some museum APIs support color filtering natively
- [x] **Aspect ratio / orientation filter** — portrait / landscape / square toggle

### 2.3 — Source Coverage Expansion
*Priority: sources with APIs that work, CC-licensed, globally relevant*

**Tier A — High value, working APIs:**
- [ ] **Smithsonian Open Access API** — upgrade from current best-effort to full key integration (free key, 3M objects across 19 museums)
- [ ] **Digital Public Library of America (DPLA)** — 50M items, excellent API, free key
- [ ] **Europeana** — 50M objects across 3,000 European institutions — already partially integrated, needs more coverage
- [ ] **Trove (NLA)** — National Library of Australia, 700M+ items
- [ ] **Bing Image Search** (Creative Commons filter) — largest crawled CC image index
- [ ] **Unsplash** — already in source list but needs key; consider bundling a free-tier read key

**Tier B — Specialized value:**
- [ ] **MoMA collection** — 200k artworks, open data JSON available
- [ ] **Guggenheim** — partial open data
- [ ] **Art UK** — 225k UK paintings, open API
- [ ] **Deutsche Digitale Bibliothek (DDB)** — 44M German cultural objects
- [ ] **Europeana Fashion** — 500k+ fashion images
- [ ] **Artstor** (if they open the API)
- [ ] **Google Arts & Culture** (no public API — but they have a partner program)
- [ ] **Bio Heritage Library** — already integrated; expand term coverage
- [ ] **Paleontology databases** — PBDB (Paleobiology Database), iDigBio
- [ ] **Herbarium/botanical specimen APIs** — iDigBio, JSTOR Global Plants

**Tier C — Niche / high-quality:**
- [ ] **NASA Earthdata** — satellite imagery, not just APOD
- [ ] **NOAA National Centers** — historical weather photography
- [ ] **Europeana Sounds** — audio-adjacent visual (musical instruments, concert posters)
- [ ] **UNESCO World Heritage** image database
- [ ] **Old Maps Online** — cartographic heritage
- [ ] **David Rumsey Map Collection** — 150k historical maps (already referenced in source list)

---

## TIER 3 — FEATURES (Power Users & Professionals)

### 3.1 — Search Experience
- [x] **Search history** — dropdown of recent queries, stored locally
- [x] **Saved searches** — bookmark a search to re-run it
- [x] **Search as you type** — 500ms debounced input, ≥3 chars, auto-runs search
- [x] **Advanced search modal** — structured form: source category, date range, color, medium, region, orientation, exclude terms
- [ ] **Query builder** — visual AND/OR/NOT blocks

### 3.2 — Image Experience
- [x] **Visual similarity search** — "more like this" via color delta-E + tag Jaccard + aspect scoring (lightweight, no model download)
- [x] **Side-by-side comparison** — select 2-4 images, view them side by side with metadata
- [ ] **Full provenance view** — timeline of an artwork: created → photographed → digitized → licensed
- [x] **Image download with attribution** — auto-generate caption/credit string for the selected license
- [ ] **Reverse image search** — upload an image, find similar in the indexed sources
- [ ] **IIIF viewer** — already has OpenSeadragon; expand to full IIIF manifest support (multi-page manuscripts)

### 3.3 — Board / Collections
- [x] **Named boards** — save multiple boards with names ("Research - 19th century textiles")
- [x] **Board sharing** — export board as shareable URL (encoded as base64 URL param)
- [x] **Board templates** — "grid 2×2", "row", "focus+3", "mosaic", "compare 2", "scatter"
- [ ] **PDF export** — board → print-ready PDF with attributions
- [x] **Citation export** — select images → copy MLA/APA/Chicago citations to clipboard
- [x] **Lightbox slideshow** — full-screen auto-advance slideshow of selected images

### 3.4 — AI Features
- [ ] **AI search** — natural language → structured query: "show me melancholy Dutch interiors from the 17th century"
- [ ] **Style transfer suggestions** — AI identifies visual style, suggests related searches
- [ ] **Batch analysis** — analyze all selected images at once, generate a combined narrative
- [ ] **AI-generated tags auto-fill** — when a source returns no tags, run lightweight vision analysis and cache tags
- [ ] **Semantic similarity** — cluster results by visual theme using embeddings (in-browser ONNX)
- [ ] **Research assistant memory** — AI chat that remembers previous queries and results in a session

### 3.5 — Collaboration (v2 territory)
- [ ] **Shared workspaces** — board state synced via a small backend (Cloudflare D1 + Workers KV is free)
- [ ] **Annotation** — add notes to individual images in a board
- [ ] **Export to Zotero / Notion** — academic workflow integration
- [ ] **Embed widget** — `<iframe>` embeddable search for museum websites

---

## TIER 4 — PERFORMANCE & RELIABILITY

### 4.1 — Speed
- [x] **Service Worker caching** — cache static assets + recent API responses offline
  - Install prompt: "add to home screen" on mobile
  - Full offline mode for viewing cached results
- [ ] **Streaming results** — show first results from fast APIs in <200ms (currently ~150ms buffer is good, can improve)
- [x] **Prefetch on hover** — when user hovers a result, prefetch full-res image in background
- [x] **Virtual scrolling** — IntersectionObserver virtualizes cards >2000px offscreen, restores on scroll-back
- [ ] **WebP/AVIF detection** — request modern formats when the source supports them

### 4.2 — Reliability
- [ ] **Source status dashboard** — public page showing which sources are up/down (Cloudflare Worker pinging each API hourly)
- [ ] **Automatic fallback sources** — if primary Wikimedia fails, fallback to Openverse subset
- [ ] **Data freshness indicator** — show when cached data was last updated for CORS-blocked sources
- [ ] **GitHub Actions monitoring** — Slack/email alert if nightly fetch fails more than 2 days in a row

### 4.3 — Build & Deployment
- [x] **Module bundling** — esbuild bundles `src/main.js` → `insposearch/app.js` (IIFE, sourcemaps, watch mode)
  - `npm run build` / `npm run build:watch` configured in package.json
- [ ] **Automated image optimization** — CI step compresses any committed images/icons
- [x] **Lighthouse CI** — GitHub Actions workflow, treosh/lighthouse-ci-action, 90+ score assertions

---

## TIER 5 — COMMUNITY & GROWTH

### 5.1 — Documentation Site
- [ ] **Dedicated docs site** — `docs.insposearch.dev` (Cloudflare Pages, free)
  - Built with VitePress or Astro (both free, fast, beautiful)
  - Sections: Getting Started, API Sources, Adding a Source, Architecture, AI Integration
- [ ] **Interactive source explorer** — visual grid of all sources with stats, last updated, sample images
- [ ] **Attribution guide** — how to properly cite each source type

### 5.2 — Institution Outreach
- [ ] **Institution partner badge** — "Verified InspoSearch Source" badge for museums that officially support their integration
- [ ] **Direct API key program** — help institutions understand why their API is useful, provide a usage dashboard
- [ ] **Academic paper** — short DH (Digital Humanities) conference paper describing the architecture and scope
  - Target: DH2026 or MW (Museums and the Web) conference
- [ ] **Grants** — NEH Digital Humanities Advancement Grant, Mellon Foundation, Knight Foundation all fund exactly this

### 5.3 — Visibility
- [ ] **Product Hunt launch** — coordinate with a "Show HN" post
- [ ] **Hacker News: Show HN** — technical audience; focus on the architecture (120+ parallel APIs in vanilla JS)
- [ ] **Digital Humanities community** — post in DH Slack, Humanities Commons, H-Net lists
- [ ] **Museum tech conferences** — MCN (Museum Computer Network), MW (Museums on the Web)
- [x] **README badges** — license, Cloudflare deployed, source count, image count

---

## TIER 6 — MONETIZATION (Optional, Non-Extractive)

*InspoSearch should stay free and open. But sustainability matters.*

- [ ] **GitHub Sponsors** — individual donations
- [ ] **Open Collective** — institutional collective funding (used by major OSS projects)
- [ ] **"Powered by InspoSearch"** commercial license — if a company embeds it for profit, they pay; individuals and institutions always free
- [ ] **Hosted pro tier** (optional, years out) — InspoSearch Pro with shareable boards, team workspaces, priority support

---

## IMMEDIATE NEXT STEPS (this week)

| Priority | Task | Status |
|---|---|---|
| ✅ Done | Implement `scripts/validate-sources.js` (referenced but missing) | Completed |
| ✅ Done | Add `CODE_OF_CONDUCT.md` + `SECURITY.md` | Completed |
| ✅ Done | Add GitHub issue templates | Completed |
| ✅ Done | Multilingual query translation (200-term static map) | Completed |
| ✅ Done | Search history dropdown | Completed |
| ✅ Done | Date range filter in UI | Completed |
| ✅ Done | "Did you mean?" for zero results | Completed |
| 🟡 Medium | Module split (app.js → src/) | Deferred |
| ✅ Done | CONTRIBUTING.md rewrite + source template | Completed |
| ✅ Done | Service Worker for offline + install prompt | Completed |
| ✅ Done | README badges + source gallery | Completed |
| 🟢 Nice | Color search filter | Open |
| 🟢 Nice | Perceptual similarity "find more like this" | Open |
| ✅ Done | Named/shareable boards | Completed |

---

## VERSION TARGETS

| Version | Milestone |
|---|---|
| **v1.1** (now) | 7 V2 polish improvements, Cloudflare Pages live |
| **v1.2** | validate-sources.js, GitHub templates, CONTRIBUTING rewrite, search history, "did you mean?" |
| **v1.3** | Multilingual search, date range filter, color filter, query classification v2 |
| **v1.4** | Module split, ESLint, Prettier, basic test suite, Lighthouse CI |
| **v2.0** | Service Worker offline mode, perceptual similarity, named boards + sharing, docs site |
| **v3.0** | Semantic AI search, batch analysis, institution partner program, conference paper |

---

*"The world's visual heritage should be searchable by anyone, anywhere, instantly."*
