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
      'User-Agent': 'InspoSearch/1.0 (https://github.com/GI-Synth/InspoSearch)',
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
  const out = {
    sourceId,
    sourceName,
    lastFetched: new Date().toISOString(),
    items: items.slice(0, MAX_ITEMS),
  };
  const path = join(DATA_DIR, `${sourceId}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');
  log(sourceId, `saved ${out.items.length} items → ${path}`);
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
      'User-Agent': 'InspoSearch/1.0',
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
    headers: { 'User-Agent': 'InspoSearch/1.0', 'Accept': 'application/json' },
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
    headers: { 'User-Agent': 'InspoSearch/1.0', 'Accept': 'application/json' },
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
    headers: { 'User-Agent': 'InspoSearch/1.0', 'Accept': 'application/json' },
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

// National Gallery London
async function fetchNationalGalleryLondon(term) {
  // National Gallery uses Elasticsearch — try collection API
  const url = `https://www.nationalgallery.org.uk/api/search/artworks?q=${encodeURIComponent(term)}&limit=25`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspoSearch/1.0)', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.artworks || data.results || data.hits?.hits || [])
    .filter(item => {
      const src = item._source || item;
      return src.images?.length || src.primaryImage || src.imageUrl;
    })
    .map(item => {
      const src = item._source || item;
      const img = src.images?.[0]?.url || src.primaryImage || src.imageUrl || '';
      return {
        img, thumb: img,
        title: src.title || src.name || 'National Gallery Work',
        source: 'national_gallery_london', tags: [term],
      };
    })
    .filter(item => item.img.startsWith('http'));
}

// Scottish National Gallery
async function fetchScottishNational(term) {
  const url = `https://api.nationalgalleries.org/api/2/search?q=${encodeURIComponent(term)}&format=json&limit=25`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'InspoSearch/1.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.results || data.items || [])
    .filter(item => item.mediaUrl || item.thumbnail || item.image)
    .map(item => {
      const img = item.mediaUrl || item.thumbnail || item.image || '';
      return {
        img, thumb: img,
        title: item.title || item.name || 'Scottish National Gallery Work',
        source: 'scottish_national', tags: [term],
      };
    })
    .filter(item => item.img.startsWith('http'));
}

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
    // Small delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
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
  console.log(`Succeeded: ${results.succeeded.join(', ') || '(none)'}`);
  console.log(`Failed:    ${results.failed.join(', ') || '(none)'}`);
  console.log('Exit 0 (partial success is OK for nightly fetch)');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error in fetch script:', e);
  process.exit(0); // still exit 0
});
