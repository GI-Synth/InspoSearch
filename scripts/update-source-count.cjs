/**
 * update-source-count.cjs — Prebuild script
 * Reads ALL_SOURCES, manifest, and dynamic registry counts from source files,
 * then updates static source/image counts in HTML, meta, and manifest files.
 *
 * Usage: node scripts/update-source-count.cjs
 * Wire as "prebuild" in package.json.
 */

const fs = require('fs');
const path = require('path');

const stateFile = path.join(__dirname, '..', 'src', 'state.js');
const manifestFile = path.join(__dirname, '..', 'insposearch', 'sources.manifest.json');

const state = fs.readFileSync(stateFile, 'utf8');

// 1. Count ALL_SOURCES entries
const allSrcMatch = state.match(/export const ALL_SOURCES\s*=\s*\[([\s\S]*?)\];/);
const allSourcesCount = allSrcMatch ? (allSrcMatch[1].match(/'[^']+'/g) || []).length : 0;

// 2. Count manifest sources
let manifestCount = 0;
try {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifestCount = (manifest.sources || []).length;
} catch {}

// 3. Dynamic registry count (no longer includes Wikimedia cats or Archive collections)
const dynamicCount = 0;

const totalSources = allSourcesCount + manifestCount + dynamicCount;

// 4. Compute total image count from KEY_SOURCES imageCount fields
const imageCountMatches = state.match(/imageCount:\s*(\d[\d_]*)/g) || [];
let totalImages = 0;
for (const m of imageCountMatches) {
  const num = Number(m.match(/(\d[\d_]*)/)[1].replace(/_/g, ''));
  totalImages += num;
}

// Format counts
const srcLabel = totalSources + '+';
const imgBillions = totalImages >= 1e9
  ? (totalImages / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+'
  : totalImages >= 1e6
    ? (totalImages / 1e6).toFixed(0) + 'M+'
    : totalImages.toLocaleString();

console.log(`Sources: ${totalSources} (ALL_SOURCES=${allSourcesCount} + manifest=${manifestCount} + dynamic=${dynamicCount})`);
console.log(`Images: ${totalImages} → "${imgBillions}"`);
console.log(`Labels: "${srcLabel}" sources, "${imgBillions}" images`);

// 5. Replace in files
const replacements = [
  {
    file: 'insposearch/index.html',
    patterns: [
      // og:description
      [/Search \d+\+? museum/g, `Search ${srcLabel} museum`],
      // structured data description
      [/Search \d+\+? museum, archive, and photo sources[^"]*\d+\.?\d*\s*billion images/g,
       `Search ${srcLabel} museum, archive, and photo sources for creative inspiration — ${imgBillions.replace('B+', '')} billion images`],
      // twitter description
      [/Search \d+\+? museum, archive, and photo sources[^"]*\d+\.?\d*\s*billion/g,
       `Search ${srcLabel} museum, archive, and photo sources for creative inspiration — ${imgBillions.replace('B+', '')} billion`],
    ],
  },
  {
    file: 'insposearch/institutions.html',
    patterns: [
      [/<div class="stat-num">\d+\+?<\/div>\s*\n\s*<div class="stat-label">sources/g,
       `<div class="stat-num">${srcLabel}</div>\n        <div class="stat-label">sources`],
      [/<div class="stat-num">[\d.]+[BMK]\+?<\/div>\s*\n\s*<div class="stat-label">images/g,
       `<div class="stat-num">${imgBillions}</div>\n        <div class="stat-label">images`],
      [/<strong>\d+\+?<\/strong> active sources/g, `<strong>${srcLabel}</strong> active sources`],
      [/<strong>[\d.]+[BMK]\+?<\/strong> searchable images/g, `<strong>${imgBillions}</strong> searchable images`],
    ],
  },
  {
    file: 'insposearch/manifest.json',
    patterns: [
      [/Search [\d.]+ billion images across \d+ museums/g,
       `Search ${imgBillions.replace('B+', '')} billion images across ${totalSources} museums`],
    ],
  },
  {
    file: 'src/app.js',
    patterns: [
      [/Search \d+\+? museum, archive, and photo sources/g, `Search ${srcLabel} museum, archive, and photo sources`],
      [/across \d+\+? cultural heritage sources/g, `across ${srcLabel} cultural heritage sources`],
    ],
  },
];

let filesChanged = 0;
for (const { file, patterns } of replacements) {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) { console.warn(`  SKIP: ${file} not found`); continue; }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [regex, replacement] of patterns) {
    const before = content;
    content = content.replace(regex, replacement);
    if (content !== before) changed = true;
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  Updated: ${file}`);
    filesChanged++;
  }
}

console.log(`\nDone. ${filesChanged} file(s) updated.`);
