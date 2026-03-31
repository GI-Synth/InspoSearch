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
import { existsSync } from 'fs';

const ENTRY = 'src/main.js';
const OUT   = 'insposearch/app.js';

const isWatch = process.argv.includes('--watch');

// Only run esbuild once src/main.js exists
if (!existsSync(ENTRY)) {
  console.log(`⚠  ${ENTRY} not found — skipping build.`);
  console.log(`   The monolithic insposearch/app.js is still the live file.`);
  console.log(`   Create ${ENTRY} to start the modular migration.`);
  process.exit(0);
}

const config = {
  entryPoints: [ENTRY],
  bundle: true,
  format: 'iife',
  outfile: OUT,
  minify: false,        // keep readable for now
  sourcemap: true,
  target: ['es2020'],
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('👀 watching for changes…');
} else {
  await build(config);
  console.log(`✓ bundled → ${OUT}`);
}
