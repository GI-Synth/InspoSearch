# Europeana Partnership Ready Plan

> Goal: everything polished before April 9 call with Emilija Angelovska (API Partnerships Lead, Europeana Foundation)
> 
> Context: Europeana aggregates 50M+ objects from 3,000+ European institutions. They care about open access mission alignment, full attribution, traffic back to europeana.eu, multilingual support, AGPL license, non-commercial.

---

## Phase 1 — Europeana Featured Placement ⚡ CRITICAL PATH

**Do first.** This is what Emilija sees when she opens the app.

### 1.1 Fix Europeana sub-collection badges
- **Problem:** 20 `euro_*` sub-collections (e.g. `euro_rijksmuseum`) fall through to default badge — shows raw ID string and wrong CSS class
- **Fix:** Add all 20 entries to `BADGE_META` with clean display labels (e.g. "Rijksmuseum via Europeana") and a shared `badge-euro` CSS class; add yellow/gold accent color for the badge
- **Difficulty:** Easy
- **Impact:** High — broken badges look amateur

### 1.2 Europeana dual attribution in panel
- **Problem:** When viewing a Europeana result, panel shows generic source info. No mention that it's "aggregated via Europeana", no Europeana logo, no link to europeana.eu item page
- **Fix:** Modify `renderSourceInfo()` — when `item.source === 'europeana'` or starts with `euro_`, show:
  - DATA_PROVIDER name + link (e.g. "Rijksmuseum")  
  - "aggregated via Europeana" label with Europeana logo (small, inline)
  - Link to the original europeana.eu record (`item.link` or constructed from item ID)
- **Difficulty:** Medium
- **Impact:** Critical — this is what Europeana cares most about

### 1.3 Europeana hero on institutions page
- **Problem:** Europeana is not mentioned anywhere on `/institutions`
- **Fix:** Add a "Featured Partners" hero section at top of institutions.html with:
  - Europeana logo (official SVG from europeana.eu brand guidelines)
  - "50M+ cultural objects from 3,000+ European institutions"
  - "Featured Partner" badge
  - Link to europeana.eu
- **Difficulty:** Easy
- **Impact:** High — Emilija will visit this page

### 1.4 Europeana favicon in source sidebar
- **Problem:** Europeana entry in the sidebar source list has no favicon
- **Fix:** Add Europeana favicon URL to the source list rendering (same pattern as NASA, Met, etc.)
- **Difficulty:** Easy
- **Impact:** Medium

---

## Phase 2 — Demo Polish

### 2.1 Verify Europeana sub-collections load
- **Test queries:** portrait, fashion, renaissance, baroque, medieval, art nouveau
- **Verify:** Results appear from `europeana` base source AND from `euro_fashion`, `euro_photography`, `euro_rijksmuseum` etc.
- **Fix any failures** (API key issues, empty responses, timeouts)
- **Difficulty:** Easy (testing, not building)
- **Impact:** High — broken demo = dead partnership

### 2.2 Multilingual verification
- **Test:** Switch to FR, DE, NL — all three critical for Europeana
- **Verify:** Search input placeholder, settings labels, button text, empty states all translate
- **Check:** Europeana attribution text should also translate ("agrégé via Europeana" in FR, "aggregiert über Europeana" in DE, etc.)
- **Difficulty:** Easy-Medium (add ~5 new i18n keys for Europeana attribution)
- **Impact:** High — multilingual is a key selling point

### 2.3 License filter prominence
- **Problem:** License filter exists but is buried in advanced search
- **Fix:** Add a quick-filter row visible in the sidebar: "Open Access: CC0 | CC-BY | All"
- **Why:** CC0 and CC-BY are Europeana's preferred licenses; researchers use this constantly
- **Difficulty:** Medium
- **Impact:** High — this is a researcher power feature

### 2.4 Date range & medium filters work end-to-end
- **Verify:** Advanced search date range actually filters Europeana results
- **Verify:** Medium filter (painting, photograph, manuscript) works with Europeana's TYPE parameter
- **Fix if broken**
- **Difficulty:** Easy (testing)
- **Impact:** Medium

---

## Phase 3 — Partnership Pitch Page

### 3.1 Add /partners section to institutions page
- **Content:**
  - "Partnering with InspoSearch"
  - "Your collection reaches designers, artists, and researchers worldwide"
  - "Full attribution on every image — your institution name, logo, and link"
  - "Zero ads, free forever, open source"
  - "Direct traffic back to your site on every click"
  - Stats: 521 sources, 3.2B+ images, 6 languages
- **This is what Emilija shows to colleagues to justify the partnership internally**
- **Difficulty:** Easy (HTML/CSS, no code)
- **Impact:** Critical for follow-up after call

### 3.2 Partnership benefits list
- For the partner: visibility, attribution, traffic, open-source alignment
- For InspoSearch: higher rate limits, sub-collection access, co-promotion
- Clear "Become a Partner" CTA linking to GitHub issue template or email
- **Difficulty:** Easy
- **Impact:** High

---

## Phase 4 — Cosmos Integration

> Not urgent for April 9. Can build after the call. But shows ecosystem ambition.

### 4.1 "Save to Cosmos" button
- **Where:** Image preview panel, next to download/cite buttons
- **Action:** Opens `cosmos.so/save?url={imageUrl}` in new tab (or similar deep link — needs research on Cosmos's actual save API/URL scheme)
- **Difficulty:** Easy (one button + link)
- **Impact:** Medium — only relevant for Cosmos users

### 4.2 "Open in Cosmos" in floating toolbar
- **Where:** Floating bar (visible when 2+ images selected)
- **Action:** Export selected image URLs to Cosmos board (URL scheme TBD)
- **Difficulty:** Easy
- **Impact:** Low-Medium

### 4.3 Board export to Cosmos
- **Where:** Board export menu
- **Action:** Export board as Cosmos-compatible format or URL list
- **Difficulty:** Medium (depends on Cosmos API)
- **Impact:** Low — long-term play

> **Note:** Cosmos integration should only be built after confirming their actual save/import API. Don't build against an assumed URL scheme. Reach out to Cosmos team first.

---

## Phase 5 — Trust & Legitimacy Signals

### 5.1 "Verified cultural source" badge
- **What:** Small checkmark icon on cards from verified institutions (museums, national libraries, government archives)
- **Logic:** Add `verified: true` flag to SOURCE_META entries for institutional sources (not user-generated content like Flickr, Pexels, Pixabay)
- **Difficulty:** Easy
- **Impact:** High — differentiates InspoSearch from generic image search

### 5.2 "Human-made collection" label
- **What:** Subtle label on institutional sources indicating the collection is verified human-made artwork (pre-AI era archives)
- **Why:** Cultural archives are inherently AI-free — this is a selling point for researchers and educators
- **Where:** Source badge tooltip or panel metadata
- **Difficulty:** Easy
- **Impact:** Medium — niche but growing concern

### 5.3 Source counter accuracy
- **Verify:** "521 sources" and "3.2B+ images" counters on homepage and institutions page are accurate
- **Fix if off** — count currently comes from the live sidebar, should match marketing copy
- **Difficulty:** Easy
- **Impact:** Medium — credibility

### 5.4 Docs changelog
- **What:** Add recent changelog entries to docs site (insposearch-docs.pages.dev)
- **Content:** P2 i18n, P3 intelligence layer, P4 polish, CI fixes
- **Difficulty:** Easy
- **Impact:** Low-Medium — shows active development to technical evaluators

---

## Pre-Call Checklist (April 9)

- [ ] Phase 1 complete — Europeana badges, attribution, institutions hero
- [ ] Phase 2 tested — sub-collections load, multilingual works, license filter visible
- [ ] Phase 3 written — partnership pitch section exists on /institutions
- [ ] Demo rehearsed — know which queries show best Europeana results
- [ ] Demo queries prepared: "van gogh", "art nouveau", "medieval manuscript", "fashion 1920s"
- [ ] Know your ask: partner key, higher rate limits, sub-collection access, co-promotion
- [ ] Have the institutions page URL ready to share: `insposearch.pages.dev/institutions`
- [ ] Have the docs URL ready: `insposearch-docs.pages.dev`
