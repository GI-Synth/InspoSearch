#!/usr/bin/env node
/**
 * repopulate-thin-categories.cjs
 *
 * 1. Removes all rejected (keep === false) entries  
 * 2. Identifies categories/heroes with fewer than MIN_REMAINING images
 * 3. Pulls fresh candidates for those categories from new/better-tuned queries
 * 4. For photography specifically, uses art-photography focused queries
 *    to avoid portrait-of-random-person results
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const FILE         = path.join(__dirname, '..', 'admin', 'data', 'homepage-candidates.json');
const MIN_REMAINING = 20;
const PER_QUERY     = 20;
const DELAY_MS      = 350;
const MET_BATCH     = 8;

// ── Better-targeted queries for each thin category ──────────────────────────
// Photography was all rejected because it returned US portrait sittings.
// Use queries that target artistic/fine-art photography, not documentary.

const TOPUP_QUERIES = {
  photography: [
    'pictorialist photography soft focus',
    'photograph albumen print portrait vintage',
    'calotype photograph early',
    'platinum print photograph',
    'autochrome photograph color',
    'photogravure photograph artistic',
  ],
  'art nouveau & organic form': [
    'ornamental art nouveau floral design',
    'organic decorative pattern',
    'jugendstil decorative',
    'art nouveau poster',
  ],
  'ancient maps & cartography': [
    'old map antique chart engraving',
    'portolan sea chart',
    'celestial globe illustration',
    'astronomical map engraving',
  ],
  'impressionist light': [
    'impressionism oil painting outdoor',
    'plein air landscape painting',
    'pointillism painting',
    'light reflection water painting',
  ],
  ceramics: [
    'chinese porcelain blue white vase',
    'japanese pottery tea ceremony',
    'greek amphora pottery',
    'islamic ceramic tile',
  ],
  'maps & charts': [
    'world map illuminated medieval',
    'ptolemy geography map',
    'old nautical chart',
  ],
};

// ── HTTP helper ──────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 12000, headers: { 'User-Agent': 'InspoSearch-Admin/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location).then(resolve).catch(reject); return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse: ${url}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Quality filters (same as pull script) ───────────────────────────────────

function toIIIF800(url) {
  if (!url) return url;
  return url.replace(/\/full\/[^/]+\/0\/default\.(jpg|png)/i, '/full/800,/0/default.jpg');
}

function normalizeForDedup(url) {
  if (!url) return '';
  return url
    .replace(/\/full\/[^/]+\/0\/default\.\w+/, '/NORM')
    .replace(/\?.*$/, '')
    .toLowerCase();
}

function isLikelyLargeEnough(url) {
  if (!url) return false;
  const m = url.match(/\/full\/!?(\d+),/);
  if (m && parseInt(m[1], 10) < 400) return false;
  if (/[-_]thumb|[-_]small|[-_]tiny|\/thumb\//i.test(url)) return false;
  const w = url.match(/[?&]w(?:idth)?=(\d+)/i);
  if (w && parseInt(w[1], 10) < 400) return false;
  return true;
}

const BAD_TITLE = [
  /\bcatalogue\b/i, /\bcatalog\b/i, /\bdictionary\b/i, /\bmanual\b/i,
  /\bhandbook\b/i, /\bencyclopedia\b/i, /^(a |the )?(complete |new |illustrated )?guide\b/i,
  /\bintroduction to\b/i, /^by [a-z]/i, /\bwith additions\b/i,
];

function isBadTitle(title) {
  return BAD_TITLE.some(p => p.test(title || ''));
}

// ── Adapters (MET + Wellcome only — best quality-to-noise ratio) ─────────────

async function fetchMet(query, limit) {
  const data = await fetchJSON(
    `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`
  );
  const ids = (data.objectIDs || []).slice(0, limit);
  if (!ids.length) return [];

  const results = [];
  for (let i = 0; i < ids.length; i += MET_BATCH) {
    const batch = ids.slice(i, i + MET_BATCH);
    const settled = await Promise.allSettled(
      batch.map(id => fetchJSON(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`))
    );
    for (const r of settled) {
      if (r.status !== 'fulfilled') continue;
      const obj = r.value;
      if (!obj.primaryImage && !obj.primaryImageSmall) continue;
      if (isBadTitle(obj.title)) continue;
      results.push({
        url:       obj.primaryImage || obj.primaryImageSmall,
        thumb:     obj.primaryImageSmall || obj.primaryImage,
        title:     obj.title || 'Untitled',
        artist:    obj.artistDisplayName || '',
        year:      obj.objectDate || '',
        source:    'met',
        sourceUrl: `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
        keep:      null,
      });
    }
    if (i + MET_BATCH < ids.length) await sleep(DELAY_MS);
  }
  return results;
}

async function fetchWellcome(query, limit) {
  const data = await fetchJSON(
    `https://api.wellcomecollection.org/catalogue/v2/works?query=${encodeURIComponent(query)}&pageSize=${limit}&include=identifiers`
  );
  return (data.results || [])
    .filter(item => item.thumbnail?.url && !isBadTitle(item.title))
    .map(item => ({
      url:       toIIIF800(item.thumbnail.url),
      thumb:     item.thumbnail.url,
      title:     item.title || 'Wellcome Image',
      artist:    '',
      year:      '',
      source:    'wellcome',
      sourceUrl: `https://wellcomecollection.org/works/${item.id}`,
      keep:      null,
    }));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  InspoSearch — Purge Rejected + Repopulate Thin     ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

  // ── Step 1: Purge rejected ───────────────────────────────────────────────
  console.log('── Step 1: Purging rejected entries ───────────────────');
  let purged = 0;
  for (const section of [data.categories, data.heroes]) {
    for (const key of Object.keys(section)) {
      const before = section[key].length;
      section[key] = section[key].filter(i => i.keep !== false);
      purged += before - section[key].length;
    }
  }
  console.log(`  Removed ${purged} rejected entries\n`);

  // ── Step 2: Find thin categories ────────────────────────────────────────
  console.log('── Step 2: Scanning for thin categories (<' + MIN_REMAINING + ' images) ─');
  const thin = {};

  for (const [section, groups] of [['categories', data.categories], ['heroes', data.heroes]]) {
    for (const [key, items] of Object.entries(groups)) {
      const remaining = items.filter(i => i.keep !== false).length;
      const shortKey  = key.replace(/^hero:/, '');
      if (remaining < MIN_REMAINING && TOPUP_QUERIES[shortKey]) {
        thin[key] = { section, group: groups, remaining };
        console.log(`  ▸ "${key}" — ${remaining} remaining (needs top-up)`);
      } else {
        console.log(`  ✓ "${key}" — ${remaining} remaining (ok)`);
      }
    }
  }

  if (Object.keys(thin).length === 0) {
    console.log('\n  All categories have enough images. Nothing to do.');
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
    return;
  }

  // ── Step 3: Build global dedup set from existing URLs ───────────────────
  const seen = new Set();
  for (const section of [data.categories, data.heroes]) {
    for (const items of Object.values(section)) {
      for (const item of items) seen.add(normalizeForDedup(item.url));
    }
  }

  // ── Step 4: Repopulate thin categories ──────────────────────────────────
  console.log('\n── Step 3: Fetching top-ups ────────────────────────────');

  for (const [key, { group, remaining }] of Object.entries(thin)) {
    const shortKey = key.replace(/^hero:/, '');
    const queries  = TOPUP_QUERIES[shortKey] || [];
    const target   = MIN_REMAINING + 5; // add a few extra for next review
    const needed   = Math.max(0, target - remaining);

    console.log(`\n  ▸ ${key.toUpperCase()} (need ~${needed} more)`);
    const newItems = [];

    for (const query of queries) {
      if (newItems.length >= needed * 2) break; // enough candidates

      for (const [name, fetcher] of [['MET', fetchMet], ['Wellcome', fetchWellcome]]) {
        try {
          process.stdout.write(`    ${name}("${query}")...`);
          const results = await fetcher(query, PER_QUERY);
          let added = 0;
          for (const item of results) {
            if (!isLikelyLargeEnough(item.url) && !isLikelyLargeEnough(item.thumb)) continue;
            item.url = toIIIF800(item.url);
            const dk = normalizeForDedup(item.url);
            if (seen.has(dk)) continue;
            seen.add(dk);
            item._group   = key;
            item._section = key.startsWith('hero:') ? 'hero' : 'category';
            newItems.push(item);
            added++;
          }
          process.stdout.write(` ${added} added\n`);
        } catch (err) {
          process.stdout.write(` ✗ ${err.message}\n`);
        }
        await sleep(DELAY_MS);
      }
    }

    // Append new items to the right section
    group[key].push(...newItems);
    console.log(`  ✓ "${key}" now has ${group[key].length} candidates (+${newItems.length})`);
  }

  // ── Step 5: Write updated file ───────────────────────────────────────────
  data._repopulated = new Date().toISOString();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Done — refresh http://localhost:8787               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('\n✗ Fatal:', err);
  process.exit(1);
});
