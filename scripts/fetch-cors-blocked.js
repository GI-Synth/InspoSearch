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
const TIMEOUT_MS = 15000;

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

// Prado — Museo Nacional del Prado
async function fetchPrado(term) {
  const url = `https://www.museodelprado.es/api/v1/artwork?language=en&keyword=${encodeURIComponent(term)}&limit=25`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; InspoSearch/1.0)',
      'Accept': 'application/json',
      'Referer': 'https://www.museodelprado.es/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.items || data.artworks || [])
    .filter(item => item.image?.large || item.image?.medium || item.image?.small)
    .map(item => ({
      img:    item.image?.large || item.image?.medium || item.image?.small,
      thumb:  item.image?.small || item.image?.medium || item.image?.large,
      title:  item.title || 'Prado Work',
      source: 'prado',
      tags:   [term],
    }));
}

// Paris Musées — Parisian museum collections via GraphQL
async function fetchParisMusees(term) {
  const query = `{ nodeQuery(filter: {conditions: [{field: "title", value: "${term.replace(/"/g, '')}", operator: LIKE}]}, limit: 25) { entities { ... on NodeOeuvre { title field_auteur field_visuels { entity { thumbnail { url } } } } } } }`;
  const res = await fetchWithTimeout('https://apicollections.parismusees.paris.fr/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; InspoSearch/1.0)',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(`GraphQL error: ${data.errors[0]?.message}`);
  return (data.data?.nodeQuery?.entities || [])
    .map(entity => {
      const imgUrl = entity?.field_visuels?.[0]?.entity?.thumbnail?.url;
      if (!imgUrl) return null;
      return {
        img:    imgUrl,
        thumb:  imgUrl,
        title:  entity?.title || 'Paris Musées Item',
        source: 'parismusees',
        tags:   [term],
      };
    })
    .filter(Boolean);
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

// Thyssen — Museo Nacional Thyssen-Bornemisza
async function fetchThyssen(term) {
  const url = `https://www.museothyssen.org/api/v1/coleccion/obras?search=${encodeURIComponent(term)}&page=1&per_page=25`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; InspoSearch/1.0)',
      'Accept': 'application/json',
      'Referer': 'https://www.museothyssen.org/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || [])
    .filter(item => item.imagen_url)
    .map(item => ({
      img:    item.imagen_url,
      thumb:  item.imagen_url,
      title:  item.titulo || 'Thyssen Artwork',
      source: 'thyssen',
      tags:   [term],
    }));
}

// CUDL — Cambridge University Digital Library
async function fetchCUDL(term) {
  const url = `https://services.cudl.lib.cam.ac.uk/v1/search?query=${encodeURIComponent(term)}&start=1&end=25`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'InspoSearch/1.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const items = data.results?.items || data.items || [];
  return items
    .filter(item => item.thumbnailUrl || item.thumbnail)
    .map(item => {
      const thumb = item.thumbnailUrl || item.thumbnail || '';
      return {
        img:    thumb,
        thumb,
        title:  item.title || 'CUDL Object',
        source: 'cudl',
        tags:   [term],
      };
    });
}

// ── main orchestrator ─────────────────────────────────────────────────────

const SOURCES = [
  { id: 'prado',       name: 'Museo del Prado',          fetcher: fetchPrado },
  { id: 'parismusees', name: 'Paris Musées',              fetcher: fetchParisMusees },
  { id: 'soch',        name: 'Swedish Open Cultural Heritage', fetcher: fetchSOCH },
  { id: 'thyssen',     name: 'Museo Thyssen-Bornemisza',  fetcher: fetchThyssen },
  { id: 'cudl',        name: 'Cambridge Digital Library', fetcher: fetchCUDL },
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
