# Current State — InspoSearch

**Last Updated:** March 23, 2026 (source-adder: imageUrlTemplate bug fix + DigitalCommonwealth)

## Completed Work

---

### ✅ Source-Adder Batch 2 — imageUrlTemplate Bug Fix + DigitalCommonwealth (March 23)
**Files changed:** `insposearch/index.html`, `insposearch/sources.manifest.json`

#### imageUrlTemplate Adapter Bug Fix (`index.html`)
The `imageUrlTemplate` feature added in the builder session had a silent bug: the condition was
`if (!imgUrl && config.imageUrlTemplate...)` — it only fired when `rawImg` was **null/empty**.
For DigitalCommonwealth (and any source where `imageField` returns an inventory ID, not a URL), `rawImg` is
a non-empty string like `"commonwealth:1v53kk76g"` — so the template never fired.

**Fix:** Condition changed to `if (config.imageUrlTemplate && rawImg && !imgUrl.startsWith('http'))`.
Fires whenever the image field returns a non-empty value that isn't already an absolute URL.
Also applied the same fix to the `thumbUrl` path to keep thumb/main consistent.

Backward compatibility confirmed: sources using `imageBaseUrl` (SMB, nat, westfalen) are unaffected —
their `imgUrl` becomes absolute after the base-URL step, so `!imgUrl.startsWith('http')` is false.

#### DigitalCommonwealth Added (`sources.manifest.json`)
- **API verified via Node.js** (PS 5.1 can't reach site; Node.js TLS 1.3 works):
  - `portrait` → 107,940 results ✅ &nbsp; `landscape` → 9,633 ✅ &nbsp; `flower` → 14,014 ✅
  - IIIF image HEAD: `Status 200, image/jpeg` ✅
- `_totalSources: 13 → 14`; active count: 6 → **7**
- Key manifest fields:
  - `endpoint`: `https://www.digitalcommonwealth.org/search.json`
  - `queryParam`: `q`, `extraParams`: `per_page=20` (site uses `per_page`, not `limit`)
  - `resultsPath`: `data`
  - `imageField`: `attributes.exemplary_image_ssi` (returns IDs like `"commonwealth:1v53kk76g"`)
  - `imageUrlTemplate`: `https://iiif.digitalcommonwealth.org/iiif/2/{id}/full/400,/0/default.jpg`
  - `titleField`: `attributes.title_info_primary_tsi`, `descField`: `attributes.institution_name_ssi`

#### Fashion Tier 1 — All New Institutions Investigated, No Accessible APIs Found
Tested all 5 new Tier 1 fashion institutions from V2 Phase 2B:

| Institution | Finding |
|---|---|
| **KCI Japan** (`kci.or.jp`) | No IIIF endpoint, no REST API, no WP-JSON — static HTML site |
| **Museum at FIT NY** (`fashionmuseum.fitnyc.edu`) | No eMuseum API exposed; search redirects to HTML |
| **Bath Fashion Museum** (`fashionmuseum.co.uk`) | 403/404 on all JSON/API paths; Drupal site, no JSON:API |
| **MoMu Antwerp** (`momu.be`) | Craft CMS GraphQL at `/api/` — but only 1 collection piece in CMS; full collection unexposed |
| **MAD Paris** (`madparis.fr`) | No JSON API; `collections.madparis.fr` is HTML-only |
| **Kunstmuseum Den Haag** (`kunstmuseum.nl`) | SPARQL/Linked Data API (wiki at `api.kunstmuseum.nl`) — not REST-compatible |

Note: The 4 "already in app" Tier 1 sources (`palais_galliera → parismusees`, `galleria_costume → joconde`,
`nordic_fashion → nordic`, `va_fashion → va`) just need a `"fashion"` category tag added — tracked in next steps.

---

### ✅ Builder Session — imageUrlTemplate Adapter, Manifest Count Fix, Source JSON Files (March 22)

#### Step 1 — `imageUrlTemplate` added to `fetchIIIFCollection`
**File:** `insposearch/index.html`

New fallback path in the `.map()` inside `fetchIIIFCollection`:
- After extracting `rawImg` via `imageField`, if `imgUrl` is empty AND `config.imageUrlTemplate` is set, the adapter constructs the URL by calling `config.imageUrlTemplate.replace('{id}', idVal)` where `idVal` is `getField(item, config.imageField)`.
- `imageBaseUrl` is applied to the template result too if the output is a relative path.
- Logic order: verbatim → baseUrl (on verbatim) → template (fallback) → baseUrl (on template result).
- Unlocks sources whose API returns an object ID in the image field that needs URL construction (e.g. DigitalCommonwealth, Wikimedia file prefix patterns).

#### Step 2 — Claude model (already claude-sonnet-4-6 from prior session)
- All 3 references confirmed at lines 8459, 8485, 9513 — no change needed.

#### Step 3 — `_totalSources` fixed
**File:** `insposearch/sources.manifest.json`
- `_totalSources: 8` → `_totalSources: 13` (13 total entries in manifest; 6 active, 7 inactive)

#### Step 4 — Individual source JSON files created
**New files:**
- `insposearch/sources/museum_digital_smb.json` — SMB Berlin (200k objects, active)
- `insposearch/sources/museum_digital_nat.json` — museum-digital Deutschland (500k objects, active)
- `insposearch/sources/museum_digital_westfalen.json` — museum-digital Westfalen (50k objects, active)

These files match the entries already in `sources.manifest.json` exactly. They exist for contributor reference — the manifest is still the authoritative runtime source.

---

### ✅ Source-Adder Batch 1 — Adapter Enhancement + 3 New Sources
**Files changed:** `insposearch/index.html`, `insposearch/sources.manifest.json`

#### Adapter Improvements (`fetchIIIFCollection` in index.html)

1. **`imageBaseUrl` support** — Added relative-to-absolute URL resolution. If a manifest source sets `"imageBaseUrl": "https://example.com/"`, relative image paths returned by that API are automatically prefixed. Unlocks sources that return relative paths.

2. **Root-array response support** — Added `"resultsPath": "$"` as a special token. If set, the adapter uses the root JSON response directly (for APIs that return a bare array). Previously, all valid `resultsPath` values had to be dot-notation keys (e.g., `"results.items"`). Now sources can return `[{...}, {...}]` directly.

#### Broken Active Entries Fixed
- **`bodleian`** → `active: false` — `/api/v1/search/` endpoint removed; Bodleian migrated to IIIF collection browsing only (no keyword search JSON API as of 2025)
- **`bsb`** → `active: false` — `api.digitale-sammlungen.de/search/v1/json` returns 404; BSB search API endpoint has changed

#### New Sources Added (3) — All Confirmed 3-Term Tested

| Source ID | Name | Endpoint | Terms Tested | Notes |
|-----------|------|----------|-------------|-------|
| `museum_digital_smb` | SMB Berlin | `smb.museum-digital.de/json/objects` | portrait ✅ flower ✅ landscape ✅ | `imageBaseUrl: "https://smb.museum-digital.de/"` |
| `museum_digital_nat` | museum-digital Deutschland | `nat.museum-digital.de/json/objects` | portrait ✅ landscape ✅ flower ✅ | 500k+ objects from hundreds of German institutions; images hosted on smb.museum-digital.de |
| `museum_digital_westfalen` | museum-digital Westfalen | `westfalen.museum-digital.de/json/objects` | portrait ✅ nature ✅ city ✅ | Note: `landscape` and `flower` return 404 (no results = 404, not empty array) |

All three use: `"adapter": "simple_rest"`, `"resultsPath": "$"`, `"imageField": "image"`, `"titleField": "objekt_name"`, `"descField": "institution_name"`.

#### APIs Tested and Rejected
- **Heidelberg** — All tested paths return 404; correct API path unverified
- **KB Netherlands** — `data.bibliotheken.nl` is Linked Data only, not image search
- **botanicus.org** — Domain unreachable
- **museum-digital.de** (various) — API works but images were relative paths → now solved with `imageBaseUrl`
- **Rawpixel** — AI-generated / premium content; disqualified
- **Kulturarv.dk** — TCP reachable but HTTP times out
- **NHM London** — TCP reachable but HTTP times out from this environment
- **DigitalCommonwealth** — API works but image URL requires construction from ID (not just `imageBaseUrl` prefix); needs custom adapter
- **Bodleian IIIF** — `iiif.bodleian.ox.ac.uk/iiif/collection/top` returns data but is a hierarchy navigator, not keyword search

#### Manifest Active Source Count
- **Before:** 5 active (bodleian ❌broken, bsb ❌broken, cudl, unsplash, david_rumsey)
- **After:** 6 active (cudl, unsplash, david_rumsey, museum_digital_smb, museum_digital_nat, museum_digital_westfalen)


### ✅ Added CURRENT_STATE.md Read/Update Discipline to Frontend Engineer Agent
**File:** [.github/agents/insposearch-frontend.agent.md](.github/agents/insposearch-frontend.agent.md)

The Working Style section now mandates:
- Read `CURRENT_STATE.md` **before** starting any task.
- Update `CURRENT_STATE.md` **after** finishing any task.

---
---

### ✅ Adapter Enhanced for Community Contributions (imageBaseUrl + $ resultsPath)
These two adapter features make it much easier for community contributors to add sources without needing to write custom adapter code:
- Sources with relative image paths → just add `"imageBaseUrl"` to the manifest entry
- Sources returning root-level arrays → just set `"resultsPath": "$"`


### ✅ Created InspoSearch Source Integrator Agent
**File:** [.github/agents/insposearch-source-integrator.agent.md](.github/agents/insposearch-source-integrator.agent.md)

A new workspace-level custom agent for narrowly focused source-manifest integration work.

**Scope:**
- Adding and validating new image sources using the JSON manifest schema
- API verification, CORS assessment, field mapping
- Requires 3 search-term tests before confirming a source
- Restricted tools: `read`, `search`, `edit`, `execute`, `web`

**Schema Reference:**
- Manifest schema: [INSPOSEARCH_MASTERPLAN.md#L113](INSPOSEARCH_MASTERPLAN.md#L113)
- Source README: [insposearch/sources/README.md](insposearch/sources/README.md)
- Template: [insposearch/sources/_template.json](insposearch/sources/_template.json)

**Open Policy Questions:**
1. Can the agent create/modify adapter code if a source doesn't fit existing adapters?
2. Should key-required APIs be allowed (schema supports them)?
3. Should "3 search terms" include local app UI testing, or API-level only?

---

## Pending Work

**Phase 2 — Progress:**

#### Manifest Active Sources (post batch 2)
- `cudl` — active ✅
- `unsplash` — active ✅ (key required)
- `david_rumsey` — active ✅
- `museum_digital_smb` — active ✅ (batch 1)
- `museum_digital_nat` — active ✅ (batch 1)
- `museum_digital_westfalen` — active ✅ (batch 1)
- `digital_commonwealth` — active ✅ NEW (batch 2)

#### Still Inactive (needs investigation)
- **`heidelberg`** — All tested paths return 404; correct API path not found
- **`kb_nl`** — `data.bibliotheken.nl` is Linked Data only; needs correct KB image search API
- **`botanicus`** — Domain unreachable; consider replacing with BHL sub-collection endpoint
- **`dpla_nypl` / `dpla_digital_commonwealth`** — Need user to add DPLA key to localStorage (`inspo_dpla_key`)
- **`bodleian`** — Newly marked inactive; `/api/v1/search/` gone; no keyword search API found
- **`bsb`** — Newly marked inactive; `api.digitale-sammlungen.de/search/v1/json` returns 404

#### Phase 2 Remaining Work
- **Fashion Tier 1 "already in app" tags** — Add `"fashion"` to `category` array for: `palais_galliera` (parismusees), `galleria_costume` (joconde), `nordic_fashion` (nordic), `va_fashion` (va)
- **Fashion Tier 1 new institutions** — No public JSON APIs found; MoMu/KCI/FIT/Bath/MAD require browser-level JS API tracing or institution outreach
- **2.2 More IIIF sources** — Stanford, BnF/Gallica IIIF, NGA IIIF, LC IIIF not yet in manifest
- **2.3 Aggregator sub-collections** — Europeana sub-collections not surfaced; DPLA hubs need DPLA key
- **2.4 Specialized DBs** — Fashion, Film, Architecture DBs not yet in manifest
- **NHM London** — TCP reachable but HTTP times out from this environment; needs re-test from browser

---

## Agent Reference

Two workspace-level agents now available:

| Agent | File | Purpose |
|-------|------|---------|
| **InspoSearch Frontend Engineer** | `insposearch-frontend.agent.md` | Phase-by-phase feature implementation, preserving dark monospace aesthetic, vanilla frontend code |
| **InspoSearch Source Integrator** | `insposearch-source-integrator.agent.md` | Add/validate sources using manifest schema, verify APIs, test CORS, ensure field mappings |

*(and InspoSearch Design & Code Reviewer agent, for code/UI review)*

---

## Next Steps (for future sessions)

1. **Fashion category tags** — Add `"fashion"` to `category` array for existing in-app sources: `david_rumsey` (already has fashion content), `parismusees` (palais_galliera), joconde (galleria_costume), nordic, va
2. **Fashion Tier 1 new institutions** — Need browser-level API tracing (DevTools Network tab) for KCI Japan, FIT NY, Bath, MoMu, MAD Paris — none had accessible Node.js-reachable JSON APIs
3. **NHM London** — Re-test from browser; `data.nhm.ac.uk/api/3/action/datastore_search?resource_id=e4e0a710-2400-4e5f-a569-87dbab23d1d2` may have usable image URLs
4. **Research heidelberg correct API** — try `/api/v1/collections`, `/search`, or Solr endpoint
5. **Research kb_nl correct API** — try KB collections portal or memory-of-the-netherlands API
6. **Replace botanicus** with working BHL illustrations endpoint, or test if domain is back
7. **Add DPLA key** to localStorage to unlock `dpla_nypl` and `dpla_digital_commonwealth`
8. **Add more IIIF institutions** — Stanford, BnF, NGA using `iiif_search` adapter; verify CORS headers
9. **Phase 4 kickoff** — push to GitHub public repo, polish `CONTRIBUTING.md`, add GitHub Actions manifest validator
10. **Phase 2B fashion UI** — Add fashion category filter pill to source filter row (V2 Phase 2B implementation note)
