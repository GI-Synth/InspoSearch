#!/usr/bin/env node
// InspoSearch — Source Manifest Validator
// Validates all JSON files in insposearch/sources/ against the required schema.
// Called by GitHub Actions on PRs touching the sources directory.

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = join(__dirname, '..', 'insposearch', 'sources');

const VALID_CATEGORIES = new Set([
  'museums', 'art', 'photos', 'nature', 'science', 'archives',
  'maps', 'fashion', 'architecture', 'botanical', 'film', 'historical',
]);

const VALID_REGIONS = new Set([
  'europe', 'uk', 'americas', 'oceania', 'asia', 'global',
]);

const VALID_ADAPTERS = new Set([
  'simple_rest', 'iiif_search', 'bodleian', 'bsb', 'cudl', 'unsplash',
]);

const VALID_CORS_MODES = new Set(['direct', 'proxy']);

const REQUIRED_FIELDS = [
  'id', 'name', 'description', 'domain', 'category', 'region',
  'keyRequired', 'endpoint', 'adapter', 'imageCount', 'corsMode', 'active',
];

function validateSource(filename, data) {
  const errors = [];

  // Skip template
  if (data.id === 'YOUR-SOURCE-ID') return errors;

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // ID format: lowercase alphanumeric + hyphens only
  if (data.id && !/^[a-z0-9-]+$/.test(data.id)) {
    errors.push(`"id" must be lowercase alphanumeric with hyphens only: "${data.id}"`);
  }

  // ID must match filename (minus .json)
  const expectedId = filename.replace(/\.json$/, '');
  if (data.id && data.id !== expectedId && expectedId !== '_template') {
    errors.push(`"id" ("${data.id}") must match filename ("${expectedId}")`);
  }

  // Category: must be an array with at least one valid value
  if (Array.isArray(data.category)) {
    if (data.category.length === 0) {
      errors.push('"category" must contain at least one value');
    }
    for (const cat of data.category) {
      if (!VALID_CATEGORIES.has(cat)) {
        errors.push(`Invalid category: "${cat}". Valid: ${[...VALID_CATEGORIES].join(', ')}`);
      }
    }
  } else if (data.category !== undefined) {
    errors.push('"category" must be an array');
  }

  // Region
  if (data.region && !VALID_REGIONS.has(data.region)) {
    errors.push(`Invalid region: "${data.region}". Valid: ${[...VALID_REGIONS].join(', ')}`);
  }

  // Adapter
  if (data.adapter && !VALID_ADAPTERS.has(data.adapter)) {
    errors.push(`Invalid adapter: "${data.adapter}". Valid: ${[...VALID_ADAPTERS].join(', ')}`);
  }

  // CORS mode
  if (data.corsMode && !VALID_CORS_MODES.has(data.corsMode)) {
    errors.push(`Invalid corsMode: "${data.corsMode}". Valid: ${[...VALID_CORS_MODES].join(', ')}`);
  }

  // imageCount must be a positive integer
  if (data.imageCount !== undefined && (typeof data.imageCount !== 'number' || data.imageCount <= 0)) {
    errors.push('"imageCount" must be a positive number');
  }

  // endpoint must look like a URL
  if (data.endpoint && !data.endpoint.startsWith('http')) {
    errors.push(`"endpoint" must be a full URL starting with http(s): "${data.endpoint}"`);
  }

  // keyRequired: if true, keyLabel and getKeyUrl should be present
  if (data.keyRequired === true) {
    if (!data.keyLabel) errors.push('"keyLabel" is required when "keyRequired" is true');
    if (!data.getKeyUrl) errors.push('"getKeyUrl" is required when "keyRequired" is true');
  }

  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let files;
try {
  files = readdirSync(SOURCES_DIR).filter(f => f.endsWith('.json'));
} catch (e) {
  console.error(`Could not read sources directory: ${SOURCES_DIR}`);
  process.exit(1);
}

let totalErrors = 0;
let totalFiles = 0;

for (const filename of files) {
  const filepath = join(SOURCES_DIR, filename);
  let data;

  try {
    data = JSON.parse(readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${filename}: invalid JSON — ${e.message}`);
    totalErrors++;
    continue;
  }

  const errors = validateSource(filename, data);
  totalFiles++;

  if (errors.length === 0) {
    console.log(`✓ ${filename}`);
  } else {
    console.error(`✗ ${filename}:`);
    for (const err of errors) {
      console.error(`    - ${err}`);
    }
    totalErrors += errors.length;
  }
}

console.log(`\n${totalFiles} files checked. ${totalErrors > 0 ? `${totalErrors} error(s) found.` : 'All valid.'}`);

if (totalErrors > 0) {
  process.exit(1);
}
