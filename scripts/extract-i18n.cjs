/**
 * extract-i18n.cjs — Parse i18n-translation-prompt.md and write src/i18n-generated.json
 * Reads all ```json blocks and merges them into a single locale map.
 */

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'i18n-translation-prompt.md');
const outPath = path.join(__dirname, '..', 'src', 'i18n-generated.json');

const content = fs.readFileSync(mdPath, 'utf8');

// Extract all ```json ... ``` blocks
const blockRe = /```json\s*\n([\s\S]*?)```/g;
let match;
const result = {};

let blockCount = 0;
let errorCount = 0;

while ((match = blockRe.exec(content)) !== null) {
  const raw = match[1].trim();
  try {
    const parsed = JSON.parse(raw);
    // Each block should be { "xx": { ... } }
    for (const [lang, translations] of Object.entries(parsed)) {
      if (result[lang]) {
        console.warn(`  WARN: Duplicate locale "${lang}" — skipping second occurrence`);
        continue;
      }
      result[lang] = translations;
      blockCount++;
    }
  } catch (e) {
    // Show context for debug
    const preview = raw.substring(0, 60).replace(/\n/g, '\\n');
    console.warn(`  WARN: JSON parse error at block "${preview}": ${e.message}`);
    errorCount++;
  }
}

const langs = Object.keys(result).sort();
console.log(`\nExtracted ${blockCount} locales from ${blockCount + errorCount} blocks (${errorCount} errors)`);
console.log(`Locales: ${langs.join(', ')}`);

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nWrote ${outPath}`);
