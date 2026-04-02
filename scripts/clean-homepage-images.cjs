#!/usr/bin/env node
/**
 * clean-homepage-images.cjs
 *
 * Removes provably-bad entries from homepage-candidates.json:
 *   1. Entire sources that return documents/books, not artwork:
 *      - "loc"     → Library of Congress returns book covers & title pages
 *      - "archive" → Archive.org returns scanned text documents
 *   2. Title-based heuristic filter — entries whose titles strongly suggest
 *      a book, catalog, dictionary, or text document rather than an image
 *
 * Overwrites the input file and prints before/after stats.
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'admin', 'data', 'homepage-candidates.json');

// ── Sources to remove entirely ───────────────────────────────────────────────
const BAD_SOURCES = new Set(['loc', 'archive']);

// ── Title patterns that indicate a book/document, not artwork ────────────────
const BAD_TITLE_PATTERNS = [
  /\bcatalogue\b/i,
  /\bcatalog\b/i,
  /\bdictionary\b/i,
  /\bmanual\b/i,
  /\bhandbook\b/i,
  /\bencyclopedia\b/i,
  /\bencyclopaedia\b/i,
  /\bantiquities;\b/i,          // "Classical antiquities;" repeated entries
  /\bclassical antiquities\b/i,
  /^(a |the )?(complete |new |illustrated )?guide\b/i,
  /\bintroduction to\b/i,
  /\bhistory of\b/i,
  /^by [a-z]/i,                 // "By Nathaniel Hawthorne" style titles
  /\bwith additions\b/i,
  /\bfrom the german\b/i,
  /\blectures on\b/i,
  /\btreatise on\b/i,
  /\bcompendium\b/i,
  /\bmonograph\b/i,
  /\bbiography\b/i,
  /\bgeography\b/i,
  /\bpronunciation\b/i,
  /\bchronological table\b/i,
  /\bappendix\b/i,
];

// ── URL patterns that indicate a low-quality/document image ─────────────────
const BAD_URL_PATTERNS = [
  /archive\.org\/services\/img\//,  // Archive.org content thumbnails
  /\.loc\.gov\/.*\/(public|loc)\b/, // LOC public scan URLs
];

function isBad(item) {
  if (BAD_SOURCES.has(item.source)) return true;

  for (const pat of BAD_TITLE_PATTERNS) {
    if (pat.test(item.title || '')) return true;
  }

  for (const pat of BAD_URL_PATTERNS) {
    if (pat.test(item.url || '') || pat.test(item.thumb || '')) return true;
  }

  return false;
}

function cleanSection(section) {
  const stats = {};
  for (const [key, items] of Object.entries(section)) {
    const before = items.length;
    section[key] = items.filter(item => !isBad(item));
    const after = section[key].length;
    stats[key] = { before, after, removed: before - after };
  }
  return stats;
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  InspoSearch — Image Pool Cleaner                   ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

const raw  = fs.readFileSync(FILE, 'utf-8');
const data = JSON.parse(raw);

let totalBefore = 0;
let totalAfter  = 0;

console.log('── CATEGORIES ─────────────────────────────────────────');
const catStats = cleanSection(data.categories);
for (const [k, s] of Object.entries(catStats)) {
  const bar = '▓'.repeat(Math.round(s.after / 5)) + '░'.repeat(Math.round(s.removed / 5));
  console.log(`  ${k.padEnd(20)} ${s.before} → ${s.after}  (-${s.removed})`);
  totalBefore += s.before;
  totalAfter  += s.after;
}

console.log('\n── HEROES ─────────────────────────────────────────────');
const heroStats = cleanSection(data.heroes);
for (const [k, s] of Object.entries(heroStats)) {
  console.log(`  ${k.padEnd(30)} ${s.before} → ${s.after}  (-${s.removed})`);
  totalBefore += s.before;
  totalAfter  += s.after;
}

const removed = totalBefore - totalAfter;
console.log(`\n  Total: ${totalBefore} → ${totalAfter}  (removed ${removed} bad entries, ${Math.round(removed/totalBefore*100)}%)`);

// Update metadata
data._cleaned    = new Date().toISOString();
data._cleanedBy  = 'clean-homepage-images.cjs';
data._totalBefore = totalBefore;
data._totalAfter  = totalAfter;

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n  ✓ Saved: admin/data/homepage-candidates.json`);
console.log('  ✓ Refresh http://localhost:8787 to see clean results\n');
