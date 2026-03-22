# INSPOSEARCH — Master Build Prompt
# Paste this entire prompt into Claude Sonnet 4.6

---

You are a senior full-stack engineer and product designer building a complete, production-ready single-page application called **INSPOSEARCH** — a visual inspiration engine for artists and designers.

---

## IDENTITY & PHILOSOPHY

INSPOSEARCH is a tool for creatives who think visually. It is not a search engine. It is a thinking tool — a place to gather images, extract concepts, build moodboards, and explore ideas spatially.

**Users**: Illustrators, fashion designers, art directors, architects, photographers.
**Their need**: Find unexpected visual connections. Move fast. Stay in flow.

---

## DESIGN MANDATE — NON-NEGOTIABLE

**Aesthetic**: Refined editorial minimalism. Think _032c_, _Cactus_, _AnOther Magazine_ digital.

**Rules**:
- Background: near-white `#F7F5F2` (light) / near-black `#0E0E0D` (dark)
- Accent: single warm ink color `#1A1A18` with one highlight `#C8B89A` (warm sand)
- Typography: `DM Mono` for UI labels + `Cormorant Garamond` for headings — import both from Google Fonts
- Zero rounded corners except image thumbnails (4px only)
- No gradients. No shadows. No borders except 1px `rgba(0,0,0,0.08)` hairlines
- Spacing system: 4px base unit, use multiples of 4
- Hover states: opacity transitions only (0.4s ease), no color changes
- Animations: slow, deliberate fades (300–500ms). Nothing bounces.
- The interface must feel like a blank studio wall — images do all the visual work

**Layout**: Three-panel structure:
- Left sidebar (240px): search + controls
- Center canvas (flex-grow): image grid / moodboard / 3D view
- Right panel (280px, slides in): concept expansion + selected image details

**Dark mode**: Full support via `prefers-color-scheme` + manual toggle

---

## TECH STACK

- **Vanilla HTML + CSS + JS** — single `index.html` file, zero build step
- **Three.js** via CDN for 3D view
- **No frameworks, no npm, no build tools**
- Must open by dragging `index.html` into a browser — that's it
- Must also work when deployed to Netlify Drop (drag folder → get link)

---

## FEATURE SPECIFICATION

### 1. SEARCH INPUT
- Single text input, full-width, minimal styling
- On submit: expand query using the **Datamuse API** (free, unlimited)
  - Fetch: `https://api.datamuse.com/words?rel_trg={keyword}&max=8` (triggered by)
  - Fetch: `https://api.datamuse.com/words?ml={keyword}&max=8` (means like)
  - Merge results into an expanded keyword set
- Also apply a hardcoded **seed association map** for art/design terms:
```js
const SEED_MAP = {
  brutalism: ["concrete","monolithic","raw","void","weight"],
  fashion: ["silhouette","drape","texture","body","volume"],
  nature: ["organic","erosion","growth","decay","light"],
  minimal: ["reduction","negative space","restraint","grid","white"],
  dark: ["shadow","depth","contrast","absence","night"],
  color: ["pigment","saturation","hue","spectrum","dye"],
  architecture: ["structure","facade","material","threshold","proportion"],
  portrait: ["gaze","skin","expression","identity","presence"],
  abstract: ["form","gesture","mark","field","tension"],
  vintage: ["patina","grain","fade","archive","memory"]
}
```
- Show expanded tags as small pills below the search bar (clickable to remove)

### 2. IMAGE SOURCES — fetch in parallel

**Source A: Wikimedia Commons** (primary, unlimited)
```
https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={keyword}&srnamespace=6&srlimit=20&format=json&origin=*
```
Then fetch image URLs:
```
https://commons.wikimedia.org/w/api.php?action=query&titles={title}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*
```
Filter: only jpg/png, skip files with "svg" or "diagram" in name.

**Source B: The Met Museum** (art/history, unlimited)
```
https://collectionapi.metmuseum.org/public/collection/v1/search?q={keyword}&hasImages=true
```
Then fetch object details for first 15 IDs:
```
https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}
```
Use `primaryImageSmall` as thumbnail.

**Source C: Internet Archive** (historical photos, unlimited)
```
https://archive.org/advancedsearch.php?q={keyword}+AND+mediatype:image&fl[]=identifier,title,description&rows=10&output=json
```
Thumbnail URL pattern: `https://archive.org/services/img/{identifier}`

**Anti-AI filter** (apply to all sources):
```js
function isLikelyReal(item) {
  const banned = ["midjourney","stable diffusion","dall-e","ai generated","artificial","deepfake","neural"];
  const text = (item.title + item.description + item.filename).toLowerCase();
  return !banned.some(b => text.includes(b));
}
```

### 3. IMAGE COUNT SLIDER
- Range: 6 → 48 images
- Default: 18
- Live update on drag (debounce 200ms)
- Distribute evenly across sources (e.g. at 18: 8 Wikimedia + 6 Met + 4 Archive)

### 4. IMAGE GRID (default view)
- CSS Grid: `auto-fill`, `minmax(200px, 1fr)`, gap 2px
- Lazy load via `loading="lazy"` on all `<img>`
- On image load: fade in from opacity 0 over 400ms
- Show source badge on hover (bottom-left, tiny): "MET" / "WIKI" / "ARCHIVE"
- On click: select image (adds to selection, highlights with 2px sand accent border)
- Multi-select supported (click multiple)

### 5. SKETCH MODE TOGGLE
- Toggle button in left sidebar
- When ON: apply CSS filter to all images:
  `filter: grayscale(1) contrast(1.4) brightness(1.1);`
- Transition: 500ms ease
- Label changes: "SKETCH" (on) / "COLOR" (off)

### 6. CONCEPT EXPANSION PANEL (right panel)
Triggers when one or more images are selected.

**Color extraction** (Canvas API):
```js
function getDominantColors(imgEl, count = 5) {
  const canvas = document.createElement('canvas');
  canvas.width = 50; canvas.height = 50;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, 50, 50);
  const data = ctx.getImageData(0, 0, 50, 50).data;
  // Sample every 4th pixel, group into buckets of 32
  const buckets = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i+1] / 32) * 32;
    const b = Math.round(data[i+2] / 32) * 32;
    const key = `${r},${g},${b}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets)
    .sort((a,b) => b[1]-a[1])
    .slice(0, count)
    .map(([key]) => `rgb(${key})`);
}
```
Display as 5 color swatches (30px × 30px squares, no border-radius).

**Tag extraction**:
- Pull from: image title, alt text, source metadata description
- Clean: lowercase, remove stopwords, deduplicate
- Show as clickable pills — clicking a tag runs a new search

**Related searches** (via Datamuse):
- For each extracted tag, fetch 3 associations
- Deduplicate, show top 8 as "→ explore" links
- Example output for "brutalist coat":
  - → concrete texture
  - → architectural silhouette  
  - → cold minimalism
  - → raw material
  - → monumental form

**Source info**: Show title, source name, year (if available), link to original.

### 7. MOODBOARD VIEW
- Toggle button: "GRID" / "BOARD" / "3D" (three view modes)
- In BOARD mode:
  - Selected images become draggable cards on a canvas
  - Free positioning (mouse drag)
  - Images keep their aspect ratio, default size 200px wide
  - Resize handle (bottom-right corner drag)
  - Double-click image: shows concept panel for that image
  - "EXPORT PNG" button: uses `html2canvas` via CDN to capture the board
    ```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    ```
  - Export filename: `insposearch-board-{timestamp}.png`

### 8. 3D VIEW (Three.js)
- Toggle to "3D" mode
- Each selected image = a flat plane (PlaneGeometry) in 3D space
- Position algorithm:
  ```js
  // Group by shared tags → cluster nearby
  // Images with 2+ shared tags: place within 3 units of each other
  // Images with 0 shared tags: random position on sphere of radius 8
  function getPosition(image, allImages) {
    const shared = allImages.filter(other =>
      other.tags.some(t => image.tags.includes(t))
    ).length;
    const angle = Math.random() * Math.PI * 2;
    const radius = shared > 1 ? 2 + Math.random() * 2 : 6 + Math.random() * 3;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 4,
      Math.sin(angle) * radius
    );
  }
  ```
- Controls: OrbitControls — rotate (drag), zoom (scroll), pan (right-drag)
  - Import: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`
- On hover: image brightens (emissive intensity 0.3)
- On click: opens concept panel for that image
- Background: same as app background (#F7F5F2 or #0E0E0D)
- No grid, no axes, no helpers — clean void

### 9. OPTIONAL AI VISION (Gemini)
- Small "AI KEY" button in left sidebar footer
- Click → inline input appears: "Paste Gemini API key"
- Key stored in `sessionStorage` only (never persisted)
- When key present:
  - On image select, call Gemini 2.5 Flash vision:
  ```js
  async function analyzeWithGemini(imageUrl, apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "List 8 visual and conceptual tags for this image. Focus on: mood, texture, color palette name, era, style, emotion, material, and composition. Return only a JSON array of strings. No other text." },
              { inline_data: { mime_type: "image/jpeg", data: await urlToBase64(imageUrl) } }
            ]
          }]
        })
      }
    );
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }
  ```
  - AI tags shown with a small "✦ AI" label to distinguish from metadata tags
  - If no key: use metadata tags only (works great without AI)

### 10. CULTURAL DIVERSITY
- Shuffle results before display using Fisher-Yates
- When all 3 sources return results, interleave: Wikimedia[0], Met[0], Archive[0], Wikimedia[1]...
- This naturally mixes Western museum art, global photography, historical archives

---

## ERROR HANDLING

- Each API call wrapped in try/catch
- If a source fails: silently skip it, show results from others
- If image fails to load: hide it (no broken image icons)
  ```js
  img.onerror = () => img.parentElement.remove();
  ```
- If no results: show message "nothing found — try different words" in center of grid
- Rate limit detection: if fetch returns 429, wait 2s and retry once

---

## PERFORMANCE

- Never fetch more than 48 images total
- Lazy load all images (`loading="lazy"`)
- Cache last 5 searches in `sessionStorage`:
  ```js
  const cacheKey = `inspo_${keywords.join('_')}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  // ...after fetch:
  sessionStorage.setItem(cacheKey, JSON.stringify(results));
  ```
- Abort previous fetch if new search starts: use `AbortController`
- Three.js scene: dispose textures when leaving 3D view

---

## FILE STRUCTURE

Output a single `index.html` file containing:
1. `<head>`: Google Fonts import (DM Mono + Cormorant Garamond), Three.js CDN, html2canvas CDN, all CSS in `<style>`
2. `<body>`: Full HTML structure
3. `<script>`: All JavaScript inline

No external files. No build step. One file.

---

## UI COPY & LABELS

Use sparse, lowercase labels throughout:
- "search" (not "Search Images")
- "sketch" / "color"
- "grid" / "board" / "3d"
- "expand" (for concept panel)
- "export"
- "clear"
- Source badges: "met" / "wiki" / "archive"
- "→ explore [tag]"
- "✦ ai" (for AI-tagged items)
- "no key — add gemini key for vision"

---

## WHAT SUCCESS LOOKS LIKE

When complete, a user should be able to:
1. Type "brutalism" → see 18 real images from 3 sources in 2 seconds
2. Click 3 images → see their shared colors, tags, and 8 concept expansions on the right
3. Toggle sketch mode → all images go editorial black & white instantly
4. Switch to Board → drag images freely, resize, export as PNG
5. Switch to 3D → orbit through a constellation of images grouped by concept
6. Optionally paste a Gemini key → get richer AI tags on any image
7. Share the `index.html` file with a friend → it works immediately, no setup

---

## DELIVERABLE

Produce the complete, working `index.html` file.
The file must work by opening it locally in any modern browser.
No installation. No server. No API keys required to start.

Start building immediately. No questions, no confirmation needed.
