# InspoSearch Source Manifests

This directory contains the community-contributable source configurations for InspoSearch.

## How to add a source

1. Copy `_template.json` to `your-source-id.json`
2. Fill in the fields (see schema below)
3. Test with at least 3 different search terms
4. Submit a PR — the manifest will be auto-merged into `sources.manifest.json`

## Schema

```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "description": "Short description — what's special about this source",
  "domain": "example.org",
  "category": ["museums", "art", "photos", "nature", "science", "archives",
               "maps", "fashion", "architecture", "botanical", "film", "historical"],
  "region": "europe | uk | americas | oceania | asia | global",
  "keyRequired": false,
  "keyLabel": null,
  "getKeyUrl": null,
  "endpoint": "https://api.example.org/search",
  "adapter": "iiif_search | simple_rest | bodleian | bsb | cudl | unsplash",
  "queryParam": "q",
  "resultsPath": "results.items",
  "imageField": "thumbnail",
  "thumbField": "thumbnail",
  "titleField": "title",
  "sourceUrlField": "url",
  "imageCount": 100000,
  "corsMode": "direct | proxy",
  "corsBlocked": false,
  "active": true,
  "tags": ["keyword1", "keyword2"]
}
```

## Categories reference

| Category | Description |
|---|---|
| `museums` | Art and cultural museums |
| `art` | Fine art, illustration, craft |
| `photos` | Contemporary photography |
| `nature` | Biological specimens, wildlife |
| `science` | Space, geology, medicine |
| `archives` | Historical documents, ephemera |
| `maps` | Cartography, geography |
| `fashion` | Clothing, textiles, costume |
| `architecture` | Buildings, interiors |
| `botanical` | Plants, natural history illustrations |
| `film` | Cinema, moving image stills |
| `historical` | Historical content (cross-category) |

## Regions

`europe` · `uk` · `americas` · `oceania` · `asia` · `global`

## corsBlocked field

`corsBlocked: true` means this source's API cannot be called from a browser due to CORS restrictions. The nightly GitHub Actions fetch script (`scripts/fetch-cors-blocked.js`) fetches these server-side and saves results to `insposearch/data/{sourceId}.json`. The browser reads from that pre-fetched file instead of calling the API directly. Set to `false` (or omit) for sources with permissive CORS headers.

## Adapters

- `iiif_search` — Generic IIIF Content Search API v1/v2
- `simple_rest` — JSON REST API with configurable field mapping
- `bodleian` — Bodleian Libraries-style portal
- `bsb` — Bayerische Staatsbibliothek-style API
- `cudl` — Cambridge Digital Library-style API

## Rules

- Sources must be free to access (no per-query payment required)
- No scraping — only documented/stable APIs
- CORS must be enabled (or note `"corsMode": "proxy"`)
- All images must be legally embeddable (public domain or CC-licensed)
