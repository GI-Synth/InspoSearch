/**
 * update-source-counts.js — single source of truth propagator.
 *
 * Reads insposearch/data/_source_counts.json (the audit-derived compact
 * index), combines it with src/state.js KEY_SOURCES imageCount fields, and
 * rewrites every hardcoded source/image count in README.md, index.html,
 * institutions.html, and manifest.json.
 *
 * Supersedes the legacy scripts/update-source-count.cjs, which inflated
 * numbers with an unverifiable "LAST_KNOWN_DYNAMIC = 2300" constant and
 * had no connection to the real audit.
 *
 * Usage:
 *   node scripts/update-source-counts.js            # apply
 *   node scripts/update-source-counts.js --check    # fail if files stale
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const check = process.argv.includes('--check');

const read  = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, c) => {
  const p = path.join(root, f);
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (cur === c) return false;
  if (check) {
    console.error(`stale: ${f}`);
    return 'stale';
  }
  fs.writeFileSync(p, c, 'utf8');
  return true;
};

// ── Load audit-derived counts ──────────────────────────────────
const audit = JSON.parse(read('insposearch/data/_source_counts.json'));
const state = read('src/state.js');

// Top-level-source totals (mirrors sourceCount.js math).
let totalSources = 0, zeroKeyActive = 0, allKeysActive = 0, broken = 0;
for (const s of Object.values(audit.sources)) {
  totalSources += 1;
  if (!s.a) { broken += 1; continue; }
  if (!s.k) { zeroKeyActive += 1; allKeysActive += 1; }
  else { allKeysActive += 1; }
}

// Federated-institution totals — zero-key baseline vs. full-key maximum.
let fedZero = 0, fedMax = 0;
for (const s of Object.values(audit.sources)) {
  if (!s.a || !s.n) continue;
  fedMax += s.n;
  if (!s.k) fedZero += s.n;
}

// Image count — sum of KEY_SOURCES imageCount fields in state.js.
const imageCountMatches = state.match(/imageCount:\s*(\d[\d_]*)/g) || [];
let totalImages = 0;
for (const m of imageCountMatches) {
  totalImages += Number(m.match(/(\d[\d_]*)/)[1].replace(/_/g, ''));
}

// ── Format labels ─────────────────────────────────────────────
const srcLabel = totalSources + '+';
const fedLabel = fedZero.toLocaleString();
const imgLabel =
  totalImages >= 1e9 ? (totalImages / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+' :
  totalImages >= 1e6 ? (totalImages / 1e6).toFixed(0) + 'M+' :
  totalImages.toLocaleString();
const imgBillionNum =
  totalImages >= 1e9 ? (totalImages / 1e9).toFixed(1).replace(/\.0$/, '') : '0';

console.log(`[update-source-counts]`);
console.log(`  Top-level sources : ${totalSources} (zero-key ${zeroKeyActive}, all-keys ${allKeysActive}, broken ${broken})`);
console.log(`  Federated insts.  : ${fedZero.toLocaleString()} (zero-key) → ${fedMax.toLocaleString()} (all keys)`);
console.log(`  Images (KEY_SRCS) : ${totalImages.toLocaleString()} → "${imgLabel}"`);
console.log(`  Headline          : ${srcLabel} sources, ${imgLabel} images, ${fedLabel} institutions`);

const results = [];

// ── README.md ─────────────────────────────────────────────────
{
  const file = 'README.md';
  let c = read(file);

  // Headline line.
  c = c.replace(
    /\*\*The world's open cultural image search[^*]*\*\*/,
    `**The world's open cultural image search — ${srcLabel} sources, ${fedLabel}+ federated institutions, one search.**`
  );

  // Shields.io badges.
  c = c.replace(/sources-[\d.BMK%2+]+-brightgreen/g, `sources-${encodeURIComponent(srcLabel)}-brightgreen`);
  c = c.replace(/images-[\d.BMK%2+]+-brightgreen/g, `images-${encodeURIComponent(imgLabel)}-brightgreen`);

  // Feature-table row for sources (label).
  c = c.replace(
    /\| \*\*[\d,.]+\+? sources\*\* \|/,
    `| **${srcLabel} sources** |`
  );

  // Feature-table row for images — also replaces the garbled "XYZXYZXYZ+ more"
  // that came out of the old .cjs script when the regex double-applied.
  c = c.replace(
    /\| \*\*[\d.BMK,]+\+? images\*\* \|([^|\n]*?)\b\d[\d]*\+ more/,
    `| **${imgLabel} images** |$1${totalSources - 10}+ more`
  );

  // "all at once" sentence in the intro.
  c = c.replace(
    /and \d+\+ more \*\*all at once\*\*/,
    `and ${totalSources - 10}+ more — **all at once**`
  );

  const r = write(file, c);
  if (r) results.push([file, r]);
}

// ── insposearch/index.html (meta + JSON-LD) ───────────────────
{
  const file = 'insposearch/index.html';
  let c = read(file);
  c = c.replace(
    /Search [\d,]+\+? museum, archive, and photo sources[^"]*?(?:[\d.]+ billion images|zero storage|infinite images)[^"]*/g,
    `Search ${srcLabel} museum, archive, and photo sources for creative inspiration — ${imgBillionNum} billion images, zero storage`
  );
  const r = write(file, c);
  if (r) results.push([file, r]);
}

// ── insposearch/institutions.html (stat boxes + pitch row) ─────
{
  const file = 'insposearch/institutions.html';
  let c = read(file);

  // Stat box: active sources
  c = c.replace(
    /(<div class="stat-num">)[\d,.]+[BMK]?\+?(<\/div>\s*\n\s*<div class="stat-label">active sources)/,
    `$1${srcLabel}$2`
  );
  // Stat box: searchable images
  c = c.replace(
    /(<div class="stat-num">)[\d,.]+[BMK]?\+?(<\/div>\s*\n\s*<div class="stat-label">searchable images)/,
    `$1${imgLabel}$2`
  );
  // Stat box: no-setup → map to zero-key active total (real number, not manifest count)
  c = c.replace(
    /(<div class="stat-num">)[\d,.]+\+?(<\/div>\s*\n\s*<div class="stat-label">no-setup sources)/,
    `$1${zeroKeyActive}$2`
  );

  // Pitch-section strong tags
  c = c.replace(/<strong>[\d,.]+\+?<\/strong> active sources/g, `<strong>${srcLabel}</strong> active sources`);
  c = c.replace(/<strong>[\d,.BMK]+\+?<\/strong> searchable images/g, `<strong>${imgLabel}</strong> searchable images`);

  const r = write(file, c);
  if (r) results.push([file, r]);
}

// ── insposearch/manifest.json (PWA) ───────────────────────────
{
  const file = 'insposearch/manifest.json';
  if (fs.existsSync(path.join(root, file))) {
    let c = read(file);
    c = c.replace(
      /Search [\d.]+ billion images across [\d,]+ museums/g,
      `Search ${imgBillionNum} billion images across ${totalSources} museums`
    );
    const r = write(file, c);
    if (r) results.push([file, r]);
  }
}

// ── src/app.js inline copy ────────────────────────────────────
{
  const file = 'src/app.js';
  let c = read(file);
  c = c.replace(/Search [\d,]+\+? museum, archive, and photo sources/g,
    `Search ${srcLabel} museum, archive, and photo sources`);
  c = c.replace(/across [\d,]+\+? cultural heritage sources/g,
    `across ${srcLabel} cultural heritage sources`);
  const r = write(file, c);
  if (r) results.push([file, r]);
}

// ── Report ────────────────────────────────────────────────────
const stale = results.some(([, r]) => r === 'stale');
if (check && stale) {
  console.error(`\nRun \`node scripts/update-source-counts.js\` to refresh.`);
  process.exit(1);
}
console.log(`\n${results.length} file(s) ${check ? 'checked' : 'updated'}.`);
for (const [f, r] of results) console.log(`  ${r === 'stale' ? '✗' : '✓'} ${f}`);
