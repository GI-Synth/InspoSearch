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
        // Slightly penalize sources with zero overlap on a focused query
        if (overlap === 0 && intentTags.length >= 2) score -= 1;
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
  SOURCE_GROUPS.fashion.push('euro_fashion', 'wmc_fashion', 'si_chndm');
  SOURCE_GROUPS.museums.push('si_nmah','si_nmnh','si_npg_dc','si_saam','si_hmsg','si_nzp','si_chndm','si_fsg','si_nmafa','si_nmai','si_nmaahc2','si_nasm2','si_npm','si_acm','si_renwick','euro_rijksmuseum','euro_kulturpool','euro_estonian');
  SOURCE_GROUPS.archives.push(...Object.keys(EUROPEANA_PROVIDERS), ...Object.keys(DPLA_HUBS));
  SOURCE_GROUPS.artdesign.push('euro_rijksmuseum','euro_fashion','wmc_paintings','wmc_sculptures','wmc_portraits','wmc_architecture','wmc_fashion','si_saam','si_hmsg','si_renwick','si_nmafa','si_fsg');
  SOURCE_GROUPS.nature.push('si_nzp','si_nmnh','wmc_natural_history','wmc_botanical','idigbio','ala');
  SOURCE_GROUPS.maps.push('wmc_maps');
  SOURCE_GROUPS.historical.push(...Object.keys(DPLA_HUBS),'euro_newspapers','euro_ddb','euro_bnf','euro_bne','euro_kb','euro_bn_pl','euro_nkr','euro_kulturpool','euro_hispana','euro_nuk','euro_estonian','euro_lithuanian','euro_latvian','euro_hungarian','euro_romanian','euro_bulgarian','si_nmah','si_npm','si_acm','si_nmai');
  SOURCE_GROUPS.botanical.push('wmc_botanical');
  SOURCE_GROUPS.science.push('si_nmnh','si_nzp','si_nasm2','wmc_natural_history','wmc_scientific','idigbio','ala','nasa_images');
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

export function recordSourceResult(sourceName, resultCount) {
  const h = STATE.sourceHealth;
  if (!h[sourceName]) h[sourceName] = { hits: 0, misses: 0, lastSeen: 0 };
  if (resultCount > 0) {
    const wasPaused = h[sourceName].misses >= CONSTANTS.HEALTH_MISS_LIMIT;
    h[sourceName].hits++;
    h[sourceName].misses  = 0;
    h[sourceName].lastSeen = Date.now();
    h[sourceName]._notified = false;
    if (wasPaused && hooks.showToast) {
      hooks.showToast(`source "${sourceName}" recovered`, 2000);
    }
  } else {
    h[sourceName].misses++;
  }
  if (!_healthWriteTimer) _healthWriteTimer = setTimeout(_flushSourceHealth, 2000);
}

export function isSourceHealthy(sourceName) {
  const h = STATE.sourceHealth[sourceName];
  if (!h) return true;           // never tried — always allow
  if (h.misses >= CONSTANTS.HEALTH_MISS_LIMIT) {
    if (!h._notified) {
      h._notified = true;
      if (hooks.showToast) hooks.showToast(`source "${sourceName}" paused — no results after ${CONSTANTS.HEALTH_MISS_LIMIT} tries`, 3000);
    }
    return false;
  }
  return true;
}

export function callIfHealthy(sourceName, fetchPromise) {
  if (STATE.disabledSources.has(sourceName)) return Promise.resolve([]);
  if (!isSourceHealthy(sourceName)) return Promise.resolve([]);
  return fetchPromise;
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

// ── Fetch concurrency limiter — max 25 in-flight network requests ──
export const _fetchSemaphore = { running: 0, queue: [], limit: 25, _totalFailed: 0 };
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

/* Per-source adaptive timeout: tracks avg response time and tightens deadline */
export const _sourceTimings = {};
export function sourceFetch(url, opts = {}, sourceName) {
  const timing = _sourceTimings[sourceName];
  const timeout = timing
    ? Math.min(5000, Math.max(2000, Math.round(timing.avg * 2)))
    : CONSTANTS.FETCH_TIMEOUT;
  const start = performance.now();
  return safeFetch(url, opts, timeout).then(res => {
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
export async function fetchFromDataCache(sourceId, keyword) {
  try {
    const res = await fetch(`/data/${sourceId}.json`);
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
      data.items.sort(() => Math.random() - 0.5).slice(0, 20);
    return results.slice(0, STATE.perSource || 20);
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
  return SOURCE_DOMAINS[sourceId] || (sourceId + '.org');
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
  icon.src = 'https://' + domain + '/favicon.ico';

  const mono = document.createElement('span');
  mono.className = 'source-mono';
  mono.textContent = getSourceMonogram(sourceLabel);

  icon.onerror = () => {
    icon.style.display = 'none';
    mono.style.display = 'inline-flex';
  };

  iconWrap.appendChild(icon);
  iconWrap.appendChild(mono);

  const label = document.createElement('span');
  label.className = 'source-label';
  label.textContent = sourceLabel;

  wrapper.appendChild(iconWrap);
  wrapper.appendChild(label);

  return wrapper;
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

export let scoreItemRelevance = function scoreItemRelevance(item, query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter(Boolean);
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  const text = `${title} ${desc} ${tags}`;

  let score = 0;
  if (title.includes(q)) score += 9;
  if (desc.includes(q)) score += 4;
  if (text.includes(q)) score += 5;

  let termMatches = 0;
  terms.forEach(t => {
    if (title.includes(t)) { score += 3; termMatches++; }
    else if (desc.includes(t)) { score += 2; termMatches++; }
    else if (tags.includes(t)) { score += 2; termMatches++; }
  });

  if (terms.length > 1 && termMatches === terms.length) score += 4;
  if (score === 0 && query) {
    const hay = `${title} ${desc} ${tags}`;
    const words = hay.split(/\s+/);
    for (const term of terms) {
      for (const word of words) {
        if (trigramSimilarity(term, word) > 0.55) { score += 1; break; }
      }
    }
  }
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

export let getDisplayResults = function getDisplayResults(items, query) {
  const base = Array.isArray(items) ? [...items] : [];
  if (!base.length) { _lastDisplayOrder = []; return []; }

  if (STATE.searchMode === 'exact') {
    const terms = (query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const ranked = base
      // Layer 2 gate: at least one query term must appear in the item's text
      .filter(item => {
        if (!terms.length) return true;
        const hay = `${item.title || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        return terms.some(t => hay.includes(t));
      })
      .map(item => ({ item, score: scoreItemRelevance(item, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
    _lastDisplayOrder = ranked;
    return ranked.slice(0, STATE.imageCount);
  }

  // Fair round-robin: group by source, then interleave with seeded shuffle
  const buckets = {};
  for (const item of base) {
    const s = item.source || 'unknown';
    (buckets[s] || (buckets[s] = [])).push(item);
  }
  const rng = mulberry32(queryToSeed(query || ''));
  const arrays = Object.values(buckets).map(arr => seededShuffle(arr, rng));
  _lastDisplayOrder = interleave(arrays);
  return _lastDisplayOrder.slice(0, STATE.imageCount);
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

/* ── Setters for monkey-patchable bindings (used by app.js feature IIFEs) ── */
export function setScoreItemRelevance(fn) { scoreItemRelevance = fn; }
export function setGetDisplayResults(fn) { getDisplayResults = fn; }
export function set_updateSourcesActiveCounterImmediate(fn) { _updateSourcesActiveCounterImmediate = fn; }
