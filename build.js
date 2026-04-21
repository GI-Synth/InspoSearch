/**
 * InspoSearch — esbuild bundler
 *
 * Bundles src/main.js → insposearch/app.js (single IIFE bundle).
 * 
 * Usage:
 *   npm run build          — one-shot production build
 *   npm run build:watch    — watch mode for development
 *
 * Currently the app lives as a monolith in insposearch/app.js.
 * As modules are extracted to src/, this build step will bundle them
 * back into the same single file so the HTML and deploy stay unchanged.
 */

import { build, context } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const ENTRY = 'src/main.js';
const OUT   = 'insposearch/app.js';
const SW    = 'insposearch/sw.js';

const isWatch = process.argv.includes('--watch');

// Bump SW CACHE_VERSION to today + content hash suffix so every production build
// invalidates the service worker cache. Skip in watch/dev mode.
function bumpSwCacheVersion() {
  if (!existsSync(SW)) return;
  const d = new Date();
  const today = d.getUTCFullYear().toString()
    + String(d.getUTCMonth() + 1).padStart(2, '0')
    + String(d.getUTCDate()).padStart(2, '0');
  // Suffix letter rotates a..z so multiple deploys on the same day still bust cache.
  const src = readFileSync(SW, 'utf8');
  const m = src.match(/const CACHE_VERSION = '(\d{8})([a-z])';/);
  let suffix = 'a';
  if (m && m[1] === today) {
    const next = String.fromCharCode(m[2].charCodeAt(0) + 1);
    suffix = next > 'z' ? 'a' : next;
  }
  const updated = src.replace(
    /const CACHE_VERSION = '[^']+';/,
    `const CACHE_VERSION = '${today}${suffix}';`
  );
  if (updated !== src) {
    writeFileSync(SW, updated);
    console.log(`✓ sw.js cache version → ${today}${suffix}`);
  }
}

// Only run esbuild once src/main.js exists
if (!existsSync(ENTRY)) {
  console.log(`⚠  ${ENTRY} not found — skipping build.`);
  console.log(`   The monolithic insposearch/app.js is still the live file.`);
  console.log(`   Create ${ENTRY} to start the modular migration.`);
  process.exit(0);
}

const isDev = isWatch || process.argv.includes('--dev');

const config = {
  entryPoints: [ENTRY],
  bundle: true,
  format: 'iife',
  outfile: OUT,
  minify: !isDev,       // minify in production builds
  sourcemap: isDev,     // sourcemap only in dev (saves bandwidth in prod)
  target: ['es2020'],
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('👀 watching for changes…');
} else {
  await build(config);
  bumpSwCacheVersion();
  console.log(`✓ bundled → ${OUT}`);
}
