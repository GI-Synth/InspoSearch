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
