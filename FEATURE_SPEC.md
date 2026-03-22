# FEATURE_SPEC.md — InpoSearch

## Build Priority Order

Build and verify each phase before starting the next.
Do not start Phase 3 if Phase 2 is broken.

```
Phase 1 — Shell & Design System     (layout, fonts, colors, all CSS)
Phase 2 — Search & Grid             (search input, API calls, image display)
Phase 3 — Selection & Panel         (click to select, right panel, color extraction)
Phase 4 — Sketch Mode & Controls    (slider, sketch toggle, dark mode)
Phase 5 — Board View                (drag, resize, export)
Phase 6 — 3D View                   (Three.js constellation)
Phase 7 — Gemini Integration        (optional AI key input, vision tags)
Phase 8 — Polish                    (transitions, empty states, error states)
```

---

## PHASE 1 — Shell & Design System

### F-001 — App shell renders
- Given: browser opens index.html
- When: page loads
- Then: three-panel layout visible (sidebar 240px | canvas flex | panel 280px hidden)
- Then: sidebar shows logo "insposearch" in Cormorant Garamond italic
- Then: background is #F7F5F2 (light) or #0E0E0D (dark per system preference)
- Then: no errors in console

### F-002 — Dark mode works
- Given: system is in dark mode OR user clicks theme toggle
- When: dark mode is active
- Then: all CSS variables switch to dark values
- Then: body has class "dark" when manually toggled
- Then: toggle button shows "light" in dark mode, "dark" in light mode

### F-003 — Fonts load
- Given: page loads with internet connection
- When: fonts are available
- Then: DM Mono renders for all UI labels
- Then: Cormorant Garamond renders for logo
- Then: fallback to monospace / serif if fonts unavailable (no layout break)

---

## PHASE 2 — Search & Grid

### F-010 — Search input accepts text
- Given: user clicks search input
- When: user types "brutalism"
- Then: text appears in input field
- Then: bottom border turns to accent color (#C8B89A)

### F-011 — Search submits on Enter
- Given: user has typed a keyword
- When: user presses Enter
- Then: search executes
- Then: loading indicator appears ("searching...")
- Then: input remains populated with query

### F-012 — Keyword expansion runs
- Given: user searches "brutalism"
- When: search executes
- Then: Datamuse API is called (rel_trg + ml)
- Then: SEED_MAP entries for "brutalism" are included
- Then: expanded keyword pills appear below search input
- Then: max 12 pills shown
- Then: each pill is removable (click removes it)

### F-013 — All three sources are fetched in parallel
- Given: search executes with keywords
- When: fetches run
- Then: Wikimedia, Met, and Archive all called simultaneously (Promise.allSettled)
- Then: failure of any one source does not block the others
- Then: previous fetch is aborted if new search starts

### F-014 — Images render in grid
- Given: fetch returns results
- When: results are normalized and filtered
- Then: images appear in CSS grid (auto-fill, minmax 200px, gap 2px)
- Then: each image fades in from opacity 0 to 1 over 400ms after loading
- Then: broken images are silently removed
- Then: source badge appears on hover (bottom-left, "met" / "wiki" / "archive")

### F-015 — Image count slider works
- Given: grid is showing images
- When: user drags slider (range 6–48, default 18)
- Then: grid updates within 200ms (debounced)
- Then: image count label updates in real time (e.g. "18 images")
- Then: results redistribute proportionally across sources

### F-016 — Anti-AI filter applied
- Given: results are returned from any source
- When: normalization runs
- Then: any item whose title/description/url contains banned AI terms is excluded
- Then: filter runs silently (no UI indication needed)

### F-017 — Results are interleaved and shuffled
- Given: all three sources return results
- When: final array is assembled
- Then: results are interleaved (wiki[0], met[0], archive[0], wiki[1]...)
- Then: final array is Fisher-Yates shuffled
- Then: array is sliced to STATE.imageCount

### F-018 — Search results are cached
- Given: user searches "brutalism"
- When: user searches "brutalism" again
- Then: cached results load instantly (no API calls)
- Then: cache key follows pattern `inspo_{keywords joined}`
- Then: max 5 searches cached in sessionStorage

### F-019 — Empty state shown when no results
- Given: search returns zero valid images
- When: grid would be empty
- Then: center of canvas shows italic message: "nothing found — try different words"
- Then: a secondary line in DM Mono: "try: texture / light / form / shadow"

---

## PHASE 3 — Selection & Panel

### F-020 — Image selection works
- Given: grid is showing images
- When: user clicks an image
- Then: image card gets 2px solid accent border (outline-offset: -2px)
- Then: image is added to STATE.selected
- Then: right panel slides in (transform from translateX(100%) to translateX(0))
- Then: multiple images can be selected (click more to add)

### F-021 — Deselection works
- Given: an image is selected
- When: user clicks the selected image again
- Then: accent border removed
- Then: image removed from STATE.selected
- Then: if STATE.selected is empty, panel slides out

### F-022 — Color extraction runs on selection
- Given: user selects an image
- When: image is added to STATE.selected
- Then: Canvas API samples the image (50x50 downsample)
- Then: 5 dominant colors extracted (bucket quantization)
- Then: colors displayed as 28x28 square swatches in panel

### F-023 — Tags shown in panel
- Given: user selects an image
- When: panel renders
- Then: tags extracted from title + description displayed as pills
- Then: clicking a tag runs a new search for that tag
- Then: source info shown: title, source name, year, link to original

### F-024 — Related searches shown in panel
- Given: panel is open with selected image
- When: panel renders related section
- Then: Datamuse API called for top 3 tags (rel_trg endpoint)
- Then: top 8 unique related terms shown as "→ explore [term]" links
- Then: clicking a related link runs new search for that term
- Then: section label: "explore related"

### F-025 — Multiple selections aggregate panel
- Given: user has selected 3 images
- When: panel shows
- Then: colors from all selected images shown (deduplicated by visual similarity)
- Then: tags from all selected images merged and deduplicated
- Then: related searches based on most frequent shared tags

---

## PHASE 4 — Sketch Mode & Controls

### F-030 — Sketch mode toggle works
- Given: grid is showing images
- When: user clicks sketch toggle
- Then: all images get `filter: grayscale(1) contrast(1.4) brightness(1.1)`
- Then: transition takes 500ms
- Then: button label changes to "sketch" (was "color")
- Then: toggling again removes filter, label returns to "color"

### F-031 — Sketch mode persists across view changes
- Given: sketch mode is ON
- When: user switches to board or 3D view and back
- Then: sketch mode remains ON
- Then: STATE.sketchMode is the source of truth

---

## PHASE 5 — Board View

### F-040 — Board view activates
- Given: user has selected at least 1 image
- When: user clicks "board" in view toggle
- Then: grid disappears, canvas switches to position:relative free canvas
- Then: selected images appear as draggable cards (default width 200px, aspect-ratio preserved)
- Then: cards are positioned in a slight grid pattern initially (not all at 0,0)

### F-041 — Drag works
- Given: board view is active
- When: user mousedown on a card and drags
- Then: card follows mouse position
- Then: card stays within canvas bounds (clamp to canvas width/height)
- Then: mouseup drops card at final position
- Then: position persists (not reset on re-render)

### F-042 — Resize handle works
- Given: board view is active
- When: user drags the bottom-right corner handle of a card
- Then: card resizes (min 80px, max 600px wide)
- Then: aspect ratio is maintained

### F-043 — Export to PNG works
- Given: board view is active with cards
- When: user clicks "export"
- Then: html2canvas captures the #canvas element
- Then: PNG file downloads automatically
- Then: filename format: `insposearch-board-{Date.now()}.png`
- Then: button shows "exporting..." during capture, returns to "export" after

### F-044 — Double-click opens concept panel
- Given: board view is active
- When: user double-clicks any card
- Then: concept panel opens for that specific image
- Then: same panel behavior as in grid view (colors, tags, related)

---

## PHASE 6 — 3D View

### F-050 — 3D view activates
- Given: user has selected at least 1 image
- When: user clicks "3d" in view toggle
- Then: Three.js scene initializes
- Then: renderer fills #canvas
- Then: background color matches app background (--bg token)
- Then: no grid, no axes, no helpers visible

### F-051 — Images appear as 3D planes
- Given: 3D view is active with selected images
- When: scene renders
- Then: each image is a PlaneGeometry with image texture
- Then: planes face the camera (initial state)
- Then: images with 2+ shared tags are positioned within 3 units of each other
- Then: images with no shared tags are on outer sphere (radius 6–9)

### F-052 — OrbitControls work
- Given: 3D view is active
- When: user drags (rotate), scrolls (zoom), right-drags (pan)
- Then: camera responds smoothly
- Then: inertia/damping enabled (enableDamping: true, dampingFactor: 0.05)

### F-053 — Hover highlights image
- Given: 3D view is active
- When: user hovers over a plane
- Then: plane material emissive intensity increases to 0.3
- Then: cursor changes to pointer

### F-054 — Click opens concept panel
- Given: 3D view is active
- When: user clicks a plane
- Then: concept panel opens for that image
- Then: raycasting used for hit detection

### F-055 — 3D resources disposed on exit
- Given: 3D view is active
- When: user switches to another view
- Then: renderer.dispose() called
- Then: all geometries and textures disposed
- Then: renderer DOM element removed from canvas
- Then: no memory leak (scene set to null)

---

## PHASE 7 — Gemini Integration

### F-060 — API key input appears
- Given: sidebar is visible
- When: user clicks "add gemini key" button (bottom of sidebar)
- Then: small inline input appears below the button
- Then: input type is "password" (key not visible)
- Then: placeholder: "paste gemini api key"

### F-061 — Key is saved to sessionStorage
- Given: user has pasted a key in the input
- When: user presses Enter or clicks confirm
- Then: key saved to sessionStorage as 'inspo_gemini_key'
- Then: STATE.geminiKey updated
- Then: input collapses, button label changes to "gemini active"
- Then: key never appears in any visible UI after entry

### F-062 — AI analysis runs on selection
- Given: STATE.geminiKey is set
- When: user selects an image
- Then: Gemini 2.0 Flash vision API called with image
- Then: loading state shown in panel: "analyzing..."
- Then: returned tags displayed with "✦ ai" label
- Then: AI tags shown above metadata tags in panel
- Then: on error: "ai analysis unavailable" shown, metadata tags used

### F-063 — AI works without key
- Given: STATE.geminiKey is null
- When: user selects an image
- Then: AI section not shown in panel
- Then: metadata tags shown normally
- Then: "no key — add gemini key for vision" shown at bottom of panel (subtle, ink-3 color)

---

## PHASE 8 — Polish

### F-070 — View toggle is clear
- Given: any view is active
- When: user looks at the view toggle buttons
- Then: active view button has font-weight 400 and stronger border
- Then: inactive buttons have lighter opacity
- Then: buttons labeled: "grid" / "board" / "3d"

### F-071 — Sidebar sections are clearly separated
- Given: sidebar is rendered
- Then: sections appear in this order: logo → search input → keyword pills → divider → image count slider → divider → view toggle → sketch toggle → divider → theme toggle → (spacer flex-grow) → gemini key button
- Then: dividers are 1px var(--line) lines
- Then: each section has 16–24px gap from adjacent sections

### F-072 — Transitions feel deliberate
- Given: any state change occurs
- Then: all opacity transitions are 300–500ms ease
- Then: panel slide is 400ms ease
- Then: no instantaneous jumps (except intentional: e.g. clearing the grid before new search)

### F-073 — Panel close button works
- Given: panel is open
- When: user clicks "×" (top-right of panel)
- Then: all images deselected
- Then: panel slides out
- Then: STATE.selected = []

### F-074 — Keyword pills are manageable
- Given: expanded keywords are shown
- When: there are more than 8 pills
- Then: pills wrap to next line
- Then: each pill has × to remove it
- Then: removing a pill removes that keyword from STATE.keywords
- Then: does NOT re-trigger search (search only on Enter or pill click)

### F-075 — No broken image icons ever visible
- Given: any image fails to load
- When: onerror fires
- Then: entire card is removed from DOM
- Then: no alt text visible, no broken icon visible

### F-076 — App works offline after first load
- Given: user has loaded the app and performed a search
- When: network disconnects
- Then: cached searches still work
- Then: images already loaded remain visible
- Then: new searches show graceful error: "connection unavailable"

---

## Non-negotiable constraints (check before calling done)

- [ ] Single `index.html` file, no external dependencies except CDN
- [ ] Opens by double-clicking in any modern browser (Chrome, Firefox, Safari)
- [ ] No console errors on load
- [ ] No broken images visible at any point
- [ ] Dark mode works via system preference without any user action
- [ ] Sketch mode transition takes exactly 500ms (not instant)
- [ ] Panel slides (not jumps) in and out
- [ ] Three.js resources are fully disposed when leaving 3D view
- [ ] Gemini key is stored in sessionStorage only, never hardcoded
- [ ] All fetches use AbortController — switching searches never causes duplicate results
- [ ] Font is DM Mono throughout UI — not system monospace, not Inter, not any other font

---

## PHASE 9 — Speed Optimizations

### F-080 — Progressive rendering
- Given: user submits a search
- When: first source returns results (typically NASA or Met, ~400ms)
- Then: images appear in grid immediately
- Then: grid continues filling as each subsequent source returns
- Then: total perceived wait time under 1s for first images

### F-081 — Idempotent renderGrid
- Given: renderGrid() is called multiple times with growing results
- When: a card with item.id already exists in #image-grid
- Then: that card is NOT re-rendered or duplicated
- Then: only new items are appended to the grid

### F-082 — Source timeout
- Given: any fetch source is called
- When: source does not respond within 3000ms
- Then: that source is silently skipped
- Then: other sources are not affected
- Then: no error shown to user

### F-083 — Prefetch on typing
- Given: user is typing in search input
- When: user pauses typing for 400ms and query length > 2
- Then: expandKeywords() runs and caches result
- When: user presses Enter
- Then: keyword expansion is skipped (already cached)
- Then: fetchAll() starts immediately

### F-084 — Background cache refresh
- Given: user searches a previously cached term
- When: cache hit renders immediately
- Then: fetchAll() still runs in background silently
- Then: if new results differ by more than 20%, grid updates
- Then: no flash or jump — new cards append smoothly

---

## PHASE 10 — New No-Key Sources

### F-090 — iNaturalist source
- Given: any search runs
- When: fetchINaturalist() called
- Then: returns nature/wildlife photos with CORS support
- Then: images tagged with species, location, taxonomy
- Then: badge shows 'nature' with green tint
- Then: works with zero configuration

### F-091 — Library of Congress source
- Given: any search runs
- When: fetchLOC() called
- Then: returns historical American photos and documents
- Then: nested image_url array handled safely
- Then: badge shows 'loc' with dark red tint

### F-092 — Open Library Covers source
- Given: any search runs
- When: fetchOpenLibrary() called
- Then: returns book cover images for matching titles/subjects
- Then: items without cover_i are skipped
- Then: badge shows 'books' with purple tint

### F-093 — All new sources in fetchAll
- Given: fetchAll() runs
- Then: iNaturalist, LOC, and Open Library all called
  via Promise.allSettled
- Then: each has 3000ms timeout via withTimeout()
- Then: each appends results progressively as they land
- Then: perSource recalculated for 12 total sources

## BATCH 2 — PHASE 11: 20 New Sources Implementation

Build order within this phase:
1. Zero-setup sources first (B01–B08, B11–B17, B19–B20)
2. Light-key sources second (B09 Trove, B10 DigitalNZ)
3. Europeana bonus calls (B18) — no new function
4. Wikimedia featured call (B20) — no new function

---

### F-100 — All Batch 2 fetch functions present
- `fetchGetty()` present, returns `[]` on error
- `fetchNGA()` present, returns `[]` on error
- `fetchGBIF()` present, returns `[]` on error
- `fetchEOL()` present, two-step fetch, returns `[]` on error
- `fetchAPOD()` present, filters `media_type=image`
- `fetchGallica()` present, returns `[]` on error
- `fetchChroniclingAmerica()` present, builds image URL from `id`
- `fetchOpenverse()` present, returns `[]` on error
- `fetchTrove()` present, returns `[]` when no key
- `fetchDigitalNZ()` present, returns `[]` when no key
- `fetchBHL()` present, two-step, uses public demo key
- `fetchCarnegie()` present, returns `[]` on error
- `fetchPrado()` present, CORS try/catch, returns `[]` silently
- `fetchParisMusees()` present, POST GraphQL, returns `[]` silently
- `fetchYale()` present, builds IIIF url, returns `[]` on error
- `fetchPicsum()` present, keyword-gated to texture searches only
- `fetchUSGS()` present, returns `[]` on error
- `fetchCooperHewitt()` present, uses demo token
- 2 extra Europeana calls in `fetchAll` (fashion + textile)
- 1 extra Wikimedia featured call in `fetchAll`

---

### F-101 — fetchAll updated
- All new sources in `Promise.allSettled`
- Total parallel calls: ~40 (including all bonus calls)
- `perSource = Math.ceil(totalCount / 40)`
- All use `withTimeout(signal, 3000)`
- All use `onSourceResult()` pattern
- All wrapped in `.catch(() => {})` 

---

### F-102 — New state keys
- `STATE.troveKey` — `null` in STATE object, loaded from `localStorage.getItem('inspo_trove_key')` on init
- `STATE.digitalnzKey` — `null` in STATE object, loaded from `localStorage.getItem('inspo_digitalnz_key')` on init

---

### F-103 — New badge CSS
All 18 new badge classes present in `<style>`:
```css
.badge-getty       { background: rgba(180,140,20,0.75); }
.badge-nga         { background: rgba(20,60,120,0.75); }
.badge-gbif        { background: rgba(20,140,60,0.75); }
.badge-eol         { background: rgba(0,120,80,0.75); }
.badge-apod        { background: rgba(10,20,80,0.8); }
.badge-gallica     { background: rgba(0,80,160,0.75); }
.badge-chronicling { background: rgba(120,20,20,0.75); }
.badge-openverse   { background: rgba(200,80,0,0.75); }
.badge-trove       { background: rgba(0,100,60,0.75); }
.badge-digitalnz   { background: rgba(0,60,140,0.75); }
.badge-bhl         { background: rgba(60,120,20,0.75); }
.badge-carnegie    { background: rgba(160,40,40,0.75); }
.badge-prado       { background: rgba(140,0,20,0.8); }
.badge-parismusees { background: rgba(0,60,120,0.8); }
.badge-yale        { background: rgba(0,40,100,0.8); }
.badge-picsum      { background: rgba(80,80,80,0.6); }
.badge-usgs        { background: rgba(80,60,20,0.75); }
.badge-cooperhewitt{ background: rgba(200,60,0,0.75); }
```
Correct badge class and label text assigned per `item.source` in `renderGrid()`.

---

### F-104 — Keys panel updated
New rows in `KEY_SOURCES` array:
- Getty — always active, no key, `alwaysOn: true`
- NGA — always active, no key, `alwaysOn: true` 
- GBIF — always active, no key, `alwaysOn: true`
- EOL — always active, no key, `alwaysOn: true`
- NASA APOD — always active, DEMO_KEY built in, `alwaysOn: true`
- Gallica — always active, no key, `alwaysOn: true`
- Chronicling America — always active, no key, `alwaysOn: true`
- Openverse — always active, no key, `alwaysOn: true`
- BHL — always active, public key built in, `alwaysOn: true`
- Carnegie — always active, no key, `alwaysOn: true`
- Prado — always active (CORS best-effort), `alwaysOn: true`
- Paris Musées — always active (CORS best-effort), `alwaysOn: true`
- Yale — always active, no key, `alwaysOn: true`
- Picsum — always active (texture searches only), `alwaysOn: true`
- USGS — always active, no key, `alwaysOn: true`
- Cooper Hewitt — always active, demo token built in, `alwaysOn: true`
- Trove — key input, `alwaysOn: false`, `stateKey: 'troveKey'`, `storageKey: 'inspo_trove_key'`, getKeyUrl: `https://trove.nla.gov.au/about/create-something/using-api`
- DigitalNZ — key input, `alwaysOn: false`, `stateKey: 'digitalnzKey'`, `storageKey: 'inspo_digitalnz_key'`, getKeyUrl: `https://digitalnz.org/developers`

---

### F-105 — No regressions
- All existing 20 sources still wired in `fetchAll`
- No duplicate card IDs (`seenIds` Set prevents duplication)
- Slider `max` updated to `150`
- Default image count stays `24`
- `IMAGE_COUNT_MAX` constant updated to `150`




## BATCH 3 — PHASE 12: Source Health + 20 New Sources

---

### F-110 — Source health tracker
- `STATE.sourceHealth` initialized as `{}`
- `loadSourceHealth()` called on page init (reads sessionStorage)
- `recordSourceResult(sourceName, count)` called inside `onSourceResult(sourceName)`
- `isSourceHealthy(sourceName)` returns `true` for unseen sources, `false` after 3 consecutive misses

---

## PHASE 14 — Cross-Reference Search

### F-130 — Multi-select behavior
- Ctrl+click (or Cmd+click on Mac) toggles image selection
- Selected images get 2px accent border (already exists)
- Selecting 2+ images triggers floating bar to appear
- Selecting 0-1 images hides floating bar
- Escape key clears all selections

### F-131 — Floating action bar
- Fixed position, bottom center of #canvas
- Slides up from bottom when 2+ images selected
- Slides down when selection cleared
- Contains: thumbnail strip (max 5) + count + 
  "connect" button + "interpret ✦" button + "×" button
- "interpret ✦" grayed (opacity 0.4) when no Gemini key
- Hovering grayed interpret button shows tooltip:
  "add gemini key to unlock ai interpretation"
- Bar never covers the image grid (canvas has 80px 
  bottom padding when bar is visible)

### F-132 — connect() function
- Runs scoreTerms() on STATE.selected
- Returns 8 search terms sorted by frequency score
- Triggers crossRefSearch(terms, 'connect')

### F-133 — interpret() function  
- Returns [] immediately if !STATE.geminiKey
- Builds text descriptions from selected image metadata
- Sends single text-only prompt to Gemini
- Parses JSON array response
- Triggers crossRefSearch(terms, 'interpret')
- Shows loading state in bar: "interpreting..."

### F-134 — crossRefSearch(terms, mode)
- Sets STATE.crossRefMode = mode
- Sets STATE.crossRefTerms = terms
- Sets STATE.referenceImages = [...STATE.selected]
- Clears current grid
- Shows reference strip above grid
- Runs all terms as parallel searches
- Uses same onSourceResultGlobal() + renderGrid() pattern
- Shows concept pills above results
- Does NOT affect STATE.selected (keep selection active)

### F-135 — Reference strip
- Pinned between sidebar and image grid (top of canvas)
- Shows STATE.referenceImages as 60px thumbs
- Label: "references" in DM Mono 9px uppercase
- Each thumb: hover shows × to remove
- Remove thumb: updates STATE.referenceImages,
  re-runs current analysis automatically
- "clear" button: resets everything,
  hides strip, clears crossRefMode
- Ctrl+click on result image: adds to reference strip,
  re-runs analysis (shows "updating..." in bar)

### F-136 — Concept pills
- Shown between reference strip and image grid
- Row of pills showing STATE.crossRefTerms
- Prefix: "✦" for interpret mode, "○" for connect mode
- Each pill clickable: runs single-term search
- Delete pill: removes term, re-runs without it
- Add pill: small "+" button opens text input inline

### F-137 — Enter key behavior
- If STATE.selected.length >= 2 AND search input is empty:
  trigger connect() instead of normal search
- If search input has text AND images selected:
  normal search (text takes priority)
- If no images selected: normal search

### F-138 — No regressions
- Normal search still works when nothing selected
- Single image selection still opens concept panel
- Ctrl+click does not open concept panel (only select)
- Regular click still selects + opens panel as before
- `callIfHealthy(sourceName, fetchPromise)` wraps every source call in fetchAll
- Sources with 3+ consecutive misses are skipped for that session
- Misses reset each browser session (sessionStorage cleared on tab close)
- `updateSourcesActiveCounter()` called after each source resolves
- "X sources active" shown in sidebar below loading-indicator — DM Mono 9px, ink-3

---

### F-111 — All Batch 3 fetch functions present
- `fetchTate()` — no key, Tate Collection London
- `fetchFinna()` — no key, Finnish Heritage Agency
- `fetchSOCH()` — no key, Swedish Cultural Heritage (CORS best-effort)
- `fetchJoconde()` — no key, French national museum db (data.culture.gouv.fr)
- `fetchMNW()` — no key, Polish National Museum Warsaw
- `fetchTePapa()` — no key, Museum of NZ Te Papa
- `fetchDPLA()` — `STATE.dplaKey`, returns `[]` if no key
- `fetchArtsy()` — `STATE.artsyId` + `STATE.artsySecret`, xapp token cached in `STATE.artsyToken`; returns `[]` if either credential missing
- `fetchPAS()` — no key, Portable Antiquities Scheme (UK finds)
- `fetchSMG()` — no key, Science Museum Group UK
- `fetchAuckland()` — no key, Auckland War Memorial Museum
- `fetchPhotogrammar()` — no key, FSA/OWI Depression photographs (Yale)
- `fetchWellcome()` — no key, Wellcome Collection (medical history)
- `fetchMAAS()` — no key, Powerhouse Museum Sydney
- `fetchSMK()` — no key, Statens Museum for Kunst (Denmark)
- `fetchThyssen()` — no key, Thyssen-Bornemisza Madrid (CORS best-effort)
- C17 WDL: extra `fetchLOC()` call with id/source remapping — no new function
- C18 Wikimedia Artwork: two extra `fetchWikimedia()` calls — no new function

---

### F-112 — New STATE keys
- `STATE.dplaKey` — `null`, loaded from `localStorage.getItem('inspo_dpla_key')`
- `STATE.artsyId` — `null`, loaded from `localStorage.getItem('inspo_artsy_id')`
- `STATE.artsySecret` — `null`, loaded from `localStorage.getItem('inspo_artsy_secret')`
- `STATE.artsyToken` — `null`, runtime-only (not persisted)

---

### F-113 — fetchAll updated
- All new sources added to `Promise.allSettled`
- All calls wrapped with `callIfHealthy(sourceName, fetchPromise)`
- C17 WDL mapped inline: `.then(r => r.map(i => ({...i, source:'wdl', id:i.id.replace('loc_','wdl_')})))`
- Total parallel call slots: ~55 (some share source names e.g. europeana × 3, wikimedia × 4)
- `perSource = Math.ceil(totalCount / 55)`
- All use `onSourceResult(sourceName)` curried form

---

### F-114 — Keys panel updated
- All no-key Batch 3 sources shown as `alwaysOn: true` (green "✓ active" badge)
- DPLA row: key input + get-key link → `dp.la/info/developers`
- Artsy row: two separate text inputs (client_id + client_secret) + get-key link → `developers.artsy.net`
- Thyssen + SOCH shown as `alwaysOn: true` with CORS best-effort note in `desc`

---

### F-115 — No regressions
- All existing sources (Batch 1 + 2) still wired in fetchAll
- Health tracker never blocks a source on first search (unseen = healthy)
- `onSourceResult` curried signature is backward-compatible (all callers updated)
- Slider max stays 150, default count stays 24
- CORS-risky sources (Thyssen, SOCH, Prado, Paris Musées) return `[]` silently — no console errors

---

## BATCH 4 — PHASE 13: 20 More Sources

### F-120 — New fetch functions present
- fetchWalters() — no key, CORS confirmed
- fetchPrinceton() — no key, IIIF
- fetchWikidata() — SPARQL, no key, User-Agent header
- fetchNOAA() — no key, US government
- fetchHubble() — no key, client-side filter, STATE.hubbleCache
- fetchCornell() — no key, IIIF
- fetchFolger() — CORS best-effort, try/catch
- fetchONB() — CORS best-effort, try/catch
- fetchNYPL() — no key
- fetchMAK() — CORS best-effort, try/catch
- fetchMNA() — CORS best-effort, try/catch

### F-121 — Extra calls (no new functions)
- Louvre via fetchJoconde remapped (D10)
- Wikimedia MediaSearch improved call (D07)
- Princeton Medieval Art (D11) — if CORS allows
- National Library Scotland (D12) — if CORS allows
- Rijksmuseum drawings + prints extra calls (D15)
- BHL illustrated extra call (D16)
- Smithsonian photography extra call (D19)
- Archive visual art extra call (D20)

### F-122 — STATE additions
- STATE.hubbleCache: [] — populated on first Hubble fetch
- STATE.hubbleCacheTimestamp: null — for 6h cache

### F-123 — fetchAll updated
- All new sources + extra calls in Promise.allSettled
- Total parallel calls: ~70
- perSource = Math.ceil(totalCount / 70)
- All new sources use callIfHealthy()
- All use onSourceResult() pattern

### F-124 — Badge CSS
- All new badge classes in <style>
- createImageCard badge map updated
- Louvre badge added (reuses joconde function)

### F-125 — Keys panel
- All new sources shown as always active
- CORS-risky shown as active (best-effort)
- No new key inputs needed for this batch

### F-126 — Hubble cache behavior
- First call fetches all Hubble images (~500)
- Stored in STATE.hubbleCache
- Refreshed every 6 hours (STATE.hubbleCacheTimestamp)
- Subsequent searches filter client-side instantly
- No API call on repeat searches for Hubble

---

## PHASE 15 — Six Fixes Implementation

### F-140 — Image count sync (Phase 1)
- STATE.imageCount read from slider at start of runSearch()
- HTML slider default matches STATE.imageCount default
- perSource buffer is + 4 everywhere
- Initial load image count matches slider value

### F-141 — Gemini explicit only (Phase 2)
- Zero automatic Gemini calls
- analyzeWithGemini() only fires on button click
- 24h localStorage cache per image ID
- 2000ms minimum between calls
- Daily counter shown in keys panel
- Warning at 1400, hard stop at 1500

### F-142 — Load more count fix (Phase 3)
- fetchMoreResults() uses STATE.imageCount as target
- Button label: "load {n} more"
- Label updates when slider changes

### F-143 — Per-source toggles (Phase 4)
- STATE.disabledSources as Set, persisted to localStorage
- callIfHealthy() checks disabled set first
- Toggle UI in keys panel — left side of each row
- 7 preset group buttons at top of keys panel
- Active source counter always accurate
- Disabled rows dimmed to 0.4 opacity

### F-144 — Explicit AI panel button (Phase 5)
- "analyse with ai ✦" button in concept panel
- Button hidden when tags already cached
- Separate from floating bar interpret button
- Clear tooltip distinguishing the two

### F-145 — Polish pass (Phase 6)
- Slider label shows "N images" in real time
- Load more label updates with slider
- Preset active state highlighted
- Empty state when all sources disabled

---

## BATCH 6 — PHASE 17: 30 More No-Key Sources

### F-160 — New fetch functions
- fetchFitzwilliam() — Cambridge, CORS best-effort
- fetchPenn() — Penn Museum, CORS best-effort
- fetchACMI() — Australian film/media
- fetchNMM() — National Maritime Museum, CORS best-effort
- fetchDDB() — Deutsche Digitale Bibliothek, CORS best-effort
- fetchFNG() — Finnish National Gallery, CC0
- fetchBrooklyn() — key required (free instant, no credit card)
- fetchFortepan() — Hungarian historical photos, CC BY-SA
- fetchOpenContext() — field archaeology photos
- fetchAlbertKahn() — autochromes, early 20th century color
- fetchCanadiana() — Canadian heritage, CORS best-effort
- fetchNHM() — Natural History Museum London
- fetchWCMA() — Williams College, client-side filter, cached
- fetchEuropeanaDemo() — no-key Europeana demo endpoint
- fetchUNT() — Portal to Texas History
- fetchQAGOMA() — Queensland art, CORS best-effort
- fetchOPenn() — UPenn Colenda manuscripts, CORS best-effort
- fetchIABooks() — Internet Archive illustrated books

### F-161 — Extra calls (no new functions)
- fetchWikimedia with 'incategory:Photographs '+keyword (F30)
- fetchEuropeanaDemo as parallel no-key Europeana call (active only when europeanaKey not set)

### F-162 — STATE additions
- STATE.wcmaCache: [] — populated on first fetchWCMA call
- STATE.wcmaCacheTimestamp: null — invalidated after 24h
- STATE.brooklynKey — loaded from localStorage 'inspo_brooklyn_key' at init

### F-163 — fetchAll updated
- All new sources added to Promise.allSettled
- callIfHealthy() wrapping all new calls
- perSource updated: Math.ceil(totalCount / 120)
- activeCallCount comment updated to ~120 parallel calls

### F-164 — Badge CSS
- All new .badge-{id} classes added to <style>
- createImageCard badge map updated for all new source IDs
- createImageCard label map updated for all new source IDs

### F-165 — Keys panel
- Brooklyn key input shown (free, instant, no credit card)
- All other new sources shown as always active
- CORS-risky sources marked as best-effort in description
- WCMA shown as "active — cached on first use"
- EuropeanaDemo row shown only when europeanaKey is NOT set

### F-166 — SOURCE_GROUPS updated
museums: + fitzwilliam, penn, nmm, ddb, fng,
  brooklyn, nhm, wcma, mkg, balboa, mollondon
photography: + fortepan, albertkahn, canadiana,
  unt, iabooks
nature: + nhm
historical: + canadiana, unt, iabooks,
  upenn, zeri
artdesign: + fitzwilliam, fng, brooklyn,
  acmi, qagoma

---

## BATCH 7 — PHASE 18: 30 More No-Key Sources

### F-170 — New fetch functions
- fetchMia() — Minneapolis Institute of Art, CC0
- fetchLACMA() — LA County Museum, CORS best-effort
- fetchMunch() — Munch Museum Norway, CORS best-effort
- fetchMauritshuis() — Dutch Golden Age, CORS best-effort
- fetchNationalmuseumSE() — Wikimedia-based, Stockholm
- fetchNaturalis() — Dutch natural history 42M specimens
- fetchNMAAHC() — Smithsonian African American
- fetchNASM() — Smithsonian Air and Space
- fetchWhitney() — CSV client-side, CC0
- fetchNationalZoo() — Smithsonian zoo photos
- fetchGBIFLiterature() — book illustration specimens
- fetchFreerSackler() — Smithsonian Asian/African art
- fetchArchiveMaps() — Internet Archive maps
- fetchOpenLibrarySubjects() — subject-based book covers

### F-171 — Extra calls (no new functions)
- fetchMet('heilbrunn '+keyword) — G11
- fetchNMAAHC(keyword+' photograph') — G28
- fetchCooperHewitt(keyword+' textile pattern') — G17
- fetchWikimedia('incategory:Drawings '+keyword) — G29
- fetchWellcome(keyword+' illustration') — G26
- fetchWikimedia for Nationalmuseum Stockholm — G05

### F-172 — STATE additions
- STATE.whitneyCache: []
- STATE.whitneyCacheTimestamp: null

### F-173 — fetchAll updated
- All new sources in Promise.allSettled
- callIfHealthy() wrapping all
- perSource: Math.ceil(totalCount / 140)
- activeCallCount comment updated to ~140

### F-174 — Badge CSS + maps
All new badge classes present.
createImageCard badge map updated.

### F-175 — Keys panel
All new sources shown as always active.
CORS-risky marked appropriately.
Whitney shown as "active — CSV cached on first use"
NMAAHC, NASM, NationalZoo, FreerSackler shown as
"active — uses Smithsonian demo key"

### F-176 — SOURCE_GROUPS updated
museums: + mia, lacma, munch, mauritshuis,
  nationalmuseumse, ago, pem, nmaahc, nasm,
  whitney, freersackler, npg, amsterdam,
  estonia, historiska, louvread
photography: + mia, lacma, whitneyarchive
nature: + naturalis, nationalzoo, gbiflit
historical: + lacma, mauritshuis, harvardmaps,
  archivemaps, nationalmuseumse, historiska
artdesign: + mia, lacma, mauritshuis, whitney,
  munch, freersackler

