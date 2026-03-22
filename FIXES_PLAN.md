# FIXES_PLAN.md — InpoSearch Pending Fixes & Features

## Overview
Six fixes and features to implement in order.
Each phase must be fully complete before the next starts.
All changes must be confirmed with line numbers.

---

## PHASE 1 — Default Image Count Fix

### Problem
Initial page load shows wrong number of images.
Slider interaction fixes it — meaning the bug is
a mismatch between HTML slider default value and
STATE.imageCount, plus perSource buffer too small.

### Fix 1A — Sync slider default with STATE
- Find HTML slider element for image count
- Find STATE.imageCount default value
- They must match exactly
- If different: update HTML value attribute to match STATE

### Fix 1B — Read slider fresh on every search
- At the very start of runSearch(), before fetchAll():
  STATE.imageCount = parseInt(sliderElement.value);
- This guarantees initial load and slider loads
  behave identically

### Fix 1C — Increase perSource buffer
- Change all perSource + 2 to perSource + 4
  in fetchAll() and fetchMoreResults()
- With 78 sources and low imageCount, buffer of 2
  is too small after dedup and filtering

### Success criteria
- Initial load with default slider value shows
  correct number of images
- No difference between initial load and 
  slider-triggered reload

---

## PHASE 2 — Gemini Rate Limit Fixes

### Problem
Gemini hitting 1,500/day limit within 30 minutes.
Three root causes:
1. analyzeWithGemini() fires automatically on every
   image selection instead of only on explicit request
2. Same images re-analyzed repeatedly — no cache check
3. No rate limiting or debounce between calls

### Fix 2A — Make Gemini vision explicit only
- analyzeWithGemini() must ONLY fire when user
  explicitly clicks an "analyse ✦" button in panel
- Remove any automatic call on selection or 
  updatePanel()
- Add "analyse ✦" button to the concept panel
  below the tags section
- Button grayed when no geminiKey set
- Button shows "analysing..." during call
- Button hidden after successful analysis
  (replaced by AI tags display)

### Fix 2B — Cache AI tags per image
- Before calling analyzeWithGemini():
  Check if item.aiTags.length > 0 — if yes skip call
- Also check localStorage:
  key: 'inspo_aitags_' + item.id
  TTL: 24 hours (same as search cache)
  If found and not expired: use cached tags, skip call
- After successful call: save to localStorage

### Fix 2C — Rate limiting
- Minimum 2000ms between any Gemini calls
- Track STATE.lastGeminiCall = null (timestamp)
- Before each call:
  const elapsed = Date.now() - (STATE.lastGeminiCall || 0);
  if (elapsed < 2000) await sleep(2000 - elapsed);
  STATE.lastGeminiCall = Date.now();

### Fix 2D — Usage counter
- Track daily Gemini call count in localStorage:
  key: 'inspo_gemini_count'
  shape: { count: 0, date: 'YYYY-MM-DD' }
  Reset count to 0 if date is not today
- Show counter in keys panel next to Gemini row:
  "✦ 12 used today / 1500 free"
- When count >= 1400: show warning in panel:
  "approaching daily limit (1500/day)"
- When count >= 1500: disable Gemini buttons,
  show: "daily limit reached — resets at midnight"
- Increment counter after every successful call
  (both vision and interpret calls)

### Fix 2E — Confirm runInterpret stays text-only
- Verify runInterpret() never calls analyzeWithGemini()
- runInterpret() sends metadata text only
- analyzeWithGemini() sends base64 image
- These must remain completely separate

### Success criteria
- Gemini never fires without explicit user action
- Same image never analyzed twice in 24h
- Daily usage visible to user
- Hard stop at 1500 calls

---

## PHASE 3 — Load More Fix

### Problem
"Load more" loads arbitrary number of images
instead of matching the slider value.

### Fix 3A — Match imageCount
- fetchMoreResults() must use STATE.imageCount
  as the target for new batch
- Same perSource calculation as main search:
  const perSource = Math.ceil(STATE.imageCount / activeCallCount);
- Results append to existing grid (already works)

### Fix 3B — Update button label
- Button label shows count dynamically:
  "load {STATE.imageCount} more"
- Update label whenever slider changes
- During loading: "loading..."
- After loading: back to "load {n} more"

### Success criteria
- Load more adds exactly STATE.imageCount images
- Button label always reflects current slider value

---

## PHASE 4 — Per-Source Toggle System

### Overview
Each database can be individually enabled/disabled.
Selection persists in localStorage across sessions.

### Fix 4A — Add enabled flag to STATE
- STATE.disabledSources = new Set()
  loaded from localStorage:
  key: 'inspo_disabled_sources'
  stored as JSON array, parsed to Set on load

### Fix 4B — Gate callIfHealthy with toggle check
- Update callIfHealthy() to also check toggle:
  function callIfHealthy(sourceName, fetchPromise) {
    if (STATE.disabledSources.has(sourceName)) 
      return Promise.resolve([]);
    if (!isSourceHealthy(sourceName)) 
      return Promise.resolve([]);
    return fetchPromise;
  }

### Fix 4C — Toggle UI in keys panel
- Each source row in keys panel gets a toggle switch
  on the LEFT side of the row
- Toggle ON (default): source fires in searches
- Toggle OFF: source skipped, row dims to opacity 0.4
- Toggle state saves to localStorage immediately
- CSS for toggle: same minimal style as existing
  dark mode toggle — no fancy animations

### Fix 4D — Preset group buttons
- Add row of preset buttons at TOP of keys panel,
  above the source list:

  [all]  [none]  [museums]  [photography]  
  [nature]  [historical]  [art & design]

- Button style: same as existing .btn class,
  auto width, display inline-flex, gap 6px
- Each preset sets STATE.disabledSources to the
  complement of that group then saves to localStorage

- Group definitions:
  museums: ['met','rijksmuseum','chicago','cleveland',
    'va','getty','nga','walters','princeton','tate',
    'smk','thyssen','prado','louvre','joconde','mnw',
    'parismusees','cooperhewitt','carnegie','harvard',
    'yale','folger','maas','auckland','tepapa',
    'wellcome','smg','pas','photogrammar','cornell',
    'mna','onb','nypl','mak']
  
  photography: ['flickr','pexels','pixabay','noaa',
    'nasa','apod','hubble','loc','nypl','archive',
    'chronicling','openverse','trove','digitalnz',
    'wikidata','inaturalist','usgs','finna']
  
  nature: ['inaturalist','gbif','eol','bhl','noaa',
    'hubble','apod','nasa','usgs','gbif']
  
  historical: ['archive','chronicling','gallica',
    'loc','trove','digitalnz','wdl','bhl',
    'folger','onb','nypl','soch','nordic']
  
  artdesign: ['wikiart','wikidata','openverse',
    'cooperhewitt','tate','va','artsy','dpla',
    'europeana','getty','nga','carnegie','maas',
    'smk','thyssen','wellcome','rijksmuseum',
    'parismusees','chicago','cleveland']

- "all" enables everything (clears disabledSources)
- "none" disables everything
- Active preset: highlight its button with accent border
  No active preset highlight when custom mix is set

### Fix 4E — Active source count update
- Update the "X sources active" counter in sidebar
  to reflect disabled sources:
  count = 78 - STATE.disabledSources.size

### Success criteria
- Toggle any source off: it never fires in searches
- Toggle persists after browser refresh
- Presets work in one click
- Active count accurate
- Disabled source rows visually dimmed

---

## PHASE 5 — Gemini Vision Explicit Button

### Overview
Move the AI analysis button to be crystal clear
in the UI — separate from automatic flows.

### Fix 5A — Panel button
- In the concept panel (right panel), add:
  Below metadata tags, above related searches:
  
  <button id="analyse-btn" class="btn" style="
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
  ">
    <span>analyse with ai</span>
    <span style="color:var(--accent)">✦</span>
  </button>

- Button states:
  - No key: grayed, tooltip "add gemini key to unlock"
  - Key set, unused: full opacity "analyse with ai ✦"
  - Loading: "analysing..." + disable
  - Complete: button hidden, AI tags shown
  - Already cached: button hidden, AI tags shown

### Fix 5B — Floating bar interpret button
- The "interpret ✦" button in floating bar
  calls runInterpret() (text-only metadata analysis)
- This is separate from panel vision analysis
- Add tooltip to distinguish:
  interpret button: "find concepts from metadata (free)"
  (shown on hover, no gemini key needed for connect,
   key needed for interpret)
- When no key: interpret button grayed with tooltip:
  "add gemini key to unlock ai interpretation"

### Success criteria
- Zero automatic Gemini calls ever
- Panel button clearly distinct from interpret button
- User always in control of when AI is used

---

## PHASE 6 — Polish & Consistency Pass

### Fix 6A — Slider label shows current count
- Slider label updates in real time while dragging
- Format: "24 images" not just "24"
- Also update "load more" button label on slider change

### Fix 6B — Source active counter
- Always accurate — updates after:
  - Toggle change
  - Health tracker update
  - Preset button click

### Fix 6C — Keys panel preset active state
- When a preset is active (all sources in that group
  are enabled, nothing outside it):
  highlight that preset button with accent border
- When custom mix: no preset highlighted
- "all" preset highlighted when all sources enabled

### Fix 6D — Empty state when all sources disabled
- If STATE.disabledSources.size === 78:
  Show message: "no sources active — enable some in api keys"
  Do not run any fetches

---

## Implementation Notes

### Order of implementation
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Each phase independently testable.

### Testing each phase
Phase 1: refresh page, check image count matches slider
Phase 2: select images rapidly, check console for 
         Gemini calls — should see zero unless button clicked
Phase 3: set slider to 12, click load more, count new images
Phase 4: disable Met, search "portrait" — no Met badges
Phase 5: select image, check panel — no auto AI call

### Files to update
- index.html (all changes)
- API_CONTRACTS.md (Gemini caching contract)
- FEATURE_SPEC.md (new feature specs)
