/**
 * InspoSearch — Nightly CORS-Blocked Source Fetch
 * Runs via GitHub Actions at 2am UTC every night.
 * Fetches CORS-blocked museum APIs server-side, saves static JSON to
 * insposearch/data/{sourceId}.json for the browser to read.
 *
 * No external dependencies — uses Node.js 18+ built-in fetch.
 * Exit code is always 0 (partial success is fine; GH Actions should not fail).
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'insposearch', 'data');
const MAX_ITEMS = 500;
const TIMEOUT_MS = 20000; // increased for Wikidata SPARQL

// Wikidata SPARQL helper — used by Prado, Thyssen, Paris Musées, CUDL
// Uses OFFSET derived from seed-term position so each call returns a different page.
async function fetchWikidataSparql(sparqlTemplate, term, source) {
  const offset = Math.max(0, SEED_TERMS.indexOf(term)) * 25;
  const query  = sparqlTemplate(offset);
  const url    = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;
  const res    = await fetchWithTimeout(url, {
    headers: {
      'Accept':     'application/sparql-results+json',
      'User-Agent': 'InspoSearch/1.1 (https://github.com/GI-Synth/InspoSearch; mailto:bianca.condruz@hec.ca)',
    },
  });
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
  const data = await res.json();
  return (data.results?.bindings || []).map(b => {
    const raw   = b.image?.value || '';
    const img   = raw.replace(/^http:\/\//, 'https://');
    const thumb = img.includes('?') ? img : img + '?width=400';
    return {
      img,
      thumb,
      title:  b.itemLabel?.value || 'Artwork',
      source,
      tags:   [term],
    };
  }).filter(i => i.img.startsWith('https://'));
}

const SEED_TERMS = [
  'portrait', 'landscape', 'architecture', 'fashion', 'nature', 'abstract',
  'texture', 'light', 'shadow', 'color', 'pattern', 'vintage', 'modern',
  'minimal', 'urban', 'water', 'forest', 'flower', 'animal', 'geometric',
  'sculpture', 'ceramic', 'textile', 'ruins', 'sky', 'ocean', 'mountain',
  'botanical', 'astronomy', 'Renaissance', 'medieval', 'Baroque',
];

// ── helpers ────────────────────────────────────────────────────────────────

function log(sourceId, msg) {
  console.log(`[${sourceId}] ${msg}`);
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.img)) return false;
    if (item.img) seen.add(item.img);
    return !!(item.img);
  });
}

function saveSource(sourceId, sourceName, items) {
  // Validate items — filter out entries missing required fields
  const valid = items.filter(item => {
    if (!item.img || typeof item.img !== 'string') return false;
    if (!item.img.startsWith('https://')) return false;
    return true;
  });
  if (valid.length === 0) {
    log(sourceId, `SKIP: all ${items.length} items failed validation`);
    return;
  }
  const out = {
    sourceId,
    sourceName,
    schemaVersion: 1,
    lastFetched: new Date().toISOString(),
    items: valid.slice(0, MAX_ITEMS),
  };
  const path = join(DATA_DIR, `${sourceId}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');
  log(sourceId, `saved ${out.items.length} items (${items.length - valid.length} invalid filtered) → ${path}`);
}

// ── source fetchers ────────────────────────────────────────────────────────

// Prado — Museo del Prado via Wikidata SPARQL (direct API blocked by Cloudflare)
async function fetchPrado(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q160112 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,es,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'prado');
}

// Paris Musées — 8 Paris municipal museums via Wikidata SPARQL
// (direct GraphQL API requires authentication token)
async function fetchParisMusees(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      VALUES ?museum {
        wd:Q640447  wd:Q743206  wd:Q726781  wd:Q857276
        wd:Q650519  wd:Q860994  wd:Q684846  wd:Q1124095
      }
      ?item wdt:P195 ?museum .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,de,es,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'parismusees');
}

// SOCH — Swedish Open Cultural Heritage (K-Samsök)
async function fetchSOCH(term) {
  const url = `https://kulturarvsdata.se/ksamsok/api?x-api=test&method=search&hitsPerPage=25&query=text=${encodeURIComponent(term)}&format=json`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'InspoSearch/1.1 (https://github.com/GI-Synth/InspoSearch; mailto:bianca.condruz@hec.ca)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const records = data.result?.records || [];
  const items = [];
  for (const rec of records) {
    const graph = rec.record?.['@graph'] || [];
    // Find Image nodes with lowresSource or thumbnailSource
    for (const node of graph) {
      const img = node['ns1:lowresSource'] || node['ns1:thumbnailSource'] ||
                  node['lowresSource'] || node['thumbnailSource'];
      if (img && img.startsWith('http')) {
        // Search all nodes for a title string
        let title = 'Swedish Heritage Item';
        let sourceUrl = '';
        for (const n of graph) {
          const t = n['ns1:itemLabel']?.['@value'] ||
                    n['itemLabel']?.['@value'] ||
                    n['foaf:name']?.['@value'] ||
                    n['ns1:itemName']?.[0] ||
                    n['itemName']?.[0];
          if (t) { title = t; break; }
        }
        const entityNode = graph.find(n => n['ns1:url'] || n['url']);
        sourceUrl = entityNode?.['ns1:url'] || entityNode?.['url'] || '';
        items.push({ img, thumb: img, title, source: 'soch', tags: [term], sourceUrl });
        break; // one image per record
      }
    }
  }
  return items;
}

// Thyssen — Museo Thyssen-Bornemisza via Wikidata SPARQL (direct API returns 404)
async function fetchThyssen(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q176251 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,es,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'thyssen');
}

// CUDL — Cambridge Digital Library via Wikidata SPARQL
// (direct API at services.cudl.lib.cam.ac.uk/v1/search returns 404; service endpoint inaccessible)
// Falls back to historical manuscripts collection from Wikidata — same content niche.
async function fetchCUDL(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image ?collectionLabel WHERE {
      VALUES ?type { wd:Q87167 wd:Q8766825 wd:Q9143 wd:Q181916 }
      ?item wdt:P31 ?type .
      ?item wdt:P18 ?image .
      OPTIONAL { ?item wdt:P195 ?collection }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,la,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'cudl');
}

// ── main orchestrator ─────────────────────────────────────────────────────

// NHM London — Natural History Museum
async function fetchNHMLondon(term) {
  const url = `https://data.nhm.ac.uk/api/3/action/datastore_search?resource_id=e4e0a710-2400-4e5f-a569-87dbab23d1d2&q=${encodeURIComponent(term)}&limit=25`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'InspoSearch/1.1 (https://github.com/GI-Synth/InspoSearch; mailto:bianca.condruz@hec.ca)', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.result?.records || [])
    .filter(r => r.accessURI || (r.indexTerms && r.indexTerms.accessURI?.[0]))
    .map(r => {
      const img = r.accessURI || r.indexTerms?.accessURI?.[0] || '';
      return {
        img, thumb: img,
        title: r.scientificName || r.typeStatus || 'NHM Specimen',
        source: 'nhm_london', tags: [term],
      };
    })
    .filter(item => item.img.startsWith('http'));
}

// Wallace Collection — The Wallace Collection, London
async function fetchWallaceCollection(term) {
  const url = `https://wallacelive.wallacecollection.org/emuseum/api/search?q=${encodeURIComponent(term)}&rows=25&type=objects`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'InspoSearch/1.1 (https://github.com/GI-Synth/InspoSearch; mailto:bianca.condruz@hec.ca)', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.rows || data.results || [])
    .filter(item => item.primaryMedia?.publicAccess?.uri || item.images?.[0]?.uri)
    .map(item => {
      const img = item.primaryMedia?.publicAccess?.uri || item.images?.[0]?.uri || '';
      return {
        img, thumb: img,
        title: item.title?.[0]?.value || item.title || 'Wallace Collection Work',
        source: 'wallace_collection', tags: [term],
      };
    })
    .filter(item => item.img.startsWith('http'));
}

// Fitzwilliam Museum Cambridge
async function fetchFitzwilliam(term) {
  const url = `https://data.fitzmuseum.cam.ac.uk/api/v1/objects?q=${encodeURIComponent(term)}&limit=25`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'InspoSearch/1.1 (https://github.com/GI-Synth/InspoSearch; mailto:bianca.condruz@hec.ca)', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || data.results || [])
    .filter(item => item.images?.length || item.thumbnail?.url)
    .map(item => {
      const img = item.images?.[0]?.media?.source || item.thumbnail?.url || '';
      return {
        img, thumb: img,
        title: item.title?.[0]?.value || item.summary_title || 'Fitzwilliam Object',
        source: 'fitzwilliam', tags: [term],
      };
    })
    .filter(item => item.img.startsWith('http'));
}

// National Gallery London — via Wikidata SPARQL (Q180788, ~4k images)
async function fetchNationalGalleryLondon(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q180788 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'national_gallery_london');
}

// Scottish National Galleries — via Wikidata SPARQL (Q2051997, ~2.3k images)
async function fetchScottishNational(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q2051997 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'scottish_national');
}

// Musée d'Orsay — Impressionist & Post-Impressionist masterworks via Wikidata
async function fetchMuseeOrsay(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q23402 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'musee_orsay');
}

// Van Gogh Museum Amsterdam via Wikidata
async function fetchVanGoghMuseum(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q272671 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'vangogh_museum');
}

// Kunsthistorisches Museum Vienna via Wikidata
async function fetchKHM(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q95569 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'khm');
}

// Belvedere Museum Vienna via Wikidata
async function fetchBelvedere(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q485700 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'belvedere');
}

// Städel Museum Frankfurt via Wikidata
async function fetchStaedel(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q163804 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'staedel');
}

// Royal Museums of Fine Arts of Belgium (Brussels) via Wikidata
async function fetchRMFAB(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q2407552 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'rmfab');
}

// Musée Guimet Paris (Asian art) via Wikidata
async function fetchGuimet(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q205963 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'guimet');
}

// National Palace Museum Taipei via Wikidata
async function fetchNPMTaipei(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q673651 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,zh,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'npm_taipei');
}

// ── Fashion & Textile Sources (added Mar 2026) ──────────────────────────

// Musée Galliera (Palais Galliera) — Paris couture & fashion museum
async function fetchGalliera(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1519002 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'galliera');
}

// Musée des Arts Décoratifs Paris — fashion, design, decorative arts
async function fetchArtsDecoratifs(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1319378 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'arts_decoratifs');
}

// Centraal Museum Utrecht — Dutch costume, fashion, art
async function fetchCentraalMuseum(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q260913 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'centraal_museum');
}

// Textile Museum Tilburg — Dutch textile art and fashion
async function fetchTextileMuseum(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1421440 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'textile_museum_tilburg');
}

// Nationaal Museum van Wereldculturen — Dutch world cultures (textiles, costumes)
async function fetchWereldculturen(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q510324 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'wereldculturen');
}

// Museum of Decorative Arts Prague — applied art, textiles, fashion, glass
async function fetchDecArtsPrague(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q160236 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,cs,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'dec_arts_prague');
}

// Designmuseum Danmark — Danish design, fashion, textiles
async function fetchDesignmuseumDK(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q2628596 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,da,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'designmuseum_dk');
}

// Museum Boijmans Van Beuningen — Rotterdam; fashion, applied art, fine art
async function fetchBoijmans(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q574961 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'boijmans');
}

// Museu Nacional do Traje — Lisbon costume museum
async function fetchMuseuTraje(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1142988 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,pt,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'museu_traje');
}

// ── Phase G — Art, Sculpture & History Sources ──────────────────────────

// Royal Museum of Fine Arts Antwerp (KMSKA) — Flemish Masters
async function fetchKMSKA(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1471477 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'kmska');
}

// Amsterdam Museum — city history, art, photography
async function fetchAmsterdamMuseum(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1820897 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'amsterdam_museum');
}

// National Gallery of Ireland — European Old Masters + Irish art
async function fetchNGI(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q2018379 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ga,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'ngi');
}

// Fries Museum — Frisian art and history (Leeuwarden)
async function fetchFriesMuseum(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q848313 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,fy,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'fries_museum');
}

// Groeningemuseum — Bruges, early Netherlandish art
async function fetchGroeninge(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1948674 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'groeninge');
}

// Groninger Museum — art, design, photography (Groningen)
async function fetchGroninger(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1542668 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'groninger');
}

// Museum of Modern Art (MoMA) New York
async function fetchMoMAWD(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q188740 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'moma_wd');
}

// Rijksmuseum Twenthe — Enschede, Dutch & European art
async function fetchRijksmuseumTwenthe(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q1505892 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'rijksmuseum_twenthe');
}

// Herzog Anton Ulrich Museum — Braunschweig, Old Masters
async function fetchHerzogAntonUlrich(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q678082 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'herzog_anton_ulrich');
}

// Galleria Palatina — Palazzo Pitti, Florence; Renaissance art
async function fetchGalleriaPalatina(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q866498 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,it,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'galleria_palatina');
}

// Museum De Lakenhal — Leiden, Rembrandt's birthplace
async function fetchLakenhal(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q2098586 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'lakenhal');
}

// Teylers Museum — Haarlem, art and science (oldest museum in NL)
async function fetchTeylers(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q474563 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'teylers');
}

// Alte Pinakothek — Munich, European Old Masters
async function fetchAltePinakothek(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q154568 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'alte_pinakothek');
}

// Musée du quai Branly — Paris, indigenous arts of Africa, Asia, Oceania, Americas
async function fetchQuaiBranly(term) {
  return fetchWikidataSparql(offset => `
    SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P195 wd:Q167863 .
      ?item wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,*" }
    } LIMIT 25 OFFSET ${offset}`, term, 'quai_branly');
}

// ── Phase H — 113 World Museum Collection Sources (data-driven) ─────────
// Factory: generates a fetchWikidataSparql fetcher for any Wikidata collection QID
function makeCollectionFetcher(qid, sourceId, langs = 'en,*') {
  return function(term) {
    return fetchWikidataSparql(offset => `
      SELECT DISTINCT ?item ?itemLabel ?image WHERE {
        ?item wdt:P195 wd:${qid} .
        ?item wdt:P18 ?image .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs}" }
      } LIMIT 25 OFFSET ${offset}`, term, sourceId);
  };
}

const WD_COLLECTIONS = [
  // UK (18)
  { id: 'nlw',                 name: 'National Library of Wales',        qid: 'Q666063',    langs: 'en,cy,*' },
  { id: 'royal_collection',    name: 'Royal Collection',                 qid: 'Q1459037',   langs: 'en,*' },
  { id: 'npg_london',          name: 'National Portrait Gallery',        qid: 'Q238587',    langs: 'en,*' },
  { id: 'rmuseum_greenwich',   name: 'Royal Museums Greenwich',          qid: 'Q7374509',   langs: 'en,*' },
  { id: 'walker_gallery',      name: 'Walker Art Gallery',               qid: 'Q1536471',   langs: 'en,*' },
  { id: 'glasgow_museums',     name: 'Glasgow Museums',                  qid: 'Q41661713',  langs: 'en,*' },
  { id: 'birmingham_trust',    name: 'Birmingham Museums Trust',         qid: 'Q4916759',   langs: 'en,*' },
  { id: 'ashmolean',           name: 'Ashmolean Museum',                 qid: 'Q636400',    langs: 'en,*' },
  { id: 'sheffield_museums',   name: 'Sheffield Museums',                qid: 'Q7492669',   langs: 'en,*' },
  { id: 'manchester_gallery',  name: 'Manchester Art Gallery',           qid: 'Q2638817',   langs: 'en,*' },
  { id: 'british_library_wd',  name: 'British Library',                  qid: 'Q23308',     langs: 'en,*' },
  { id: 'bowes_museum',        name: 'Bowes Museum',                     qid: 'Q895434',    langs: 'en,*' },
  { id: 'norfolk_museums',     name: 'Norfolk Museums',                  qid: 'Q55361621',  langs: 'en,*' },
  { id: 'british_museum_wd',   name: 'British Museum',                   qid: 'Q6373',      langs: 'en,*' },
  { id: 'brighton_museum',     name: 'Brighton Museum',                  qid: 'Q2790574',   langs: 'en,*' },
  { id: 'bristol_museum',      name: 'Bristol City Museum',              qid: 'Q4968867',   langs: 'en,*' },
  { id: 'york_gallery',        name: 'York Art Gallery',                 qid: 'Q8055361',   langs: 'en,*' },
  { id: 'dulwich_gallery',     name: 'Dulwich Picture Gallery',          qid: 'Q1241163',   langs: 'en,*' },
  // Netherlands (14)
  { id: 'kb_nl',               name: 'KB National Library',              qid: 'Q1526131',   langs: 'en,nl,*' },
  { id: 'dordrechts_museum',   name: 'Dordrechts Museum',               qid: 'Q2874177',   langs: 'en,nl,*' },
  { id: 'bonnefanten',         name: 'Bonnefanten Museum',               qid: 'Q892727',    langs: 'en,nl,*' },
  { id: 'museum_rotterdam',    name: 'Museum Rotterdam',                 qid: 'Q2130225',   langs: 'en,nl,*' },
  { id: 'kroeller_mueller',    name: 'Kröller-Müller Museum',            qid: 'Q1051928',   langs: 'en,nl,*' },
  { id: 'cuypershuis',         name: 'Cuypershuis',                      qid: 'Q15874141',  langs: 'en,nl,*' },
  { id: 'kunstmuseum_denhaag', name: 'Kunstmuseum Den Haag',             qid: 'Q1499958',   langs: 'en,nl,*' },
  { id: 'museum_gouda',        name: 'Museum Gouda',                     qid: 'Q4360916',   langs: 'en,nl,*' },
  { id: 'mesdag_collection',   name: 'Mesdag Collection',                qid: 'Q255409',    langs: 'en,nl,*' },
  { id: 'jewish_museum_adam',  name: 'Jewish Museum Amsterdam',          qid: 'Q702726',    langs: 'en,nl,*' },
  { id: 'stedelijk_alkmaar',   name: 'Stedelijk Museum Alkmaar',         qid: 'Q4623539',   langs: 'en,nl,*' },
  { id: 'museum_de_waag',      name: 'Museum De Waag',                   qid: 'Q40304752',  langs: 'en,nl,*' },
  { id: 'catharijneconvent',   name: 'Museum Catharijneconvent',         qid: 'Q1954426',   langs: 'en,nl,*' },
  { id: 'maritime_rotterdam',  name: 'Maritime Museum Rotterdam',        qid: 'Q2755458',   langs: 'en,nl,*' },
  // Belgium (11)
  { id: 'musea_brugge',        name: 'Musea Brugge',                     qid: 'Q51674344',  langs: 'en,nl,fr,*' },
  { id: 'kbr_brussels',        name: 'Royal Library of Belgium',         qid: 'Q383931',    langs: 'en,fr,nl,*' },
  { id: 'msk_ghent',           name: 'MSK Ghent',                        qid: 'Q2365880',   langs: 'en,nl,fr,*' },
  { id: 'plantin_moretus',     name: 'Museum Plantin-Moretus',           qid: 'Q595802',    langs: 'en,nl,*' },
  { id: 'muzee_ostende',       name: 'Mu.ZEE',                           qid: 'Q1928672',   langs: 'en,nl,*' },
  { id: 'rmah_brussels',       name: 'Royal Museums of Art & History',   qid: 'Q945059',    langs: 'en,fr,nl,*' },
  { id: 'middelheim',          name: 'Middelheim Museum',                qid: 'Q2098074',   langs: 'en,nl,*' },
  { id: 'mayer_van_den_bergh', name: 'Museum Mayer van den Bergh',       qid: 'Q1699233',   langs: 'en,nl,*' },
  { id: 'rubenshuis',          name: 'Rubenshuis',                       qid: 'Q775644',    langs: 'en,nl,*' },
  { id: 'mas_antwerp',         name: 'Museum aan de Stroom',             qid: 'Q1646305',   langs: 'en,nl,*' },
  { id: 'gallo_roman',         name: 'Gallo-Roman Museum',               qid: 'Q1492516',   langs: 'en,nl,fr,*' },
  // Germany (18)
  { id: 'bavarian_paintings',  name: 'Bavarian State Painting Collections', qid: 'Q812285', langs: 'en,de,*' },
  { id: 'gemaeldegalerie_berlin', name: 'Gemäldegalerie Berlin',         qid: 'Q165631',    langs: 'en,de,*' },
  { id: 'kunsthalle_karlsruhe',name: 'Staatliche Kunsthalle Karlsruhe',  qid: 'Q658725',    langs: 'en,de,*' },
  { id: 'germanisches_nm',     name: 'Germanisches Nationalmuseum',      qid: 'Q478695',    langs: 'en,de,*' },
  { id: 'skd_dresden',         name: 'Staatliche Kunstsammlungen Dresden',qid: 'Q653002',    langs: 'en,de,*' },
  { id: 'wallraf_richartz',    name: 'Wallraf-Richartz Museum',          qid: 'Q700959',    langs: 'en,de,*' },
  { id: 'augustiner_freiburg', name: 'Augustiner Museum',                qid: 'Q542932',    langs: 'en,de,*' },
  { id: 'alte_nationalgalerie', name: 'Alte Nationalgalerie',             qid: 'Q162111',    langs: 'en,de,*' },
  { id: 'hamburger_kunsthalle',name: 'Hamburger Kunsthalle',             qid: 'Q169542',    langs: 'en,de,*' },
  { id: 'lenbachhaus',         name: 'Lenbachhaus',                      qid: 'Q262234',    langs: 'en,de,*' },
  { id: 'wagner_museum',       name: 'Martin von Wagner Museum',         qid: 'Q1903282',   langs: 'en,de,*' },
  { id: 'hessen_kassel',       name: 'Hessen Kassel Heritage',           qid: 'Q1954840',   langs: 'en,de,*' },
  { id: 'kunstbibliothek_berlin', name: 'Kunstbibliothek Berlin',        qid: 'Q6445022',   langs: 'en,de,*' },
  { id: 'schnutgen',           name: 'Schnütgen Museum',                 qid: 'Q950',       langs: 'en,de,*' },
  { id: 'staatsgalerie_stuttgart', name: 'Staatsgalerie Stuttgart',      qid: 'Q14917275',  langs: 'en,de,*' },
  { id: 'berlinische_galerie', name: 'Berlinische Galerie',              qid: 'Q700222',    langs: 'en,de,*' },
  { id: 'westphalian_museum',  name: 'Westphalian State Museum',         qid: 'Q1798475',   langs: 'en,de,*' },
  { id: 'mdbk_leipzig',        name: 'Museum der bildenden Künste',      qid: 'Q566661',    langs: 'en,de,*' },
  // France (12)
  { id: 'musee_st_raymond',    name: 'Musée Saint-Raymond',              qid: 'Q1376',      langs: 'en,fr,*' },
  { id: 'musee_hist_france',   name: 'Museum of the History of France',  qid: 'Q3329787',   langs: 'en,fr,*' },
  { id: 'versailles_wd',       name: 'Palace of Versailles',             qid: 'Q2946',      langs: 'en,fr,*' },
  { id: 'musee_conde',         name: 'Condé Museum',                     qid: 'Q1236032',   langs: 'en,fr,*' },
  { id: 'musee_augustins',     name: 'Musée des Augustins',              qid: 'Q2711480',   langs: 'en,fr,*' },
  { id: 'archives_nationales', name: 'Archives nationales',              qid: 'Q182542',    langs: 'en,fr,*' },
  { id: 'mba_reims',           name: 'Musée des Beaux-Arts de Reims',    qid: 'Q3330225',   langs: 'en,fr,*' },
  { id: 'mnam_paris',          name: 'Musée National d\'Art Moderne',    qid: 'Q1895953',   langs: 'en,fr,*' },
  { id: 'bnf_wd',              name: 'Bibliothèque nationale de France', qid: 'Q193563',    langs: 'en,fr,*' },
  { id: 'mba_dijon',           name: 'Musée des Beaux-Arts de Dijon',    qid: 'Q1955739',   langs: 'en,fr,*' },
  { id: 'mba_strasbourg',      name: 'Musée des Beaux-Arts de Strasbourg', qid: 'Q1535963', langs: 'en,fr,*' },
  { id: 'musee_grenoble',      name: 'Museum of Grenoble',               qid: 'Q1952944',   langs: 'en,fr,*' },
  // Italy (13)
  { id: 'museo_egizio',        name: 'Museo Egizio',                     qid: 'Q19877',     langs: 'en,it,*' },
  { id: 'uffizi_wd',           name: 'Uffizi Gallery',                   qid: 'Q51252',     langs: 'en,it,*' },
  { id: 'accademia_venice',    name: 'Gallerie dell\'Accademia',         qid: 'Q338330',    langs: 'en,it,*' },
  { id: 'capodimonte',         name: 'Museo di Capodimonte',             qid: 'Q290549',    langs: 'en,it,*' },
  { id: 'naples_archaeology',  name: 'Naples Archaeological Museum',     qid: 'Q637248',    langs: 'en,it,*' },
  { id: 'brera',               name: 'Pinacoteca di Brera',              qid: 'Q150066',    langs: 'en,it,*' },
  { id: 'capitoline_museums',  name: 'Capitoline Museums',               qid: 'Q333906',    langs: 'en,it,*' },
  { id: 'castelvecchio',       name: 'Castelvecchio Museum',             qid: 'Q2518724',   langs: 'en,it,*' },
  { id: 'ca_rezzonico',        name: 'Ca\' Rezzonico',                   qid: 'Q1052171',   langs: 'en,it,*' },
  { id: 'gallerie_italia',     name: 'Gallerie d\'Italia',               qid: 'Q2054135',   langs: 'en,it,*' },
  { id: 'galleria_borghese',   name: 'Galleria Borghese',                qid: 'Q841506',    langs: 'en,it,*' },
  { id: 'galleria_nazionale',  name: 'Galleria Nazionale d\'Arte Antica', qid: 'Q2266081',  langs: 'en,it,*' },
  { id: 'pinacoteca_bologna',  name: 'Pinacoteca Nazionale di Bologna',  qid: 'Q1103550',   langs: 'en,it,*' },
  // Spain (7)
  { id: 'mnac_barcelona',      name: 'MNAC Barcelona',                   qid: 'Q861252',    langs: 'en,es,ca,*' },
  { id: 'mba_cordoba',         name: 'Fine Arts Museum of Córdoba',      qid: 'Q6033943',   langs: 'en,es,*' },
  { id: 'victor_balaguer',     name: 'Víctor Balaguer Museum',           qid: 'Q526170',    langs: 'en,es,ca,*' },
  { id: 'marca_spain',         name: 'National Archaeological Museum',   qid: 'Q1352282',   langs: 'en,es,*' },
  { id: 'mba_valencia',        name: 'Fine Arts Museum of Valencia',     qid: 'Q1748404',   langs: 'en,es,*' },
  { id: 'academia_san_fernando', name: 'Royal Academy of San Fernando',  qid: 'Q1322403',   langs: 'en,es,*' },
  { id: 'carmen_thyssen',      name: 'Carmen Thyssen Museum',            qid: 'Q5043601',   langs: 'en,es,*' },
  // Sweden (5)
  { id: 'performing_arts_se',  name: 'Swedish Museum of Performing Arts', qid: 'Q18448716', langs: 'en,sv,*' },
  { id: 'teknikmuseet',        name: 'National Museum of Science & Technology', qid: 'Q177550', langs: 'en,sv,*' },
  { id: 'portraits_se',        name: 'National Portrait Gallery of Sweden', qid: 'Q2817221', langs: 'en,sv,*' },
  { id: 'hallwyl',             name: 'Hallwyl Museum',                   qid: 'Q4346239',   langs: 'en,sv,*' },
  { id: 'gothenburg_art',      name: 'Gothenburg Museum of Art',         qid: 'Q1992004',   langs: 'en,sv,*' },
  // Denmark (6)
  { id: 'nhm_denmark',         name: 'Natural History Museum of Denmark', qid: 'Q978464',   langs: 'en,da,*' },
  { id: 'nivaagaard',          name: 'Nivaagaard Museum',                qid: 'Q10601378',  langs: 'en,da,*' },
  { id: 'skagens_museum',      name: 'Skagens Museum',                   qid: 'Q3555520',   langs: 'en,da,*' },
  { id: 'hirschsprung',        name: 'Hirschsprung Collection',          qid: 'Q2982867',   langs: 'en,da,*' },
  { id: 'ny_carlsberg',        name: 'Ny Carlsberg Glyptotek',           qid: 'Q1140507',   langs: 'en,da,*' },
  { id: 'frederiksborg',       name: 'Frederiksborg Castle Museum',      qid: 'Q3078776',   langs: 'en,da,*' },
  // Austria (3)
  { id: 'albertina',           name: 'Albertina',                         qid: 'Q371908',    langs: 'en,de,*' },
  { id: 'liechtenstein_museum', name: 'Liechtenstein Museum',            qid: 'Q1824069',   langs: 'en,de,*' },
  { id: 'leopold_museum',      name: 'Leopold Museum',                   qid: 'Q59435',     langs: 'en,de,*' },
  // USA (3)
  { id: 'mfa_boston_wd',        name: 'Museum of Fine Arts Boston',       qid: 'Q49133',     langs: 'en,*' },
  { id: 'mfa_houston',         name: 'Museum of Fine Arts Houston',      qid: 'Q1565911',   langs: 'en,*' },
  { id: 'famsf',               name: 'Fine Arts Museums of San Francisco', qid: 'Q1416890', langs: 'en,*' },
  // Other Europe (3)
  { id: 'hungarian_gallery',   name: 'Hungarian National Gallery',       qid: 'Q252071',    langs: 'en,hu,*' },
  { id: 'finnish_gallery',     name: 'Finnish National Gallery',         qid: 'Q2983474',   langs: 'en,fi,sv,*' },
  { id: 'bilbao_fine_arts',    name: 'Bilbao Fine Arts Museum',          qid: 'Q127064',    langs: 'en,es,eu,*' },
];

const SOURCES = [
  { id: 'prado',                  name: 'Museo del Prado',               fetcher: fetchPrado },
  { id: 'parismusees',            name: 'Paris Musées',                  fetcher: fetchParisMusees },
  { id: 'soch',                   name: 'Swedish Open Cultural Heritage', fetcher: fetchSOCH },
  { id: 'thyssen',                name: 'Museo Thyssen-Bornemisza',       fetcher: fetchThyssen },
  { id: 'cudl',                   name: 'Cambridge Digital Library',      fetcher: fetchCUDL },
  { id: 'nhm_london',             name: 'Natural History Museum London',  fetcher: fetchNHMLondon },
  { id: 'wallace_collection',     name: 'The Wallace Collection',         fetcher: fetchWallaceCollection },
  { id: 'fitzwilliam',            name: 'Fitzwilliam Museum',             fetcher: fetchFitzwilliam },
  { id: 'national_gallery_london',name: 'National Gallery London',        fetcher: fetchNationalGalleryLondon},
  { id: 'scottish_national',      name: 'Scottish National Gallery',      fetcher: fetchScottishNational },
  { id: 'musee_orsay',            name: 'Musée d\'Orsay',                 fetcher: fetchMuseeOrsay },
  { id: 'vangogh_museum',         name: 'Van Gogh Museum',                fetcher: fetchVanGoghMuseum },
  { id: 'khm',                    name: 'Kunsthistorisches Museum Vienna', fetcher: fetchKHM },
  { id: 'belvedere',              name: 'Belvedere Museum Vienna',         fetcher: fetchBelvedere },
  { id: 'staedel',                name: 'Städel Museum Frankfurt',         fetcher: fetchStaedel },
  { id: 'rmfab',                  name: 'Royal Museums of Fine Arts Belgium', fetcher: fetchRMFAB },
  { id: 'guimet',                 name: 'Musée Guimet',                   fetcher: fetchGuimet },
  { id: 'npm_taipei',             name: 'National Palace Museum Taipei',  fetcher: fetchNPMTaipei },
  // Fashion & Textile Sources (added Mar 2026)
  { id: 'galliera',              name: 'Musée Galliera',                  fetcher: fetchGalliera },
  { id: 'arts_decoratifs',       name: 'Musée des Arts Décoratifs',       fetcher: fetchArtsDecoratifs },
  { id: 'centraal_museum',       name: 'Centraal Museum Utrecht',         fetcher: fetchCentraalMuseum },
  { id: 'textile_museum_tilburg',name: 'Textile Museum Tilburg',          fetcher: fetchTextileMuseum },
  { id: 'wereldculturen',        name: 'Nationaal Museum van Wereldculturen', fetcher: fetchWereldculturen },
  { id: 'dec_arts_prague',       name: 'Museum of Decorative Arts Prague', fetcher: fetchDecArtsPrague },
  { id: 'designmuseum_dk',       name: 'Designmuseum Danmark',            fetcher: fetchDesignmuseumDK },
  { id: 'boijmans',              name: 'Museum Boijmans Van Beuningen',   fetcher: fetchBoijmans },
  { id: 'museu_traje',           name: 'Museu Nacional do Traje',         fetcher: fetchMuseuTraje },
  // Art, Sculpture & History Sources (added Mar 2026)
  { id: 'kmska',                 name: 'Royal Museum of Fine Arts Antwerp', fetcher: fetchKMSKA },
  { id: 'amsterdam_museum',     name: 'Amsterdam Museum',                fetcher: fetchAmsterdamMuseum },
  { id: 'ngi',                  name: 'National Gallery of Ireland',     fetcher: fetchNGI },
  { id: 'fries_museum',         name: 'Fries Museum',                    fetcher: fetchFriesMuseum },
  { id: 'groeninge',            name: 'Groeningemuseum',                 fetcher: fetchGroeninge },
  { id: 'groninger',            name: 'Groninger Museum',                fetcher: fetchGroninger },
  { id: 'moma_wd',              name: 'Museum of Modern Art (MoMA)',     fetcher: fetchMoMAWD },
  { id: 'rijksmuseum_twenthe',  name: 'Rijksmuseum Twenthe',             fetcher: fetchRijksmuseumTwenthe },
  { id: 'herzog_anton_ulrich',  name: 'Herzog Anton Ulrich Museum',      fetcher: fetchHerzogAntonUlrich },
  { id: 'galleria_palatina',    name: 'Galleria Palatina',               fetcher: fetchGalleriaPalatina },
  { id: 'lakenhal',             name: 'Museum De Lakenhal',              fetcher: fetchLakenhal },
  { id: 'teylers',              name: 'Teylers Museum',                  fetcher: fetchTeylers },
  { id: 'alte_pinakothek',      name: 'Alte Pinakothek',                 fetcher: fetchAltePinakothek },
  { id: 'quai_branly',          name: 'Musée du quai Branly',            fetcher: fetchQuaiBranly },
  // Phase H — 113 World Museum Collection Sources (auto-generated)
  ...WD_COLLECTIONS.map(c => ({ id: c.id, name: c.name, fetcher: makeCollectionFetcher(c.qid, c.id, c.langs) })),
];

async function fetchSource(source) {
  const allItems = [];
  let failCount = 0;

  for (let i = 0; i < SEED_TERMS.length; i++) {
    const term = SEED_TERMS[i];
    log(source.id, `fetching term ${i + 1}/${SEED_TERMS.length}: "${term}"`);
    try {
      const items = await source.fetcher(term);
      allItems.push(...items);
    } catch (e) {
      failCount++;
      log(source.id, `  term "${term}" failed: ${e.message}`);
    }
    // Rate limit: Wikidata blocks after ~100 queries/min, so we slow down between terms
    // 300ms baseline + extra 700ms for Wikidata SPARQL sources
    const isWikidata = source.fetcher.toString().includes('Wikidata') || source.fetcher === fetchWikidataSparql;
    const delay = isWikidata ? 1000 : 300;
    await new Promise(r => setTimeout(r, delay));
  }

  const deduped = dedupeById(allItems);
  if (deduped.length === 0) {
    log(source.id, `FAILED: 0 items collected (${failCount}/${SEED_TERMS.length} terms failed)`);
    return false;
  }

  saveSource(source.id, source.name, deduped);
  if (failCount > 0) {
    log(source.id, `WARNING: ${failCount}/${SEED_TERMS.length} terms failed (partial data)`);
  }
  return true;
}

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const results = { succeeded: [], failed: [] };

  for (const source of SOURCES) {
    log(source.id, `=== starting fetch ===`);
    try {
      const ok = await fetchSource(source);
      if (ok) results.succeeded.push(source.id);
      else results.failed.push(source.id);
    } catch (e) {
      log(source.id, `FAILED (unhandled): ${e.message}`);
      results.failed.push(source.id);
    }
  }

  // Write _index.json manifest
  const indexData = {
    lastUpdated: new Date().toISOString(),
    sources: SOURCES.map(s => {
      const succeeded = results.succeeded.includes(s.id);
      return {
        id: s.id,
        name: s.name,
        status: succeeded ? 'ok' : 'failed',
        lastFetched: succeeded ? new Date().toISOString() : null,
      };
    }),
  };
  writeFileSync(join(DATA_DIR, '_index.json'), JSON.stringify(indexData, null, 2), 'utf8');

  console.log('\n=== FETCH COMPLETE ===');
  console.log(`Succeeded: ${results.succeeded.length}/${SOURCES.length} — ${results.succeeded.join(', ') || '(none)'}`);
  console.log(`Failed:    ${results.failed.length}/${SOURCES.length} — ${results.failed.join(', ') || '(none)'}`);

  // Exit 1 if ALL sources failed (indicates a systemic problem)
  if (results.succeeded.length === 0 && SOURCES.length > 0) {
    console.error('ERROR: All sources failed — likely a network or rate-limit issue.');
    process.exit(1);
  }
  // Exit 0 for partial success
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error in fetch script:', e);
  // Best-effort: write a stub _index.json noting the failure so status never silently freezes.
  try {
    writeFileSync(join(DATA_DIR, '_index.json'), JSON.stringify({
      lastUpdated: new Date().toISOString(),
      error: String(e?.message || e),
      sources: [],
    }, null, 2), 'utf8');
  } catch (_) { /* ignore */ }
  process.exit(1);
});
