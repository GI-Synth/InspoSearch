# API_CONTRACTS.md — InpoSearch

## Rules for all API calls

- All fetches pass `STATE.abortController.signal`
- All fetches wrapped in `try/catch` — failure is silent, return `[]`
- Never throw from an API function — always return empty array on error
- Log errors to console only: `console.warn('Source failed:', err.message)`
- Detect 429: `if (res.status === 429) { await sleep(2000); retry once }`

```js
const sleep = ms => new Promise(r => setTimeout(r, ms));
```

---

## 1. Datamuse API — Keyword Expansion

**Purpose**: Expand a single keyword into related concepts for richer search.

**Endpoint A — "triggered by" (conceptual associations)**
```
GET https://api.datamuse.com/words?rel_trg={keyword}&max=8
```

**Endpoint B — "means like" (semantic similarity)**
```
GET https://api.datamuse.com/words?ml={keyword}&max=8
```

**Response shape**:
```json
[
  { "word": "concrete", "score": 2340 },
  { "word": "monolithic", "score": 1876 }
]
```

**What to extract**: `item.word` only. Ignore score.

**Usage**:
```js
async function expandKeywords(keyword) {
  const [trg, ml] = await Promise.allSettled([
    fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(keyword)}&max=8`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(keyword)}&max=8`).then(r => r.json())
  ]);
  const words = [
    ...(trg.status === 'fulfilled' ? trg.value : []),
    ...(ml.status === 'fulfilled' ? ml.value : [])
  ].map(w => w.word);
  const seedExpansions = SEED_MAP[keyword.toLowerCase()] || [];
  return [...new Set([keyword, ...seedExpansions, ...words])].slice(0, 12);
}
```

**Rate limit**: None documented. Treat as unlimited. No auth required.

---

## 2. Datamuse API — Related Tags (for concept panel)

**Purpose**: For a selected image's tag, find conceptually adjacent search terms.

**Endpoint**:
```
GET https://api.datamuse.com/words?rel_trg={tag}&max=5
```
Plus:
```
GET https://api.datamuse.com/words?lc={tag}&max=3
```
(`lc` = likely to follow this word — finds common collocations)

**Response shape**: same as above.

**Usage**: Call once per tag, deduplicate results across all tags, show top 8.

---

## 3. Wikimedia Commons API

**Purpose**: Primary image source. Millions of real photographs, artworks, historical images.

### Step 1 — Search for image titles

```
GET https://commons.wikimedia.org/w/api.php
  ?action=query
  &list=search
  &srsearch={keyword}
  &srnamespace=6
  &srlimit=25
  &format=json
  &origin=*
```

**Response shape**:
```json
{
  "query": {
    "search": [
      {
        "title": "File:Brutalist architecture Berlin.jpg",
        "snippet": "...",
        "pageid": 12345678
      }
    ]
  }
}
```

**What to extract**: `item.title`, `item.pageid`

**Filter before step 2**: Skip titles containing: `".svg"`, `"diagram"`, `"map"`, `"logo"`, `"icon"`, `"chart"`

### Step 2 — Fetch image URLs (batch, up to 10 titles per request)

```
GET https://commons.wikimedia.org/w/api.php
  ?action=query
  &titles={title1}|{title2}|...
  &prop=imageinfo
  &iiprop=url|extmetadata|size
  &iiurlwidth=600
  &format=json
  &origin=*
```

**Response shape**:
```json
{
  "query": {
    "pages": {
      "-1": { ... },
      "12345678": {
        "title": "File:Brutalist architecture Berlin.jpg",
        "imageinfo": [{
          "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../600px-...",
          "descriptionurl": "https://commons.wikimedia.org/wiki/File:...",
          "extmetadata": {
            "ImageDescription": { "value": "A building in Berlin..." },
            "DateTimeOriginal": { "value": "2019-05-12" },
            "Artist": { "value": "John Doe" },
            "LicenseShortName": { "value": "CC BY-SA 4.0" }
          }
        }]
      }
    }
  }
}
```

**What to extract**:
- `imageinfo[0].url` → `item.url` and `item.thumb`
- `imageinfo[0].descriptionurl` → `item.sourceUrl`
- `extmetadata.ImageDescription.value` → `item.description` (strip HTML tags)
- `extmetadata.DateTimeOriginal.value` → `item.year` (first 4 chars)
- `title` → `item.title` (remove "File:" prefix)

**Normalize to ImageItem**:
```js
function normalizeWikimedia(page) {
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  const meta = info.extmetadata || {};
  return {
    id: `wiki_${page.pageid}`,
    url: info.url,
    thumb: info.url,
    title: page.title.replace('File:', '').replace(/\.[^.]+$/, ''),
    description: stripHtml(meta.ImageDescription?.value || ''),
    source: 'wikimedia',
    sourceUrl: info.descriptionurl || '',
    year: (meta.DateTimeOriginal?.value || '').slice(0, 4) || null,
    tags: [],
    colors: [],
    aiTags: [],
  };
}
```

**Skip if**: URL is null, URL ends in `.svg`, URL ends in `.gif`, or `isLikelyReal()` returns false.

---

## 4. The Met Museum API

**Purpose**: High-quality art, photography, decorative objects. Rich metadata.

### Step 1 — Search

```
GET https://collectionapi.metmuseum.org/public/collection/v1/search
  ?q={keyword}
  &hasImages=true
```

**Response shape**:
```json
{
  "total": 342,
  "objectIDs": [12345, 67890, ...]
}
```

**What to extract**: First 20 IDs from `objectIDs` array. If `objectIDs` is null, return `[]`.

### Step 2 — Fetch object details (parallel, max 15)

```
GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}
```

**Response shape**:
```json
{
  "objectID": 12345,
  "title": "Portrait of a Woman",
  "artistDisplayName": "Rembrandt van Rijn",
  "objectDate": "1660",
  "medium": "Oil on canvas",
  "culture": "Dutch",
  "classification": "Paintings",
  "primaryImage": "https://images.metmuseum.org/CRDImages/.../original/...",
  "primaryImageSmall": "https://images.metmuseum.org/CRDImages/.../web-large/...",
  "objectURL": "https://www.metmuseum.org/art/collection/search/12345",
  "tags": [
    { "term": "Women" },
    { "term": "Portraits" }
  ]
}
```

**What to extract**:
- `primaryImageSmall` → `item.url` and `item.thumb` (use small for performance)
- `primaryImage` → fallback if `primaryImageSmall` is empty
- `title` → `item.title`
- `objectURL` → `item.sourceUrl`
- `objectDate` → `item.year` (first 4 numeric chars)
- `artistDisplayName + " — " + medium + " — " + culture` → `item.description`
- `tags[].term` → seed for `item.tags`

**Skip if**: `primaryImageSmall` is empty string, or `isLikelyReal()` returns false.

**Normalize to ImageItem**:
```js
function normalizeMet(obj) {
  const img = obj.primaryImageSmall || obj.primaryImage;
  if (!img) return null;
  return {
    id: `met_${obj.objectID}`,
    url: img,
    thumb: img,
    title: obj.title || 'Untitled',
    description: [obj.artistDisplayName, obj.medium, obj.culture].filter(Boolean).join(' — '),
    source: 'met',
    sourceUrl: obj.objectURL || '',
    year: (obj.objectDate || '').match(/\d{4}/)?.[0] || null,
    tags: (obj.tags || []).map(t => t.term.toLowerCase()),
    colors: [],
    aiTags: [],
  };
}
```

---

## 5. Internet Archive API

**Purpose**: Historical photographs, ephemera, vintage images. Strong for texture/mood searches.

### Search

```
GET https://archive.org/advancedsearch.php
  ?q={keyword}+AND+mediatype:image
  &fl[]=identifier,title,description,date,subject
  &rows=15
  &output=json
```

**Response shape**:
```json
{
  "response": {
    "docs": [
      {
        "identifier": "some-archive-id",
        "title": "Vintage industrial photograph",
        "description": "Factory workers in Detroit, 1930",
        "date": "1930-01-01",
        "subject": ["industry", "labor", "photography"]
      }
    ]
  }
}
```

**Thumbnail URL pattern** (no second fetch needed):
```
https://archive.org/services/img/{identifier}
```

**What to extract**:
- `identifier` → used in ID and thumb URL
- `title` → `item.title`
- `description` → `item.description` (may be array, join with space if so)
- `date` → `item.year` (first 4 chars)
- `subject` → seed for `item.tags` (may be array or string, normalize)

**Normalize to ImageItem**:
```js
function normalizeArchive(doc) {
  const thumb = `https://archive.org/services/img/${doc.identifier}`;
  const desc = Array.isArray(doc.description)
    ? doc.description.join(' ')
    : (doc.description || '');
  const subjects = Array.isArray(doc.subject)
    ? doc.subject
    : (doc.subject ? [doc.subject] : []);
  return {
    id: `archive_${doc.identifier}`,
    url: thumb,
    thumb: thumb,
    title: Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled'),
    description: desc,
    source: 'archive',
    sourceUrl: `https://archive.org/details/${doc.identifier}`,
    year: (doc.date || '').slice(0, 4) || null,
    tags: subjects.map(s => s.toLowerCase()),
    colors: [],
    aiTags: [],
  };
}
```

**Note**: Archive.org thumbnail service sometimes returns a default "no image" graphic. Detect and remove:
```js
// After image loads, check natural dimensions
img.onload = () => {
  if (img.naturalWidth === 1 || img.naturalHeight === 1) card.remove();
  else img.classList.add('loaded');
};
```

---

## 6. Gemini Vision API (optional)

**Endpoint**:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}
```

**Request body**:
```json
{
  "contents": [{
    "parts": [
      {
        "text": "List exactly 8 visual and conceptual tags for this image. Focus on: mood, texture, color palette name, era, style, emotion, material, composition. Return ONLY a valid JSON array of 8 lowercase strings. No explanation, no markdown, no other text."
      },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "{base64EncodedImageData}"
        }
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 100
  }
}
```

**Convert image URL to base64**:
```js
async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}
```

**Response shape**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "[\"melancholic\", \"brutalist\", \"grainy texture\", \"1970s\", \"monochrome\", \"isolation\", \"concrete\", \"geometric\"]"
      }]
    }
  }]
}
```

**Parse response**:
```js
const text = data.candidates[0].content.parts[0].text;
const clean = text.replace(/```json|```/g, '').trim();
const tags = JSON.parse(clean); // string[]
```

**Error handling**:
- If parse fails: return `[]`, show "AI analysis unavailable" in panel
- If 400 (bad key): show "Invalid API key" inline in panel, clear key from sessionStorage
- If 429: show "Rate limit reached, try again in a moment" — do NOT retry automatically
- CORS note: Gemini API supports browser fetch directly — no proxy needed

**Key storage**:
```js
// Save
sessionStorage.setItem('inspo_gemini_key', key);

// Load on init
STATE.geminiKey = sessionStorage.getItem('inspo_gemini_key') || null;

// Clear
sessionStorage.removeItem('inspo_gemini_key');
```

---

## 7. Anti-AI Filter

Applied to all items from all sources before display:

```js
function isLikelyReal(item) {
  const banned = [
    'midjourney', 'stable diffusion', 'dall-e', 'dall e',
    'ai generated', 'ai-generated', 'artificial intelligence generated',
    'deepfake', 'neural network generated', 'stylegan',
    'generative ai', 'text-to-image'
  ];
  const text = `${item.title} ${item.description} ${item.url}`.toLowerCase();
  return !banned.some(b => text.includes(b));
}
```

---

## 8. Tag Extraction from Metadata

Applied to every ImageItem after normalization, before display:

```js
const STOPWORDS = new Set([
  'the','a','an','of','in','on','at','to','for','with','by','from',
  'and','or','but','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'this','that','these','those','it','its','he','she','they',
  'image','photo','photograph','picture','file','view','unknown'
]);

function extractTags(item) {
  const text = `${item.title} ${item.description}`;
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
  const combined = [...new Set([...item.tags, ...words])];
  return combined.slice(0, 12);
}
```

Call `item.tags = extractTags(item)` after normalization.

---

## 9. Interleaving & Shuffle

After all sources return:

```js
function interleave(arrays) {
  const result = [];
  const max = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < max; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Usage:
const interleaved = interleave([wikimediaResults, metResults, archiveResults]);
const final = shuffle(interleaved).slice(0, STATE.imageCount);
```

---

## 10. Fetch Orchestration

```js
async function fetchAll(keywords, totalCount) {
  // Abort previous
  if (STATE.abortController) STATE.abortController.abort();
  STATE.abortController = new AbortController();
  const signal = STATE.abortController.signal;

  const perSource = Math.ceil(totalCount / 3);
  const keyword = keywords[0]; // primary keyword for API calls
  const altKeywords = keywords.slice(1, 4); // for diversity

  const [wiki, met, archive] = await Promise.allSettled([
    fetchWikimedia(keyword, perSource + 5, signal),
    fetchMet(keywords.join(' '), perSource + 5, signal),
    fetchArchive(altKeywords[0] || keyword, perSource + 5, signal),
  ]);

  return [
    wiki.status === 'fulfilled' ? wiki.value : [],
    met.status === 'fulfilled' ? met.value : [],
    archive.status === 'fulfilled' ? archive.value : [],
  ];
}
```

---

## SPEED OPTIMIZATION CONTRACTS

### Progressive Rendering Pattern
fetchAll() must no longer wait for all sources before rendering.
Each source resolves independently and calls renderGrid()
immediately when it returns results.

New pattern:
```js
async function fetchAll(keywords, totalCount, signal) {
  STATE.results = []; // clear before starting
  renderGrid([]); // show empty grid immediately

  const perSource = Math.ceil(totalCount / 9);
  const keyword = keywords[0];
  const alt = keywords[1] || keyword;

  const sources = [
    fetchWikimedia(keyword, perSource + 2, signal),
    fetchMet(keywords.join(' '), perSource + 2, signal),
    fetchArchive(alt, perSource + 2, signal),
    fetchNASA(keyword, perSource + 2, signal),
    fetchRijksmuseum(keyword, perSource + 2, signal),
    fetchEuropeana(keyword, perSource + 2, signal),
    fetchHarvard(keyword, perSource + 2, signal),
    fetchSmithsonian(keyword, perSource + 2, signal),
    fetchPexels(keyword, perSource + 2, signal),
  ];

  // Each source appends results as it lands
  await Promise.allSettled(
    sources.map(promise =>
      promise.then(results => {
        if (signal.aborted) return;
        const fresh = results.filter(isLikelyReal);
        STATE.results = shuffle(
          interleave([STATE.results, fresh])
        ).slice(0, totalCount);
        renderGrid(STATE.results); // re-render on each arrival
      })
    )
  );
}
```

renderGrid() must be idempotent — calling it multiple times
with updated STATE.results only adds new cards, never
re-renders existing ones. Use item.id to check if card
already exists in DOM before appending.

### Source Timeout — 3000ms hard limit
Every fetch function gets its own timeout signal merged
with the global abort signal:

```js
function withTimeout(signal, ms = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  signal.addEventListener('abort', () => {
    clearTimeout(timer);
    controller.abort();
  });
  return controller.signal;
}
```

Usage inside each fetch function:
```js
const s = withTimeout(signal, 3000);
// use s instead of signal for the actual fetch call
```

### Prefetch on Typing (debounced 400ms)
Start fetching while user is still typing.
On every keyup in search input:
- debounce 400ms
- if value length > 2: run expandKeywords only (no render)
- cache the expanded keywords
- when Enter pressed: keywords already expanded,
  skip expansion step, go straight to fetchAll

### Cache Strategy Update
Cache key: first keyword only (not full expanded set)
Cache stores: { results: ImageItem[], keywords: string[] }
On cache hit: render immediately, then re-fetch in background
and silently update if new results differ significantly (>20% new)

---

## NEW SOURCES — NO KEY REQUIRED

### iNaturalist API
Base URL: https://api.inaturalist.org/v1/observations
Parameters:
  q={keyword}
  photos=true
  per_page={limit}
  order=votes (most popular first — better quality)
  license=cc-by,cc-by-nc,cc0 (ensure usable images)

Response shape:
```json
{
  "results": [
    {
      "id": 12345,
      "species_guess": "Red Fox",
      "description": "Observed in forest...",
      "observed_on": "2021-06-15",
      "taxon": {
        "name": "Vulpes vulpes",
        "preferred_common_name": "Red Fox"
      },
      "photos": [
        {
          "url": "https://inaturalist-open-data.s3.amazonaws.com/photos/12345/medium.jpeg"
        }
      ],
      "place_guess": "Oregon, USA",
      "tags": [{ "name": "wildlife" }]
    }
  ]
}
```

Extract:
- url: photos[0].url (replace 'square' with 'medium' if needed)
- title: taxon.preferred_common_name || species_guess
- description: description || place_guess
- year: observed_on.slice(0,4)
- tags: [taxon.preferred_common_name, place_guess].filter(Boolean)
- source: 'inaturalist'
- sourceUrl: https://www.inaturalist.org/observations/{id}

Source badge: badge-inaturalist
Badge color: rgba(40,140,80,0.75)
Badge label: 'nature'

### Library of Congress API
Base URL: https://www.loc.gov/search/
Parameters:
  q={keyword}
  fo=json
  fa=online-format:image
  c={limit} (count)
  sp=1 (page)

Response shape:
```json
{
  "results": [
    {
      "id": "https://www.loc.gov/item/2017123456/",
      "title": "Portrait of a worker, 1935",
      "date": "1935",
      "description": ["Dorothea Lange photograph"],
      "subject": ["labor", "depression"],
      "image_url": ["https://tile.loc.gov/image-services/.../full/pct:25/0/default.jpg"]
    }
  ]
}
```

Extract:
- url: image_url[0] (if array) or image_url
- title: title (may be array — take first)
- description: description[0] or ''
- year: date.slice(0,4)
- tags: subject array, lowercase
- source: 'loc'
- sourceUrl: id (the full URL)

Note: image_url may be nested array [[url]] —
always do:
```js
const img = Array.isArray(item.image_url)
  ? (Array.isArray(item.image_url[0])
      ? item.image_url[0][0]
      : item.image_url[0])
  : item.image_url;
```

Source badge: badge-loc
Badge color: rgba(140,20,20,0.75)
Badge label: 'loc'

### Open Library Covers
Base URL: https://openlibrary.org/search.json
Parameters:
  q={keyword}
  fields=cover_i,title,author_name,subject,first_publish_year
  limit={limit}

Response shape:
```json
{
  "docs": [
    {
      "cover_i": 8739161,
      "title": "The Jungle",
      "author_name": ["Upton Sinclair"],
      "subject": ["labor", "meatpacking"],
      "first_publish_year": 1906
    }
  ]
}
```

Thumb URL pattern:
https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
(M = medium, L = large, S = small)

Skip items where cover_i is null or undefined.

Extract:
- url: https://covers.openlibrary.org/b/id/{cover_i}-L.jpg
- thumb: https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
- title: title
- description: author_name[0] || ''
- year: first_publish_year.toString()
- tags: subject.slice(0,5).map(s => s.toLowerCase())
- source: 'openlibrary'
- sourceUrl: https://openlibrary.org/search?q={title}

Source badge: badge-openlibrary
Badge color: rgba(100,60,160,0.75)
Badge label: 'books'

## BATCH 2 â€” 20 NEW NO-KEY SOURCES

### Standard ImageItem normalization reminder
Every source must return objects matching this exact shape:
```
{
  id: '{prefix}_{uniqueid}',
  url: string,
  thumb: string,
  title: string,
  description: string,
  source: string,
  sourceUrl: string,
  year: string | null,
  tags: string[],
  colors: [],
  aiTags: [],
}
```
All fetch functions follow this contract:
- `async function fetch{Name}(keyword, limit, signal)`
- First line: `const s = withTimeout(signal, 3000);`
- Wrapped in try/catch â€” always return `[]` on error
- Filter with `isLikelyReal()` before returning
- `.slice(0, limit)` before returning

---

### SOURCE B01 â€” Getty Museum
Endpoint:
```
GET https://data.getty.edu/museum/collection/object?q={keyword}&limit={limit}
```
Response shape:
```json
{
  "items": [
    {
      "id": "https://data.getty.edu/museum/collection/object/12345",
      "label": { "en": ["Irises"] },
      "produced_by": { "carried_out_by": [{ "label": { "en": ["Vincent van Gogh"] } }] },
      "timespan": { "begin_of_the_begin": "1889" },
      "subject_of": [{ "digitally_shown_by": [{ "access_point": [{ "id": "https://media.getty.edu/..." }] }] }]
    }
  ]
}
```
Extract:
- id: `'getty_' + item.id.split('/').pop()`
- url: `item.subject_of?.[0]?.digitally_shown_by?.[0]?.access_point?.[0]?.id`
- thumb: same as url
- title: `item.label?.en?.[0] || 'Getty Object'`
- description: `item.produced_by?.carried_out_by?.[0]?.label?.en?.[0] || ''`
- year: `item.timespan?.begin_of_the_begin?.slice(0,4) || null`
- source: `'getty'`
- sourceUrl: `item.id`

Badge: `rgba(180,140,20,0.75)`, label: `'getty'`

---

### SOURCE B02 â€” National Gallery of Art (Washington DC)
Endpoint:
```
GET https://api.nga.gov/art/tms/objects?q={keyword}&hasimages=1&limit={limit}&offset=0
```
Response shape:
```json
{
  "items": [
    {
      "objectId": 12345,
      "title": "Watson and the Shark",
      "people": [{ "displayName": "John Singleton Copley" }],
      "displayDate": "1778",
      "iiifThumbUrl": "https://media.nga.gov/iiif/...",
      "url": "https://www.nga.gov/collection/art-object-page.12345.html"
    }
  ]
}
```
Extract:
- id: `'nga_' + item.objectId`
- url: `item.iiifThumbUrl` (replace `/thumb/` with `/full/` for larger)
- thumb: `item.iiifThumbUrl`
- title: `item.title`
- description: `item.people?.[0]?.displayName || ''`
- year: `(item.displayDate || '').match(/\d{4}/)?.[0] || null`
- source: `'nga'`
- sourceUrl: `item.url`

Badge: `rgba(20,60,120,0.75)`, label: `'nga'`

---

### SOURCE B03 â€” GBIF (Global Biodiversity)
Endpoint:
```
GET https://api.gbif.org/v1/occurrence/search?q={keyword}&mediaType=StillImage&limit={limit}
```
Response shape:
```json
{
  "results": [
    {
      "key": 12345678,
      "species": "Panthera leo",
      "verbatimScientificName": "Panthera leo",
      "media": [{ "identifier": "https://..." }],
      "eventDate": "2020-05-10",
      "country": "Kenya",
      "gbifID": "12345678"
    }
  ]
}
```
Extract:
- id: `'gbif_' + item.key`
- url: `item.media?.[0]?.identifier`
- thumb: same
- title: `item.species || item.verbatimScientificName || 'Species'`
- description: `item.country || ''`
- year: `(item.eventDate || '').slice(0,4) || null`
- tags: `[item.species, item.country].filter(Boolean).map(t => t.toLowerCase())`
- source: `'gbif'`
- sourceUrl: `` `https://www.gbif.org/occurrence/${item.gbifID}` ``

Badge: `rgba(20,140,60,0.75)`, label: `'gbif'`

---

### SOURCE B04 â€” EOL (Encyclopedia of Life)
Two-step: search then fetch images.

Step 1 search:
```
GET https://eol.org/api/search/1.0.json?q={keyword}&page=1
```
Response: `{ "results": [{ "id": 12345, "title": "Panthera leo" }] }`

Step 2 image fetch (first 5 IDs in parallel):
```
GET https://eol.org/api/pages/1.0/{id}.json?images_per_page=1&details=true
```
Response: `{ "taxonConcept": { "dataObjects": [{ "eolMediaURL": "https://..." }] } }`

Normalize:
- id: `'eol_' + result.id`
- url: `dataObjects[0].eolMediaURL`
- thumb: same
- title: `result.title`
- source: `'eol'`
- sourceUrl: `` `https://eol.org/pages/${result.id}` ``

Badge: `rgba(0,120,80,0.75)`, label: `'eol'`

---

### SOURCE B05 â€” NASA APOD Archive
Endpoint (DEMO_KEY = free, 30 req/hour, no signup):
```
GET https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count={limit}&thumbs=true
```
Response shape:
```json
[
  {
    "date": "2021-06-15",
    "title": "Pillars of Creation",
    "explanation": "...",
    "url": "https://apod.nasa.gov/apod/image/...",
    "hdurl": "https://apod.nasa.gov/apod/image/...",
    "media_type": "image"
  }
]
```
Filter: only items where `media_type === 'image'`

Extract:
- id: `'apod_' + item.date.replace(/-/g,'')`
- url: `item.hdurl || item.url`
- thumb: `item.url`
- title: `item.title`
- description: `item.explanation?.slice(0, 120) || ''`
- year: `item.date?.slice(0,4) || null`
- source: `'apod'`
- sourceUrl: `` `https://apod.nasa.gov/apod/ap${item.date.replace(/-/g,'').slice(2)}.html` ``

Badge: `rgba(10,20,80,0.8)`, label: `'apod'`

---

### SOURCE B06 â€” Gallica (BnF France)
Endpoint:
```
GET https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=dc.type+all+"image"+and+{keyword}&maximumRecords={limit}&startRecord=1&format=json
```
Extract from `records.record[].recordData`:
- id: `'gallica_' + recordData['dc:identifier']?.[0]?.split('/').pop()`
- url: `recordData['dc:identifier']?.[0] + '.thumbnail'`
- thumb: same
- title: `recordData['dc:title']?.[0] || 'Gallica Item'`
- description: `recordData['dc:description']?.[0] || ''`
- year: `recordData['dc:date']?.[0]?.slice(0,4) || null`
- tags: `(recordData['dc:subject'] || []).map(t => t.toLowerCase())`
- source: `'gallica'`
- sourceUrl: `recordData['dc:identifier']?.[0] || ''`

Badge: `rgba(0,80,160,0.75)`, label: `'gallica'`

---

### SOURCE B07 â€” Chronicling America
Endpoint:
```
GET https://chroniclingamerica.loc.gov/search/pages/results/?andtext={keyword}&format=json&rows={limit}
```
Image URL built from `item.id`:
- thumb: `` `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:25/0/default.jpg` ``
- url: same with `pct:50`

Extract:
- id: `'chron_' + item.id.replace(/\//g,'_')`
- title: `item.title + ' â€” ' + item.date?.slice(0,4)`
- description: `item.ocr_eng?.slice(0,100) || ''`
- year: `item.date?.slice(0,4) || null`
- tags: `(item.subject || []).map(s => s.toLowerCase())`
- source: `'chronicling'`
- sourceUrl: `` `https://chroniclingamerica.loc.gov${item.id}` ``

Badge: `rgba(120,20,20,0.75)`, label: `'chronicle'`

---

### SOURCE B08 â€” Openverse
Endpoint (no key for limited use):
```
GET https://api.openverse.org/v1/images/?q={keyword}&license_type=commercial&page_size={limit}
```
Extract:
- id: `'openverse_' + item.id`
- url: `item.url`
- thumb: `item.thumbnail || item.url`
- title: `item.title || 'Openverse Image'`
- description: `item.creator ? 'by ' + item.creator : ''`
- year: `null`
- tags: `(item.tags || []).map(t => t.name?.toLowerCase()).filter(Boolean)`
- source: `'openverse'`
- sourceUrl: `item.foreign_landing_url || item.url`

Badge: `rgba(200,80,0,0.75)`, label: `'openverse'`

---

### SOURCE B09 â€” Trove (National Library of Australia)
Requires free instant key. Store as `inspo_trove_key`.
Endpoint:
```
GET https://api.trove.nla.gov.au/v3/result?q={keyword}&category=picture&encoding=json&n={limit}&key={key}
```
Extract from `response.zone[0].records.work[]`:
- id: `'trove_' + item.id`
- url/thumb: `item.identifier?.find(i => i.type==='thumbnail')?.value || ''`
- title: `item.title`
- description: `item.contributor?.[0] || ''`
- year: `(item.issued || '').slice(0,4) || null`
- source: `'trove'`
- sourceUrl: `item.troveUrl`

Badge: `rgba(0,100,60,0.75)`, label: `'trove'`
Get key: https://trove.nla.gov.au/about/create-something/using-api

---

### SOURCE B10 â€” Digital NZ
Requires free instant key. Store as `inspo_digitalnz_key`.
Endpoint:
```
GET https://api.digitalnz.org/records.json?text={keyword}&and[category][]=Images&per_page={limit}&api_key={key}
```
Extract from `search.results[]`:
- id: `'dnz_' + item.id`
- url/thumb: `item.thumbnail_url`
- title: `item.title`
- description: `item.description || ''`
- year: `item.date?.[0]?.slice(0,4) || null`
- tags: `(item.subject || []).map(s => s.toLowerCase())`
- source: `'digitalnz'`
- sourceUrl: `item.landing_url`

Badge: `rgba(0,60,140,0.75)`, label: `'nz'`
Get key: https://digitalnz.org/developers

---

### SOURCE B11 â€” Biodiversity Heritage Library
Uses public API key (no signup needed):
`apikey=00000000-0000-0000-0000-000000000000`

Step 1 title search:
```
GET https://www.biodiversitylibrary.org/api3?op=GetTitleSearchSimple&title={keyword}&apikey=00000000-0000-0000-0000-000000000000&format=json
```
Step 2 item page metadata (first result's ItemID):
```
GET https://www.biodiversitylibrary.org/api3?op=GetItemMetadata&id={itemID}&pages=true&ocr=false&parts=false&apikey=00000000-0000-0000-0000-000000000000&format=json
```
Image URL pattern:
- url: `` `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/500/500` ``
- thumb: `` `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/200/200` ``

Extract:
- id: `'bhl_' + page.PageID`
- title: `title.FullTitle + ' p.' + page.PageNumber`
- source: `'bhl'`
- sourceUrl: `` `https://www.biodiversitylibrary.org/page/${page.PageID}` ``

Badge: `rgba(60,120,20,0.75)`, label: `'bhl'`

---

### SOURCE B12 â€” Carnegie Museum of Art (CMOA)
Endpoint:
```
GET https://api.collection.carnegieart.org/artworks?search[search]={keyword}&per_page={limit}
```
Extract from `data[]`:
- id: `'cmoa_' + item.id.replace(/[^a-z0-9]/gi,'_')`
- url/thumb: `item.image_url`
- title: `item.title`
- description: `item.artist || ''`
- year: `(item.date || '').match(/\d{4}/)?.[0] || null`
- source: `'carnegie'`
- sourceUrl: `` `https://collection.carnegieart.org/objects/${encodeURIComponent(item.id)}` ``

Badge: `rgba(160,40,40,0.75)`, label: `'carnegie'`

---

### SOURCE B13 â€” Museo Nacional del Prado
JSON endpoint:
```
GET https://www.museodelprado.es/api/v1/artwork?language=en&keyword={keyword}&limit={limit}
```
Extract:
- id: `'prado_' + item.id`
- url: `item.image?.large || item.image?.medium`
- thumb: `item.image?.small || item.image?.medium`
- title: `item.title`
- description: `item.artist?.name || ''`
- year: `(item.date || '').match(/\d{4}/)?.[0] || null`
- source: `'prado'`
- sourceUrl: `` `https://www.museodelprado.es/en/the-collection/art-work/${item.slug || item.id}` ``

Badge: `rgba(140,0,20,0.8)`, label: `'prado'`
Note: wrap in extra try/catch â€” CORS may block, return [] silently.

---

### SOURCE B14 â€” Paris Musees (14 Paris museums)
GraphQL endpoint, POST request, no auth:
```
POST https://apicollections.parismusees.paris.fr/graphql
Content-Type: application/json
```
Extract:
- id: `'paris_' + index`
- url: `entity.field_visuels?.[0]?.entity?.thumbnail?.url`
- title: `entity.title`
- description: `entity.field_auteur || ''`
- year: `(entity.field_datation || '').match(/\d{4}/)?.[0] || null`
- source: `'parismusees'`
- sourceUrl: `'https://www.parismusees.paris.fr'`

Badge: `rgba(0,60,120,0.8)`, label: `'paris'`
Note: CORS may block â€” wrap in extra try/catch, return [] silently.

---

### SOURCE B15 â€” Yale Center for British Art
IIIF-based, no key:
```
GET https://collections.britishart.yale.edu/api/search?q={keyword}&limit={limit}
```
Build image URL from IIIF:
- url: `` `https://images.britishart.yale.edu/iiif/2/${id}/full/!800,800/0/default.jpg` ``
- thumb: same with `!400,400`
where `id = item.id.replace('obj:','')`

Extract:
- id: `'yale_' + item.id.replace('obj:','')`
- title: `item.title`
- description: `item.artist || ''`
- year: `(item.date || '').match(/\d{4}/)?.[0] || null`
- source: `'yale'`
- sourceUrl: `` `https://collections.britishart.yale.edu/catalog/${item.id}` ``

Badge: `rgba(0,40,100,0.8)`, label: `'yale'`

---

### SOURCE B16 â€” Picsum Photos (texture/abstract)
No key, no auth, unlimited:
```
GET https://picsum.photos/v2/list?page={randomPage}&limit={limit}
```
where `randomPage = Math.floor(Math.random() * 30) + 1`

Keyword guard â€” only run if keyword contains texture terms:
```js
const textureKeywords = ['texture','abstract','minimal','surface','light','pattern','grain','void','blur'];
if (!textureKeywords.some(t => keyword.toLowerCase().includes(t))) return [];
```
Extract:
- id: `'picsum_' + item.id`
- url: `` `https://picsum.photos/id/${item.id}/800/600` ``
- thumb: `` `https://picsum.photos/id/${item.id}/400/300` ``
- title: `` `Photo by ${item.author}` ``
- source: `'picsum'`
- sourceUrl: `item.url`

Badge: `rgba(80,80,80,0.6)`, label: `'picsum'`

---

### SOURCE B17 â€” USGS ScienceBase (geological/aerial imagery)
No key required:
```
GET https://www.sciencebase.gov/catalog/items?q={keyword}&filter=tags%3Dimage&format=json&max={limit}
```
Extract from `items[]`:
- id: `'usgs_' + item.id`
- url/thumb: `item.webLinks?.find(l=>l.type==='thumbnail')?.uri || ''`
- title: `item.title`
- description: `item.summary?.slice(0,100) || ''`
- year: `item.dates?.[0]?.dateString?.slice(0,4) || null`
- source: `'usgs'`
- sourceUrl: `item.link?.url || ''`

Badge: `rgba(80,60,20,0.75)`, label: `'usgs'`

---

### SOURCE B18 â€” Europeana Fashion (bonus calls)
No new function. Add two extra calls in `fetchAll()`:
```js
fetchEuropeana(keyword + ' fashion', perSource + 2, signal).then(onSourceResult)
fetchEuropeana(keyword + ' textile costume', perSource + 2, signal).then(onSourceResult)
```
Reuses existing Europeana badge and label.

---

### SOURCE B19 â€” Cooper Hewitt (Smithsonian Design Museum)
Uses hardcoded public demo access token (read-only, no signup):
`access_token=4d47366a4e7f1abe2bd9d882dc86e0b5`
```
GET https://collection.cooperhewitt.org/api/rest/?method=cooperhewitt.search.objects&query={keyword}&has_images=1&per_page={limit}&access_token=4d47366a4e7f1abe2bd9d882dc86e0b5
```
Extract from `objects[]`:
- id: `'ch_' + item.id`
- url: `item.images?.[0]?.b?.url`
- thumb: `item.images?.[0]?.z?.url || item.images?.[0]?.b?.url`
- title: `item.title`
- description: `item.medium || ''`
- year: `(item.date || '').match(/\d{4}/)?.[0] || null`
- source: `'cooperhewitt'`
- sourceUrl: `item.url`

Badge: `rgba(200,60,0,0.75)`, label: `'design'`

---

### SOURCE B20 â€” Wikimedia Featured Images (bonus call)
No new function. Add extra call in `fetchAll()`:
```js
fetchWikimedia('Featured_picture ' + keyword, perSource + 2, signal).then(onSourceResult)
```
Only returns images that passed Wikipedia's strict quality review.
Reuses existing wiki badge and label.

---

## BATCH 3 — 20 NEW NO-KEY SOURCES

All sources follow the standard ImageItem contract.
All fetch functions use `withTimeout(signal, 3000)`.
All wrapped in try/catch returning `[]` on error.
All filtered with `isLikelyReal()` before returning.

---

### SOURCE C01 — Tate Collection (London)
No key. CC0 metadata, open images.
Endpoint:
```
GET https://www.tate.org.uk/api/v1/artworks?q={keyword}&page=1&pageSize={limit}
```
Response shape:
```json
{
  "items": [{
    "id": "artwork123",
    "title": "Rain, Steam and Speed",
    "artist": [{ "name": "J.M.W. Turner" }],
    "dateText": "exhibited 1844",
    "thumbnail": { "url": "https://media.tate.org.uk/art/images/work/..." }
  }]
}
```
Extract:
- id: `'tate_' + item.id`
- url/thumb: `item.thumbnail?.url`
- title: `item.title`
- description: `item.artist?.[0]?.name || ''`
- year: `(item.dateText||'').match(/\d{4}/)?.[0] || null`
- source: `'tate'`
- sourceUrl: `` `https://www.tate.org.uk/art/artworks/${item.id}` ``

Badge: `rgba(0,0,0,0.75)`, label: `'tate'`

---

### SOURCE C02 — Finnish Heritage Agency (Finna.fi)
No key. 10M+ Finnish cultural heritage items.
Endpoint:
```
GET https://api.finna.fi/api/v1/search?lookfor={keyword}&type=AllFields&filter[]=format:0/Image/&limit={limit}&field[]=id,title,summary,images,year,authors,source
```
Response shape:
```json
{
  "records": [{
    "id": "finna:12345",
    "title": "Finnish farmhouse",
    "summary": ["..."],
    "images": ["/Cover/Show?id=finna:12345&index=0&size=large"],
    "year": "1920"
  }]
}
```
Image URL: `'https://finna.fi' + item.images?.[0]`

Extract:
- id: `'finna_' + item.id.replace(/[^a-z0-9]/gi,'_')`
- url/thumb: `'https://finna.fi' + item.images?.[0]`
- title: `Array.isArray(item.title) ? item.title[0] : item.title`
- description: `item.summary?.[0] || ''`
- year: `item.year || null`
- source: `'finna'`
- sourceUrl: `` `https://www.finna.fi/Record/${encodeURIComponent(item.id)}` ``

Badge: `rgba(0,80,160,0.75)`, label: `'finna'`

---

### SOURCE C03 — Swedish National Heritage Board (SOCH)
No key. Swedish cultural heritage open content.
Endpoint:
```
GET http://www.kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage={limit}&startRecord=1&query=itemName%3D{keyword}&recordSchema=json
```
Response shape:
```json
{
  "result": {
    "records": [{
      "record": {
        "itemName": ["Viking artifact"],
        "thumbnailSource": ["https://..."],
        "url": "https://..."
      }
    }]
  }
}
```
Extract:
- id: `'soch_' + index`
- url/thumb: `record.thumbnailSource?.[0]`
- title: `record.itemName?.[0] || 'Swedish Heritage Item'`
- source: `'soch'`
- sourceUrl: `record.url?.[0] || ''`

Badge: `rgba(180,0,0,0.75)`, label: `'sweden'`
Note: wrap in extra CORS try/catch — return `[]` silently.

---

### SOURCE C04 — Joconde (French national museum database, data.culture.gouv.fr)
French national open data portal, no key.
Endpoint:
```
GET https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-joconde-extrait/records?where=search(title,"{keyword}")&limit={limit}&select=ref,title,auteur,datation,domaine,lien
```
Response shape:
```json
{
  "results": [{
    "ref": "000001234",
    "title": "Le déjeuner sur l'herbe",
    "auteur": "Edouard Manet",
    "datation": "1863",
    "domaine": "peinture",
    "lien": "https://..."
  }]
}
```
Image URL pattern: `` `https://www.pop.culture.gouv.fr/medias/cible/${item.ref}.jpg` ``

Extract:
- id: `'joconde_' + item.ref`
- url/thumb: `` `https://www.pop.culture.gouv.fr/medias/cible/${item.ref}.jpg` ``
- title: `item.title || 'French Museum Object'`
- description: `item.auteur || ''`
- year: `(item.datation||'').match(/\d{4}/)?.[0] || null`
- tags: `[item.domaine].filter(Boolean).map(t=>t.toLowerCase())`
- source: `'joconde'`
- sourceUrl: `item.lien || ''`

Badge: `rgba(0,60,120,0.8)`, label: `'orsay'`

---

### SOURCE C05 — Muzeum Narodowe w Warszawie (Polish National Museum)
No key. Open API.
Endpoint:
```
GET https://api.mnw.art.pl/api/v1/objects?search={keyword}&per_page={limit}&has_image=true
```
Response shape:
```json
{
  "data": [{
    "id": 12345,
    "title": "Portrait of a Nobleman",
    "author": "Jan Matejko",
    "dating": "1880",
    "image_url": "https://cyfrowe.mnw.art.pl/..."
  }]
}
```
Extract:
- id: `'mnw_' + item.id`
- url/thumb: `item.image_url`
- title: `item.title`
- description: `item.author || ''`
- year: `(item.dating||'').match(/\d{4}/)?.[0] || null`
- source: `'mnw'`
- sourceUrl: `` `https://cyfrowe.mnw.art.pl/pl/katalog/${item.id}` ``

Badge: `rgba(180,0,40,0.75)`, label: `'warsaw'`

---

### SOURCE C06 — Museum of New Zealand Te Papa
No key. Bicultural Pacific/NZ collection.
Endpoint:
```
GET https://collections.tepapa.govt.nz/search/{keyword}?filters=hasMedia:true&size={limit}&from=0
```
Response shape:
```json
{
  "results": [{
    "id": 12345,
    "title": "Waka taua (war canoe)",
    "primaryMaker": { "title": "Unknown" },
    "productionDates": [{ "verbatim": "1800s" }],
    "media": [{ "previewUrl": "https://..." }]
  }]
}
```
Extract:
- id: `'tepapa_' + item.id`
- url/thumb: `item.media?.[0]?.previewUrl`
- title: `item.title`
- description: `item.primaryMaker?.title || ''`
- year: `(item.productionDates?.[0]?.verbatim||'').match(/\d{4}/)?.[0] || null`
- source: `'tepapa'`
- sourceUrl: `` `https://collections.tepapa.govt.nz/object/${item.id}` ``

Badge: `rgba(0,120,80,0.75)`, label: `'tepapa'`

---

### SOURCE C07 — DPLA (Digital Public Library of America)
Free instant key. Store as `inspo_dpla_key`.
Endpoint:
```
GET https://api.dp.la/v2/items?q={keyword}&api_key={key}&page_size={limit}&fields=id,originalRecord,object,dataProvider,sourceResource
```
Response shape:
```json
{
  "docs": [{
    "id": "abc123",
    "object": "https://...",
    "sourceResource": {
      "title": ["Historical photograph"],
      "description": ["..."],
      "date": { "displayDate": "1920" },
      "subject": [{ "name": "labor" }],
      "contributor": ["New York Public Library"]
    }
  }]
}
```
Extract:
- id: `'dpla_' + item.id`
- url/thumb: `item.object`
- title: `item.sourceResource?.title?.[0] || 'DPLA Item'`
- description: `item.sourceResource?.contributor?.[0] || ''`
- year: `(item.sourceResource?.date?.displayDate||'').slice(0,4) || null`
- tags: `(item.sourceResource?.subject||[]).map(s=>s.name?.toLowerCase()).filter(Boolean)`
- source: `'dpla'`
- sourceUrl: `` `https://dp.la/item/${item.id}` ``

Badge: `rgba(40,100,180,0.75)`, label: `'dpla'`
Get key: https://dp.la/info/developers/codex/policies/terms-of-use/

---

### SOURCE C08 — Artsy API
Free app registration. Store client_id as `inspo_artsy_id`, client_secret as `inspo_artsy_secret`.
Two-step: get xapp token once, cache in `STATE.artsyToken`, then search.

Step 1 (once per session):
```
POST https://api.artsy.net/api/tokens/xapp_token
Body: { client_id: STATE.artsyId, client_secret: STATE.artsySecret }
```
Response: `{ "token": "eyJ..." }`

Step 2 search:
```
GET https://api.artsy.net/api/artworks?q={keyword}&size={limit}
Header: X-Xapp-Token: {token}
```
Response shape:
```json
{
  "_embedded": {
    "artworks": [{
      "id": "andy-warhol-marilyn",
      "title": "Marilyn",
      "date": "1967",
      "_links": {
        "thumbnail": { "href": "https://..." },
        "self": { "href": "https://api.artsy.net/api/artworks/..." }
      }
    }]
  }
}
```
Extract:
- id: `'artsy_' + item.id`
- url/thumb: `item._links?.thumbnail?.href`
- title: `item.title`
- description: `item.date || ''`
- year: `(item.date||'').match(/\d{4}/)?.[0] || null`
- source: `'artsy'`
- sourceUrl: `(item._links?.self?.href||'').replace('api.artsy.net/api','www.artsy.net') || ''`

Badge: `rgba(0,0,0,0.8)`, label: `'artsy'`
Notes:
- Show 2 inputs in keys panel: client_id + client_secret
- `STATE.artsyToken`: runtime only, not persisted to localStorage
- Return `[]` if `!STATE.artsyId || !STATE.artsySecret`

---

### SOURCE C09 — Portable Antiquities Scheme (UK archaeological finds)
No key. British Museum database of UK metal detector finds.
Endpoint:
```
GET https://finds.org.uk/api/search.json?q={keyword}&has_images=1&limit={limit}
```
Response shape:
```json
{
  "hits": [{
    "id": "LON-AB1234",
    "title": "Roman coin",
    "broadperiod": "ROMAN",
    "description": "Silver denarius...",
    "thumbnail": "https://finds.org.uk/images/...",
    "created": "2010-05-01"
  }]
}
```
Extract:
- id: `'pas_' + item.id`
- url/thumb: `item.thumbnail`
- title: `item.title || 'UK Find'`
- description: `(item.broadperiod ? item.broadperiod + ' — ' : '') + (item.description||'').slice(0,80)`
- year: `(item.created||'').slice(0,4) || null`
- tags: `[item.broadperiod?.toLowerCase()].filter(Boolean)`
- source: `'pas'`
- sourceUrl: `` `https://finds.org.uk/database/artefacts/record/id/${item.id}` ``

Badge: `rgba(100,80,20,0.75)`, label: `'finds'`

---

### SOURCE C10 — Science Museum Group (UK)
No key. Technology, science, medicine history.
Endpoint:
```
GET https://collection.sciencemuseumgroup.org.uk/search/objects?q={keyword}&has_image=1&page[number]=1&page[size]={limit}
```
Response shape:
```json
{
  "data": [{
    "id": "co1234",
    "attributes": {
      "summary_title": "Steam engine",
      "description": [{ "value": "..." }],
      "images": [{ "processed": { "medium": { "location": "https://..." } } }]
    },
    "links": { "self": "https://..." }
  }]
}
```
Extract:
- id: `'smg_' + item.id`
- url/thumb: `item.attributes?.images?.[0]?.processed?.medium?.location`
- title: `item.attributes?.summary_title || 'Science Museum Object'`
- description: `item.attributes?.description?.[0]?.value?.slice(0,100) || ''`
- source: `'smg'`
- sourceUrl: `item.links?.self || ''`

Badge: `rgba(20,60,120,0.75)`, label: `'science'`

---

### SOURCE C11 — Auckland War Memorial Museum
No key. New Zealand/Pacific natural history, taonga.
Endpoint:
```
GET https://api.aucklandmuseum.com/id/media/v2/mediaartifact/?q={keyword}&size={limit}
```
Response shape:
```json
{
  "hits": {
    "hits": [{
      "_id": "am_object/123",
      "_source": {
        "dc_title": ["Maori meeting house"],
        "dc_description": ["..."],
        "dc_date": ["1890"],
        "media_id": ["AM123456"]
      }
    }]
  }
}
```
Image URL: `` `https://api.aucklandmuseum.com/id/media/v2/mediaartifact/${media_id[0]}` ``

Extract:
- id: `'auck_' + item._id.replace(/\//g,'_')`
- url/thumb: URL above using `item._source.media_id?.[0]`
- title: `item._source.dc_title?.[0] || 'Auckland Museum Object'`
- description: `item._source.dc_description?.[0]?.slice(0,100) || ''`
- year: `(item._source.dc_date?.[0]||'').slice(0,4) || null`
- source: `'auckland'`
- sourceUrl: `` `https://www.aucklandmuseum.com/collection/${item._id}` ``

Badge: `rgba(0,100,100,0.75)`, label: `'auckland'`

---

### SOURCE C12 — Photogrammar (FSA/OWI Depression photos)
No key. 170,000 photos, Yale + Library of Congress.
Endpoint:
```
GET https://photogrammar.org/api/search?query={keyword}&limit={limit}
```
Response shape:
```json
{
  "photos": [{
    "lc_id": "fsa1234567890",
    "title": "Migrant workers in California",
    "photographer": "Dorothea Lange",
    "year": "1936",
    "county": "Tulare",
    "state": "California"
  }]
}
```
Image URL (LOC IIIF):
- url: `` `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:50/0/default.jpg` ``
- thumb: `` `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:25/0/default.jpg` ``

Extract:
- id: `'fsa_' + item.lc_id`
- title: `item.title`
- description: `[item.photographer, item.county, item.state].filter(Boolean).join(', ')`
- year: `item.year || null`
- tags: `[item.photographer, item.state].filter(Boolean).map(t=>t.toLowerCase())`
- source: `'photogrammar'`
- sourceUrl: `` `https://photogrammar.org/photos/${item.lc_id}` ``

Badge: `rgba(80,60,20,0.8)`, label: `'fsa'`

---

### SOURCE C13 — Wellcome Collection
No key. History of medicine, science, the body.
Endpoint:
```
GET https://api.wellcomecollection.org/catalogue/v2/works?query={keyword}&workType=k&production.dates.from=1500&items.locations.locationType=iiif-image&pageSize={limit}
```
Response shape:
```json
{
  "results": [{
    "id": "abc12345",
    "title": "Anatomy of the human body",
    "contributors": [{ "agent": { "label": "Andreas Vesalius" } }],
    "production": [{ "dates": [{ "label": "1543" }] }],
    "thumbnail": { "url": "https://iiif.wellcomecollection.org/..." }
  }]
}
```
Extract:
- id: `'wellcome_' + item.id`
- url/thumb: `item.thumbnail?.url + '/full/400,/0/default.jpg'`
- title: `item.title`
- description: `item.contributors?.[0]?.agent?.label || ''`
- year: `item.production?.[0]?.dates?.[0]?.label?.match(/\d{4}/)?.[0] || null`
- source: `'wellcome'`
- sourceUrl: `` `https://wellcomecollection.org/works/${item.id}` ``

Badge: `rgba(180,0,80,0.75)`, label: `'wellcome'`

---

### SOURCE C14 — Powerhouse Museum / MAAS Sydney
No key. Design, technology, decorative arts.
Endpoint:
```
GET https://collection.maas.museum/api/search?q={keyword}&has_image=yes&limit={limit}
```
Response shape:
```json
{
  "records": [{
    "id": "85/1547",
    "title": "Powerhouse design object",
    "maker": ["Designer name"],
    "date": "1965",
    "images": [{ "url": "https://..." }]
  }]
}
```
Extract:
- id: `'maas_' + item.id.replace(/\//g,'_')`
- url/thumb: `item.images?.[0]?.url`
- title: `item.title`
- description: `item.maker?.[0] || ''`
- year: `(item.date||'').match(/\d{4}/)?.[0] || null`
- source: `'maas'`
- sourceUrl: `` `https://collection.maas.museum/object/${encodeURIComponent(item.id)}` ``

Badge: `rgba(200,80,0,0.75)`, label: `'maas'`

---

### SOURCE C15 — Statens Museum for Kunst (National Gallery of Denmark)
No key.
Endpoint:
```
GET https://api.smk.dk/api/v1/art/search/?keys={keyword}&has_image=true&offset=0&rows={limit}
```
Response shape:
```json
{
  "items": [{
    "object_number": "KMSsp123",
    "titles": [{ "title": "The Sick Child" }],
    "artist": ["Edvard Munch"],
    "production_date": [{ "period": "1886" }],
    "image_thumbnail": "https://iip.smk.dk/iiif/..."
  }]
}
```
Extract:
- id: `'smk_' + item.object_number`
- url: `(item.image_thumbnail||'').replace('/thumb/','/full/')`
- thumb: `item.image_thumbnail`
- title: `item.titles?.[0]?.title || 'SMK Artwork'`
- description: `item.artist?.[0] || ''`
- year: `item.production_date?.[0]?.period?.match(/\d{4}/)?.[0] || null`
- source: `'smk'`
- sourceUrl: `` `https://open.smk.dk/artwork/image/${item.object_number}` ``

Badge: `rgba(180,40,0,0.75)`, label: `'denmark'`

---

### SOURCE C16 — Museo Thyssen-Bornemisza
No key. Madrid. Impressionism, Expressionism, Renaissance.
Endpoint:
```
GET https://www.museothyssen.org/api/v1/coleccion/obras?search={keyword}&page=1&per_page={limit}
```
Wrap in extra CORS try/catch — return `[]` silently if blocked.

Response shape:
```json
{
  "data": [{
    "id": "570",
    "titulo": "Swaying Dancer",
    "autor": "Edgar Degas",
    "fecha": "c. 1877-1879",
    "imagen_url": "https://..."
  }]
}
```
Extract:
- id: `'thyssen_' + item.id`
- url/thumb: `item.imagen_url`
- title: `item.titulo`
- description: `item.autor || ''`
- year: `(item.fecha||'').match(/\d{4}/)?.[0] || null`
- source: `'thyssen'`
- sourceUrl: `` `https://www.museothyssen.org/coleccion/obras/${item.id}` ``

Badge: `rgba(0,80,40,0.75)`, label: `'thyssen'`

---

### SOURCE C17 — World Digital Library (bonus LOC call)
No new function. Add extra call in `fetchAll()`, mapping source/id:
```js
fetchLOC('wdl ' + keyword, perSource+2, signal)
  .then(r => r.map(i => ({...i, source:'wdl', id:i.id.replace('loc_','wdl_')})))
  .then(onSourceResult('wdl'))
```
Badge: `rgba(100,0,60,0.75)`, label: `'wdl'`

---

### SOURCE C18 — Wikimedia Artwork (bonus extra calls)
No new functions. Add extra calls in `fetchAll()`:
```js
fetchWikimedia('Artwork ' + keyword, perSource+2, signal).then(onSourceResult('wikimedia'))
fetchWikimedia(keyword + ' painting', perSource+2, signal).then(onSourceResult('wikimedia'))
```
Reuses wiki badge and label.

---

### SOURCE C19/C20 — Reserved for future batch
(No contracts defined yet.)

---

## BATCH 4 — 20 NEW SOURCES

All sources follow standard ImageItem contract.
All fetch functions: withTimeout only for CORS-risky sources.
All wrapped in try/catch returning [] on error.
All filtered with isLikelyReal() before returning.

---

### SOURCE D01 — Walters Art Museum
No key. No auth. CORS confirmed.
GET https://api.thewalters.org/v1/objects.json?keyword={keyword}&orderBy=relevance&page=1&pageSize={limit}&apikey=
Note: apikey param left empty — works without key.
Response shape:
{
  "Items": [{
    "ObjectID": 12345,
    "Title": "Madonna and Child",
    "Dated": "ca. 1450",
    "Artist": "Fra Angelico",
    "PrimaryImage": {
      "Sm": "https://art.thewalters.org/images/art/..._Sm.jpg",
      "Lg": "https://art.thewalters.org/images/art/..._Lg.jpg"
    },
    "ResourceURL": "https://art.thewalters.org/detail/12345"
  }]
}
Extract:
- id: 'walters_' + item.ObjectID
- url: item.PrimaryImage?.Lg
- thumb: item.PrimaryImage?.Sm
- title: item.Title || 'Walters Object'
- description: [item.Artist, item.Dated].filter(Boolean).join(' — ')
- year: (item.Dated||'').match(/\d{4}/)?.[0] || null
- source: 'walters'
- sourceUrl: item.ResourceURL || ''
- tags: []
Badge: rgba(120,60,0,0.75), label: 'walters'

---

### SOURCE D02 — Princeton University Art Museum
No key. IIIF. CORS confirmed.
GET https://data.artmuseum.princeton.edu/search?query={keyword}&size={limit}&from=0
Response shape:
{
  "hits": {
    "hits": [{
      "_id": "12345",
      "_source": {
        "title": "Head of a Youth",
        "displaymaker": "Greek",
        "displaydate": "3rd century B.C.",
        "images": [{ "iiifbaseuri": "https://iiif.princeton.edu/loris/..." }],
        "id": 12345
      }
    }]
  }
}
Image URL: item._source.images?.[0]?.iiifbaseuri + '/full/!800,800/0/default.jpg'
Thumb URL: same with /full/!400,400/0/default.jpg
Extract:
- id: 'princeton_' + item._id
- url: built IIIF URL
- thumb: smaller IIIF URL
- title: item._source.title || 'Princeton Object'
- description: item._source.displaymaker || ''
- year: (item._source.displaydate||'').match(/\d{4}/)?.[0] || null
- source: 'princeton'
- sourceUrl: `https://artmuseum.princeton.edu/collections/objects/${item._source.id}`
Badge: rgba(255,140,0,0.75), label: 'princeton'

---

### SOURCE D03 — Wikidata Images (SPARQL)
No key. Wikidata public SPARQL endpoint. No CORS issues.
Uses a SPARQL query to find items with images matching keyword.

SPARQL query (URL-encoded in request):
SELECT ?item ?itemLabel ?image ?date WHERE {
  ?item wdt:P18 ?image.
  ?item rdfs:label ?itemLabel.
  FILTER(LANG(?itemLabel) = "en")
  FILTER(CONTAINS(LCASE(?itemLabel), LCASE("{keyword}")))
  OPTIONAL { ?item wdt:P571 ?date. }
} LIMIT {limit}

Endpoint:
GET https://query.wikidata.org/sparql?query={encodedQuery}&format=json
Headers: { 'Accept': 'application/sparql-results+json' }

Response shape:
{
  "results": {
    "bindings": [{
      "item": { "value": "http://www.wikidata.org/entity/Q12345" },
      "itemLabel": { "value": "Night Watch" },
      "image": { "value": "http://commons.wikimedia.org/wiki/Special:FilePath/Nightwatch.jpg" },
      "date": { "value": "1642-01-01T00:00:00Z" }
    }]
  }
}

Extract:
- id: 'wd_' + binding.item.value.split('/').pop()
- url: binding.image.value.replace('http://','https://')
- thumb: url + '?width=400' (Wikimedia supports width param)
- title: binding.itemLabel.value
- description: ''
- year: binding.date?.value?.slice(0,4) || null
- source: 'wikidata'
- sourceUrl: binding.item.value.replace('http://','https://')
- tags: [binding.itemLabel.value.toLowerCase()]
Badge: rgba(0,90,160,0.75), label: 'wikidata'
Note: Add 'User-Agent': 'InpoSearch/1.0' header to respect
Wikidata bot policy.

---

### SOURCE D04 — NOAA Photo Library
No key. US government. CORS confirmed.
GET https://www.photolib.noaa.gov/api/search?q={keyword}&format=json&rows={limit}&start=0
Response shape:
{
  "response": {
    "docs": [{
      "id": "nssl0001",
      "title": "Lightning strike over Oklahoma",
      "description": "Severe thunderstorm...",
      "photographer": "NOAA/NSSL",
      "date": "1987-06-15",
      "url_thumbnail": "https://www.photolib.noaa.gov/images/nssl/nssl0001_small.jpg",
      "url_full": "https://www.photolib.noaa.gov/images/nssl/nssl0001.jpg"
    }]
  }
}
Extract:
- id: 'noaa_' + item.id
- url: item.url_full
- thumb: item.url_thumbnail
- title: item.title
- description: item.photographer || ''
- year: (item.date||'').slice(0,4) || null
- source: 'noaa'
- sourceUrl: `https://www.photolib.noaa.gov/search?q=${encodeURIComponent(keyword)}`
- tags: []
Badge: rgba(0,60,120,0.8), label: 'noaa'

---

## CROSS-REFERENCE SEARCH SYSTEM

### Overview
Two-tier system triggered when user has 2+ images selected
and presses Enter OR clicks action buttons in floating bar.

### Tier 1 — connect() — pure metadata, always free
Input: STATE.selected (array of ImageItem)
Process:
1. Collect all tags from all selected images
2. Collect all words from titles + descriptions
   (split, lowercase, remove stopwords)
3. Score each term by frequency across selected images
   (term appearing in 3/5 selected images scores higher
   than term appearing in 1/5)
4. Weight tags higher than title words (x2 multiplier)
5. Take top 8 scoring terms
6. Run those 8 terms as parallel searches via fetchAll()
   using existing onSourceResultGlobal() pattern
7. Return results

Frequency scoring algorithm:
function scoreTerms(selectedItems) {
  const scores = {};
  const totalItems = selectedItems.length;
  
  selectedItems.forEach(item => {
    const terms = new Set([
      ...item.tags,
      ...(item.title + ' ' + item.description)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOPWORDS.has(w))
    ]);
    // Tags get double weight
    item.tags.forEach(tag => {
      scores[tag] = (scores[tag] || 0) + 2;
    });
    terms.forEach(term => {
      if (!item.tags.includes(term)) {
        scores[term] = (scores[term] || 0) + 1;
      }
    });
  });
  
  // Normalize by total items
  return Object.entries(scores)
    .map(([term, score]) => ({ term, score: score / totalItems }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(t => t.term);
}

### Tier 2 — interpret() — Gemini metadata analysis
Input: STATE.selected (array of ImageItem)
Process:
1. Build a text description from each selected image:
   "{title} — {description} — tags: {tags.join(', ')}"
2. Send ALL descriptions as ONE text prompt to Gemini
   (NOT images — just text metadata)
   This uses ~200 tokens per call, essentially free
3. Prompt template:
   "You are a visual research assistant for artists and 
   graphic designers. Given these {n} image descriptions, 
   identify the 8 most interesting conceptual themes, 
   moods, or visual territories they collectively point 
   toward. Think beyond the obvious — consider anachronism, 
   cultural tension, material contrasts, historical echoes, 
   cinematic references, art movements. Return ONLY a JSON 
   array of 8 short search terms (2-3 words max each). 
   No explanation, no markdown.
   
   Images:
   {imageDescriptions}"
4. Parse returned JSON array
5. Display terms as ✦ concept pills
6. Run all 8 terms as parallel searches

Gemini call for interpret (text only, not vision):
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}
Body:
{
  "contents": [{
    "parts": [{ "text": "{fullPrompt}" }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 200
  }
}

Note: temperature 0.7 for creative/unexpected results.
No image data sent — pure text prompt.
Costs ~200 tokens per call (essentially free on free tier).

### Floating action bar state
STATE.crossRefMode: null | 'connect' | 'interpret'
STATE.crossRefTerms: [] // the 8 terms used
STATE.referenceImages: [] // pinned reference images

### Reference strip behavior
- Appears when crossRefMode is set
- Shows STATE.referenceImages as small thumbs (60px wide)
- Each thumb has × to remove from reference set
- Ctrl+click on any result image adds it to reference set
  and re-runs the current tier analysis
- "clear all" button resets everything

---

### SOURCE D05 — Hubble Space Telescope
No key. ESA/NASA public feed.
GET https://hubblesite.org/api/v3/external_feed?service=NEWS_IMAGES&page=all
Note: Returns all images — filter by keyword client-side
since the endpoint has no search param.
Cache this response aggressively (changes rarely).

Filter results client-side:
items.filter(item =>
  (item.name + ' ' + item.description)
    .toLowerCase()
    .includes(keyword.toLowerCase())
)

Response shape:
[{
  "id": 12345,
  "name": "Pillars of Creation",
  "description": "Eagle Nebula star formation...",
  "thumbnail_url": "https://hubblesite.org/files/live/sites/hub/files/home/news/story-images/...",
  "news_id": "2015-01"
}]
Extract:
- id: 'hubble_' + item.id
- url: item.thumbnail_url (replace _thumb with nothing for full)
- thumb: item.thumbnail_url
- title: item.name || 'Hubble Image'
- description: (item.description||'').slice(0,100)
- year: item.news_id?.slice(0,4) || null
- source: 'hubble'
- sourceUrl: `https://hubblesite.org/contents/news-releases/${item.news_id}`
- tags: ['space','astronomy','hubble']
Badge: rgba(10,0,60,0.85), label: 'hubble'
Note: Fetch and cache ALL results on first call,
store in STATE.hubbleCache = [].
Subsequent calls use STATE.hubbleCache directly.

---

### SOURCE D06 — Cornell Digital Collections
No key. IIIF. University digital library.
GET https://digital.library.cornell.edu/catalog.json?q={keyword}&f[format][]=Image&per_page={limit}&page=1
Response shape:
{
  "data": [{
    "id": "ss:12345",
    "attributes": {
      "title_tesim": ["Botanical illustration"],
      "creator_tesim": ["John James Audubon"],
      "date_created_tesim": ["1827"],
      "thumbnail_path_ss": "/downloads/ss:12345?file=thumbnail",
      "access_identifier_tesim": ["ss:12345"]
    }
  }]
}
Thumb URL: 'https://digital.library.cornell.edu' + item.attributes.thumbnail_path_ss
Image URL: thumb URL but replace 'thumbnail' with 'large'
Extract:
- id: 'cornell_' + item.id.replace(/[^a-z0-9]/gi,'_')
- url: full image URL
- thumb: thumbnail URL
- title: item.attributes.title_tesim?.[0] || 'Cornell Item'
- description: item.attributes.creator_tesim?.[0] || ''
- year: item.attributes.date_created_tesim?.[0]?.match(/\d{4}/)?.[0] || null
- source: 'cornell'
- sourceUrl: `https://digital.library.cornell.edu/catalog/${item.id}`
Badge: rgba(180,30,30,0.75), label: 'cornell'

---

### SOURCE D07 — Wikimedia MediaSearch (improved)
Better than existing Wikimedia search.
Uses MediaSearch API which ranks by image quality score.
No key. CORS confirmed.
GET https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={keyword}+filetype:bitmap+filemime:image&srnamespace=6&srlimit={limit}&srprop=snippet|titlesnippet|size&format=json&origin=*
Then resolve images same way as existing fetchWikimedia.
Add as extra call in fetchAll() — no new function needed.
Use existing fetchWikimedia() but pass:
keyword + ' filetype:bitmap' as the search term.
Source label: 'wiki' (same as existing — blends in naturally)

---

### SOURCE D08 — Folger Shakespeare Library
No key. Renaissance manuscripts + early prints.
GET https://collections.folger.edu/search?utf8=✓&q={keyword}&format=json
Response: HTML with embedded JSON (parse with regex)
OR use their IIIF endpoint directly:
GET https://collections.folger.edu/search?q={keyword}&per_page={limit}&format=json
Response shape:
{
  "response": {
    "docs": [{
      "id": "Folger:12345",
      "title_display": "Portrait of Queen Elizabeth I",
      "author_display": ["Unknown artist"],
      "pub_date": "1590",
      "thumbnail_path": "https://luna.folger.edu/luna/servlet/..."
    }]
  }
}
Extract:
- id: 'folger_' + item.id.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.thumbnail_path
- title: item.title_display || 'Folger Item'
- description: item.author_display?.[0] || ''
- year: (item.pub_date||'').match(/\d{4}/)?.[0] || null
- source: 'folger'
- sourceUrl: `https://collections.folger.edu/detail/${item.id}`
Badge: rgba(80,40,0,0.8), label: 'folger'
Note: Wrap in extra CORS try/catch — return [] silently.

---

### SOURCE D09 — Austrian National Library (ÖNB)
No key. IIIF. 12M+ objects.
GET https://api.onb.ac.at/api/v1/search?q={keyword}&imageOnly=true&rows={limit}&start=0
Response shape:
{
  "docs": [{
    "id": "ABO_+Z178023508",
    "title": "Österreichische Nationalbibliothek",
    "type": "image",
    "thumbnail": "https://digital.onb.ac.at/RepViewer/...",
    "date": "1900",
    "creator": ["Unknown"]
  }]
}
Extract:
- id: 'onb_' + item.id.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.thumbnail
- title: item.title || 'ÖNB Item'
- description: item.creator?.[0] || ''
- year: (item.date||'').slice(0,4) || null
- source: 'onb'
- sourceUrl: `https://digital.onb.ac.at/search?q=${encodeURIComponent(keyword)}`
Badge: rgba(180,0,60,0.75), label: 'austria'
Note: CORS best-effort — wrap in extra try/catch.

---

### SOURCE D10 — Louvre (via Joconde extended)
No key. Uses same data.culture.gouv.fr endpoint
as existing fetchJoconde() but filtered specifically
to Louvre collection using musee parameter.
No new function needed — add extra fetchAll() call:
fetchJoconde(keyword + ' Louvre', perSource+2, signal)
  .then(results => results.map(r => ({
    ...r,
    id: r.id.replace('joconde_','louvre_'),
    source: 'louvre'
  })))
  .then(onSourceResult('louvre'))
Add badge: rgba(100,80,20,0.8), label: 'louvre'
Add to badge CSS and badge map.

---

### SOURCE D11 — Princeton Index of Medieval Art
No key. Unique iconographic database of medieval art.
GET https://theindex.princeton.edu/search?keyword={keyword}&format=json&limit={limit}
Response shape (if JSON supported):
{
  "results": [{
    "id": "record:12345",
    "title": "Annunciation scene",
    "repository": "Paris, Bibliothèque nationale",
    "date": "ca. 1250",
    "image": "https://theindex.princeton.edu/images/..."
  }]
}
Extract standard fields. Wrap in CORS try/catch.
Badge: rgba(60,0,120,0.75), label: 'medieval'

---

### SOURCE D12 — National Library of Scotland
No key. Historical Scottish photography, maps, manuscripts.
GET https://digital.nls.uk/api/search.cfm?q={keyword}&limit={limit}&format=json
Response shape:
{
  "results": [{
    "id": "74484498",
    "title": "Highland cattle near Loch Lomond",
    "date": "1890",
    "thumbnail": "https://digital.nls.uk/...",
    "permalink": "https://digital.nls.uk/74484498"
  }]
}
Extract standard fields.
Badge: rgba(0,100,60,0.75), label: 'scotland'

---

### SOURCE D13 — New York Public Library Digital
No key for basic search (different from DPLA).
Directly queries NYPL digital collections.
GET https://api.repo.nypl.org/api/v2/items/search?q={keyword}&per_page={limit}&page=1
Headers: X-Authentication-Token not required for public items.
Response shape:
{
  "nyplAPI": {
    "response": {
      "result": [{
        "uuid": "abc123",
        "title": "Broadway at night, 1910",
        "dateStructured": [{ "decade": "1910" }],
        "imageLinks": {
          "imageLink": ["https://images.nypl.org/?id=abc123&t=w"]
        }
      }]
    }
  }
}
Extract:
- id: 'nypl_' + item.uuid
- url: item.imageLinks?.imageLink?.[0]
- thumb: url?.replace('t=w','t=t')
- title: item.title
- year: item.dateStructured?.[0]?.decade || null
- source: 'nypl'
- sourceUrl: `https://digitalcollections.nypl.org/items/${item.uuid}`
Badge: rgba(0,60,120,0.8), label: 'nypl'

---

### SOURCE D14 — Museum of Applied Arts Vienna (MAK)
No key. Austrian design, decorative arts, textiles.
GET https://sammlung.mak.at/api/v1/search?q={keyword}&has_image=true&per_page={limit}
Response shape:
{
  "objects": [{
    "id": "MAK-T_9355",
    "title": "Textile fragment",
    "artist": "Unknown",
    "date": "18th century",
    "image_url": "https://sammlung.mak.at/img/..."
  }]
}
Extract standard fields.
Badge: rgba(0,80,80,0.75), label: 'mak'
Note: CORS best-effort — wrap in extra try/catch.

---

### SOURCE D15 — Rijksmuseum extra call (drawings)
Reuse existing fetchRijksmuseum() but target
drawings and prints specifically for variety.
No new function — add extra fetchAll() call:
fetchRijksmuseum(keyword + ' drawing', perSource+2, signal)
  .then(onSourceResult('rijksmuseum'))
fetchRijksmuseum(keyword + ' print', perSource+2, signal)
  .then(onSourceResult('rijksmuseum'))

---

### SOURCE D16 — Biodiversity Library extra (illustrations)
Reuse existing fetchBHL() targeting illustrated plates.
Add extra call targeting specifically illustrated content:
fetchBHL('illustrated ' + keyword, perSource+2, signal)
  .then(onSourceResult('bhl'))

---

### SOURCE D17 — Flickr Commons (curated institutions)
Reuse existing fetchFlickrCommons() but target
the most reliable Commons institutions specifically:
Add: &user_id=commons (Flickr Commons pool)
This returns only institutional public domain content
from Library of Congress, Smithsonian, NYPL etc on Flickr.
No new function — update existing fetchFlickrCommons
to add &tags=commons to the URL for better quality filter.

---

### SOURCE D18 — Museo Nacional de Antropología Mexico
No key. Pre-Columbian, indigenous Mexican collections.
GET https://mna.inah.gob.mx/api/search?q={keyword}&limit={limit}
Wrap in extra CORS try/catch — return [] silently.
If CORS blocks: silently skip, health tracker deprioritizes.
Badge: rgba(180,80,0,0.8), label: 'mna'

---

### SOURCE D19 — Smithsonian extra call (photography)
Reuse existing fetchSmithsonian() but target
photography specifically using online_media_type + type:
Add extra fetchAll() call with modified keyword:
fetchSmithsonian(keyword + ' photograph', perSource+2, signal)
  .then(onSourceResult('smithsonian'))

---

### SOURCE D20 — Internet Archive extra (visual arts)
Reuse existing fetchArchive() but target
specifically the visual arts collections:
Add extra fetchAll() call:
fetchArchive(keyword + ' visual art', perSource+2, signal)
  .then(onSourceResult('archive'))

---

## GEMINI RATE LIMITING & CACHING

### AI Tags localStorage cache
Key pattern: 'inspo_aitags_{item.id}'
Shape: { tags: string[], timestamp: number }
TTL: 86400000 (24 hours)

Before any analyzeWithGemini() call:
1. Check item.aiTags.length > 0 → skip, use existing
2. Check localStorage for 'inspo_aitags_' + item.id
3. If found and not expired → load tags, skip API call
4. If not found or expired → call API, save result

After successful call:
localStorage.setItem('inspo_aitags_' + item.id, 
  JSON.stringify({ tags, timestamp: Date.now() }))
Also set item.aiTags = tags in STATE.results

### Daily usage counter
Key: 'inspo_gemini_count'
Shape: { count: number, date: string } // date = YYYY-MM-DD
Reset: if stored date !== today's date, reset count to 0
Increment: after every successful Gemini call (vision OR text)
Limit: 1500/day (Gemini 2.5 Flash free tier)
Warning threshold: 1400

### Rate limiting
STATE.lastGeminiCall: number | null
Minimum gap: 2000ms between any Gemini API call
Implementation: check elapsed time, await sleep if needed

### Gemini call types — must remain separate
Type 1 — interpret() — text metadata only
  - Called by: runInterpret() in floating bar
  - Model: gemini-2.5-flash
  - Input: text descriptions of selected images
  - No images, no base64, no inline_data
  - Temperature: 0.7, maxOutputTokens: 200

Type 2 — vision() — image analysis
  - Called by: analyzeWithGemini() in concept panel
  - Model: gemini-2.5-flash  
  - Input: base64 encoded image
  - Temperature: 0.2, maxOutputTokens: 300
  - Only fires on explicit button click

---

## SOURCE TOGGLE SYSTEM

### STATE.disabledSources
Type: Set<string>
Default: new Set() (all sources enabled)
Persistence: localStorage key 'inspo_disabled_sources'
  stored as: JSON.stringify([...STATE.disabledSources])
  loaded as: new Set(JSON.parse(stored) || [])

### callIfHealthy() updated contract
function callIfHealthy(sourceName, fetchPromise):
  1. Check STATE.disabledSources.has(sourceName) → []
  2. Check isSourceHealthy(sourceName) → []
  3. Return fetchPromise

### Source group presets
Each preset defines which sources are ENABLED.
All sources not in the preset are DISABLED.
Stored as named constants in the code.

---

## BATCH 6 — 30 NEW NO-KEY SOURCES

All sources follow standard ImageItem contract.
All wrapped in try/catch returning [] on error.
No withTimeout unless marked CORS-risky.
All filtered with isLikelyReal() before returning.

---

### SOURCE F01 — Fitzwilliam Museum (Cambridge)
No key. 500k+ objects. Paintings, manuscripts, antiquities.
GET https://data.fitzmuseum.cam.ac.uk/api/v1/agents/search?q={keyword}&size={limit}
Primary: artwork search:
GET https://data.fitzmuseum.cam.ac.uk/api/v1/objects/search?q={keyword}&size={limit}
Response:
{
  "hits": {
    "hits": [{
      "_source": {
        "identifier": [{ "value": "M.1-2000" }],
        "title": [{ "value": "The Virgin and Child" }],
        "maker": [{ "displayname": "Raphael" }],
        "lifecycle": { "creation": [{ "date": [{ "value": "1504-1508" }] }] },
        "multimedia": [{ "processed": { "large": { "location": "https://data.fitzmuseum.cam.ac.uk/imagestore/..." } } }]
      }
    }]
  }
}
- id: 'fitzwilliam_' + source.identifier?.[0]?.value?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: source.multimedia?.[0]?.processed?.large?.location
- title: source.title?.[0]?.value || 'Fitzwilliam Object'
- description: source.maker?.[0]?.displayname || ''
- year: source.lifecycle?.creation?.[0]?.date?.[0]?.value?.match(/\d{4}/)?.[0] || null
- source: 'fitzwilliam'
- sourceUrl: `https://fitzmuseum.cam.ac.uk/objects-and-artworks/object/index.html`
Badge: rgba(80,0,40,0.8), label: 'fitzwilliam'

---

### SOURCE F02 — Penn Museum (University of Pennsylvania)
No key. Archaeology, Egypt, Middle East, Mediterranean.
GET https://www.penn.museum/collections/assets/objects/search?q={keyword}&hasimages=1&limit={limit}&format=json
Response:
{
  "items": [{
    "id": "12345",
    "object_name": "Egyptian Shabti",
    "culture": "Egyptian",
    "date_made": "1550-1070 BCE",
    "image_url": "https://www.penn.museum/collections/assets/docs/..."
  }]
}
- id: 'penn_' + item.id
- url/thumb: item.image_url
- title: item.object_name || 'Penn Museum Object'
- description: item.culture || ''
- year: null
- source: 'penn'
- sourceUrl: `https://www.penn.museum/collections/object/${item.id}`
Badge: rgba(0,60,120,0.8), label: 'penn'
Note: CORS best-effort.

---

### SOURCE F03 — ACMI (Australian Centre for Moving Image)
No key. Film, TV, videogame, digital culture objects.
GET https://www.acmi.net.au/api/search/?q={keyword}&size={limit}&type=object
Response:
{
  "objects": {
    "results": [{
      "id": 12345,
      "title": "35mm film camera",
      "creator_credit": "Arriflex",
      "creation_date": "1960s",
      "primary_image": "https://acmi.net.au/media/..."
    }]
  }
}
- id: 'acmi_' + item.id
- url/thumb: item.primary_image
- title: item.title
- description: item.creator_credit || ''
- year: (item.creation_date||'').match(/\d{4}/)?.[0] || null
- source: 'acmi'
- sourceUrl: `https://www.acmi.net.au/works/${item.id}/`
Badge: rgba(0,80,160,0.75), label: 'acmi'

---

### SOURCE F04 — National Maritime Museum Greenwich
No key. Ships, navigation, astronomy, royal history.
GET https://collections.rmg.co.uk/api/v1/objects?q={keyword}&hasImage=true&limit={limit}
Response:
{
  "items": [{
    "id": "OBJ12345",
    "title": "Chronometer by Earnshaw",
    "creator": "Thomas Earnshaw",
    "date": "1795",
    "thumbnail": "https://collections.rmg.co.uk/mediaLib/..."
  }]
}
- id: 'nmm_' + item.id
- url/thumb: item.thumbnail
- title: item.title
- description: item.creator || ''
- year: (item.date||'').match(/\d{4}/)?.[0] || null
- source: 'nmm'
- sourceUrl: `https://collections.rmg.co.uk/collections/objects/${item.id}.html`
Badge: rgba(0,40,80,0.8), label: 'nmm'
Note: CORS best-effort.

---

### SOURCE F05 — Deutsche Digitale Bibliothek (German Digital Library)
No key (metadata CC0). 38M+ objects from German institutions.
GET https://api.deutsche-digitale-bibliothek.de/search?query={keyword}&rows={limit}&oauth_consumer_key=DDBAPI
Note: DDB API recently removed key requirement for basic search.
Response:
{
  "results": {
    "docs": [{
      "id": "abc123",
      "title": "Bauhaus photograph",
      "preview_image": "https://iiif.deutsche-digitale-bibliothek.de/...",
      "institution_name": "Bauhaus-Archiv",
      "first_time_main": "1925"
    }]
  }
}
- id: 'ddb_' + item.id
- url/thumb: item.preview_image
- title: item.title || 'DDB Object'
- description: item.institution_name || ''
- year: (item.first_time_main||'').slice(0,4) || null
- source: 'ddb'
- sourceUrl: `https://www.deutsche-digitale-bibliothek.de/item/${item.id}`
Badge: rgba(0,0,80,0.8), label: 'ddb'
Note: CORS best-effort. May need Accept header.

---

### SOURCE F06 — Finnish National Gallery (Ateneum)
No key. CC0. Ateneum, Kiasma, Sinebrychoff.
GET https://kokoelmat.fng.fi/api/v2/objects?q={keyword}&hasimage=true&limit={limit}
Response:
{
  "data": [{
    "id": "A-IV-3513",
    "title": "Under the Yoke",
    "maker": "Eero Järnefelt",
    "year_from": 1893,
    "image": {
      "url": "https://kokoelmat.fng.fi/app?si=A-IV-3513"
    }
  }]
}
- id: 'fng_' + item.id.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.image?.url
- title: item.title || 'Finnish Gallery Object'
- description: item.maker || ''
- year: item.year_from?.toString() || null
- source: 'fng'
- sourceUrl: `https://kokoelmat.fng.fi/app?si=${item.id}`
Badge: rgba(0,100,140,0.75), label: 'fng'

---

### SOURCE F07 — Brooklyn Museum
Free key (instant, no credit card).
Store as inspo_brooklyn_key.
GET https://www.brooklynmuseum.org/api/v2/object?api_key={key}&q={keyword}&has_images=1&limit={limit}
Response:
{
  "data": [{
    "id": 1234,
    "title": "Sleeping Eros",
    "artist": "Greek",
    "date": "3rd–2nd century BCE",
    "primary_image": "https://d1lfxha3ugu3d4.cloudfront.net/images/..."
  }]
}
- id: 'brooklyn_' + item.id
- url/thumb: item.primary_image
- title: item.title
- description: item.artist || ''
- year: (item.date||'').match(/\d{4}/)?.[0] || null
- source: 'brooklyn'
- sourceUrl: `https://www.brooklynmuseum.org/opencollection/objects/${item.id}`
Badge: rgba(180,60,0,0.8), label: 'brooklyn'
State: STATE.brooklynKey
localStorage: 'inspo_brooklyn_key'
Get key: https://www.brooklynmuseum.org/opencollection/api/

---

### SOURCE F08 — Fortepan (Hungarian Photo Archive)
No key. 120k+ historical photos, CC BY-SA.
GET https://fortepan.hu/api/photos/?q={keyword}&limit={limit}
Response:
{
  "photos": [{
    "id": 12345,
    "year": 1956,
    "description": "Budapest street scene",
    "src": {
      "medium": "https://fortepan.hu/_images/..."
    }
  }]
}
- id: 'fortepan_' + item.id
- url: item.src?.medium?.replace('_m.','_l.')
- thumb: item.src?.medium
- title: item.description || 'Fortepan Photo'
- year: item.year?.toString() || null
- source: 'fortepan'
- sourceUrl: `https://fortepan.hu/?id=${item.id}`
Badge: rgba(60,0,120,0.8), label: 'fortepan'

---

### SOURCE F09 — Open Context (Archaeology)
No key. Field excavation photos, artifact photography.
GET https://opencontext.org/subjects-search/.json?q={keyword}&prop=oc-gen-category--image&rows={limit}
Response:
{
  "oc-api:has-results": [{
    "@id": "https://opencontext.org/subjects/...",
    "label": "Bronze fibula",
    "dc-terms:title": "Artifact from Poggio Civitate",
    "oc-gen:has-thumbnail-uri": "https://opencontext.org/media-thumbs/..."
  }]
}
- id: 'opencontext_' + item['@id'].split('/').pop()
- url/thumb: item['oc-gen:has-thumbnail-uri']
- title: item.label || item['dc-terms:title'] || 'Archaeological Object'
- source: 'opencontext'
- sourceUrl: item['@id']
Badge: rgba(120,80,0,0.75), label: 'archaeology'

---

### SOURCE F10 — Albert-Kahn Archives (Autochrome)
No key. 72,000 autochromes — earliest color photographs.
Early 20th century world. Extraordinary for color reference.
GET https://collections.albert-kahn.hauts-de-seine.fr/api/search?q={keyword}&limit={limit}
Note: French open data portal endpoint.
Alternative direct search:
GET https://opendata.hauts-de-seine.fr/api/explore/v2.1/catalog/datasets/archives-de-la-planete/records?q={keyword}&limit={limit}
Response:
{
  "results": [{
    "identifiant": "A 12345",
    "legende": "Marché en Algérie",
    "date_de_prise_de_vue": "1910",
    "url_de_la_photographie": "https://..."
  }]
}
- id: 'albertkahn_' + item.identifiant?.replace(/\s/g,'_')
- url/thumb: item.url_de_la_photographie
- title: item.legende || 'Albert Kahn Archive'
- year: (item.date_de_prise_de_vue||'').slice(0,4) || null
- source: 'albertkahn'
- sourceUrl: `https://collections.albert-kahn.hauts-de-seine.fr/`
Badge: rgba(140,80,0,0.8), label: 'kahn'

---

### SOURCE F11 — Canadiana Discovery Portal
No key. 65M+ pages from 40 Canadian memory institutions.
GET https://www.canadiana.ca/search?q={keyword}&df=image&pg=1&ps={limit}&fmt=json
Response:
{
  "docs": [{
    "pkey": "oocihm.12345",
    "ti": ["Canadian Pacific Railway Survey"],
    "pu": ["1870"],
    "su": ["railways","photography"],
    "no": ["Image from Library and Archives Canada"],
    "preview": "https://www.canadiana.ca/view/oocihm.12345/preview"
  }]
}
- id: 'canadiana_' + item.pkey?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.preview
- title: (Array.isArray(item.ti) ? item.ti[0] : item.ti) || 'Canadiana Item'
- year: (Array.isArray(item.pu) ? item.pu[0] : item.pu)?.slice(0,4) || null
- tags: Array.isArray(item.su) ? item.su.map(s=>s.toLowerCase()) : []
- source: 'canadiana'
- sourceUrl: `https://www.canadiana.ca/view/${item.pkey}`
Badge: rgba(180,0,20,0.8), label: 'canada'
Note: CORS best-effort.

---

### SOURCE F12 — Natural History Museum London
No key. 80M specimens, insects, dinosaurs, minerals.
GET https://data.nhm.ac.uk/api/3/action/datastore_search?resource_id=05ff2255-c38a-40c9-b657-4ccb55ab2feb&q={keyword}&limit={limit}
Response:
{
  "result": {
    "records": [{
      "catalogNumber": "NHMUK 2014.1234",
      "scientificName": "Tyrannosaurus rex",
      "collectionCode": "PAL",
      "locality": "Montana, USA",
      "associatedMedia": "https://www.nhm.ac.uk/..."
    }]
  }
}
- id: 'nhm_' + item.catalogNumber?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.associatedMedia
- title: item.scientificName || item.catalogNumber || 'NHM Specimen'
- description: item.locality || ''
- source: 'nhm'
- sourceUrl: `https://data.nhm.ac.uk/object/${item.catalogNumber}`
Badge: rgba(0,80,40,0.75), label: 'nhm'

---

### SOURCE F13 — Williams College Museum of Art (WCMA)
No key. CC0. Global art, photography, American masters.
Uses GitHub-hosted data as API:
GET https://raw.githubusercontent.com/wcmaart/collection/master/artworks.json
Client-side filter by keyword (download once, cache).
Same pattern as Hubble/FishWatch.
STATE.wcmaCache: [] — populated on first call
Badge: rgba(60,0,80,0.75), label: 'wcma'
Note: Filter title+classification+period fields by keyword.

---

### SOURCE F14 — Europeana Demo (no-key thumbnail access)
No key. Returns thumbnails directly without API key.
Different from existing fetchEuropeana (which needs key).
GET https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query={keyword}&media=true&rows={limit}
Note: api2demo is Europeana's public demo key — no signup required.
Works for low-volume usage without registration.
Function name: fetchEuropeanaDemo (separate from key-based fetchEuropeana)
Returns [] if STATE.europeanaKey is set (avoid double fetch).
Badge: same badge CSS as europeana (.badge-euro), label: 'euro'

---

### SOURCE F15 — MKG Hamburg (Museum für Kunst und Gewerbe)
No key. 500k+ decorative arts, design, fashion, posters.
GET https://sammlungonline.mkg-hamburg.de/en/search?q={keyword}&hasImage=true&limit={limit}
CORS best-effort.
Badge: rgba(0,60,100,0.8), label: 'mkg'

---

### SOURCE F16 — Portal to Texas History (UNT)
No key. Texas history, photography, maps, newspapers.
GET https://texashistory.unt.edu/search/?q={keyword}&fq=type:image&count={limit}&format=json
Response:
{
  "results": [{
    "ark": "67531/metapth123456",
    "title": "Cattle drive photograph",
    "date": "1890",
    "meta": { "institution": "University of Texas" },
    "thumb": "https://texashistory.unt.edu/67531/metapth123456/thumbnail/"
  }]
}
- id: 'unt_' + item.ark?.replace(/\//g,'_')
- url/thumb: item.thumb
- title: item.title
- year: (item.date||'').slice(0,4) || null
- source: 'unt'
- sourceUrl: `https://texashistory.unt.edu/${item.ark}`
Badge: rgba(180,80,0,0.75), label: 'texas'

---

### SOURCE F17 — QAGOMA (Queensland Art Gallery)
No key. Queensland, Pacific, Asian contemporary art.
GET https://data.qld.gov.au/api/3/action/datastore_search?resource_id=ddb0b1e4-a2a9-4b61-9b41-4be0a9c5a2d1&q={keyword}&limit={limit}
Response:
{
  "result": {
    "records": [{
      "title": "Man's ceremonial cloth",
      "artist": "Unknown artist",
      "date_made": "c.1890",
      "object_id": "2001.069",
      "image_url": "https://www.qagoma.qld.gov.au/..."
    }]
  }
}
- id: 'qagoma_' + item.object_id?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.image_url
- title: item.title
- description: item.artist || ''
- year: (item.date_made||'').match(/\d{4}/)?.[0] || null
- source: 'qagoma'
- sourceUrl: `https://www.qagoma.qld.gov.au/collection`
Badge: rgba(0,120,60,0.75), label: 'qagoma'
Note: CORS best-effort.

---

### SOURCE F18 — Manuscripta Mediaevalia (Medieval Manuscripts)
No key. German medieval manuscripts, illuminations.
GET https://www.manuscripta-mediaevalia.de/api/search?q={keyword}&limit={limit}&format=json
CORS best-effort.
Badge: rgba(100,40,0,0.8), label: 'medieval2'
Note: Different from existing Princeton Medieval — German focus.

---

### SOURCE F19 — OPenn / UPenn Colenda (Special Collections)
No key. High-res manuscripts, CC0.
GET https://colenda.library.upenn.edu/catalog.json?q={keyword}&f[format_facet][]=Image&per_page={limit}
Response: Blacklight/Solr JSON (same structure as fetchCornell).
Extract same way as fetchCornell.
- id: 'upenn_' + item.id
- source: 'upenn'
Badge: rgba(0,0,100,0.8), label: 'upenn'
Note: CORS best-effort.

---

### SOURCE F20 — National Library of Singapore
No key. Singapore, Southeast Asia, colonial photography.
GET https://www.nlb.gov.sg/api/Search/GetResults?keywords={keyword}&type=images&pageNo=1&pageSize={limit}
CORS best-effort.
Badge: rgba(180,0,60,0.75), label: 'singapore'

---

### SOURCE F21 — Balboa Park Commons (San Diego museums)
No key. San Diego natural history, art, science.
GET https://www.balboaparkcommons.org/api/search?q={keyword}&type=object&limit={limit}
Response:
{
  "results": [{
    "ObjectID": 12345,
    "Title": "Blue morpho butterfly specimen",
    "Date": "1920",
    "ImageUrl": "https://www.balboaparkcommons.org/..."
  }]
}
- id: 'balboa_' + item.ObjectID
- url/thumb: item.ImageUrl
- title: item.Title
- year: (item.Date||'').slice(0,4) || null
- source: 'balboa'
- sourceUrl: `https://www.balboaparkcommons.org/objectview/detail/${item.ObjectID}`
Badge: rgba(0,100,120,0.75), label: 'balboa'
Note: CORS best-effort.

---

### SOURCE F22 — UBC Open Collections (University of British Columbia)
No key. IIIF. BC history, indigenous culture, photography.
GET https://open.library.ubc.ca/search/collections?q={keyword}&media=image&rows={limit}&p=1
Response JSON via Solr/Blacklight format.
- id: 'ubc_' + item.id
- url/thumb: IIIF thumbnail from item data
- source: 'ubc'
- sourceUrl: `https://open.library.ubc.ca/collections/...`
Badge: rgba(0,40,100,0.8), label: 'ubc'
Note: CORS best-effort.

---

### SOURCE F23 — Meketre Repository (Ancient Egypt)
No key. Egyptian tomb reliefs, Middle Kingdom paintings.
GET https://www.meketre.org/repository/api/search?q={keyword}&limit={limit}&format=json
CORS best-effort.
Badge: rgba(180,120,0,0.8), label: 'egypt'
Note: Niche but extraordinary for ancient Egyptian visual content.

---

### SOURCE F24 — Reciprocal Research Network (Northwest Coast)
No key. Northwest Coast indigenous artifacts from 8 institutions.
GET https://www.rrnpilot.org/items.json?search={keyword}&limit={limit}
- id: 'rrn_' + item.id
- source: 'rrn'
Badge: rgba(60,100,0,0.75), label: 'rrn'
Note: CORS best-effort.

---

### SOURCE F25 — Huygens Institute (Dutch historical maps + prints)
No key. Dutch Golden Age maps, prints, portraits.
GET https://api.huygens.knaw.nl/v1/search?q={keyword}&type=image&limit={limit}
CORS best-effort.
Badge: rgba(0,80,160,0.75), label: 'huygens'

---

### SOURCE F26 — Newberry Library (Chicago)
No key. Maps, early American history, indigenous documents.
GET https://digcoll.newberry.org/api/search?q={keyword}&type=image&rows={limit}
CORS best-effort.
Badge: rgba(120,0,20,0.8), label: 'newberry'

---

### SOURCE F27 — Museum of London
No key. London archaeology, social history, photography.
GET https://collections.museumoflondon.org.uk/API/v1/search?q={keyword}&hasimage=true&rows={limit}&format=json
Response shape similar to SMG (Science Museum Group).
- id: 'mollondon_' + item.id
- source: 'mollondon'
Badge: rgba(0,60,80,0.8), label: 'london'
Note: CORS best-effort.

---

### SOURCE F28 — Zeri Photo Archive (Italian Art)
No key. 30k Italian Renaissance/Baroque photographs.
SPARQL endpoint:
GET https://data.fondazionezeri.unibo.it/sparql/?query=SELECT+?image+?title+WHERE+{+?s+a+?Image+.+?s+dc:title+?title+.+FILTER(CONTAINS(LCASE(?title),LCASE("{keyword}")))&output=json&limit={limit}
Parse SPARQL JSON results.
Badge: rgba(160,80,0,0.8), label: 'zeri'
Note: CORS best-effort. SPARQL endpoint.

---

### SOURCE F29 — Internet Archive Books (Illustrated)
No key. Illustrated book pages from public domain books.
Different from existing fetchArchive (which searches mediatype:image).
This specifically targets illustrated book interiors.
GET https://archive.org/advancedsearch.php?q={keyword}+AND+mediatype:texts+AND+subject:illustrated&fl[]=identifier,title,description,date&rows={limit}&output=json
Then build cover image URL:
`https://archive.org/services/img/{identifier}`
- id: 'iabooks_' + item.identifier
- source: 'iabooks'
Badge: rgba(40,40,100,0.75), label: 'ia-books'
Note: Different from existing 'archive' source (mediatype:image).

---

### SOURCE F30 — Wikimedia Commons (Extra: Photographs category)
No key. Targets only the high-quality Photographs category.
Reuse fetchWikimedia() with category filter — no new function needed.
Extra call in fetchAll() only:
fetchWikimedia('incategory:Photographs ' + keyword, perSource+2, signal)
  → remapped to source: 'wikimedia' (same badge, same pool)
No new badge CSS or KEY_SOURCES entry required.

---

## BATCH 7 — 30 NEW NO-KEY SOURCES

All sources follow standard ImageItem contract.
All wrapped in try/catch returning [] on error.
All filtered with isLikelyReal() before returning.
CORS-risky sources marked — wrap extra try/catch.

---

### SOURCE G01 — Minneapolis Institute of Art (Mia)
No key. CC0. 50k+ public domain works.
Search:
GET https://search.artsmia.org/?q={keyword}&size={limit}
Response:
{
  "hits": {
    "hits": [{
      "_id": "1234",
      "_source": {
        "title": "Jade Mountain",
        "artist": "Chinese",
        "dated": "18th century",
        "image": "valid",
        "restricted": 0
      }
    }]
  }
}
Image URL pattern: 
`https://api.artsmia.org/images/${id}/large.jpg`
Thumb URL:
`https://api.artsmia.org/images/${id}/medium.jpg`
Filter: only items where source.image === 'valid'
  and source.restricted === 0
- id: 'mia_' + hit._id
- url: large image URL
- thumb: medium image URL
- title: source.title
- description: source.artist || ''
- year: (source.dated||'').match(/\d{4}/)?.[0] || null
- source: 'mia'
- sourceUrl: `https://collections.artsmia.org/art/${hit._id}`
Badge: rgba(180,0,40,0.8), label: 'mia'

---

### SOURCE G02 — LACMA (Los Angeles County Museum of Art)
No key. 20k+ public domain images.
GET https://collections.lacma.org/api/search?q={keyword}&f[]=has_image:true&f[]=public_domain:true&rows={limit}&start=0
Alternative endpoint if above blocked:
GET https://collections.lacma.org/solr/select?q={keyword}&fq=has_image:true&fq=public_domain:true&rows={limit}&wt=json&indent=true
Response:
{
  "response": {
    "docs": [{
      "id": "lac:12345",
      "title_s": "Head of a Bodhisattva",
      "artist_s": "Unknown",
      "date_s": "7th century",
      "thumbnail_url_s": "https://collections.lacma.org/sites/default/files/remote_images/piction/..."
    }]
  }
}
- id: 'lacma_' + item.id?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.thumbnail_url_s
- title: item.title_s || 'LACMA Object'
- description: item.artist_s || ''
- year: (item.date_s||'').match(/\d{4}/)?.[0] || null
- source: 'lacma'
- sourceUrl: `https://collections.lacma.org/node/${item.id?.split(':')[1]}`
Badge: rgba(0,60,120,0.8), label: 'lacma'
Note: CORS best-effort.

---

### SOURCE G03 — Munch Museum (Norway)
No key. 1,150 paintings, 18k prints by Edvard Munch.
GET https://www.munchmuseet.no/api/v1/works?q={keyword}&limit={limit}&hasImage=true
Response:
{
  "items": [{
    "id": "MM.M.00001",
    "title": "The Scream",
    "dated": "1893",
    "technique": "Oil, tempera, pastel on cardboard",
    "image": {
      "url": "https://www.munchmuseet.no/globalassets/..."
    }
  }]
}
- id: 'munch_' + item.id?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.image?.url
- title: item.title || 'Munch Work'
- description: item.technique || ''
- year: (item.dated||'').match(/\d{4}/)?.[0] || null
- source: 'munch'
- sourceUrl: `https://www.munchmuseet.no/en/the-collection/${item.id}`
Badge: rgba(180,80,0,0.8), label: 'munch'
Note: CORS best-effort.

---

### SOURCE G04 — Mauritshuis (The Hague)
No key. Vermeer, Rembrandt, Dutch Golden Age.
GET https://www.mauritshuis.nl/api/collection/search?query={keyword}&limit={limit}&imageAvailable=true
Response:
{
  "results": [{
    "id": "670",
    "title": "Girl with a Pearl Earring",
    "maker": "Johannes Vermeer",
    "dating": "c. 1665",
    "image": "https://www.mauritshuis.nl/media/..."
  }]
}
- id: 'mauritshuis_' + item.id
- url/thumb: item.image
- title: item.title
- description: item.maker || ''
- year: (item.dating||'').match(/\d{4}/)?.[0] || null
- source: 'mauritshuis'
- sourceUrl: `https://www.mauritshuis.nl/en/our-collection/artworks/${item.id}`
Badge: rgba(0,80,40,0.8), label: 'mauritshuis'
Note: CORS best-effort.

---

### SOURCE G05 — Nationalmuseum Stockholm
No key. 6k+ images via Wikimedia Commons.
Swedish decorative arts, design, painting.
Search Wikimedia Commons filtered to Nationalmuseum:
GET https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={keyword}+incategory:Nationalmuseum&srnamespace=6&srlimit={limit}&format=json&origin=*
Then resolve images same way as fetchWikimedia.
Function name: fetchNationalmuseumSE
Uses existing Wikimedia image resolution logic.
- source: 'nationalmuseumse'
Badge: rgba(0,60,80,0.8), label: 'stockholm'

---

### SOURCE G06 — Museo Nacional Colombia
No key. Colombian pre-Columbian, colonial, modern art.
GET https://coleccion.museonacional.gov.co/api/search?q={keyword}&has_image=true&limit={limit}
CORS best-effort.
Badge: rgba(180,120,0,0.8), label: 'colombia'

---

### SOURCE G07 — CSIC (Spanish National Research Council)
No key. Spanish scientific photography and illustration.
GET https://simurg.csic.es/api/search?q={keyword}&media=image&limit={limit}
CORS best-effort.
Badge: rgba(180,0,0,0.8), label: 'csic'

---

### SOURCE G08 — Naturalis Biodiversity Center (Netherlands)
No key. 42M+ natural history specimens.
GET https://api.biodiversitydata.nl/v2/specimen/search/?_search={keyword}&_hasImage=true&_size={limit}
Response:
{
  "resultSet": [{
    "item": {
      "unitID": "RMNH.MOL.123456",
      "identifications": [{ "scientificName": { "fullScientificName": "Helix pomatia" } }],
      "gatheringEvent": { "country": "Netherlands", "dateTimeBegin": "1850-01-01" },
      "associatedMultiMediaUris": [{ "accessURI": "https://medialib.naturalis.nl/..." }]
    }
  }]
}
- id: 'naturalis_' + item.unitID?.replace(/[^a-z0-9]/gi,'_')
- url/thumb: item.associatedMultiMediaUris?.[0]?.accessURI
- title: item.identifications?.[0]?.scientificName?.fullScientificName || 'Naturalis Specimen'
- description: item.gatheringEvent?.country || ''
- year: item.gatheringEvent?.dateTimeBegin?.slice(0,4) || null
- source: 'naturalis'
- sourceUrl: `https://bioportal.naturalis.nl/specimen/${item.unitID}`
Badge: rgba(0,100,40,0.8), label: 'naturalis'

---

### SOURCE G09 — Art Gallery of Ontario (AGO)
No key. 100k+ objects, Canadian and international art.
GET https://www.ago.ca/api/collection/search?q={keyword}&limit={limit}&type=artwork
CORS best-effort.
Badge: rgba(180,60,0,0.8), label: 'ago'

---

### SOURCE G10 — Colección INAAH (Honduras)
No key. Central American pre-Columbian artifacts.
GET https://coleccion.inaah.hn/api/search?q={keyword}&limit={limit}
CORS best-effort.
Badge: rgba(0,120,80,0.8), label: 'inaah'

---

### SOURCE G11 — Heilbrunn Timeline (Met Thematic)
No key. Uses existing Met API but targets Heilbrunn
Timeline of Art History — thematic, curated selections.
Reuse fetchMet() with keyword augmented:
fetchMet('heilbrunn ' + keyword, perSource+2, signal)
No new function needed — extra call in fetchAll.
Source label: 'met' (blends naturally)

---

### SOURCE G12 — Peabody Essex Museum (PEM)
No key. Asian export art, maritime, indigenous cultures.
GET https://www.pem.org/api/collection/search?q={keyword}&hasImage=true&limit={limit}
CORS best-effort.
Badge: rgba(0,80,100,0.8), label: 'pem'

---

### SOURCE G13 — NMNH Anthropology (Smithsonian sub-collection)
No key (uses DEMO_KEY). Smithsonian anthropology specifically.
Reuse existing fetchSmithsonian logic but:
unit_code=NMAAHC (National Museum of African American History)
Function name: fetchNMAAHC
async function fetchNMAAHC(keyword, limit, signal) {
  try {
    const key = STATE.smithsonianKey || 'DEMO_KEY';
    const res = await fetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NMAAHC`,
      { signal }
    );
    if (!res.ok) throw new Error('NMAAHC failed');
    const data = await res.json();
    return (data.response?.rows || [])
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `nmaahc_${row.id}`,
          url: media.content || media.thumbnail,
          thumb: media.thumbnail || media.content,
          title: row.title || 'NMAAHC Object',
          description: '',
          source: 'nmaahc',
          sourceUrl: `https://nmaahc.si.edu/object/${row.id}`,
          year: null,
          tags: [],
          colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch(e) {
    console.warn('NMAAHC failed:', e.message);
    return [];
  }
}
Badge: rgba(40,20,0,0.85), label: 'nmaahc'

---

### SOURCE G14 — National Air and Space Museum (Smithsonian)
No key (uses DEMO_KEY). Aviation, space exploration photos.
Same pattern as fetchNMAAHC but unit_code=NASM
Function name: fetchNASM
Badge: rgba(0,40,100,0.85), label: 'nasm'

---

### SOURCE G15 — Whitney Museum (open data GitHub)
No key. CC0 metadata. 25k works, American art.
Uses GitHub-hosted JSON (same pattern as WCMA):
GET https://raw.githubusercontent.com/whitneymuseum/open-access/master/collection/artworks.csv
Parse CSV — convert to ImageItem array.
Client-side filter by keyword.
STATE.whitneyCache: []
STATE.whitneyCacheTimestamp: null
Note: CSV parsing — use Papa.parse if available,
otherwise manual split on newlines + commas.
But Papa.parse is not in CDN allowlist — use manual CSV parse:
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h,i) => [h, (vals[i]||'').replace(/"/g,'').trim()]));
  });
}
Filter: only rows with imageURL field populated.
- id: 'whitney_' + item.ObjectID
- url/thumb: item.imageURL (if present)
- title: item.Title
- description: item.Artist || ''
- year: item.Date?.match(/\d{4}/)?.[0] || null
- source: 'whitney'
- sourceUrl: `https://whitney.org/collection/works/${item.ObjectID}`
Badge: rgba(0,0,60,0.85), label: 'whitney'

---

### SOURCE G16 — Smithsonian National Zoo
No key (uses DEMO_KEY). Animal photography.
unit_code=NZP
Function name: fetchNationalZoo
Same pattern as fetchNMAAHC.
Badge: rgba(0,100,20,0.8), label: 'zoo'

---

### SOURCE G17 — Cooper Hewitt extra (textiles)
Reuse existing fetchCooperHewitt() but target textiles:
fetchCooperHewitt(keyword + ' textile pattern', perSource+2, signal)
No new function — extra call in fetchAll.

---

### SOURCE G18 — Harvard Map Collection
No key. Historical maps as images. Part of Harvard.
GET https://hollisarchives.lib.harvard.edu/api/v1/search?q={keyword}&type=maps&format=json&limit={limit}
CORS best-effort.
Badge: rgba(0,40,80,0.8), label: 'harvardmaps'

---

### SOURCE G19 — Biodiversity Heritage Library (EOL partner)
EOL-BHL illustrations specifically:
GET https://api.gbif.org/v1/occurrence/search?q={keyword}&mediaType=StillImage&basisOfRecord=LITERATURE&limit={limit}
Targets only literature-sourced images (book illustrations)
rather than field observations. Different results from fetchGBIF.
Function name: fetchGBIFLiterature
Badge: rgba(40,100,0,0.8), label: 'gbif-lit'

---

### SOURCE G20 — National Portrait Gallery London
No key. 215k+ portraits, British history.
GET https://www.npg.org.uk/api/search?query={keyword}&hasImage=true&limit={limit}
CORS best-effort.
Badge: rgba(40,0,80,0.8), label: 'npg'

---

### SOURCE G21 — Amsterdam Museum
No key. Amsterdam history, culture, Golden Age.
GET https://amdata.adlibsoft.com/wwwopac.ashx?database=AMcollect&search=title+{keyword}&xmltype=grouped&output=json&limit={limit}
Alternative: Adlib API format.
CORS best-effort.
Badge: rgba(0,80,160,0.8), label: 'amsterdam'

---

### SOURCE G22 — Smithsonian National Museum of African Art
No key (uses DEMO_KEY). African art, masks, textiles.
unit_code=FSG (Freer Gallery also included)
Function name: fetchFreerSackler
Same pattern as fetchNMAAHC but unit_code=FSG
Badge: rgba(120,60,0,0.8), label: 'freersackler'

---

### SOURCE G23 — Art Museum of Estonia
No key. Estonian art and cultural heritage.
GET https://www.ekm.ee/api/v1/search?q={keyword}&hasImage=true&limit={limit}
CORS best-effort.
Badge: rgba(0,80,120,0.8), label: 'estonia'

---

### SOURCE G24 — Statens Historiska Museer (Sweden)
No key. Swedish archaeology, viking artifacts, coins.
GET https://mis.historiska.se/mis/sok/api/search?q={keyword}&type=image&limit={limit}
CORS best-effort.
Badge: rgba(180,140,0,0.8), label: 'historiska'

---

### SOURCE G25 — Open Library Subjects API
Reuse Open Library but target subjects directly.
Different from existing fetchOpenLibrary (which searches by query).
GET https://openlibrary.org/subjects/{keyword}.json?limit={limit}
Returns works tagged with that subject.
Builds cover images same way as existing fetchOpenLibrary.
Function name: fetchOpenLibrarySubjects
Returns [] if keyword is short/generic (< 4 chars).
Badge: same as openlibrary, label: 'books'

---

### SOURCE G26 — Wellcome Images (extra IIIF endpoint)
Reuse existing fetchWellcome() but target specifically
images from their digitized collection:
fetchWellcome(keyword + ' illustration', perSource+2, signal)
No new function — extra call in fetchAll.

---

### SOURCE G27 — Louvre Abu Dhabi
No key. Cross-cultural universal art museum.
GET https://www.louvreabudhabi.ae/api/collection/search?q={keyword}&hasImage=true&limit={limit}
CORS best-effort.
Badge: rgba(180,120,0,0.85), label: 'louvread'

---

### SOURCE G28 — NMAAHC extra (photographs)
Reuse fetchNMAAHC with photography focus:
fetchNMAAHC(keyword + ' photograph', perSource+2, signal)
No new function — extra call.

---

### SOURCE G29 — Wikimedia Commons (Drawings category)
Reuse fetchWikimedia with drawings filter:
fetchWikimedia(
  'incategory:Drawings ' + keyword,
  perSource+2, signal
)
No new function — extra call in fetchAll.

---

### SOURCE G30 — Internet Archive (Maps)
Reuse fetchArchive logic but target maps specifically.
GET https://archive.org/advancedsearch.php?q={keyword}+AND+mediatype:image+AND+subject:map&fl[]=identifier,title,description,date,subject&rows={limit}&output=json
Function name: fetchArchiveMaps
Different from existing fetchArchive (adds map filter).
Badge: same as archive, label: 'archive'

---

