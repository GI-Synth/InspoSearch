/**
 * update-source-count.cjs — Prebuild script
 * Single source of truth for all source/image counts across the project.
 * Reads ALL_SOURCES + manifest, computes totals, updates every file.
 *
 * Usage: node scripts/update-source-count.cjs
 * Wire as "prebuild" in package.json.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, c) => fs.writeFileSync(path.join(root, f), c, 'utf8');

const state = read('src/state.js');

// ── Count sources ──────────────────────────────────────────────
const allSrcMatch = state.match(/export const ALL_SOURCES\s*=\s*\[([\s\S]*?)\];/);
const allSourcesCount = allSrcMatch ? (allSrcMatch[1].match(/'[^']+'/g) || []).length : 0;

let manifestCount = 0;
try {
  const manifest = JSON.parse(read('insposearch/sources.manifest.json'));
  manifestCount = (manifest.sources || []).length;
} catch {}

const staticSources = allSourcesCount + manifestCount;

// ── Dynamic discovery estimate ─────────────────────────────────
// At runtime, discoverEuropeanaProviders() + discoverDPLAProviders() add
// ~2300 sources from Europeana DATA_PROVIDER facets (~2250) and DPLA hubs (~50).
// This number changes slowly (Europeana grows ~100/year). We store the last
// known count so marketing copy reflects what users actually see.
// Update this after verifying with: connect Europeana key → check console log.
const LAST_KNOWN_DYNAMIC = 2300;

const totalSources = staticSources + LAST_KNOWN_DYNAMIC;

// ── Count images from KEY_SOURCES imageCount fields ────────────
const imageCountMatches = state.match(/imageCount:\s*(\d[\d_]*)/g) || [];
let totalImages = 0;
for (const m of imageCountMatches) {
  totalImages += Number(m.match(/(\d[\d_]*)/)[1].replace(/_/g, ''));
}

// ── Count no-key sources (in ALL_SOURCES but not in KEY_SOURCES with stateKey) ──
const keySourceIds = [];
const keySourceRe = /id:\s*'([^']+)'[\s\S]*?stateKey:\s*'([^']*)'/g;
let km;
while ((km = keySourceRe.exec(state)) !== null) {
  if (km[2]) keySourceIds.push(km[1]); // has a stateKey → needs a key
}
const noKeyCount = staticSources - keySourceIds.length;

// ── Format labels ──────────────────────────────────────────────
const srcLabel = totalSources + '+';
const imgLabel = totalImages >= 1e9
  ? (totalImages / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+'
  : totalImages >= 1e6
    ? (totalImages / 1e6).toFixed(0) + 'M+'
    : totalImages.toLocaleString();
const imgBillionNum = totalImages >= 1e9
  ? (totalImages / 1e9).toFixed(1).replace(/\.0$/, '')
  : '0';

console.log(`Sources: ${totalSources} (static=${staticSources} [ALL_SOURCES=${allSourcesCount} + manifest=${manifestCount}] + dynamic≈${LAST_KNOWN_DYNAMIC})`);
console.log(`Images:  ${totalImages.toLocaleString()} → "${imgLabel}"`);
console.log(`No-key:  ${noKeyCount} (static only — dynamic sources require keys)`);
console.log(`Labels:  "${srcLabel}" sources, "${imgLabel}" images`);

// ── Helper: replace all occurrences, report count ──────────────
function replaceAll(content, regex, replacement, label) {
  let count = 0;
  const result = content.replace(regex, (...args) => {
    count++;
    // Support $1, $2, etc. backreferences in replacement string
    let out = replacement;
    for (let i = 1; i < args.length - 2; i++) {
      out = out.replace('$' + i, args[i] || '');
    }
    return out;
  });
  if (count) console.log(`    ${label}: ${count} replacement(s)`);
  return result;
}

// ── Update files ───────────────────────────────────────────────
let filesChanged = 0;

// --- insposearch/index.html ---
{
  const file = 'insposearch/index.html';
  let c = read(file);
  const before = c;

  // All meta descriptions & JSON-LD: "Search N+ museum, archive, and photo sources ... X billion images"
  // Catches: 10,000+, 196+, 500+, any number with optional commas and +
  c = replaceAll(c,
    /Search [\d,]+\+? museum, archive, and photo sources[^"]*?(?:[\d.]+ billion images|zero storage|infinite images)[^"]*/g,
    `Search ${srcLabel} museum, archive, and photo sources for creative inspiration — ${imgBillionNum} billion images, zero storage`,
    'meta/JSON-LD descriptions');

  if (c !== before) { write(file, c); filesChanged++; console.log(`  Updated: ${file}`); }
}

// --- insposearch/institutions.html ---
{
  const file = 'insposearch/institutions.html';
  let c = read(file);
  const before = c;

  // Stat boxes: replace any number in stat-num followed by stat-label containing "sources", "images", or "no-setup"
  c = replaceAll(c,
    /(<div class="stat-num">)[\d,.]+[BMK]?\+?(<\/div>\s*\n\s*<div class="stat-label">active sources)/g,
    `$1${srcLabel}$2`, 'stat: active sources');
  c = replaceAll(c,
    /(<div class="stat-num">)[\d,.]+[BMK]?\+?(<\/div>\s*\n\s*<div class="stat-label">searchable images)/g,
    `$1${imgLabel}$2`, 'stat: searchable images');
  c = replaceAll(c,
    /(<div class="stat-num">)[\d,.]+\+?(<\/div>\s*\n\s*<div class="stat-label">no-setup sources)/g,
    `$1${noKeyCount}$2`, 'stat: no-setup sources');

  // <strong>N+</strong> active sources / searchable images in partner section
  c = replaceAll(c, /<strong>[\d,.]+\+?<\/strong> active sources/g,
    `<strong>${srcLabel}</strong> active sources`, 'partner: sources');
  c = replaceAll(c, /<strong>[\d,.]+[BMK]?\+?<\/strong> searchable images/g,
    `<strong>${imgLabel}</strong> searchable images`, 'partner: images');

  if (c !== before) { write(file, c); filesChanged++; console.log(`  Updated: ${file}`); }
}

// --- insposearch/manifest.json ---
{
  const file = 'insposearch/manifest.json';
  let c = read(file);
  const before = c;
  c = replaceAll(c,
    /Search [\d.]+ billion images across [\d,]+ museums/g,
    `Search ${imgBillionNum} billion images across ${totalSources} museums`,
    'PWA manifest description');
  if (c !== before) { write(file, c); filesChanged++; console.log(`  Updated: ${file}`); }
}

// --- src/app.js ---
{
  const file = 'src/app.js';
  let c = read(file);
  const before = c;
  c = replaceAll(c,
    /Search [\d,]+\+? museum, archive, and photo sources/g,
    `Search ${srcLabel} museum, archive, and photo sources`,
    'app.js search text');
  c = replaceAll(c,
    /across [\d,]+\+? cultural heritage sources/g,
    `across ${srcLabel} cultural heritage sources`,
    'app.js cultural heritage');
  if (c !== before) { write(file, c); filesChanged++; console.log(`  Updated: ${file}`); }
}

// --- README.md ---
{
  const file = 'README.md';
  let c = read(file);
  const before = c;

  // Headline: "500+ sources, 3B+ images" → current totals
  c = replaceAll(c,
    /\*\*The world's open cultural image search[^*]*\*\*/g,
    `**The world's open cultural image search \u2014 ${srcLabel} sources, ${imgLabel} images, one search.**`,
    'README headline');

  // Shields.io badge URLs: sources-500%2B → sources-2496%2B etc.
  c = replaceAll(c,
    /sources-[\d.BMK%2+]+\+-brightgreen/g,
    `sources-${encodeURIComponent(srcLabel)}-brightgreen`,
    'README badge: sources');
  c = replaceAll(c,
    /images-[\d.BMK%2+]+\+-brightgreen/g,
    `images-${encodeURIComponent(imgLabel)}-brightgreen`,
    'README badge: images');

  // Feature table rows
  c = replaceAll(c,
    /\| \*\*[\d,.]+\+? sources\*\* \|/g,
    `| **${srcLabel} sources** |`,
    'README table: sources');
  c = replaceAll(c,
    /\| \*\*[\d,.B]+\+? images\*\* \|([^\n]*)\d+\+? more/g,
    `| **${imgLabel} images** |$1${totalSources - 10}+ more`,
    'README table: images');

  // "480+ more" / "490+ more" in "What it is"
  c = replaceAll(c,
    /and \d+\+ more \u2014 \*\*all at once\*\*/g,
    `and ${totalSources - 10}+ more \u2014 **all at once**`,
    'README what-it-is count');

  if (c !== before) { write(file, c); filesChanged++; console.log(`  Updated: ${file}`); }
}

console.log(`\nDone. ${filesChanged} file(s) updated.`);
