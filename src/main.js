/**
 * InspoSearch — Modular Entry Point
 *
 * This file is the esbuild entry point.  As modules are extracted from
 * the monolithic insposearch/app.js, they should be imported here.
 *
 * Migration path:
 *   1. Extract a section from app.js into a src/ module
 *   2. Import it here
 *   3. Run `npm run build` — esbuild bundles everything to insposearch/app.js
 *   4. Test in browser
 *   5. Repeat until app.js is empty and all code lives in src/
 *
 * Until migration is complete the monolith (insposearch/app.js) is the
 * canonical source of truth. This file just re-exports whatever has been
 * extracted so far.
 */

// -- Extracted modules (uncomment as sections move here) --
// import './state.js';
// import './utils/color.js';
// import './utils/dom.js';
// import './utils/fetch.js';
// import './sources/manifest.js';
// import './search/engine.js';
// import './search/keywords.js';
// import './search/filters.js';
// import './search/history.js';
// import './ui/grid.js';
// import './ui/sidebar.js';
// import './ui/lightbox.js';
// import './ui/board.js';
// import './ui/compare.js';
// import './ui/floating-bar.js';
// import './features/discover.js';
// import './features/taxonomy.js';
// import './features/stories.js';
// import './features/artist.js';
// import './features/similarity.js';
// import './features/color-palette.js';
// import './features/tour.js';
// import './features/pwa.js';
// import './features/seo.js';

console.log('[InspoSearch] modular build loaded');
