# InspoSearch — Database & API Inventory

> **Audit date:** March 29, 2026  
> Sources are split into two sections:  
> **Part 1 — Currently connected** (hardcoded in `app.js` + `sources.manifest.json`)  
> **Part 2 — Potential additions** (researched, organized by country / category)  
> ⚠️ = requires outreach / subscription / commercial license

---

## Part 1 — Current Sources

### 1.1 Hardcoded Sources (`app.js` → `KEY_SOURCES`)

These are active fetch sources wired directly into the app.

| ID | Name | Country/Region | Category | Images | Key Required |
|----|------|---------------|----------|--------|--------------|
| `nasa` | NASA Images | USA | Space / History | 300k | No |
| `met` | The Metropolitan Museum of Art | USA | Art / Global | 400k | No |
| `wikimedia` | Wikimedia Commons | Global | All | 90M+ | No |
| `archive` | Internet Archive | Global | Historical / Ephemera | 20M+ | No |
| `inaturalist` | iNaturalist | Global | Nature / Biology | 50M+ | No |
| `loc` | Library of Congress | USA | Historical / Documents | 3M+ | No |
| `openlibrary` | Open Library | Global | Books / Covers | 10M+ | No |
| `chicago` | Art Institute of Chicago | USA | Art (CC0) | 50k | No |
| `cleveland` | Cleveland Museum of Art | USA | Art (CC0) | 64k | No |
| `va` | Victoria & Albert Museum | UK | Design / Fashion / Decorative Art | 1.2M | No |
| `wikiart` | WikiArt | Global | Art / Paintings | 250k | No |
| `nordic` | Nordic Museum (Nordiska museet) | Sweden | Design / Folk Art / Fashion | 100k | No |
| `flickr` | Flickr Commons | Global | Photography | 500k | No |
| `rijks` | Rijksmuseum | Netherlands | Dutch Masters / Art | 800k | No |
| `europeana` | Europeana | Europe | Cultural Heritage | 50M+ | Yes — free |
| `harvard` | Harvard Art Museums | USA | Art / Global | 250k | Yes — free |
| `smithsonian` | Smithsonian Institution | USA | Multi-museum | 4.5M | Optional — free |
| `pexels` | Pexels | Global | Contemporary Photography | 3.2M | Yes — free |
| `pixabay` | Pixabay | Global | Photos / Illustrations (CC0) | 2.7M | Yes — free |
| `getty` | Getty Museum | USA | Art | 150k | No |
| `nga` | National Gallery of Art | USA | Art / Open Access | 50k | No |
| `gbif` | GBIF Biodiversity | Global | Nature / Species | 2B+ obs. | No |
| `eol` | Encyclopedia of Life | Global | Species / Nature | 2M+ | No |
| `apod` | NASA APOD Archive | USA | Astronomy / Space | 10k | No |
| `gallica` | Gallica (Bibliothèque nationale de France) | France | Archives / Documents | 5M+ | No |
| `chronicling` | Chronicling America | USA | Historical Newspapers | 16M+ | No |
| `openverse` | Openverse (WordPress) | Global | Open-License Images | 800M+ | No |
| `bhl` | Biodiversity Heritage Library | Global | Natural History / Botanical | 60M pages | No |
| `carnegie` | Carnegie Museum of Art | USA | Art | 30k | No |
| `prado` | Museo del Prado | Spain | Art / Paintings | 17k | No (CORS via Wikidata) |
| `parismusees` | Paris Musées (14 Paris museums) | France | Art | 330k | No (CORS via Wikidata) |
| `yale` | Yale Center for British Art | USA | British Art (IIIF) | 60k | No |
| `picsum` | Lorem Picsum | Global | Texture / Abstract | 1k | No |
| `usgs` | USGS ScienceBase | USA | Geological / Aerial | 100k | No |
| `cooperhewitt` | Cooper Hewitt Design Museum | USA | Design | 200k | No (demo token) |
| `trove` | Trove (National Library of Australia) | Australia | Archives / Photos | 2M+ | Yes — free |
| `digitalnz` | DigitalNZ | New Zealand | Cultural Heritage | 30M | Yes — free |
| `tate` | Tate Collection | UK | Art / British | 77k | No |
| `finna` | Finnish Heritage (Finna) | Finland | Cultural Heritage | 10M+ | No |
| `soch` | Swedish Open Cultural Heritage (K-Samsök) | Sweden | Cultural Heritage | 1M+ | No (CORS) |
| `joconde` | Joconde / data.culture.gouv.fr | France | National Museum Database | 500k | No |
| `mnw` | Muzeum Narodowe Warszawa | Poland | Art | 100k | No |
| `tepapa` | Te Papa Tongarewa | New Zealand | Pacific / Māori | 100k | No |
| `pas` | Portable Antiquities Scheme | UK | Archaeology | 100k | No |
| `smg` | Science Museum Group | UK | Science / Technology / Medicine | 100k | No |
| `auckland` | Auckland War Memorial Museum | New Zealand | NZ / Pacific | 100k | No |
| `photogrammar` | Photogrammar / FSA-OWI | USA | Historical Photography | 170k | No |
| `wellcome` | Wellcome Collection | UK | Medicine / Science History | 250k | No |
| `maas` | Powerhouse Museum (MAAS) | Australia | Design / Technology / Decorative Art | 100k | No |
| `smk` | Statens Museum for Kunst (SMK) | Denmark | Art / National Gallery | 40k | No |
| `thyssen` | Museo Thyssen-Bornemisza | Spain | Art | 20k | No (CORS via Wikidata) |
| `dpla` | Digital Public Library of America | USA | Multi-institution | 50M+ | Yes — free |
| `ddb` | Deutsche Digitale Bibliothek (DDB) | Germany | Multi-institution (archives, art, history) | 44M | Yes — free |
| `artsy` | Artsy | Global | Contemporary Art Market | 1M+ | Yes — free (client_id + secret) |
| `walters` | Walters Art Museum | USA | Medieval / Renaissance | 27k | No |
| `princeton` | Princeton University Art Museum | USA | Ancient / Asian Art (IIIF) | 100k | No |
| `wikidata` | Wikidata | Global | Structured Data / Images | 90M items | No |
| `noaa` | NOAA | USA | Ocean / Weather / Coastal | 50k | No |
| `hubble` | Hubble Space Telescope | USA | Space | 10k | No |
| `cornell` | Cornell Digital Collections | USA | Botanical / Ornithology | 100k | No |
| `folger` | Folger Shakespeare Library | USA | Renaissance Manuscripts | 100k | No |
| `onb` | Österreichische Nationalbibliothek | Austria | Archives / Historical | 12M+ | No (CORS) |
| `nypl` | New York Public Library Digital | USA | Historical / Photos / Maps | 900k | No |
| `mak` | MAK Vienna (Museum of Applied Arts) | Austria | Design / Decorative Arts | 100k | No (CORS) |
| `louvre` | Louvre (via Joconde) | France | Art / Global | 480k | No |
| `mna` | Museo Nacional de Antropología | Mexico | Pre-Columbian / Indigenous | 50k | No (CORS) |
| `mia` | Minneapolis Institute of Art | USA | Art (CC0) | 50k | No |
| `lacma` | LACMA | USA | Art | 20k | No (CORS) |
| `munch` | Munch Museum | Norway | Art (Munch) | 28k | No (CORS) |
| `mauritshuis` | Mauritshuis | Netherlands | Dutch Masters | 800 | No (CORS) |
| `nationalmuseumse` | Nationalmuseum Stockholm | Sweden | Swedish Art | 6k | No (via Wikimedia) |
| `naturalis` | Naturalis Biodiversity Center | Netherlands | Natural History | 42M | No |
| `nmaahc` | NMAAHC (Smithsonian) | USA | African American History/Culture | 37k | No |
| `nasm` | National Air & Space Museum (Smithsonian) | USA | Aviation / Space | 65k | No |
| `whitney` | Whitney Museum | USA | American Art (CC0 CSV) | 25k | No |
| `nationalzoo` | National Zoo (Smithsonian) | USA | Animals / Nature | 10k | No |
| `gbiflit` | GBIF Literature | Global | Scientific Illustration | 500k | No |
| `freersackler` | Freer\|Sackler (Smithsonian) | USA | Asian / African Art | 40k | No |
| `ago` | Art Gallery of Ontario | Canada | Canadian / International Art | 100k | No (CORS) |
| `pem` | Peabody Essex Museum | USA | Asian Export / Maritime Art | 40k | No (CORS) |
| `npg` | National Portrait Gallery | UK | British Portraits | 215k | No (CORS) |
| `louvread` | Louvre Abu Dhabi | UAE | Cross-Cultural Art | 10k | No (CORS) |
| `unsplash` | Unsplash | Global | Contemporary Photography | 5M+ | Yes — free |
| `bodleian` | Bodleian Libraries (Oxford) | UK | Manuscripts / Maps / Rare Books | 400k | No (CORS, endpoint 404) |
| `bsb` | BSB Munich (Bayerische Staatsbibliothek) | Germany | Manuscripts / Maps / Incunabula | 1M | No (CORS, endpoint 404) |
| `cudl` | Cambridge Digital Library | UK | Manuscripts / Science | 200k | No (CORS, via Wikidata) |

---

### 1.2 Dynamic Registry Sub-Providers

Sub-providers loaded automatically via the parent API — no separate key needed beyond parent.

#### Europeana Country Providers
| ID | Name | Country |
|----|------|---------|
| `euro_rijksmuseum` | Rijksmuseum (Europeana mirror) | Netherlands |
| `euro_bne` | Biblioteca Nacional de España | Spain |
| `euro_kb` | Koninklijke Bibliotheek (KB Netherlands) | Netherlands |
| `euro_bn_pl` | Biblioteka Narodowa (National Library of Poland) | Poland |
| `euro_nkr` | Národní knihovna ČR (National Library of Czech Republic) | Czech Republic |
| `euro_nuk` | Digital Library of Slovenia | Slovenia |
| `euro_estonian` | Estonian National Museum | Estonia |
| `euro_lithuanian` | Lithuanian Central State Archives | Lithuania |
| `euro_latvian` | National Library of Latvia | Latvia |
| `euro_hungarian` | Országos Széchényi Könyvtár (Hungarian National Library) | Hungary |
| `euro_romanian` | Romanian National Library | Romania |
| `euro_bulgarian` | Bulgarian National Library | Bulgaria |

#### DPLA Regional Hub Providers
| ID | Name | Region (USA) |
|----|------|-------------|
| `dpla_california` | California Digital Library | California |
| `dpla_digital_commonwealth` | Digital Commonwealth | Massachusetts |
| `dpla_mountain_west` | Mountain West Digital Library | Utah/Nevada/Idaho |
| `dpla_minnesota` | Minnesota Digital Library | Minnesota |
| `dpla_michigan` | Michigan Digital Library | Michigan |
| `dpla_kentucky` | Kentucky Digital Library | Kentucky |
| `dpla_south_carolina` | South Carolina Digital Library | South Carolina |
| `dpla_texas` | Texas Digital Library | Texas |

---

### 1.3 Manifest Sources (`sources.manifest.json`, v2.0.0)

These are community-contributed sources with structured configs — some active, some broken/inactive.

| ID | Name | Active | Status |
|----|------|--------|--------|
| `bodleian` | Bodleian Libraries | ❌ | Endpoint 404 — migrated to IIIF only |
| `bsb` | BSB Munich | ❌ | Endpoint 404 — API path changed |
| `cudl` | Cambridge Digital Library | ✅ | Working (via Wikidata SPARQL) |
| `unsplash` | Unsplash | ✅ | Working (key required) |
| `heidelberg` | Heidelberg University Library | ❌ | Endpoint unverified |
| `kb_nl` | KB Netherlands | ❌ | Incorrect endpoint (Linked Data only) |
| `dpla_nypl` | DPLA / NYPL Hub | ❌ | Working but key required |
| `dpla_digital_commonwealth` | Digital Commonwealth (DPLA) | ❌ | Working but key required |
| `botanicus` | Botanicus (Missouri Botanical Garden) | ❌ | Domain unreachable |
| `david_rumsey` | David Rumsey Historical Maps | ✅ | Working |
| `museum_digital_smb` | SMB Berlin (museum-digital) | ✅ | Working |
| `museum_digital_nat` | museum-digital Deutschland | ✅ | Working |
| `museum_digital_westfalen` | museum-digital Westfalen | ✅ | Working |
| `museum_digital_rhineland` | museum-digital Rhineland | ✅ | Added Mar 2026 — REST JSON, ~80k items |
| `museum_digital_bawue` | museum-digital Baden-Württemberg | ✅ | Added Mar 2026 — REST JSON, ~100k items |
| `museum_digital_hamburg` | museum-digital Hamburg | ✅ | Added Mar 2026 — REST JSON, ~50k items |
| `museum_digital_sachsen` | museum-digital Sachsen | ✅ | Added Mar 2026 — REST JSON, ~70k items |
| `museum_digital_thueringen` | museum-digital Thüringen | ✅ | Added Mar 2026 — REST JSON, ~40k items |
| `museum_digital_hessen` | museum-digital Hessen | ✅ | Added Mar 2026 — REST JSON, ~60k items |
| `digital_commonwealth` | Digital Commonwealth | ✅ | Working (image URL fix applied) |
| `sketchfab_heritage` | Sketchfab Cultural Heritage (3D) | ✅ | Working |
| `wellcome_iiif` | Wellcome Collection (IIIF) | ✅ | Working |
| `met_iiif` | Metropolitan Museum (IIIF) | ✅ | Working |

---

### 1.4 Nightly CORS-Blocked Fetcher (`scripts/fetch-cors-blocked.js`)

These sources are fetched server-side (GitHub Actions at 2am UTC) and saved as static JSON in `insposearch/data/`. They cannot be queried live in the browser due to CORS restrictions.

| Source | Method | Notes |
|--------|--------|-------|
| Prado | Wikidata SPARQL | Direct API blocked by Cloudflare |
| Paris Musées | Wikidata SPARQL | Direct GraphQL requires auth token |
| Thyssen-Bornemisza | Wikidata SPARQL | Direct API returns 404 |
| Cambridge CUDL | Wikidata SPARQL | Direct API endpoint inaccessible |
| NHM London | CKAN Datastore API | Status: failing in `_index.json` |
| Wallace Collection | TBD | Status: failing in `_index.json` |
| Fitzwilliam Museum | TBD | Status: failing in `_index.json` |
| National Gallery London | Wikidata SPARQL (Q180788) | ✅ **FIXED** Mar 2026 — replaced broken REST with Wikidata bridge; ~3,995 images |
| Scottish National Gallery | Wikidata SPARQL (Q2051997) | ✅ **FIXED** Mar 2026 — replaced broken REST with Wikidata bridge; ~2,270 images |
| Musée d'Orsay | Wikidata SPARQL (Q23402) | Added Mar 2026 — Paris impressionism; ~2k images |
| Van Gogh Museum | Wikidata SPARQL (Q272671) | Added Mar 2026 — Amsterdam; ~750 images |
| Kunsthistorisches Museum Vienna | Wikidata SPARQL (Q95569) | Added Mar 2026 — Vienna; ~1k images |
| Belvedere Museum | Wikidata SPARQL (Q485700) | Added Mar 2026 — Vienna (Klimt); ~800 images |
| Städel Museum Frankfurt | Wikidata SPARQL (Q163804) | Added Mar 2026 — Frankfurt; ~1k images |
| Royal Museums Fine Arts Belgium | Wikidata SPARQL (Q2407552) | Added Mar 2026 — Brussels; ~1k images |
| Musée Guimet | Wikidata SPARQL (Q205963) | Added Mar 2026 — Paris Asian Arts; ~600 images |
| National Palace Museum Taipei | Wikidata SPARQL (Q673651) | Added Mar 2026 — Taiwan; ~800 images |
| **Musée Galliera (Palais Galliera)** | Wikidata SPARQL (Q1519002) | Added Mar 2026 — Paris couture/fashion; ~558 images |
| **Musée des Arts Décoratifs Paris** | Wikidata SPARQL (Q1319378) | Added Mar 2026 — fashion, design, jewellery; ~184 images |
| **Centraal Museum Utrecht** | Wikidata SPARQL (Q260913) | Added Mar 2026 — Dutch costume, fashion; ~2,180 images |
| **Textile Museum Tilburg** | Wikidata SPARQL (Q1421440) | Added Mar 2026 — Dutch textile art & fashion; ~1,337 images |
| **Nationaal Museum van Wereldculturen** | Wikidata SPARQL (Q510324) | Added Mar 2026 — world textiles, ethnographic dress; ~1,143 images |
| **Museum of Decorative Arts Prague** | Wikidata SPARQL (Q160236) | Added Mar 2026 — Czech textiles, fashion, glass; ~45,966 images |
| **Designmuseum Danmark** | Wikidata SPARQL (Q2628596) | Added Mar 2026 — Danish design, fashion, textiles; ~649 images |
| **Museum Boijmans Van Beuningen** | Wikidata SPARQL (Q574961) | Added Mar 2026 — Rotterdam applied art, fashion; ~375 images |
| **Museu Nacional do Traje** | Wikidata SPARQL (Q1142988) | Added Mar 2026 — Lisbon costume museum; ~161 images |
| **KMSKA (Royal Museum of Fine Arts Antwerp)** | Wikidata SPARQL (Q1471477) | Added Mar 2026 — Flemish & European art; ~2,860 images |
| **Amsterdam Museum** | Wikidata SPARQL (Q1820897) | Added Mar 2026 — Amsterdam art & history; ~2,315 images |
| **National Gallery of Ireland** | Wikidata SPARQL (Q2018379) | Added Mar 2026 — European & Irish art; ~1,845 images |
| **Fries Museum** | Wikidata SPARQL (Q848313) | Added Mar 2026 — Friesland art & history; ~1,155 images |
| **Groeningemuseum** | Wikidata SPARQL (Q1948674) | Added Mar 2026 — Flemish Primitives, Bruges; ~947 images |
| **Groninger Museum** | Wikidata SPARQL (Q1542668) | Added Mar 2026 — Art, design & history, Groningen; ~858 images |
| **Museum of Modern Art (MoMA)** | Wikidata SPARQL (Q188740) | Added Mar 2026 — Modern & contemporary art, NYC; ~659 images |
| **Rijksmuseum Twenthe** | Wikidata SPARQL (Q1505892) | Added Mar 2026 — European art, Enschede; ~568 images |
| **Herzog Anton Ulrich Museum** | Wikidata SPARQL (Q678082) | Added Mar 2026 — Old Masters, Braunschweig; ~261 images |
| **Galleria Palatina** | Wikidata SPARQL (Q866498) | Added Mar 2026 — Renaissance, Palazzo Pitti Florence; ~220 images |
| **Museum De Lakenhal** | Wikidata SPARQL (Q2098586) | Added Mar 2026 — Art & history of Leiden; ~178 images |
| **Teylers Museum** | Wikidata SPARQL (Q474563) | Added Mar 2026 — Oldest NL museum, art & science; ~161 images |
| **Alte Pinakothek** | Wikidata SPARQL (Q154568) | Added Mar 2026 — European painting 14th–18th c., Munich; ~160 images |
| **Musée du quai Branly** | Wikidata SPARQL (Q167863) | Added Mar 2026 — Non-Western art, Paris; ~154 images |

#### Phase H — 113 World Museum Collection Sources (added Mar 2026)

All use `makeCollectionFetcher()` factory → Wikidata SPARQL `wdt:P195` (collection) + `wdt:P18` (image).

**🇬🇧 United Kingdom (18)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| National Library of Wales | Q666063 | 18,707 |
| Royal Collection | Q1459037 | 4,984 |
| National Portrait Gallery London | Q238587 | 2,508 |
| Royal Museums Greenwich | Q7374509 | 2,264 |
| Walker Art Gallery | Q1536471 | 1,511 |
| Glasgow Museums | Q41661713 | 1,387 |
| Birmingham Museums Trust | Q4916759 | 1,293 |
| Ashmolean Museum | Q636400 | 1,257 |
| Sheffield Museums | Q7492669 | 1,187 |
| Manchester Art Gallery | Q2638817 | 1,069 |
| British Library | Q23308 | 1,064 |
| Bowes Museum | Q895434 | 1,013 |
| Norfolk Museums | Q55361621 | 859 |
| British Museum | Q6373 | 784 |
| Brighton Museum | Q2790574 | 735 |
| Bristol City Museum | Q4968867 | 720 |
| York Art Gallery | Q8055361 | 699 |
| Dulwich Picture Gallery | Q1241163 | 653 |

**🇳🇱 Netherlands (14)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| KB National Library | Q1526131 | 2,062 |
| Dordrechts Museum | Q2874177 | 934 |
| Bonnefanten Museum | Q892727 | 609 |
| Museum Rotterdam | Q2130225 | 515 |
| Kröller-Müller Museum | Q1051928 | 443 |
| Cuypershuis | Q15874141 | 401 |
| Kunstmuseum Den Haag | Q1499958 | 364 |
| Museum Gouda | Q4360916 | 354 |
| Mesdag Collection | Q255409 | 286 |
| Jewish Museum Amsterdam | Q702726 | 263 |
| Stedelijk Museum Alkmaar | Q4623539 | 255 |
| Museum De Waag | Q40304752 | 253 |
| Museum Catharijneconvent | Q1954426 | 219 |
| Maritime Museum Rotterdam | Q2755458 | 216 |

**🇧🇪 Belgium (11)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Musea Brugge | Q51674344 | 4,145 |
| Royal Library of Belgium | Q383931 | 1,788 |
| MSK Ghent | Q2365880 | 1,569 |
| Museum Plantin-Moretus | Q595802 | 1,323 |
| Mu.ZEE | Q1928672 | 681 |
| Royal Museums of Art & History | Q945059 | 295 |
| Middelheim Museum | Q2098074 | 231 |
| Museum Mayer van den Bergh | Q1699233 | 218 |
| Rubenshuis | Q775644 | 142 |
| Museum aan de Stroom | Q1646305 | 137 |
| Gallo-Roman Museum | Q1492516 | 137 |

**🇩🇪 Germany (18)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Bavarian State Painting Collections | Q812285 | 9,637 |
| Gemäldegalerie Berlin | Q165631 | 2,058 |
| Kunsthalle Karlsruhe | Q658725 | 1,342 |
| Germanisches Nationalmuseum | Q478695 | 1,049 |
| Kunstsammlungen Dresden | Q653002 | 868 |
| Wallraf-Richartz Museum | Q700959 | 800 |
| Augustiner Museum | Q542932 | 793 |
| Alte Nationalgalerie | Q162111 | 702 |
| Hamburger Kunsthalle | Q169542 | 478 |
| Lenbachhaus | Q262234 | 454 |
| Martin von Wagner Museum | Q1903282 | 430 |
| Hessen Kassel Heritage | Q1954840 | 422 |
| Kunstbibliothek Berlin | Q6445022 | 338 |
| Schnütgen Museum | Q950 | 332 |
| Staatsgalerie Stuttgart | Q14917275 | 264 |
| Berlinische Galerie | Q700222 | 245 |
| Westphalian State Museum | Q1798475 | 249 |
| Museum der bildenden Künste Leipzig | Q566661 | 211 |

**🇫🇷 France (12)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Musée Saint-Raymond | Q1376 | 1,741 |
| Museum of the History of France | Q3329787 | 966 |
| Palace of Versailles | Q2946 | 856 |
| Condé Museum | Q1236032 | 827 |
| Musée des Augustins | Q2711480 | 797 |
| Archives nationales | Q182542 | 750 |
| Musée des Beaux-Arts de Reims | Q3330225 | 549 |
| Musée National d'Art Moderne | Q1895953 | 523 |
| BnF | Q193563 | 499 |
| Musée des Beaux-Arts de Dijon | Q1955739 | 476 |
| Musée des Beaux-Arts de Strasbourg | Q1535963 | 468 |
| Museum of Grenoble | Q1952944 | 447 |

**🇮🇹 Italy (13)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Museo Egizio | Q19877 | 4,870 |
| Uffizi Gallery | Q51252 | 809 |
| Gallerie dell'Accademia Venice | Q338330 | 384 |
| Museo di Capodimonte | Q290549 | 253 |
| Naples Archaeological Museum | Q637248 | 242 |
| Pinacoteca di Brera | Q150066 | 220 |
| Capitoline Museums | Q333906 | 188 |
| Castelvecchio Museum | Q2518724 | 177 |
| Ca' Rezzonico | Q1052171 | 162 |
| Gallerie d'Italia Milan | Q2054135 | 153 |
| Galleria Borghese | Q841506 | 152 |
| Galleria Nazionale | Q2266081 | 137 |
| Pinacoteca di Bologna | Q1103550 | 123 |

**🇪🇸 Spain (7)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| MNAC Barcelona | Q861252 | 941 |
| Fine Arts Museum of Córdoba | Q6033943 | 311 |
| Víctor Balaguer Museum | Q526170 | 283 |
| National Archaeological Museum Spain | Q1352282 | 182 |
| Fine Arts Museum of Valencia | Q1748404 | 157 |
| Royal Academy of San Fernando | Q1322403 | 154 |
| Carmen Thyssen Museum | Q5043601 | 151 |

**🇸🇪 Sweden (5)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Swedish Performing Arts Museum | Q18448716 | 3,888 |
| National Museum of Science & Technology | Q177550 | 3,882 |
| National Portrait Gallery of Sweden | Q2817221 | 1,600 |
| Hallwyl Museum | Q4346239 | 627 |
| Gothenburg Museum of Art | Q1992004 | 456 |

**🇩🇰 Denmark (6)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Natural History Museum of Denmark | Q978464 | 539 |
| Nivaagaard Museum | Q10601378 | 240 |
| Skagens Museum | Q3555520 | 217 |
| Hirschsprung Collection | Q2982867 | 131 |
| Ny Carlsberg Glyptotek | Q1140507 | 125 |
| Frederiksborg Castle Museum | Q3078776 | 114 |

**🇦🇹 Austria (3)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Albertina | Q371908 | 315 |
| Liechtenstein Museum | Q1824069 | 183 |
| Leopold Museum | Q59435 | 101 |

**🇺🇸 USA (3)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Museum of Fine Arts Boston | Q49133 | 2,895 |
| Museum of Fine Arts Houston | Q1565911 | 714 |
| Fine Arts Museums of San Francisco | Q1416890 | 450 |

**Other Europe (3)**
| Source | QID | Est. Images |
|--------|-----|-------------|
| Hungarian National Gallery | Q252071 | 528 |
| Finnish National Gallery | Q2983474 | 2,692 |
| Bilbao Fine Arts Museum | Q127064 | 126 |

---

---

## Part 2 — Potential Additions

Organized by **category** then **country**. Entries without a public API are marked ⚠️ **outreach needed**.

---

### A. Fine Art Museums

#### 🇬🇧 United Kingdom
| Name | URL | Type | Notes |
|------|-----|------|-------|
| British Museum | `collection.britishmuseum.org/api` | REST JSON | 4M+ objects, global collection — API exists |
| National Gallery London | Wikidata SPARQL (Q180788) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `national_gallery_london` — ~3,995 images |
| Courtauld Gallery | `courtauld.ac.uk/gallery/collection` | Manual/IIIF | Post-Nov 2021 reopen; IIIF manifests available ⚠️ outreach |
| Ashmolean Museum (Oxford) | `collections.ashmolean.org` | LUNA REST | 300k objects — LUNA API endpoint needed |
| Fitzwilliam Museum Cambridge | `data.fitzmuseum.cam.ac.uk/api/v1` | REST JSON | Currently failing in nightly fetch — retry |
| Wallace Collection | `wallacelive.wallacecollection.org` | REST | Currently failing in nightly fetch — retry |
| Scottish National Gallery | Wikidata SPARQL (Q2051997) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `scottish_national` — ~2,270 images |
| Whitworth Gallery Manchester | `whitworth.manchester.ac.uk` | — | ⚠️ outreach needed |

#### �🇪 Ireland
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Gallery of Ireland | Wikidata SPARQL (Q2018379) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `ngi` — ~1,845 images |
| Irish Museum of Modern Art (IMMA) | `imma.ie` | — | ⚠️ outreach needed |
| Hugh Lane Gallery Dublin | `hughlane.ie` | — | ⚠️ outreach needed |

#### 🇺🇸 United States — Fine Art
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museum of Modern Art (MoMA) | Wikidata SPARQL (Q188740) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `moma_wd` — ~659 images |
| Getty Museum | `data.getty.edu` | REST JSON + LOD | LOD/SPARQL endpoint; also IIIF manifests |
| Solomon R. Guggenheim Museum | `guggenheim.org/collection` | — | ⚠️ outreach needed |
| Whitney Museum of American Art | `collection.whitney.org` | — | ⚠️ outreach needed |
| Philadelphia Museum of Art | `philamuseum.org` | REST JSON | Open data API documented |
| Detroit Institute of Arts | `dia.org/collection` | — | ⚠️ outreach needed |
| National Gallery of Art Washington | `api.nga.gov` | REST JSON | Open access API, 200k images |
| Brooklyn Museum | `api.brooklynmuseum.org` | REST JSON | API key required |
| San Francisco MOMA (SFMOMA) | `sfmoma.org/collection` | — | ⚠️ outreach needed |
| Carnegie Museum of Art | `collection.cmoa.org` | REST JSON | Open data; GitHub CSV/JSON |

#### �🇫🇷 France
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Musée d'Orsay | `musee-orsay.fr` | Wikidata / SPARQL | ✅ **CONNECTED** Mar 2026 via `musee_orsay` (Q23402) |
| Centre Pompidou | `collections.centrepompidou.fr` | REST JSON | Modern/contemporary art; public API documented |
| Musée des Arts Décoratifs (MAD Paris) | `madparis.fr` | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `arts_decoratifs` (Wikidata Q1319378) — fashion, design, decorative art |
| Musée du Quai Branly – Jacques Chirac | Wikidata SPARQL (Q167863) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `quai_branly` — ~154 images |
| Musée de Cluny (National Museum of the Middle Ages) | `data.culture.gouv.fr` | REST via Joconde | Medieval art — plausibly available via Joconde already |
| Musée Rodin | `musee-rodin.fr` | — | ⚠️ outreach needed |
| Musée Guimet (Asian Arts) | `guimet.fr` | Wikidata / SPARQL | ✅ **CONNECTED** Mar 2026 via `guimet` (Q205963) |
| Musée de l'Armée Paris | `data.culture.gouv.fr` | REST via Joconde | Arms/armor/military — possibly in Joconde already |

#### 🇮🇹 Italy
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Uffizi Gallery | `uffizi.it` | REST JSON | 3,000+ digitized works; beta API documented ⚠️ outreach for bulk |
| Borghese Gallery | `galleriaborghese.it` | — | ⚠️ outreach needed |
| Pinacoteca di Brera Milan | `pinacotecabrera.org` | — | ⚠️ outreach needed |
| Vatican Museums | `museivaticani.va` | — | Sistine Chapel, ancient sculpture ⚠️ outreach needed |
| MAXXI Rome (National Museum 21st Century Arts) | `maxxi.art` | — | ⚠️ outreach needed |
| Museo Egizio Turin | `museoegizio.it` | REST JSON | Egyptian collection; open data initiative |
| National Archaeological Museum Naples | `museoarcheologiconapoli.it` | — | ⚠️ outreach needed |
| Galleria Palatina (Palazzo Pitti, Florence) | Wikidata SPARQL (Q866498) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `galleria_palatina` — ~220 images |

#### 🇩🇪 Germany
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Städel Museum Frankfurt | `api.smb.museum` / `staedelmuseum.de` | REST JSON | ✅ **CONNECTED** Mar 2026 via `staedel` (Wikidata Q163804) |
| Alte Pinakothek Munich | Wikidata SPARQL (Q154568) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `alte_pinakothek` — ~160 images |
| Gemäldegalerie Berlin | `smb.museum` | museum-digital (SMB) | Already partially covered via `museum_digital_smb` |
| museum-digital Rhineland | `rheinland.museum-digital.de` | REST JSON | ✅ **CONNECTED** Mar 2026 via `museum_digital_rhineland` |
| museum-digital Baden-Württemberg | `bawue.museum-digital.de` | REST JSON | ✅ **CONNECTED** Mar 2026 via `museum_digital_bawue` |
| museum-digital Hamburg | `hamburg.museum-digital.de` | REST JSON | ✅ **CONNECTED** Mar 2026 via `museum_digital_hamburg` |
| museum-digital Sachsen | `sachsen.museum-digital.de` | REST JSON | ✅ **CONNECTED** Mar 2026 via `museum_digital_sachsen` |
| Herzog Anton Ulrich Museum (Braunschweig) | Wikidata SPARQL (Q678082) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `herzog_anton_ulrich` — ~261 images |
| Bauhaus-Archiv Berlin | `bauhaus.de/collection` | — | ⚠️ outreach needed |
| Kunsthalle Hamburg | `hamburger-kunsthalle.de` | — | ⚠️ outreach needed |

#### 🇳🇱 Netherlands
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Stedelijk Museum Amsterdam | `stedelijk.nl` | Linked Open Data | Contemporary/modern art; LOD endpoint |
| Van Gogh Museum | `vangoghmuseum.nl/api` | REST JSON | ✅ **CONNECTED** Mar 2026 via `vangogh_museum` (Wikidata Q272671) |
| Gemeentemuseum Den Haag | `gemeentemuseum.nl` | — | ⚠️ outreach needed |
| Amsterdam Museum | Wikidata SPARQL (Q1820897) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `amsterdam_museum` — ~2,315 images |
| Fries Museum (Leeuwarden) | Wikidata SPARQL (Q848313) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `fries_museum` — ~1,155 images |
| Groninger Museum | Wikidata SPARQL (Q1542668) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `groninger` — ~858 images |
| Rijksmuseum Twenthe (Enschede) | Wikidata SPARQL (Q1505892) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `rijksmuseum_twenthe` — ~568 images |
| Museum De Lakenhal (Leiden) | Wikidata SPARQL (Q2098586) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `lakenhal` — ~178 images |
| Teylers Museum (Haarlem) | Wikidata SPARQL (Q474563) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `teylers` — ~161 images |

#### 🇧🇪 Belgium
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Royal Museums of Fine Arts Belgium | `fine-arts-museum.be` | REST JSON | ✅ **CONNECTED** Mar 2026 via `rmfab` (Wikidata Q2407552) |
| KMSKA (Royal Museum of Fine Arts Antwerp) | Wikidata SPARQL (Q1471477) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `kmska` — ~2,860 images |
| Groeningemuseum (Bruges) | Wikidata SPARQL (Q1948674) | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `groeninge` — ~947 images |
| Musées Royaux d'Art et d'Histoire | `kmkg-mrah.be` | — | ⚠️ outreach needed |

#### 🇦🇹 Austria
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Kunsthistorisches Museum Vienna | `data.khi.museum` | JSON-LD / REST | ✅ **CONNECTED** Mar 2026 via `khm` (Wikidata Q95569) |
| Belvedere Museum Vienna | `digital.belvedere.at` | REST JSON | ✅ **CONNECTED** Mar 2026 via `belvedere` (Wikidata Q485700) |
| Albertina Vienna | `albertina.at` | — | ⚠️ outreach needed |

#### 🇪🇸 Spain
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museo Nacional Reina Sofía | `museoreinasofia.es` | Linked Open Data | Modern/contemporary; LOD endpoint exists |
| Guggenheim Bilbao | `guggenheim-bilbao.eus` | — | ⚠️ outreach needed |
| Museu Picasso Barcelona | `museupicasso.bcn.cat` | REST JSON | Open data; city of Barcelona catalogue |
| MNAC Barcelona | `museunacional.cat` | REST JSON | Catalan art and national collection |
| Museo de Bellas Artes Bilbao | `museobilbao.com` | — | ⚠️ outreach needed |

#### 🇷🇺 Russia
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Hermitage Museum | `hermitagemuseum.org` / `collections.hermitagemuseum.org` | REST/IIIF | 3M+ objects; limited public API — ⚠️ check current availability |
| Pushkin State Museum of Fine Arts | `arts-museum.ru` | — | ⚠️ outreach needed |
| State Tretyakov Gallery | `tretyakovgallery.ru` | — | Russian art ⚠️ outreach needed |

#### 🇨🇭 Switzerland
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Kunsthaus Zürich | `kunsthaus.ch` | — | ⚠️ outreach needed |
| Swiss Federal Archives | `bar.admin.ch` | REST JSON | Historical documents/photos — opendata.swiss |
| Musée d'Art et d'Histoire Geneva | `mah.ge.ch` | REST JSON | Available via opendata.swiss |

#### 🇸🇪 Sweden
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Moderna Museet | `modernamuseet.se` | — | Modern & contemporary art ⚠️ outreach |
| Historiska Museet | `historiska.se/api` | REST JSON | Swedish history & archaeology; API documented |

#### 🇩🇰 Denmark
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Designmuseum Danmark | `designmuseum.dk` | Wikidata SPARQL | ✅ **CONNECTED** Mar 2026 via `designmuseum_dk` (Wikidata Q2628596) |
| National Museum of Denmark | `natmus.dk/eng/collections` | REST JSON | Archaeology, Nordic history |

#### 🇳🇴 Norway
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Museum Norway | `nasjonalmuseet.no/api` | REST JSON | Newly opened Oslo museum; open API |
| Bergen Kunstmuseum | `bergenartmuseums.no` | — | ⚠️ outreach |
| **National Library of Norway** | `api.nb.no/catalog/v1/items` | REST JSON + IIIF | ✅ Confirmed working Mar 2026; 716k+ items, no API key required; IIIF manifests — note: many images carry `accessAllowedFrom: NORWAY` IP restriction, so public images only |

#### 🇫🇮 Finland
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Finnish National Gallery | `fng.fi/api` | REST JSON | Ateneum + Kiasma + Sinebrychoff — same as Finna but direct |
| Designmuseo Finland | `designmuseo.fi` | Part of Finna | May already be covered via `finna` |

#### 🇵🇱 Poland
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Muzeum Narodowe Kraków | `mnk.pl/collection-online` | REST JSON | Separate from Warsaw `mnw` |
| Muzeum Narodowe Gdańsk | `mng.gda.pl` | — | ⚠️ outreach |

#### 🇨🇿 Czech Republic
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Gallery Prague | `ngprague.cz` | — | ⚠️ outreach; part of Europeana via `euro_nkr` |

#### 🇵🇹 Portugal
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museu Nacional de Arte Antiga | `museuarteantiga.pt` | Wikidata SPARQL | Available via Wikidata bridge |
| Museu do Azulejo | `museudoazulejo.pt` | — | Tiles / decorative arts ⚠️ outreach |
| Museu Calouste Gulbenkian | `gulbenkian.pt` | REST JSON | Broad collection; public API discussed |

#### 🇬🇷 Greece
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Archaeological Museum Athens | `namuseum.gr/collections` | — | ⚠️ outreach needed |
| Benaki Museum | `collections.benaki.gr` | REST JSON | Greek cultural history; API published |

#### 🇭🇺 Hungary
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museum of Fine Arts Budapest | `szepmuveszeti.hu` | — | Old Masters, antiquities — ⚠️ outreach needed |
| Hungarian National Gallery | `mng.hu` | — | Hungarian art from medieval to contemporary ⚠️ outreach |

#### 🇷🇴 Romania
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Museum of Art of Romania | `mnar.arts.ro` | — | European & Romanian art ⚠️ outreach needed |

#### 🇹🇷 Turkey
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Istanbul Archaeological Museums | `istanbularkeoloji.gov.tr` | — | Antiquities & sculpture ⚠️ outreach |
| Sakıp Sabancı Museum | `sakipsabanciprimitiveart.org` | — | Ottoman calligraphy & painting ⚠️ outreach |
| Istanbul Modern | `istanbulmodern.org` | — | Contemporary Turkish art ⚠️ outreach |

#### 🇯🇵 Japan
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Tokyo National Museum | `webapi.tnm.jp` | REST JSON | 120k objects; open collection API |
| National Museum of Western Art Tokyo | `collection.nmwa.go.jp` | REST JSON | European art in Japan; open access |
| Kyoto National Museum | `www.kyohaku.go.jp` | — | Japanese art & archaeology ⚠️ outreach |
| MOA Museum of Art | `moaart.or.jp` | — | Japanese & East Asian art ⚠️ outreach |

#### 🇰🇷 South Korea
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Museum of Korea | `museum.go.kr/eng` | REST JSON | 340k objects; English API available |
| Leeum Museum of Art | `leeum.samsung` | — | Korean art & international ⚠️ outreach |
| National Museum of Modern and Contemporary Art (MMCA) | `mmca.go.kr` | — | ⚠️ outreach needed |

#### 🇨🇳 China
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Palace Museum Beijing (Forbidden City) | `dpm.org.cn` | — | 1.8M objects; limited external API ⚠️ outreach |
| Shanghai Museum | `shanghaimuseum.net` | — | Chinese art & antiquities ⚠️ outreach |

#### 🇮🇳 India
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Museum New Delhi | `nationalmuseumindia.gov.in` | — | Indian art, sculpture, decorative arts ⚠️ outreach |
| Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (Mumbai) | `csmvs.in` | — | Indian & international art ⚠️ outreach |
| National Gallery of Modern Art New Delhi | `ngmaindia.gov.in` | — | Modern Indian art ⚠️ outreach |

#### 🇨🇦 Canada
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Art Gallery of Ontario | `ago.ca/collection` | REST JSON | API for 120k artworks; open data |
| National Gallery of Canada | `gallery.ca` | — | ⚠️ outreach needed |
| Montreal Museum of Fine Arts | `mbam.qc.ca` | — | ⚠️ outreach needed |
| Royal Ontario Museum | `rom.on.ca` | REST JSON | Open data; cross-cultural collections |

#### 🇦🇺 Australia
| Name | URL | Type | Notes |
|------|-----|------|-------|
| National Gallery of Australia | `artsearch.nga.gov.au` | REST JSON | 166k works; public API |
| Art Gallery of New South Wales | `artgallery.nsw.gov.au` | REST JSON | Open data available |
| National Gallery of Victoria | `ngv.vic.gov.au` | REST JSON | Open access; 75k works |
| QAGOMA (Queensland) | `qagoma.qld.gov.au` | — | ⚠️ outreach needed |

#### 🇧🇷 Brazil
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museu de Arte de São Paulo (MASP) | `masp.org.br` | — | Major Latin American art museum ⚠️ outreach |
| Pinacoteca de São Paulo | `pinacoteca.org.br` | — | Brazilian art ⚠️ outreach |

#### 🇲🇽 Mexico
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Museo Nacional de Arte (MUNAL) | `munal.mx` | — | Mexican art from 16th c. to present ⚠️ outreach |
| Museo Frida Kahlo | `museofridakahlo.org.mx` | — | ⚠️ outreach needed |
| Museo Tamayo | `museotamayo.org` | — | Modern art ⚠️ outreach |

#### 🇿🇦 South Africa
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Iziko South African National Gallery | `iziko.org.za` | — | South African & African art ⚠️ outreach |
| Zeitz MOCAA Cape Town | `zeitzmocaa.museum` | — | Contemporary African art ⚠️ outreach |

#### 🇪🇬 Egypt
| Name | URL | Type | Notes |
|------|-----|------|-------|
| Grand Egyptian Museum (GEM) | `gem.gov.eg` | — | Ancient Egyptian collection ⚠️ planned opening |
| Egyptian Museum Cairo | `egyptianmuseum.gov.eg` | — | ⚠️ outreach needed |

---

### B. Fashion, Textile & Costume

> 9 fashion sources **newly connected** in March 2026 via Wikidata SPARQL bridges.
> Organized by region to help prioritize outreach.

#### ✅ Connected Fashion Sources

| Name | Country | ID | Notes |
|------|---------|-----|-------|
| **Victoria & Albert Museum** | UK | `va` | 1.2M objects — world's leading fashion/design collection |
| **Nordiska museet (Nordic Museum)** | Sweden | `nordic` | 100k — Scandinavian costume, textiles, folk dress |
| **Cooper Hewitt Design Museum** | USA | `cooperhewitt` | 200k — textiles, fashion, design |
| **MAK Vienna** | Austria | `mak` | 100k — applied arts, fashion, furniture |
| **Powerhouse Museum (MAAS)** | Australia | `maas` | 100k — fashion, technology, decorative art |
| **SMK Denmark** | Denmark | `smk` | 40k — includes design & applied arts |
| **Paris Musées** | France | `parismusees` | 330k — 14 Paris museums incl. Galliera |
| **LACMA** | USA | `lacma` | 20k — costume & textiles collection |
| **Met Costume Institute** | USA | `met` | 400k — filter by Costume Institute dept. |
| **Musée Galliera (Palais Galliera)** | France | `galliera` | ✅ **NEW** Mar 2026 — Paris couture museum, 558 images (Wikidata Q1519002) |
| **Musée des Arts Décoratifs** | France | `arts_decoratifs` | ✅ **NEW** Mar 2026 — fashion, jewellery, design, 184 images (Wikidata Q1319378) |
| **Centraal Museum Utrecht** | Netherlands | `centraal_museum` | ✅ **NEW** Mar 2026 — Dutch costume, art, 2,180 images (Wikidata Q260913) |
| **Textile Museum Tilburg** | Netherlands | `textile_museum_tilburg` | ✅ **NEW** Mar 2026 — Dutch textile art & fashion, 1,337 images (Wikidata Q1421440) |
| **Nationaal Museum van Wereldculturen** | Netherlands | `wereldculturen` | ✅ **NEW** Mar 2026 — world textiles, ethnographic dress, 1,143 images (Wikidata Q510324) |
| **Museum of Decorative Arts Prague** | Czech Republic | `dec_arts_prague` | ✅ **NEW** Mar 2026 — textiles, fashion, glass, **45,966 images** (Wikidata Q160236) |
| **Designmuseum Danmark** | Denmark | `designmuseum_dk` | ✅ **NEW** Mar 2026 — Danish design, fashion, 649 images (Wikidata Q2628596) |
| **Museum Boijmans Van Beuningen** | Netherlands | `boijmans` | ✅ **NEW** Mar 2026 — applied art, fashion, 375 images (Wikidata Q574961) |
| **Museu Nacional do Traje** | Portugal | `museu_traje` | ✅ **NEW** Mar 2026 — Lisbon costume museum, 161 images (Wikidata Q1142988) |

---

#### 🇺🇸 United States — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 1 | **The Museum at FIT** | `fitnyc.edu/museum` | Fashion Institute of Technology — no public API yet ⚠️ outreach |
| 2 | **Museum of Arts and Design (MAD) New York** | `madmuseum.org` | Contemporary craft & design ⚠️ outreach |
| 3 | **Textile Museum (George Washington University)** | `museum.gwu.edu` | Washington DC — 20k textiles spanning 5,000 years ⚠️ outreach |
| 4 | **Kent State University Museum** | `kent.edu/museum` | Shannon Rodgers & Jerry Silverman Fashion Archive — 40k garments ⚠️ outreach |
| 5 | **RISD Museum** | `risdmuseum.org/art/collection` | Providence RI — textiles & costume dept.; REST API available |
| 6 | **Philadelphia Museum of Art** | `philamuseum.org/collection` | Major costume & textile collection (30k objects); public API |
| 7 | **Boston Museum of Fine Arts** | `mfa.org/collections/textile-and-fashion-arts` | Textile & Fashion Arts dept.; API via data portal |
| 8 | **Indianapolis Museum of Art (Newfields)** | `discovernewfields.org` | Textile & Fashion Arts collection ⚠️ outreach |
| 9 | **Cincinnati Art Museum** | `cincinnatiartmuseum.org/art/explore-the-collection` | Open Access API — costume & textiles |
| 10 | **St. Louis Art Museum** | `slam.org` | Textile collection ⚠️ outreach |
| 11 | **Phoenix Art Museum** | `phxart.org/collection/fashion-design` | Fashion Design collection — 6k+ garments ⚠️ outreach |
| 12 | **FIDM Museum & Galleries** | `fidmmuseum.org` | Fashion Institute LA — 15k garments ⚠️ outreach |
| 13 | **Historic Deerfield** | `historic-deerfield.org` | Colonial-era American textiles & costume ⚠️ outreach |
| 14 | **Colonial Williamsburg Foundation** | `emuseum.history.org` | 18th-century American dress & textiles; REST API |
| 15 | **Condé Nast Archive** | `condenaststore.com` | Vogue editorial archive — ⚠️ commercial |
| 16 | **Vogue Archive (ProQuest)** | — | ⚠️ subscription/institutional |
| 17 | **Goldstein Museum of Design (UMN)** | `goldstein.design.umn.edu` | University of Minnesota — 34k apparel/textiles ⚠️ outreach |
| 18 | **Drexel Historic Costume Collection** | `drexel.edu/westphal/about/facilities/costume-collection` | Philadelphia — teaching collection ⚠️ outreach |

#### 🇨🇦 Canada — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 19 | **Bata Shoe Museum** | `batashoemuseum.ca` | Toronto — 14k footwear spanning 4,500 years ⚠️ outreach |
| 20 | **Royal Ontario Museum** | `rom.on.ca/en/collections-research/collections/textiles-costume` | 50k textiles & costume ⚠️ outreach |
| 21 | **McCord Museum** | `musee-mccord-stewart.ca` | Montreal — Canadian costume & dress collections; public API via open data |
| 22 | **Textile Museum of Canada** | `textilemuseum.ca` | Toronto — 15k textiles from 200+ regions ⚠️ outreach |
| 23 | **Costume Museum of Canada** | `costumemuseumcanada.com` | Winnipeg — Canadian dress history ⚠️ outreach |
| 24 | **Gardiner Museum** | `gardinermuseum.on.ca` | Toronto — ceramics & decorative arts ⚠️ outreach |

#### 🇬🇧 United Kingdom — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 25 | **Fashion Museum Bath** | `fashionmuseum.co.uk` | 100k+ garments; SPECTRUM system ⚠️ outreach |
| 26 | **William Morris Gallery** | `wmgallery.org.uk` | Pattern / decorative textiles; open access ⚠️ outreach |
| 27 | **Whitworth Gallery Manchester** | `whitworth.manchester.ac.uk` | Textiles & wallpapers collection ⚠️ outreach |
| 28 | **National Museum of Scotland** | `nms.ac.uk/explore-our-collections` | Scottish costume & textiles; API available |
| 29 | **Museum of London** | `collections.museumoflondon.org.uk` | Dress & textiles spanning Roman era to present ⚠️ outreach |
| 30 | **Gawthorpe Textiles Collection** | `gawthorpetextiles.org.uk` | Rachel Kay-Shuttleworth collection ⚠️ outreach |
| 31 | **Paisley Museum** | `paisley.is/museum` | Scottish paisley pattern heritage ⚠️ outreach |
| 32 | **Bowes Museum** | `thebowesmuseum.org.uk` | Textiles & fashion gallery ⚠️ outreach |
| 33 | **Berg Fashion Library** | — | ⚠️ subscription, Bloomsbury academic |

#### 🇫🇷 France — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 34 | **Musée de la Mode de Marseille** | `marseille.fr` | Château Borély — regional fashion ⚠️ outreach |
| 35 | **Cité de la Dentelle et de la Mode (Calais)** | `cite-dentelle.fr` | Lace & fashion museum ⚠️ outreach |
| 36 | **Musée des Tissus de Lyon** | `museedestissus.fr` | Lyon textile museum — one of world's largest textile collections (2.5M+ items) ⚠️ outreach |
| 37 | **Musée de l'Impression sur Étoffes (Mulhouse)** | `musee-impression.com` | Textile printing / fabric patterns ⚠️ outreach |
| 38 | **Musée de la Toile de Jouy (Jouy-en-Josas)** | `museedelatoiledejouy.fr` | Toile patterns & textile printing ⚠️ outreach |
| 39 | **Maison Chanel Patrimoine** | — | Private archive — ⚠️ commercial/outreach |
| 40 | **Yves Saint Laurent Museum Paris** | `museeyslparis.com` | 5,000 garments — ⚠️ outreach |
| 41 | **Yves Saint Laurent Museum Marrakech** | `museeyslmarrakech.com` | Berber textiles too ⚠️ outreach |
| 42 | **Christian Dior Museum (Granville)** | `musee-dior.com` | Couture archive ⚠️ outreach |

#### 🇮🇹 Italy — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 43 | **Museo della Moda e del Costume (Palazzo Pitti, Florence)** | `uffizi.it/en/pitti-palace/fashion-and-costume-museum` | Costume Gallery — 6,000+ garments from 18th C. onward ⚠️ outreach |
| 44 | **Museo del Tessuto (Prato)** | `museodeltessuto.it` | Textile museum — 7,000+ items from ancient to contemporary ⚠️ outreach |
| 45 | **Museo della Seta (Como)** | `museosetacomo.com` | Italian silk production history ⚠️ outreach |
| 46 | **Fondazione Antonio Ratti (Como)** | `fondazioneratti.org` | Textile art foundation — 3,500 fabrics ⚠️ outreach |
| 47 | **Armani/Silos (Milan)** | `armanisilos.com` | Giorgio Armani's fashion archive ⚠️ outreach |
| 48 | **Stibbert Museum (Florence)** | `museostibbert.it` | Arms, armor, historical dress ⚠️ outreach |
| 49 | **Museo del Tessile (Busto Arsizio)** | `museobusto.it` | Industrial textile heritage ⚠️ outreach |
| 50 | **Salvatore Ferragamo Museum (Florence)** | `ferragamo.com/museo` | Footwear & fashion heritage ⚠️ outreach |
| 51 | **Gucci Garden / Gucci Archive (Florence)** | `gucci.com/us/en/st/gucci-garden` | Fashion archive exhibitions ⚠️ outreach |

#### 🇩🇪 Germany — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 52 | **Deutsches Textilmuseum Krefeld** | `krefeld.de/de/deutsches-textilmuseum` | 30k textiles from 3,000+ years ⚠️ outreach |
| 53 | **Kunstgewerbemuseum Berlin** | `smb.museum/museen-einrichtungen/kunstgewerbemuseum` | Fashion gallery — major costume collection ⚠️ outreach |
| 54 | **Germanisches Nationalmuseum** | `gnm.de` | Nuremberg — historical costume/textiles ⚠️ outreach |
| 55 | **Museum für Kunst und Gewerbe Hamburg** | `mkg-hamburg.de` | Fashion & textile department; linked data API |
| 56 | **Bayerisches Nationalmuseum Munich** | `bayerisches-nationalmuseum.de` | Historical Bavarian costume/textiles ⚠️ outreach |
| 57 | **Lippisches Landesmuseum Detmold** | `lippisches-landesmuseum.de` | Textile / folk costume ⚠️ outreach |

#### 🇧🇪 Belgium — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 58 | **MoMu Antwerp (ModeMuseum)** | `momu.be` | Flemish fashion archive — major Antwerp designers ⚠️ outreach |
| 59 | **Modemuseum Hasselt** | `modemuseumhasselt.be` | Belgian fashion & costume ⚠️ outreach |

#### 🇳🇱 Netherlands — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 60 | **Gemeentemuseum Den Haag (Kunstmuseum)** | `kunstmuseum.nl` | Fashion collection incl. Mondrian ⚠️ outreach |
| 61 | **Museum Rijswijk** | — | Historic Dutch fashion/decorative arts ⚠️ outreach |
| 62 | **Fries Museum (Leeuwarden)** | `friesmuseum.nl` | Frisian costume & textiles ⚠️ outreach |

#### 🇪🇸 Spain — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 63 | **Museo del Traje (Madrid)** | `mecd.gob.es/museodetraje` | Spanish national costume museum — 28k items ⚠️ outreach |
| 64 | **Museu del Disseny de Barcelona** | `museudeldisseny.cat` | Fashion, design, decorative arts; open data |
| 65 | **Centre de Documentació i Museu Tèxtil (Terrassa)** | `cdmt.cat` | Catalan textile heritage ⚠️ outreach |
| 66 | **Cristóbal Balenciaga Museoa (Getaria)** | `cristobalbalenciagamuseoa.com` | Basque Country — couture archive ⚠️ outreach |

#### 🇨🇭 Switzerland — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 67 | **Textilmuseum St. Gallen** | `textilmuseum.ch` | Swiss embroidery & lace center — 50k+ items ⚠️ outreach |
| 68 | **Swiss Museum of Design (Museum für Gestaltung Zürich)** | `museum-gestaltung.ch` | Fashion wing ⚠️ outreach |

#### 🇸🇪 🇫🇮 🇳🇴 Scandinavia — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 69 | **Röhsska Museum of Design and Craft** | `rohsska.se` | Gothenburg — fashion, textiles, applied arts ⚠️ outreach |
| 70 | **Etnografiska museet (Stockholm)** | `etnografiska.se` | Ethnographic textiles/world costumes — via SOCH |
| 71 | **Finnish National Costume Centre** | — | Traditional Finnish dress/textiles |
| 72 | **Norwegian Museum of Decorative Arts (NKIM)** | now merged into Nasjonalmuseet | Oslo — decorative arts & fashion |

#### 🇵🇱 🇨🇿 🇭🇺 Central Europe — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 73 | **Muzeum Włókiennictwa (Central Museum of Textiles, Łódź)** | `muzeumwlokiennictwa.pl` | Major Polish textile center ⚠️ outreach |
| 74 | **Muzeum Narodowe w Krakowie** | `mnk.pl` | Costume & textile department ⚠️ outreach |
| 75 | **Iparművészeti Múzeum (Museum of Applied Arts, Budapest)** | `imm.hu` | Hungarian applied arts & textiles ⚠️ outreach |
| 76 | **National Museum of Slovenia** | `nms.si` | Slovenian costume & ethnographic dress ⚠️ outreach |
| 77 | **Museum of Applied Art, Belgrade** | `mpu.rs` | Serbian decorative arts & textiles ⚠️ outreach |

#### 🇬🇷 🇹🇷 Southeast Europe — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 78 | **Benaki Museum (Athens)** | `collections.benaki.gr` | Greek costume & textiles; REST API |
| 79 | **Peloponnesian Folklore Foundation (Nafplio)** | `pli.gr` | Greek regional costume ⚠️ outreach |
| 80 | **Topkapi Palace Museum** | `topkapisarayi.gov.tr` | Ottoman textiles & imperial robes ⚠️ outreach |
| 81 | **Turkish and Islamic Arts Museum** | `tiem.gov.tr` | Anatolian carpets & textiles ⚠️ outreach |

#### 🇯🇵 Japan — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 82 | **Kyoto Costume Institute (KCI)** | `kci.or.jp/archives/digital_archives` | 15k garments 17th-century–present ⚠️ outreach |
| 83 | **Bunka Gakuen Costume Museum** | `museum.bunka.ac.jp` | Tokyo — historical costume collection ⚠️ outreach |
| 84 | **National Museum of Japanese History** | `rekihaku.ac.jp` | Sakura — historical Japanese dress ⚠️ outreach |
| 85 | **Nishijin Textile Center (Kyoto)** | `nishijin.or.jp` | Kyoto silk weaving ⚠️ outreach |

#### 🇨🇳 China — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 86 | **China National Silk Museum (Hangzhou)** | `chinasilkmuseum.com` | National silk & textile heritage ⚠️ outreach |
| 87 | **Shanghai Museum of Textile and Costume** | — | Shanghai textile/fashion history ⚠️ outreach |
| 88 | **Suzhou Silk Museum** | — | Chinese silk production heritage ⚠️ outreach |

#### 🇰🇷 South Korea — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 89 | **Korea Craft & Design Foundation** | `kcdf.kr` | Korean traditional textiles & modern craft ⚠️ outreach |
| 90 | **National Folk Museum of Korea** | `nfm.go.kr` | Hanbok & traditional Korean dress; REST API |
| 91 | **Seok Juseon Memorial Museum (Dankook Univ.)** | — | Korean costume history ⚠️ outreach |

#### 🇮🇳 India — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 92 | **Calico Museum of Textiles (Ahmedabad)** | `calicomuseum.org` | World-class Indian textile collection ⚠️ outreach |
| 93 | **National Museum New Delhi** | `nationalmuseumindia.gov.in` | Indian textiles & costume gallery ⚠️ outreach |
| 94 | **Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (Mumbai)** | `csmvs.in` | Indian textile arts ⚠️ outreach |
| 95 | **Weavers' Service Centre (India, various cities)** | — | Living tradition handloom ⚠️ outreach |
| 96 | **National Institute of Fashion Technology (NIFT)** | `nift.ac.in` | Resource centers & archives ⚠️ outreach |

#### 🇲🇾 🇮🇩 🇸🇬 Southeast Asia — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 97 | **Islamic Arts Museum Malaysia (Kuala Lumpur)** | `iamm.org.my` | Malay textiles, batik, ikat ⚠️ outreach |
| 98 | **National Museum Singapore** | `nationalmuseum.sg` | Peranakan fashion & Southeast Asian textiles ⚠️ outreach |
| 99 | **Museum Tekstil Jakarta** | — | Indonesian batik & textile heritage ⚠️ outreach |

#### 🇦🇺 🇳🇿 Oceania — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 100 | **National Gallery of Victoria (NGV)** | `ngv.vic.gov.au/explore/collection` | Fashion & textiles collection; open API |
| 101 | **Auckland War Memorial Museum** | `aucklandmuseum.com` | Pacific textile & tapa cloth collection; already connected via `auckland` |

#### 🇲🇦 🇪🇬 🇰🇪 Africa & Middle East — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 102 | **Sadu House (Kuwait)** | `alsadu.org.kw` | Bedouin weaving traditions ⚠️ outreach |
| 103 | **Musée des Civilisations Noires (Dakar)** | — | Senegalese & pan-African textiles ⚠️ outreach |
| 104 | **National Museum of Ethiopia** | — | Ethiopian textiles & traditional dress ⚠️ outreach |
| 105 | **Nairobi National Museum** | `museums.or.ke` | Kenyan textiles & ethnographic costume ⚠️ outreach |

#### 🇧🇷 🇦🇷 🇨🇱 🇲🇽 Latin America — Fashion Sources

| # | Name | URL | Notes |
|---|------|-----|-------|
| 106 | **Museo de la Moda (Santiago, Chile)** | `museodelamoda.cl` | Latin American fashion history ⚠️ outreach |
| 107 | **Museo del Traje (Buenos Aires)** | — | Argentine costume & textile heritage ⚠️ outreach |
| 108 | **Museu da Moda Brasileira (FAAP, São Paulo)** | — | Brazilian fashion history ⚠️ outreach |
| 109 | **Museo Textil de Oaxaca (Mexico)** | `museotextildeoaxaca.org` | Oaxacan indigenous textiles; exh. archive ⚠️ outreach |
| 110 | **Museo Nacional de Artes Populares (Mexico City)** | — | Mexican folk textile traditions ⚠️ outreach |

#### 🌐 Global / Online Fashion Archives

| # | Name | URL | Notes |
|---|------|-----|-------|
| 111 | **Europeana Fashion** | `europeana.eu/portal/en/collections/fashion` | Already accessible via `europeana` — filter fashion portal |
| 112 | **Google Arts & Culture — Fashion** | `artsandculture.google.com/category/fashion` | Aggregates fashion collections from partners ⚠️ institutional |
| 113 | **Internet Archive — Fashion Plates** | `archive.org` | Historical fashion plate collections — accessible via `archive` |
| 114 | **Wikimedia Commons — Fashion category** | `commons.wikimedia.org/wiki/Category:Fashion` | Already via `wikimedia` |
| 115 | **Open Fashion Archive** | `openfashionarchive.org` | Emerging open-access fashion platform ⚠️ outreach |

---

### C. Design, Applied Arts & Decorative Arts

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Vitra Design Museum** | Germany | `design-museum.de` | Furniture / industrial design ⚠️ outreach |
| **Design Museum London** | UK | `designmuseum.org` | — ⚠️ outreach |
| **Design Museum Copenhagen** | Denmark | `designmuseum.dk` | Same as Designmuseum Danmark |
| **Musée des Arts Décoratifs (MAD Paris)** | France | `madparis.fr` | Already noted above |
| **Cranbrook Art Museum** | USA | `cranbrookartmuseum.org` | — ⚠️ outreach |
| **Museum of Design Atlanta (MODA)** | USA | `museumofdesign.org` | — ⚠️ outreach |
| **Design Exchange Toronto** | Canada | `dx.org` | — ⚠️ outreach |
| **Norwegian Museum of Decorative Arts and Design** | Norway | `nationalmuseet.no/en` | Now merged into National Museum Norway |
| **Designmuseo Helsinki** | Finland | `designmuseo.fi` | Via Finna |
| **Kunstindustrimuseet Oslo** | Norway | merged into National Museum | |
| **Röhsska Museum of Design** | Sweden | `rohsska.se` | ⚠️ outreach |
| **Swiss Museum of Design** | Switzerland | `museum-gestaltung.ch` | — ⚠️ outreach |
| **Museum für Kunst und Gewerbe Hamburg** | Germany | `mkg-hamburg.de` | REST API (linked data) |
| **Badisches Landesmuseum Karlsruhe** | Germany | `landesmuseum.de` | museum-digital compatible |
| **Musée des Arts et Métiers Paris** | France | `arts-et-metiers.net` | Technology / design history via data.culture.gouv.fr |
| **Museum Boijmans Van Beuningen** | Netherlands | `boijmans.nl/en/collection` | ✅ **CONNECTED** Mar 2026 via `boijmans` (Wikidata Q574961) — applied art, fashion, design |
| **Israel Museum** | Israel | `imj.org.il/en/collections` | REST JSON; includes Judaica & ceramics |

---

### D. Architecture & Urban Heritage

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Avery Index to Architectural Periodicals** | USA | `avery.columbia.edu` | Columbia University — ⚠️ subscription |
| **RIBA Architecture Library** | UK | `architecture.com/image-library` | 1.3M images ⚠️ outreach / commercial |
| **Chicago Architecture Center** | USA | `architecture.org` | — ⚠️ outreach |
| **Frank Lloyd Wright Foundation** | USA | `franklloydwright.org` | open archive access in progress ⚠️ outreach |
| **Archinform** | Germany | `archinform.net/rest` | REST API — global buildings database |
| **Open Buildings (Google)** | Global | `sites.research.google/open-buildings` | Satellite building footprints |
| **Aga Khan Trust for Culture** | Switzerland/Global | `agakhantrustforculture.org` | ⚠️ outreach |
| **World Monuments Fund** | USA | `wmf.org` | Built heritage photography ⚠️ outreach |
| **Medieval Heritage** | EU | `medievalheritage.eu` | Romanesque monument photos |
| **Historic England Archive** | UK | `historicengland.org.uk/images-books/archive` | REST API available — English Heritage |

---

### E. Photography (Stock & Editorial)

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Burst (Shopify)** | Canada | `burst.shopify.com/api` | Free stock photos, CC0 — simple API |
| **Stocksnap.io** | USA | `stocksnap.io` | CC0 stock — no formal API yet ⚠️ outreach |
| **Reshot** | Global | `reshot.com` | Free editorial — ⚠️ outreach |
| **Nappy (diverse stock)** | USA | `nappy.co` | Diverse stock photography — ⚠️ outreach |
| **rawpixel** | USA | `rawpixel.com/services/api` | Freemium; vintage + contemporary — API available |
| **Magnum Photos** | France/USA | `magnumphotos.com` | Photojournalism archive — ⚠️ commercial outreach |
| **Corbis / Bettmann Archive (Getty Images)** | USA | `gettyimages.com/api` | Historical editorial — ⚠️ commercial |
| **Associated Press Images** | USA | `apimages.com` | News photography — ⚠️ commercial |
| **DPA Picture Alliance** | Germany | `picture-alliance.com` | German news photography ⚠️ commercial |
| **Bridgeman Images** | UK/USA | `bridgemanimages.com` | Art reproduction — ⚠️ commercial outreach |
| **AKG Images** | Germany | `akg-images.com` | Art, history, culture — ⚠️ commercial |
| **500px** | USA | `api.500px.com/v1` | — ⚠️ deprecated; check status |
| **EyeEm** | Germany | `api.eyeem.com` | AI-tagged photography — ⚠️ check availability |
| **Alamy** | UK | `alamy.com/api` | Large stock library — ⚠️ commercial |

---

### F. Contemporary Art & Galleries

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Artsy** | USA | already connected via `artsy` | — |
| **Saatchi Art** | UK/USA | `saatchiart.com/api` | Contemporary art marketplace — ⚠️ outreach |
| **ArtStation** | Canada | `artstation.com/api/v2` | — Professional digital art |
| **DeviantArt** | USA | `www.deviantart.com/developers` | Community art — OAuth API |
| **Behance (Adobe)** | USA | `behance.net/dev` | Design / creative portfolio — API available |
| **Dribbble** | USA | `dribbble.com/api` | UI / graphic design — API available |
| **Galeries Lafayette / Foundation d'entreprise** | France | — | ⚠️ outreach |
| **Gagosian Gallery** | USA/Global | — | ⚠️ outreach |
| **Hauser & Wirth** | Switzerland/Global | — | ⚠️ outreach |
| **White Cube** | UK | — | ⚠️ outreach |
| **Pace Gallery** | USA | — | ⚠️ outreach |
| **Serpentine Galleries** | UK | `serpentinegalleries.org` | ⚠️ outreach |
| **ICA London** | UK | `ica.art` | ⚠️ outreach |
| **Google Arts & Culture** | Global | `artsandculture.google.com/partner` | Partner access for institutions — ⚠️ institutional outreach |

---

### G. Natural History, Botanical & Biology

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Natural History Museum London (NHM)** | UK | `data.nhm.ac.uk/api/3` | CKAN API — currently failing in nightly fetch, fix and retry |
| **American Museum of Natural History (AMNH)** | USA | `digitalgallery.amnh.org` | Research collections — ⚠️ outreach |
| **Field Museum Chicago** | USA | `fieldmuseum.org/field-museum-natural-history` | iDigBio compatible |
| **California Academy of Sciences** | USA | `calacademy.org/scientists/research-collections` | API via iDigBio |
| **Kew Royal Botanic Gardens** | UK | `bie.ala.org.au/ws` / `powo.science.kew.org/api/2` | Plants of the World Online API |
| **Atlas of Living Australia (ALA)** | Australia | `api.ala.org.au` | iNaturalist-compatible REST |
| **iDigBio** | USA | `api.idigbio.org/v2` | Digitized natural history collections — API available |
| **Catalogue of Life (CoL)** | Global | `api.catalogueoflife.org` | Species names + images |
| **DiSSCo** | Europe | `sandbox.dissco.tech` | EU natural history collections |
| **Edinburgh Royal Botanic Garden** | UK | `rbge.org.uk/science-and-conservation/herbarium` | ⚠️ outreach |
| **Botanical illustrations — JSTOR Global Plants** | USA | `plants.jstor.org` | Type specimen images ⚠️ subscription — some open |
| **Real Jardín Botánico Madrid** | Spain | `rjb.csic.es` | ⚠️ outreach |
| **NHM Paris (MNHN)** | France | `science.mnhn.fr/institution/mnhn` | REST+JSON via MNHN collection portal |
| **Muséum national d'Histoire naturelle** | France | `coldb.mnhn.fr/api` | Collections database API |

---

### H. Space & Astronomy

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **ESA (European Space Agency)** | Europe | `images.esa.int` | Public REST API |
| **ESO (European Southern Observatory)** | Chile/Germany | `eso.org/public/news/eso-api` | REST + image resources |
| **ALMA Observatory** | Chile | `almascience.eso.org` | Radio astronomy images — limited |
| **Chandra X-Ray Observatory** | USA | `chandra.harvard.edu` | X-Ray astronomy images — ⚠️ outreach for bulk |
| **NOIRLab (NOAO)** | USA | `noirlab.edu/public/images` | Optical/IR observatory archive; public API |
| **STScI (James Webb + Hubble)** | USA | `esawebb.org/images` | JWST images — REST API available |
| **SOHO/NASA Solar** | USA/EU | `soho.nascom.nasa.gov` | Solar imagery |

---

### I. Earth Science, Maps & Remote Sensing

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Copernicus Open Access Hub (ESA)** | Europe | `scihub.copernicus.eu/apihub` | Sentinel satellite imagery — API available |
| **NASA Earthdata** | USA | `earthdata.nasa.gov` | Satellite imagery — REST/CMR API |
| **Old Maps Online** | UK | `oldmapsonline.org` | Aggregates historical map collections |
| **National Library of Scotland Maps** | UK | `maps.nls.uk/api` | REST API, historical Scotland + UK |
| **Rumsey Historical Maps** | USA | already connected via `david_rumsey` | |
| **Stamen Maps / Stadia** | USA | `stamen.com` | Artistic map tile styles |
| **Ordnance Survey** | UK | `api.os.uk` | UK mapping — API available |

---

### J. Indigenous, Non-Western & World Cultures

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **National Museum of the American Indian (NMAI)** | USA | `americanindian.si.edu` | Via Smithsonian — filter needed |
| **AIATSIS (Aboriginal and Torres Strait Islander Studies)** | Australia | `aiatsis.gov.au/explore/collections` | ⚠️ outreach — some content restricted |
| **Canadian Museum of History** | Canada | `historymuseum.ca` | REST JSON API documented |
| **Museum of Anthropology UBC** | Canada | `moa.ubc.ca/research/collections-access` | ⚠️ outreach |
| **Museum of Islamic Art Doha** | Qatar | `mia.org.qa` | ⚠️ outreach |
| **Arab Image Foundation** | Lebanon | `arabimagefo.com` | Photography archive ⚠️ outreach |
| **Aga Khan Museum** | Canada | `agakhanmuseum.org` | Islamic / Central Asian art ⚠️ outreach |
| **Fowler Museum UCLA** | USA | `fowler.ucla.edu` | African, Asian, Pacific, Native American art ⚠️ outreach |
| **Victoria Memorial Calcutta** | India | `victoriamemorial-cal.org` | ⚠️ outreach |
| **National Museum of India** | India | `nationalmuseumindia.gov.in` | ⚠️ outreach |
| **Africa Media Online** | South Africa | `africamediaonline.com` | Photography archive ⚠️ commercial |
| **South African National Gallery** | South Africa | `iziko.org.za/museums/south-african-national-gallery` | ⚠️ outreach |
| **Museum of Anthropology Xiamen** | China | — | ⚠️ outreach |

---

### K. East Asian & Pacific Collections

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **ColBase (Japan)** | Japan | `colbase.nich.go.jp` | National Institutes for Cultural Heritage — REST API |
| **e-Museum Japan** | Japan | `emuseum.nich.go.jp` | Portal for national museums consortium |
| **Tokyo National Museum** | Japan | `webarchives.tnm.jp/api` | REST API |
| **Kyoto National Museum** | Japan | — | ⚠️ outreach; partially in ColBase |
| **National Museum of Modern Art Tokyo (MoMAT)** | Japan | — | ⚠️ outreach |
| **National Palace Museum Taipei** | Taiwan | `digitalarchive.npm.gov.tw/api` | REST + IIIF API; 700k objects |
| **Palace Museum Beijing (Forbidden City)** | China | `en.dpm.org.cn` | Limited digital archive ⚠️ outreach |
| **Korea Heritage Service** | South Korea | `heritage.go.kr/english` | Cultural Heritage REST API available |
| **National Museum of Korea** | South Korea | `e-museum.or.kr` | REST API |
| **National Museum of Taiwan** | Taiwan | — | ⚠️ outreach |
| **Shanghai Museum** | China | `shanghaimuseum.net` | ⚠️ outreach |
| **Asia Society** | USA | `asiasociety.org/museum/collections` | Open collection ⚠️ outreach |
| **Singapore Heritage** | Singapore | `roots.gov.sg/api` | National Heritage Board — REST API |

---

### L. Latin American Collections

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Museo Nacional de Bellas Artes Argentina** | Argentina | `bellasartes.gob.ar` | Open collection ⚠️ outreach |
| **Pinacoteca do Estado de São Paulo** | Brazil | `pinacoteca.org.br` | ⚠️ outreach |
| **MASP (Museu de Arte de São Paulo)** | Brazil | `masp.art.br/acervo` | Open access initiative launched 2024 ⚠️ outreach |
| **Museo Nacional de Arte Mexico** | Mexico | `munal.mx` | Mexican fine arts ⚠️ outreach |
| **Museo Frida Kahlo** | Mexico | `museofridakahlo.org.mx` | ⚠️ outreach |
| **Instituto Nacional de Bellas Artes Mexico** | Mexico | `inba.gob.mx` | ⚠️ outreach |
| **Museo del Barrio New York** | USA | `elmuseo.org` | Latin American/Caribbean ⚠️ outreach |
| **MAM Rio / Museu de Arte Moderna** | Brazil | `mamrio.org.br` | ⚠️ outreach |
| **Fundación Mapfre** | Spain | `fundacion.mapfre.com/cultura/programas/fotografias` | Photography collection ⚠️ outreach |

---

### M. Middle East & North Africa

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Cairo Egyptian Museum** | Egypt | `egyptianmuseum.gov.eg` | ⚠️ outreach |
| **Museum of Islamic Art Cairo** | Egypt | `islamicart.gov.eg` | ⚠️ outreach |
| **Jordan Archaeological Museum** | Jordan | — | ⚠️ outreach |
| **National Museum of Saudi Arabia** | Saudi Arabia | `nmc.gov.sa` | ⚠️ outreach |
| **Museum of Islamic Art Doha** | Qatar | already listed above | |
| **NYU Abu Dhabi Art Gallery** | UAE | `nyuad.nyu.edu` | ⚠️ outreach |
| **Mathaf: Arab Museum of Modern Art** | Qatar | `mathaf.org.qa` | ⚠️ outreach |
| **Israel Museum Jerusalem** | Israel | `imj.org.il/en/collections` | REST JSON — open collection |
| **Turkish and Islamic Arts Museum** | Turkey | `tiem.gov.tr` | ⚠️ outreach |
| **Topkapi Palace Museum** | Turkey | `topkapisarayi.gov.tr` | ⚠️ outreach |

---

### N. Archives, Libraries & Printed Sources

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **HathiTrust Digital Library** | USA | `babel.hathitrust.org/api` | API available — public domain books/images |
| **JSTOR** | USA | `api.jstor.org` | Academic articles — some open images ⚠️ institutional |
| **British Library** | UK | `api.bl.uk/metadata/iiif` | IIIF API — 1M+ digitized pages, maps, illustrations |
| **National Archives UK** | UK | `discovery.nationalarchives.gov.uk/API` | REST API available |
| **National Archives USA (NARA)** | USA | `catalog.archives.gov/api/v2` | REST API (separate from LOC) |
| **National Library of Scotland** | UK | `digital.nls.uk/api` | REST + IIIF |
| **National Library of Wales** | UK | `cat.library.wales` | Linked Open Data |
| **National Library of Ireland** | Ireland | `catalogue.nli.ie` | ⚠️ outreach |
| **Swiss National Library** | Switzerland | `helveticat.ch` | — |
| **Deutsche Nationalbibliothek** | Germany | `portal.dnb.de/api/v1` | REST API |
| **Biblioteca Nacional de Portugal** | Portugal | `bnportugal.gov.pt` | Wikidata bridge workable |
| **Biblioteca Nacional de España** | Spain | already via `euro_bne` | |
| **Bibliothèque royale de Belgique (KBR)** | Belgium | `kbr.be/en/digital-heritage` | REST API — digitized heritage |
| **Heidelberg University Library** | Germany | already in manifest (inactive) | Fix endpoint and re-enable |
| **Papers Past (NLNZ)** | New Zealand | `paperspast.natlib.govt.nz/api` | Historic NZ newspapers — REST API |
| **Europeana Newspapers** | Europe | `api.europeana.eu/record/v2` | Historical newspaper images via Europeana |
| **Harvard Widener Library / Houghton** | USA | `api.lib.harvard.edu` | REST API; maps, prints, rare books |
| **Getty Research Institute** | USA | `rosettaapp.getty.edu` | Art research special collections ⚠️ outreach |
| **Archives nationales de France** | France | `archives-nationales.culture.gouv.fr` | Via data.culture.gouv.fr |
| **Riksarkivet (Swedish National Archives)** | Sweden | `riksarkivet.se/api` | REST API — historical documents |
| **Lebanese National Library** | Lebanon | — | ⚠️ outreach |
| **Library and Archives Canada** | Canada | `collectionscanada.gc.ca` | REST / IIIF — open access |

---

### O. Science, Technology & Medicine History

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **National Library of Medicine (NLM)** | USA | `collections.nlm.nih.gov/api` | REST API — Images from the History of Medicine |
| **Science History Institute** | USA | `sciencehistory.org/collections` | ⚠️ outreach |
| **Whipple Museum of Science** | UK | `hps.cam.ac.uk/whipple/collection` | ⚠️ outreach |
| **Museum of the History of Science Oxford** | UK | Now called History of Science Museum — ⚠️ outreach |
| **Smithsonian NASM + NMNH** | USA | already partially connected | Expand via Smithsonian API |
| **Computer History Museum** | USA | `computerhistory.org/collections` | ⚠️ outreach |
| **Henry Ford Museum** | USA | `thehenryford.org/collections-and-research/digital-collections/artifacts` | REST API available |

---

### P. Photography Archives (Historical / Documentary)

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **George Eastman Museum** | USA | `eastman.org/george-eastman-museum-digital-collections` | Photography history ⚠️ outreach |
| **International Center of Photography (ICP)** | USA | `icp.org/browse/archive` | ⚠️ outreach |
| **Museum of Modern Photography (MoP) London** | UK | — | ⚠️ outreach |
| **Magnum Photos** | France/USA | `magnumphotos.com` | ⚠️ commercial |
| **VII Photo Agency** | USA | — | ⚠️ commercial |
| **National Geographic Archive** | USA | `nationalgeographic.com/photography` | ⚠️ commercial |

---

### Q. Creative Commons / Open License Image Aggregators

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Openverse** | USA | already connected via `openverse` | |
| **CC Search** | Global | merged into Openverse | |
| **Wikimedia Commons** | Global | already connected | |
| **Public Domain Review** | UK | `publicdomainreview.org` | Curated — RSS/scrape only; ⚠️ outreach for API |
| **Artvee** | USA | `artvee.com` | Public domain art downloads — ⚠️ no formal API yet |
| **rawpixel Free** | USA | `rawpixel.com/services/api` | Freemium API |
| **Old Book Illustrations** | Global | `oldbookillustrations.com` | ⚠️ outreach |
| **The Public Domain** | USA | `thePublicDomain.review` | Same as Public Domain Review |
| **Picryl** | USA | `picryl.com` | Aggregates public-domain images ⚠️ outreach |

---

### R. 3D & Immersive

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Sketchfab Cultural Heritage** | Global | already connected via `sketchfab_heritage` | |
| **Smithsonian 3D** | USA | `3d.si.edu/api` | REST API — 3D scans of collection objects |
| **Europeana 3D** | Europe | `pro.europeana.eu/page/3d` | 3D heritage objects via Europeana API |
| **IIIF 3D Working Group outputs** | Global | — | Standard in development |
| **CyArk** | USA | `cyark.org` | Heritage site 3D scans ⚠️ outreach |
| **Morphosource** | USA | `morphosource.org/api` | 3D biological & paleontological specimens — API available |

---

### S. Auction Houses & Art Market

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Christie's** | UK | `christies.com/lot-details/api` | Lot images API — ⚠️ commercial / outreach |
| **Sotheby's** | UK/USA | `sothebys.com` | ⚠️ commercial |
| **Bonhams** | UK | `bonhams.com` | ⚠️ commercial |
| **Invaluable** | USA | `invaluable.com/api` | API available for partners ⚠️ outreach |
| **Barnebys** | Sweden | `barnebys.com/api` | Auction aggregator API ⚠️ outreach |
| **LiveAuctioneers** | USA | `liveauctioneers.com` | ⚠️ outreach |
| **1stDibs** | USA | `1stdibs.com/api` | Luxury antiques/design — API for partners ⚠️ outreach |

---

### T. AI Art & Community Platforms

| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **DeviantArt** | USA | `deviantart.com/developers` | OAuth API available |
| **ArtStation** | Canada | `artstation.com/api/v2` | No official public API — scraping only ⚠️ |
| **Behance** | USA | `behance.net/dev` | Adobe-backed — API available |
| **Dribbble** | USA | `dribbble.com/api` | Design / UI — API available |
| **Cara.app** | USA | `cara.app` | Anti-AI art community — no API yet ⚠️ outreach |
| **Ello** | USA | `ello.co/api` | Creative network — REST API |
| **Wix Art Portfolio API** | — | — | — |

---

### U. Niche / Specialist Collections

#### Illustration & Print
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Gutenberg Project Illustrations** | USA | `gutenberg.org` | Parsed from Project Gutenberg books |
| **Children's Book Illustrations Archive** | UK | `illustration.org.uk` | AOI (Association of Illustrators) ⚠️ outreach |
| **Comic Book Archive** | Global | `comicbookdb.com` | — |
| **The Cartoon Museum** | UK | `cartoonmuseum.org` | ⚠️ outreach |

#### Ceramics & Glass
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Stoke-on-Trent City Museum** | UK | `stokemuseums.org.uk` | Potteries collection ⚠️ outreach |
| **Glasmuseum Frauenau** | Germany | — | ⚠️ outreach |
| **Corning Museum of Glass** | USA | `cmog.org/collection/objects` | REST API available |

#### Numismatics & Archaeology
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **American Numismatic Society** | USA | `numismatics.org/api` | REST API — coins & medals |
| **Nomisma.org** | Global | `nomisma.org` | Linked Open Data for numismatics |
| **tDAR (The Digital Archaeological Record)** | USA | `core.tdar.org` | Archaeological datasets ⚠️ institutional |

#### Performing Arts
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **New York Public Library for Performing Arts** | USA | `digitalcollections.nypl.org` | Via existing `nypl` — filter by performing arts |
| **V&A Theatre & Performance** | UK | via `va` | Filter by performance collection |
| **Bibliothèque-musée de l'Opéra Paris** | France | via Gallica | Filter BnF/Gallica for opera |

#### Military & Heraldry
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **Imperial War Museum** | UK | `iwm.org.uk/collections/search` | REST API available |
| **Australian War Memorial** | Australia | `awm.gov.au/collection/api` | REST API available |
| **National Army Museum** | UK | `nam.ac.uk/online-collection` | ⚠️ outreach |
| **Heraldry Society** | UK | — | ⚠️ outreach |

#### Maritime
| Name | Country | URL | Notes |
|------|---------|-----|-------|
| **National Maritime Museum Greenwich** | UK | `collections.rmg.co.uk/api/v1` | REST JSON API available |
| **Mystic Seaport Museum** | USA | `mysticseaport.org/collections` | ⚠️ outreach |
| **Australian National Maritime Museum** | Australia | `anmm.gov.au` | Via `maas` neighbor |

---

## Summary

| | Count |
|---|---|
| **Currently active sources** | ~214 (hardcoded) + 23 (manifest, ~15 active) = **~246+ live endpoints** |
| **CORS-blocked / nightly-fetched** | 153 sources (9 original + 8 Wikidata art bridges + 9 fashion bridges + 14 art/sculpture/history bridges + 113 Phase H world museum bridges — all added Mar 2026) |
| **World museum sources connected (Phase H)** | 113 new Wikidata SPARQL collection bridges across 11 countries |
| **Art/sculpture/history sources connected (Phase G)** | 16 (2 fixed + 14 new Wikidata bridges) |
| **Fashion sources connected** | 18 (9 pre-existing + 9 new Wikidata bridges) |
| **Manifest sources (inactive/broken)** | 8 |
| **Potential additions researched** | 300+ |
| **Potential additions — API available, no outreach needed** | ~80 |
| **Potential additions — ⚠️ outreach / commercial** | ~220 |
| **Fashion sources listed (Part 2 Section B)** | 115 (19 connected + 96 outreach-needed) |

---

*Last updated: March 29, 2026*
