
## BATCH 2 — 20 NEW NO-KEY SOURCES

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
- Wrapped in try/catch — always return `[]` on error
- Filter with `isLikelyReal()` before returning
- `.slice(0, limit)` before returning

---

### SOURCE B01 — Getty Museum
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

### SOURCE B02 — National Gallery of Art (Washington DC)
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

### SOURCE B03 — GBIF (Global Biodiversity)
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

### SOURCE B04 — EOL (Encyclopedia of Life)
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

### SOURCE B05 — NASA APOD Archive
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

### SOURCE B06 — Gallica (BnF France)
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

### SOURCE B07 — Chronicling America
Endpoint:
```
GET https://chroniclingamerica.loc.gov/search/pages/results/?andtext={keyword}&format=json&rows={limit}
```
Image URL built from `item.id`:
- thumb: `` `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:25/0/default.jpg` ``
- url: same with `pct:50`

Extract:
- id: `'chron_' + item.id.replace(/\//g,'_')`
- title: `item.title + ' — ' + item.date?.slice(0,4)`
- description: `item.ocr_eng?.slice(0,100) || ''`
- year: `item.date?.slice(0,4) || null`
- tags: `(item.subject || []).map(s => s.toLowerCase())`
- source: `'chronicling'`
- sourceUrl: `` `https://chroniclingamerica.loc.gov${item.id}` ``

Badge: `rgba(120,20,20,0.75)`, label: `'chronicle'`

---

### SOURCE B08 — Openverse
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

### SOURCE B09 — Trove (National Library of Australia)
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

### SOURCE B10 — Digital NZ
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

### SOURCE B11 — Biodiversity Heritage Library
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

### SOURCE B12 — Carnegie Museum of Art (CMOA)
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

### SOURCE B13 — Museo Nacional del Prado
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
Note: wrap in extra try/catch — CORS may block, return [] silently.

---

### SOURCE B14 — Paris Musees (14 Paris museums)
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
Note: CORS may block — wrap in extra try/catch, return [] silently.

---

### SOURCE B15 — Yale Center for British Art
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

### SOURCE B16 — Picsum Photos (texture/abstract)
No key, no auth, unlimited:
```
GET https://picsum.photos/v2/list?page={randomPage}&limit={limit}
```
where `randomPage = Math.floor(Math.random() * 30) + 1`

Keyword guard — only run if keyword contains texture terms:
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

### SOURCE B17 — USGS ScienceBase (geological/aerial imagery)
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

### SOURCE B18 — Europeana Fashion (bonus calls)
No new function. Add two extra calls in `fetchAll()`:
```js
fetchEuropeana(keyword + ' fashion', perSource + 2, signal).then(onSourceResult)
fetchEuropeana(keyword + ' textile costume', perSource + 2, signal).then(onSourceResult)
```
Reuses existing Europeana badge and label.

---

### SOURCE B19 — Cooper Hewitt (Smithsonian Design Museum)
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

### SOURCE B20 — Wikimedia Featured Images (bonus call)
No new function. Add extra call in `fetchAll()`:
```js
fetchWikimedia('Featured_picture ' + keyword, perSource + 2, signal).then(onSourceResult)
```
Only returns images that passed Wikipedia's strict quality review.
Reuses existing wiki badge and label.
