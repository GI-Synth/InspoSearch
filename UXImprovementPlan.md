# InspoSearch — UX Improvement Plan

> Based on live audit of https://insposearch.pages.dev (April 6, 2026)
> Organized by priority phase. Each item: problem → fix → difficulty → impact.

---

## Phase 1 — First Impression & Onboarding

### 1.1 Empty state is passive
- **Problem:** On first load, the grid is empty with a tour overlay. If you dismiss the tour, you see a blank grid with "botanical illustration" as an inspiration suggestion and popular search pills. The value prop relies on text — there's no visual hook.
- **Fix:** Show a curated hero grid of ~12 stunning images from diverse sources (pre-fetched, cached in `homepage-images.json` — this data file already exists). Auto-fade them when user starts typing. This gives an instant "wow" without requiring a search.
- **Difficulty:** Medium (rendering logic + transition)
- **Impact:** High — first 3 seconds decide if someone stays

### 1.2 Source counter not immediately prominent
- **Problem:** "521 sources · 3.2B+ images" is in the sidebar footer, not visible until you scroll or open the sidebar. New users don't see the scale immediately.
- **Fix:** Show it as a subtle subtitle below the search bar: `521 sources · 3.2B+ images · no account needed`. Fade it out once first results load.
- **Difficulty:** Easy
- **Impact:** High — communicates scale instantly

### 1.3 Tour is skippable but not resumable
- **Problem:** The 6-step tour shows once. If dismissed, there's no way to replay it.
- **Fix:** Add "replay tour" link in settings panel (already has ABOUT section).
- **Difficulty:** Easy
- **Impact:** Low

### 1.4 "How to search" text block is long
- **Problem:** The onboarding text ("type anything — a word, a feeling, a color...") is helpful but long. Competes with the search bar for attention.
- **Fix:** Shorten to one line: "search 521 museums, archives & collections at once". Move detailed instructions to the tour or a help tooltip.
- **Difficulty:** Easy
- **Impact:** Medium

---

## Phase 2 — Search Experience

### 2.1 Explore vs Advanced toggle unclear
- **Problem:** "explore" button next to search bar toggles to "exact" — the meaning isn't obvious to new users. "Advanced" opens a panel. The relationship between them is confusing.
- **Fix:** Rename "explore" to "broad" or add a tooltip: "broad: casts a wide net · exact: strict keyword match". Keep advanced as-is.
- **Difficulty:** Easy
- **Impact:** Medium

### 2.2 Results feel like they arrive in two waves
- **Problem:** First batch renders fast, then `fetchAll` completes and appends more. (Partially fixed in `d0088aa` — no longer clears first wave, but the jump from ~12 cards to ~50+ still feels jarring.)
- **Fix:** Animate new cards in with a subtle fade-in (CSS `animation: fadeIn 0.3s ease`). Cards already visible stay put; new ones slide in gently.
- **Difficulty:** Easy (CSS only)
- **Impact:** Medium — makes streaming feel intentional, not broken

### 2.3 Keyword pills not obviously interactive
- **Problem:** Keyword expansion pills appear below search bar but look like static tags. Users don't know they can click to search or × to remove.
- **Fix:** Add subtle hover underline + cursor:pointer. The × is already there but barely visible (9px, ink-3 color) — increase to 11px and accent color on hover.
- **Difficulty:** Easy
- **Impact:** Low-Medium

### 2.4 Image count slider position
- **Problem:** "24 images" slider is in the sidebar under IMAGES. Not discoverable. Most users search at default 24 and never change it.
- **Fix:** This is fine as-is — power users find it, casual users don't need it. No change needed.
- **Difficulty:** N/A
- **Impact:** N/A

### 2.5 "Load more" button
- **Problem:** "load more" appears after results but is generic text.
- **Fix:** Show "load more — showing 24 of 521 sources" to communicate there's vastly more available.
- **Difficulty:** Easy
- **Impact:** Medium — encourages exploration

---

## Phase 3 — Image Preview & Metadata

### 3.1 Palette extraction display
- **Problem:** Palette shows as colored squares in the panel — functional but not beautiful.
- **Fix:** Show palette as a horizontal gradient bar with hex codes on hover. Also show color names (already computed: `item._colorNames`).
- **Difficulty:** Medium
- **Impact:** Medium — designers care about this deeply

### 3.2 Attribution clarity
- **Problem:** Source attribution shows source name + link, but doesn't distinguish between the institution and the aggregator. Critical for Europeana (covered in EuropeanaReadyPlan Phase 1).
- **Fix:** See EuropeanaReadyPlan 1.2. Also: for all sources, make the attribution link more prominent (bigger text, underlined, opens in new tab).
- **Difficulty:** Easy
- **Impact:** High — institutional partners check this

### 3.3 "Find visually similar" discoverability
- **Problem:** The "find similar" button exists in the panel reverse-search section but is below the fold on most screens. Users don't scroll down in the panel.
- **Fix:** Add a small "≈" button overlay on the image card itself (already exists as `.sim-btn`). Verify it's visible and has a tooltip.
- **Difficulty:** Easy (already built, verify visibility)
- **Impact:** Medium

### 3.4 Panel action buttons
- **Problem:** Download, cite, save — these are functional but small and icon-based. New users don't know what each does.
- **Fix:** Add text labels below or beside icons: "download", "cite", "save to board".
- **Difficulty:** Easy
- **Impact:** Medium

### 3.5 Artist panel usefulness
- **Problem:** "View artist" opens Wikidata panel with bio, works, links. Good feature, but loads slowly for less-known artists (Wikidata SPARQL can take 3-5s).
- **Fix:** Show a skeleton/loading state immediately. If Wikidata returns empty, show "No artist data available" instead of empty panel.
- **Difficulty:** Easy
- **Impact:** Low-Medium

---

## Phase 4 — Navigation & Layout

### 4.1 Sidebar open/close
- **Problem:** Sidebar is controlled by a small gear icon. On mobile it's a hamburger. The sidebar is densely packed (sources, filters, categories, AI options, settings, databases — all in one panel).
- **Fix:** Consider splitting into tabs within the sidebar: "Sources" | "Filters" | "Settings". This reduces scroll length and makes each section discoverable.
- **Difficulty:** Medium
- **Impact:** Medium

### 4.2 Floating toolbar discoverability
- **Problem:** Floating bar only appears after selecting 2+ images. New users may never discover multi-select (click doesn't select — you need to know the interaction pattern).
- **Fix:** Add a tooltip on first card click: "click another image to compare, connect, or build a board". Show once, save to localStorage.
- **Difficulty:** Easy
- **Impact:** High — most powerful feature is the least discoverable

### 4.3 Board vs Grid clarity
- **Problem:** Board mode is a toggled view. Users might not realize it's a separate canvas workspace.
- **Fix:** When switching to board, show a brief tooltip: "drag images here to build a collection". Or show an empty-state message in the board area.
- **Difficulty:** Easy
- **Impact:** Medium

### 4.4 3D mode value
- **Problem:** 3D constellation is impressive but has no obvious purpose. Users click it, go "cool", then go back to grid.
- **Fix:** Add spatial clustering — group visually similar images together in 3D space (use color similarity as distance metric). Add labels. This makes it a research tool, not a gimmick.
- **Difficulty:** Hard
- **Impact:** Medium — impressive in demos

### 4.5 Sketch tool
- **Problem:** Sketch overlay exists on board canvas but is not obviously useful. Pencil icon is small.
- **Fix:** No change needed — it's a power user feature that works. Don't promote what doesn't need promotion.
- **Difficulty:** N/A
- **Impact:** N/A

---

## Phase 5 — Mobile Experience

### 5.1 General mobile usability
- **Problem:** The app works on mobile but is clearly desktop-first. The grid looks good, but the sidebar, panel, and floating bar are cramped.
- **Fix:** Audit touch targets — ensure all buttons are ≥44×44px tap area. The sidebar should be full-screen on mobile (overlay, not push).
- **Difficulty:** Medium
- **Impact:** High — growing mobile traffic

### 5.2 Touch targets
- **Problem:** Source badges, keyword pills, and panel buttons are small (~24px). Hard to tap on phone.
- **Fix:** Add `min-height: 44px; min-width: 44px` to interactive elements via `@media (pointer: coarse)`.
- **Difficulty:** Easy
- **Impact:** High

### 5.3 Floating toolbar on mobile
- **Problem:** Floating bar is draggable on desktop but may overlap content on mobile. Position is uncontrolled.
- **Fix:** On mobile, dock the floating bar to bottom of screen (fixed position, full width, like a mobile action bar).
- **Difficulty:** Medium
- **Impact:** Medium

### 5.4 Board mode on mobile
- **Problem:** Fabric.js canvas drag/arrange doesn't work well on touch. Pinch-zoom conflicts.
- **Fix:** Consider disabling board mode on mobile entirely, or switching to a simple scrollable list view for saved items. Board power features (sketch, arrange) are inherently desktop.
- **Difficulty:** Medium
- **Impact:** Low-Medium

---

## Phase 6 — Visual Design Consistency

### 6.1 Dark monospace aesthetic
- **Problem:** Generally consistent. Some elements use system font instead of monospace (tooltips, some buttons).
- **Fix:** Audit all `font-family` declarations. Ensure everything uses `var(--font-ui)` or `var(--font-mono)`.
- **Difficulty:** Easy
- **Impact:** Low — only noticeable if you look

### 6.2 Color palette consistency
- **Problem:** Accent color (gold/yellow) is used consistently. But some buttons have slight color variations (hover states, active states).
- **Fix:** Audit CSS variables. Ensure all interactive states use `var(--accent)`, `var(--accent-hover)`, etc.
- **Difficulty:** Easy
- **Impact:** Low

### 6.3 Icon consistency
- **Problem:** Mix of Unicode symbols (⤢, ≈, ↺, ✦) and no icons. Works in the monospace aesthetic but some symbols render differently across OS.
- **Fix:** Test on Windows, macOS, iOS, Android. Replace any inconsistent Unicode with inline SVG if needed.
- **Difficulty:** Easy-Medium
- **Impact:** Low

### 6.4 Typography hierarchy
- **Problem:** Generally good. Section labels are small caps. But panel metadata could have clearer hierarchy (title vs. artist vs. date vs. source).
- **Fix:** Increase title font-size in panel. Add subtle horizontal rules between metadata groups.
- **Difficulty:** Easy
- **Impact:** Low-Medium

---

## Phase 7 — Advanced Features Discoverability

### 7.1 AI chat
- **Problem:** ✦ chat icon in sidebar only appears if an AI key is configured. New users don't know it exists until they add a key.
- **Fix:** Always show the chat icon but grayed out. On click without key, show "add an AI key in settings to unlock the research assistant". This teases the feature.
- **Difficulty:** Easy
- **Impact:** Medium

### 7.2 Color search
- **Problem:** Named color swatches are in the sidebar under "SEARCH BY COLOR" — discoverable but not intuitive. Hex palette is in advanced search.
- **Fix:** This is acceptable as-is. Power users find it; casual users use text search. No change needed.
- **Difficulty:** N/A
- **Impact:** N/A

### 7.3 License filter
- **Problem:** Buried in advanced search panel. Researchers who need CC0-only content have to know it exists.
- **Fix:** Add quick-filter pills below search bar: "All licenses | CC0 only | Open access". Show on first search result.
- **Difficulty:** Medium
- **Impact:** High for researchers

### 7.4 Deep zoom
- **Problem:** ⤢ button on cards opens deep zoom but the icon is small and unfamiliar.
- **Fix:** Tooltip on hover: "deep zoom — explore at full resolution". First time a user zooms, show a brief tip about pinch/scroll controls.
- **Difficulty:** Easy
- **Impact:** Low-Medium

### 7.5 Keyboard shortcuts
- **Problem:** Full keyboard navigation works but is not documented anywhere in the app.
- **Fix:** Add "keyboard shortcuts" link in settings that opens a cheatsheet modal. Or show `?` → shortcut list (standard pattern).
- **Difficulty:** Easy-Medium
- **Impact:** Low — power users only

---

## Phase 8 — Performance & Trust

### 8.1 Site speed
- **Problem:** ~395 KB JS bundle. Initial paint is fast (static HTML), but full interactivity waits for JS parse. Acceptable but not exceptional.
- **Fix:** Defer non-critical features (3D, board, sketch) behind dynamic `import()`. Cut initial bundle to ~200 KB.
- **Difficulty:** Hard (code splitting)
- **Impact:** Medium — matters for Lighthouse score and perceived speed

### 8.2 Broken images
- **Problem:** Handled: broken images auto-remove from grid (img.onerror → card.remove). CORS retry without crossOrigin. Failed image counter logs after 3s.
- **Fix:** Already well-handled. No change needed.
- **Difficulty:** N/A
- **Impact:** N/A

### 8.3 Loading states
- **Problem:** "cross-referencing..." loading text appears during search. Adequate but generic.
- **Fix:** Show source-by-source progress: "loading from Met... Wikimedia... Europeana..." as each responds. This communicates the multi-source nature visually.
- **Difficulty:** Medium
- **Impact:** High — makes the app feel alive and transparent

### 8.4 Broken source reporting
- **Problem:** No way for user to report a broken source. Badge refresh (↺) retries silently.
- **Fix:** After 3 consecutive failures from a source, show a subtle "report broken" option that opens a pre-filled GitHub issue.
- **Difficulty:** Medium
- **Impact:** Low — but good for community maintenance

### 8.5 NSFW filter trust
- **Problem:** NSFW filter is opt-in, sampled (first 8 items), and uses Workers AI caption + keyword regex. It's imperfect by design.
- **Fix:** Add tooltip: "sampled filter — may not catch all explicit content". This manages expectations. Don't oversell it.
- **Difficulty:** Easy
- **Impact:** Low-Medium

---

## Priority Matrix

| Item | Difficulty | Impact | Priority |
|------|-----------|--------|----------|
| 1.1 Hero grid on empty state | Medium | High | ⭐⭐⭐ |
| 1.2 Source counter prominence | Easy | High | ⭐⭐⭐ |
| 2.2 Fade-in animation for new cards | Easy | Medium | ⭐⭐ |
| 2.5 Load more with source count | Easy | Medium | ⭐⭐ |
| 3.2 Attribution prominence | Easy | High | ⭐⭐⭐ |
| 4.2 Multi-select tooltip | Easy | High | ⭐⭐⭐ |
| 5.1 Mobile touch targets | Easy | High | ⭐⭐⭐ |
| 5.2 Touch target sizing | Easy | High | ⭐⭐⭐ |
| 7.1 AI chat teaser | Easy | Medium | ⭐⭐ |
| 7.3 License quick-filter | Medium | High | ⭐⭐⭐ |
| 8.3 Source-by-source loading | Medium | High | ⭐⭐⭐ |
