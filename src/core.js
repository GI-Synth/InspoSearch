/* ============================================================
   core.js — Health tracking, source management, utilities, cache
   ============================================================ */
import {
  ALL_SOURCES, CONSTANTS, DPLA_HUBS, DYNAMIC_REGISTRY, EUROPEANA_PROVIDERS,
  KEY_SOURCES, ONBOARDING_TERMS, SOURCE_DOMAINS, SOURCE_GROUPS, SOURCE_META,
  STATE, WD_PHASE_H, BADGE_META, SEED_MAP, MOVEMENT_SYNONYMS,
  SPECIES_SYNONYMS, PERIOD_ALIASES, MULTILINGUAL_ART_MAP, _ERA_REGEX,
  _MEDIUM_TERMS, _MOVEMENT_SEEDS, _MOVEMENT_TERMS, _SPECIES_PATTERN,
  classifyQueryExtended, classifyQueryV2, classifyQuery,
  ADAPTERS, _secondaryControllers
} from './state.js';

/* ── Late-binding hooks — set by app.js to break circular dependencies ── */
export const hooks = {
  showToast: null,    // (msg, duration) => void — set by app.js
  buildKeyRows: null, // () => void — set by app.js
};

export function selectDynamicSources(keyword, maxCount = 150) {
  const qc = classifyQueryExtended(keyword);
  const qcv2 = classifyQueryV2(keyword);
  const hasAnyIntent = qc.isNature || qc.isSpace || qc.isArt || qc.isHistory ||
                       qc.isArch || qc.isDesign || qc.isPhoto || qc.isScience;

  // Map query intent flags to tag names
  const intentTags = [];
  if (qc.isNature)  intentTags.push('nature');
  if (qc.isSpace)   intentTags.push('space');
  if (qc.isArt)     intentTags.push('art');
  if (qc.isHistory) intentTags.push('history');
  if (qc.isArch)    intentTags.push('arch');
  if (qc.isDesign)  intentTags.push('design');
  if (qc.isPhoto)   intentTags.push('photo');
  if (qc.isScience) intentTags.push('science');

  // v2 intent tags — push from movement/medium classification
  if (qcv2.movement) intentTags.push('art');
  if (qcv2.medium === 'Photograph') intentTags.push('photo');
  if (qcv2.medium === 'Textile') intentTags.push('design');
  if (qcv2.medium === 'Ceramic') intentTags.push('design');
  if (qcv2.isSpecies) intentTags.push('nature');

  // High-confidence classification: qcv2 has a concrete signal (artist name,
  // era match, known movement, species pattern, medium). Without that, the
  // intent flags are keyword-heuristic only and shouldn't exclude sources.
  const isHighConfidence = !!(qcv2.isArtist || qcv2.era || qcv2.movement ||
                              qcv2.isSpecies || qcv2.medium);

  const scored = DYNAMIC_REGISTRY
    .filter(s => {
      // Skip if key required but not set
      if (s.keyRequired && !STATE[s.keyRequired]) return false;
      // Skip if user disabled this source
      if (STATE.disabledSources.has(s.id)) return false;
      return true;
    })
    .map(s => {
      let score = 1; // base score — everyone gets a chance
      if (hasAnyIntent && s.tags && s.tags.length) {
        const overlap = s.tags.filter(t => intentTags.includes(t)).length;
        score += overlap * 5;
        // Only penalize zero-overlap when classification is high-confidence.
        // Weakly-classified queries must not exclude the long tail of sources.
        if (overlap === 0 && isHighConfidence && intentTags.length >= 2) score -= 1;
      }
      // v2 boosts: artist queries → prioritise large museum collections
      if (qcv2.isArtist && s.tags && s.tags.includes('art')) score += 3;
      // era queries → prioritise historical sources
      if (qcv2.era && s.tags && s.tags.includes('history')) score += 2;
      // Prefer sources with known large collections
      if (s.imageCount && s.imageCount > 10000) score += 1;
      // Deterministic jitter using the query seed — same query always picks the same
      // source subset, consistent with Phase 1 seeded PRNG. Replaces Math.random().
      score += (Math.abs(queryToSeed(keyword)) % 1000) / 2000;
      return { ...s, _score: score };
    })
    .sort((a, b) => b._score - a._score);

  return scored.slice(0, maxCount);
}

/* Extend source groups with Phase A sub-collections */
(function() {
  SOURCE_GROUPS.fashion.push('euro_fashion', 'si_chndm');
  SOURCE_GROUPS.museums.push('si_nmah','si_nmnh','si_npg_dc','si_saam','si_hmsg','si_nzp','si_chndm','si_fsg','si_nmafa','si_nmai','si_nmaahc2','si_nasm2','si_npm','si_acm','si_renwick','euro_rijksmuseum','euro_kulturpool','euro_estonian');
  SOURCE_GROUPS.archives.push(...Object.keys(EUROPEANA_PROVIDERS), ...Object.keys(DPLA_HUBS));
  SOURCE_GROUPS.artdesign.push('euro_rijksmuseum','euro_fashion','si_saam','si_hmsg','si_renwick','si_nmafa','si_fsg');
  SOURCE_GROUPS.nature.push('si_nzp','si_nmnh','idigbio','ala');
  SOURCE_GROUPS.historical.push(...Object.keys(DPLA_HUBS),'euro_newspapers','euro_ddb','euro_bnf','euro_bne','euro_kb','euro_bn_pl','euro_nkr','euro_kulturpool','euro_hispana','euro_nuk','euro_estonian','euro_lithuanian','euro_latvian','euro_hungarian','euro_romanian','euro_bulgarian','si_nmah','si_npm','si_acm','si_nmai');
  SOURCE_GROUPS.science.push('si_nmnh','si_nzp','si_nasm2','idigbio','ala','nasa_images');
  SOURCE_GROUPS.historical.push('loc');
  SOURCE_GROUPS.archives.push('loc');
  // Phase E — CORS-blocked, cache-first
  SOURCE_GROUPS.museums.push('nhm_london','wallace_collection','fitzwilliam','national_gallery_london','scottish_national');
  SOURCE_GROUPS.museums.push('musee_orsay','vangogh_museum','khm','belvedere','staedel','rmfab','guimet','npm_taipei');
  // Phase F — Fashion & Textile
  SOURCE_GROUPS.museums.push('galliera','arts_decoratifs','centraal_museum','textile_museum_tilburg','wereldculturen','dec_arts_prague','designmuseum_dk','boijmans','museu_traje');
  SOURCE_GROUPS.fashion.push('galliera','arts_decoratifs','centraal_museum','textile_museum_tilburg','wereldculturen','dec_arts_prague','designmuseum_dk','boijmans','museu_traje');
  SOURCE_GROUPS.artdesign.push('galliera','arts_decoratifs','centraal_museum','boijmans','dec_arts_prague','designmuseum_dk');
  // Phase G — Art, Sculpture & History
  SOURCE_GROUPS.museums.push('kmska','amsterdam_museum','ngi','fries_museum','groeninge','groninger','moma_wd','rijksmuseum_twenthe','herzog_anton_ulrich','galleria_palatina','lakenhal','teylers','alte_pinakothek','quai_branly');
  SOURCE_GROUPS.artdesign.push('kmska','groeninge','groninger','moma_wd','rijksmuseum_twenthe','herzog_anton_ulrich','galleria_palatina','lakenhal','teylers','alte_pinakothek','ngi','amsterdam_museum','fries_museum','quai_branly');
  SOURCE_GROUPS.nature.push('nhm_london');
  SOURCE_GROUPS.science.push('nhm_london');
  // Phase H — 113 World Museum sources
  WD_PHASE_H.forEach(s => {
    s.cat.forEach(c => { if (SOURCE_GROUPS[c]) SOURCE_GROUPS[c].push(s.id); });
  });
})();

/* ============================================================
   SOURCE HEALTH TRACKER
============================================================ */
export function loadSourceHealth() {
  try {
    const saved = sessionStorage.getItem('inspo_health');
    if (saved) STATE.sourceHealth = JSON.parse(saved);
  } catch (e) {}
}

export let _healthWriteTimer = null;
export function _flushSourceHealth() {
  try { sessionStorage.setItem('inspo_health', JSON.stringify(STATE.sourceHealth)); } catch (e) {}
  _healthWriteTimer = null;
}

// Intent-scoped health: a source that misses on "art" queries shouldn't be
// paused for "nature" queries. Derive a stable key from the active query's
// intent flags; fall back to "generic" when nothing classifies.
export function _currentIntentKey() {
  const q = STATE.query || '';
  if (!q) return 'generic';
  const qc = classifyQueryExtended(q);
  const tags = [];
  if (qc.isNature)  tags.push('nature');
  if (qc.isSpace)   tags.push('space');
  if (qc.isArt)     tags.push('art');
  if (qc.isHistory) tags.push('history');
  if (qc.isArch)    tags.push('arch');
  if (qc.isDesign)  tags.push('design');
  if (qc.isPhoto)   tags.push('photo');
  if (qc.isScience) tags.push('science');
  return tags.length ? tags.sort().join('+') : 'generic';
}

function _ensureHealthEntry(sourceName) {
  const h = STATE.sourceHealth;
  if (!h[sourceName]) h[sourceName] = { hits: 0, misses: 0, lastSeen: 0, intent: {} };
  if (!h[sourceName].intent) h[sourceName].intent = {};
  return h[sourceName];
}

export function recordSourceResult(sourceName, resultCount) {
  const entry = _ensureHealthEntry(sourceName);
  const key = _currentIntentKey();
  if (!entry.intent[key]) entry.intent[key] = { misses: 0, pausedAt: 0, notified: false };
  const slot = entry.intent[key];
  if (resultCount > 0) {
    const wasPaused = slot.misses >= CONSTANTS.HEALTH_MISS_LIMIT;
    entry.hits++;
    entry.lastSeen = Date.now();
    slot.misses = 0;
    slot.pausedAt = 0;
    slot.notified = false;
    // Mirror legacy global misses=0 so the active-counter UI reflects recovery
    entry.misses = 0;
    entry._notified = false;
    if (wasPaused && hooks.showToast) {
      hooks.showToast(`source "${sourceName}" recovered`, 2000);
    }
  } else {
    slot.misses++;
    entry.misses = slot.misses; // keep legacy field in sync for UI
    if (slot.misses === CONSTANTS.HEALTH_MISS_LIMIT) {
      slot.pausedAt = Date.now();
    }
  }
  if (!_healthWriteTimer) _healthWriteTimer = setTimeout(_flushSourceHealth, 2000);
}

// Called at the start of every new search — gives every source a fresh
// chance, instead of waiting HEALTH_RECOVERY_MS (5 min) for auto-recovery.
// Preserves hits/lastSeen (useful signal), clears miss counters + pauses.
export function resetHealthForNewQuery() {
  const h = STATE.sourceHealth;
  for (const name in h) {
    const entry = h[name];
    if (!entry) continue;
    entry.misses = 0;
    entry._notified = false;
    if (entry.intent) {
      for (const key in entry.intent) {
        entry.intent[key].misses = 0;
        entry.intent[key].pausedAt = 0;
        entry.intent[key].notified = false;
      }
    }
  }
  if (!_healthWriteTimer) _healthWriteTimer = setTimeout(_flushSourceHealth, 2000);
}

export function isSourceHealthy(sourceName) {
  const entry = STATE.sourceHealth[sourceName];
  if (!entry) return true;           // never tried — always allow
  if (!entry.intent) entry.intent = {};
  const key = _currentIntentKey();
  const slot = entry.intent[key];
  if (!slot) return true;            // never tried for this intent — allow
  if (slot.misses >= CONSTANTS.HEALTH_MISS_LIMIT) {
    // Auto-recover after HEALTH_RECOVERY_MS — half-decay misses so source gets another chance
    if (slot.pausedAt && Date.now() - slot.pausedAt > CONSTANTS.HEALTH_RECOVERY_MS) {
      slot.misses = Math.floor(slot.misses / 2);
      slot.pausedAt = 0;
      slot.notified = false;
      return true;
    }
    if (!slot.notified) {
      slot.notified = true;
      if (hooks.showToast) hooks.showToast(`source "${sourceName}" paused for "${key}" — no results after ${CONSTANTS.HEALTH_MISS_LIMIT} tries`, 3000);
    }
    return false;
  }
  return true;
}

// Sentinel returned by callIfHealthy when a source is skipped (disabled/unavailable/unhealthy).
// onSourceResult and fetchMoreResults must check for this to avoid recording phantom misses
// or passing the symbol into downstream array operations.
export const HEALTH_SKIP = Symbol('health_skip');

export function callIfHealthy(sourceName, fetchPromiseOrFn) {
  if (STATE.disabledSources.has(sourceName)) return Promise.resolve(HEALTH_SKIP);
  if (_unavailableSources.has(sourceName)) return Promise.resolve(HEALTH_SKIP);
  if (!isSourceHealthy(sourceName)) return Promise.resolve(HEALTH_SKIP);
  return typeof fetchPromiseOrFn === 'function' ? fetchPromiseOrFn() : fetchPromiseOrFn;
}

export let _updateSourcesActiveCounterImmediate = function _updateSourcesActiveCounterImmediate() {
  const hardcoded = ALL_SOURCES.filter(id => !STATE.disabledSources.has(id) && isSourceHealthy(id)).length;
  const dynamic = DYNAMIC_REGISTRY.filter(s => !s.keyRequired || STATE[s.keyRequired]).length;
  const active = hardcoded + dynamic;
  const el = document.getElementById('sources-active-counter');
  if (el) el.textContent = active + ' sources active';
}
// Fires 155+ times per search; debounce to avoid excessive DOM writes
// Arrow wrapper so late monkey-patches of _updateSourcesActiveCounterImmediate propagate
export const updateSourcesActiveCounter = debounce(() => _updateSourcesActiveCounterImmediate(), CONSTANTS.COUNTER_DEBOUNCE);

loadSourceHealth();
loadDisabledSources();
updateSourcesActiveCounter();

/* -- Gemini daily counter helpers -- */
export function loadGeminiCounter() {
  try {
    const stored = localStorage.getItem('inspo_gemini_count');
    if (!stored) return;
    const data = JSON.parse(stored);
    const today = new Date().toISOString().slice(0, 10);
    if (data.date === today) {
      STATE.geminiDailyCount = data.count || 0;
      STATE.geminiDailyDate  = data.date;
    } else {
      STATE.geminiDailyCount = 0;
      STATE.geminiDailyDate  = today;
      localStorage.setItem('inspo_gemini_count', JSON.stringify({ count: 0, date: today }));
    }
  } catch(e) {}
}

// ── Per-minute rate limit for Gemini (60 requests/min) ──
export const _geminiMinuteLog = [];
export const GEMINI_PER_MINUTE_LIMIT = 55;

// ── Per-minute rate limits for all AI providers ──
export const _aiMinuteLogs = { gemini: _geminiMinuteLog, claude: [], openai: [] };
export const _AI_PER_MINUTE_LIMITS = { gemini: 55, claude: 50, openai: 50 };

export function incrementGeminiCounter() {
  try {
    STATE.geminiDailyCount++;
    const now = Date.now();
    _geminiMinuteLog.push(now);
    // Prune old entries to cap memory (keep only last 60s)
    const cutoff = now - 60000;
    while (_geminiMinuteLog.length > 0 && _geminiMinuteLog[0] < cutoff) _geminiMinuteLog.shift();
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('inspo_gemini_count',
      JSON.stringify({ count: STATE.geminiDailyCount, date: today }));
    updateGeminiCounterUI();
  } catch(e) {}
}

export function isGeminiRateLimited() {
  const oneMinuteAgo = Date.now() - 60000;
  while (_geminiMinuteLog.length && _geminiMinuteLog[0] < oneMinuteAgo) _geminiMinuteLog.shift();
  return _geminiMinuteLog.length >= GEMINI_PER_MINUTE_LIMIT;
}

export function isAIProviderRateLimited(provider) {
  const log = _aiMinuteLogs[provider];
  if (!log) return false;
  const limit = _AI_PER_MINUTE_LIMITS[provider] || 50;
  const oneMinuteAgo = Date.now() - 60000;
  while (log.length && log[0] < oneMinuteAgo) log.shift();
  return log.length >= limit;
}

export function trackAIProviderCall(provider) {
  const log = _aiMinuteLogs[provider];
  if (!log) return;
  log.push(Date.now());
  const cutoff = Date.now() - 60000;
  while (log.length > 0 && log[0] < cutoff) log.shift();
}

export function updateGeminiCounterUI() {
  const el = document.getElementById('gemini-usage-counter');
  if (!el) return;
  const count = STATE.geminiDailyCount;
  if (count >= 1500) {
    el.textContent = 'daily limit reached — resets midnight';
    el.style.color = '#E24B4A';
    disableGeminiButtons();
  } else if (count >= 1400) {
    el.textContent = `✦ ${count} used — approaching limit`;
    el.style.color = 'var(--accent)';
  } else {
    el.textContent = `✦ ${count} / 1500 used today`;
    el.style.color = 'var(--ink-3)';
  }
}

export function disableGeminiButtons() {
  ['analyse-btn', 'interpret-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.add('disabled'); btn.setAttribute('disabled', true); }
  });
}

export function getAITagsCache(itemId) {
  try {
    const raw = localStorage.getItem('inspo_aitags_' + itemId);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 86400000) {
      localStorage.removeItem('inspo_aitags_' + itemId);
      return null;
    }
    return data.tags;
  } catch(e) { return null; }
}

export function setAITagsCache(itemId, tags) {
  try {
    // LRU eviction: cap at 200 entries, only scan when counter suggests we're near limit
    const AI_CACHE_MAX = 200;
    const prefix = 'inspo_aitags_';
    const countKey = 'inspo_aitags_count';
    let count = parseInt(localStorage.getItem(countKey), 10) || 0;
    if (count >= AI_CACHE_MAX) {
      // Full scan to evict oldest entries
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) keys.push(key);
      }
      count = keys.length;
      if (count >= AI_CACHE_MAX) {
        const entries = keys.map(k => {
          try { return { k, ts: JSON.parse(localStorage.getItem(k))?.timestamp || 0 }; }
          catch { return { k, ts: 0 }; }
        }).sort((a, b) => a.ts - b.ts);
        const toRemove = entries.slice(0, count - AI_CACHE_MAX + 10);
        toRemove.forEach(e => localStorage.removeItem(e.k));
        count -= toRemove.length;
      }
    }
    localStorage.setItem(prefix + itemId,
      JSON.stringify({ tags, timestamp: Date.now() }));
    localStorage.setItem(countKey, String(count + 1));
  } catch(e) {}
}

loadGeminiCounter();

export function loadDisabledSources() {
  try {
    const saved = localStorage.getItem('inspo_disabled_sources');
    if (saved) STATE.disabledSources = new Set(JSON.parse(saved));
  } catch(e) {}
}

export function saveDisabledSources() {
  try {
    localStorage.setItem('inspo_disabled_sources',
      JSON.stringify([...STATE.disabledSources]));
  } catch(e) {}
}

export function toggleSource(sourceId) {
  if (STATE.disabledSources.has(sourceId)) {
    STATE.disabledSources.delete(sourceId);
  } else {
    STATE.disabledSources.add(sourceId);
  }
  STATE.activePreset = null; // custom mix — clear preset highlight
  saveDisabledSources();
  updateSourcesActiveCounter();
  updatePresetButtons();
}

export function applyPreset(preset) {
  if (preset === 'all') {
    STATE.disabledSources = new Set();
  } else if (preset === 'none') {
    STATE.disabledSources = new Set(ALL_SOURCES);
  } else {
    const group = SOURCE_GROUPS[preset];
    if (!group) return;
    STATE.disabledSources = new Set(ALL_SOURCES.filter(s => !group.includes(s)));
  }
  STATE.activePreset = preset;
  saveDisabledSources();
  updateSourcesActiveCounter();
  hooks.buildKeyRows?.();
  updatePresetButtons();
}

export function updatePresetButtons() {
  const panel = document.getElementById('source-presets');
  if (!panel) return;
  panel.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === STATE.activePreset);
  });
}

/* ── Phase 2: source view filtering ── */
export const SOURCE_VIEW_FILTER = { region: '', access: '', category: '' };

export function applySourceFilter() {
  const { region, access, category } = SOURCE_VIEW_FILTER;
  let visible = 0;
  document.querySelectorAll('#keys-rows-container .key-source-row').forEach(row => {
    const id = row.dataset.sourceId;
    // support toggleId (e.g. rijks → rijksmuseum)
    const src = KEY_SOURCES.find(s => s.id === id || s.toggleId === id);
    const meta = SOURCE_META[src?.toggleId || id] || SOURCE_META[id] || {};
    const regMatch = !region || meta.region === region;
    const accMatch = !access || meta.access === access;
    const catMatch = !category || (meta.category || []).includes(category);
    const show = regMatch && accMatch && catMatch;
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const countEl = document.getElementById('filter-source-count');
  if (countEl) countEl.textContent = visible ? `${visible} sources` : '';
}

export function setSourceViewFilter(dimension, value) {
  SOURCE_VIEW_FILTER[dimension] = value;
  // update pill active states
  const bar = document.getElementById('source-view-filters');
  if (bar) {
    bar.querySelectorAll(`.filter-pill[data-filter="${dimension}"]`).forEach(pill => {
      pill.classList.toggle('active', pill.dataset.value === value);
    });
  }
  applySourceFilter();
}

/* ============================================================
   4. UTILITIES
============================================================ */
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Run an array of promise-returning functions with max concurrency. */
export function promisePool(tasks, concurrency = 20) {
  const results = [];
  let idx = 0;
  function next() {
    if (idx >= tasks.length) return Promise.resolve();
    const i = idx++;
    const task = tasks[i];
    return (typeof task === 'function' ? task() : task)
      .then(r => { results[i] = { status: 'fulfilled', value: r }; })
      .catch(e => { results[i] = { status: 'rejected', reason: e }; })
      .then(() => next());
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => next());
  return Promise.all(workers).then(() => results);
}

export function withTimeout(signal, ms = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (signal.aborted) {
    clearTimeout(timer);
    controller.abort();
  } else {
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      controller.abort();
    }, { once: true });
  }
  return controller.signal;
}

// ── Fetch concurrency limiter — max 40 in-flight network requests ──
export const _fetchSemaphore = { running: 0, queue: [], limit: 40, _totalFailed: 0 };
export function _flushFetchQueue() {
  _fetchSemaphore.queue.length = 0;
}
export function _acquireFetchSlot() {
  return new Promise(resolve => {
    if (_fetchSemaphore.running < _fetchSemaphore.limit) {
      _fetchSemaphore.running++;
      resolve();
    } else {
      _fetchSemaphore.queue.push(resolve);
    }
  });
}
export function _releaseFetchSlot() {
  _fetchSemaphore.running--;
  if (_fetchSemaphore.queue.length) {
    _fetchSemaphore.running++;
    _fetchSemaphore.queue.shift()();
  }
}

// ── safeFetch — drop-in fetch replacement with timeout + 429 retry + concurrency limit ──
export async function safeFetch(url, opts = {}, timeoutMs = CONSTANTS.FETCH_TIMEOUT) {
  await _acquireFetchSlot();
  try {
    const origSignal = opts.signal;
    const s = origSignal ? withTimeout(origSignal, timeoutMs) : AbortSignal.timeout(timeoutMs);
    const fetchOpts = { ...opts, signal: s };
    let res = await fetch(url, fetchOpts);
    // Exponential backoff on 429: retry up to 2 times (2s → 4s)
    for (let attempt = 0; res.status === 429 && attempt < 2; attempt++) {
      const delay = CONSTANTS.RETRY_DELAY * Math.pow(2, attempt);
      await sleep(delay);
      if (origSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
      res = await fetch(url, fetchOpts);
    }
    return res;
  } catch (err) {
    _fetchSemaphore._totalFailed++;
    throw err;
  } finally {
    _releaseFetchSlot();
  }
}

// ── Image proxy helper — routes image URLs through Cloudflare worker for CORS ──
export function proxyImageUrl(url) {
  if (!url) return url;
  // Already proxied or data URI — skip
  if (url.startsWith(CONSTANTS.IMG_PROXY_URL) || url.startsWith('data:')) return url;
  return `${CONSTANTS.IMG_PROXY_URL}/?url=${encodeURIComponent(url)}&w=800`;
}

// Domains whose APIs are CORS-blocked from the browser.
// sourceFetch auto-retries these through the API proxy worker.
const CORS_BLOCKED_API_DOMAINS = new Set([
  'collectionapi.metmuseum.org',
  'chroniclingamerica.loc.gov',
  'api.tepapa.govt.nz',
  'collection.maas.museum', 'api.maas.museum',
  'api.nga.gov',
  'art.thewalters.org', 'api.thewalters.org',
  'collections.britishart.yale.edu',
  'digital.library.cornell.edu',
  'digitalcollections.nypl.org', 'api.repo.nypl.org',
  'gallica.bnf.fr',
  'munch.emuseum.com',
  'collections.lacma.org',
  'data.ago.ca', 'ago.ca', 'www.ago.ca',
  'www.mauritshuis.nl',
  'www.wikiart.org',
  'sammlung.mak.at',
  'www.npg.org.uk',
  'opacplus.bsb-muenchen.de',
  'www.tate.org.uk',
  'rest.museum-digital.de',
  // Added 2026-04-21 sweep — adapters were calling safeFetch directly and failing CORS.
  'www.pem.org',
  'mna.inah.gob.mx',
  'www.munchmuseet.no',
  'digital.bodleian.ox.ac.uk',
  'search.artsmia.org',
]);

function _needsApiProxy(url) {
  try { return CORS_BLOCKED_API_DOMAINS.has(new URL(url).hostname); }
  catch { return false; }
}

/* Per-source adaptive timeout: tracks avg response time and tightens deadline */
export const _sourceTimings = {};
// Known-slow sources need a higher ceiling so a 9-11s response isn't aborted as a miss.
const _SLOW_SOURCES = new Set([
  // Original (national libraries + aggregators with historically 8-11s p95):
  'gallica', 'bhl', 'loc', 'bnf', 'internetarchive', 'europeana',
  // Step 6b — Wave A: additional slow infrastructure (national libraries, aggregators, SRU endpoints):
  'trove', 'chronicling', 'dpla', 'digitalnz', 'ddb', 'finna',
  'joconde', 'bodleian', 'bsb', 'cudl', 'onb', 'mnw',
]);
export function sourceFetch(url, opts = {}, sourceName) {
  const timing = _sourceTimings[sourceName];
  const ceiling = _SLOW_SOURCES.has(sourceName) ? 12000 : 8000;
  const timeout = timing
    ? Math.min(ceiling, Math.max(4000, Math.round(timing.avg * 2)))
    : (_SLOW_SOURCES.has(sourceName) ? ceiling : CONSTANTS.FETCH_TIMEOUT);
  const start = performance.now();

  // If the API domain is known to be CORS-blocked, go through the proxy immediately
  const fetchUrl = _needsApiProxy(url)
    ? `${CONSTANTS.API_PROXY_URL}/proxy?url=${encodeURIComponent(url)}`
    : url;

  return safeFetch(fetchUrl, opts, timeout)
    .then(res => {
      // Old service workers synthesized `504 Offline` on cross-origin fetch failure
      // (swallowing the TypeError). Treat that sentinel as a trigger to retry via proxy.
      if (res && res.status === 504 && res.statusText === 'Offline'
          && fetchUrl === url && CONSTANTS.API_PROXY_URL) {
        return safeFetch(`${CONSTANTS.API_PROXY_URL}/proxy?url=${encodeURIComponent(url)}`, opts, timeout);
      }
      return res;
    })
    .catch(err => {
      // On TypeError (CORS / network failure), retry through API proxy if not already proxied
      if (err instanceof TypeError && fetchUrl === url && CONSTANTS.API_PROXY_URL) {
        return safeFetch(`${CONSTANTS.API_PROXY_URL}/proxy?url=${encodeURIComponent(url)}`, opts, timeout);
      }
      throw err;
    })
    .then(res => {
      const elapsed = performance.now() - start;
      if (!_sourceTimings[sourceName]) _sourceTimings[sourceName] = { avg: elapsed, count: 1 };
      else {
        const t = _sourceTimings[sourceName];
        t.avg = (t.avg * t.count + elapsed) / (t.count + 1);
        t.count = Math.min(t.count + 1, 20);
      }
      return res;
    });
}

// ── Data cache helper — reads pre-fetched data from /data/{sourceId}.json ──
// Sources with missing data files are tracked in _unavailableSources to avoid
// repeated 404s and to prevent health-miss penalties for missing cache files.
export const _unavailableSources = new Set();
export async function fetchFromDataCache(sourceId, keyword, offset = 0) {
  if (_unavailableSources.has(sourceId)) return [];  // skip silently, no miss penalty
  try {
    const res = await fetch(`/data/${sourceId}.json`);
    if (res.status === 404) {
      _unavailableSources.add(sourceId);
      return [];  // return [] (not null) so caller doesn't record a miss
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items || !data.items.length) return null;
    // Filter items by keyword (simple title/tag match)
    const kw = keyword.toLowerCase();
    const filtered = data.items.filter(item =>
      (item.title && item.title.toLowerCase().includes(kw)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(kw)))
    );
    // If keyword filter returns nothing, return random sample
    const results = filtered.length > 0 ? filtered :
      data.items.sort(() => Math.random() - 0.5).slice(0, 40);
    const limit = STATE.perSource || 20;
    // Sanitize: upgrade HTTP→HTTPS to prevent mixed-content blocking (e.g. KHM Vienna)
    return results.slice(offset, offset + limit).map(item => ({
      ...item,
      thumb: item.thumb?.replace(/^http:\/\//, 'https://'),
      url:   item.url?.replace(/^http:\/\//, 'https://'),
      image: item.image?.replace(/^http:\/\//, 'https://'),
    }));
  } catch { return null; }
}

export function pickOnboardingTerm() {
  return ONBOARDING_TERMS[Math.floor(Math.random() * ONBOARDING_TERMS.length)];
}

export function getSourceConfig(sourceId) {
  return KEY_SOURCES.find(s => s.id === sourceId || s.toggleId === sourceId) || null;
}

export function getSourceName(sourceId) {
  return getSourceConfig(sourceId)?.name || sourceId;
}

export function getSourceDomain(sourceId) {
  const fromConfig = getSourceConfig(sourceId)?.getKeyUrl;
  if (fromConfig) {
    try { return new URL(fromConfig).hostname; } catch {}
  }
  if (sourceId?.startsWith('euro_')) return 'europeana.eu';
  return SOURCE_DOMAINS[sourceId] || '';
}

export function getSourceMonogram(label) {
  return (label || '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '??';
}

export function createSourceIdentity(sourceId, labelText) {
  const sourceLabel = labelText || getSourceName(sourceId);
  const domain = getSourceDomain(sourceId);
  const wrapper = document.createElement('span');
  wrapper.className = 'source-identity';

  const iconWrap = document.createElement('span');
  iconWrap.className = 'source-icon-wrap';

  const icon = document.createElement('img');
  icon.className = 'source-icon';
  icon.alt = sourceLabel + ' icon';

  const mono = document.createElement('span');
  mono.className = 'source-mono';
  mono.textContent = getSourceMonogram(sourceLabel);

  if (domain) {
    icon.src = 'https://' + domain + '/favicon.ico';
    icon.onerror = () => {
      icon.style.display = 'none';
      mono.style.display = 'inline-flex';
    };
  } else {
    icon.style.display = 'none';
    mono.style.display = 'inline-flex';
  }

  iconWrap.appendChild(icon);
  iconWrap.appendChild(mono);

  const label = document.createElement('span');
  label.className = 'source-label';
  label.textContent = sourceLabel;

  wrapper.appendChild(iconWrap);
  wrapper.appendChild(label);

  return wrapper;
}

/* ── Word-boundary matching for exact mode ─────────────────────────── */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function matchesAsWholeWord(hay, term) {
  const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const re = new RegExp(`\\b${escapeRegExp(strip(term))}\\b`, 'i');
  return re.test(strip(hay));
}

/* Trigram similarity (0–1) for fuzzy matching */
export function trigramSimilarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  const trigrams = s => {
    const t = new Set();
    const padded = '  ' + s + ' ';
    for (let i = 0; i < padded.length - 2; i++) t.add(padded.slice(i, i + 3));
    return t;
  };
  const tA = trigrams(a), tB = trigrams(b);
  let matches = 0;
  for (const t of tA) if (tB.has(t)) matches++;
  return matches / Math.max(tA.size, tB.size);
}

// Per-query memoization for scoreItemRelevance. The function is called 4–5×
// per item across bucket sort, global sort, RRF, and MMR — on 500+ items
// that's tens of thousands of redundant string scans. Cache resets when
// the query string changes, and also when search mode flips (exact vs
// explore use different match predicates).
let _scoreCache = new Map();
let _scoreCacheQ = '';
let _scoreCacheMode = '';
export function _resetScoreCache() { _scoreCache = new Map(); _scoreCacheQ = ''; _scoreCacheMode = ''; }

export let scoreItemRelevance = function scoreItemRelevance(item, query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return 0;
  const mode = STATE.searchMode;
  if (q !== _scoreCacheQ || mode !== _scoreCacheMode) {
    _scoreCache = new Map();
    _scoreCacheQ = q;
    _scoreCacheMode = mode;
  }
  const ck = item && (item.id || item.url);
  if (ck && _scoreCache.has(ck)) return _scoreCache.get(ck);
  const terms = q.split(/\s+/).filter(Boolean);
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const artist = (item.artist || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();

  // In exact mode, use word-boundary matching; in explore mode, use substring
  const _match = STATE.searchMode === 'exact'
    ? (hay, term) => matchesAsWholeWord(hay, term)
    : (hay, term) => hay.includes(term);

  // Field lengths for BM25-like normalization (shorter fields = more specific matches)
  const titleLen = title.split(/\s+/).length || 1;
  const descLen = desc.split(/\s+/).length || 1;

  let score = 0;

  // Penalise missing or generic titles
  const titleValue = title.trim();
  if (!titleValue || /^(photographs?|image|picture|photo|img[_\s]?\d+|dsc[_\s]?\d+|untitled|no title|file|img)\b/.test(titleValue)) {
    score -= 3;
  }

  // ── Exact full-query matches (highest signal) ──
  if (_match(title, q)) score += Math.max(12, Math.round(20 / Math.sqrt(titleLen)));
  if (_match(artist, q)) score += 10;
  if (_match(desc, q)) score += Math.max(3, Math.round(6 / Math.sqrt(descLen)));

  // ── Per-term scoring with field-length normalization ──
  let termMatches = 0;
  for (const t of terms) {
    if (_match(title, t)) {
      score += Math.max(4, Math.round(8 / Math.sqrt(titleLen)));
      termMatches++;
    } else if (_match(artist, t)) {
      score += 5;
      termMatches++;
    } else if (_match(tags, t)) {
      score += 3;
      termMatches++;
    } else if (_match(desc, t)) {
      score += Math.max(1, Math.round(3 / Math.sqrt(descLen)));
      termMatches++;
    }
  }

  // All terms present bonus (conjunction)
  if (terms.length > 1 && termMatches === terms.length) score += 6;
  // Partial match — proportional credit
  if (terms.length > 1 && termMatches > 0 && termMatches < terms.length) {
    score += Math.round((termMatches / terms.length) * 3);
  }

  // ── Fuzzy fallback — trigram similarity with graduated scoring ──
  if (score === 0 && query) {
    const hay = `${title} ${desc} ${artist} ${tags}`;
    const words = hay.split(/\s+/);
    for (const term of terms) {
      let bestSim = 0;
      for (const word of words) {
        const sim = trigramSimilarity(term, word);
        if (sim > bestSim) bestSim = sim;
      }
      if (bestSim > 0.55) score += Math.max(1, Math.round(bestSim * 3));
    }
  }

  if (STATE.searchMode === 'exact') {
    // Boost items with identifiable art-medium metadata
    const mediumText = `${item.title || ''} ${item.description || ''}`.toLowerCase();
    for (const variants of Object.values(_MEDIUM_TERMS)) {
      if (variants.some(v => mediumText.includes(v))) { score += 4; break; }
    }

    // Penalise modern items (year > 1900) when query is a historical era term
    if (_ERA_REGEX.test(q)) {
      const yr = item.year ? parseInt(item.year, 10) : null;
      if (yr !== null && !isNaN(yr) && yr > 1900) score -= 6;
    }

    // Demote items where query matches ONLY in artist field (not title/desc/tags)
    // unless the query is likely an artist-name search (detected in getDisplayResults)
    const inTitle  = matchesAsWholeWord(title, q);
    const inDesc   = matchesAsWholeWord(desc, q);
    const inTags   = matchesAsWholeWord(tags, q);
    const inArtist = matchesAsWholeWord(artist, q);
    if (inArtist && !inTitle && !inDesc && !inTags && !STATE._isLikelyArtistQuery) {
      score -= 8;
    }
  }

  if (ck) _scoreCache.set(ck, score);
  return score;
}

/* Seeded PRNG (mulberry32) — deterministic shuffle for stable card order */
export function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function queryToSeed(query) {
  let h = 0;
  for (let i = 0; i < query.length; i++) {
    h = ((h << 5) - h + query.charCodeAt(i)) | 0;
  }
  return h;
}

/* Cache of last shuffled display order so slider re-slicing doesn't reshuffle */
export let _lastDisplayOrder = [];

/* ============================================================
   Reciprocal Rank Fusion (RRF)
   RRF(doc) = Σ 1/(k + rank_i(doc)) over every ranked list i
   k=60 is the standard from Cormack et al. 2009 and what Elastic /
   OpenSearch / Azure AI Search ship as default for hybrid retrieval.
============================================================ */
export function rrfFuse(rankings, k = 60, keyFn = (x) => x && (x.url || x.id)) {
  const scores = new Map();
  const seen = new Map();
  for (const ranking of rankings) {
    if (!Array.isArray(ranking)) continue;
    for (let i = 0; i < ranking.length; i++) {
      const item = ranking[i];
      const key = keyFn(item);
      if (!key) continue;
      scores.set(key, (scores.get(key) || 0) + 1 / (k + i + 1));
      if (!seen.has(key)) seen.set(key, item);
    }
  }
  const merged = [];
  for (const [key, item] of seen) {
    merged.push({ item, score: scores.get(key) || 0 });
  }
  merged.sort((a, b) => b.score - a.score);
  return merged.map(x => x.item);
}

/* ============================================================
   Maximal Marginal Relevance (MMR) diversification
   MMR(d) = λ·rel(d) − (1−λ)·max_{s∈selected} sim(d, s)
   With λ=0.5 we trade relevance equally against diversity.
   Similarity falls back through a ladder (pHash → artist/source/year →
   trigram on title+artist) because CLIP embeddings aren't in yet.
============================================================ */
export function itemSimilarity(a, b) {
  if (!a || !b) return 0;
  // pHash Hamming (already computed at render time for dedup) — best signal
  if (a._phash && b._phash && a._phash.length === b._phash.length) {
    let diff = 0;
    for (let i = 0; i < a._phash.length; i++) {
      if (a._phash[i] !== b._phash[i]) diff++;
    }
    return 1 - diff / a._phash.length;
  }
  let sim = 0;
  const ta = (a.title || '').toLowerCase();
  const tb = (b.title || '').toLowerCase();
  const aa = (a.artist || '').toLowerCase();
  const ab = (b.artist || '').toLowerCase();
  // same artist → very similar
  if (aa && aa === ab) sim += 0.5;
  // same source → slightly similar (institutional clumping to break)
  if (a.source && a.source === b.source) sim += 0.15;
  // close in time (within 25 years)
  const ya = a.year ? parseInt(a.year, 10) : null;
  const yb = b.year ? parseInt(b.year, 10) : null;
  if (ya !== null && yb !== null && !isNaN(ya) && !isNaN(yb) && Math.abs(ya - yb) < 25) {
    sim += 0.1;
  }
  // trigram similarity on titles (fast, ok proxy)
  if (ta && tb) sim += trigramSimilarity(ta, tb) * 0.4;
  return Math.min(1, sim);
}

export function mmrRerank(ranked, lambda = 0.5, limit = Infinity) {
  if (!Array.isArray(ranked) || ranked.length < 2) return ranked;
  const remaining = ranked.slice();
  const selected = [];
  const n = Math.min(limit, remaining.length);
  // Relevance = rank position (descending). Convert to [0,1]: 1 for top, 0 for bottom.
  const relOf = (item) => {
    const idx = remaining.indexOf(item);
    return idx === -1 ? 0 : 1 - idx / ranked.length;
  };
  // Seed with the top-ranked item (pure relevance pick)
  selected.push(remaining.shift());
  while (selected.length < n && remaining.length) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const rel = relOf(cand);
      let maxSim = 0;
      for (const s of selected) {
        const sim = itemSimilarity(cand, s);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  // Anything past the MMR window keeps its original order
  return selected.concat(remaining);
}

/* Orientation derived from API-provided dimensions when available,
   falls back to item._aspect set at image-load time (src/app.js). */
export function orientationOf(item) {
  const w = +item.width || 0;
  const h = +item.height || 0;
  if (w && h) {
    const r = w / h;
    if (r > 1.15) return 'landscape';
    if (r < 1 / 1.15) return 'portrait';
    return 'square';
  }
  return item._aspect || null;
}

function _applyOrientationFilter(base) {
  const f = STATE._aspectFilter;
  if (!f || f === 'all') return base;
  return base.filter(item => {
    const o = orientationOf(item);
    if (!o) return true; // unknown — keep rather than drop
    return o === f;
  });
}

export let getDisplayResults = function getDisplayResults(items, query) {
  let base = Array.isArray(items) ? [...items] : [];
  base = _applyOrientationFilter(base);
  if (!base.length) { _lastDisplayOrder = []; return []; }

  if (STATE.searchMode === 'exact') {
    const terms = (query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const JUNK_TITLE_RE = /\b(conference|symposium|lecture|seminar|keynote|workshop|panel discussion|webinar|testimony|hearing|meeting|remarks by|speech by|statement of|briefing|press conference|book review|isbn|pp\.|vol\.|volume \d|pages \d|edited by|proceedings of)\b/i;
    const GENERIC_TITLE_RE = /^(photograph|image|picture|photo|file|img[_\s]?\d|dsc[_\s]?\d|untitled|no title|\d{4}-\d{2})/i;
    const BOOK_RE = /\b(hardcover|paperback|kindle edition|ebook|audiobook|publisher|isbn|\d+ pages|table of contents|bibliography|price guide|index\.?$)\b/i;

    // Detect if query is likely an artist name by checking how many items match in artist field
    if (terms.length) {
      const fullQ = terms.join(' ');
      const artistMatchCount = base.filter(item =>
        matchesAsWholeWord((item.artist || '').toLowerCase(), fullQ)
      ).length;
      STATE._isLikelyArtistQuery = artistMatchCount >= 3;
    } else {
      STATE._isLikelyArtistQuery = false;
    }

    const ranked = base
      .filter(item => {
        if (!terms.length) return true;
        const title = (item.title || '').toLowerCase();
        if (GENERIC_TITLE_RE.test(title) || title.length < 3) return false;
        if (JUNK_TITLE_RE.test(item.title || '')) return false;
        if (BOOK_RE.test(`${item.title || ''} ${item.description || ''}`)) return false;
        const hay = `${title} ${item.description || ''} ${item.artist || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        return terms.some(t => matchesAsWholeWord(hay, t));
      })
      .map(item => ({ item, score: scoreItemRelevance(item, query) }))
      // Was: `score > 0`. Zero-score items still passed the word-boundary
      // whole-word check above, so dropping them nuked half the pool for
      // rare/niche queries. Keep them; sort puts them at the bottom anyway.
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
    _lastDisplayOrder = ranked;
    // Return only the initial render window; the full ranked pool stays in
    // _lastDisplayOrder so fetchMoreResults can drain it before hitting the
    // network. Keeps initial DOM insert snappy and gives infinite scroll a
    // local reserve to expand into.
    return ranked.slice(0, STATE.imageCount);
  }

  // Explore mode: group by source, sort within each bucket by relevance,
  // then fuse via RRF (default) or interleave (legacy) so every source
  // contributes but best matches come first.
  const buckets = {};
  for (const item of base) {
    const s = item.source || 'unknown';
    (buckets[s] || (buckets[s] = [])).push(item);
  }
  const rng = mulberry32(queryToSeed(query || ''));
  const arrays = Object.values(buckets).map(arr => {
    if (query) {
      // Sort by relevance score descending within each source bucket
      arr.sort((a, b) => scoreItemRelevance(b, query) - scoreItemRelevance(a, query));
      // Seeded-shuffle only among items with equal score (stability)
      let start = 0;
      while (start < arr.length) {
        let end = start + 1;
        const s = scoreItemRelevance(arr[start], query);
        while (end < arr.length && scoreItemRelevance(arr[end], query) === s) end++;
        const group = arr.slice(start, end);
        const shuffled = seededShuffle(group, rng);
        arr.splice(start, group.length, ...shuffled);
        start = end;
      }
      return arr;
    }
    return seededShuffle(arr, rng);
  });

  let merged;
  if (STATE.ranker === 'legacy' || !query) {
    // Legacy: naive round-robin interleave across source buckets
    merged = interleave(arrays);
  } else {
    // RRF: fuse two rankings — (a) per-source rank, (b) global score rank
    // Both reward the same items, but (a) enforces source diversity
    // and (b) lets the strongest absolute matches rise to the top.
    const globalRanked = base.slice().sort(
      (a, b) => scoreItemRelevance(b, query) - scoreItemRelevance(a, query)
    );
    merged = rrfFuse([...arrays, globalRanked], 60);
  }

  // MMR diversification — breaks clumping (7 Van Goghs in a row, 9 Met in a row)
  // Window bounded to STATE.imageCount: MMR is O(n²), no value in reranking
  // items beyond the initial viewport — load-more will refill below anyway.
  if (STATE.mmr && query && STATE.searchMode !== 'legacy') {
    const window = Math.min(merged.length, STATE.imageCount);
    merged = mmrRerank(merged, STATE.mmrLambda ?? 0.5, window);
  }

  _lastDisplayOrder = merged;
  // See exact-mode note above — initial render window only; pool drains
  // via fetchMoreResults.
  return merged.slice(0, STATE.imageCount);
}

export function showQuietTip(targetId, text, tipKey) {
  if (!text) return;
  if (tipKey && localStorage.getItem(tipKey)) return;
  const target = document.getElementById(targetId);
  if (!target) return;

  if (tipKey) localStorage.setItem(tipKey, '1');

  const rect = target.getBoundingClientRect();
  const tip = document.createElement('div');
  tip.className = 'quiet-tip';
  tip.textContent = text;
  document.body.appendChild(tip);

  const left = Math.max(10, Math.min(window.innerWidth - 230, rect.left + (rect.width / 2) - 90));
  const top = Math.max(10, rect.top - 38);
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';

  requestAnimationFrame(() => tip.classList.add('visible'));
  setTimeout(() => {
    tip.classList.remove('visible');
    setTimeout(() => tip.remove(), 260);
  }, 2600);
}

/* ============================================================
   5. STOPWORDS & TAG EXTRACTION
============================================================ */
export const STOPWORDS = new Set([
  'the','a','an','of','in','on','at','to','for','with','by','from',
  'and','or','but','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'this','that','these','those','it','its','he','she','they',
  'image','photo','photograph','picture','file','view','unknown',
  'untitled','circa','century','collection','museum','gallery',
  'work','object','item','piece','detail','figure','plate','sheet'
]);

export function extractTags(item) {
  const text = `${item.title} ${item.description}`;
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
  const combined = [...new Set([...item.tags, ...words])];
  return combined.slice(0, 12);
}

/* ============================================================
   6. ANTI-AI FILTER
============================================================ */
export function isLikelyReal(item) {
  // Reject non-browser-fetchable schemes (ftp://, file://, etc.) — CSP blocks them
  // and they pollute the console with security violations.
  const primary = item.url || item.thumb || '';
  if (primary && !/^(https?:|data:)/i.test(primary)) return false;
  const banned = [
    'midjourney', 'stable diffusion', 'dall-e', 'dall e',
    'ai generated', 'ai-generated', 'artificial intelligence generated',
    'deepfake', 'neural network generated', 'stylegan',
    'generative ai', 'text-to-image'
  ];
  const text = `${item.title} ${item.description} ${item.url}`.toLowerCase();
  return !banned.some(b => text.includes(b));
}

/* ============================================================
   7. 24H CACHE
============================================================ */
export const CACHE_PREFIX    = 'inspo_cache_';
export const CACHE_TTL       = 24 * 60 * 60 * 1000;
export const CACHE_MAX_BYTES = 4 * 1024 * 1024;

export function cacheKey(keyword) {
  const mode = STATE.searchMode === 'exact' ? 'exact_' : '';
  return CACHE_PREFIX + mode + keyword.toLowerCase().trim();
}

export function cacheGet(keyword) {
  try {
    const raw = localStorage.getItem(cacheKey(keyword));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey(keyword));
      return null;
    }
    return entry;
  } catch { return null; }
}

export function cacheSet(keyword, results, keywords) {
  try {
    pruneCache();
    const entry = { results, keywords, timestamp: Date.now() };
    localStorage.setItem(cacheKey(keyword), JSON.stringify(entry));
  } catch { pruneCache(true); }
}

export function cacheClear(keyword) {
  localStorage.removeItem(cacheKey(keyword));
}

export function pruneCache(aggressive = false) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(CACHE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(k);
      const entry = JSON.parse(raw);
      entries.push({ k, timestamp: entry.timestamp, size: raw.length });
    } catch { localStorage.removeItem(k); }
  }
  const now = Date.now();
  entries.forEach(e => {
    if (now - e.timestamp > CACHE_TTL) localStorage.removeItem(e.k);
  });
  if (aggressive) {
    const remaining = entries.filter(e => now - e.timestamp <= CACHE_TTL);
    remaining.sort((a, b) => a.timestamp - b.timestamp);
    let totalSize = remaining.reduce((s, e) => s + e.size, 0);
    while (totalSize > CACHE_MAX_BYTES && remaining.length) {
      const oldest = remaining.shift();
      localStorage.removeItem(oldest.k);
      totalSize -= oldest.size;
    }
  }
}

export function getCacheAge(keyword) {
  try {
    const raw = localStorage.getItem(cacheKey(keyword));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return Date.now() - entry.timestamp;
  } catch { return null; }
}

export function formatCacheAge(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

/* ============================================================
   8. KEYWORD EXPANSION (Datamuse + SEED_MAP)
============================================================ */

/* ── Utility: interleave & shuffle (moved from fetchers for dep ordering) ── */
export function interleave(arrays) {
  const result = [];
  const max = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < max; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   SPELL CHECK — "Did you mean?"
   Uses Datamuse sp= endpoint to suggest a correction when a
   single-word query looks misspelled.
============================================================ */
export async function spellCheck(query) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  // Only check the first word — cheap and usually enough
  const word = words[0].toLowerCase().replace(/[^a-z]/g, '');
  if (word.length < 4) return null;  // skip short words
  try {
    const res = await safeFetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const suggestion = data[0].word;
    if (!suggestion || suggestion === word) return null;
    // Return the full query with the first word replaced
    return [suggestion, ...words.slice(1)].join(' ');
  } catch { return null; }
}

/* ============================================================
   PERCEPTUAL HASH — cross-source duplicate detection
   Computes an 8×8 average hash (aHash) on a loaded <img>.
   Two images with Hamming distance < PHASH_THRESHOLD are
   considered visually identical duplicates.
============================================================ */
export const PHASH_THRESHOLD = 10; // out of 64 bits

export function computePHash(imgEl) {
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 8;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imgEl, 0, 0, 8, 8);
    const data = ctx.getImageData(0, 0, 8, 8).data;
    const grays = [];
    for (let i = 0; i < 64; i++) {
      grays.push((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
    }
    const mean = grays.reduce((a, b) => a + b, 0) / 64;
    return grays.map(g => g >= mean ? 1 : 0);
  } catch { return null; }
}

export function pHashDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dist++;
  return dist;
}

/* ── Setters for monkey-patchable bindings (used by app.js feature IIFEs) ── */
export function setScoreItemRelevance(fn) { scoreItemRelevance = fn; }
export function setGetDisplayResults(fn) { getDisplayResults = fn; }
export function set_updateSourcesActiveCounterImmediate(fn) { _updateSourcesActiveCounterImmediate = fn; }
