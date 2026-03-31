# ARCHITECTURE.md — InpoSearch

## Overview

Single file application. Everything lives in `index.html`. No build step, no bundler, no node_modules. Opens in browser by double-click. Deploys by drag to Netlify.

```
index.html
  └── <head>
        ├── Google Fonts (DM Mono + Cormorant Garamond)
        ├── Three.js CDN
        ├── html2canvas CDN
        └── <style> (all CSS)
  └── <body>
        ├── #sidebar (240px fixed left)
        ├── #canvas (flex-grow center)
        └── #panel (280px slides in from right)
  └── <script> (all JS, bottom of body)
```

---

## Module Structure (all in one <script> block, in this order)

```
1. CONSTANTS & CONFIG
2. STATE
3. SEED_MAP (association dictionary)
4. API MODULE
5. IMAGE PROCESSING MODULE
6. SEARCH ENGINE
7. RENDER ENGINE
8. VIEW CONTROLLERS (grid / board / 3d)
9. PANEL CONTROLLER
10. EVENT LISTENERS
11. INIT
```

---

## State Shape

One global state object. Never use separate global variables.

```js
const STATE = {
  query: '',                  // current search string
  keywords: [],               // expanded keyword array
  results: [],                // all fetched ImageItem[]
  selected: [],               // selected ImageItem[]
  view: 'grid',               // 'grid' | 'board' | '3d'
  sketchMode: false,          // boolean
  imageCount: 18,             // slider value
  geminiKey: null,            // string | null (sessionStorage)
  loading: false,             // boolean
  abortController: null,      // AbortController | null
};
```

---

## Data Model — ImageItem

Every image from every source is normalized to this shape before use:

```js
{
  id: string,           // unique — use source prefix + original id e.g. "wiki_123"
  url: string,          // direct image URL (jpg/png)
  thumb: string,        // same as url (sources handle sizing via URL params where possible)
  title: string,
  description: string,
  source: 'wikimedia' | 'met' | 'archive',
  sourceUrl: string,    // link to original page
  year: string | null,
  tags: string[],       // extracted from title + description, lowercase, deduplicated
  colors: string[],     // rgb() strings, populated after canvas extraction
  aiTags: string[],     // populated only if Gemini key present
}
```

---

## Data Flow

```
User types query
  → searchEngine.expand(query)          // Datamuse + SEED_MAP
  → api.fetchAll(keywords, count)       // parallel fetch all 3 sources
      → api.fetchWikimedia(kw, n)
      → api.fetchMet(kw, n)
      → api.fetchArchive(kw, n)
  → normalize each result → ImageItem
  → filter(isLikelyReal)
  → interleave(wikimedia[], met[], archive[])
  → shuffle(Fisher-Yates)
  → STATE.results = final array
  → renderEngine.renderGrid(STATE.results)

User clicks image
  → STATE.selected.push(item)
  → imageProcessing.extractColors(item)  // canvas API
  → panel.open(STATE.selected)
  → panel.renderTags(item)
  → panel.renderRelated(item.tags)       // Datamuse calls
  → if STATE.geminiKey: api.analyzeGemini(item)

User switches view
  → viewController.switch(view)
  → if '3d': threeController.init(STATE.selected)
  → if 'board': boardController.init(STATE.selected)
  → if 'grid': renderEngine.renderGrid(STATE.results)
```

---

## API Module — function signatures

```js
api.fetchWikimedia(keyword, limit)  → Promise<ImageItem[]>
api.fetchMet(keyword, limit)        → Promise<ImageItem[]>
api.fetchArchive(keyword, limit)    → Promise<ImageItem[]>
api.fetchAll(keywords, totalCount)  → Promise<ImageItem[]>
api.expandKeywords(keyword)         → Promise<string[]>   // Datamuse
api.getRelated(tag)                 → Promise<string[]>   // Datamuse
api.analyzeGemini(item, key)        → Promise<string[]>   // returns aiTags
```

---

## View Controllers

### Grid Controller
- Renders STATE.results into #canvas as CSS grid
- Owns: image card HTML, lazy loading, hover badge
- Does NOT own: selection logic (that's Event Listeners)

### Board Controller
- Renders STATE.selected as draggable cards on free canvas
- Owns: drag logic, resize handle, export PNG
- Uses html2canvas for export
- Cards positioned absolutely within #canvas

### Three Controller
- Renders STATE.selected as 3D planes
- Owns: Three.js scene, camera, renderer, OrbitControls
- Destroys and recreates scene on every view switch to 3D
- Disposes all textures on exit

---

## Panel Controller
- Slides in when STATE.selected.length > 0
- Slides out when STATE.selected is empty
- Sections (in order): colors, tags, ai-tags, related searches, source info
- Each section renders independently, can update without re-rendering others

---

## Caching Strategy

```js
// Key pattern: inspo_{keyword1}_{keyword2}
// Storage: sessionStorage only
// Max entries: 5 (evict oldest on overflow)
// Never cache: Gemini responses (privacy)
```

---

## Error Boundaries

- Each API call in its own try/catch — failure of one source never blocks others
- Image load failure: `img.onerror = () => card.remove()`
- Gemini failure: show "AI analysis unavailable" in panel, fall back to metadata tags
- Zero results: render empty state message in #canvas center
- 429 rate limit: wait 2000ms, retry once, then skip source silently

---

## CDN Dependencies (exact versions — do not change)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

Google Fonts import (in <head>, before <style>):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
```

---

## Constraints — never violate these

- No `localStorage` — use `sessionStorage` only
- No external CSS files — all styles in `<style>` in `<head>`
- No external JS files — all logic in `<script>` at bottom of `<body>`
- No `eval()`, no dynamic `<script>` injection
- Gemini key never logged, never sent anywhere except Gemini API
- All fetches use `AbortController` tied to STATE.abortController
- New search always aborts previous fetch before starting
