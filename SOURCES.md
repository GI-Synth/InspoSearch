# SOURCES.md — InpoSearch Complete Source Registry

## Overview
This file is the authoritative list of all image sources
in InpoSearch. Update it every time a new source is added.
Last updated: 2026-03-21

Total unique sources: 117
Total parallel calls in fetchAll(): 120
Sources requiring no setup: 108
Sources requiring API key: 9

---

## Quick Reference

### No setup needed (fire immediately)

- **Wikimedia Commons** — Millions of freely licensed photos, artworks, historical documents — badge: wiki
- **The Met Museum** — 400,000+ global art objects, open access — badge: met
- **Internet Archive** — Historical photographs, ephemera, vintage images — badge: archive
- **NASA Images** — Space, Earth science, aeronautics, history — badge: nasa
- **iNaturalist** — 50M+ CC-licensed nature observations — badge: nature
- **Library of Congress** — 3M+ US historical images and documents — badge: loc
- **Open Library** — Book covers, millions of editions — badge: books
- **Art Institute of Chicago** — 50,000 CC0 artworks — badge: chicago
- **Cleveland Museum of Art** — 64,000 CC0 artworks — badge: cleveland
- **Victoria & Albert Museum** — 1.2M objects: fashion, design, decorative arts — badge: v&a
- **WikiArt** — 250,000 paintings, drawings, prints; all styles — badge: wikiart
- **Nordic Museum** — Scandinavian design, folk art, fashion — badge: nordic
- **Flickr Commons** — Public domain photography; CC licensed — badge: flickr
- **Rijksmuseum** — 800,000 Dutch masterworks, no key needed — badge: rijks
- **Smithsonian Institution** — 4.5M objects across 19 museums (optional key) — badge: si
- **Getty Museum** — Open-access artworks from J. Paul Getty collection — badge: getty
- **National Gallery of Art (DC)** — US national collection, open access — badge: nga
- **GBIF Biodiversity** — 2B+ nature occurrence records with images — badge: gbif
- **Encyclopedia of Life** — Species imagery, 2M+ taxa, CC-licensed — badge: eol
- **NASA APOD Archive** — Astronomy Picture of the Day, 10,000+ images — badge: apod
- **Gallica (BnF)** — French national library, 5M+ digitized documents — badge: gallica
- **Chronicling America** — Historic US newspapers 1770–1963 (LOC) — badge: chronicle
- **Openverse** — 800M+ openly licensed images — badge: openverse
- **Biodiversity Heritage Library** — Natural history literature, illustrated plates — badge: bhl
- **Carnegie Museum of Art** — Pittsburgh open-access artworks — badge: carnegie
- **Museo del Prado** — Spanish masterworks (CORS best-effort) — badge: prado
- **Paris Musées** — 14 Paris museums, 330,000 objects (CORS best-effort) — badge: paris
- **Yale Center for British Art** — British paintings and drawings, IIIF — badge: yale
- **Lorem Picsum** — High-quality texture/abstract photography (texture searches only) — badge: picsum
- **USGS ScienceBase** — Geological and aerial imagery, US government — badge: usgs
- **Cooper Hewitt** — Smithsonian Design Museum (hardcoded demo token) — badge: design
- **Tate Collection** — 77,000 British and international artworks — badge: tate
- **Finnish Heritage (Finna)** — 10M+ Finnish cultural heritage items — badge: finna
- **Swedish Heritage (SOCH)** — Swedish cultural heritage (CORS best-effort) — badge: sweden
- **Joconde (France)** — French national museum database — badge: orsay
- **Muzeum Narodowe Warszawa** — Polish National Museum Warsaw — badge: warsaw
- **Te Papa (New Zealand)** — Pacific and Māori taonga — badge: tepapa
- **Portable Antiquities Scheme** — UK archaeological finds, British Museum — badge: finds
- **Science Museum Group** — Science, technology, medicine history (London) — badge: science
- **Auckland War Memorial Museum** — New Zealand and Pacific collections — badge: auckland
- **Photogrammar (FSA/OWI)** — 170,000 Depression-era photographs, Yale+LOC — badge: fsa
- **Wellcome Collection** — History of medicine, science, the body — badge: wellcome
- **Powerhouse / MAAS Sydney** — Design, technology, decorative arts — badge: maas
- **SMK Denmark** — Statens Museum for Kunst, Danish national gallery — badge: denmark
- **Thyssen-Bornemisza** — Madrid: Impressionism, Expressionism (CORS best-effort) — badge: thyssen
- **World Digital Library** — Global historical documents (via LOC) — badge: wdl
- **Walters Art Museum** — Medieval and Renaissance objects — badge: walters
- **Princeton Art Museum** — Ancient, Asian and European art, IIIF — badge: princeton
- **Wikidata** — Structured image data across 90M items (SPARQL) — badge: wikidata
- **NOAA Photo Library** — Ocean, weather, and coastal photography — badge: noaa
- **Hubble Space Telescope** — Space photography, cached 6 hours — badge: hubble
- **Cornell Digital Library** — Botanical prints, ornithology, university collections — badge: cornell
- **Folger Shakespeare Library** — Renaissance manuscripts, early prints (CORS best-effort) — badge: folger
- **Austrian National Library (ÖNB)** — 12M+ Austrian historical items (CORS best-effort) — badge: austria
- **NYPL Digital Collections** — New York historical photographs — badge: nypl
- **MAK Vienna** — Design and decorative arts (CORS best-effort) — badge: mak
- **Louvre (via Joconde)** — French national collection, 480,000 objects — badge: louvre
- **MNA Mexico** — Pre-Columbian and indigenous art (CORS best-effort) — badge: mna
- **Fitzwilliam Museum** — 500k+ Cambridge objects: paintings, manuscripts, antiquities (CORS best-effort) — badge: fitzwilliam
- **Penn Museum** — Archaeology, Egypt, Middle East, Mediterranean (CORS best-effort) — badge: penn
- **ACMI** — Film, TV, videogame, digital culture objects — badge: acmi
- **National Maritime Museum** — Ships, navigation, astronomy, royal history (CORS best-effort) — badge: nmm
- **Deutsche Digitale Bibliothek** — 38M+ objects from German heritage institutions (CORS best-effort) — badge: ddb
- **Finnish National Gallery** — Ateneum, Kiasma, Sinebrychoff — CC0 — badge: fng
- **Fortepan** — 120k Hungarian historical photos, CC BY-SA — badge: fortepan
- **Open Context** — Field excavation photos, artifact photography — badge: archaeology
- **Albert-Kahn Archives** — 72,000 autochromes: earliest color photographs c.1900–1930 — badge: kahn
- **Canadiana** — 65M+ pages from 40 Canadian memory institutions (CORS best-effort) — badge: canada
- **Natural History Museum London** — 80M specimens: insects, dinosaurs, minerals — badge: nhm
- **Williams College Museum of Art (WCMA)** — Global art, CC0, client-side cached — badge: wcma
- **Europeana (demo key)** — No-key Europeana fallback; active only when no API key set — badge: euro
- **MKG Hamburg** — 500k+ decorative arts, design, fashion, posters (CORS best-effort) — badge: mkg
- **Portal to Texas History (UNT)** — Texas photography, maps, newspapers — badge: texas
- **QAGOMA** — Queensland, Pacific, Asian contemporary art (CORS best-effort) — badge: qagoma
- **Manuscripta Mediaevalia** — German medieval manuscripts, illuminations (CORS best-effort) — badge: medieval2
- **OPenn / UPenn Colenda** — High-res manuscripts, CC0 (CORS best-effort) — badge: upenn
- **National Library of Singapore** — Singapore, Southeast Asia, colonial photography (CORS best-effort) — badge: singapore
- **Balboa Park Commons** — San Diego natural history, art, science (CORS best-effort) — badge: balboa
- **UBC Open Collections** — BC history, indigenous culture, photography — IIIF (CORS best-effort) — badge: ubc
- **Meketre Repository** — Egyptian tomb reliefs, Middle Kingdom paintings (CORS best-effort) — badge: egypt
- **Reciprocal Research Network** — Northwest Coast indigenous artifacts, 8 institutions (CORS best-effort) — badge: rrn
- **Huygens Institute** — Dutch Golden Age maps, prints, portraits (CORS best-effort) — badge: huygens
- **Newberry Library** — Maps, early American history, indigenous documents (CORS best-effort) — badge: newberry
- **Museum of London** — London archaeology, social history, photography (CORS best-effort) — badge: london
- **Zeri Photo Archive** — 30k Italian Renaissance/Baroque photos, SPARQL (CORS best-effort) — badge: zeri
- **Internet Archive Books** — Illustrated public domain book interiors — badge: ia-books
- **Minneapolis Institute of Art (Mia)** — 50k CC0 artworks — badge: mia
- **LACMA** — LA County Museum, 20k public domain images (CORS best-effort) — badge: lacma
- **Munch Museum** — Edvard Munch complete works, Norway (CORS best-effort) — badge: munch
- **Mauritshuis** — Vermeer, Rembrandt, Dutch Golden Age (CORS best-effort) — badge: mauritshuis
- **Nationalmuseum Stockholm** — Swedish art via Wikimedia Commons — badge: stockholm
- **Museo Nacional Colombia** — Pre-Columbian, colonial, modern art (CORS best-effort) — badge: colombia
- **CSIC Spain** — Spanish scientific photography and illustration (CORS best-effort) — badge: csic
- **Naturalis Biodiversity Center** — 42M+ Dutch natural history specimens — badge: naturalis
- **Art Gallery of Ontario (AGO)** — 100k+ Canadian and international art (CORS best-effort) — badge: ago
- **Colección INAAH** — Central American pre-Columbian artifacts (CORS best-effort) — badge: inaah
- **Peabody Essex Museum** — Asian export art, maritime, indigenous cultures (CORS best-effort) — badge: pem
- **NMAAHC (Smithsonian)** — National Museum of African American History & Culture — badge: nmaahc
- **Air & Space Museum (Smithsonian)** — Aviation, space exploration photography — badge: nasm
- **Whitney Museum** — 25k American art CC0, client-side CSV cached — badge: whitney
- **National Zoo (Smithsonian)** — Animal photography — badge: zoo
- **Harvard Map Collection** — Historical maps as images (CORS best-effort) — badge: harvardmaps
- **GBIF Literature** — Scientific book illustration specimens — badge: gbif-lit
- **National Portrait Gallery London** — 215k+ British portraits (CORS best-effort) — badge: npg
- **Amsterdam Museum** — Amsterdam history, Golden Age (CORS best-effort) — badge: amsterdam
- **Freer|Sackler (Smithsonian)** — Asian and African art — badge: freersackler
- **Art Museum of Estonia** — Estonian art and cultural heritage (CORS best-effort) — badge: estonia
- **Statens Historiska Museer** — Swedish archaeology, Viking artifacts (CORS best-effort) — badge: historiska
- **Louvre Abu Dhabi** — Cross-cultural universal art museum (CORS best-effort) — badge: louvread

### API key required

- **Europeana** — inspo_europeana_key — badge: euro
- **Harvard Art Museums** — inspo_harvard_key — badge: harvard
- **Pexels** — inspo_pexels_key — badge: pexels
- **Pixabay** — inspo_pixabay_key — badge: pixabay
- **Trove (NLA)** — inspo_trove_key — badge: trove
- **DigitalNZ** — inspo_digitalnz_key — badge: nz
- **DPLA** — inspo_dpla_key — badge: dpla
- **Artsy** — inspo_artsy_id + inspo_artsy_secret — badge: artsy
- **Brooklyn Museum** — inspo_brooklyn_key (free, instant, no credit card) — badge: brooklyn

---

## Complete Source Registry

### Wikimedia Commons
| Field | Value |
|---|---|
| Function name | fetchWikimedia() |
| Source ID | wikimedia |
| Badge label | wiki |
| Badge CSS class | .badge-wiki |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Photographs, artworks, historical documents |
| Coverage | Global |
| Est. collection size | 90,000,000+ files |
| Added in batch | Batch 1 |
| fetchAll calls | Lines 4736, 4737, 4800, 4801, 4823 (5 calls) |
| Notes | Two-step fetch (search → imageinfo batch). Filters SVG, GIF, diagrams, maps, logos, icons, charts. 5 parallel calls: keyword, Featured_picture+keyword, Artwork+keyword, keyword+painting, keyword+filetype:bitmap. Retry on 429. |

### The Met Museum
| Field | Value |
|---|---|
| Function name | fetchMet() |
| Source ID | met |
| Badge label | met |
| Badge CSS class | .badge-met |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art, decorative arts, fashion, archaeology |
| Coverage | Global |
| Est. collection size | 400,000+ objects |
| Added in batch | Batch 1 |
| fetchAll call | Line 4738 |
| Notes | Two-step fetch (search → object detail parallel). Joins all expanded keywords in query. Retry on 429. MET_DETAIL_LIMIT cap on parallel detail fetches. |

### Internet Archive
| Field | Value |
|---|---|
| Function name | fetchArchive() |
| Source ID | archive |
| Badge label | archive |
| Badge CSS class | .badge-archive |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | Historical photographs, ephemera, vintage images |
| Coverage | Global |
| Est. collection size | 20,000,000+ images |
| Added in batch | Batch 1 |
| fetchAll calls | Lines 4739, 4822 (2 calls: altKeyword; keyword + visual art) |
| Notes | withTimeout 5000ms. CORS warnings expected from file:// origin. Second call uses "visual art" variant for richer variety. |

### NASA Images
| Field | Value |
|---|---|
| Function name | fetchNASA() |
| Source ID | nasa |
| Badge label | nasa |
| Badge CSS class | .badge-nasa |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Space, Earth science, aeronautics, history |
| Coverage | NASA collections (global reach) |
| Est. collection size | 300,000+ photos |
| Added in batch | Batch 1 |
| fetchAll call | Line 4740 |
| Notes | NASA Images API (images-api.nasa.gov). Distinct from APOD. Filters media_type=image. |

### iNaturalist
| Field | Value |
|---|---|
| Function name | fetchINaturalist() |
| Source ID | inaturalist |
| Badge label | nature |
| Badge CSS class | .badge-inaturalist |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Nature observations — wildlife, plants, fungi |
| Coverage | Global |
| Est. collection size | 50,000,000+ observations |
| Added in batch | Batch 1 |
| fetchAll call | Line 4741 |
| Notes | CC-licensed images only (cc-by, cc-by-nc, cc0). Ordered by votes for quality. URL replaces /square. with /medium. and /large. |

### Library of Congress
| Field | Value |
|---|---|
| Function name | fetchLOC() |
| Source ID | loc |
| Badge label | loc |
| Badge CSS class | .badge-loc |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | US historical images, documents, photographs |
| Coverage | US |
| Est. collection size | 3,000,000+ images |
| Added in batch | Batch 1 |
| fetchAll call | Line 4742 |
| Notes | Handles nested image_url arrays ([[url]] pattern). Also reused by wdl source (call 58). |

### Open Library
| Field | Value |
|---|---|
| Function name | fetchOpenLibrary() |
| Source ID | openlibrary |
| Badge label | books |
| Badge CSS class | .badge-openlibrary |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Book covers |
| Coverage | Global |
| Est. collection size | 10,000,000+ editions |
| Added in batch | Batch 1 |
| fetchAll call | Line 4743 |
| Notes | Skips items without cover_i. Uses -L suffix for full, -M for thumb via covers.openlibrary.org. |

### Art Institute of Chicago
| Field | Value |
|---|---|
| Function name | fetchChicagoArt() |
| Source ID | chicago |
| Badge label | chicago |
| Badge CSS class | .badge-chicago |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art, decorative arts, photography |
| Coverage | Global (US-centred) |
| Est. collection size | 50,000+ CC0 artworks |
| Added in batch | Batch 1 |
| fetchAll call | Line 4744 |
| Notes | IIIF image URLs built from config.iiif_url + image_id. 843px width for full, 400px for thumb. |

### Cleveland Museum of Art
| Field | Value |
|---|---|
| Function name | fetchCleveland() |
| Source ID | cleveland |
| Badge label | cleveland |
| Badge CSS class | .badge-cleveland |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art |
| Coverage | Global |
| Est. collection size | 64,000+ CC0 artworks |
| Added in batch | Batch 1 |
| fetchAll call | Line 4745 |
| Notes | CC0 open-access API. Uses images.web.url field. |

### Victoria & Albert Museum
| Field | Value |
|---|---|
| Function name | fetchVA() |
| Source ID | va |
| Badge label | v&a |
| Badge CSS class | .badge-va |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fashion, design, decorative arts, sculpture |
| Coverage | Global |
| Est. collection size | 1,200,000+ objects |
| Added in batch | Batch 1 |
| fetchAll call | Line 4746 |
| Notes | IIIF via framemark.vam.ac.uk. URL uses _primaryImageId. 735px for full, 400px for thumb. |

### WikiArt
| Field | Value |
|---|---|
| Function name | fetchWikiArt() |
| Source ID | wikiart |
| Badge label | wikiart |
| Badge CSS class | .badge-wikiart |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Paintings, drawings, prints — all art movements |
| Coverage | Global |
| Est. collection size | 250,000+ artworks |
| Added in batch | Batch 1 |
| fetchAll call | Line 4747 |
| Notes | JSON layout=new API (/en/search/{keyword}/1?json=2&layout=new). Returns Paintings array. |

### Nordic Museum
| Field | Value |
|---|---|
| Function name | fetchNordicMuseum() |
| Source ID | nordic |
| Badge label | nordic |
| Badge CSS class | .badge-nordic |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | Scandinavian design, folk art, fashion, everyday objects |
| Coverage | Scandinavian |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 1 |
| fetchAll call | Line 4748 |
| Notes | withTimeout 5000ms. Accepts multiple response shapes: imageUrl / image_url / media[].uri. |

### Flickr Commons
| Field | Value |
|---|---|
| Function name | fetchFlickrCommons() |
| Source ID | flickr |
| Badge label | flickr |
| Badge CSS class | .badge-flickr |
| Requires key | No (hardcoded public API key) |
| Key storage | N/A (hardcoded: a6d819499131071f21efa8a74b2accc8) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | Photography — public domain and Creative Commons |
| Coverage | Global |
| Est. collection size | 500,000+ qualifying photos |
| Added in batch | Batch 1 |
| fetchAll call | Line 4749 |
| Notes | withTimeout 5000ms. Filters licenses 7,8,9,10 (CC and public domain). Sorts by relevance. |

### Europeana
| Field | Value |
|---|---|
| Function name | fetchEuropeana() |
| Source ID | europeana |
| Badge label | euro |
| Badge CSS class | .badge-euro |
| Requires key | Yes |
| Key storage | inspo_europeana_key |
| State property | STATE.europeanaKey |
| Always active | No |
| CORS risk | Low |
| Content type | European cultural heritage — art, photography, maps, books |
| Coverage | European |
| Est. collection size | 50,000,000+ objects |
| Added in batch | Batch 1 |
| fetchAll calls | Lines 4750, 4751, 4752, 4753 (4 calls: keyword; alt2; keyword+fashion; keyword+textile costume) |
| Notes | 4 parallel calls for variety. Returns [] if no key. Uses profile=rich for full metadata. |

### Rijksmuseum
| Field | Value |
|---|---|
| Function name | fetchRijksmuseum() |
| Source ID | rijksmuseum |
| Badge label | rijks |
| Badge CSS class | .badge-rijks |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Dutch Golden Age paintings, prints, decorative arts |
| Coverage | Dutch / European |
| Est. collection size | 800,000+ objects |
| Added in batch | Batch 1 |
| fetchAll calls | Lines 4754, 4818, 4819 (3 calls: keyword; keyword+drawing; keyword+print) |
| Notes | Active Collection Linked Data endpoint. Resolves item identifiers in parallel. 3 total calls for variety. |

### Harvard Art Museums
| Field | Value |
|---|---|
| Function name | fetchHarvard() |
| Source ID | harvard |
| Badge label | harvard |
| Badge CSS class | .badge-harvard |
| Requires key | Yes |
| Key storage | inspo_harvard_key |
| State property | STATE.harvardKey |
| Always active | No |
| CORS risk | Low |
| Content type | Global art — painting, sculpture, decorative arts |
| Coverage | Global |
| Est. collection size | 250,000+ objects |
| Added in batch | Batch 1 |
| fetchAll call | Line 4755 |
| Notes | Returns [] if no key. Rich metadata: people, medium, dated. |

### Smithsonian Institution
| Field | Value |
|---|---|
| Function name | fetchSmithsonian() |
| Source ID | smithsonian |
| Badge label | si |
| Badge CSS class | .badge-smithsonian |
| Requires key | No (optional key for higher rate limits) |
| Key storage | inspo_smithsonian_key |
| State property | STATE.smithsonianKey |
| Always active | Yes |
| CORS risk | Low |
| Content type | Natural history, art, science, American history |
| Coverage | Global |
| Est. collection size | 4,500,000+ objects across 19 museums |
| Added in batch | Batch 1 |
| fetchAll calls | Lines 4756, 4821 (2 calls: keyword; keyword+photograph) |
| Notes | Uses DEMO_KEY when no user key configured. Optional key = higher rate limits. Second call targets photography specifically. |

### Pexels
| Field | Value |
|---|---|
| Function name | fetchPexels() |
| Source ID | pexels |
| Badge label | pexels |
| Badge CSS class | .badge-pexels |
| Requires key | Yes |
| Key storage | inspo_pexels_key |
| State property | STATE.pexelsKey |
| Always active | No |
| CORS risk | Low |
| Content type | Contemporary photography |
| Coverage | Global (170 countries) |
| Est. collection size | 3,200,000+ photos |
| Added in batch | Batch 1 |
| fetchAll call | Line 4757 |
| Notes | Key passed as Authorization header. Returns [] if no key. |

### Pixabay
| Field | Value |
|---|---|
| Function name | fetchPixabay() |
| Source ID | pixabay |
| Badge label | pixabay |
| Badge CSS class | .badge-pixabay |
| Requires key | Yes |
| Key storage | inspo_pixabay_key |
| State property | STATE.pixabayKey |
| Always active | No |
| CORS risk | Low |
| Content type | Photography, illustrations |
| Coverage | Global |
| Est. collection size | 2,700,000+ CC0 images |
| Added in batch | Batch 1 |
| fetchAll call | Line 4758 |
| Notes | Has its own internal cache layer (cacheGet/cacheSet keyed to 'pixabay_'+keyword). Returns [] if no key. |

### Getty Museum
| Field | Value |
|---|---|
| Function name | fetchGetty() |
| Source ID | getty |
| Badge label | getty |
| Badge CSS class | .badge-getty |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art — paintings, sculpture, photography, manuscripts |
| Coverage | Global |
| Est. collection size | 150,000+ open-access objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4760 |
| Notes | Linked Art JSON-LD API (data.getty.edu). Deep nested path to extract image URL. |

### National Gallery of Art (Washington DC)
| Field | Value |
|---|---|
| Function name | fetchNGA() |
| Source ID | nga |
| Badge label | nga |
| Badge CSS class | .badge-nga |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art — US national collection |
| Coverage | US national / global |
| Est. collection size | 50,000+ open-access objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4761 |
| Notes | IIIF thumbnails. URL replaces /thumb/ with /full/ for larger image variant. |

### GBIF Biodiversity
| Field | Value |
|---|---|
| Function name | fetchGBIF() |
| Source ID | gbif |
| Badge label | gbif |
| Badge CSS class | .badge-gbif |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Wildlife, plants, fungi, occurrence images |
| Coverage | Global |
| Est. collection size | 2,000,000,000+ occurrence records |
| Added in batch | Batch 2 |
| fetchAll call | Line 4762 |
| Notes | Filters mediaType=StillImage. Uses item.media[0].identifier for URL. |

### Encyclopedia of Life (EOL)
| Field | Value |
|---|---|
| Function name | fetchEOL() |
| Source ID | eol |
| Badge label | eol |
| Badge CSS class | .badge-eol |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Species imagery — all life on Earth |
| Coverage | Global |
| Est. collection size | 2,000,000+ taxa |
| Added in batch | Batch 2 |
| fetchAll call | Line 4763 |
| Notes | Two-step fetch: search then pages API. First 5 IDs fetched in parallel. Uses eolMediaURL from dataObjects[0]. |

### NASA APOD Archive
| Field | Value |
|---|---|
| Function name | fetchAPOD() |
| Source ID | apod |
| Badge label | apod |
| Badge CSS class | .badge-apod |
| Requires key | No (uses DEMO_KEY — 30 req/hour) |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Astronomy, space imagery |
| Coverage | Space / global observatories |
| Est. collection size | 10,000+ daily images (since 1995) |
| Added in batch | Batch 2 |
| fetchAll call | Line 4764 |
| Notes | Returns random images (no search). Filters media_type=image only. hdurl preferred over url. DEMO_KEY = 30 req/hour free. |

### Gallica (BnF)
| Field | Value |
|---|---|
| Function name | fetchGallica() |
| Source ID | gallica |
| Badge label | gallica |
| Badge CSS class | .badge-gallica |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | French manuscripts, photographs, books, newspapers |
| Coverage | French |
| Est. collection size | 5,000,000+ digitized documents |
| Added in batch | Batch 2 |
| fetchAll call | Line 4765 |
| Notes | SRU JSON endpoint. withTimeout 5000ms. URL pattern: identifier + .thumbnail for image. |

### Chronicling America
| Field | Value |
|---|---|
| Function name | fetchChroniclingAmerica() |
| Source ID | chronicling |
| Badge label | chronicle |
| Badge CSS class | .badge-chronicling |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Historic US newspapers |
| Coverage | US (1770–1963) |
| Est. collection size | 16,000,000+ pages |
| Added in batch | Batch 2 |
| fetchAll call | Line 4766 |
| Notes | LOC newspaper pages. Builds IIIF image URLs from item.id path. pct:25 for thumb, pct:50 for url. |

### Openverse
| Field | Value |
|---|---|
| Function name | fetchOpenverse() |
| Source ID | openverse |
| Badge label | openverse |
| Badge CSS class | .badge-openverse |
| Requires key | No (limited use without key) |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Open-licensed photography, art, media |
| Coverage | Global |
| Est. collection size | 800,000,000+ items |
| Added in batch | Batch 2 |
| fetchAll call | Line 4767 |
| Notes | Filters license_type=commercial for broadest usability. |

### Trove (NLA)
| Field | Value |
|---|---|
| Function name | fetchTrove() |
| Source ID | trove |
| Badge label | trove |
| Badge CSS class | .badge-trove |
| Requires key | Yes |
| Key storage | inspo_trove_key |
| State property | STATE.troveKey |
| Always active | No |
| CORS risk | Medium |
| Content type | Australian cultural heritage — pictures, photographs |
| Coverage | Australian |
| Est. collection size | 2,000,000+ pictures |
| Added in batch | Batch 2 |
| fetchAll call | Line 4768 |
| Notes | withTimeout 5000ms. Searches category=picture zone. Finds thumbnail identifiers via linktype=thumbnail. Returns [] if no key. |

### DigitalNZ
| Field | Value |
|---|---|
| Function name | fetchDigitalNZ() |
| Source ID | digitalnz |
| Badge label | nz |
| Badge CSS class | .badge-digitalnz |
| Requires key | Yes |
| Key storage | inspo_digitalnz_key |
| State property | STATE.digitalnzKey |
| Always active | No |
| CORS risk | Medium |
| Content type | New Zealand cultural heritage |
| Coverage | New Zealand |
| Est. collection size | 30,000,000+ items |
| Added in batch | Batch 2 |
| fetchAll call | Line 4769 |
| Notes | withTimeout 5000ms. Returns [] if no key. |

### Biodiversity Heritage Library (BHL)
| Field | Value |
|---|---|
| Function name | fetchBHL() |
| Source ID | bhl |
| Badge label | bhl |
| Badge CSS class | .badge-bhl |
| Requires key | No (hardcoded zero-UUID public key) |
| Key storage | N/A (hardcoded: 00000000-0000-0000-0000-000000000000) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Natural history literature — illustrated plates, drawings |
| Coverage | Global |
| Est. collection size | 60,000,000+ pages |
| Added in batch | Batch 2 |
| fetchAll calls | Lines 4770, 4820 (2 calls: keyword; illustrated+keyword) |
| Notes | Two-step: title search → item metadata → page images. Uses first matching ItemID. Second call targets illustrated content specifically. |

### Carnegie Museum of Art (CMOA)
| Field | Value |
|---|---|
| Function name | fetchCarnegie() |
| Source ID | carnegie |
| Badge label | carnegie |
| Badge CSS class | .badge-carnegie |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Fine art — paintings, sculptures |
| Coverage | Pittsburgh / Global |
| Est. collection size | 30,000+ open-access objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4771 |
| Notes | Open-access collection API. |

### Museo del Prado
| Field | Value |
|---|---|
| Function name | fetchPrado() |
| Source ID | prado |
| Badge label | prado |
| Badge CSS class | .badge-prado |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Spanish masterworks — Velázquez, Goya, El Greco |
| Coverage | Spanish / European |
| Est. collection size | 17,000+ works |
| Added in batch | Batch 2 |
| fetchAll call | Line 4772 |
| Notes | withTimeout 5000ms. CORS best-effort — returns [] silently on error. No console warning logged. |

### Paris Musées
| Field | Value |
|---|---|
| Function name | fetchParisMusees() |
| Source ID | parismusees |
| Badge label | paris |
| Badge CSS class | .badge-parismusees |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Parisian museum objects — Carnavalet, Cluny, Petit Palais and 11 others |
| Coverage | French (Paris) |
| Est. collection size | 330,000+ objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4773 |
| Notes | GraphQL POST request. withTimeout 5000ms. CORS best-effort — returns [] silently. Covers 14 Paris city museums. |

### Yale Center for British Art
| Field | Value |
|---|---|
| Function name | fetchYale() |
| Source ID | yale |
| Badge label | yale |
| Badge CSS class | .badge-yale |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | British paintings, drawings, prints |
| Coverage | British |
| Est. collection size | 60,000+ objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4774 |
| Notes | IIIF images via images.britishart.yale.edu. Strips obj: prefix from item ID. |

### Lorem Picsum
| Field | Value |
|---|---|
| Function name | fetchPicsum() |
| Source ID | picsum |
| Badge label | picsum |
| Badge CSS class | .badge-picsum |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Texture, abstract, minimal photography |
| Coverage | Global |
| Est. collection size | 1,000+ curated images |
| Added in batch | Batch 2 |
| fetchAll call | Line 4775 |
| Notes | Client-side keyword guard — ONLY fires if keyword contains: texture, abstract, minimal, surface, light, pattern, grain, void, blur. Returns [] otherwise. Random paginated (1–30). |

### USGS ScienceBase
| Field | Value |
|---|---|
| Function name | fetchUSGS() |
| Source ID | usgs |
| Badge label | usgs |
| Badge CSS class | .badge-usgs |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | Geological surveys, aerial imagery, topographic maps |
| Coverage | US |
| Est. collection size | 100,000+ items |
| Added in batch | Batch 2 |
| fetchAll call | Line 4776 |
| Notes | withTimeout 5000ms. US government open data portal. Finds thumbnail via webLinks array. |

### Cooper Hewitt (Smithsonian Design Museum)
| Field | Value |
|---|---|
| Function name | fetchCooperHewitt() |
| Source ID | cooperhewitt |
| Badge label | design |
| Badge CSS class | .badge-cooperhewitt |
| Requires key | No (hardcoded public demo token) |
| Key storage | N/A (hardcoded: 4d47366a4e7f1abe2bd9d882dc86e0b5) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Design, decorative arts, textiles, fashion accessories |
| Coverage | Global |
| Est. collection size | 200,000+ objects |
| Added in batch | Batch 2 |
| fetchAll call | Line 4777 |
| Notes | Read-only demo access token hardcoded. images[0].b.url for full, images[0].z.url for thumb. |

### Tate Collection
| Field | Value |
|---|---|
| Function name | fetchTate() |
| Source ID | tate |
| Badge label | tate |
| Badge CSS class | .badge-tate |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | British and international art |
| Coverage | British / Global |
| Est. collection size | 77,000+ artworks |
| Added in batch | Batch 3 |
| fetchAll call | Line 4779 |
| Notes | Tate London official API. Covers Tate Modern, Tate Britain, Tate Liverpool, Tate St Ives. |

### Finnish Heritage (Finna)
| Field | Value |
|---|---|
| Function name | fetchFinna() |
| Source ID | finna |
| Badge label | finna |
| Badge CSS class | .badge-finna |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Finnish cultural heritage — museums, archives, libraries |
| Coverage | Finnish |
| Est. collection size | 10,000,000+ items |
| Added in batch | Batch 3 |
| fetchAll call | Line 4780 |
| Notes | Images prefixed with https://finna.fi base URL. Filters format:0/Image/. |

### Swedish Heritage (SOCH)
| Field | Value |
|---|---|
| Function name | fetchSOCH() |
| Source ID | soch |
| Badge label | sweden |
| Badge CSS class | .badge-soch |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Swedish cultural heritage — folk art, archaeology, everyday objects |
| Coverage | Swedish |
| Est. collection size | 1,000,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4781 |
| Notes | withTimeout 5000ms. Uses HTTP (not HTTPS) endpoint — known to fail in strict browsers. Returns [] silently on error. |

### Joconde (France)
| Field | Value |
|---|---|
| Function name | fetchJoconde() |
| Source ID | joconde |
| Badge label | orsay |
| Badge CSS class | .badge-joconde |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | French national museum objects |
| Coverage | French |
| Est. collection size | 500,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4782 |
| Notes | data.culture.gouv.fr API. withTimeout 8000ms (longer than default). Image URL pattern: pop.culture.gouv.fr/medias/cible/{ref}.jpg. Also reused by louvre source (call 72). |

### Muzeum Narodowe Warszawa (MNW)
| Field | Value |
|---|---|
| Function name | fetchMNW() |
| Source ID | mnw |
| Badge label | warsaw |
| Badge CSS class | .badge-mnw |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Polish fine art — paintings, sculptures, applied arts |
| Coverage | Polish / European |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4783 |
| Notes | Polish National Museum Warsaw open API (api.mnw.art.pl). |

### Te Papa (New Zealand)
| Field | Value |
|---|---|
| Function name | fetchTePapa() |
| Source ID | tepapa |
| Badge label | tepapa |
| Badge CSS class | .badge-tepapa |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Pacific, Māori taonga, New Zealand natural history |
| Coverage | New Zealand / Pacific |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4784 |
| Notes | Museum of New Zealand. Filters hasMedia:true. Uses media[0].previewUrl. |

### DPLA (Digital Public Library of America)
| Field | Value |
|---|---|
| Function name | fetchDPLA() |
| Source ID | dpla |
| Badge label | dpla |
| Badge CSS class | .badge-dpla |
| Requires key | Yes |
| Key storage | inspo_dpla_key |
| State property | STATE.dplaKey |
| Always active | No |
| CORS risk | Low |
| Content type | US cultural heritage — photographs, documents, maps |
| Coverage | US |
| Est. collection size | 50,000,000+ items |
| Added in batch | Batch 3 |
| fetchAll call | Line 4785 |
| Notes | Returns [] if no key. Aggregates from hundreds of US libraries and archives. |

### Artsy
| Field | Value |
|---|---|
| Function name | fetchArtsy() |
| Source ID | artsy |
| Badge label | artsy |
| Badge CSS class | .badge-artsy |
| Requires key | Yes (client_id + client_secret — two credentials) |
| Key storage | inspo_artsy_id + inspo_artsy_secret |
| State property | STATE.artsyId + STATE.artsySecret |
| Always active | No |
| CORS risk | Low |
| Content type | Contemporary and modern art |
| Coverage | Global |
| Est. collection size | 1,000,000+ artworks |
| Added in batch | Batch 3 |
| fetchAll call | Line 4786 |
| Notes | Two-step: acquires xapp token on first call (POST), caches in STATE.artsyToken (runtime only, not persisted). Token reset to null on any error. Returns [] if either credential missing. Keys panel requires two separate inputs. |

### Portable Antiquities Scheme (PAS)
| Field | Value |
|---|---|
| Function name | fetchPAS() |
| Source ID | pas |
| Badge label | finds |
| Badge CSS class | .badge-pas |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | UK archaeological finds — coins, brooches, Roman, medieval |
| Coverage | UK |
| Est. collection size | 100,000+ finds |
| Added in batch | Batch 3 |
| fetchAll call | Line 4787 |
| Notes | British Museum public database of UK metal detector finds. Description prepends broadperiod era. |

### Science Museum Group (SMG)
| Field | Value |
|---|---|
| Function name | fetchSMG() |
| Source ID | smg |
| Badge label | science |
| Badge CSS class | .badge-smg |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Science, technology, medicine history |
| Coverage | UK |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4788 |
| Notes | Covers Science Museum London + National Railway Museum + National Science and Media Museum. Image URL via attributes.images[0].processed.medium.location. |

### Auckland War Memorial Museum
| Field | Value |
|---|---|
| Function name | fetchAuckland() |
| Source ID | auckland |
| Badge label | auckland |
| Badge CSS class | .badge-auckland |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | New Zealand and Pacific collections — taonga, natural history, war history |
| Coverage | New Zealand / Pacific |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4789 |
| Notes | Elasticsearch-based media API. Image URL built from media_id: /id/media/v2/mediaartifact/{media_id}. |

### Photogrammar (FSA/OWI)
| Field | Value |
|---|---|
| Function name | fetchPhotogrammar() |
| Source ID | photogrammar |
| Badge label | fsa |
| Badge CSS class | .badge-photogrammar |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Depression-era documentary photography (1935–1945) |
| Coverage | US |
| Est. collection size | 170,000+ FSA/OWI photographs |
| Added in batch | Batch 3 |
| fetchAll call | Line 4790 |
| Notes | Yale + Library of Congress project. Builds LOC IIIF tile URLs from lc_id. pct:25 for thumb, pct:50 for full. |

### Wellcome Collection
| Field | Value |
|---|---|
| Function name | fetchWellcome() |
| Source ID | wellcome |
| Badge label | wellcome |
| Badge CSS class | .badge-wellcome |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | History of medicine, science, the human body |
| Coverage | Global (London-based collection) |
| Est. collection size | 250,000+ works |
| Added in batch | Batch 3 |
| fetchAll call | Line 4791 |
| Notes | IIIF-based images. Filters workType=k and iiif-image location type. Appends /full/400,/0/default.jpg to IIIF thumbnail base URL. |

### Powerhouse / MAAS Sydney
| Field | Value |
|---|---|
| Function name | fetchMAAS() |
| Source ID | maas |
| Badge label | maas |
| Badge CSS class | .badge-maas |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Design, technology, decorative arts, fashion |
| Coverage | Australian / Global |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 3 |
| fetchAll call | Line 4792 |
| Notes | Powerhouse Museum Sydney (Museum of Applied Arts and Sciences). Uses images[0].url. |

### Statens Museum for Kunst (SMK, Denmark)
| Field | Value |
|---|---|
| Function name | fetchSMK() |
| Source ID | smk |
| Badge label | denmark |
| Badge CSS class | .badge-smk |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Danish national gallery — paintings, works on paper |
| Coverage | Danish / European |
| Est. collection size | 40,000+ artworks |
| Added in batch | Batch 3 |
| fetchAll call | Line 4793 |
| Notes | Full URL replaces /thumb/ with /full/ in image_thumbnail string for larger image. |

### Thyssen-Bornemisza
| Field | Value |
|---|---|
| Function name | fetchThyssen() |
| Source ID | thyssen |
| Badge label | thyssen |
| Badge CSS class | .badge-thyssen |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Impressionism, Expressionism, Renaissance, Realism |
| Coverage | Spanish / European |
| Est. collection size | 20,000+ works |
| Added in batch | Batch 3 |
| fetchAll call | Line 4794 |
| Notes | withTimeout 5000ms. CORS best-effort — returns [] silently on AbortError or any other error. No warning logged. |

### World Digital Library (WDL)
| Field | Value |
|---|---|
| Function name | fetchLOC() (remapped) |
| Source ID | wdl |
| Badge label | wdl |
| Badge CSS class | .badge-wdl |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Global historical documents, manuscripts, maps |
| Coverage | Global |
| Est. collection size | unknown |
| Added in batch | Batch 3 (C17) |
| fetchAll call | Lines 4796–4798 |
| Notes | No separate fetch function. Reuses fetchLOC() with 'wdl '+keyword prefix. Remaps: id replaces loc_ with wdl_; source set to 'wdl'. |

### Walters Art Museum
| Field | Value |
|---|---|
| Function name | fetchWalters() |
| Source ID | walters |
| Badge label | walters |
| Badge CSS class | .badge-walters |
| Requires key | No (empty apikey param accepted) |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Medieval, Renaissance, Byzantine, Asian art |
| Coverage | Global |
| Est. collection size | 27,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Line 4803 |
| Notes | art.thewalters.org API. Works with empty apikey= parameter. Uses PrimaryImage.Lg for full, PrimaryImage.Sm for thumb. |

### Princeton University Art Museum
| Field | Value |
|---|---|
| Function name | fetchPrinceton() |
| Source ID | princeton |
| Badge label | princeton |
| Badge CSS class | .badge-princeton |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Ancient, Asian, European, American art |
| Coverage | Global |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Line 4804 |
| Notes | Elasticsearch hits API. IIIF URLs built from iiifbaseuri: +/full/!800,800/ for full, +/full/!400,400/ for thumb. |

### Wikidata
| Field | Value |
|---|---|
| Function name | fetchWikidata() |
| Source ID | wikidata |
| Badge label | wikidata |
| Badge CSS class | .badge-wikidata |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Structured knowledge base — all subject areas |
| Coverage | Global |
| Est. collection size | 90,000,000+ items with images |
| Added in batch | Batch 4 |
| fetchAll call | Line 4805 |
| Notes | SPARQL query via query.wikidata.org. Sends User-Agent: InpoSearch/1.0 header per bot policy. Thumb appends ?width=400. Filters by English label containing keyword. |

### NOAA Photo Library
| Field | Value |
|---|---|
| Function name | fetchNOAA() |
| Source ID | noaa |
| Badge label | noaa |
| Badge CSS class | .badge-noaa |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Ocean, weather, coastal, atmospheric photography |
| Coverage | US / Global oceans |
| Est. collection size | 50,000+ photos |
| Added in batch | Batch 4 |
| fetchAll call | Line 4806 |
| Notes | NOAA US government public image library. Uses url_full and url_thumbnail fields. |

### Hubble Space Telescope
| Field | Value |
|---|---|
| Function name | fetchHubble() |
| Source ID | hubble |
| Badge label | hubble |
| Badge CSS class | .badge-hubble |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Space photography — nebulae, galaxies, star clusters |
| Coverage | Space |
| Est. collection size | 10,000+ images |
| Added in batch | Batch 4 |
| fetchAll call | Line 4807 |
| Notes | Fetches ALL images on first call, caches in STATE.hubbleCache (6h TTL, stored in STATE.hubbleCacheTimestamp). Client-side keyword filter. Falls back to shuffled full pool if no keyword match. No search param on endpoint. |

### Cornell Digital Library
| Field | Value |
|---|---|
| Function name | fetchCornell() |
| Source ID | cornell |
| Badge label | cornell |
| Badge CSS class | .badge-cornell |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Botanical illustrations, ornithology, manuscripts, historical images |
| Coverage | Global (Cornell university collections) |
| Est. collection size | 100,000+ items |
| Added in batch | Batch 4 |
| fetchAll call | Line 4808 |
| Notes | Blacklight/Solr search. Thumb: base URL + thumbnail_path_ss. Full: same but replaces 'thumbnail' with 'large'. |

### Folger Shakespeare Library
| Field | Value |
|---|---|
| Function name | fetchFolger() |
| Source ID | folger |
| Badge label | folger |
| Badge CSS class | .badge-folger |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Renaissance manuscripts, early modern prints, Shakespearean materials |
| Coverage | English / European |
| Est. collection size | 100,000+ items |
| Added in batch | Batch 4 |
| fetchAll call | Line 4809 |
| Notes | withTimeout 6000ms. KEY_SOURCES marks cors:true. Returns [] silently on any error — no warning logged. |

### Austrian National Library (ÖNB)
| Field | Value |
|---|---|
| Function name | fetchONB() |
| Source ID | onb |
| Badge label | austria |
| Badge CSS class | .badge-onb |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Austrian historical documents, photographs, manuscripts |
| Coverage | Austrian / European |
| Est. collection size | 12,000,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Line 4810 |
| Notes | withTimeout 6000ms. KEY_SOURCES marks cors:true. Returns [] silently on any error — no warning logged. |

### NYPL Digital Collections
| Field | Value |
|---|---|
| Function name | fetchNYPL() |
| Source ID | nypl |
| Badge label | nypl |
| Badge CSS class | .badge-nypl |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | New York historical photographs, prints, maps, illustrations |
| Coverage | US (New York focussed) |
| Est. collection size | 900,000+ items |
| Added in batch | Batch 4 |
| fetchAll call | Line 4811 |
| Notes | NYPL Digital Collections API. No auth required for public items. Thumb uses t=t param, full uses t=w. |

### MAK Vienna
| Field | Value |
|---|---|
| Function name | fetchMAK() |
| Source ID | mak |
| Badge label | mak |
| Badge CSS class | .badge-mak |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Design, decorative arts, textiles, furniture, glass |
| Coverage | Austrian / Global |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Line 4812 |
| Notes | withTimeout 6000ms. KEY_SOURCES marks cors:true. Returns [] silently on any error — no warning logged. |

### MNA Mexico
| Field | Value |
|---|---|
| Function name | fetchMNA() |
| Source ID | mna |
| Badge label | mna |
| Badge CSS class | .badge-mna |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Pre-Columbian archaeology, indigenous Mexican art and culture |
| Coverage | Mexican |
| Est. collection size | 50,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Line 4813 |
| Notes | withTimeout 6000ms. KEY_SOURCES marks cors:true. Returns [] silently on any error. Accepts both array and {results:[]} response shapes. |

### Louvre (via Joconde)
| Field | Value |
|---|---|
| Function name | fetchJoconde() (remapped) |
| Source ID | louvre |
| Badge label | louvre |
| Badge CSS class | .badge-louvre |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Medium |
| Content type | Louvre collection — French and global art |
| Coverage | French |
| Est. collection size | 480,000+ objects |
| Added in batch | Batch 4 |
| fetchAll call | Lines 4815–4817 |
| Notes | No separate fetch function. Reuses fetchJoconde() with keyword+'Louvre' suffix. Remaps: id replaces joconde_ with louvre_; source set to 'louvre'. Inherits Joconde withTimeout 8000ms. |

### Fitzwilliam Museum
| Field | Value |
|---|---|
| Function name | fetchFitzwilliam() |
| Source ID | fitzwilliam |
| Badge label | fitzwilliam |
| Badge CSS class | .badge-fitzwilliam |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Paintings, manuscripts, antiquities, decorative arts |
| Coverage | Global (Cambridge) |
| Est. collection size | 500,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Elasticsearch API: /api/v1/objects/search. cors:true in KEY_SOURCES. CORS best-effort — returns [] silently on error. |

### Penn Museum (University of Pennsylvania)
| Field | Value |
|---|---|
| Function name | fetchPenn() |
| Source ID | penn |
| Badge label | penn |
| Badge CSS class | .badge-penn |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Archaeology, Egypt, Middle East, Mediterranean |
| Coverage | Global (Philadelphia) |
| Est. collection size | 40,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | cors:true in KEY_SOURCES. CORS best-effort — returns [] silently on error. |

### ACMI (Australian Centre for Moving Image)
| Field | Value |
|---|---|
| Function name | fetchACMI() |
| Source ID | acmi |
| Badge label | acmi |
| Badge CSS class | .badge-acmi |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Film, TV, videogame, digital culture objects |
| Coverage | Australian / Global |
| Est. collection size | 150,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | /api/search/ endpoint. Extracts objects.results[]. Uses primary_image. |

### National Maritime Museum Greenwich (NMM)
| Field | Value |
|---|---|
| Function name | fetchNMM() |
| Source ID | nmm |
| Badge label | nmm |
| Badge CSS class | .badge-nmm |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Ships, navigation, astronomy, royal history |
| Coverage | British / Global maritime |
| Est. collection size | 2,500,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | cors:true in KEY_SOURCES. collections.rmg.co.uk API. CORS best-effort — returns [] silently. |

### Deutsche Digitale Bibliothek (DDB)
| Field | Value |
|---|---|
| Function name | fetchDDB() |
| Source ID | ddb |
| Badge label | ddb |
| Badge CSS class | .badge-ddb |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | German heritage objects — art, history, science, design |
| Coverage | German |
| Est. collection size | 38,000,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | cors:true in KEY_SOURCES. May need Accept: application/json header. Uses results.docs[]. CORS best-effort — returns [] silently. |

### Finnish National Gallery (FNG / Ateneum)
| Field | Value |
|---|---|
| Function name | fetchFNG() |
| Source ID | fng |
| Badge label | fng |
| Badge CSS class | .badge-fng |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Finnish art — Ateneum, Kiasma modern art, Sinebrychoff |
| Coverage | Finnish / European |
| Est. collection size | 40,000+ CC0 artworks |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | kokoelmat.fng.fi API. CC0 open access. Uses data[]. year_from for date. |

### Brooklyn Museum
| Field | Value |
|---|---|
| Function name | fetchBrooklyn() |
| Source ID | brooklyn |
| Badge label | brooklyn |
| Badge CSS class | .badge-brooklyn |
| Requires key | Yes (free, instant, no credit card) |
| Key storage | inspo_brooklyn_key |
| State property | STATE.brooklynKey |
| Always active | No |
| CORS risk | Low |
| Content type | Fine art, ancient, Egyptian, American, Asian |
| Coverage | Global (Brooklyn, NYC) |
| Est. collection size | 150,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Returns [] if !STATE.brooklynKey. Key URL: https://www.brooklynmuseum.org/opencollection/api/ Uses data[].primary_image. |

### Fortepan (Hungarian Photo Archive)
| Field | Value |
|---|---|
| Function name | fetchFortepan() |
| Source ID | fortepan |
| Badge label | fortepan |
| Badge CSS class | .badge-fortepan |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Hungarian historical photography — everyday life, events |
| Coverage | Hungary / Central Europe |
| Est. collection size | 120,000+ photos |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | CC BY-SA licensed. full URL replaces _m. with _l. for larger image. |

### Open Context (Archaeology)
| Field | Value |
|---|---|
| Function name | fetchOpenContext() |
| Source ID | opencontext |
| Badge label | archaeology |
| Badge CSS class | .badge-opencontext |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Field excavation photos, artifact photography |
| Coverage | Global (archaeology sites) |
| Est. collection size | 500,000+ media items |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Linked Data JSON. Uses oc-gen:has-thumbnail-uri. sourceUrl from @id field. |

### Albert-Kahn Archives (Autochrome)
| Field | Value |
|---|---|
| Function name | fetchAlbertKahn() |
| Source ID | albertkahn |
| Badge label | kahn |
| Badge CSS class | .badge-albertkahn |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Autochrome photographs — earliest color images of the world |
| Coverage | Global (c.1909–1931) |
| Est. collection size | 72,000 autochromes |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Uses opendata.hauts-de-seine.fr CKAN endpoint. legende = caption. url_de_la_photographie = image URL. |

### Canadiana Discovery Portal
| Field | Value |
|---|---|
| Function name | fetchCanadiana() |
| Source ID | canadiana |
| Badge label | canada |
| Badge CSS class | .badge-canadiana |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Canadian cultural heritage — photographs, illustrations, maps |
| Coverage | Canadian |
| Est. collection size | 65,000,000+ pages from 40 institutions |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | cors:true in KEY_SOURCES. Uses ti (title), pu (year), su (subjects) fields. CORS best-effort — returns [] silently. |

### Natural History Museum London (NHM)
| Field | Value |
|---|---|
| Function name | fetchNHM() |
| Source ID | nhm |
| Badge label | nhm |
| Badge CSS class | .badge-nhm |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Natural history specimens — insects, dinosaurs, minerals, plants |
| Coverage | Global |
| Est. collection size | 80,000,000+ specimens |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | CKAN datastore API (data.nhm.ac.uk). resource_id fixed UUID. associatedMedia for image URL. |

### Williams College Museum of Art (WCMA)
| Field | Value |
|---|---|
| Function name | fetchWCMA() |
| Source ID | wcma |
| Badge label | wcma |
| Badge CSS class | .badge-wcma |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Global art — painting, sculpture, photography, American masters |
| Coverage | Global |
| Est. collection size | 15,000+ CC0 objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Fetches entire GitHub-hosted JSON on first call (same pattern as Hubble). Client-side keyword filter on title+classification+period. STATE.wcmaCache populated once, re-fetched after 24h. |

### Europeana (Demo / No-Key Fallback)
| Field | Value |
|---|---|
| Function name | fetchEuropeanaDemo() |
| Source ID | europeana (reuses existing ID) |
| Badge label | euro |
| Badge CSS class | .badge-euro (reuses existing class) |
| Requires key | No (uses api2demo public demo key) |
| Key storage | N/A |
| State property | N/A |
| Always active | Conditional — active only when STATE.europeanaKey is NOT set |
| CORS risk | Low |
| Content type | European cultural heritage |
| Coverage | European |
| Est. collection size | 50,000,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Separate from fetchEuropeana(). Returns [] immediately if STATE.europeanaKey is set (avoid double-fetching). Uses api2demo public key — no login required. Maps to source: 'europeana', not a new source ID. |

### MKG Hamburg (Museum für Kunst und Gewerbe)
| Field | Value |
|---|---|
| Function name | fetchMKG() |
| Source ID | mkg |
| Badge label | mkg |
| Badge CSS class | .badge-mkg |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Decorative arts, design, fashion, typography, posters |
| Coverage | German / Global |
| Est. collection size | 500,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | sammlungonline.mkg-hamburg.de. CORS best-effort — returns [] silently on error. |

### Portal to Texas History (UNT)
| Field | Value |
|---|---|
| Function name | fetchUNT() |
| Source ID | unt |
| Badge label | texas |
| Badge CSS class | .badge-unt |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Texas history — photography, maps, newspapers, documents |
| Coverage | US (Texas) |
| Est. collection size | 1,500,000+ items |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | texashistory.unt.edu. Uses ark for ID and sourceUrl. Uses item.thumb for image URL. |

### QAGOMA (Queensland Art Gallery)
| Field | Value |
|---|---|
| Function name | fetchQAGOMA() |
| Source ID | qagoma |
| Badge label | qagoma |
| Badge CSS class | .badge-qagoma |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Queensland, Pacific, Asian contemporary art |
| Coverage | Australian / Pacific / Asian |
| Est. collection size | 17,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | cors:true in KEY_SOURCES. Uses Queensland govt data.qld.gov.au CKAN endpoint. CORS best-effort — returns [] silently. |

### Manuscripta Mediaevalia
| Field | Value |
|---|---|
| Function name | fetchManuscripts() |
| Source ID | manuscripts |
| Badge label | medieval2 |
| Badge CSS class | .badge-manuscripts |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | German medieval manuscripts, illuminated pages |
| Coverage | German / European |
| Est. collection size | 100,000+ manuscript pages |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | manuscripta-mediaevalia.de API. CORS best-effort — returns [] silently. Distinct from Princeton medieval (German focus). |

### OPenn / UPenn Colenda (Special Collections)
| Field | Value |
|---|---|
| Function name | fetchOPenn() |
| Source ID | upenn |
| Badge label | upenn |
| Badge CSS class | .badge-upenn |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | High-resolution manuscripts, illuminations, rare books |
| Coverage | Global (Philadelphia) |
| Est. collection size | 500,000+ images |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Uses colenda.library.upenn.edu Blacklight/Solr JSON (same structure as fetchCornell). cors:true in KEY_SOURCES. All CC0 or PD. CORS best-effort. |

### National Library of Singapore
| Field | Value |
|---|---|
| Function name | fetchSingapore() |
| Source ID | singapore |
| Badge label | singapore |
| Badge CSS class | .badge-singapore |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Singapore, Southeast Asia, colonial-era photography |
| Coverage | Singapore / Southeast Asia |
| Est. collection size | 1,000,000+ items |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | nlb.gov.sg API. CORS best-effort — returns [] silently. |

### Balboa Park Commons (San Diego)
| Field | Value |
|---|---|
| Function name | fetchBalboa() |
| Source ID | balboa |
| Badge label | balboa |
| Badge CSS class | .badge-balboa |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Natural history, art, science — San Diego museum network |
| Coverage | US (San Diego) |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | balboaparkcommons.org API. CORS best-effort — returns [] silently. |

### UBC Open Collections
| Field | Value |
|---|---|
| Function name | fetchUBC() |
| Source ID | ubc |
| Badge label | ubc |
| Badge CSS class | .badge-ubc |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | BC history, indigenous culture, photography, IIIF |
| Coverage | Canadian (British Columbia) |
| Est. collection size | 250,000+ items |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | open.library.ubc.ca Blacklight/Solr. CORS best-effort — returns [] silently. |

### Meketre Repository (Ancient Egypt)
| Field | Value |
|---|---|
| Function name | fetchMeketre() |
| Source ID | egypt |
| Badge label | egypt |
| Badge CSS class | .badge-egypt |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Egyptian tomb reliefs, Middle Kingdom paintings, artifacts |
| Coverage | Egyptian (ancient) |
| Est. collection size | unknown |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | meketre.org API. Niche but exceptional for ancient Egyptian visual content. CORS best-effort — returns [] silently. |

### Reciprocal Research Network (RRN)
| Field | Value |
|---|---|
| Function name | fetchRRN() |
| Source ID | rrn |
| Badge label | rrn |
| Badge CSS class | .badge-rrn |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Northwest Coast indigenous artifacts |
| Coverage | Northwest Coast (Canada/US) |
| Est. collection size | 500,000+ objects from 8 institutions |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | rrnpilot.org. First Nations cultural objects. CORS best-effort — returns [] silently. |

### Huygens Institute (Dutch Golden Age)
| Field | Value |
|---|---|
| Function name | fetchHuygens() |
| Source ID | huygens |
| Badge label | huygens |
| Badge CSS class | .badge-huygens |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Dutch Golden Age maps, prints, portraits |
| Coverage | Dutch / European |
| Est. collection size | unknown |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | api.huygens.knaw.nl. CORS best-effort — returns [] silently. |

### Newberry Library (Chicago)
| Field | Value |
|---|---|
| Function name | fetchNewberry() |
| Source ID | newberry |
| Badge label | newberry |
| Badge CSS class | .badge-newberry |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Maps, early American history, indigenous documents |
| Coverage | US (Chicago / Americas) |
| Est. collection size | 1,600,000+ items |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | digcoll.newberry.org. CORS best-effort — returns [] silently. |

### Museum of London
| Field | Value |
|---|---|
| Function name | fetchMuseumOfLondon() |
| Source ID | mollondon |
| Badge label | london |
| Badge CSS class | .badge-mollondon |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | London archaeology, social history, photography |
| Coverage | British (London) |
| Est. collection size | 400,000+ objects |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | collections.museumoflondon.org.uk API. Response shape similar to SMG. CORS best-effort — returns [] silently. |

### Zeri Photo Archive (Italian Art)
| Field | Value |
|---|---|
| Function name | fetchZeri() |
| Source ID | zeri |
| Badge label | zeri |
| Badge CSS class | .badge-zeri |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Italian Renaissance and Baroque photographs |
| Coverage | Italian / European |
| Est. collection size | 30,000 photographs |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | SPARQL endpoint at data.fondazionezeri.unibo.it. Parses SPARQL JSON results. CORS best-effort — returns [] silently. |

### Internet Archive Books (Illustrated)
| Field | Value |
|---|---|
| Function name | fetchIABooks() |
| Source ID | iabooks |
| Badge label | ia-books |
| Badge CSS class | .badge-iabooks |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Illustrated public domain book interiors |
| Coverage | Global |
| Est. collection size | 1,000,000+ illustrated books |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | Distinct from existing 'archive' source (which uses mediatype:image). This uses mediatype:texts AND subject:illustrated. Cover image via https://archive.org/services/img/{identifier}. |

### Wikimedia Commons (Extra: Photographs Category)
| Field | Value |
|---|---|
| Function name | fetchWikimedia() (reused, extra call) |
| Source ID | wikimedia (reuses existing ID) |
| Badge label | wiki |
| Badge CSS class | .badge-wiki (reuses existing class) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | High-quality photographs — Wikimedia Photographs category |
| Coverage | Global |
| Est. collection size | same pool as existing wikimedia |
| Added in batch | Batch 6 |
| fetchAll call | TBD |
| Notes | No new function or source ID. Extra fetchAll() call only: fetchWikimedia('incategory:Photographs '+keyword, ...). Results merged into 'wikimedia' pool. |

### Minneapolis Institute of Art (Mia)
| Field | Value |
|---|---|
| Function name | fetchMia() |
| Source ID | mia |
| Badge label | mia |
| Badge CSS class | .badge-mia |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Paintings, sculptures, decorative arts, CC0 |
| Coverage | Global, 50,000+ public domain works |
| Est. collection size | 50,000+ artworks |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Filter: source.image==='valid' AND source.restricted===0. Image: api.artsmia.org/images/{id}/large.jpg, thumb: /medium.jpg |

### LACMA (Los Angeles County Museum of Art)
| Field | Value |
|---|---|
| Function name | fetchLACMA() |
| Source ID | lacma |
| Badge label | lacma |
| Badge CSS class | .badge-lacma |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Global art from antiquity to present, public domain |
| Coverage | Global |
| Est. collection size | 20,000+ public domain works |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Primary endpoint: collections.lacma.org/api/search. Falls back to Solr endpoint if blocked. |

### Munch Museum (Norway)
| Field | Value |
|---|---|
| Function name | fetchMunch() |
| Source ID | munch |
| Badge label | munch |
| Badge CSS class | .badge-munch |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Paintings, prints and drawings by Edvard Munch |
| Coverage | Norwegian art, 1,150 paintings + 18,000 prints |
| Est. collection size | 19,000+ works |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: munchmuseet.no/api/v1/works |

### Mauritshuis (The Hague)
| Field | Value |
|---|---|
| Function name | fetchMauritshuis() |
| Source ID | mauritshuis |
| Badge label | mauritshuis |
| Badge CSS class | .badge-mauritshuis |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Dutch Golden Age, Vermeer, Rembrandt |
| Coverage | Dutch Masters |
| Est. collection size | 800+ masterworks |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: mauritshuis.nl/api/collection/search |

### Nationalmuseum Stockholm
| Field | Value |
|---|---|
| Function name | fetchNationalmuseumSE() |
| Source ID | nationalmuseumse |
| Badge label | stockholm |
| Badge CSS class | .badge-nationalmuseumse |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Swedish decorative arts, design, painting |
| Coverage | Sweden, 6,000+ images |
| Est. collection size | 6,000+ works |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses Wikimedia Commons API with incategory:Nationalmuseum filter. Two-step image resolution same as fetchWikimedia. |

### Museo Nacional Colombia
| Field | Value |
|---|---|
| Function name | fetchColombia() |
| Source ID | colombia |
| Badge label | colombia |
| Badge CSS class | .badge-colombia |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Colombian pre-Columbian, colonial, modern art |
| Coverage | Colombia |
| Est. collection size | Unknown |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: coleccion.museonacional.gov.co/api/search |

### CSIC (Spanish National Research Council)
| Field | Value |
|---|---|
| Function name | fetchCSIC() |
| Source ID | csic |
| Badge label | csic |
| Badge CSS class | .badge-csic |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Spanish scientific photography and illustration |
| Coverage | Spain |
| Est. collection size | Unknown |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: simurg.csic.es/api/search |

### Naturalis Biodiversity Center (Netherlands)
| Field | Value |
|---|---|
| Function name | fetchNaturalis() |
| Source ID | naturalis |
| Badge label | naturalis |
| Badge CSS class | .badge-naturalis |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Natural history specimens: insects, molluscs, plants, fossils |
| Coverage | Netherlands, global collection |
| Est. collection size | 42,000,000+ specimens |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Endpoint: api.biodiversitydata.nl/v2/specimen/search/. Filter _hasImage=true. |

### Art Gallery of Ontario (AGO)
| Field | Value |
|---|---|
| Function name | fetchAGO() |
| Source ID | ago |
| Badge label | ago |
| Badge CSS class | .badge-ago |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Canadian and international art |
| Coverage | Canada, global |
| Est. collection size | 100,000+ objects |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: ago.ca/api/collection/search |

### Colección INAAH (Honduras)
| Field | Value |
|---|---|
| Function name | fetchINAAH() |
| Source ID | inaah |
| Badge label | inaah |
| Badge CSS class | .badge-inaah |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Central American pre-Columbian artifacts |
| Coverage | Honduras, Central America |
| Est. collection size | Unknown |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: coleccion.inaah.hn/api/search |

### Met Museum (Heilbrunn Timeline extra call)
| Field | Value |
|---|---|
| Function name | fetchMet() (reused, extra call) |
| Source ID | met (reuses existing ID) |
| Badge label | met |
| Badge CSS class | .badge-met (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Thematic curated Met Timeline selections |
| Coverage | Global |
| Est. collection size | same pool as existing met |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | No new function. Extra call: fetchMet('heilbrunn '+keyword, ...). Results merged into 'met' pool. |

### Peabody Essex Museum (PEM)
| Field | Value |
|---|---|
| Function name | fetchPEM() |
| Source ID | pem |
| Badge label | pem |
| Badge CSS class | .badge-pem |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Asian export art, maritime, indigenous cultures |
| Coverage | Global, Salem MA |
| Est. collection size | Unknown |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: pem.org/api/collection/search |

### NMAAHC (Smithsonian)
| Field | Value |
|---|---|
| Function name | fetchNMAAHC() |
| Source ID | nmaahc |
| Badge label | nmaahc |
| Badge CSS class | .badge-nmaahc |
| Requires key | No (uses STATE.smithsonianKey || 'DEMO_KEY') |
| Key storage | inspo_smithsonian_key (optional) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | African American history, culture, photography |
| Coverage | USA |
| Est. collection size | 36,000+ objects |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses Smithsonian Open Access API with unit_code=NMAAHC. Falls back to DEMO_KEY. Extra call with '+photograph' variant. |

### National Air and Space Museum (Smithsonian)
| Field | Value |
|---|---|
| Function name | fetchNASM() |
| Source ID | nasm |
| Badge label | nasm |
| Badge CSS class | .badge-nasm |
| Requires key | No (uses STATE.smithsonianKey || 'DEMO_KEY') |
| Key storage | inspo_smithsonian_key (optional) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Aviation, space exploration photography |
| Coverage | USA, global space missions |
| Est. collection size | 9,000,000+ artifacts |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses Smithsonian Open Access API with unit_code=NASM. Falls back to DEMO_KEY. |

### Whitney Museum of American Art
| Field | Value |
|---|---|
| Function name | fetchWhitney() |
| Source ID | whitney |
| Badge label | whitney |
| Badge CSS class | .badge-whitney |
| Requires key | No |
| Key storage | N/A |
| State property | STATE.whitneyCache, STATE.whitneyCacheTimestamp |
| Always active | Yes |
| CORS risk | Low |
| Content type | American art, 20th-21st century, CC0 |
| Coverage | USA |
| Est. collection size | 25,000+ works |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Client-side CSV cached 24h. GitHub raw CSV: whitneymuseum/open-access/artworks.csv. Filter: imageURL populated. |

### National Zoo (Smithsonian)
| Field | Value |
|---|---|
| Function name | fetchNationalZoo() |
| Source ID | nationalzoo |
| Badge label | zoo |
| Badge CSS class | .badge-nationalzoo |
| Requires key | No (uses STATE.smithsonianKey || 'DEMO_KEY') |
| Key storage | inspo_smithsonian_key (optional) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Animal photography |
| Coverage | USA, global species |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses Smithsonian Open Access API with unit_code=NZP. Falls back to DEMO_KEY. |

### Cooper Hewitt (Textiles extra call)
| Field | Value |
|---|---|
| Function name | fetchCooperHewitt() (reused, extra call) |
| Source ID | cooperhewitt (reuses existing ID) |
| Badge label | design |
| Badge CSS class | .badge-cooperhewitt (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Textile patterns and woven design objects |
| Coverage | Global |
| Est. collection size | same pool as existing cooperhewitt |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | No new function. Extra call: fetchCooperHewitt(keyword+' textile pattern', ...). Results merged into 'cooperhewitt' pool. |

### Harvard Map Collection
| Field | Value |
|---|---|
| Function name | fetchHarvardMaps() |
| Source ID | harvardmaps |
| Badge label | harvardmaps |
| Badge CSS class | .badge-harvardmaps |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Historical maps as images |
| Coverage | Global, Harvard library holdings |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: hollisarchives.lib.harvard.edu/api/v1/search with type=maps. |

### GBIF Literature (Book Illustrations)
| Field | Value |
|---|---|
| Function name | fetchGBIFLiterature() |
| Source ID | gbiflit |
| Badge label | gbif-lit |
| Badge CSS class | .badge-gbiflit |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Scientific book illustrations, natural history plates |
| Coverage | Global |
| Est. collection size | Millions of literature-sourced occurrence records |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses GBIF API with basisOfRecord=LITERATURE (different from fetchGBIF which uses all records). Targets engraved plates and book illustrations specifically. |

### National Portrait Gallery London
| Field | Value |
|---|---|
| Function name | fetchNPG() |
| Source ID | npg |
| Badge label | npg |
| Badge CSS class | .badge-npg |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | British portraits, history |
| Coverage | UK, 215,000+ portraits |
| Est. collection size | 215,000+ |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: npg.org.uk/api/search |

### Amsterdam Museum
| Field | Value |
|---|---|
| Function name | fetchAmsterdam() |
| Source ID | amsterdam |
| Badge label | amsterdam |
| Badge CSS class | .badge-amsterdam |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Amsterdam city history, Golden Age culture |
| Coverage | Netherlands |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Uses Adlib API: amdata.adlibsoft.com/wwwopac.ashx |

### Freer|Sackler Gallery (Smithsonian)
| Field | Value |
|---|---|
| Function name | fetchFreerSackler() |
| Source ID | freersackler |
| Badge label | freersackler |
| Badge CSS class | .badge-freersackler |
| Requires key | No (uses STATE.smithsonianKey || 'DEMO_KEY') |
| Key storage | inspo_smithsonian_key (optional) |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Asian and African art, decorative arts |
| Coverage | Asia, Africa, Middle East |
| Est. collection size | 40,000+ objects |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Uses Smithsonian Open Access API with unit_code=FSG. Falls back to DEMO_KEY. |

### Art Museum of Estonia
| Field | Value |
|---|---|
| Function name | fetchEstonia() |
| Source ID | estonia |
| Badge label | estonia |
| Badge CSS class | .badge-estonia |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Estonian art and cultural heritage |
| Coverage | Estonia |
| Est. collection size | Unknown |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: ekm.ee/api/v1/search |

### Statens Historiska Museer (Sweden)
| Field | Value |
|---|---|
| Function name | fetchHistoriska() |
| Source ID | historiska |
| Badge label | historiska |
| Badge CSS class | .badge-historiska |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Swedish archaeology, Viking artifacts, coins |
| Coverage | Sweden |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: mis.historiska.se/mis/sok/api/search |

### Open Library Subjects API
| Field | Value |
|---|---|
| Function name | fetchOpenLibrarySubjects() |
| Source ID | openlibrary (reuses existing ID) |
| Badge label | books |
| Badge CSS class | .badge-openlibrary (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Book covers filtered by subject tag |
| Coverage | Global |
| Est. collection size | same pool as existing openlibrary |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Different from fetchOpenLibrary (query search). Uses /subjects/{slug}.json endpoint. Returns [] for keywords < 4 chars. Results merged into 'openlibrary' pool. |

### Wellcome Images (Illustration extra call)
| Field | Value |
|---|---|
| Function name | fetchWellcome() (reused, extra call) |
| Source ID | wellcome (reuses existing ID) |
| Badge label | wellcome |
| Badge CSS class | .badge-wellcome (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Medical illustration, historical anatomy |
| Coverage | Global |
| Est. collection size | same pool as existing wellcome |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | No new function. Extra call: fetchWellcome(keyword+' illustration', ...). Results merged into 'wellcome' pool. |

### Louvre Abu Dhabi
| Field | Value |
|---|---|
| Function name | fetchLouvreAD() |
| Source ID | louvread |
| Badge label | louvread |
| Badge CSS class | .badge-louvread |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | High |
| Content type | Cross-cultural universal art museum |
| Coverage | Global |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | CORS best-effort. Endpoint: louvreabudhabi.ae/api/collection/search |

### NMAAHC Photographs (extra call)
| Field | Value |
|---|---|
| Function name | fetchNMAAHC() (reused, extra call) |
| Source ID | nmaahc (reuses existing ID) |
| Badge label | nmaahc |
| Badge CSS class | .badge-nmaahc (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | African American historical photographs |
| Coverage | USA |
| Est. collection size | same pool as existing nmaahc |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | No new function. Extra call: fetchNMAAHC(keyword+' photograph', ...). Results merged into 'nmaahc' pool. |

### Wikimedia Commons (Drawings Category)
| Field | Value |
|---|---|
| Function name | fetchWikimedia() (reused, extra call) |
| Source ID | wikimedia (reuses existing ID) |
| Badge label | wiki |
| Badge CSS class | .badge-wiki (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Drawings — Wikimedia Drawings category |
| Coverage | Global |
| Est. collection size | same pool as existing wikimedia |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | No new function. Extra call: fetchWikimedia('incategory:Drawings '+keyword, ...). Results merged into 'wikimedia' pool. |

### Internet Archive (Maps)
| Field | Value |
|---|---|
| Function name | fetchArchiveMaps() |
| Source ID | archive (reuses existing ID) |
| Badge label | archive |
| Badge CSS class | .badge-archive (reuses existing) |
| Requires key | No |
| Key storage | N/A |
| State property | N/A |
| Always active | Yes |
| CORS risk | Low |
| Content type | Historical maps as scanned images |
| Coverage | Global |
| Est. collection size | Large |
| Added in batch | Batch 7 |
| fetchAll call | TBD |
| Notes | Different from fetchArchive (adds +AND+subject:map filter). Results merged into 'archive' pool. |

---

## Source Groups (presets)

List the exact contents of SOURCE_GROUPS from index.html:

### museums
met, rijksmuseum, chicago, cleveland, va, getty, nga,
walters, princeton, tate, smk, thyssen, prado, louvre,
joconde, mnw, parismusees, cooperhewitt, carnegie, harvard,
yale, folger, maas, auckland, tepapa, wellcome, smg,
pas, photogrammar, cornell, mna, onb, nypl, mak,
fitzwilliam, penn, nmm, ddb, fng, brooklyn, nhm,
wcma, mkg, balboa, mollondon,
mia, lacma, munch, mauritshuis, nationalmuseumse,
ago, pem, nmaahc, nasm, whitney, freersackler,
npg, amsterdam, estonia, historiska, louvread

### photography
flickr, pexels, pixabay, noaa, nasa, apod, hubble,
loc, nypl, archive, chronicling, openverse, trove,
digitalnz, wikidata, inaturalist, usgs, finna,
fortepan, albertkahn, canadiana, unt, iabooks,
mia, lacma, whitney

### nature
inaturalist, gbif, eol, bhl, noaa, hubble, apod,
nasa, usgs, nhm, naturalis, nationalzoo, gbiflit

### historical
archive, chronicling, gallica, loc, trove, digitalnz,
wdl, bhl, folger, onb, nypl, soch, nordic,
canadiana, unt, iabooks, upenn, zeri,
lacma, mauritshuis, harvardmaps, nationalmuseumse, historiska

### artdesign
wikiart, wikidata, openverse, cooperhewitt, tate, va,
artsy, dpla, europeana, getty, nga, carnegie, maas,
smk, thyssen, wellcome, rijksmuseum, parismusees,
chicago, cleveland, fitzwilliam, fng, brooklyn, acmi, qagoma,
mia, lacma, mauritshuis, whitney, munch, freersackler

---

## ALL_SOURCES Array

Every source ID in the ALL_SOURCES constant from index.html, one per line.
Total: 117

```
wikimedia
met
archive
nasa
inaturalist
loc
openlibrary
chicago
cleveland
va
wikiart
nordic
flickr
europeana
rijksmuseum
harvard
smithsonian
pexels
pixabay
getty
nga
gbif
eol
apod
gallica
chronicling
openverse
trove
digitalnz
bhl
carnegie
prado
parismusees
yale
picsum
usgs
cooperhewitt
tate
finna
soch
joconde
mnw
tepapa
dpla
artsy
pas
smg
auckland
photogrammar
wellcome
maas
smk
thyssen
wdl
walters
princeton
wikidata
noaa
hubble
cornell
folger
onb
nypl
mak
mna
louvre
fitzwilliam
penn
acmi
nmm
ddb
fng
brooklyn
fortepan
opencontext
albertkahn
canadiana
nhm
wcma
mkg
unt
qagoma
manuscripts
upenn
singapore
balboa
ubc
egypt
rrn
huygens
newberry
mollondon
zeri
iabooks
mia
lacma
munch
mauritshuis
nationalmuseumse
colombia
csic
naturalis
ago
inaah
pem
nmaahc
nasm
whitney
nationalzoo
harvardmaps
gbiflit
npg
amsterdam
freersackler
estonia
historiska
louvread
```

---

## fetchAll() Call Inventory

Every call in the Promise.allSettled array in fetchAll(), in order.
fetchAll() is defined starting at line 4698 in index.html.
The Promise.allSettled array starts at line 4733.

| # | Source | Function called | Keyword variant | Line |
|---|---|---|---|---|
| 1 | wikimedia | fetchWikimedia() | keyword | 4736 |
| 2 | wikimedia | fetchWikimedia() | 'Featured_picture ' + keyword | 4737 |
| 3 | met | fetchMet() | keywords.join(' ') | 4738 |
| 4 | archive | fetchArchive() | altKeyword | 4739 |
| 5 | nasa | fetchNASA() | keyword | 4740 |
| 6 | inaturalist | fetchINaturalist() | keyword | 4741 |
| 7 | loc | fetchLOC() | keyword | 4742 |
| 8 | openlibrary | fetchOpenLibrary() | keyword | 4743 |
| 9 | chicago | fetchChicagoArt() | keyword | 4744 |
| 10 | cleveland | fetchCleveland() | keyword | 4745 |
| 11 | va | fetchVA() | keyword | 4746 |
| 12 | wikiart | fetchWikiArt() | keyword | 4747 |
| 13 | nordic | fetchNordicMuseum() | keyword | 4748 |
| 14 | flickr | fetchFlickrCommons() | keyword | 4749 |
| 15 | europeana | fetchEuropeana() | keyword | 4750 |
| 16 | europeana | fetchEuropeana() | alt2 (keywords[2]) | 4751 |
| 17 | europeana | fetchEuropeana() | keyword + ' fashion' | 4752 |
| 18 | europeana | fetchEuropeana() | keyword + ' textile costume' | 4753 |
| 19 | rijksmuseum | fetchRijksmuseum() | keyword | 4754 |
| 20 | harvard | fetchHarvard() | keyword | 4755 |
| 21 | smithsonian | fetchSmithsonian() | keyword | 4756 |
| 22 | pexels | fetchPexels() | keyword | 4757 |
| 23 | pixabay | fetchPixabay() | keyword | 4758 |
| 24 | getty | fetchGetty() | keyword | 4760 |
| 25 | nga | fetchNGA() | keyword | 4761 |
| 26 | gbif | fetchGBIF() | keyword | 4762 |
| 27 | eol | fetchEOL() | keyword | 4763 |
| 28 | apod | fetchAPOD() | keyword | 4764 |
| 29 | gallica | fetchGallica() | keyword | 4765 |
| 30 | chronicling | fetchChroniclingAmerica() | keyword | 4766 |
| 31 | openverse | fetchOpenverse() | keyword | 4767 |
| 32 | trove | fetchTrove() | keyword | 4768 |
| 33 | digitalnz | fetchDigitalNZ() | keyword | 4769 |
| 34 | bhl | fetchBHL() | keyword | 4770 |
| 35 | carnegie | fetchCarnegie() | keyword | 4771 |
| 36 | prado | fetchPrado() | keyword | 4772 |
| 37 | parismusees | fetchParisMusees() | keyword | 4773 |
| 38 | yale | fetchYale() | keyword | 4774 |
| 39 | picsum | fetchPicsum() | keyword | 4775 |
| 40 | usgs | fetchUSGS() | keyword | 4776 |
| 41 | cooperhewitt | fetchCooperHewitt() | keyword | 4777 |
| 42 | tate | fetchTate() | keyword | 4779 |
| 43 | finna | fetchFinna() | keyword | 4780 |
| 44 | soch | fetchSOCH() | keyword | 4781 |
| 45 | joconde | fetchJoconde() | keyword | 4782 |
| 46 | mnw | fetchMNW() | keyword | 4783 |
| 47 | tepapa | fetchTePapa() | keyword | 4784 |
| 48 | dpla | fetchDPLA() | keyword | 4785 |
| 49 | artsy | fetchArtsy() | keyword | 4786 |
| 50 | pas | fetchPAS() | keyword | 4787 |
| 51 | smg | fetchSMG() | keyword | 4788 |
| 52 | auckland | fetchAuckland() | keyword | 4789 |
| 53 | photogrammar | fetchPhotogrammar() | keyword | 4790 |
| 54 | wellcome | fetchWellcome() | keyword | 4791 |
| 55 | maas | fetchMAAS() | keyword | 4792 |
| 56 | smk | fetchSMK() | keyword | 4793 |
| 57 | thyssen | fetchThyssen() | keyword | 4794 |
| 58 | wdl | fetchLOC() → remapped to wdl | 'wdl ' + keyword | 4796–4798 |
| 59 | wikimedia | fetchWikimedia() | 'Artwork ' + keyword | 4800 |
| 60 | wikimedia | fetchWikimedia() | keyword + ' painting' | 4801 |
| 61 | walters | fetchWalters() | keyword | 4803 |
| 62 | princeton | fetchPrinceton() | keyword | 4804 |
| 63 | wikidata | fetchWikidata() | keyword | 4805 |
| 64 | noaa | fetchNOAA() | keyword | 4806 |
| 65 | hubble | fetchHubble() | keyword | 4807 |
| 66 | cornell | fetchCornell() | keyword | 4808 |
| 67 | folger | fetchFolger() | keyword | 4809 |
| 68 | onb | fetchONB() | keyword | 4810 |
| 69 | nypl | fetchNYPL() | keyword | 4811 |
| 70 | mak | fetchMAK() | keyword | 4812 |
| 71 | mna | fetchMNA() | keyword | 4813 |
| 72 | louvre | fetchJoconde() → remapped to louvre | keyword + ' Louvre' | 4815–4817 |
| 73 | rijksmuseum | fetchRijksmuseum() | keyword + ' drawing' | 4818 |
| 74 | rijksmuseum | fetchRijksmuseum() | keyword + ' print' | 4819 |
| 75 | bhl | fetchBHL() | 'illustrated ' + keyword | 4820 |
| 76 | smithsonian | fetchSmithsonian() | keyword + ' photograph' | 4821 |
| 77 | archive | fetchArchive() | keyword + ' visual art' | 4822 |
| 78 | wikimedia | fetchWikimedia() | keyword + ' filetype:bitmap' | 4823 |
| 79 | fitzwilliam | fetchFitzwilliam() | keyword | TBD |
| 80 | penn | fetchPenn() | keyword | TBD |
| 81 | acmi | fetchACMI() | keyword | TBD |
| 82 | nmm | fetchNMM() | keyword | TBD |
| 83 | ddb | fetchDDB() | keyword | TBD |
| 84 | fng | fetchFNG() | keyword | TBD |
| 85 | brooklyn | fetchBrooklyn() | keyword | TBD |
| 86 | fortepan | fetchFortepan() | keyword | TBD |
| 87 | opencontext | fetchOpenContext() | keyword | TBD |
| 88 | albertkahn | fetchAlbertKahn() | keyword | TBD |
| 89 | canadiana | fetchCanadiana() | keyword | TBD |
| 90 | nhm | fetchNHM() | keyword | TBD |
| 91 | wcma | fetchWCMA() | keyword | TBD |
| 92 | europeana | fetchEuropeanaDemo() | keyword (fires only when no europeana key set) | TBD |
| 93 | unt | fetchUNT() | keyword | TBD |
| 94 | qagoma | fetchQAGOMA() | keyword | TBD |
| 95 | upenn | fetchOPenn() | keyword | TBD |
| 96 | iabooks | fetchIABooks() | keyword | TBD |
| 97 | wikimedia | fetchWikimedia() | 'incategory:Photographs ' + keyword | TBD |
| 98 | mia | fetchMia() | keyword | TBD |
| 99 | lacma | fetchLACMA() | keyword | TBD |
| 100 | munch | fetchMunch() | keyword | TBD |
| 101 | mauritshuis | fetchMauritshuis() | keyword | TBD |
| 102 | nationalmuseumse | fetchNationalmuseumSE() | keyword | TBD |
| 103 | naturalis | fetchNaturalis() | keyword | TBD |
| 104 | nmaahc | fetchNMAAHC() | keyword | TBD |
| 105 | nasm | fetchNASM() | keyword | TBD |
| 106 | whitney | fetchWhitney() | keyword | TBD |
| 107 | nationalzoo | fetchNationalZoo() | keyword | TBD |
| 108 | gbiflit | fetchGBIFLiterature() | keyword | TBD |
| 109 | freersackler | fetchFreerSackler() | keyword | TBD |
| 110 | archive | fetchArchiveMaps() | keyword | TBD |
| 111 | openlibrary | fetchOpenLibrarySubjects() | keyword | TBD |
| 112 | ago | fetchAGO() | keyword | TBD |
| 113 | pem | fetchPEM() | keyword | TBD |
| 114 | npg | fetchNPG() | keyword | TBD |
| 115 | louvread | fetchLouvreAD() | keyword | TBD |
| 116 | met | fetchMet() | 'heilbrunn ' + keyword | TBD |
| 117 | nmaahc | fetchNMAAHC() | keyword + ' photograph' | TBD |
| 118 | cooperhewitt | fetchCooperHewitt() | keyword + ' textile pattern' | TBD |
| 119 | wikimedia | fetchWikimedia() | 'incategory:Drawings ' + keyword | TBD |
| 120 | wellcome | fetchWellcome() | keyword + ' illustration' | TBD |

Total: 120 parallel calls

Note: Entries 79–120 will receive exact line numbers after Part 3 implementation.

---

## CORS Risk Assessment

### High risk (may fail in some browsers/networks)

These sources return `[]` silently on CORS failure — no console warning is logged.
All use `withTimeout()` internally or are flagged `cors: true` in KEY_SOURCES.

- **prado** — Museo del Prado — withTimeout 5000ms, silent catch
- **parismusees** — Paris Musées — withTimeout 5000ms, GraphQL POST, silent catch
- **soch** — Swedish Heritage — withTimeout 5000ms, HTTP (not HTTPS) endpoint, silent catch
- **thyssen** — Thyssen-Bornemisza — withTimeout 5000ms, silent catch
- **folger** — Folger Shakespeare Library — withTimeout 6000ms, cors:true, silent catch
- **onb** — Austrian National Library — withTimeout 6000ms, cors:true, silent catch
- **mak** — MAK Vienna — withTimeout 6000ms, cors:true, silent catch
- **mna** — MNA Mexico — withTimeout 6000ms, cors:true, silent catch
- **fitzwilliam** — Fitzwilliam Museum — cors:true, silent catch
- **penn** — Penn Museum — cors:true, silent catch
- **nmm** — National Maritime Museum — cors:true, silent catch
- **ddb** — Deutsche Digitale Bibliothek — cors:true, silent catch
- **canadiana** — Canadiana Portal — cors:true, silent catch
- **mkg** — MKG Hamburg — CORS best-effort, silent catch
- **qagoma** — QAGOMA — cors:true, silent catch
- **manuscripts** — Manuscripta Mediaevalia — CORS best-effort, silent catch
- **upenn** — OPenn / UPenn Colenda — cors:true, silent catch
- **singapore** — National Library Singapore — CORS best-effort, silent catch
- **balboa** — Balboa Park Commons — CORS best-effort, silent catch
- **ubc** — UBC Open Collections — CORS best-effort, silent catch
- **egypt** — Meketre Repository — CORS best-effort, silent catch
- **rrn** — Reciprocal Research Network — CORS best-effort, silent catch
- **huygens** — Huygens Institute — CORS best-effort, silent catch
- **newberry** — Newberry Library — CORS best-effort, silent catch
- **mollondon** — Museum of London — CORS best-effort, silent catch
- **zeri** — Zeri Photo Archive — CORS best-effort, SPARQL endpoint, silent catch
- **lacma** — LACMA — CORS best-effort, silent catch
- **munch** — Munch Museum — CORS best-effort, silent catch
- **mauritshuis** — Mauritshuis — CORS best-effort, silent catch
- **ago** — Art Gallery of Ontario — CORS best-effort, silent catch
- **pem** — Peabody Essex Museum — CORS best-effort, silent catch
- **npg** — National Portrait Gallery London — CORS best-effort, silent catch
- **louvread** — Louvre Abu Dhabi — CORS best-effort, silent catch
- **colombia** — Museo Nacional Colombia — CORS best-effort, silent catch
- **csic** — CSIC Spain — CORS best-effort, silent catch
- **inaah** — Colección INAAH — CORS best-effort, silent catch
- **harvardmaps** — Harvard Map Collection — CORS best-effort, silent catch
- **amsterdam** — Amsterdam Museum — CORS best-effort (Adlib API), silent catch
- **estonia** — Art Museum of Estonia — CORS best-effort, silent catch
- **historiska** — Statens Historiska Museer — CORS best-effort, silent catch

### Medium risk (usually works, occasional failures)

These use `withTimeout()` but log a console warning on failure.

- **archive** — Internet Archive — withTimeout 5000ms, notes "CORS warnings from file://"
- **gallica** — Gallica BnF — withTimeout 5000ms
- **usgs** — USGS ScienceBase — withTimeout 5000ms
- **trove** — Trove NLA — withTimeout 5000ms
- **digitalnz** — DigitalNZ — withTimeout 5000ms
- **flickr** — Flickr Commons — withTimeout 5000ms
- **nordic** — Nordic Museum — withTimeout 5000ms
- **joconde** — Joconde / Louvre — withTimeout 8000ms (both calls, since louvre reuses joconde)

### Low risk (confirmed CORS, reliable)

All remaining sources use the standard signal without extra timeout wrapping and have confirmed CORS support or are same-origin-friendly public APIs.

Batch 1–4: wikimedia, met, nasa, inaturalist, loc, openlibrary, chicago, cleveland, va,
wikiart, europeana, rijksmuseum, harvard, smithsonian, pexels, pixabay,
getty, nga, gbif, eol, apod, chronicling, openverse, bhl, carnegie,
yale, picsum, cooperhewitt, tate, finna, mnw, tepapa, dpla, artsy,
pas, smg, auckland, photogrammar, wellcome, maas, smk, wdl,
walters, princeton, wikidata, noaa, hubble, cornell, nypl, louvre

Batch 6 (Low risk): acmi, fng, brooklyn, fortepan, opencontext,
albertkahn, nhm, wcma, unt, iabooks

Batch 7 (Low risk): mia, naturalis, nationalmuseumse, nmaahc, nasm,
whitney, nationalzoo, gbiflit, freersackler

---

## Batch History

### Batch 1 — Original build
wikimedia, met, archive, nasa, inaturalist, loc, openlibrary,
chicago, cleveland, va, wikiart, nordic, flickr, europeana,
rijksmuseum, harvard, smithsonian, pexels, pixabay

(19 unique sources)

### Batch 2 — First expansion
getty, nga, gbif, eol, apod, gallica, chronicling, openverse,
trove, digitalnz, bhl, carnegie, prado, parismusees, yale,
picsum, usgs, cooperhewitt

(18 unique sources)

### Batch 3 — Second expansion
tate, finna, soch, joconde, mnw, tepapa, dpla, artsy,
pas, smg, auckland, photogrammar, wellcome, maas, smk,
thyssen, wdl

(17 unique sources)

### Batch 4 — Third expansion
walters, princeton, wikidata, noaa, hubble, cornell,
folger, onb, nypl, mak, mna, louvre

(12 unique sources)

### Batch 5 — Fourth expansion
(No sources added yet)

### Batch 6 — Fifth expansion
fitzwilliam, penn, acmi, nmm, ddb, fng, brooklyn, fortepan,
opencontext, albertkahn, canadiana, nhm, wcma, mkg, unt,
qagoma, manuscripts, upenn, singapore, balboa, ubc, egypt,
rrn, huygens, newberry, mollondon, zeri, iabooks

(28 unique source IDs; fetchEuropeanaDemo and Wikimedia/Photographs
extra call reuse existing IDs and are not counted here)

### Batch 7 — Sixth expansion
mia, lacma, munch, mauritshuis, nationalmuseumse, colombia, csic,
naturalis, ago, inaah, pem, nmaahc, nasm, whitney, nationalzoo,
harvardmaps, gbiflit, npg, amsterdam, freersackler, estonia,
historiska, louvread

(23 unique source IDs; Heilbrunn/Met, CooperHewitt textiles,
Wellcome illustration, NMAAHC photographs, Wikimedia Drawings,
OpenLibrary Subjects, and Archive Maps extra calls reuse existing IDs
and are not counted here)

---

## Adding New Sources — Checklist

When adding a new source to InpoSearch, complete all of these:

- [ ] Add fetch function following standard contract
- [ ] Add to fetchAll() Promise.allSettled
- [ ] Update activeCallCount comment
- [ ] Add badge CSS class (.badge-{source})
- [ ] Add to createImageCard badge map
- [ ] Add to createImageCard label map
- [ ] Add to KEY_SOURCES array in keys panel
- [ ] Add to ALL_SOURCES constant
- [ ] Add to appropriate SOURCE_GROUPS
- [ ] Add to SOURCES.md registry
- [ ] Update API_CONTRACTS.md with response shape
- [ ] Update FEATURE_SPEC.md
- [ ] Test CORS in browser before deploying

---

## Sources Wishlist — To Add Next

Leave this section empty for now.
It will be populated as new sources are identified.

---
