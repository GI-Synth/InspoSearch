/**
 * InspoSearch — Modular Entry Point
 *
 * Evaluation order:
 *   1. state.js    — constants, STATE, data tables (no side-effects)
 *   2. core.js     — utilities, health, cache (no DOM side-effects)
 *   3. fetchers.js — all source fetchers, populates ADAPTERS
 *   4. app.js      — rendering, search, event wiring, features (DOM side-effects)
 *
 * esbuild bundles this into insposearch/app.js as a single IIFE.
 */

// 1. Data layer — no side-effects
import './state.js';

// 2. Core utilities — health tracking, safeFetch, cache
import './core.js';

// 3. Source fetchers — populates ADAPTERS at evaluation time
import './fetchers.js';

// 3b. Source-count single source of truth — imported for its side effect
// of exposing computeSourceCount on window so app.js/DOM can call it.
import * as SourceCount from './sourceCount.js';
if (typeof window !== 'undefined') {
  window.InspoCount = SourceCount;
}

// 4. Application logic — rendering, search, UI wiring, features
//    This module has side-effects: addEventListener calls, IIFEs, init sequences
import './app.js';
// import './features/tour.js';
// import './features/pwa.js';
// import './features/seo.js';

console.log('[InspoSearch] modular build loaded');
