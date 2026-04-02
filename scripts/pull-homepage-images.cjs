#!/usr/bin/env node
/**
 * pull-homepage-images.cjs
 * 
 * Fetches candidate images from InspoSearch's free, no-key-required museum APIs
 * for each homepage category and hero theme. Outputs a JSON file of candidates
 * for human curation.
 *
 * Usage:  node scripts/pull-homepage-images.cjs [--output admin/data/homepage-candidates.json]
 *
 * Quality filters applied:
 *   1. Skip images with thumbnails below 400px (where detectable)
 *   2. Prefer IIIF URLs — rewrite to /full/800,/0/default.jpg for consistent sizing
 *   3. Deduplicate by normalized image URL
 *   4. Multiple query variants per category for visual diversity
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────

const OUTPUT = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : path.join(__dirname, '..', 'admin', 'data', 'homepage-candidates.json');

const PER_QUERY = 15;          // results per query variant
const DELAY_MS  = 350;         // polite delay between API calls
const MET_DETAIL_BATCH = 8;    // parallel detail fetches for MET

// ── Category → Query Variants ───────────────────────────────────────────────

const CATEGORY_QUERIES = {
  paintings: [
    'oil painting masterpiece',
    'portrait painting golden age',
    'still life dutch painting',
    'impressionist landscape painting',
    'renaissance painting madonna',
  ],
  photography: [
    'vintage photograph portrait',
    'daguerreotype',
    'black white photograph street',
    'photograph landscape 1900',
  ],
  sculpture: [
    'marble sculpture classical',
    'bronze sculpture figure',
    'sculpture bust portrait',
    'ancient greek sculpture',
  ],
  architecture: [
    'cathedral gothic architecture',
    'architectural drawing elevation',
    'temple architecture ancient',
    'palace interior baroque',
  ],
  manuscripts: [
    'illuminated manuscript medieval',
    'manuscript gold leaf initial',
    'book of hours manuscript',
    'medieval bestiary manuscript',
  ],
  'maps & charts': [
    'antique map world',
    'cartography atlas sea chart',
    'celestial map astronomy',
    'map medieval mappa mundi',
  ],
  textiles: [
    'tapestry medieval',
    'embroidery silk textile',
    'persian carpet rug',
    'textile pattern woven',
  ],
  prints: [
    'engraving etching portrait',
    'woodcut print illustration',
    'durer engraving',
    'lithograph poster vintage',
  ],
  ceramics: [
    'porcelain vase chinese',
    'delftware pottery blue',
    'ceramic tile islamic',
    'majolica plate italian',
  ],
  'natural history': [
    'botanical illustration flower',
    'natural history specimen bird',
    'botanical drawing plant',
    'insect illustration scientific',
  ],
};

const HERO_QUERIES = {
  'the dutch golden age': [
    'vermeer painting',
    'rembrandt painting',
    'dutch golden age still life',
  ],
  'japanese woodblock prints': [
    'hokusai wave',
    'hiroshige landscape woodblock',
    'ukiyo-e print',
  ],
  'art nouveau & organic form': [
    'mucha poster art nouveau',
    'art nouveau ornamental',
    'klimt gold painting',
  ],
  'illuminated manuscripts': [
    'illuminated manuscript gold',
    'book of kells page',
    'medieval manuscript initial',
  ],
  'botanical illustration': [
    'botanical illustration hand colored',
    'maria sibylla merian insect',
    'botanical plate flower',
  ],
  'ancient maps & cartography': [
    'blaeu atlas map',
    'antique world map cartography',
    'portolan chart',
  ],
  'impressionist light': [
    'monet water lilies',
    'renoir impressionist',
    'impressionist painting sunlight',
  ],
};

// ── HTTP helper ─────────────────────────────────────────────────────────────

function fetchJSON(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 12000, headers: { 'User-Agent': 'InspoSearch-Admin/1.0' } }, res => {
      if (res.statusCode === 429) {
        reject(new Error(`429 rate-limited: ${url}`));
        return;
      }
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location, opts).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── IIIF URL rewriter (Quality Filter #2) ───────────────────────────────────

function toIIIF800(url) {
  if (!url) return url;
  // Rewrite IIIF Image API URLs to request 800px wide
  // Pattern: .../full/max/0/default.jpg  or  .../full/!200,200/0/default.jpg
  const iiifPattern = /\/full\/[^/]+\/0\/default\.(jpg|png)/i;
  if (iiifPattern.test(url)) {
    return url.replace(iiifPattern, '/full/800,/0/default.jpg');
  }
  return url;
}

// ── Deduplication (Quality Filter #3) ───────────────────────────────────────

function normalizeUrlForDedup(url) {
  if (!url) return '';
  // Strip size params from IIIF URLs for dedup comparison
  return url
    .replace(/\/full\/[^/]+\/0\/default\.\w+/, '/full/NORM/0/default.jpg')
    .replace(/\?.*$/, '')
    .toLowerCase();
}

// ── Size filter (Quality Filter #1) ─────────────────────────────────────────
// We can't always know dimensions without fetching, but we can:
// - Skip known-tiny IIIF thumbs (e.g. /full/!100,100/)
// - Skip URLs containing telltale small-size indicators

function isLikelyLargeEnough(url) {
  if (!url) return false;
  // Reject IIIF images explicitly sized below 400
  const iiifSize = url.match(/\/full\/!?(\d+),(\d*)\//);
  if (iiifSize) {
    const w = parseInt(iiifSize[1], 10);
    if (w > 0 && w < 400) return false;
  }
  // Reject known tiny thumbnail patterns
  if (/[-_]thumb|[-_]small|[-_]tiny|\/thumb\//i.test(url)) return false;
  // Reject very small explicit sizes in query params
  const wParam = url.match(/[?&]w(?:idth)?=(\d+)/i);
  if (wParam && parseInt(wParam[1], 10) < 400) return false;
  return true;
}

// ── Source Adapters ─────────────────────────────────────────────────────────

async function fetchMet(query, limit) {
  const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`;
  const data = await fetchJSON(searchUrl);
  const ids = (data.objectIDs || []).slice(0, limit);
  if (!ids.length) return [];

  const results = [];
  // Fetch in small batches to be polite
  for (let i = 0; i < ids.length; i += MET_DETAIL_BATCH) {
    const batch = ids.slice(i, i + MET_DETAIL_BATCH);
    const objects = await Promise.allSettled(
      batch.map(id =>
        fetchJSON(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
      )
    );
    for (const r of objects) {
      if (r.status !== 'fulfilled') continue;
      const obj = r.value;
      if (!obj.primaryImage && !obj.primaryImageSmall) continue;
      results.push({
        url:       obj.primaryImage || obj.primaryImageSmall,
        thumb:     obj.primaryImageSmall || obj.primaryImage,
        title:     obj.title || 'Untitled',
        artist:    obj.artistDisplayName || '',
        year:      obj.objectDate || '',
        source:    'met',
        sourceUrl: `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
      });
    }
    if (i + MET_DETAIL_BATCH < ids.length) await sleep(DELAY_MS);
  }
  return results;
}

async function fetchRijksmuseum(query, limit) {
  const url = `https://data.rijksmuseum.nl/search/collection?description=${encodeURIComponent(query)}&imageAvailable=true`;
  const data = await fetchJSON(url);
  const items = (data.orderedItems || []).slice(0, limit);

  const results = [];
  const resolved = await Promise.allSettled(
    items.map(item =>
      fetchJSON(item.id).catch(() => null)
    )
  );

  for (const r of resolved) {
    if (r.status !== 'fulfilled' || !r.value) continue;
    const obj = r.value;
    const imgUrl = obj.representation?.[0]?.id;
    if (!imgUrl) continue;
    results.push({
      url:       imgUrl,
      thumb:     imgUrl,
      title:     obj._label || 'Rijksmuseum Object',
      artist:    '',
      year:      '',
      source:    'rijksmuseum',
      sourceUrl: obj.id || '',
    });
  }
  return results;
}

async function fetchLOC(query, limit) {
  const url = `https://www.loc.gov/search/?q=${encodeURIComponent(query)}&fo=json&fa=online-format:image&c=${limit}`;
  const data = await fetchJSON(url);
  return (data.results || [])
    .filter(item => item.image_url)
    .map(item => {
      const img = Array.isArray(item.image_url)
        ? (Array.isArray(item.image_url[0]) ? item.image_url[0][0] : item.image_url[0])
        : item.image_url;
      return {
        url:       img,
        thumb:     img,
        title:     Array.isArray(item.title) ? item.title[0] : (item.title || 'LOC Image'),
        artist:    '',
        year:      item.date ? String(item.date).slice(0, 4) : '',
        source:    'loc',
        sourceUrl: item.id || '',
      };
    })
    .filter(r => r.url);
}

async function fetchWellcome(query, limit) {
  const url = `https://api.wellcomecollection.org/catalogue/v2/works?query=${encodeURIComponent(query)}&pageSize=${limit}&include=identifiers`;
  const data = await fetchJSON(url);
  return (data.results || [])
    .filter(item => item.thumbnail?.url)
    .map(item => ({
      url:       toIIIF800(item.thumbnail.url),
      thumb:     item.thumbnail.url,
      title:     item.title || 'Wellcome Image',
      artist:    '',
      year:      '',
      source:    'wellcome',
      sourceUrl: `https://wellcomecollection.org/works/${item.id}`,
    }));
}

async function fetchArchiveOrg(query, limit) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:image&fl[]=identifier,title,description,date&rows=${limit}&output=json`;
  const data = await fetchJSON(url);
  return (data.response?.docs || [])
    .map(doc => ({
      url:       `https://archive.org/services/img/${doc.identifier}`,
      thumb:     `https://archive.org/services/img/${doc.identifier}`,
      title:     doc.title || 'Archive.org Image',
      artist:    '',
      year:      doc.date ? String(doc.date).slice(0, 4) : '',
      source:    'archive',
      sourceUrl: `https://archive.org/details/${doc.identifier}`,
    }))
    .filter(r => r.url);
}

async function fetchSmithsonian(query, limit) {
  // Smithsonian Open Access — no key needed for basic search
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(query)}&rows=${limit}&api_key=DEMO_KEY`;
  const data = await fetchJSON(url);
  return (data.response?.rows || [])
    .filter(row => {
      const media = row.content?.descriptiveNonRepeating?.online_media?.media;
      return media && media.length > 0 && media[0].thumbnail;
    })
    .map(row => {
      const nr = row.content.descriptiveNonRepeating;
      const media = nr.online_media.media[0];
      return {
        url:       media.content || media.thumbnail,
        thumb:     media.thumbnail,
        title:     nr.title?.content || 'Smithsonian Object',
        artist:    '',
        year:      '',
        source:    'smithsonian',
        sourceUrl: nr.record_link || nr.guid || '',
      };
    });
}

// ── Main Pipeline ───────────────────────────────────────────────────────────

const ADAPTERS = [fetchMet, fetchRijksmuseum, fetchLOC, fetchWellcome, fetchArchiveOrg, fetchSmithsonian];
const ADAPTER_NAMES = ['MET', 'Rijksmuseum', 'LOC', 'Wellcome', 'Archive.org', 'Smithsonian'];

async function pullForQueries(queries, label) {
  const seen = new Set();
  const candidates = [];

  for (const query of queries) {
    // Rotate through adapters for diversity
    for (const adapter of ADAPTERS) {
      try {
        process.stdout.write(`  ⟶ ${adapter.name}("${query}")...`);
        const results = await adapter(query, PER_QUERY);
        let added = 0;
        for (const item of results) {
          // Quality Filter #1 — size
          if (!isLikelyLargeEnough(item.url) && !isLikelyLargeEnough(item.thumb)) continue;

          // Quality Filter #2 — IIIF upgrade
          item.url = toIIIF800(item.url);

          // Quality Filter #3 — dedup
          const key = normalizeUrlForDedup(item.url);
          if (seen.has(key)) continue;
          seen.add(key);

          candidates.push({
            ...item,
            category: label,
            keep: null,  // null = unreviewed, true = keep, false = reject
          });
          added++;
        }
        process.stdout.write(` ${added} added\n`);
        await sleep(DELAY_MS);
      } catch (err) {
        process.stdout.write(` ✗ ${err.message}\n`);
        await sleep(DELAY_MS);
      }
    }
  }
  return candidates;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  InspoSearch — Homepage Image Pool Builder          ║');
  console.log('║  Pulling candidates from museum APIs...             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const output = {
    _generated: new Date().toISOString(),
    _status: 'candidates — review in admin/index.html',
    _filters: [
      'min 400px (IIIF/URL heuristic)',
      'IIIF rewritten to 800px wide',
      'deduplicated by normalized URL',
      'multiple query variants per category',
    ],
    categories: {},
    heroes: {},
    stats: {},
  };

  // ── Categories ──────────────────────────────────────────────
  for (const [cat, queries] of Object.entries(CATEGORY_QUERIES)) {
    console.log(`\n▸ CATEGORY: ${cat.toUpperCase()}`);
    output.categories[cat] = await pullForQueries(queries, cat);
    output.stats[cat] = output.categories[cat].length;
    console.log(`  ✓ ${output.categories[cat].length} candidates`);
  }

  // ── Heroes ──────────────────────────────────────────────────
  for (const [hero, queries] of Object.entries(HERO_QUERIES)) {
    console.log(`\n▸ HERO: ${hero.toUpperCase()}`);
    output.heroes[hero] = await pullForQueries(queries, `hero:${hero}`);
    output.stats[`hero:${hero}`] = output.heroes[hero].length;
    console.log(`  ✓ ${output.heroes[hero].length} candidates`);
  }

  // ── Write output ────────────────────────────────────────────
  const dir = path.dirname(OUTPUT);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');

  const total = Object.values(output.categories).reduce((s, a) => s + a.length, 0)
    + Object.values(output.heroes).reduce((s, a) => s + a.length, 0);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  Done — ${total} total candidates                      `);
  console.log(`║  Output: ${path.relative(process.cwd(), OUTPUT)}`);
  console.log('║  Open admin/index.html to review                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('\n✗ Fatal error:', err);
  process.exit(1);
});
