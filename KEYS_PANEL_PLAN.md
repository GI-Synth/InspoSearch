# API Keys Panel — Implementation Plan

## Goal
Replace the old `#api-keys-section` sidebar widget with a full-height overlay panel
that slides in from the left (same mechanic as the right concept panel).
Add 3 new API sources (Harvard, Smithsonian, Pexels) and wire all 9 into fetchAll().

---

## Phases

### Phase 1 — CSS
**File:** `index.html` `<style>` block

Add:
- `#keys-panel` — full-height overlay, positioned absolute left:0 over sidebar,
  `transform: translateX(-100%)` default, `translateX(0)` when `.open`
  `transition: transform 0.4s ease`
- `.keys-panel-header` — flex row, logo-style title + close button
- `.keys-panel-subheader` — DM Mono 10px ink-3
- `.key-source-row` — flex column block per API source
- `.key-source-top` — flex row: name | badge | get-key link
- `.key-source-desc` — DM Mono 10px ink-3
- `.key-status-badge` — inline pill, two states:
  - `.badge-active` → green tint bg `rgba(60,140,60,0.15)`, text `✓ active`, color `#3c8c3c`
  - `.badge-inactive` → var(--line) bg, text `not set`, color var(--ink-3)
- `.key-source-input-row` — flex row: password input + confirm button, hidden by default
- `.key-source-input-row.visible` — display flex
- `.btn-keys` — same as `.btn`, full width, text "api keys"
- `.btn-keys-dot` — tiny 5px circle indicator (accent color) shown when `≥1` optional key set
- New source badge tints: `.badge-harvard`, `.badge-smithsonian`, `.badge-pexels`

Remove: Old `#api-keys-section`, `.key-row`, `.key-input-wrap`, `.key-input`, `.key-help`, `.nasa-note`

---

### Phase 2 — HTML
**File:** `index.html` `<body>`

1. **Remove** entire `<div id="api-keys-section">` block from sidebar.
2. **Add** at bottom of `#sidebar` (after spacer):
   ```html
   <button class="btn btn-keys" id="btn-keys">
     api keys<span class="btn-keys-dot" id="keys-dot" style="display:none;"></span>
   </button>
   ```
3. **Add** before `</div><!--/#app-->`:
   ```html
   <div id="keys-panel">
     <!-- header -->
     <div class="keys-panel-header">
       <span class="logo" style="font-style:italic;">api keys</span>
       <button class="panel-close" id="keys-panel-close">×</button>
     </div>
     <div class="keys-panel-subheader">paste once, saved forever</div>
     <div class="divider" style="margin:12px 0;"></div>
     <!-- rows for each of 10 sources injected by JS -->
     <div id="keys-rows-container"></div>
     <!-- footer -->
     <div class="keys-panel-footer">
       keys stored locally in your browser — never sent anywhere except their respective APIs
     </div>
   </div>
   ```

---

### Phase 3 — STATE + INIT + Slider
**File:** `index.html` `<script>`

1. Add to `STATE` object:
   ```js
   harvardKey:     null,
   smithsonianKey: null,
   pexelsKey:      null,
   ```

2. Extend localStorage init block (after existing 3 keys):
   ```js
   STATE.harvardKey     = localStorage.getItem('inspo_harvard_key')     || null;
   STATE.smithsonianKey = localStorage.getItem('inspo_smithsonian_key') || null;
   STATE.pexelsKey      = localStorage.getItem('inspo_pexels_key')      || null;
   ```

3. Slider: change `max="72"` → `max="90"`, `value="24"` stays.
   Change `CONSTANTS.IMAGE_COUNT_MAX` from 48 → 90.

---

### Phase 4 — New Fetch Functions
**File:** `index.html` after `fetchEuropeana()`

Add three functions verbatim from spec:
- `fetchHarvard(keyword, limit, signal)`
- `fetchSmithsonian(keyword, limit, signal)`
- `fetchPexels(keyword, limit, signal)`

---

### Phase 5 — fetchAll() Rewrite
**File:** `index.html` — replace existing `fetchAll()`

```js
async function fetchAll(keywords, totalCount) {
  if (STATE.abortController) STATE.abortController.abort();
  STATE.abortController = new AbortController();
  const signal = STATE.abortController.signal;

  const optionalActive = [
    STATE.rijksKey, STATE.europeanaKey,
    STATE.harvardKey, STATE.smithsonianKey, STATE.pexelsKey
  ].filter(Boolean).length;
  const activeSourceCount = 4 + optionalActive; // 4 always-on
  const perSource = Math.ceil(totalCount / activeSourceCount);
  const keyword   = keywords[0];
  const altKeywords = keywords.slice(1);

  const [wiki, met, archive, nasa, rijks, euro, harvard, si, pexels] =
    await Promise.allSettled([
      fetchWikimedia(keyword,              perSource + 5, signal),
      fetchMet(keywords.join(' '),         perSource + 5, signal),
      fetchArchive(altKeywords[0] || keyword, perSource + 5, signal),
      fetchNASA(keyword,                   perSource + 5, signal),
      fetchRijksmuseum(keyword,            perSource + 5, signal),
      fetchEuropeana(keyword,              perSource + 5, signal),
      fetchHarvard(keyword,                perSource + 5, signal),
      fetchSmithsonian(keyword,            perSource + 5, signal),
      fetchPexels(keyword,                 perSource + 5, signal),
    ]);

  return [wiki, met, archive, nasa, rijks, euro, harvard, si, pexels]
    .map(r => r.status === 'fulfilled' ? r.value : []);
}
```

Also update `runSearch()` destructuring from 3 to 9 results and interleave all.

---

### Phase 6 — renderGrid Badge Map
**File:** `index.html` — `renderGrid()` function

Add to source→badge and source→label maps:
```js
harvard:     'harvard',
smithsonian: 'si',
pexels:      'pexels',
```

---

### Phase 7 — Keys Panel JS
**File:** `index.html`

Replace old Gemini/Rijks/Europeana button wiring with a unified keys panel system.

Data-driven config array (10 entries, see spec).
JS renders rows into `#keys-rows-container` on DOMContentLoaded.

Per-row logic:
- Click on row body → toggle `.key-source-input-row.visible`
- Enter on input → `localStorage.setItem(storageKey, val)` + `STATE[stateKey] = val`
  + update badge to active + collapse input + `updateKeysDot()`
- Click on active badge → confirm "clear key?" → remove from localStorage,
  set `STATE[stateKey] = null`, reset badge + `updateKeysDot()`

`updateKeysDot()`:
- Check if any of the 6 optional keys is set in STATE
- Show/hide `#keys-dot`

`#btn-keys` click → toggle `#keys-panel.open`
`#keys-panel-close` click → remove `.open`

Remove: all old `btn-gemini`, `btn-rijks`, `btn-europeana` wiring blocks
Remove: old `renderAiSection` references to `btn-gemini` text changes
Update: Gemini key references in analyzeWithGemini to still read `STATE.geminiKey`
        (the key name and STATE key don't change — only where it's set from changes)

---

## Source Config Reference

| # | Name             | Storage key              | STATE key       | Always on | Get-key URL |
|---|-----------------|--------------------------|-----------------|-----------|-------------|
| 1 | NASA             | —                        | —               | ✓         | — |
| 2 | The Met          | —                        | —               | ✓         | — |
| 3 | Wikimedia        | —                        | —               | ✓         | — |
| 4 | Internet Archive | —                        | —               | ✓         | — |
| 5 | Rijksmuseum      | inspo_rijks_key          | rijksKey        |           | https://data.rijksmuseum.nl/object-metadata/api |
| 6 | Europeana        | inspo_europeana_key      | europeanaKey    |           | https://pro.europeana.eu/pages/get-api |
| 7 | Harvard          | inspo_harvard_key        | harvardKey      |           | https://forms.gle/apBabyNeWuHMoM5x6 |
| 8 | Smithsonian      | inspo_smithsonian_key    | smithsonianKey  |           | https://api.data.gov/signup |
| 9 | Pexels           | inspo_pexels_key         | pexelsKey       |           | https://www.pexels.com/api |
|10 | Gemini Vision    | inspo_gemini_key         | geminiKey       |           | https://aistudio.google.com |

---

## What Stays Unchanged
- All existing fetch functions (Wikimedia, Met, Archive, NASA, Rijks, Europeana)
- All Phase 3–6 logic (selection, panel, sketch, board, 3D)
- Gemini analyzeWithGemini() — reads STATE.geminiKey unchanged
- CSS variables, font stack, no border-radius rule, hairline borders
