/* ============================================================
   app.js — Fetch orchestration, rendering, search, UI, events, features
   ============================================================ */
import { t as tr, initLocale, setLocale, getLocale, applyI18n, SUPPORTED_LOCALES } from './i18n.js';
import {
  ADAPTERS, ALL_SOURCES, BADGE_META, CONSTANTS, DPLA_HUBS, DYNAMIC_REGISTRY,
  EUROPEANA_PROVIDERS, KEY_SOURCES, SI_UNITS, SOURCE_DOMAINS, SOURCE_GROUPS,
  SOURCE_META, STATE, WD_PHASE_H, _isBoardPopup,
  _realRenderGrid, _secondaryControllers, classifyQuery, filterNegativeTerms,
  filterPhrases, parseNegativeTerms, skipIrrelevantSource, ONBOARDING_TERMS,
  NATURE_QUERY_TERMS, SPACE_QUERY_TERMS, SEED_MAP,
  ART_QUERY_TERMS,
  classifyQueryExtended, classifyQueryV2,
  set_realRenderGrid
} from './state.js';
import {
  CACHE_PREFIX, STOPWORDS, _fetchSemaphore, _flushSourceHealth,
  _healthWriteTimer, _lastDisplayOrder, cacheGet, cacheSet, cacheClear,
  callIfHealthy, createSourceIdentity, debounce, formatCacheAge,
  getCacheAge, getAITagsCache, getDisplayResults, getSourceName,
  hooks, incrementGeminiCounter, isAIProviderRateLimited,
  isGeminiRateLimited, isSourceHealthy, loadDisabledSources,
  loadGeminiCounter, loadSourceHealth, pickOnboardingTerm, pruneCache,
  queryToSeed, recordSourceResult, safeFetch, scoreItemRelevance,
  selectDynamicSources, seededShuffle, setAITagsCache, setSourceViewFilter,
  showQuietTip, sleep, stripHtml, toggleSource, trackAIProviderCall,
  updateGeminiCounterUI, updatePresetButtons, updateSourcesActiveCounter,
  mulberry32, applyPreset, applySourceFilter, _updateSourcesActiveCounterImmediate,
  saveDisabledSources, getSourceConfig, getSourceDomain, getSourceMonogram,
  trigramSimilarity, withTimeout, promisePool, extractTags, isLikelyReal,
  interleave, shuffle, cacheKey, CACHE_TTL, CACHE_MAX_BYTES,
  disableGeminiButtons, SOURCE_VIEW_FILTER, sourceFetch, fetchFromDataCache,
  proxyImageUrl,
  setScoreItemRelevance, setGetDisplayResults,
  set_updateSourcesActiveCounterImmediate,
  spellCheck, computePHash, pHashDistance, PHASH_THRESHOLD,
  matchesAsWholeWord
} from './core.js';
import {
  WD_PHASE_H_FETCHERS, expandKeywords,
  fetchAGO, fetchALA, fetchAPOD, fetchAltePinakothek, fetchAmsterdamMuseum,
  fetchArtsDecoratifs,
  fetchArtsy, fetchAuckland, fetchBHL, fetchBSB, fetchBelvedere,
  fetchBodleian, fetchBoijmans, fetchCUDL, fetchCarnegie, fetchCentraalMuseum,
  fetchChicagoArt, fetchChroniclingAmerica, fetchCleveland, fetchCooperHewitt,
  fetchCornell, fetchDDB, fetchDPLA, fetchDPLAProvider, fetchDecArtsPrague,
  fetchDesignmuseumDK, fetchDigitalNZ, fetchEOL, fetchEuropeana,
  fetchEuropeanaFiltered, fetchFinna, fetchFitzwilliam, fetchFlickrCommons,
  fetchFolger, fetchFreerSackler, fetchFriesMuseum, fetchGBIF,
  fetchGBIFLiterature, fetchGalleriaPalatina, fetchGallica, fetchGalliera,
  fetchGetty, fetchGroeninge, fetchGroninger, fetchGuimet, fetchHarvard,
  fetchHerzogAntonUlrich, fetchHubble, fetchIDigBio, fetchIIIFCollection,
  fetchIIIFSearch, fetchINaturalist, fetchJoconde, fetchKHM, fetchKMSKA,
  fetchLACMA, fetchLakenhal, fetchLouvreAD, fetchMAAS, fetchMAK,
  fetchMNA, fetchMNW, fetchMauritshuis, fetchMet, fetchMia, fetchMoMAWD,
  fetchMunch, fetchMuseeOrsay, fetchMuseuTraje, fetchNASA, fetchNASAImages,
  fetchNASM, fetchNGA, fetchNGI, fetchNHMLondon, fetchNMAAHC, fetchNOAA,
  fetchNPG, fetchNPMTaipei, fetchNYPL, fetchNationalGalleryLondon,
  fetchNationalZoo, fetchNationalmuseumSE, fetchNaturalis, fetchNordicMuseum,
  fetchONB,
  fetchPAS, fetchPEM, fetchParisMusees, fetchPexels, fetchPhotogrammar,
  fetchPicsum, fetchPixabay, fetchPrado, fetchPrinceton, fetchQuaiBranly,
  fetchRMFAB, fetchRijksmuseum, fetchRijksmuseumTwenthe, fetchSMG, fetchSMK,
  fetchSOCH, fetchScottishNational, fetchSmithsonian, fetchSmithsonianUnit,
  fetchStaedel, fetchTate, fetchTePapa, fetchTextileMuseum, fetchTeylers,
  fetchThyssen, fetchTrove, fetchUSGS, fetchUnsplash, fetchVA,
  fetchVanGoghMuseum, fetchWallaceCollection, fetchWalters, fetchWellcome,
  fetchWereldculturen, fetchWhitney, fetchWikiArt, fetchWikidata,
  fetchYale
} from './fetchers.js';
import {
  fetchMetDeep, fetchEuropeanaDeep, fetchChicagoArtDeep
} from './fetchers.js';

// ── i18n: detect/restore locale and apply translations to DOM ──────────────
initLocale();
applyI18n();

export async function fetchAll(keywords, totalCount, isSilent = false) {
  // isSilent = true means background/cross-ref call — don't cancel existing requests
  // Use a local abort controller so parallel cross-ref calls don't cancel each other
  let signal;
  if (isSilent) {
    const localAC = new AbortController();
    signal = localAC.signal;
  } else {
    if (STATE.abortController) STATE.abortController.abort();
    // Flush any pending health write before starting a new search
    if (_healthWriteTimer) { clearTimeout(_healthWriteTimer); _flushSourceHealth(); }
    STATE.abortController = new AbortController();
    signal = STATE.abortController.signal;
  }

  const keyword    = keywords[0];
  const altKeyword = keywords[1] || keyword;
  const alt2       = keywords[2] || altKeyword;

  // all slots always run — key-gated sources return [] when no key set
  // Request generously from each source — user wants a flood of results
  const dynamicActive = selectDynamicSources(keyword, 120).length;
  const PRODUCTIVE_SOURCE_ESTIMATE = STATE.searchMode === 'exact'
    ? Math.max(30, 30 + Math.floor(dynamicActive * 0.3))
    : Math.max(40, 40 + Math.floor(dynamicActive * 0.3));
  const perSource  = Math.max(6, Math.ceil(totalCount / PRODUCTIVE_SOURCE_ESTIMATE));
  const fetchBatch = perSource + 4;
  // Per-source limit overrides: high-inventory sources use the PER_SOURCE_LIMIT floor
  const limitFor = id => Math.max(fetchBatch, CONSTANTS.PER_SOURCE_LIMIT[id] ?? 0);

  const seenIds  = new Set();
  const seenUrls = new Set(); // URL-level dedup: same image from multiple sources counted once
  const all = [];
  const exactQueryClass = classifyQueryExtended(keyword);

  // Reset failed-fetch counter for offline detection
  _fetchSemaphore._totalFailed = 0;

  // Decay source miss counters — halve instead of resetting so persistently
  // failing sources don't get unlimited free passes each search
  for (const key of Object.keys(STATE.sourceHealth)) {
    const h = STATE.sourceHealth[key];
    h.misses = Math.floor(h.misses / 2);
    if (h.misses < CONSTANTS.HEALTH_MISS_LIMIT && h._notified) {
      h._notified = false;  // allow re-notification if it fails again
    }
  }
  updateSourcesActiveCounter();

  // Track which sources had at least one successful call this search,
  // so variant calls returning empty don't snowball misses.
  const sourceHitThisSearch = new Set();
  const sourceYield = new Map(); // tracks how many items survived per source (for adaptive Phase 2)
  let sourceSkipCount = 0;
  let sourceCallCount = 0;
  const isSourceSkipped = sourceId => {
    const skipped = skipIrrelevantSource(sourceId, exactQueryClass);
    if (skipped) sourceSkipCount++; else sourceCallCount++;
    return skipped;
  };

  const onSourceResult = sourceName => items => {
    if (signal.aborted) return;

    // Record health using RAW count (before exact-mode filtering)
    const rawCount = (items || []).length;
    if (rawCount > 0) {
      sourceHitThisSearch.add(sourceName);
      recordSourceResult(sourceName, rawCount);
    } else if (!sourceHitThisSearch.has(sourceName)) {
      // Only record a miss if no variant call for this source has hit yet
      recordSourceResult(sourceName, 0);
    }
    updateSourcesActiveCounter();

    // Layer 2: hard gate in exact mode — discard items with zero keyword presence
    if (STATE.searchMode === 'exact' && items && items.length) {
      const terms = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const isSingleWord = terms.length === 1;

      // Junk title patterns — conference photos, headshots, lectures, book covers, generic filenames
      const JUNK_TITLE_RE = /\b(conference|symposium|lecture|seminar|keynote|workshop|panel discussion|webinar|testimony|hearing|meeting|remarks by|speech by|statement of|briefing|press conference|book review|isbn|pp\.|vol\.|volume \d|pages \d|edited by|proceedings of)\b/i;
      const GENERIC_TITLE_RE = /^(photograph|image|picture|photo|file|img[_\s]?\d|dsc[_\s]?\d|untitled|no title|\d{4}-\d{2})/i;
      const BOOK_RE = /\b(hardcover|paperback|kindle edition|ebook|audiobook|publisher|isbn|\d+ pages|table of contents|bibliography|price guide|index\.?$)\b/i;

      items = items.filter(item => {
        const title = (item.title || '').toLowerCase();
        // Drop items with generic/meaningless titles
        if (GENERIC_TITLE_RE.test(title) || title.length < 3) return false;
        // Drop conference/lecture items in exact mode
        if (JUNK_TITLE_RE.test(item.title || '')) return false;
        // Drop book metadata items
        if (BOOK_RE.test(`${item.title || ''} ${item.description || ''}`)) return false;

        // Single-word queries: require the term in the title specifically
        if (isSingleWord) {
          return matchesAsWholeWord(title, terms[0]);
        }
        // Multi-word: require at least 1 term in title/description/artist/tags
        // Scoring in getDisplayResults ranks items with more matches higher
        const hay = `${title} ${item.description || ''} ${item.artist || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        return terms.some(t => matchesAsWholeWord(hay, t));
      });
    }
    if (!items || !items.length) return;
    // ── Quality gate — skip low-quality items before they enter the grid ──
    items = items.filter(item => {
      // Must have an image (fetchers use `thumb` and `url`, not `thumbnail`/`image`)
      if (!item.thumb && !item.url) return false;
      // Skip items with no title AND no artist (likely junk metadata)
      const title = (item.title || '').trim();
      const artist = (item.artist || '').trim();
      if (title.length < 2 && !artist) return false;
      // Skip tiny placeholder thumbnails (common museum "no image" placeholders)
      const thumb = item.thumb || item.url || '';
      if (/width=([1-9]\d?)(?:\D|$)/.test(thumb) && parseInt(RegExp.$1) < 80) return false;
      return true;
    });
    if (!items.length) return;
    // Track per-source yield for adaptive Phase 2 follow-up
    sourceYield.set(sourceName, (sourceYield.get(sourceName) || 0) + items.length);
    const fresh = items.filter(item => !seenIds.has(item.id) && !seenUrls.has(item.url));
    fresh.forEach(item => { seenIds.add(item.id); if (item.url) seenUrls.add(item.url); });
    all.push(...fresh);
    const preview = STATE.searchMode === 'exact'
      ? getDisplayResults(fresh, STATE.query)
      : (() => {
          // Explore relevance gate: drop items with zero keyword relevance
          const scored = fresh.filter(item => scoreItemRelevance(item, keyword) > 0);
          return shuffle(scored.length ? scored : fresh);
        })();
    renderGrid(preview);
  };

  await Promise.allSettled([
    // ── Batch 1 ────────────────────────────────────────────
    callIfHealthy('met',          STATE.searchMode === 'exact' ? fetchMetDeep(keywords.join(' '), 40, signal, 6) : fetchMet(keywords.join(' '), limitFor('met'), signal)).then(onSourceResult('met')).catch(() => {}),
    isSourceSkipped('nasa',        exactQueryClass) ? Promise.resolve() : callIfHealthy('nasa',        fetchNASA(keyword,           fetchBatch, signal)).then(onSourceResult('nasa')).catch(() => {}),
    isSourceSkipped('inaturalist', exactQueryClass) ? Promise.resolve() : callIfHealthy('inaturalist', fetchINaturalist(keyword,    limitFor('inaturalist'), signal)).then(onSourceResult('inaturalist')).catch(() => {}),
    callIfHealthy('chicago',      STATE.searchMode === 'exact' ? fetchChicagoArtDeep(keyword, 50, signal, 5) : fetchChicagoArt(keyword, limitFor('chicago'), signal)).then(onSourceResult('chicago')).catch(() => {}),
    callIfHealthy('cleveland',    fetchCleveland(keyword,                       limitFor('cleveland'), signal)).then(onSourceResult('cleveland')).catch(() => {}),
    callIfHealthy('va',           fetchVA(keyword,                              limitFor('va'), signal)).then(onSourceResult('va')).catch(() => {}),
    callIfHealthy('wikiart',      fetchWikiArt(keyword,                         fetchBatch, signal)).then(onSourceResult('wikiart')).catch(() => {}),
    callIfHealthy('nordic',       fetchNordicMuseum(keyword,                    fetchBatch, signal)).then(onSourceResult('nordic')).catch(() => {}),
    callIfHealthy('flickr',       fetchFlickrCommons(keyword,                   fetchBatch, signal)).then(onSourceResult('flickr')).catch(() => {}),
    callIfHealthy('europeana',    STATE.searchMode === 'exact' ? fetchEuropeanaDeep(keyword, 60, signal, 5) : fetchEuropeana(keyword, fetchBatch, signal)).then(onSourceResult('europeana')).catch(() => {}),
    callIfHealthy('europeana',    fetchEuropeana(alt2,                          fetchBatch, signal)).then(onSourceResult('europeana')).catch(() => {}),
    ...(STATE.searchMode === 'exact' ? [] : [
      callIfHealthy('europeana',    fetchEuropeana(keyword + ' fashion',          fetchBatch, signal)).then(onSourceResult('europeana')).catch(() => {}),
      callIfHealthy('europeana',    fetchEuropeana(keyword + ' textile costume',  fetchBatch, signal)).then(onSourceResult('europeana')).catch(() => {}),
    ]),
    callIfHealthy('rijksmuseum',  fetchRijksmuseum(keyword,                     fetchBatch, signal)).then(onSourceResult('rijksmuseum')).catch(() => {}),
    callIfHealthy('harvard',      fetchHarvard(keyword,                         fetchBatch, signal)).then(onSourceResult('harvard')).catch(() => {}),
    callIfHealthy('smithsonian',  fetchSmithsonian(keyword,                     fetchBatch, signal)).then(onSourceResult('smithsonian')).catch(() => {}),
    callIfHealthy('pexels',       fetchPexels(keyword,                          fetchBatch, signal)).then(onSourceResult('pexels')).catch(() => {}),
    callIfHealthy('pixabay',      fetchPixabay(keyword,                         fetchBatch, signal)).then(onSourceResult('pixabay')).catch(() => {}),
    // ── Batch 2 ────────────────────────────────────────────
    callIfHealthy('getty',        fetchGetty(keyword,                           fetchBatch, signal)).then(onSourceResult('getty')).catch(() => {}),
    callIfHealthy('nga',          fetchNGA(keyword,                             limitFor('nga'), signal)).then(onSourceResult('nga')).catch(() => {}),
    isSourceSkipped('gbif',  exactQueryClass) ? Promise.resolve() : callIfHealthy('gbif',  fetchGBIF(keyword,  limitFor('gbif'), signal)).then(onSourceResult('gbif')).catch(() => {}),
    isSourceSkipped('eol',   exactQueryClass) ? Promise.resolve() : callIfHealthy('eol',   fetchEOL(keyword,   fetchBatch, signal)).then(onSourceResult('eol')).catch(() => {}),
    isSourceSkipped('apod',  exactQueryClass) ? Promise.resolve() : callIfHealthy('apod',  fetchAPOD(keyword,  fetchBatch, signal)).then(onSourceResult('apod')).catch(() => {}),
    callIfHealthy('gallica',      fetchGallica(keyword,                         fetchBatch, signal)).then(onSourceResult('gallica')).catch(() => {}),
    callIfHealthy('chronicling',  fetchChroniclingAmerica(keyword,              fetchBatch, signal)).then(onSourceResult('chronicling')).catch(() => {}),
    callIfHealthy('trove',        fetchTrove(keyword,                           fetchBatch, signal)).then(onSourceResult('trove')).catch(() => {}),
    callIfHealthy('digitalnz',    fetchDigitalNZ(keyword,                       fetchBatch, signal)).then(onSourceResult('digitalnz')).catch(() => {}),
    callIfHealthy('bhl',          fetchBHL(keyword,                             fetchBatch, signal)).then(onSourceResult('bhl')).catch(() => {}),
    callIfHealthy('carnegie',     fetchCarnegie(keyword,                        fetchBatch, signal)).then(onSourceResult('carnegie')).catch(() => {}),
    callIfHealthy('prado',        fetchPrado(keyword,                           fetchBatch, signal)).then(onSourceResult('prado')).catch(() => {}),
    callIfHealthy('parismusees',  fetchParisMusees(keyword,                     fetchBatch, signal)).then(onSourceResult('parismusees')).catch(() => {}),
    callIfHealthy('yale',         fetchYale(keyword,                            fetchBatch, signal)).then(onSourceResult('yale')).catch(() => {}),
    callIfHealthy('picsum',       fetchPicsum(keyword,                          fetchBatch, signal)).then(onSourceResult('picsum')).catch(() => {}),
    isSourceSkipped('usgs', exactQueryClass) ? Promise.resolve() : callIfHealthy('usgs', fetchUSGS(keyword, fetchBatch, signal)).then(onSourceResult('usgs')).catch(() => {}),
    callIfHealthy('cooperhewitt', fetchCooperHewitt(keyword,                    fetchBatch, signal)).then(onSourceResult('cooperhewitt')).catch(() => {}),
    // ── Batch 3 ────────────────────────────────────────────
    callIfHealthy('tate',         fetchTate(keyword,                            fetchBatch, signal)).then(onSourceResult('tate')).catch(() => {}),
    isSourceSkipped('finna', exactQueryClass) ? Promise.resolve() : callIfHealthy('finna',        fetchFinna(keyword,                           fetchBatch, signal)).then(onSourceResult('finna')).catch(() => {}),
    callIfHealthy('soch',         fetchSOCH(keyword,                            fetchBatch, signal)).then(onSourceResult('soch')).catch(() => {}),
    callIfHealthy('joconde',      fetchJoconde(keyword,                         fetchBatch, signal)).then(onSourceResult('joconde')).catch(() => {}),
    callIfHealthy('mnw',          fetchMNW(keyword,                             fetchBatch, signal)).then(onSourceResult('mnw')).catch(() => {}),
    callIfHealthy('tepapa',       fetchTePapa(keyword,                          fetchBatch, signal)).then(onSourceResult('tepapa')).catch(() => {}),
    callIfHealthy('dpla',         fetchDPLA(keyword,                            fetchBatch, signal)).then(onSourceResult('dpla')).catch(() => {}),
    callIfHealthy('ddb',          fetchDDB(keyword,                             fetchBatch, signal)).then(onSourceResult('ddb')).catch(() => {}),
    callIfHealthy('artsy',        fetchArtsy(keyword,                           fetchBatch, signal)).then(onSourceResult('artsy')).catch(() => {}),
    callIfHealthy('pas',          fetchPAS(keyword,                             fetchBatch, signal)).then(onSourceResult('pas')).catch(() => {}),
    callIfHealthy('smg',          fetchSMG(keyword,                             fetchBatch, signal)).then(onSourceResult('smg')).catch(() => {}),
    callIfHealthy('auckland',     fetchAuckland(keyword,                        fetchBatch, signal)).then(onSourceResult('auckland')).catch(() => {}),
    isSourceSkipped('photogrammar', exactQueryClass) ? Promise.resolve() : callIfHealthy('photogrammar', fetchPhotogrammar(keyword, fetchBatch, signal)).then(onSourceResult('photogrammar')).catch(() => {}),
    callIfHealthy('wellcome',     fetchWellcome(keyword,                        fetchBatch, signal)).then(onSourceResult('wellcome')).catch(() => {}),
    callIfHealthy('maas',         fetchMAAS(keyword,                            fetchBatch, signal)).then(onSourceResult('maas')).catch(() => {}),
    callIfHealthy('smk',          fetchSMK(keyword,                             fetchBatch, signal)).then(onSourceResult('smk')).catch(() => {}),
    callIfHealthy('thyssen',      fetchThyssen(keyword,                         fetchBatch, signal)).then(onSourceResult('thyssen')).catch(() => {}),
    // ── Batch 4 — new sources ──────────────────────────────
    callIfHealthy('walters',      fetchWalters(keyword,                         perSource+4, signal)).then(onSourceResult('walters')).catch(() => {}),
    callIfHealthy('princeton',    fetchPrinceton(keyword,                       perSource+4, signal)).then(onSourceResult('princeton')).catch(() => {}),
    isSourceSkipped('wikidata', exactQueryClass) ? Promise.resolve() : callIfHealthy('wikidata',     fetchWikidata(keyword,                        perSource+4, signal)).then(onSourceResult('wikidata')).catch(() => {}),
    isSourceSkipped('noaa',   exactQueryClass) ? Promise.resolve() : callIfHealthy('noaa',   fetchNOAA(keyword,   perSource+4, signal)).then(onSourceResult('noaa')).catch(() => {}),
    isSourceSkipped('hubble', exactQueryClass) ? Promise.resolve() : callIfHealthy('hubble', fetchHubble(keyword, perSource+4, signal)).then(onSourceResult('hubble')).catch(() => {}),
    callIfHealthy('cornell',      fetchCornell(keyword,                         perSource+4, signal)).then(onSourceResult('cornell')).catch(() => {}),
    callIfHealthy('folger',       fetchFolger(keyword,                          perSource+4, signal)).then(onSourceResult('folger')).catch(() => {}),
    callIfHealthy('onb',          fetchONB(keyword,                             perSource+4, signal)).then(onSourceResult('onb')).catch(() => {}),
    callIfHealthy('nypl',         fetchNYPL(keyword,                            perSource+4, signal)).then(onSourceResult('nypl')).catch(() => {}),
    callIfHealthy('mak',          fetchMAK(keyword,                             perSource+4, signal)).then(onSourceResult('mak')).catch(() => {}),
    callIfHealthy('mna',          fetchMNA(keyword,                             perSource+4, signal)).then(onSourceResult('mna')).catch(() => {}),
    // ── Batch 4 — extra calls (reusing existing functions) ─
    ...(STATE.searchMode === 'exact' ? [] : [
      callIfHealthy('louvre',       fetchJoconde(keyword + ' Louvre',             perSource+4, signal)
        .then(r => r.map(i => ({ ...i, id: i.id.replace('joconde_', 'louvre_'), source: 'louvre' }))))
        .then(onSourceResult('louvre')).catch(() => {}),
    ]),
    ...(STATE.searchMode === 'exact' ? [] : [
      callIfHealthy('rijksmuseum',  fetchRijksmuseum(keyword + ' drawing',        perSource+4, signal)).then(onSourceResult('rijksmuseum')).catch(() => {}),
      callIfHealthy('rijksmuseum',  fetchRijksmuseum(keyword + ' print',          perSource+4, signal)).then(onSourceResult('rijksmuseum')).catch(() => {}),
      callIfHealthy('bhl',          fetchBHL('illustrated ' + keyword,            perSource+4, signal)).then(onSourceResult('bhl')).catch(() => {}),
      callIfHealthy('smithsonian',  fetchSmithsonian(keyword + ' photograph',     perSource+4, signal)).then(onSourceResult('smithsonian')).catch(() => {}),
    ]),

    // ── Batch 7 ────────────────────────────────────────────
    callIfHealthy('mia',              fetchMia(keyword,                            perSource+2, signal)).then(onSourceResult('mia')).catch(() => {}),
    callIfHealthy('lacma',            fetchLACMA(keyword,                          perSource+2, signal)).then(onSourceResult('lacma')).catch(() => {}),
    callIfHealthy('munch',            fetchMunch(keyword,                          perSource+2, signal)).then(onSourceResult('munch')).catch(() => {}),
    callIfHealthy('mauritshuis',      fetchMauritshuis(keyword,                    perSource+2, signal)).then(onSourceResult('mauritshuis')).catch(() => {}),
    callIfHealthy('nationalmuseumse', fetchNationalmuseumSE(keyword,               perSource+2, signal)).then(onSourceResult('nationalmuseumse')).catch(() => {}),
    isSourceSkipped('naturalis',   exactQueryClass) ? Promise.resolve() : callIfHealthy('naturalis',   fetchNaturalis(keyword,      perSource+2, signal)).then(onSourceResult('naturalis')).catch(() => {}),
    callIfHealthy('nmaahc',           fetchNMAAHC(keyword,                         perSource+2, signal)).then(onSourceResult('nmaahc')).catch(() => {}),
    callIfHealthy('nasm',             fetchNASM(keyword,                           perSource+2, signal)).then(onSourceResult('nasm')).catch(() => {}),
    callIfHealthy('whitney',          fetchWhitney(keyword,                        perSource+2, signal)).then(onSourceResult('whitney')).catch(() => {}),
    isSourceSkipped('nationalzoo', exactQueryClass) ? Promise.resolve() : callIfHealthy('nationalzoo', fetchNationalZoo(keyword,     perSource+2, signal)).then(onSourceResult('nationalzoo')).catch(() => {}),
    isSourceSkipped('gbiflit',     exactQueryClass) ? Promise.resolve() : callIfHealthy('gbiflit',     fetchGBIFLiterature(keyword,  perSource+2, signal)).then(onSourceResult('gbiflit')).catch(() => {}),
    callIfHealthy('freersackler',     fetchFreerSackler(keyword,                   perSource+2, signal)).then(onSourceResult('freersackler')).catch(() => {}),

    callIfHealthy('ago',              fetchAGO(keyword,                            perSource+2, signal)).then(onSourceResult('ago')).catch(() => {}),
    callIfHealthy('pem',              fetchPEM(keyword,                            perSource+2, signal)).then(onSourceResult('pem')).catch(() => {}),
    callIfHealthy('npg',              fetchNPG(keyword,                            perSource+2, signal)).then(onSourceResult('npg')).catch(() => {}),
    callIfHealthy('louvread',         fetchLouvreAD(keyword,                       perSource+2, signal)).then(onSourceResult('louvread')).catch(() => {}),
    // ── Batch 7 — extra calls (reusing existing functions) ─
    ...(STATE.searchMode === 'exact' ? [] : [
      callIfHealthy('met',              fetchMet('heilbrunn ' + keyword,             perSource+2, signal)).then(onSourceResult('met')).catch(() => {}),
      callIfHealthy('nmaahc',           fetchNMAAHC(keyword + ' photograph',         perSource+2, signal)).then(onSourceResult('nmaahc')).catch(() => {}),
      callIfHealthy('cooperhewitt',     fetchCooperHewitt(keyword + ' textile pattern', perSource+2, signal)).then(onSourceResult('cooperhewitt')).catch(() => {}),
      callIfHealthy('wellcome',         fetchWellcome(keyword + ' illustration',      perSource+2, signal)).then(onSourceResult('wellcome')).catch(() => {}),
    ]),
    // ── Phase 2 — new sources ─────────────────────────────
    callIfHealthy('unsplash',         fetchUnsplash(keyword,                        perSource+2, signal)).then(onSourceResult('unsplash')).catch(() => {}),
    callIfHealthy('bodleian',         fetchBodleian(keyword,                        perSource+2, signal)).then(onSourceResult('bodleian')).catch(() => {}),
    callIfHealthy('bsb',              fetchBSB(keyword,                             perSource+2, signal)).then(onSourceResult('bsb')).catch(() => {}),
    callIfHealthy('cudl',             fetchCUDL(keyword,                            perSource+2, signal)).then(onSourceResult('cudl')).catch(() => {}),
    // ── Phase 2 — manifest-loaded IIIF sources (injected dynamically) ─
    ...(STATE.manifestSources || []).map(cfg => {
      const adapterFunc = cfg.adapter === 'iiif_content_search' ? fetchIIIFSearch : fetchIIIFCollection;
      return callIfHealthy(cfg.id, adapterFunc(cfg, keyword, perSource+2, signal)
        .then(r => r.map(i => ({ ...i, source: i.source || cfg.id }))))
        .then(onSourceResult(cfg.id)).catch(() => {})
    }),
    // ── Phase A — Europeana sub-collections (20) ─────────────────────────
    ...Object.entries(EUROPEANA_PROVIDERS).map(([id, cfg]) =>
      callIfHealthy(id, fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, keyword, Math.max(2, Math.ceil(perSource/3)), signal, cfg.extra || '')
        .then(r => r.map(i => ({ ...i, source: id }))))
        .then(onSourceResult(id)).catch(() => {})
    ),
    // ── Phase A — DPLA hub sub-collections (15) ─────────────────────────
    ...Object.entries(DPLA_HUBS).map(([id, cfg]) =>
      callIfHealthy(id, fetchDPLAProvider(cfg.provider, keyword, Math.max(2, Math.ceil(perSource/3)), signal)
        .then(r => r.map(i => ({ ...i, source: id }))))
        .then(onSourceResult(id)).catch(() => {})
    ),
    // ── Phase A — Smithsonian sub-museums (staggered to avoid 429) ────
    (async () => {
      const siEntries = Object.entries(SI_UNITS);
      const siTasks = siEntries.map(([id, cfg]) => () =>
        callIfHealthy(id, fetchSmithsonianUnit(cfg.code, keyword, Math.max(2, Math.ceil(perSource/3)), signal)
          .then(r => r.map(i => ({ ...i, source: id }))))
          .then(onSourceResult(id)).catch(() => {})
      );
      await promisePool(siTasks, 3);
    })(),

    // ── Phase B — zero-auth free APIs ────────────────────────────────────
    isSourceSkipped('idigbio', exactQueryClass) ? Promise.resolve() : callIfHealthy('idigbio', fetchIDigBio(keyword, Math.max(3, perSource), signal)).then(onSourceResult('idigbio')).catch(() => {}),
    isSourceSkipped('ala',     exactQueryClass) ? Promise.resolve() : callIfHealthy('ala',     fetchALA(keyword,     Math.max(3, perSource), signal)).then(onSourceResult('ala')).catch(() => {}),
    // ── Phase D — niche & specialized ──────────────────────────────────
    isSourceSkipped('nasa_images', exactQueryClass) ? Promise.resolve() : callIfHealthy('nasa_images', fetchNASAImages(keyword, Math.max(3, perSource), signal)).then(onSourceResult('nasa_images')).catch(() => {}),
    // ── Phase E — CORS-blocked, cache-first ─────────────────────────────
    callIfHealthy('nhm_london',              fetchNHMLondon(keyword,              Math.max(3, perSource), signal)).then(onSourceResult('nhm_london')).catch(() => {}),
    callIfHealthy('wallace_collection',      fetchWallaceCollection(keyword,      Math.max(3, perSource), signal)).then(onSourceResult('wallace_collection')).catch(() => {}),
    callIfHealthy('fitzwilliam',             fetchFitzwilliam(keyword,            Math.max(3, perSource), signal)).then(onSourceResult('fitzwilliam')).catch(() => {}),
    callIfHealthy('national_gallery_london', fetchNationalGalleryLondon(keyword,  Math.max(3, perSource), signal)).then(onSourceResult('national_gallery_london')).catch(() => {}),
    callIfHealthy('scottish_national',       fetchScottishNational(keyword,       Math.max(3, perSource), signal)).then(onSourceResult('scottish_national')).catch(() => {}),
    callIfHealthy('musee_orsay',             fetchMuseeOrsay(keyword,             Math.max(3, perSource), signal)).then(onSourceResult('musee_orsay')).catch(() => {}),
    callIfHealthy('vangogh_museum',          fetchVanGoghMuseum(keyword,          Math.max(3, perSource), signal)).then(onSourceResult('vangogh_museum')).catch(() => {}),
    callIfHealthy('khm',                     fetchKHM(keyword,                    Math.max(3, perSource), signal)).then(onSourceResult('khm')).catch(() => {}),
    callIfHealthy('belvedere',               fetchBelvedere(keyword,              Math.max(3, perSource), signal)).then(onSourceResult('belvedere')).catch(() => {}),
    callIfHealthy('staedel',                 fetchStaedel(keyword,                Math.max(3, perSource), signal)).then(onSourceResult('staedel')).catch(() => {}),
    callIfHealthy('rmfab',                   fetchRMFAB(keyword,                  Math.max(3, perSource), signal)).then(onSourceResult('rmfab')).catch(() => {}),
    callIfHealthy('guimet',                  fetchGuimet(keyword,                 Math.max(3, perSource), signal)).then(onSourceResult('guimet')).catch(() => {}),
    callIfHealthy('npm_taipei',              fetchNPMTaipei(keyword,              Math.max(3, perSource), signal)).then(onSourceResult('npm_taipei')).catch(() => {}),
    // Phase F — Fashion & Textile CORS-blocked sources
    callIfHealthy('galliera',                fetchGalliera(keyword,               Math.max(3, perSource), signal)).then(onSourceResult('galliera')).catch(() => {}),
    callIfHealthy('arts_decoratifs',         fetchArtsDecoratifs(keyword,         Math.max(3, perSource), signal)).then(onSourceResult('arts_decoratifs')).catch(() => {}),
    callIfHealthy('centraal_museum',         fetchCentraalMuseum(keyword,         Math.max(3, perSource), signal)).then(onSourceResult('centraal_museum')).catch(() => {}),
    callIfHealthy('textile_museum_tilburg',  fetchTextileMuseum(keyword,          Math.max(3, perSource), signal)).then(onSourceResult('textile_museum_tilburg')).catch(() => {}),
    callIfHealthy('wereldculturen',          fetchWereldculturen(keyword,         Math.max(3, perSource), signal)).then(onSourceResult('wereldculturen')).catch(() => {}),
    callIfHealthy('dec_arts_prague',         fetchDecArtsPrague(keyword,          Math.max(3, perSource), signal)).then(onSourceResult('dec_arts_prague')).catch(() => {}),
    callIfHealthy('designmuseum_dk',         fetchDesignmuseumDK(keyword,         Math.max(3, perSource), signal)).then(onSourceResult('designmuseum_dk')).catch(() => {}),
    callIfHealthy('boijmans',                fetchBoijmans(keyword,               Math.max(3, perSource), signal)).then(onSourceResult('boijmans')).catch(() => {}),
    callIfHealthy('museu_traje',             fetchMuseuTraje(keyword,             Math.max(3, perSource), signal)).then(onSourceResult('museu_traje')).catch(() => {}),
    // Phase G — Art, Sculpture & History CORS-blocked (14)
    callIfHealthy('kmska',                   fetchKMSKA(keyword,                  Math.max(3, perSource), signal)).then(onSourceResult('kmska')).catch(() => {}),
    callIfHealthy('amsterdam_museum',        fetchAmsterdamMuseum(keyword,        Math.max(3, perSource), signal)).then(onSourceResult('amsterdam_museum')).catch(() => {}),
    callIfHealthy('ngi',                     fetchNGI(keyword,                    Math.max(3, perSource), signal)).then(onSourceResult('ngi')).catch(() => {}),
    callIfHealthy('fries_museum',            fetchFriesMuseum(keyword,            Math.max(3, perSource), signal)).then(onSourceResult('fries_museum')).catch(() => {}),
    callIfHealthy('groeninge',               fetchGroeninge(keyword,              Math.max(3, perSource), signal)).then(onSourceResult('groeninge')).catch(() => {}),
    callIfHealthy('groninger',               fetchGroninger(keyword,              Math.max(3, perSource), signal)).then(onSourceResult('groninger')).catch(() => {}),
    callIfHealthy('moma_wd',                 fetchMoMAWD(keyword,                 Math.max(3, perSource), signal)).then(onSourceResult('moma_wd')).catch(() => {}),
    callIfHealthy('rijksmuseum_twenthe',     fetchRijksmuseumTwenthe(keyword,     Math.max(3, perSource), signal)).then(onSourceResult('rijksmuseum_twenthe')).catch(() => {}),
    callIfHealthy('herzog_anton_ulrich',     fetchHerzogAntonUlrich(keyword,      Math.max(3, perSource), signal)).then(onSourceResult('herzog_anton_ulrich')).catch(() => {}),
    callIfHealthy('galleria_palatina',       fetchGalleriaPalatina(keyword,       Math.max(3, perSource), signal)).then(onSourceResult('galleria_palatina')).catch(() => {}),
    callIfHealthy('lakenhal',                fetchLakenhal(keyword,               Math.max(3, perSource), signal)).then(onSourceResult('lakenhal')).catch(() => {}),
    callIfHealthy('teylers',                 fetchTeylers(keyword,                Math.max(3, perSource), signal)).then(onSourceResult('teylers')).catch(() => {}),
    callIfHealthy('alte_pinakothek',         fetchAltePinakothek(keyword,         Math.max(3, perSource), signal)).then(onSourceResult('alte_pinakothek')).catch(() => {}),
    callIfHealthy('quai_branly',             fetchQuaiBranly(keyword,             Math.max(3, perSource), signal)).then(onSourceResult('quai_branly')).catch(() => {}),
    // Phase H — 113 World Museum sources (deferred to wave 2 below)
    // ── DYNAMIC REGISTRY — Europeana providers, DPLA hubs (when keys set) ──
    ...selectDynamicSources(keyword, 120).map(entry => {
      const adapter = ADAPTERS[entry.adapter];
      if (!adapter) return Promise.resolve();
      return adapter(entry.config, keyword, Math.max(2, Math.ceil(perSource / 3)), signal)
        .then(r => (r || []).map(i => ({ ...i, source: i.source || entry.id })))
        .then(onSourceResult(entry.id))
        .catch(() => {});
    }),
  ]);
  // sourceCallCount only covers the ~17 skip-gated science sources; museum/WD sources
  // always fire unconditionally, so sourceCallCount === 0 does not mean all sources were skipped.
  // The flag is only reliable when there are truly no fallback sources at all.
  const sourceAllSkipped = sourceCallCount === 0 && sourceSkipCount > 0 && WD_PHASE_H.length === 0;

  // ── Wave 2: Phase H world museums (deferred so main results land fast) ──
  if (!signal.aborted) {
    await Promise.allSettled(
      WD_PHASE_H.map(s =>
        callIfHealthy(s.id, WD_PHASE_H_FETCHERS[s.id](keyword, Math.max(3, perSource), signal))
          .then(onSourceResult(s.id)).catch(() => {})
      )
    ).catch(() => {});
  }

  // ── Phase 2: Adaptive follow-up — fetch more pages from productive sources ──
  if (STATE.searchMode === 'exact' && all.length < totalCount && !signal.aborted) {
    const _PAGE2_FETCHERS = {
      harvard:     (kw, lim, sig, pg) => fetchHarvard(kw, lim, sig, pg),
      smithsonian: (kw, lim, sig, pg) => fetchSmithsonian(kw, lim, sig, pg * lim),
      va:          (kw, lim, sig, pg) => fetchVA(kw, lim, sig, pg),
      cleveland:   (kw, lim, sig, pg) => fetchCleveland(kw, lim, sig, (pg - 1) * lim),
      flickr:      (kw, lim, sig, pg) => fetchFlickrCommons(kw, lim, sig, pg),
      nga:         (kw, lim, sig, pg) => fetchNGA(kw, lim, sig, (pg - 1) * lim),
      gallica:     (kw, lim, sig, pg) => fetchGallica(kw, lim, sig, (pg - 1) * lim + 1),
      dpla:        (kw, lim, sig, pg) => fetchDPLA(kw, lim, sig, pg),
      wellcome:    (kw, lim, sig, pg) => fetchWellcome(kw, lim, sig, pg),
      europeana:   (kw, lim, sig, pg) => fetchEuropeana(kw, lim, sig, (pg - 1) * lim + 1),
      chicago:     (kw, lim, sig, pg) => fetchChicagoArt(kw, lim, sig, pg),
    };
    const topSources = [...sourceYield.entries()]
      .filter(([id]) => _PAGE2_FETCHERS[id])     // only sources with pagination support
      .filter(([, count]) => count >= 3)          // yielded 3+ valid items
      .sort((a, b) => b[1] - a[1])               // most productive first
      .slice(0, 8);                               // top 8

    if (topSources.length) {
      const deficit = totalCount - all.length;
      const perFollowUp = Math.max(10, Math.ceil(deficit / topSources.length));
      await Promise.allSettled(
        topSources.flatMap(([sourceId]) => {
          const fetcher = _PAGE2_FETCHERS[sourceId];
          // Fetch pages 2 and 3
          return [2, 3].map(pg =>
            fetcher(keyword, perFollowUp, signal, pg)
              .then(onSourceResult(sourceId))
              .catch(() => {})
          );
        })
      );
    }
  }

  if (!isSilent && !all.length) {
    // Distinguish between "no results" and "all sources failed"
    const failedCount = _fetchSemaphore._totalFailed || 0;
    if (failedCount > 10 && !navigator.onLine) {
      showOfflineState();
    } else if (sourceAllSkipped) {
      showEmptyState('No sources were selected for this query because filters or exact mode excluded them. Try Explore mode or clear filters.');
    } else {
      showEmptyState();
    }
  }
  return all;
}

/* ============================================================
   13. RENDER ENGINE
============================================================ */
export function showLoading(msg = 'searching...') {
  document.getElementById('loading-indicator').textContent = msg;
}
export function hideLoading() {
  document.getElementById('loading-indicator').textContent = '';
}

/* -- Toast notification -- */
export let _toastTimer = null;
export function showToast(msg, duration = 4000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
}
hooks.showToast = showToast;

/* -- Show failed-image toast after search settles -- */
export function checkFailedImages() {
  const n = STATE._failedImages || 0;
  if (n > 0) showToast(`${n} image${n > 1 ? 's' : ''} failed to load`);
}

export const renderedIds = new Set();
// pHash seen set — reset on each new search, checked as each image loads
export const _pHashSeen = new Set();

// ── Preload-then-append render queue ──────────────────────────────────
// Images are validated off-DOM before any card is created. This prevents
// "black squares" (empty card shells) and "disappearing images" (cards
// removed after their image fails to load).
const _renderQueue = [];
let _renderActive = 0;
let _renderGen = 0;           // generation counter — clearGrid invalidates in-flight loads
const _RENDER_CONCURRENCY = 12;

export function clearGrid() {
  document.getElementById('image-grid').innerHTML = '';
  renderedIds.clear();
  _gridItemMap.clear();
  _pHashSeen.clear();
  _renderQueue.length = 0;
  _renderActive = 0;
  _renderGen++;
}

/* -- IntersectionObserver for lazy image loading -- */
export let _lazyObserver = _createLazyObserver();
export function _createLazyObserver() {
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      _lazyObserver.unobserve(img);
    });
  }, { rootMargin: '200px' });
}
export function _resetLazyObserver() {
  _lazyObserver.disconnect();
  _lazyObserver = _createLazyObserver();
}

export function showEmptyState(message) {
  const grid = document.getElementById('image-grid');
  if (!grid.querySelector('.empty-state')) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
        <p>${message || 'nothing found — try different words'}</p>
        <span>${message ? '' : 'try: texture / light / form / shadow'}</span>
      </div>`;
  }
}

/* ── "Did you mean?" banner ────────────────────────────────── */
export function showDidYouMean(suggestion) {
  let el = document.getElementById('did-you-mean');
  if (!el) {
    el = document.createElement('div');
    el.id = 'did-you-mean';
    el.style.cssText = [
      'position:sticky;top:0;z-index:20;',
      'padding:7px 16px;',
      'background:var(--bg-panel);',
      'border-bottom:1px solid var(--line);',
      'font-family:var(--font-ui);font-size:11px;',
      'color:var(--ink-3);letter-spacing:0.04em;',
      'display:flex;align-items:center;gap:8px;',
    ].join('');
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.insertBefore(el, canvas.firstChild);
  }
  el.innerHTML = `${tr('didYouMean')} <button style="background:none;border:none;color:var(--accent,#C8B89A);cursor:pointer;font-family:var(--font-ui);font-size:11px;letter-spacing:0.04em;text-decoration:underline;padding:0;" id="dym-btn">${suggestion}</button>?`;
  el.style.display = 'flex';
  document.getElementById('dym-btn')?.addEventListener('click', () => {
    document.getElementById('search-input').value = suggestion;
    hideDidYouMean();
    runSearch(suggestion);
  });
}
export function hideDidYouMean() {
  const el = document.getElementById('did-you-mean');
  if (el) el.style.display = 'none';
}

/* ── License filter (post-fetch) ──────────────────────────── */
// CC license info lives on item.license or item.rights if sources provide it.
// Known CC0/public-domain source IDs — always pass the CC0 filter.
const _CC0_SOURCES = new Set([
  'met','nga','cleveland','chicago','rijksmuseum','lac','smk','nationalmuseumse',
  'mia','lacma','walters','cooper-hewitt','cooperhewitt','ypm','carnegie',
  'open-access','openaccess','smithsonian','picsum',
]);
export function applyLicenseFilter(items, filter) {
  if (!filter || filter === 'any') return items;
  return items.filter(item => {
    const lic = (item.license || item.rights || '').toLowerCase();
    const src = (item.source || '').toLowerCase();
    if (filter === 'cc0') {
      return _CC0_SOURCES.has(src) || lic.includes('cc0') || lic.includes('public domain') || lic.includes('pdm');
    }
    if (filter === 'cc-by') {
      return lic.includes('cc') || lic.includes('creative commons') || _CC0_SOURCES.has(src);
    }
    if (filter === 'open') {
      return lic.includes('cc') || lic.includes('public domain') || lic.includes('open') || lic.includes('pdm') || _CC0_SOURCES.has(src);
    }
    return true;
  });
}

// NSFW filter — sampled: caption first 8 result cards via Workers AI, hide flagged ones.
// "Sampled" = checks only the first wave; doesn't re-check on load-more. Opt-in only.
const _NSFW_KEYWORDS = /\bnude|naked|explicit|pornograph|sexual|erotic|genital|nsfw\b/i;
export async function applySampledNsfwFilter(items) {
  // Pick a representative sample — first 8 with a real thumb URL
  const sample = items
    .filter(it => (it.thumb || it.url) && /^https?:\/\//.test(it.thumb || it.url))
    .slice(0, 8);
  const flagged = new Set();

  await Promise.allSettled(sample.map(async it => {
    const imgUrl = it.thumb || it.url;
    try {
      const res = await fetch(`${_API_BASE}/caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imgUrl }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;
      const { caption } = await res.json();
      if (caption && _NSFW_KEYWORDS.test(caption)) flagged.add(it.id);
    } catch { /* skip */ }
  }));

  if (!flagged.size) return;
  // Hide flagged cards from DOM and remove from STATE.results
  STATE.results = STATE.results.filter(it => !flagged.has(it.id));
  flagged.forEach(id => {
    const card = document.getElementById('card-' + id);
    if (card) card.style.display = 'none';
  });
}

export function showOfflineState() {
  const grid = document.getElementById('image-grid');
  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
      <p>you appear to be offline</p>
      <span>check your connection and try again</span>
    </div>`;
}

// Global unhandled rejection handler — catch silent failures
window.addEventListener('unhandledrejection', (e) => {
  // Suppress abort errors (expected when searches are cancelled)
  if (e.reason?.name === 'AbortError') { e.preventDefault(); return; }
  console.warn('[InspoSearch] Unhandled rejection:', e.reason?.message || e.reason);
  e.preventDefault();
});

export const _gridItemMap = new Map();

// Phase 5.1+5.2 — Sources excluded from "verified cultural institution" badge
const _NON_VERIFIED = new Set([
  'flickr','pexels','pixabay','picsum','unsplash','artsy',
  'wikiart','eol','gbif','gbiflit','inaturalist','naturalis',
]);

export function renderGrid(items) {
  const grid = document.getElementById('image-grid');
  if (items.length) {
    const emptyState = grid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
  }
  if (!items.length) return;

  for (const item of items) {
    if (renderedIds.has(item.id)) continue;
    renderedIds.add(item.id);
    _renderQueue.push(item);
  }
  _processRenderQueue();
}

function _processRenderQueue() {
  const grid = document.getElementById('image-grid');
  const gen = _renderGen;
  while (_renderActive < _RENDER_CONCURRENCY && _renderQueue.length > 0) {
    const item = _renderQueue.shift();
    _renderActive++;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';

    testImg.onload = () => {
      _renderActive--;
      if (gen !== _renderGen) return;                       // search changed — discard
      if (testImg.naturalWidth <= 1 || testImg.naturalHeight <= 1) {
        renderedIds.delete(item.id);
        _backfillOne();
        _processRenderQueue();
        return;
      }
      _appendValidCard(item, grid, testImg);
      _processRenderQueue();
    };

    testImg.onerror = () => {
      if (!testImg._corsRetry && testImg.crossOrigin) {
        testImg._corsRetry = true;
        testImg.crossOrigin = null;
        testImg.src = item.thumb;
        return;
      }
      // Last resort: route through image proxy worker to bypass CORS
      if (!testImg._proxyRetry) {
        testImg._proxyRetry = true;
        testImg.crossOrigin = 'anonymous';
        testImg.src = proxyImageUrl(item.thumb);
        return;
      }
      _renderActive--;
      if (gen !== _renderGen) return;
      renderedIds.delete(item.id);
      STATE._failedImages = (STATE._failedImages || 0) + 1;
      _backfillOne();
      _processRenderQueue();
    };

    testImg.src = item.thumb;
  }
}

function _backfillOne() {
  if (!STATE._reservePool || !STATE._reservePool.length) return;
  while (STATE._reservePool.length) {
    const next = STATE._reservePool.shift();
    if (!renderedIds.has(next.id)) {
      renderedIds.add(next.id);
      _renderQueue.push(next);
      return;
    }
  }
}

function _appendValidCard(item, grid, preloadedImg) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.id = 'card-' + item.id;
  card.dataset.id = item.id;
  card.setAttribute('data-source', item.source);
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', (item.title || 'image') + ' — ' + (item.source || 'source'));

  // Reuse the preloaded image element — it already has pixel data in memory
  const img = preloadedImg;
  img.alt = [item.title, item.artist].filter(Boolean).join(' — ') || '';
  img.classList.add('loaded');

  // ── Post-load processing (image is already decoded) ──
  if (STATE.sketchMode) applySketchToCard(card, img);
  const ratio = img.naturalWidth / img.naturalHeight;
  item._aspect = ratio > 1.15 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square';
  if (!item._colorData) {
    item._colorData = sampleImageColors(img);
    if (item._colorData) {
      item._dominantColor = item._colorData.dominant;
      item._avgRGB       = item._colorData.avgRGB;
      item._colorNames   = item._colorData.colorNames;
      item._topColors    = item._colorData.topColors;
    }
  }
  if (STATE._colorFilter && STATE._colorFilter !== 'all') {
    var names = item._colorNames || (item._dominantColor ? [item._dominantColor] : []);
    if (names.length && !names.includes(STATE._colorFilter)) { renderedIds.delete(item.id); _backfillOne(); return; }
  }
  if (typeof window._hexPaletteMatch === 'function' && STATE._hexPalette && STATE._hexPalette.length && !window._hexPaletteMatch(item)) {
    renderedIds.delete(item.id); _backfillOne(); return;
  }
  if (!item._phash) item._phash = computePHash(img);
  if (item._phash && _pHashSeen.size > 0) {
    for (const seen of _pHashSeen) {
      if (pHashDistance(item._phash, seen) < PHASH_THRESHOLD) {
        renderedIds.delete(item.id); _backfillOne(); return;
      }
    }
  }
  if (item._phash) _pHashSeen.add(item._phash);

  // ── Badge ──
  const badge = document.createElement('span');
  const _sm = BADGE_META[item.source];
  badge.className = 'source-badge badge-' + (_sm ? _sm[0] : 'wiki');
  const sourceLabel = _sm ? _sm[1] : item.source;
  const _srcMeta = SOURCE_META[item.source];
  const _isVerified = _srcMeta && !_NON_VERIFIED.has(item.source) &&
    (_srcMeta.category?.includes('museums') || _srcMeta.category?.includes('archives') || _srcMeta.category?.includes('historical'));
  badge.innerHTML = `<span class="badge-label">${sourceLabel}</span>${_isVerified ? '<span class="badge-verified" title="Verified cultural institution \u00b7 Human-curated collection">\u2713</span>' : ''}<span class="badge-refresh" title="Refresh ${sourceLabel}">\u21BA</span>`;

  card.appendChild(img);
  card.appendChild(badge);

  const zoomBtn = document.createElement('button');
  zoomBtn.className = 'zoom-btn';
  zoomBtn.innerHTML = '⤢';
  zoomBtn.title = 'Deep zoom';
  card.appendChild(zoomBtn);

  const simBtn = document.createElement('button');
  simBtn.className = 'sim-btn';
  simBtn.innerHTML = '≈';
  simBtn.title = 'More like this';
  card.appendChild(simBtn);

  card.draggable = true;
  _gridItemMap.set(item.id, item);

  grid.appendChild(card);
}
set_realRenderGrid(renderGrid);

/* ── Delegated event listeners on #image-grid ── */
(function setupGridDelegation() {
  const grid = document.getElementById('image-grid');

  function getItemFromCard(card) {
    return card ? _gridItemMap.get(card.dataset.id) : null;
  }

  grid.addEventListener('click', e => {
    // Badge refresh
    const refresh = e.target.closest('.badge-refresh');
    if (refresh) {
      e.stopPropagation();
      const card = refresh.closest('.image-card');
      const item = getItemFromCard(card);
      if (item) refreshSource(item.source);
      return;
    }
    // Deep-zoom button
    const zoom = e.target.closest('.zoom-btn');
    if (zoom) {
      e.stopPropagation();
      const card = zoom.closest('.image-card');
      const item = getItemFromCard(card);
      if (item) openDeepZoom(item);
      return;
    }
    // Similar button
    const sim = e.target.closest('.sim-btn');
    if (sim) return;
    // Card click
    const card = e.target.closest('.image-card');
    const item = getItemFromCard(card);
    if (!item) return;
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      toggleSelection(item);
      if (STATE.crossRefMode) {
        if (!STATE.referenceImages.find(r => r.id === item.id)) {
          STATE.referenceImages.push(item);
          showReferenceStrip(STATE.referenceImages);
          if (STATE.crossRefMode === 'interpret' && STATE.geminiKey) {
            runInterpret();
          } else {
            runConnect();
          }
        }
      }
      updatePanel();
      return;
    }
    // Normal click: preview item in panel without adding to floating bar
    updatePanel(item);
    // Multi-select discovery tip: show once on first card click
    if (!localStorage.getItem('inspo_tip_multiselect')) {
      localStorage.setItem('inspo_tip_multiselect', '1');
      showQuietTip(card.id, 'ctrl+click images to select & compare — a floating toolbar appears', null);
    }
  });

  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.image-card');
    const item = getItemFromCard(card);
    if (!item) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      toggleSelection(item);
    }
    updatePanel(item);
  });

  grid.addEventListener('dragstart', e => {
    const card = e.target.closest('.image-card');
    const item = getItemFromCard(card);
    if (!item) return;
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id, thumb: item.thumb, title: item.title,
      source: item.source, tags: item.tags || [],
      sourceUrl: item.sourceUrl || '', year: item.year || '',
      colors: item.colors || [],
    }));
    e.dataTransfer.effectAllowed = 'copy';
  });

  grid.addEventListener('dblclick', e => {
    const card = e.target.closest('.image-card');
    const item = getItemFromCard(card);
    if (!item) return;
    e.stopPropagation();
    // Double-click adds to board if open, but does NOT select
    // Selection requires Ctrl/Cmd+click
    const boardCanvas = document.getElementById('board-canvas');
    if (document.getElementById('board-overlay')?.classList.contains('open')) {
      if (!STATE.selected.find(s => s.id === item.id)) {
        toggleSelection(item);
      }
      let alreadyOnBoard = false;
      boardCanvas.querySelectorAll('.board-card').forEach(bc => {
        if (boardCardMap.get(bc)?.id === item.id) alreadyOnBoard = true;
      });
      if (!alreadyOnBoard) {
        const offset = (STATE.selected.length - 1) * 16;
        createBoardCard(item,
          24 + (offset % 320),
          24 + Math.floor(offset / 320) * 180,
          boardCanvas);
      }
      if (typeof persistBoardState === 'function') persistBoardState();
      if (typeof broadcastBoardSync  === 'function') broadcastBoardSync();
    }
  });
})();

/* ============================================================
   PHASE 3 — SELECTION & PANEL
============================================================ */

/* -- Color extraction (Canvas API fallback + color-thief upgrade) -- */
export function getDominantColors(imgEl, count = 10) {
  try {
    if (window.ColorThief) {
      const ct = new ColorThief();
      // color-thief needs image already loaded and from same origin / with crossOrigin
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        const palette = ct.getPalette(imgEl, Math.min(count, 12));
        return palette.map(rgb => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
      }
    }
    // Fallback: original canvas bucket method
    const canvas = document.createElement('canvas');
    canvas.width = 50; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;
    const buckets = {};
    for (let i = 0; i < data.length; i += 16) {
      const r = Math.round(data[i]   / 32) * 32;
      const g = Math.round(data[i+1] / 32) * 32;
      const b = Math.round(data[i+2] / 32) * 32;
      const key = `${r},${g},${b}`;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key]) => `rgb(${key})`);
  } catch {
    return [];
  }
}

/* -- Async color extraction — deferred to idle callback to avoid main-thread jank -- */
export function getDominantColorsAsync(imgEl, count = 10) {
  return new Promise(resolve => {
    const run = () => resolve(getDominantColors(imgEl, count));
    // Try to load color-thief first, then extract
    if (!window.ColorThief && typeof loadColorThief === 'function') {
      loadColorThief(() => {
        loadTinyColor(() => {
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(run, { timeout: 500 });
          } else {
            setTimeout(run, 0);
          }
        });
      });
    } else {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout: 500 });
      } else {
        setTimeout(run, 0);
      }
    }
  });
}

/* -- Related searches via Datamuse -- */
export async function getRelated(tag) {
  try {
    const [trg, lc] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(tag)}&max=5`).then(r => r.json()),
      fetch(`https://api.datamuse.com/words?lc=${encodeURIComponent(tag)}&max=3`).then(r => r.json()),
    ]);
    return [
      ...(trg.status === 'fulfilled' ? trg.value : []),
      ...(lc.status  === 'fulfilled' ? lc.value  : []),
    ].map(w => w.word);
  } catch {
    return [];
  }
}

/* -- Get color name from rgb string using TinyColor (or fallback) -- */
export function getColorName(rgbStr) {
  if (window.tinycolor) {
    const tc = tinycolor(rgbStr);
    const named = tc.toName();
    if (named) return named;
    // Approximate: find nearest CSS named color
    const hex = tc.toHexString();
    const hsl = tc.toHsl();
    // Give a descriptive name based on hue/sat/lum
    if (hsl.s < 0.1) {
      if (hsl.l < 0.15) return 'Black';
      if (hsl.l < 0.35) return 'Dark Gray';
      if (hsl.l < 0.65) return 'Gray';
      if (hsl.l < 0.85) return 'Light Gray';
      return 'White';
    }
    const hue = hsl.h;
    let name = '';
    if (hue < 15) name = 'Red';
    else if (hue < 40) name = 'Orange';
    else if (hue < 65) name = 'Yellow';
    else if (hue < 160) name = 'Green';
    else if (hue < 200) name = 'Cyan';
    else if (hue < 260) name = 'Blue';
    else if (hue < 300) name = 'Purple';
    else if (hue < 340) name = 'Pink';
    else name = 'Red';
    if (hsl.l < 0.3) name = 'Dark ' + name;
    else if (hsl.l > 0.7) name = 'Light ' + name;
    return name;
  }
  return rgbStr;
}

/* -- Render colour palette (dot + name + hex, vertical list) -- */
export function renderColorDots(colors) {
  const container = document.getElementById('swatches');
  container.innerHTML = '';
  colors.forEach(color => {
    const hex = window.tinycolor ? tinycolor(color).toHexString() : color;
    const name = getColorName(color);

    const row = document.createElement('div');
    row.className = 'color-row';

    const dot = document.createElement('div');
    dot.className = 'color-dot';
    dot.style.background = color;

    const label = document.createElement('div');
    label.className = 'color-label';
    label.innerHTML = '<span class="color-name">' + name + '</span><span class="color-hex">' + hex + '</span>';

    // Copied feedback
    const badge = document.createElement('span');
    badge.className = 'dot-copied-badge';
    badge.textContent = 'copied';
    row.appendChild(dot);
    row.appendChild(label);
    row.appendChild(badge);

    // Click row: copy hex to clipboard
    row.addEventListener('click', () => {
      navigator.clipboard.writeText(hex).then(() => {
        row.classList.add('copied');
        setTimeout(() => row.classList.remove('copied'), 600);
      });
    });

    container.appendChild(row);
  });
}

/* -- Backwards compat alias -- */
export function renderSwatches(colors) { renderColorDots(colors); }

/* -- Render tag pills in panel -- */
export function renderPanelTags(tags) {
  const container = document.getElementById('tags-container');
  container.innerHTML = '';
  tags.forEach(tag => {
    const pill = document.createElement('button');
    pill.className = 'tag';
    pill.textContent = tag;
    pill.addEventListener('click', () => {
      document.getElementById('search-input').value = tag;
      runSearch(tag);
    });
    container.appendChild(pill);
  });
}

/* -- Render related explore links -- */
export async function renderRelated(tags) {
  const container = document.getElementById('related-container');
  container.innerHTML = '<span class="loading-indicator" style="animation:none;opacity:0.5;">' + tr('loading') + '</span>';

  const topTags = tags.slice(0, 3);
  const results = await Promise.allSettled(topTags.map(t => getRelated(t)));
  const allWords = results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .filter(w => !tags.includes(w));
  const unique = [...new Set(allWords)].slice(0, 8);

  container.innerHTML = '';
  if (!unique.length) {
    container.innerHTML = '<span style="font-family:var(--font-ui);font-size:10px;color:var(--ink-3);">—</span>';
    return;
  }
  unique.forEach(word => {
    const link = document.createElement('div');
    link.className = 'related-link';
    link.textContent = `explore ${word}`;
    link.addEventListener('click', () => {
      document.getElementById('search-input').value = word;
      runSearch(word);
    });
    container.appendChild(link);
  });
}

/* -- Render source info block -- */
/* ── JSON-LD structured data injection ─────────────────────────────────────
   Injects an ImageObject / VisualArtwork schema when a panel item is selected.
   Removes the previous script tag first. Helps with rich results and SEO.
*/
const _JSONLD_ID = 'inspo-item-jsonld';
export function injectItemJsonLd(item) {
  const old = document.getElementById(_JSONLD_ID);
  if (old) old.remove();
  if (!item) return;

  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const schema = {
    '@context': 'https://schema.org',
    '@type': item.artist || item.year ? 'VisualArtwork' : 'ImageObject',
    name: item.title || '',
    image: item.fullUrl || item.url || item.thumb || '',
    url: item.sourceUrl || '',
    description: item.description || '',
  };
  if (item.artist) schema.creator = { '@type': 'Person', name: item.artist };
  if (item.year)   schema.dateCreated = String(item.year);
  if (item.source) schema.provider = { '@type': 'Organization', name: getSourceName(item.source) };
  if (item.license || item.rights) schema.license = item.license || item.rights;

  const script = document.createElement('script');
  script.id = _JSONLD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function renderSourceInfo(items) {
  const el = document.getElementById('source-info');
  if (!items.length) { el.innerHTML = ''; injectItemJsonLd(null); return; }

  // Show info for the most recently selected item
  const item = items[items.length - 1];
  const sourceLabel = getSourceName(item.source);
  el.innerHTML = '';

  // Inject JSON-LD structured data for SEO / rich results
  injectItemJsonLd(item);

  const title = document.createElement('div');
  title.style.cssText = 'margin-bottom:6px;color:var(--ink);font-weight:400;';
  title.textContent = item.title || '—';

  const sourceLine = document.createElement('div');
  sourceLine.appendChild(createSourceIdentity(item.source, sourceLabel));
  if (item.year) {
    const year = document.createElement('span');
    year.textContent = ' · ' + item.year;
    sourceLine.appendChild(year);
  }

  el.appendChild(title);
  el.appendChild(sourceLine);

  // Europeana dual attribution: show data provider(s) + "via Europeana" line
  const isEuro = item.source === 'europeana' || item.source?.startsWith('euro_');
  const providers = Array.isArray(item.dataProvider) ? item.dataProvider : (item.dataProvider ? [item.dataProvider] : []);
  if (isEuro && providers.length) {
    const euroLine = document.createElement('div');
    euroLine.style.cssText = 'margin-top:3px;font-size:0.82em;color:var(--ink-soft);display:flex;align-items:center;gap:4px;flex-wrap:wrap;';
    const provSpan = document.createElement('span');
    provSpan.textContent = providers.join(' · ');
    provSpan.style.fontWeight = '500';
    const viaSpan = document.createElement('span');
    viaSpan.style.cssText = 'display:inline-flex;align-items:center;gap:3px;';
    viaSpan.innerHTML = ' · ' + tr('viaEuropeana') + ' <img src="https://www.europeana.eu/favicon.ico" alt="Europeana" style="width:14px;height:14px;vertical-align:middle;border-radius:2px;"> ';
    const euroLink = document.createElement('a');
    euroLink.href = 'https://www.europeana.eu';
    euroLink.target = '_blank';
    euroLink.rel = 'noopener noreferrer';
    euroLink.textContent = 'Europeana';
    euroLink.style.cssText = 'color:#0A72CC;border-bottom:1px solid rgba(10,114,204,0.3);';
    viaSpan.appendChild(euroLink);
    euroLine.appendChild(provSpan);
    euroLine.appendChild(viaSpan);
    el.appendChild(euroLine);
  }

  if (item.sourceUrl) {
    const linkWrap = document.createElement('div');
    linkWrap.style.marginTop = '4px';
    const link = document.createElement('a');
    link.href = item.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'color:var(--accent);border-bottom:1px solid var(--line-strong);';
    link.textContent = isEuro ? tr('viewOnEuropeana') + ' ↗' : 'view original ↗';
    linkWrap.appendChild(link);
    el.appendChild(linkWrap);
  }
}

/* -- Full panel update -- */
export async function updatePanel(previewItem) {
  const panel = document.getElementById('panel');
  const emptyHint = document.getElementById('panel-empty-hint');
  const colorsSection = document.getElementById('panel-colors');
  const tagsSection = document.getElementById('panel-tags');
  const relatedSection = document.getElementById('panel-related');
  const sourceSection = document.getElementById('panel-source');
  const aiSection = document.getElementById('panel-ai-tags');
  const analyseSection = document.getElementById('analyse-section');

  // Items to display: preview item if provided, else full selection
  const displayItems = previewItem ? [previewItem] : STATE.selected;

  // Reposition sketch overlay after panel transition completes
  if (_fabricCanvas) setTimeout(positionFabricOverlay, 420);

  if (!displayItems.length) {
    panel.classList.add('open');
    if (emptyHint) emptyHint.style.display = 'block';
    colorsSection.style.display = 'none';
    tagsSection.style.display = 'none';
    relatedSection.style.display = 'none';
    sourceSection.style.display = 'none';
    aiSection.style.display = 'none';
    analyseSection.style.display = 'none';
    document.getElementById('no-key-note').textContent = '';
    return;
  }

  panel.classList.add('open');
  if (emptyHint) emptyHint.style.display = 'none';
  sourceSection.style.display = '';

  // Aggregate colors from display items (deduplicated)
  const allColors = [];
  displayItems.forEach(item => {
    (item.colors || []).forEach(c => {
      if (!allColors.includes(c)) allColors.push(c);
    });
  });
  if (allColors.length) {
    colorsSection.style.display = '';
    renderSwatches(allColors.slice(0, 10));
  } else {
    colorsSection.style.display = 'none';
  }

  // Merge & deduplicate tags from display items
  const allTags = [...new Set(displayItems.flatMap(i => i.tags || []))];
  if (allTags.length) {
    tagsSection.style.display = '';
    relatedSection.style.display = '';
    renderPanelTags(allTags.slice(0, 16));
    renderRelated(allTags);
  } else {
    tagsSection.style.display = 'none';
    relatedSection.style.display = 'none';
  }

  // Source info
  renderSourceInfo(displayItems);

  // AI key note
  const noKeyNote = document.getElementById('no-key-note');
  const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  noKeyNote.textContent = hasAiKey ? '' : 'no key — add an ai key for vision';

  updateAnalyseButton(displayItems[displayItems.length - 1]);

  showQuietTip('panel-colors', 'palette appears here as you select references', 'inspo_tip_palette');
}

/* -- toggleSelection — shared by click handler + floating bar -- */
export function toggleSelection(item) {
  const idx = STATE.selected.findIndex(s => s.id === item.id);
  const card = document.getElementById('card-' + item.id);
  if (idx === -1) {
    STATE.selected.push(item);
    card?.classList.add('selected');
    // Extract colors asynchronously to avoid main-thread jank
    const img = card?.querySelector('img');
    if (img && img.complete && img.naturalWidth > 1) {
      getDominantColorsAsync(img).then(colors => {
        item.colors = colors;
        // Re-render swatches if this item is still selected
        if (STATE.selected.includes(item)) {
          const allColors = [...new Set(STATE.selected.flatMap(i => i.colors || []))];
          if (allColors.length) {
            document.getElementById('panel-colors').style.display = '';
            renderSwatches(allColors.slice(0, 10));
          }
        }
      });
    }
  } else {
    STATE.selected.splice(idx, 1);
    card?.classList.remove('selected');
  }
  updateFloatingBar();
}

/* -- Panel close button -- */
document.getElementById('panel-close')?.addEventListener('click', () => {
  // Deselect all
  STATE.selected = [];
  document.querySelectorAll('.image-card.selected').forEach(c => c.classList.remove('selected'));
  updateFloatingBar();
  hideFloatingBar();
  document.getElementById('panel').classList.remove('open');
  // Reposition sketch overlay after panel closes
  if (_fabricCanvas) setTimeout(positionFabricOverlay, 420);
});

document.getElementById('analyse-btn')?.addEventListener('click', () => {
  runGeminiOnSelected();
});

/* -- Escape key: clear all selections -- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    STATE.selected = [];
    document.querySelectorAll('.image-card.selected')
      .forEach(c => c.classList.remove('selected'));
    updateFloatingBar();
    hideFloatingBar();
  }
});

/* -- Arrow key navigation within image grid -- */
document.getElementById('image-grid')?.addEventListener('keydown', (e) => {
  if (!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)) return;
  const cards = [...document.querySelectorAll('.image-card')];
  if (!cards.length) return;
  const idx = cards.indexOf(document.activeElement);
  if (idx === -1) return;
  e.preventDefault();
  // Estimate columns from grid layout
  const gridEl = document.getElementById('image-grid');
  const cols = Math.round(gridEl.clientWidth / cards[0].offsetWidth) || 1;
  let next = idx;
  if (e.key === 'ArrowRight') next = Math.min(idx + 1, cards.length - 1);
  if (e.key === 'ArrowLeft')  next = Math.max(idx - 1, 0);
  if (e.key === 'ArrowDown')  next = Math.min(idx + cols, cards.length - 1);
  if (e.key === 'ArrowUp')    next = Math.max(idx - cols, 0);
  cards[next].focus();
});

/* ============================================================
   PHASE 14 — FLOATING BAR + CROSS-REFERENCE
============================================================ */

/* -- scoreTerms: frequency-score metadata terms across selected images -- */
export function scoreTerms(selectedItems) {
  const scores = {};

  selectedItems.forEach(item => {
    // Tags get double weight
    (item.tags || []).forEach(tag => {
      if (tag.length < 3 || STOPWORDS.has(tag)) return;
      scores[tag] = (scores[tag] || 0) + 2;
    });

    // Title + description words get single weight
    const words = (item.title + ' ' + (item.description || ''))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));

    const wordSet = new Set(words);
    wordSet.forEach(word => {
      if (!(item.tags || []).includes(word)) {
        scores[word] = (scores[word] || 0) + 1;
      }
    });
  });

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term]) => term);
}

/* -- runConnect: metadata-based cross-reference search -- */
export async function runConnect() {
  if (STATE.selected.length < 2) return;

  const connectBtn = document.getElementById('connect-btn');
  connectBtn.textContent = 'connecting...';

  const terms = scoreTerms(STATE.selected);

  STATE.crossRefMode = 'connect';
  STATE.crossRefTerms = terms;
  STATE.referenceImages = [...STATE.selected];

  await crossRefSearch(terms, 'connect');

  connectBtn.textContent = STATE.crossRefMode === 'connect' ? 'reconnect' : 'connect';
}

/* -- runInterpret: AI conceptual analysis (routes to active provider) -- */
export async function runInterpret() {
  if (STATE.selected.length < 2) return;
  // Require at least one AI key
  const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  if (!hasKey) return;

  // Gemini daily limit check
  if ((STATE.aiProvider || 'gemini') === 'gemini' && STATE.geminiDailyCount >= 1500) {
    console.warn('[ai] daily limit reached');
    return;
  }

  // Rate limiting
  const elapsed = Date.now() - (STATE.lastGeminiCall || 0);
  if (elapsed < 2000) await sleep(2000 - elapsed);
  STATE.lastGeminiCall = Date.now();

  const interpretBtn = document.getElementById('interpret-btn');
  const originalHTML = interpretBtn.innerHTML;
  interpretBtn.innerHTML = '<span>interpreting...</span>';

  try {
    const descriptions = STATE.selected.map((item, i) =>
      `Image ${i+1}: "${item.title}"${item.description ? ' \u2014 ' + item.description : ''}` +
      `${item.tags?.length ? '. Tags: ' + item.tags.slice(0,8).join(', ') : ''}` +
      `${item.year ? '. Year: ' + item.year : ''}`
    ).join('\n');

    const prompt = `You are a visual research assistant for artists and graphic designers. Given these ${STATE.selected.length} image descriptions, identify the 8 most interesting conceptual themes, moods, or visual territories they collectively point toward. Think beyond the obvious \u2014 consider anachronism, cultural tension, material contrasts, historical echoes, cinematic references, art movements, emotional textures. Return ONLY a valid JSON array of 8 short search terms (2-4 words max each). No explanation, no markdown, no other text.\n\nImages:\n${descriptions}`;

    const text = await callAI(prompt);

    let terms;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      terms = JSON.parse(clean);
      if (!Array.isArray(terms)) throw new Error('not array');
      terms = terms.filter(t => typeof t === 'string').slice(0, 8);
    } catch(e) {
      console.warn('Interpret parse failed, falling back to connect');
      terms = scoreTerms(STATE.selected);
    }

    STATE.crossRefMode = 'interpret';
    STATE.crossRefTerms = terms;
    STATE.referenceImages = [...STATE.selected];

    if ((STATE.aiProvider || 'gemini') === 'gemini') incrementGeminiCounter();
    await crossRefSearch(terms, 'interpret');

  } catch(e) {
    console.warn('Interpret failed:', e.message);
    STATE.crossRefMode = 'connect';
    STATE.crossRefTerms = scoreTerms(STATE.selected);
    await crossRefSearch(STATE.crossRefTerms, 'connect');
  } finally {
    interpretBtn.innerHTML = originalHTML;
  }
}

/* -- crossRefSearch: run term set as parallel searches -- */
export async function crossRefSearch(terms, mode) {
  if (!terms || terms.length === 0) return;

  // Abort any current search
  if (STATE.abortController) STATE.abortController.abort();
  STATE.abortController = new AbortController();

  // Show reference strip + concept pills
  showReferenceStrip(STATE.referenceImages);
  showConceptPills(terms, mode);

  // Clear grid and start loading
  clearGrid();
  showLoading('cross-referencing...');

  // Run all terms as parallel searches
  const perTerm = Math.ceil(STATE.imageCount / terms.length);
  STATE.results = [];

  const searchPromises = terms.map(term =>
    fetchAll([term], perTerm, true).catch(() => [])
  );

  const settled = await Promise.allSettled(searchPromises);
  const sourceAllSkipped = sourceCallCount === 0;
  // Collect results from each per-term fetchAll into STATE.results
  settled.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) {
      const existingIds = new Set(STATE.results.map(x => x.id));
      const novel = r.value.filter(item => !existingIds.has(item.id));
      STATE.results.push(...novel);
    }
  });

  hideLoading();

  if (STATE.results.length === 0) {
    showEmptyState();
  }
}

/* -- showReferenceStrip / hideReferenceStrip -- */
export function showReferenceStrip(images) {
  const strip = document.getElementById('reference-strip');
  const thumbsContainer = document.getElementById('reference-thumbs');
  thumbsContainer.innerHTML = '';

  images.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:60px;height:60px;flex-shrink:0;';

    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = [item.title, item.artist].filter(Boolean).join(' — ') || 'reference image';
    img.style.cssText = 'width:60px;height:60px;object-fit:cover;display:block;';
    img.title = item.title;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.cssText = `
      position:absolute;top:2px;right:2px;
      width:16px;height:16px;
      background:var(--bg-panel);border:1px solid var(--line);
      color:var(--ink);font-size:10px;
      cursor:pointer;display:none;
      align-items:center;justify-content:center;
      padding:0;line-height:1;
    `;

    wrapper.addEventListener('mouseenter', () => { removeBtn.style.display = 'flex'; });
    wrapper.addEventListener('mouseleave', () => { removeBtn.style.display = 'none'; });

    removeBtn.addEventListener('click', () => {
      STATE.referenceImages = STATE.referenceImages.filter(r => r.id !== item.id);
      STATE.selected = STATE.selected.filter(s => s.id !== item.id);
      document.getElementById('card-' + item.id)?.classList.remove('selected');

      if (STATE.referenceImages.length < 2) {
        hideReferenceStrip();
        hideConceptPills();
        STATE.crossRefMode = null;
        updateFloatingBar();
        return;
      }
      // Re-run analysis with updated references
      if (STATE.crossRefMode === 'interpret' && STATE.geminiKey) {
        runInterpret();
      } else {
        runConnect();
      }
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    thumbsContainer.appendChild(wrapper);
  });

  strip.style.display = 'flex';
}

export function hideReferenceStrip() {
  document.getElementById('reference-strip').style.display = 'none';
}

/* -- showConceptPills / hideConceptPills -- */
export function showConceptPills(terms, mode) {
  const container = document.getElementById('concept-pills');
  const modeLabel = document.getElementById('pills-mode-label');

  // Clear existing pills (keep mode label)
  container.querySelectorAll('.concept-pill').forEach(p => p.remove());
  // Also remove dynamic controls (add btn, refresh, escalate)
  container.querySelectorAll('.pill-control').forEach(p => p.remove());

  modeLabel.textContent = mode === 'interpret' ? 'interpreted' : 'connected';

  terms.forEach(term => {
    const pill = document.createElement('span');
    pill.className = 'concept-pill tag pill-item';
    pill.style.cssText = 'display:inline-flex;align-items:center;gap:4px;cursor:pointer;';

    const prefix = document.createElement('span');
    prefix.style.color = 'var(--accent)';
    prefix.textContent = mode === 'interpret' ? '\u2726' : '\u25cb';

    const label = document.createElement('span');
    label.textContent = term;

    const removeSpan = document.createElement('span');
    removeSpan.textContent = '\u00d7';
    removeSpan.style.cssText = 'opacity:0.4;font-size:10px;margin-left:2px;';
    removeSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      STATE.crossRefTerms = STATE.crossRefTerms.filter(t => t !== term);
      pill.remove();
      if (STATE.crossRefTerms.length > 0) {
        crossRefSearch(STATE.crossRefTerms, mode);
      }
    });

    pill.appendChild(prefix);
    pill.appendChild(label);
    pill.appendChild(removeSpan);

    // Click pill = single-term search
    pill.addEventListener('click', () => runSearch(term));
    container.appendChild(pill);
  });

  // "+" button to add custom term
  const addBtn = document.createElement('button');
  addBtn.className = 'btn pill-control';
  addBtn.style.cssText = 'width:auto;padding:3px 8px;font-size:9px;display:inline-flex;align-items:center;';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'add term';
    input.className = 'search-input';
    input.style.cssText = 'width:100px;font-size:10px;display:inline-block;margin:0;';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const newTerm = input.value.trim().toLowerCase();
        STATE.crossRefTerms.push(newTerm);
        input.replaceWith(addBtn);
        showConceptPills(STATE.crossRefTerms, mode);
        crossRefSearch(STATE.crossRefTerms, mode);
      }
      if (e.key === 'Escape') input.replaceWith(addBtn);
    });
    addBtn.replaceWith(input);
    input.focus();
  });
  container.appendChild(addBtn);

  // ↻ refresh button
  const refreshBtn = document.createElement('span');
  refreshBtn.className = 'pill-control';
  refreshBtn.style.cssText = `
    font-family:var(--font-ui);font-size:9px;color:var(--accent);
    cursor:pointer;padding:0 8px;letter-spacing:0.06em;
    transition:opacity 0.3s ease;
  `;
  refreshBtn.textContent = '\u21bb refresh';
  refreshBtn.addEventListener('click', () => {
    if (mode === 'interpret' && STATE.geminiKey) runInterpret();
    else runConnect();
  });
  container.appendChild(refreshBtn);

  // ✦ interpret escalation button (only in connect mode with gemini key)
  if (mode === 'connect' && STATE.geminiKey) {
    const escalateBtn = document.createElement('span');
    escalateBtn.className = 'pill-control';
    escalateBtn.style.cssText = `
      font-family:var(--font-ui);font-size:9px;color:var(--ink-3);
      cursor:pointer;padding:0 8px;letter-spacing:0.06em;
      transition:opacity 0.3s ease;
      border-left:1px solid var(--line);
    `;
    escalateBtn.innerHTML = '\u2726 interpret';
    escalateBtn.addEventListener('click', runInterpret);
    container.appendChild(escalateBtn);
  }

  container.style.display = 'flex';
}

export function hideConceptPills() {
  document.getElementById('concept-pills').style.display = 'none';
}

export function updateFloatingBar() {
  const bar            = document.getElementById('floating-bar');
  const thumbsContainer = document.getElementById('bar-thumbs');
  const countEl        = document.getElementById('bar-count');
  const interpretBtn   = document.getElementById('interpret-btn');
  const canvas         = document.getElementById('canvas');

  if (STATE.selected.length < 2) {
    bar.classList.remove('visible');
    bar.classList.remove('bar-hidden');
    canvas.classList.remove('bar-active');
    STATE.floatingBarVisible = false;
    STATE.floatingBarHidden = false;
    // Hide sidebar toggle when no selections
    document.getElementById('bar-toggle-section').style.display = 'none';
    return;
  }

  // Update thumbnails (max 5 shown)
  thumbsContainer.innerHTML = '';
  STATE.selected.slice(0, 5).forEach(item => {
    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = [item.title, item.artist].filter(Boolean).join(' — ') || 'selected image';
    img.className = 'bar-thumb';
    img.title = item.title;
    img.addEventListener('click', () => toggleSelection(item));
    thumbsContainer.appendChild(img);
  });
  if (STATE.selected.length > 5) {
    const more = document.createElement('span');
    more.style.cssText = `
      font-size: 9px;
      color: var(--ink-3);
      font-family: var(--font-ui);
      padding: 0 4px;
    `;
    more.textContent = `+${STATE.selected.length - 5}`;
    thumbsContainer.appendChild(more);
  }

  // Update count
  countEl.textContent = `${STATE.selected.length} selected`;

  // Interpret button state
  const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  if (!hasAiKey) {
    interpretBtn.classList.add('disabled');
  } else {
    interpretBtn.classList.remove('disabled');
  }

  // Respect user's hide intent — don't auto-show if they dismissed the bar
  if (STATE.floatingBarHidden) {
    document.getElementById('bar-toggle-section').style.display = '';
    return;
  }

  // Show bar
  bar.classList.remove('bar-hidden');
  bar.classList.add('visible');
  canvas.classList.add('bar-active');
  STATE.floatingBarVisible = true;
  showQuietTip('connect-btn', 'connect maps shared concepts across selected images', 'inspo_tip_connect');
}

export function hideFloatingBar() {
  document.getElementById('floating-bar')?.classList.remove('visible');
  document.getElementById('canvas')?.classList.remove('bar-active');
  STATE.floatingBarVisible = false;
}

document.getElementById('connect-btn')?.addEventListener('click', () => {
  if (STATE.selected.length < 2) return;
  runConnect();
});

document.getElementById('interpret-btn')?.addEventListener('click', () => {
  if (STATE.selected.length < 2) return;
  if (!(STATE.geminiKey || STATE.claudeKey || STATE.openaiKey)) return;
  runInterpret();
});

/* -- Clear All: clear selections and hide bar -- */
document.getElementById('bar-clear-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  // Remove visual selection from cards
  document.querySelectorAll('.image-card.selected')
    .forEach(c => c.classList.remove('selected'));
  // Clear state
  STATE.selected = [];
  STATE.crossRefMode = null;
  STATE.crossRefTerms = [];
  STATE.referenceImages = [];
  // Clear UI
  hideReferenceStrip();
  hideConceptPills();
  document.getElementById('bar-thumbs').innerHTML = '';
  document.getElementById('bar-count').textContent = '';
  // Close panel
  document.getElementById('panel').classList.remove('open');
  // Hide bar reliably (display:none, same as close button)
  const bar = document.getElementById('floating-bar');
  bar.classList.add('bar-hidden');
  bar.classList.remove('visible');
  bar.classList.remove('bar-positioned');
  bar.style.removeProperty('left');
  bar.style.removeProperty('top');
  bar.style.removeProperty('bottom');
  document.getElementById('canvas').classList.remove('bar-active');
  STATE.floatingBarVisible = false;
  STATE.floatingBarHidden = false;
  document.getElementById('bar-toggle-section').style.display = 'none';
  // Persist empty board so selections don't restore on reload
  if (typeof persistBoardState === 'function') persistBoardState();
});

/* -- Close button: hide bar entirely -- */
document.getElementById('bar-close-btn')?.addEventListener('click', () => {
  const bar = document.getElementById('floating-bar');
  bar.classList.add('bar-hidden');
  bar.classList.remove('visible');
  document.getElementById('canvas').classList.remove('bar-active');
  STATE.floatingBarVisible = false;
  STATE.floatingBarHidden = true;
  document.getElementById('bar-toggle-section').style.display = '';
});

/* -- Sidebar toggle: bring back floating bar -- */
document.getElementById('btn-bar-toggle')?.addEventListener('click', () => {
  STATE.floatingBarHidden = false;
  const bar = document.getElementById('floating-bar');
  bar.classList.remove('bar-hidden');
  document.getElementById('bar-toggle-section').style.display = 'none';
  updateFloatingBar();
});

/* -- Draggable floating bar -- */
(function initBarDrag() {
  const bar = document.getElementById('floating-bar');
  let dragging = false, startX, startY, barX, barY;

  bar.addEventListener('pointerdown', e => {
    // Don't start drag on buttons or interactive elements
    if (e.target.closest('button, input, a, .bar-thumb')) return;
    dragging = true;
    bar.classList.add('dragging');
    bar.setPointerCapture(e.pointerId);
    const rect = bar.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    barX = rect.left;
    barY = rect.top;
    e.preventDefault();
  });

  bar.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = Math.max(0, Math.min(window.innerWidth - bar.offsetWidth, barX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - bar.offsetHeight, barY + dy));
    bar.style.left = newX + 'px';
    bar.style.top = newY + 'px';
    bar.style.bottom = 'auto';
    bar.classList.add('bar-positioned');
  });

  bar.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('dragging');
    bar.releasePointerCapture(e.pointerId);
  });
})();

document.getElementById('strip-clear-btn')?.addEventListener('click', () => {
  // Instantly hide bar
  const bar = document.getElementById('floating-bar');
  bar.classList.add('bar-hidden');
  bar.classList.remove('visible');
  document.getElementById('canvas').classList.remove('bar-active');
  STATE.floatingBarVisible = false;
  STATE.floatingBarHidden = false;
  STATE.selected = [];
  STATE.crossRefMode = null;
  STATE.crossRefTerms = [];
  STATE.referenceImages = [];
  document.querySelectorAll('.image-card.selected')
    .forEach(c => c.classList.remove('selected'));
  document.getElementById('bar-toggle-section').style.display = 'none';
  hideReferenceStrip();
  hideConceptPills();
  clearGrid();
  showEmptyState();
});

/* ============================================================
   FUSE.JS LOCAL FILTER
============================================================ */
export function buildFuseIndex() {
  if (!window.Fuse || !STATE.results.length) {
    STATE.fuseIndex = null;
    return;
  }
  // Cap at 2000 to keep the index fast on large result sets
  const items = STATE.results.length > 2000 ? STATE.results.slice(0, 2000) : STATE.results;
  STATE.fuseIndex = new Fuse(items, {
    keys: ['title', 'tags', 'source', 'description'],
    threshold: 0.35,
    ignoreLocation: true,
  });
  // Show filter input when we have results
  document.getElementById('local-filter-section').style.display = '';
  document.getElementById('local-filter').value = '';
}

export let _fuseFilterTimer = null;
document.getElementById('local-filter')?.addEventListener('input', (e) => {
  clearTimeout(_fuseFilterTimer);
  _fuseFilterTimer = setTimeout(() => {
    const val = e.target.value.trim();
    clearGrid();
    if (!val) {
      // Restore full results
      const visible = getDisplayResults(STATE.results, STATE.query);
      if (visible.length) renderGrid(visible);
      else showEmptyState();
      return;
    }
    if (!STATE.fuseIndex) {
      // Try building the index if Fuse is loaded now
      if (window.Fuse) buildFuseIndex();
      if (!STATE.fuseIndex) return;
    }
    const matches = STATE.fuseIndex.search(val).map(r => r.item);
    if (matches.length) renderGrid(matches.slice(0, STATE.imageCount));
    else showEmptyState();
  }, 200);
});

/* ============================================================
   14. KEYWORD PILLS RENDER
============================================================ */
export function renderKeywordPills(keywords) {
  const container = document.getElementById('keyword-pills');
  container.innerHTML = '';
  keywords.forEach(kw => {
    const pill = document.createElement('button');
    pill.className = 'tag';
    pill.textContent = kw + ' ';
    const xSpan = document.createElement('span');
    xSpan.style.cssText = 'color:var(--ink-3);font-size:9px;';
    xSpan.textContent = '×';
    pill.appendChild(xSpan);
    pill.addEventListener('click', () => {
      STATE.keywords = STATE.keywords.filter(k => k !== kw);
      renderKeywordPills(STATE.keywords);
      // Re-run search with remaining keywords if any
      if (STATE.keywords.length > 0 && STATE.results.length > 0) {
        const final = shuffle(interleave(
          // slice cached results; no re-fetch on pill removal
          [STATE.results.filter(r => r.source === 'met')]
        )).slice(0, STATE.imageCount);
        renderGrid(final);
      }
    });
    container.appendChild(pill);
  });
}

/* ============================================================
   14b. CACHE INDICATOR
============================================================ */
export function showCacheIndicator(query) {
  const age = getCacheAge(query);
  if (age === null) return;
  document.getElementById('cache-age-text').textContent = 'cached · ' + formatCacheAge(age);
  document.getElementById('cache-indicator').style.display = 'flex';
}

export function updateCacheIndicator(query) {
  const el = document.getElementById('cache-indicator');
  if (el.style.display === 'none') return;
  const age = getCacheAge(query);
  if (age !== null) {
    document.getElementById('cache-age-text').textContent = 'cached · ' + formatCacheAge(age);
  }
}

export function hideCacheIndicator() {
  document.getElementById('cache-indicator').style.display = 'none';
}

export function setSearchMode(mode, persist = true) {
  const next = mode === 'exact' ? 'exact' : 'explore';
  STATE.searchMode = next;
  const btn = document.getElementById('btn-search-mode');
  if (btn) {
    btn.textContent = next;
    btn.classList.toggle('exact', next === 'exact');
  }
  if (persist) localStorage.setItem('inspo_search_mode', next);

  if (STATE.results.length) {
    clearGrid();
    const visible = getDisplayResults(STATE.results, STATE.query);
    renderGrid(visible);
    if (!visible.length) showEmptyState();
  }
}

/* ============================================================
   15. SEARCH ORCHESTRATION
============================================================ */

export async function refreshSource(sourceName) {
  if (!STATE.query) return;
  const ac = new AbortController();
  _secondaryControllers.add(ac);
  const { signal } = ac;
  const kw = STATE.keywords[0] || STATE.query;
  const lim = STATE.imageCount;
  const fetchMap = {
    met:          () => fetchMet(kw, lim, signal),
    nasa:         () => fetchNASA(kw, lim, signal),
    apod:         () => fetchAPOD(kw, lim, signal),
    rijksmuseum:  () => fetchRijksmuseum(kw, lim, signal),
    europeana:    () => fetchEuropeana(kw, lim, signal),
    harvard:      () => fetchHarvard(kw, lim, signal),
    smithsonian:  () => fetchSmithsonian(kw, lim, signal),
    pexels:       () => fetchPexels(kw, lim, signal),
    inaturalist:  () => fetchINaturalist(kw, lim, signal),
    chicago:      () => fetchChicagoArt(kw, lim, signal),
    cleveland:    () => fetchCleveland(kw, lim, signal),
    va:           () => fetchVA(kw, lim, signal),
    flickr:       () => fetchFlickrCommons(kw, lim, signal),
    pixabay:      () => fetchPixabay(kw, lim, signal),
    wikiart:      () => fetchWikiArt(kw, lim, signal),
    nordic:       () => fetchNordicMuseum(kw, lim, signal),
    getty:        () => fetchGetty(kw, lim, signal),
    nga:          () => fetchNGA(kw, lim, signal),
    gbif:         () => fetchGBIF(kw, lim, signal),
    eol:          () => fetchEOL(kw, lim, signal),
    gallica:      () => fetchGallica(kw, lim, signal),
    chronicling:  () => fetchChroniclingAmerica(kw, lim, signal),
    trove:        () => fetchTrove(kw, lim, signal),
    digitalnz:    () => fetchDigitalNZ(kw, lim, signal),
    bhl:          () => fetchBHL(kw, lim, signal),
    carnegie:     () => fetchCarnegie(kw, lim, signal),
    prado:        () => fetchPrado(kw, lim, signal),
    parismusees:  () => fetchParisMusees(kw, lim, signal),
    yale:         () => fetchYale(kw, lim, signal),
    picsum:       () => fetchPicsum(kw, lim, signal),
    usgs:         () => fetchUSGS(kw, lim, signal),
    cooperhewitt: () => fetchCooperHewitt(kw, lim, signal),
    tate:         () => fetchTate(kw, lim, signal),
    finna:        () => fetchFinna(kw, lim, signal),
    soch:         () => fetchSOCH(kw, lim, signal),
    joconde:      () => fetchJoconde(kw, lim, signal),
    mnw:          () => fetchMNW(kw, lim, signal),
    tepapa:       () => fetchTePapa(kw, lim, signal),
    dpla:         () => fetchDPLA(kw, lim, signal),
    artsy:        () => fetchArtsy(kw, lim, signal),
    pas:          () => fetchPAS(kw, lim, signal),
    smg:          () => fetchSMG(kw, lim, signal),
    auckland:     () => fetchAuckland(kw, lim, signal),
    photogrammar: () => fetchPhotogrammar(kw, lim, signal),
    wellcome:     () => fetchWellcome(kw, lim, signal),
    maas:         () => fetchMAAS(kw, lim, signal),
    smk:          () => fetchSMK(kw, lim, signal),
    thyssen:      () => fetchThyssen(kw, lim, signal),
    // Phase A sub-collections
    ...Object.fromEntries([
      ...Object.entries(EUROPEANA_PROVIDERS).map(([id, cfg]) => [id, () => fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, kw, lim, signal, cfg.extra || '')]),
      ...Object.entries(DPLA_HUBS).map(([id, cfg]) => [id, () => fetchDPLAProvider(cfg.provider, kw, lim, signal)]),
      ...Object.entries(SI_UNITS).map(([id, cfg]) => [id, () => fetchSmithsonianUnit(cfg.code, kw, lim, signal)]),
    ]),
    // Phase B
    idigbio:     () => fetchIDigBio(kw, lim, signal),
    ala:         () => fetchALA(kw, lim, signal),
    // Phase D
    nasa_images: () => fetchNASAImages(kw, lim, signal),
  };
  const fetcher = fetchMap[sourceName];
  if (!fetcher) { _secondaryControllers.delete(ac); return; }
  try {
    const fresh = await fetcher().catch(() => []);
    if (!fresh.length) return;
    const existingIds = new Set(STATE.results.map(r => r.id));
    const novel = fresh.filter(r => !existingIds.has(r.id));
    if (novel.length > 0 && STATE.results.length < CONSTANTS.MAX_RESULTS) {
      const room = CONSTANTS.MAX_RESULTS - STATE.results.length;
      const batch = novel.slice(0, room);
      STATE.results.push(...batch);
      renderGrid(getDisplayResults(batch, STATE.query));
    }
  } finally {
    _secondaryControllers.delete(ac);
  }
}

export function onSourceResultGlobal(items) {
  if (!items.length) return;
  if (STATE.results.length >= CONSTANTS.MAX_RESULTS) return;
  const room = CONSTANTS.MAX_RESULTS - STATE.results.length;
  const batch = items.slice(0, room);
  STATE.results.push(...batch);
  renderGrid(batch);
}

export async function fetchMoreResults() {
  if (STATE.loading || !STATE.query) return;
  if (STATE.results.length >= CONSTANTS.MAX_RESULTS) {
    const btn = document.getElementById('btn-load-more');
    if (btn) btn.textContent = 'all results loaded';
    return;
  }
  const startQuery = STATE.query;
  STATE.loading = true;
  const btn = document.getElementById('btn-load-more');
  if (btn) btn.textContent = 'loading…';
  STATE.currentPage++;
  const page      = STATE.currentPage;
  const kw        = STATE.keywords[0] || STATE.query;

  // Smart pagination: prefer sources that returned results on earlier pages
  const previousHits = new Set(STATE.results.map(r => r.source).filter(Boolean));
  const healthy = ALL_SOURCES.filter(id => !STATE.disabledSources.has(id) && isSourceHealthy(id));
  const dyn     = selectDynamicSources(kw, 60).map(s => s.id || s);
  const allPool = [...new Set([...healthy, ...dyn])];
  // Prioritize sources that already returned results, then add others
  const productive = allPool.filter(id => previousHits.has(id));
  const rest = allPool.filter(id => !previousHits.has(id));
  // On page 2-3 try all; on page 4+ only paginate productive sources
  const union = page <= 3 ? [...productive, ...rest] : productive;
  if (!union.length) { STATE.loading = false; updateLoadMoreLabel(); return; }

  const PRODUCTIVE_SOURCE_ESTIMATE = Math.max(30, union.length);
  const perSource = Math.max(4, Math.ceil(STATE.imageCount / PRODUCTIVE_SOURCE_ESTIMATE));
  const offset    = (page - 1) * STATE.imageCount;
  const ac        = new AbortController();
  _secondaryControllers.add(ac);
  const signal    = ac.signal;
  // Fan out to selected sources
  const fetches = union.map(id => {
    const adapter = ADAPTERS[id];
    if (!adapter) return Promise.resolve([]);
    return callIfHealthy(id, adapter(kw, perSource, signal, offset).catch(() => []));
  });
  const settled = await Promise.allSettled(fetches);
  if (STATE.query !== startQuery) { STATE.loading = false; _secondaryControllers.delete(ac); updateLoadMoreLabel(); return; }
  let items = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  // Apply exact-mode word-boundary filter to load-more results
  if (STATE.searchMode === 'exact') {
    const lq = STATE.query.toLowerCase();
    items = items.filter(r => matchesAsWholeWord(`${r.title || ''} ${r.description || ''} ${r.artist || ''}`.toLowerCase(), lq));
  }
  // Quality gate: skip items with tiny thumbnails or empty metadata
  items = items.filter(r => {
    if (!r.thumbnail && !r.image) return false;
    const title = (r.title || '').trim();
    if (title.length < 2 && !(r.artist || '').trim()) return false;
    return true;
  });
  const existingIds = new Set(STATE.results.map(r => r.id));
  const novel = items.filter(r => !existingIds.has(r.id));
  if (novel.length > 0 && STATE.results.length < CONSTANTS.MAX_RESULTS) {
    const room = CONSTANTS.MAX_RESULTS - STATE.results.length;
    const batch = novel.slice(0, room);
    STATE.results.push(...batch);
    renderGrid(batch);
  }
  STATE.loading = false;
  _secondaryControllers.delete(ac);
  updateLoadMoreLabel();
}

export function updateLoadMoreLabel() {
  const btn = document.getElementById('btn-load-more');
  if (!btn) return;
  if (STATE.results.length >= CONSTANTS.MAX_RESULTS) {
    btn.textContent = 'all results loaded';
  } else {
    btn.textContent = `load more · ${STATE.results.length} shown`;
  }
}

export async function runSearch(query, forceRefresh = false) {
  if (!query.trim()) return;
  saveSearchHistory(query.trim());
  hideSearchHistory();
  // Abort any in-flight secondary fetches (refreshSource, fetchMoreResults)
  for (const ac of _secondaryControllers) { try { ac.abort(); } catch (_) {} }
  _secondaryControllers.clear();
  if (STATE.disabledSources.size >= ALL_SOURCES.length) {
    clearGrid();
    document.getElementById('image-grid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
        <p>all sources disabled — enable some in api keys</p>
        <span>click the key icon to manage sources</span>
      </div>`;
    return;
  }
  STATE.imageCount = parseInt(document.getElementById('count-slider')?.value) || CONSTANTS.IMAGE_COUNT_DEFAULT;
  STATE.query = query.trim();

  // Parse operators: -word, NOT word, "exact phrase"
  const { positive: _posQuery, negatives: _negTerms, phrases: _phrases } = parseNegativeTerms(STATE.query);
  // Use positive portion only for API calls; negatives/phrases filter results post-fetch
  const effectiveQuery = _posQuery || STATE.query;

  // Reset cross-ref mode on new text search
  if (STATE.crossRefMode) {
    STATE.crossRefMode = null;
    STATE.crossRefTerms = [];
    STATE.referenceImages = [];
    hideReferenceStrip();
    hideConceptPills();
    const cb = document.getElementById('connect-btn');
    if (cb) cb.textContent = 'connect';
    const ib = document.getElementById('interpret-btn');
    if (ib) ib.innerHTML = '<span>interpret</span><span style="color:var(--accent)">\u2726</span>';
  }

  STATE.loading = true;
  STATE.currentPage = 1;
  STATE._searchGen++;
  const gen = STATE._searchGen;
  STATE.results = [];          // immediately clear stale results (race-condition fix)
  STATE._failedImages = 0;     // reset failed image counter
  STATE.fuseIndex = null;      // reset Fuse index for fresh search
  clearTimeout(_fuseFilterTimer);
  document.getElementById('more-container').style.display = 'none';
  clearGrid();
  _resetLazyObserver();
  showLoading();

  // Start fetchAll immediately with the raw query — no wait for Datamuse
  // In exact mode always use the bare query, never prefetched expansions
  STATE.keywords = (STATE.searchMode !== 'exact' && STATE.prefetchedQuery === effectiveQuery && STATE.prefetchedKeywords.length)
    ? STATE.prefetchedKeywords
    : [effectiveQuery];
  renderKeywordPills(STATE.keywords);

  // Expand keywords in background; update pills when Datamuse returns
  // Skipped entirely in exact mode — keywords must stay as [effectiveQuery]
  if (STATE.searchMode !== 'exact' && STATE.keywords.length <= 1) {
    expandKeywords(effectiveQuery).then(kws => {
      STATE.keywords = kws;
      renderKeywordPills(kws);
    }).catch(() => {});
  }

  // Two-wave progressive render: flush at 80ms or 12+ items, full restore at 300ms
  const _rrg = renderGrid;
  let _buf = [];
  let _restored = false;
  const _flush = () => {
    if (_buf.length) { _rrg(_buf.splice(0)); }
  };
  const _fastTimer = setTimeout(_flush, 80);
  const _batchTimer = setTimeout(() => {
    clearTimeout(_fastTimer);
    _restored = true;
    renderGrid = _rrg;
    _flush();
  }, 300);
  const _restore = () => {
    clearTimeout(_fastTimer);
    clearTimeout(_batchTimer);
    _restored = true;
    renderGrid = _rrg;
    _flush();
  };
  renderGrid = items => {
    _buf.push(...items);
    if (!_restored && _buf.length >= 12) {
      clearTimeout(_fastTimer);
      _flush();
    }
  };

  // Check cache
  hideCacheIndicator();
  if (!forceRefresh) {
    const cached = cacheGet(STATE.query);
    if (cached) {
      _restore();
      STATE.results = cached.results;
      if (cached.keywords?.length) STATE.keywords = cached.keywords;
      renderGrid(getDisplayResults(STATE.results, STATE.query));
      STATE.loading = false;
      hideLoading();
      showCacheIndicator(STATE.query);
      document.getElementById('more-container').style.display = 'flex';
      // Build Fuse.js index for local filtering
      loadFuse(() => buildFuseIndex());
      // Background refresh — silently append any newly discovered items
      const bgQuery = STATE.query;
      fetchAll(STATE.keywords, STATE.imageCount, true).then(fresh => {
        if (STATE.query !== bgQuery) return; // query changed — discard stale results
        const existingIds = new Set(STATE.results.map(r => r.id));
        const novel = fresh.filter(r => !existingIds.has(r.id));
        if (novel.length > STATE.results.length * 0.2) {
          const merged = [...STATE.results, ...novel].slice(0, CONSTANTS.MAX_RESULTS);
          STATE.results = merged;
          cacheSet(STATE.query, STATE.results, STATE.keywords);
          updateCacheIndicator(STATE.query);
        }
      }).catch(() => {});
      return;
    }
  }

  // Fetch all sources progressively — starts immediately with raw query
  // Wall-clock safeguard: if fetchAll is still pending, abort it and
  // restore the render pipeline so the UI never gets stuck in a loading state.
  // Exact mode gets extra time for adaptive Phase 2 follow-up fetches.
  const _wctTimeout = STATE.searchMode === 'exact' ? 18000 : 12000;
  const _wctTimer = setTimeout(() => {
    if (STATE.abortController && !STATE.abortController.signal.aborted) {
      STATE.abortController.abort();
    }
    _restore();
  }, _wctTimeout);
  const all = await fetchAll(STATE.keywords, STATE.imageCount);
  clearTimeout(_wctTimer);
  _restore();
  // Guard: if a newer search was triggered while awaiting, discard this batch
  if (gen !== STATE._searchGen) return;
  STATE.results = all.slice(0, CONSTANTS.MAX_RESULTS);
  cacheSet(STATE.query, STATE.results, STATE.keywords);

  // ── Exact-mode post-processing ──────────────────────────────────────
  if (STATE.searchMode === 'exact') {
    const lq = STATE.query.toLowerCase();
    // 3. Discard results from rogue sources that don't contain the exact query
    //    (Wikimedia srsearch and Flickr both do internal fuzzy/relevance ranking)
    const ROGUE_SOURCES = new Set(['flickr', 'wikimedia', 'pixabay', 'pexels', 'unsplash', 'sketchfab_heritage']);
    STATE.results = STATE.results.filter(r => {
      if (!ROGUE_SOURCES.has(r.source)) return true;
      return matchesAsWholeWord(`${r.title || ''} ${r.description || ''}`.toLowerCase(), lq);
    });
    // 2. Promote results whose title/description contain the exact query phrase
    STATE.results = [
      ...STATE.results.filter(r => matchesAsWholeWord(`${r.title || ''} ${r.description || ''}`.toLowerCase(), lq)),
      ...STATE.results.filter(r => !matchesAsWholeWord(`${r.title || ''} ${r.description || ''}`.toLowerCase(), lq)),
    ];
  }
  // ────────────────────────────────────────────────────────────────────

  // Apply negative-term and phrase post-filters
  if (_negTerms.length) {
    STATE.results = filterNegativeTerms(STATE.results, _negTerms);
  }
  if (_phrases.length) {
    STATE.results = filterPhrases(STATE.results, _phrases);
  }
  // Apply license filter if set by advanced search
  if (STATE._licenseFilter) {
    STATE.results = applyLicenseFilter(STATE.results, STATE._licenseFilter);
  }
  // NSFW filter — sampled: caption first 6 items via Worker AI, flag & hide positives
  if (STATE._nsfwFilter && STATE.results.length) {
    applySampledNsfwFilter(STATE.results).catch(() => {});
  }

  const visible = getDisplayResults(STATE.results, effectiveQuery);
  if (visible.length) {
    // ── Sync grid: remove orphaned streaming cards, append missing ones ──
    // During streaming, onSourceResult appended preview cards. Some may not
    // survive post-fetch filtering. Remove those orphans, then render any
    // new items from the authoritative ranked set.
    const visibleIds = new Set(visible.map(i => i.id));
    const grid = document.getElementById('image-grid');
    for (const card of [...grid.querySelectorAll('.image-card')]) {
      const id = card.dataset.id;
      if (id && !visibleIds.has(id)) {
        renderedIds.delete(id);
        _gridItemMap.delete(id);
        card.remove();
      }
    }
    // Queue items from the final set that weren't rendered during streaming
    const novel = visible.filter(item => !renderedIds.has(item.id));
    if (novel.length) renderGrid(novel);

    // Set up reserve pool from lower-ranked candidates for backfill
    // when image loads fail (CORS, 404, 1×1px).
    const renderedOrQueued = new Set([...renderedIds]);
    STATE._reservePool = _lastDisplayOrder
      .filter(it => !renderedOrQueued.has(it.id))
      .slice(0, 500);

    // "Did you mean?" — check spelling in background if few results
    if (visible.length < 4 && STATE.searchMode !== 'exact') {
      spellCheck(effectiveQuery).then(suggestion => {
        if (suggestion && suggestion !== effectiveQuery) showDidYouMean(suggestion);
      }).catch(() => {});
    } else {
      hideDidYouMean();
    }
  } else {
    showEmptyState();
    spellCheck(effectiveQuery).then(suggestion => {
      if (suggestion) showDidYouMean(suggestion);
    }).catch(() => {});
  }

  STATE.loading = false;
  hideLoading();
  showCacheIndicator(STATE.query);
  document.getElementById('more-container').style.display = 'flex';
  updateLoadMoreLabel();
  // Build Fuse.js index for local filtering
  loadFuse(() => buildFuseIndex());
  // Check for failed images after a delay (images load lazily)
  setTimeout(checkFailedImages, 3000);
  // Show color-filter section when results exist (date & aspect now in advanced search)
  var _dfs = document.getElementById('date-filter-section');
  var _afs = document.getElementById('aspect-filter-section');
  if (_dfs) _dfs.style.display = '';
  if (_afs) _afs.style.display = '';
  document.getElementById('color-filter-section').style.display = '';
  var _lfs = document.getElementById('license-filter-section');
  if (_lfs) _lfs.style.display = '';
}

/* ============================================================
   16. EVENT LISTENERS
============================================================ */

/* ─── SEARCH HISTORY ────────────────────────────────────────
   Persists last 10 distinct queries in localStorage.
   Shows below the search input on focus / while typing.
────────────────────────────────────────────────────────────── */
export const _HISTORY_KEY = 'inspo_search_history';
export const _HISTORY_MAX = 10;

export function saveSearchHistory(q) {
  if (!q || q.length < 2) return;
  let hist = loadSearchHistory();
  hist = [q, ...hist.filter(h => h !== q)].slice(0, _HISTORY_MAX);
  try { localStorage.setItem(_HISTORY_KEY, JSON.stringify(hist)); } catch (_) {}
}

export function loadSearchHistory() {
  try {
    const raw = localStorage.getItem(_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export function renderSearchHistory(filter) {
  const el = document.getElementById('search-history-dropdown');
  if (!el) return;
  const hist = loadSearchHistory().filter(h =>
    !filter || h.toLowerCase().includes(filter.toLowerCase())
  );
  if (!hist.length) { el.hidden = true; return; }
  el.innerHTML = '';
  hist.forEach((h, i) => {
    const btn = document.createElement('button');
    btn.className = 'search-history-item';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');
    btn.dataset.i = i;
    btn.textContent = h;
    el.appendChild(btn);
  });
  el.hidden = false;
}

export function hideSearchHistory() {
  const el = document.getElementById('search-history-dropdown');
  if (el) el.hidden = true;
}

/* ─── "DID YOU MEAN?" SPELLING SUGGESTION ───────────────────
   After zero-results empty state, queries Datamuse for
   a spelling suggestion and appends it to the empty state.
────────────────────────────────────────────────────────────── */
export async function trySpellingSuggestion(query) {
  // Only useful for single-word or short queries
  if (!query || query.trim().length < 3) return;
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 3000);
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(query.trim())}&max=1`,
      { signal: ac.signal }
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return;
    const suggestion = data[0]?.word;
    if (!suggestion || suggestion === query.trim().toLowerCase()) return;
    const emptyState = document.querySelector('.empty-state');
    if (!emptyState) return;
    const hint = document.createElement('div');
    hint.className = 'empty-state-suggestion';
    const btn = document.createElement('button');
    btn.className = 'empty-suggestion-btn';
    btn.textContent = suggestion;
    btn.addEventListener('click', () => {
      document.getElementById('search-input').value = suggestion;
      runSearch(suggestion);
    });
    hint.append(tr('didYouMean') + ': ', btn, '?');
    emptyState.appendChild(hint);
  } catch (_) {}
}

// ─── Search history event wiring ───────────────────────────


export const _searchInputEl = document.getElementById('search-input');

_searchInputEl.addEventListener('focus', () => {
  renderSearchHistory(_searchInputEl.value.trim());
});

_searchInputEl.addEventListener('input', () => {
  renderSearchHistory(_searchInputEl.value.trim());
  if (STATE.autoSearch && typeof debouncedAutoSearch === 'function') debouncedAutoSearch(_searchInputEl.value);
});

// Dismiss on Escape
_searchInputEl.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideSearchHistory();
});

// Click a history item
document.getElementById('search-history-dropdown')?.addEventListener('mousedown', e => {
  // mousedown fires before blur, so we can grab the value before input loses focus
  const btn = e.target.closest('.search-history-item');
  if (!btn) return;
  e.preventDefault(); // prevent blur
  const q = btn.textContent.trim();
  _searchInputEl.value = q;
  hideSearchHistory();
  runSearch(q);
});

// Dismiss when clicking outside the sidebar section
document.addEventListener('click', e => {
  if (!e.target.closest('.sidebar-section')) hideSearchHistory();
});

// Logo — click to reset search
document.querySelector('.logo').addEventListener('click', () => {
  // Abort any in-flight requests
  if (STATE.abortController) { try { STATE.abortController.abort(); } catch (_) {} STATE.abortController = null; }
  for (const ac of _secondaryControllers) { try { ac.abort(); } catch (_) {} }
  _secondaryControllers.clear();

  // Clear state
  STATE.query = '';
  STATE.keywords = [];
  STATE.results = [];
  STATE.selected = [];
  STATE.loading = false;
  STATE.currentPage = 1;
  STATE.fuseIndex = null;
  STATE.crossRefMode = null;
  STATE.crossRefTerms = [];
  STATE.referenceImages = [];

  // Clear UI
  document.getElementById('search-input').value = '';
  clearGrid();
  hideLoading();
  renderKeywordPills([]);
  document.getElementById('local-filter-section').style.display = 'none';
  document.getElementById('local-filter').value = '';
  document.getElementById('more-container').style.display = 'none';
  hideReferenceStrip();
  hideConceptPills();
  hideFloatingBar();

  // Focus search input
  document.getElementById('search-input').focus();
});

// Search — Enter key
document.getElementById('search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    // If 2+ images selected and input empty: run connect instead of normal search
    if (STATE.selected.length >= 2 && !q) {
      e.preventDefault();
      runConnect();
      return;
    }
    if (q) runSearch(q);
  }
});

document.getElementById('btn-search-mode')?.addEventListener('click', () => {
  setSearchMode(STATE.searchMode === 'explore' ? 'exact' : 'explore');
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && String(e.key).toLowerCase() === 'e') {
    e.preventDefault();
    setSearchMode(STATE.searchMode === 'explore' ? 'exact' : 'explore');
  }
});

// Refresh cache button
document.getElementById('btn-refresh-cache')?.addEventListener('click', () => {
  if (STATE.query) runSearch(STATE.query, true);
});

// Load more
document.getElementById('btn-load-more')?.addEventListener('click', fetchMoreResults);

// ── Infinite scroll — auto-load more when user nears bottom ──
let _infiniteScrollObs = null;
export function initInfiniteScroll() {
  if (_infiniteScrollObs) _infiniteScrollObs.disconnect();
  const sentinel = document.getElementById('more-container');
  if (!sentinel) return;
  _infiniteScrollObs = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !STATE.loading && STATE.query && STATE.results.length < CONSTANTS.MAX_RESULTS) {
        fetchMoreResults();
      }
    }
  }, { rootMargin: '800px' }); // trigger 800px before reaching the bottom
  _infiniteScrollObs.observe(sentinel);
}
// Initialize on page load
initInfiniteScroll();

// Prefetch keywords while typing (400 ms debounce)
export const debouncedPrefetch = debounce(async q => {
  if (!q.trim() || q.trim() === STATE.query || STATE.searchMode === 'exact') return;
  STATE.prefetchedQuery = q.trim();
  STATE.prefetchedKeywords = await expandKeywords(q.trim());
}, 400);

document.getElementById('search-input')?.addEventListener('keyup', e => {
  if (e.key !== 'Enter') debouncedPrefetch(e.target.value);
});

// Image count slider (hidden by default, shown via advanced settings)
export const countSlider = document.getElementById('count-slider');
export const countLabel  = document.getElementById('count-label');

if (countSlider) {
  countSlider.addEventListener('input', () => {
    STATE.imageCount = parseInt(countSlider.value, 10);
    if (countLabel) countLabel.textContent = STATE.imageCount + ' ' + tr('images');
    updateLoadMoreLabel();
  });
}

export const debouncedRerender = debounce(() => {
  if (STATE.results.length <= 0 || !_lastDisplayOrder.length) return;
  const target = _lastDisplayOrder.slice(0, STATE.imageCount);
  const targetIds = new Set(target.map(i => i.id));
  const grid = document.getElementById('image-grid');

  // Remove cards that exceed the new target count
  for (const card of [...grid.querySelectorAll('.image-card')]) {
    const id = card.dataset.id;
    if (id && !targetIds.has(id)) {
      renderedIds.delete(id);
      _gridItemMap.delete(id);
      card.remove();
    }
  }

  // Add cards that are in the target but not yet rendered
  const novel = target.filter(item => !renderedIds.has(item.id));
  if (novel.length) (_realRenderGrid || renderGrid)(novel);

  // Refresh reserve pool
  const renderedOrQueued = new Set([...renderedIds]);
  STATE._reservePool = _lastDisplayOrder
    .filter(it => !renderedOrQueued.has(it.id))
    .slice(0, 500);

  updateLoadMoreLabel();
}, CONSTANTS.DEBOUNCE_SLIDER);

if (countSlider) countSlider.addEventListener('input', debouncedRerender);

// Dark mode toggle
export const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const wasDark = document.body.classList.contains('dark') ||
    (!document.body.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.remove('dark', 'light');
  if (wasDark) {
    document.body.classList.add('light');
  } else {
    document.body.classList.add('dark');
  }
  const isDark = !wasDark;
  themeToggle.textContent = isDark ? 'light' : 'dark';
  localStorage.setItem('inspo_theme', isDark ? 'dark' : 'light');
  if (typeof boardChannel !== 'undefined' && boardChannel) {
    boardChannel.postMessage({ type: 'theme', dark: isDark });
  }
});

// Initialise toggle label to match saved pref or system preference
(function initTheme() {
  const saved = localStorage.getItem('inspo_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'light';
  } else if (saved === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = 'dark';
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    themeToggle.textContent = 'light';
  }
})();

/* ============================================================
   PHASE 4 — SKETCH MODE & CONTROLS
============================================================ */

// Sobel edge detection → pencil sketch canvas
export function sketchToCanvas(imgEl) {
  const MAX_W = 400;
  let sw = imgEl.naturalWidth  || imgEl.offsetWidth  || 400;
  let sh = imgEl.naturalHeight || imgEl.offsetHeight || 300;
  if (sw > MAX_W) {
    sh = Math.round(sh * (MAX_W / sw));
    sw = MAX_W;
  }
  const off = document.createElement('canvas');
  off.width  = sw;
  off.height = sh;
  const ctx = off.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, sw, sh);
  const src  = ctx.getImageData(0, 0, sw, sh);
  const gray = new Uint8ClampedArray(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const p = i * 4;
    gray[i] = 0.299 * src.data[p] + 0.587 * src.data[p + 1] + 0.114 * src.data[p + 2];
  }
  const out = ctx.createImageData(sw, sh);
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const g = (r, c) => gray[(y + r) * sw + (x + c)];
      const gx = -g(-1,-1) + g(-1,1) - 2*g(0,-1) + 2*g(0,1) - g(1,-1) + g(1,1);
      const gy = -g(-1,-1) - 2*g(-1,0) - g(-1,1) + g(1,-1) + 2*g(1,0) + g(1,1);
      const val = 255 - Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const p = (y * sw + x) * 4;
      out.data[p] = out.data[p + 1] = out.data[p + 2] = val;
      out.data[p + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return off;
}

export function applySketchToCard(card, img) {
  if (card.querySelector('.sketch-overlay')) return;
  // Immediate CSS placeholder
  img.style.filter     = 'grayscale(1) contrast(1.4) brightness(1.1)';
  img.style.transition = 'filter 0.5s ease';
  // Defer expensive Sobel to idle time
  const doSobel = () => {
    if (!STATE.sketchMode) return;          // user toggled off
    if (card.querySelector('.sketch-overlay')) return;
    try {
      const cvs = sketchToCanvas(img);
      cvs.className = 'sketch-overlay';
      img.style.opacity = '0';
      img.style.filter  = '';
      card.appendChild(cvs);
      requestAnimationFrame(() => { cvs.style.opacity = '1'; });
    } catch {
      // CORS-tainted — keep CSS fallback already applied
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(doSobel, { timeout: 2000 });
  } else {
    setTimeout(doSobel, 100);
  }
}

export function applySketchMode() {
  const cards = Array.from(document.querySelectorAll('.image-card'));
  const BATCH = 3;
  let idx = 0;
  function processBatch(deadline) {
    if (!STATE.sketchMode) return;
    let count = 0;
    while (idx < cards.length && count < BATCH) {
      if (typeof deadline !== 'undefined' && deadline.timeRemaining && deadline.timeRemaining() < 5 && count > 0) break;
      const card = cards[idx++];
      const img = card.querySelector('img');
      if (img && img.complete && img.naturalWidth > 1) applySketchToCard(card, img);
      count++;
    }
    if (idx < cards.length) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(processBatch, { timeout: 2000 });
      } else {
        setTimeout(() => processBatch(), 50);
      }
    }
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(processBatch, { timeout: 1000 });
  } else {
    setTimeout(() => processBatch(), 50);
  }
}

export function removeSketchMode() {
  document.querySelectorAll('.sketch-overlay').forEach(c => c.remove());
  document.querySelectorAll('.image-card img').forEach(img => {
    img.style.opacity    = '';
    img.style.filter     = '';
    img.style.transition = '';
  });
}

// B&W mode toggle (replaces old "sketch" which was actually grayscale)
export const btnBW = document.getElementById('btn-bw');
btnBW.addEventListener('click', () => {
  STATE.sketchMode = !STATE.sketchMode;
  if (STATE.sketchMode) {
    applySketchMode();
    btnBW.textContent = 'colour';
    btnBW.classList.add('active');
  } else {
    removeSketchMode();
    btnBW.textContent = 'b&w';
    btnBW.classList.remove('active');
  }
});

// Sketch draw mode toggle (Fabric.js overlay on grid/board only)
export const btnSketch = document.getElementById('btn-sketch');
btnSketch.addEventListener('click', () => {
  if (_fabricCanvas) {
    destroyFabricOverlay();
    btnSketch.classList.remove('active');
  } else {
    initFabricOverlay();
    btnSketch.classList.add('active');
  }
});

/* ── Fabric.js sketch drawing overlay ── */
export let _fabricCanvas = null;

export function getGridBounds() {
  const sidebar = document.getElementById('sidebar');
  const panel = document.getElementById('panel');
  const sidebarW = sidebar ? sidebar.offsetWidth : 0;
  const panelW = (panel && panel.classList.contains('open')) ? panel.offsetWidth : 0;
  return {
    left: sidebarW,
    top: 0,
    width: window.innerWidth - sidebarW - panelW,
    height: window.innerHeight,
  };
}

export function positionFabricOverlay() {
  const overlay = document.getElementById('fabric-overlay');
  const bounds = getGridBounds();
  overlay.style.left   = bounds.left + 'px';
  overlay.style.top    = bounds.top + 'px';
  overlay.style.width  = bounds.width + 'px';
  overlay.style.height = bounds.height + 'px';
  if (_fabricCanvas) {
    _fabricCanvas.setWidth(bounds.width);
    _fabricCanvas.setHeight(bounds.height);
  }
}

export function setupFabricTools(fc, toolSelector, clearId, exportId) {
  document.querySelectorAll(toolSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(toolSelector).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.dataset.tool;
      const inkColor = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1a18';
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#F7F5F2';
      if (tool === 'pencil') {
        fc.isDrawingMode = true;
        fc.freeDrawingBrush = new fabric.PencilBrush(fc);
        fc.freeDrawingBrush.color = inkColor;
        fc.freeDrawingBrush.width = 2;
      } else if (tool === 'eraser') {
        fc.isDrawingMode = true;
        fc.freeDrawingBrush = new fabric.PencilBrush(fc);
        fc.freeDrawingBrush.color = bgColor;
        fc.freeDrawingBrush.width = 16;
      } else {
        fc.isDrawingMode = false;
        const cx = fc.getWidth() / 2, cy = fc.getHeight() / 2;
        if (tool === 'text') {
          const t = new fabric.IText('type here', { left: cx-60, top: cy, fontFamily:'DM Mono', fontSize:16, fill:inkColor });
          fc.add(t); fc.setActiveObject(t);
        } else if (tool === 'rect') {
          const r = new fabric.Rect({ left:cx-50, top:cy-25, width:100, height:50, fill:'transparent', stroke:inkColor, strokeWidth:1 });
          fc.add(r); fc.setActiveObject(r);
        } else if (tool === 'line') {
          const l = new fabric.Line([cx-100, cy, cx+100, cy], { stroke:inkColor, strokeWidth:1 });
          fc.add(l); fc.setActiveObject(l);
        }
      }
    });
  });
  document.getElementById(clearId)?.addEventListener('click', () => fc.clear());
  document.getElementById(exportId)?.addEventListener('click', () => {
    const dataUrl = fc.toDataURL({ format:'png', quality:1 });
    const link = document.createElement('a');
    link.download = `insposearch-sketch-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  });
}

export function initFabricOverlay() {
  loadFabric(() => {
    const overlay = document.getElementById('fabric-overlay');
    overlay.style.display = '';
    positionFabricOverlay();

    const canvasEl = document.getElementById('fabric-canvas');
    const bounds = getGridBounds();
    canvasEl.width = bounds.width;
    canvasEl.height = bounds.height;

    _fabricCanvas = new fabric.Canvas('fabric-canvas', {
      isDrawingMode: true,
      width: bounds.width,
      height: bounds.height,
    });
    const inkColor = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1a18';
    _fabricCanvas.freeDrawingBrush.color = inkColor;
    _fabricCanvas.freeDrawingBrush.width = 2;

    setupFabricTools(_fabricCanvas, '.sketch-tool', 'sketch-clear', 'sketch-export');

    const closeBtn = document.getElementById('sketch-close');
    const _onClose = () => {
      destroyFabricOverlay();
      btnSketch.classList.remove('active');
    };
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    document.getElementById('sketch-close')?.addEventListener('click', _onClose);

    window.addEventListener('resize', positionFabricOverlay);
  });
}

export function destroyFabricOverlay() {
  if (_fabricCanvas) {
    _fabricCanvas.dispose();
    _fabricCanvas = null;
  }
  document.getElementById('fabric-overlay').style.display = 'none';
  window.removeEventListener('resize', positionFabricOverlay);
}

// View toggle buttons — wire up grid/board/3d switching
// Board and 3D controllers added in their own phases;
// here we set active state and call the appropriate view switcher.
export function setActiveViewBtn(view) {
  document.getElementById('btn-grid').classList.toggle('active', view === 'grid');
  // btn-board active state managed by openBoardOverlay / closeBoardOverlay
  document.getElementById('btn-3d').classList.toggle('active',   view === '3d');
}

// Fade-assisted view switch (200ms out → switch → 200ms in)
// Board is now a floating overlay — btn-board toggles it independently
export function switchView(newView) {
  if (newView === 'board') { toggleBoardOverlay(); return; }
  if (STATE.view === newView) return;
  const canvasEl = document.getElementById('canvas');
  canvasEl.style.opacity = '0';
  setTimeout(() => {
    if (STATE.view === '3d' && typeof disposeThreeView === 'function') disposeThreeView();

    STATE.view = newView;
    setActiveViewBtn(newView);

    const grid  = document.getElementById('image-grid');
    const three = document.getElementById('three-canvas');

    canvasEl.classList.remove('view-3d');

    if (newView === 'grid') {
      grid.style.display = '';
      three.classList.remove('active');
      if (STATE.results.length > 0) renderGrid(STATE.results.slice(0, STATE.imageCount));
    } else if (newView === '3d') {
      grid.style.display = 'none';
      three.classList.add('active');
      canvasEl.classList.add('view-3d');
      loadThreeJS(initThreeView);
    }

    canvasEl.style.opacity = '1';
  }, 200);
}

document.getElementById('btn-grid')?.addEventListener('click',  () => switchView('grid'));
document.getElementById('btn-board')?.addEventListener('click', () => toggleBoardOverlay());
document.getElementById('btn-3d')?.addEventListener('click',    () => switchView('3d'));

// Initialise active state on load
setActiveViewBtn('grid');

console.log('[insposearch] Phase 4 — Sketch Mode & Controls ready.');

/* ============================================================
   PHASE 5 — BOARD VIEW
============================================================ */

// Track which item each board card represents (by card element)
export const boardCardMap = new WeakMap();

// Per-card layout overrides — persisted to localStorage
export const boardPositions = {};

// Single shared drag/resize state — avoids per-card document listener accumulation
export const boardInteract = { drag: null, resize: null };
(function installBoardListeners() {
  function onMove(cx, cy) {
    if (boardInteract.drag) {
      const { card, startX, startY, origLeft, origTop } = boardInteract.drag;
      const boardEl = document.getElementById('board-canvas');
      const bw = boardEl.offsetWidth, bh = boardEl.offsetHeight;
      const cw = card.offsetWidth,   ch = card.offsetHeight;
      card.style.left = Math.min(bw - cw, Math.max(0, origLeft + (cx - startX))) + 'px';
      card.style.top  = Math.min(bh - ch, Math.max(0, origTop  + (cy - startY))) + 'px';
    }
    if (boardInteract.resize) {
      const { card, startX, startW } = boardInteract.resize;
      card.style.width = Math.max(80, Math.min(600, startW + (cx - startX))) + 'px';
    }
  }
  function onEnd() {
    if (boardInteract.drag) {
      const dc = boardInteract.drag.card;
      const di = boardCardMap.get(dc);
      if (_boardSnapEnabled) {
        dc.style.left = snapToGrid(parseInt(dc.style.left, 10) || 0) + 'px';
        dc.style.top  = snapToGrid(parseInt(dc.style.top,  10) || 0) + 'px';
      }
      if (di) {
        boardPositions[di.id] = {
          x: parseInt(dc.style.left, 10) || 0,
          y: parseInt(dc.style.top,  10) || 0,
          w: dc.offsetWidth,
        };
        if (typeof persistBoardState === 'function') persistBoardState();
      }
      dc.style.zIndex = '';
      boardInteract.drag = null;
    }
    boardInteract.resize = null;
  }
  document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', e => {
    if (boardInteract.drag || boardInteract.resize) {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }
  }, { passive: false });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('touchcancel', onEnd);
})();

export function initBoardView() {
  const boardEl = document.getElementById('board-canvas');
  // Clear existing cards (keep export button)
  boardEl.querySelectorAll('.board-card').forEach(c => c.remove());

  if (!STATE.selected.length) {
    // Show hint if nothing selected
    if (!boardEl.querySelector('.board-hint')) {
      const hint = document.createElement('div');
      hint.className = 'board-hint';
      hint.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-display);font-size:18px;font-weight:300;font-style:italic;color:var(--ink-3);pointer-events:none;text-align:center;';
      hint.innerHTML = '<p>drag images here to start a board</p><span style="font-family:var(--font-ui);font-size:10px;letter-spacing:0.1em;">select references first, then arrange freely</span>';
      boardEl.appendChild(hint);
    }
    return;
  }

  boardEl.querySelectorAll('.board-hint').forEach(h => h.remove());

  const cols = Math.ceil(Math.sqrt(STATE.selected.length));
  const cardW = 200;
  const gap   = 24;

  STATE.selected.forEach((item, i) => {
    const saved = boardPositions[item.id];
    const col   = i % cols;
    const row   = Math.floor(i / cols);
    const x     = saved ? saved.x : 24 + col * (cardW + gap);
    const y     = saved ? saved.y : 24 + row * (cardW * 0.75 + gap);
    const w     = saved ? saved.w : cardW;
    createBoardCard(item, x, y, boardEl, w);
  });
}

export function createBoardCard(item, x, y, container, w = 200) {
  const card = document.createElement('div');
  card.className = 'board-card';
  card.style.left  = x + 'px';
  card.style.top   = y + 'px';
  card.style.width = w + 'px';
  boardCardMap.set(card, item);

  const img = document.createElement('img');
  img.src    = item.thumb;
  img.alt    = item.title;
  img.draggable = false;
  img.style.cssText = 'display:block;width:100%;height:auto;';

  const title = document.createElement('div');
  title.className = 'board-title';
  title.textContent = item.title;

  const handle = document.createElement('div');
  handle.className = 'resize-handle';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'board-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'remove from board';
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    const removedItem = boardCardMap.get(card);
    card.remove();
    if (removedItem) {
      if (_isBoardPopup) {
        delete boardPositions[removedItem.id];
        if (typeof persistBoardState === 'function') persistBoardState();
        if (boardChannel) boardChannel.postMessage({ type: 'board-delete', itemId: removedItem.id });
      } else {
        STATE.selected = STATE.selected.filter(s => s.id !== removedItem.id);
        delete boardPositions[removedItem.id];
        document.getElementById('card-' + removedItem.id)?.classList.remove('selected');
        updateFloatingBar();
        updatePanel();
        if (typeof persistBoardState === 'function') persistBoardState();
        if (typeof broadcastBoardSync === 'function') broadcastBoardSync();
      }
      const boardEl = document.getElementById('board-canvas');
      if (!boardEl.querySelectorAll('.board-card').length) initBoardView();
    }
  });

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(handle);
  card.appendChild(deleteBtn);
  container.appendChild(card);

  // Drag to reposition
  card.addEventListener('mousedown', e => {
    if (e.target === handle) return; // resize takes over
    boardInteract.drag = {
      card,
      startX:   e.clientX,
      startY:   e.clientY,
      origLeft: parseInt(card.style.left, 10),
      origTop:  parseInt(card.style.top,  10),
    };
    card.style.zIndex = '100';
    e.preventDefault();
  });
  card.addEventListener('touchstart', e => {
    if (e.target === handle) return;
    const t = e.touches[0];
    boardInteract.drag = {
      card,
      startX:   t.clientX,
      startY:   t.clientY,
      origLeft: parseInt(card.style.left, 10),
      origTop:  parseInt(card.style.top,  10),
    };
    card.style.zIndex = '100';
  }, { passive: true });

  // Resize handle — bottom-right drag
  handle.addEventListener('mousedown', e => {
    boardInteract.resize = { card, startX: e.clientX, startW: card.offsetWidth };
    e.preventDefault();
    e.stopPropagation();
  });
  handle.addEventListener('touchstart', e => {
    const t = e.touches[0];
    boardInteract.resize = { card, startX: t.clientX, startW: card.offsetWidth };
    e.stopPropagation();
  }, { passive: true });

  // Double-click — open concept panel for this card's item
  card.addEventListener('dblclick', e => {
    if (e.target === handle) return;
    const clickedItem = boardCardMap.get(card);
    if (!clickedItem) return;
    // Ensure item is in selected and panel is open
    if (!STATE.selected.find(s => s.id === clickedItem.id)) {
      STATE.selected.push(clickedItem);
    }
    updatePanel();
  });
}

// Export board as PNG
document.getElementById('btn-export')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-export');
  btn.textContent = 'exporting...';
  btn.disabled = true;
  try {
    await new Promise(resolve => loadHtml2Canvas(resolve));
    const boardEl = document.getElementById('board-canvas');
    const exportBg = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg').trim() || '#F7F5F2';
    const cvs = await html2canvas(boardEl, {
      backgroundColor: exportBg,
      useCORS: true,
      scale: 2,
      ignoreElements: el => el.id === 'btn-export',
    });
    const link = document.createElement('a');
    link.download = `insposearch-board-${Date.now()}.png`;
    link.href = cvs.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.warn('Export failed:', err.message);
  } finally {
    btn.textContent = 'export';
    btn.disabled = false;
  }
});

console.log('[insposearch] Phase 5 — Board View ready.');

/* ── Konva-assisted board enhancements ── */
export let _boardSnapEnabled = false;
export const SNAP_GRID = 24;

export function snapToGrid(val) {
  return Math.round(val / SNAP_GRID) * SNAP_GRID;
}

document.getElementById('btn-snap-grid')?.addEventListener('click', () => {
  _boardSnapEnabled = !_boardSnapEnabled;
  const btn = document.getElementById('btn-snap-grid');
  btn.style.opacity = _boardSnapEnabled ? '1' : '0.6';
  btn.textContent = _boardSnapEnabled ? 'snap ✓' : 'snap';
});

/* ============================================================
   PHASE 3 — MULTI-PROVIDER AI + CANVAS SNAPSHOT
============================================================ */

/* -- captureGridSnapshot: render visible grid to compressed JPEG + metadata -- */
export async function captureGridSnapshot() {
  const canvasEl = document.getElementById('canvas');
  const metadata = {
    searchTerm:     STATE.query || '',
    mode:           STATE.searchMode,
    sourceCount:    [...new Set(STATE.results.map(r => r.source))].length,
    imageCount:     STATE.results.length,
    activeSources:  [...new Set(STATE.results.map(r => r.source))].slice(0, 8),
    selectedImages: STATE.selected.slice(0, 5).map(s => ({
      title: s.title, source: s.source, tags: (s.tags || []).slice(0, 4),
    })),
  };
  try {
    await new Promise(resolve => loadHtml2Canvas(resolve));
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a0a';
    const cvs = await html2canvas(canvasEl, {
      backgroundColor: bg, useCORS: true, scale: 0.4, logging: false,
      ignoreElements: el => el.id === 'reference-strip' || el.classList?.contains('empty-state'),
    });
    let quality = 0.7;
    let dataUrl  = cvs.toDataURL('image/jpeg', quality);
    while (dataUrl.length * 0.75 > 200000 && quality > 0.2) {
      quality -= 0.15;
      dataUrl = cvs.toDataURL('image/jpeg', quality);
    }
    return { base64: dataUrl.split(',')[1], metadata };
  } catch (e) {
    console.warn('[snapshot]', e.message);
    return { base64: null, metadata };
  }
}

/* -- Ollama single-turn (OpenAI-compatible) -- */
export async function _callOllama(prompt, base64, mimeType) {
  const base = (STATE.ollamaEndpoint || 'http://localhost:11434').replace(/\/$/, '');
  const model = STATE.ollamaModel || 'llava';
  const userContent = [];
  if (base64) userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
  userContent.push({ type: 'text', text: prompt });
  const res = await fetch(base + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 600, messages: [{ role: 'user', content: userContent }] }),
  });
  if (!res.ok) throw new Error('Ollama ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/* -- Ollama multi-turn (OpenAI-compatible) -- */
export async function _callOllamaChat(history, systemPrompt, base64, mimeType) {
  const base = (STATE.ollamaEndpoint || 'http://localhost:11434').replace(/\/$/, '');
  const model = STATE.ollamaModel || 'llava';
  const messages = [{ role: 'system', content: systemPrompt }];
  history.forEach((m, idx) => {
    if (idx === 0 && base64) {
      messages.push({ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: m.content },
      ]});
    } else {
      messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }
  });
  const res = await fetch(base + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 600, messages }),
  });
  if (!res.ok) throw new Error('Ollama ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/* -- callAI: central dispatcher — routes to active provider -- */
export async function callAI(prompt, base64 = null, mimeType = 'image/jpeg') {
  const provider = STATE.aiProvider || 'gemini';
  if (isAIProviderRateLimited(provider)) throw new Error(`${provider} rate limited — try again in a minute`);
  trackAIProviderCall(provider);
  if (provider === 'claude' && STATE.claudeKey)  return _callClaude(prompt, base64, mimeType);
  if (provider === 'openai'  && STATE.openaiKey) return _callOpenAI(prompt, base64, mimeType);
  if (provider === 'ollama')                     return _callOllama(prompt, base64, mimeType);
  if (!STATE.geminiKey) throw new Error('no ai key — add a key in api keys panel');
  return _callGeminiSingle(prompt, base64, mimeType);
}

/* -- callAIChat: multi-turn conversation dispatcher -- */
export async function callAIChat(history, systemPrompt, base64 = null, mimeType = 'image/jpeg') {
  const provider = STATE.aiProvider || 'gemini';
  if (isAIProviderRateLimited(provider)) throw new Error(`${provider} rate limited — try again in a minute`);
  trackAIProviderCall(provider);
  if (provider === 'claude' && STATE.claudeKey)  return _callClaudeChat(history, systemPrompt, base64, mimeType);
  if (provider === 'openai'  && STATE.openaiKey) return _callOpenAIChat(history, systemPrompt, base64, mimeType);
  if (provider === 'ollama')                     return _callOllamaChat(history, systemPrompt, base64, mimeType);
  if (!STATE.geminiKey) throw new Error('no ai key — add a key in api keys panel');
  return _callGeminiChat(history, systemPrompt, base64, mimeType);
}

/* -- Gemini single-turn -- */
export async function _callGeminiSingle(prompt, base64, mimeType) {
  const parts = [];
  if (base64) parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  parts.push({ text: prompt });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STATE.geminiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 600 } }) }
  );
  if (!res.ok) throw new Error('Gemini ' + res.status);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* -- Gemini multi-turn -- */
export async function _callGeminiChat(history, systemPrompt, base64, mimeType) {
  const contents = [];
  // First user message may carry the snapshot
  history.forEach((m, idx) => {
    const parts = [];
    if (idx === 0 && base64) parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
    parts.push({ text: idx === 0 ? systemPrompt + '\n\n' + m.content : m.content });
    contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
  });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STATE.geminiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 600 } }) }
  );
  if (!res.ok) throw new Error('Gemini ' + res.status);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* -- Claude single-turn -- */
export async function _callClaude(prompt, base64, mimeType) {
  const content = [];
  if (base64) content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } });
  content.push({ type: 'text', text: prompt });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': STATE.claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error('Claude ' + res.status);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/* -- Claude multi-turn -- */
export async function _callClaudeChat(history, systemPrompt, base64, mimeType) {
  const messages = history.map((m, idx) => {
    if (idx === 0 && base64) {
      return { role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
        { type: 'text', text: m.content },
      ]};
    }
    return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content };
  });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': STATE.claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, system: systemPrompt, messages }),
  });
  if (!res.ok) throw new Error('Claude ' + res.status);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/* -- OpenAI single-turn -- */
export async function _callOpenAI(prompt, base64, mimeType) {
  const base = (STATE.openaiEndpoint || 'https://api.openai.com').replace(/\/$/, '');
  const userContent = [];
  if (base64) userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
  userContent.push({ type: 'text', text: prompt });
  const res = await fetch(base + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + STATE.openaiKey },
    body: JSON.stringify({ model: 'gpt-4o', max_tokens: 600, messages: [{ role: 'user', content: userContent }] }),
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/* -- OpenAI multi-turn -- */
export async function _callOpenAIChat(history, systemPrompt, base64, mimeType) {
  const base = (STATE.openaiEndpoint || 'https://api.openai.com').replace(/\/$/, '');
  const messages = [{ role: 'system', content: systemPrompt }];
  history.forEach((m, idx) => {
    if (idx === 0 && base64) {
      messages.push({ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: m.content },
      ]});
    } else {
      messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }
  });
  const res = await fetch(base + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + STATE.openaiKey },
    body: JSON.stringify({ model: 'gpt-4o', max_tokens: 600, messages }),
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

console.log('[insposearch] Phase 3 — Multi-provider AI + Canvas Snapshot ready.');


/* ============================================================
   PHASE 5B — BOARD OVERLAY · DRAG-TO-BOARD · PERSISTENCE · POP-OUT
============================================================ */

// BroadcastChannel for live sync between main window and pop-out
export const boardChannel = (typeof BroadcastChannel !== 'undefined')
  ? new BroadcastChannel('inspo-board') : null;

export function persistBoardState() {
  try {
    const items = STATE.selected.map(s => ({
      id: s.id, thumb: s.thumb, title: s.title, source: s.source,
      tags: s.tags || [], sourceUrl: s.sourceUrl || '',
      year: s.year || '', colors: s.colors || [],
    }));
    localStorage.setItem('inspo_board_state', JSON.stringify({
      items, positions: boardPositions,
      overlayOpen: STATE.boardOverlayOpen || false,
    }));
  } catch(e) {}
}

export function loadBoardState() {
  try {
    const saved = localStorage.getItem('inspo_board_state');
    if (!saved) return;
    const data = JSON.parse(saved);
    if (Array.isArray(data.items) && data.items.length) {
      STATE.selected = data.items;
      STATE.selected.forEach(item => {
        document.getElementById('card-' + item.id)?.classList.add('selected');
      });
      if (typeof updateFloatingBar === 'function') updateFloatingBar();
    }
    if (data.positions) Object.assign(boardPositions, data.positions);
    if (data.overlayOpen) requestAnimationFrame(() => openBoardOverlay());
  } catch(e) {}
}

export function broadcastBoardSync() {
  if (!boardChannel) return;
  boardChannel.postMessage({
    type:      'board-sync',
    items:     STATE.selected.map(s => ({
      id: s.id, thumb: s.thumb, title: s.title, source: s.source,
      tags: s.tags || [], sourceUrl: s.sourceUrl || '',
      year: s.year || '', colors: s.colors || [],
    })),
    positions: { ...boardPositions },
  });
}

// Main window: listen for events from pop-out
if (boardChannel && !_isBoardPopup) {
  boardChannel.onmessage = e => {
    const msg = e.data;
    if (msg.type === 'board-delete') {
      STATE.selected = STATE.selected.filter(s => s.id !== msg.itemId);
      delete boardPositions[msg.itemId];
      document.getElementById('card-' + msg.itemId)?.classList.remove('selected');
      updateFloatingBar();
      updatePanel();
      persistBoardState();
      syncBoardOverlay();
    }
    if (msg.type === 'theme') {
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(msg.dark ? 'dark' : 'light');
      const tt = document.getElementById('theme-toggle');
      if (tt) tt.textContent = msg.dark ? 'light' : 'dark';
    }
  };
}

export function openBoardOverlay() {
  document.getElementById('board-overlay').classList.add('open');
  document.getElementById('btn-board').classList.add('active');
  STATE.boardOverlayOpen = true;
  syncBoardOverlay();
  showQuietTip('board-overlay-header', 'boards let you drag, compare, and export references', 'inspo_tip_boards');
}

export function closeBoardOverlay() {
  destroyBoardSketch();
  document.getElementById('board-overlay').classList.remove('open');
  document.getElementById('btn-board').classList.remove('active');
  STATE.boardOverlayOpen = false;
}

/* ── Board Sketch (Fabric canvas inside board overlay) ── */
export let _boardFabricCanvas = null;

export function initBoardSketch() {
  loadFabric(() => {
    const content = document.getElementById('board-overlay-content');
    const canvasEl = document.getElementById('board-fabric-canvas');
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    canvasEl.width = w;
    canvasEl.height = h;
    canvasEl.style.display = '';
    canvasEl.style.pointerEvents = 'auto';

    _boardFabricCanvas = new fabric.Canvas('board-fabric-canvas', {
      isDrawingMode: true,
      width: w,
      height: h,
    });
    const inkColor = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1a18';
    _boardFabricCanvas.freeDrawingBrush.color = inkColor;
    _boardFabricCanvas.freeDrawingBrush.width = 2;

    setupFabricTools(_boardFabricCanvas, '.board-sketch-tool', 'board-sketch-clear', 'board-sketch-export');

    const toolbar = document.getElementById('board-sketch-toolbar');
    toolbar.style.display = 'flex';
  });
}

export function destroyBoardSketch() {
  if (_boardFabricCanvas) {
    _boardFabricCanvas.dispose();
    _boardFabricCanvas = null;
  }
  const canvasEl = document.getElementById('board-fabric-canvas');
  if (canvasEl) {
    canvasEl.style.display = 'none';
    canvasEl.style.pointerEvents = 'none';
  }
  const toolbar = document.getElementById('board-sketch-toolbar');
  if (toolbar) toolbar.style.display = 'none';
  document.getElementById('btn-board-sketch')?.classList.remove('active');
}

document.getElementById('btn-board-sketch')?.addEventListener('click', () => {
  if (_boardFabricCanvas) {
    destroyBoardSketch();
  } else {
    initBoardSketch();
    document.getElementById('btn-board-sketch')?.classList.add('active');
  }
});

export function toggleBoardOverlay() {
  document.getElementById('board-overlay').classList.contains('open')
    ? closeBoardOverlay() : openBoardOverlay();
}

export function syncBoardOverlay() {
  if (!document.getElementById('board-overlay').classList.contains('open')) return;
  initBoardView();
}

// Overlay header drag (freely moveable, including across screens)
(function installOverlayDrag() {
  const overlay = document.getElementById('board-overlay');
  const header  = document.getElementById('board-overlay-header');
  let drag = null;
  function startDrag(cx, cy) {
    const rect = overlay.getBoundingClientRect();
    drag = { startX: cx, startY: cy, origLeft: rect.left, origTop: rect.top };
  }
  function moveDrag(cx, cy) {
    if (!drag) return;
    overlay.style.right  = 'auto';
    overlay.style.bottom = 'auto';
    overlay.style.left   = Math.max(0, drag.origLeft + (cx - drag.startX)) + 'px';
    overlay.style.top    = Math.max(0, drag.origTop  + (cy - drag.startY)) + 'px';
  }
  function endDrag() { drag = null; }
  header.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  });
  header.addEventListener('touchstart', e => {
    if (e.target.tagName === 'BUTTON') return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => {
    if (drag) { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }
  }, { passive: true });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);
})();

document.getElementById('board-overlay-close')?.addEventListener('click', closeBoardOverlay);

document.getElementById('btn-board-popout')?.addEventListener('click', () => {
  persistBoardState();
  broadcastBoardSync();
  const url = location.href.split('?')[0] + '?boardpopup=1';
  window.open(url, 'inspo-board', 'width=900,height=700,resizable=yes');
});

// Drop handler on board canvas (drag from grid)
(function installBoardDrop() {
  const boardCanvas = document.getElementById('board-canvas');
  boardCanvas.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  boardCanvas.addEventListener('drop', e => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    let item = STATE.results.find(r => r.id === itemId)
            || STATE.selected.find(r => r.id === itemId);
    if (!item) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) item = JSON.parse(raw);
      } catch {}
    }
    if (!item) return;
    if (!STATE.selected.find(s => s.id === item.id)) {
      STATE.selected.push(item);
      const gc = document.getElementById('card-' + item.id);
      if (gc) {
        gc.classList.add('selected');
        const gi = gc.querySelector('img');
        if (gi && gi.complete && gi.naturalWidth > 1) {
          try { item.colors = getDominantColors(gi); } catch {}
        }
      }
      updateFloatingBar();
    }
    const rect = boardCanvas.getBoundingClientRect();
    const x    = Math.max(0, e.clientX - rect.left - 100);
    const y    = Math.max(0, e.clientY - rect.top  - 75);
    let alreadyOnBoard = false;
    boardCanvas.querySelectorAll('.board-card').forEach(bc => {
      if (boardCardMap.get(bc)?.id === item.id) alreadyOnBoard = true;
    });
    if (!alreadyOnBoard) createBoardCard(item, x, y, boardCanvas);
    persistBoardState();
    broadcastBoardSync();
  });
})();

// Pop-out mode: entire page becomes a fullscreen board window
export function initBoardPopupMode() {
  const t = localStorage.getItem('inspo_theme');
  if (t === 'dark')  document.body.classList.add('dark');
  if (t === 'light') document.body.classList.remove('dark');

  ['#sidebar', '#canvas', '#panel', '#keys-panel', '#ai-chat-panel'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const overlay = document.getElementById('board-overlay');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'width:100%', 'height:100dvh',
    'display:flex', 'flex-direction:column',
    'background:var(--bg-panel)', 'border:none',
    'box-shadow:none', 'resize:none', 'z-index:1',
  ].join(';');
  overlay.classList.add('open');

  document.getElementById('board-overlay-header').style.cursor = 'default';
  document.getElementById('btn-board-popout').style.display = 'none';

  syncBoardOverlay();

  if (boardChannel) {
    boardChannel.onmessage = e => {
      const msg = e.data;
      if (msg.type === 'board-sync') {
        STATE.selected = msg.items || [];
        Object.assign(boardPositions, msg.positions || {});
        persistBoardState();
        initBoardView();
      }
      if (msg.type === 'theme') {
        document.body.classList.toggle('dark', msg.dark);
      }
    };
  }
}

// Restore board on load; initialise popup if launched as pop-out
loadBoardState();
if (_isBoardPopup) initBoardPopupMode();

/* ============================================================
   PHASE 6 — 3D VIEW (Three.js)
============================================================ */

/* ── Lazy script loaders ── */
export function loadScript(url, cb) {
  if (document.querySelector('script[src="' + url + '"]')) { cb(); return; }
  const s = document.createElement('script');
  s.src = url;
  s.onload = cb;
  document.head.appendChild(s);
}
export function loadThreeJS(cb) {
  if (window.THREE) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function() {
    loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', cb);
  });
}
export function loadHtml2Canvas(cb) {
  if (window.html2canvas) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', cb);
}

/* ── New library lazy loaders ── */
export function loadColorThief(cb) {
  if (window.ColorThief) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js', cb);
}
export function loadTinyColor(cb) {
  if (window.tinycolor) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.6.0/tinycolor.min.js', cb);
}
export function loadFuse(cb) {
  if (window.Fuse) { cb(); return; }
  loadScript('https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js', cb);
}
export function loadKonva(cb) {
  if (window.Konva) { cb(); return; }
  loadScript('https://unpkg.com/konva@9/konva.min.js', cb);
}
export function loadFabric(cb) {
  if (window.fabric) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js', cb);
}
export function loadOpenSeadragon(cb) {
  if (window.OpenSeadragon) { cb(); return; }
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js', cb);
}

/* ── OpenSeadragon deep-zoom viewer ── */
export let _osdViewer = null;
export const IIIF_SOURCES = new Set(['met_iiif', 'wellcome_iiif', 'bodleian', 'cudl', 'bsb']);

export let _osdFabricCanvas = null;
export let _osdBwActive = false;

export function openDeepZoom(item) {
  loadOpenSeadragon(() => {
    const modal = document.getElementById('osd-modal');
    modal.classList.add('open');

    // Always prefer full-res url over thumb
    let tileSources;
    if (IIIF_SOURCES.has(item.source) && item.iiifManifest) {
      tileSources = item.iiifManifest;
    } else {
      // Use sourceUrl-derived full image if available, then url, then thumb
      tileSources = { type: 'image', url: item.fullUrl || item.url || item.thumb };
    }

    _osdViewer = OpenSeadragon({
      id: 'osd-container',
      tileSources: tileSources,
      prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      animationTime: 0.3,
      immediateRender: true,
      maxZoomPixelRatio: 6,
      visibilityRatio: 0.8,
    });

    // Reset B&W and sketch state for this zoom session
    _osdBwActive = false;
    document.getElementById('osd-bw-toggle').textContent = 'b&w';
    document.getElementById('osd-bw-toggle').style.opacity = '0.7';
    document.getElementById('osd-sketch-toggle').textContent = 'sketch';
    document.getElementById('osd-sketch-toggle').style.opacity = '0.7';
    destroyOsdSketch();
  });
}

export function closeDeepZoom() {
  destroyOsdSketch();
  if (_osdViewer) {
    _osdViewer.destroy();
    _osdViewer = null;
  }
  _osdBwActive = false;
  document.getElementById('osd-container').innerHTML = '';
  document.getElementById('osd-container').style.filter = '';
  document.getElementById('osd-modal').classList.remove('open');
}

// B&W toggle inside zoom
document.getElementById('osd-bw-toggle')?.addEventListener('click', () => {
  _osdBwActive = !_osdBwActive;
  const container = document.getElementById('osd-container');
  const btn = document.getElementById('osd-bw-toggle');
  if (_osdBwActive) {
    container.style.filter = 'grayscale(1) contrast(1.3) brightness(1.05)';
    btn.textContent = 'colour';
    btn.style.opacity = '1';
  } else {
    container.style.filter = '';
    btn.textContent = 'b&w';
    btn.style.opacity = '0.7';
  }
});

// Sketch toggle inside zoom
document.getElementById('osd-sketch-toggle')?.addEventListener('click', () => {
  if (_osdFabricCanvas) {
    destroyOsdSketch();
    document.getElementById('osd-sketch-toggle').textContent = 'sketch';
    document.getElementById('osd-sketch-toggle').style.opacity = '0.7';
  } else {
    initOsdSketch();
    document.getElementById('osd-sketch-toggle').textContent = 'sketch ✓';
    document.getElementById('osd-sketch-toggle').style.opacity = '1';
  }
});

export function initOsdSketch() {
  loadFabric(() => {
    const cvs = document.getElementById('osd-fabric-canvas');
    const container = document.getElementById('osd-container');
    cvs.style.display = '';
    cvs.style.pointerEvents = 'auto';
    cvs.width = container.offsetWidth;
    cvs.height = container.offsetHeight;
    cvs.style.width = container.offsetWidth + 'px';
    cvs.style.height = container.offsetHeight + 'px';

    _osdFabricCanvas = new fabric.Canvas('osd-fabric-canvas', {
      isDrawingMode: true,
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
    _osdFabricCanvas.freeDrawingBrush.color = '#ffffff';
    _osdFabricCanvas.freeDrawingBrush.width = 2;

    const toolbar = document.getElementById('osd-sketch-toolbar');
    toolbar.style.display = 'flex';

    setupFabricTools(_osdFabricCanvas, '.osd-sketch-tool', 'osd-sketch-clear', 'osd-sketch-export');

    document.getElementById('osd-sketch-close')?.addEventListener('click', () => {
      destroyOsdSketch();
      const _st = document.getElementById('osd-sketch-toggle');
      if (_st) { _st.textContent = 'sketch'; _st.style.opacity = '0.7'; }
    });
  });
}

export function destroyOsdSketch() {
  if (_osdFabricCanvas) {
    _osdFabricCanvas.dispose();
    _osdFabricCanvas = null;
  }
  const cvs = document.getElementById('osd-fabric-canvas');
  if (cvs) { cvs.style.display = 'none'; cvs.style.pointerEvents = 'none'; }
  const toolbar = document.getElementById('osd-sketch-toolbar');
  if (toolbar) toolbar.style.display = 'none';
}

document.getElementById('osd-close')?.addEventListener('click', closeDeepZoom);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('osd-modal').classList.contains('open')) {
    closeDeepZoom();
  }
});

export let threeScene      = null;
export let threeCamera     = null;
export let threeRenderer   = null;
export let threeControls   = null;
export let threeAnimId     = null;
export let threeMeshes     = [];   // { mesh, item } pairs for raycasting
export let threeRaycaster  = null;
export let threeMouse      = null; // initialised inside initThreeView once THREE is loaded
export let threeHovered    = null;

export function getThreeBg() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg').trim() || '#F7F5F2';
  return parseInt(raw.replace('#', '0x'));
}

export function getThreePosition(image, allImages) {
  const sharedCount = allImages.filter(other =>
    other.id !== image.id && other.tags.some(t => image.tags.includes(t))
  ).length;
  const angle  = Math.random() * Math.PI * 2;
  const radius = sharedCount > 1
    ? 2 + Math.random() * 2
    : 6 + Math.random() * 3;
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 4,
    Math.sin(angle) * radius
  );
}

export function initThreeView() {
  if (!threeMouse) threeMouse = new THREE.Vector2(-9999, -9999);
  const container = document.getElementById('three-canvas');
  container.innerHTML = '';
  threeMeshes = [];
  threeHovered = null;

  const items = STATE.selected.length ? STATE.selected : STATE.results.slice(0, STATE.imageCount);
  if (!items.length) {
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.innerHTML = '<p style="font-family:var(--font-display);font-size:18px;font-weight:300;font-style:italic;color:var(--ink-3);">select images first</p>';
    return;
  }

  const w = container.offsetWidth  || window.innerWidth  - 240;
  const h = container.offsetHeight || window.innerHeight;

  // Scene
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(getThreeBg());

  // Camera
  threeCamera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  threeCamera.position.set(0, 0, 12);

  // Renderer
  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  threeRenderer.setSize(w, h);
  container.appendChild(threeRenderer.domElement);

  // OrbitControls
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping    = true;
  threeControls.dampingFactor    = 0.05;
  threeControls.enablePan        = true;
  threeControls.mouseButtons     = {
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN,
  };

  // Raycaster
  threeRaycaster = new THREE.Raycaster();

  // Load each selected image as a textured plane
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  items.forEach(item => {
    const pos = getThreePosition(item, items);
    const tex = loader.load(item.thumb, tex => {
      // Adjust plane aspect to match image
      const aspect = tex.image.width / tex.image.height || 1;
      mesh.scale.set(aspect, 1, 1);
    });
    tex.crossOrigin = 'anonymous';

    const geo  = new THREE.PlaneGeometry(1.6, 1.6);
    const mat  = new THREE.MeshStandardMaterial({
      map:           tex,
      side:          THREE.DoubleSide,
      emissive:      new THREE.Color(0xffffff),
      emissiveMap:   tex,
      emissiveIntensity: 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    // Rotate slightly toward camera for visual interest
    mesh.lookAt(threeCamera.position);
    threeScene.add(mesh);
    threeMeshes.push({ mesh, item });
  });

  // Ambient + directional light (subtle — mostly emissive drives image appearance)
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  threeScene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(5, 5, 5);
  threeScene.add(dirLight);

  // Mouse move for hover — track on renderer canvas
  threeRenderer.domElement.addEventListener('mousemove', onThreeMouseMove);
  threeRenderer.domElement.addEventListener('click',     onThreeClick);

  // Resize observer
  const resizeObs = new ResizeObserver(() => {
    const nw = container.offsetWidth;
    const nh = container.offsetHeight;
    threeCamera.aspect = nw / nh;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(nw, nh);
  });
  resizeObs.observe(container);
  // Store so we can disconnect on dispose
  threeRenderer._resizeObs = resizeObs;

  // Animation loop
  function animate() {
    threeAnimId = requestAnimationFrame(animate);
    threeControls.update();

    // Hover highlight via emissiveIntensity lerp
    threeMeshes.forEach(({ mesh, item }) => {
      const target = (threeHovered && threeHovered.item.id === item.id) ? 0.3 : 0;
      mesh.material.emissiveIntensity += (target - mesh.material.emissiveIntensity) * 0.12;
    });

    threeRenderer.render(threeScene, threeCamera);
  }
  animate();
}

export function onThreeMouseMove(e) {
  const rect = threeRenderer.domElement.getBoundingClientRect();
  threeMouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  threeMouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

  threeRaycaster.setFromCamera(threeMouse, threeCamera);
  const hits = threeRaycaster.intersectObjects(threeMeshes.map(m => m.mesh));

  if (hits.length) {
    const hitMesh = hits[0].object;
    threeHovered = threeMeshes.find(m => m.mesh === hitMesh) || null;
    threeRenderer.domElement.style.cursor = 'pointer';
  } else {
    threeHovered = null;
    threeRenderer.domElement.style.cursor = 'default';
  }
}

export function onThreeClick() {
  if (!threeHovered) return;
  const { item } = threeHovered;
  // Add to selected if not already
  if (!STATE.selected.find(s => s.id === item.id)) {
    STATE.selected.push(item);
  }
  updatePanel();
}

export function disposeThreeView() {
  if (threeAnimId) {
    cancelAnimationFrame(threeAnimId);
    threeAnimId = null;
  }
  if (threeRenderer) {
    if (threeRenderer._resizeObs) threeRenderer._resizeObs.disconnect();
    threeRenderer.domElement.removeEventListener('mousemove', onThreeMouseMove);
    threeRenderer.domElement.removeEventListener('click',     onThreeClick);
    threeRenderer.dispose();
    const container = document.getElementById('three-canvas');
    if (threeRenderer.domElement.parentNode === container) {
      container.removeChild(threeRenderer.domElement);
    }
    threeRenderer = null;
  }
  if (threeControls) { threeControls.dispose(); threeControls = null; }
  threeMeshes.forEach(({ mesh }) => {
    mesh.geometry.dispose();
    if (mesh.material.map)         mesh.material.map.dispose();
    if (mesh.material.emissiveMap) mesh.material.emissiveMap.dispose();
    mesh.material.dispose();
  });
  threeMeshes  = [];
  threeHovered = null;
  threeScene   = null;
  threeCamera  = null;
}

console.log('[insposearch] Phase 6 — 3D View ready.');

/* ============================================================
   PHASE 7 — KEYS PANEL
============================================================ */

/* Source config — data-driven, order matches spec */

/* ── Source stats helper (self-updating from KEY_SOURCES) ── */
export function formatCount(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return String(n);
}

export function getSourceStats() {
  // Dedupe by source id so counts reflect real source inventory.
  const deduped = new Map();
  KEY_SOURCES
    .filter(s => !s.aiProvider)
    .forEach(s => deduped.set(s.id, s));
  const db = Array.from(deduped.values());
  const noKey = db.filter(s => s.alwaysOn);
  const withKey = db.filter(s => !s.alwaysOn);

  // Dynamic registry (Wikimedia cats, Archive.org collections, Europeana/DPLA providers)
  const dynNoKey  = DYNAMIC_REGISTRY.filter(s => !s.keyRequired);
  const dynAll    = DYNAMIC_REGISTRY;
  const dynNoKeyImages  = dynNoKey.reduce((a, s) => a + (s.imageCount || 50000), 0);
  const dynAllImages    = dynAll.reduce((a, s) =>  a + (s.imageCount || 50000), 0);

  // Total sources in the fetch engine (ALL_SOURCES + manifest + dynamic registry)
  const manifestActive = (STATE.manifestSources || []).length;
  const totalFetchSources = ALL_SOURCES.length + manifestActive + DYNAMIC_REGISTRY.length;
  return {
    totalSources:       db.length + DYNAMIC_REGISTRY.length,
    totalFetchSources:  totalFetchSources,
    noKeySources:       noKey.length,
    keySources:         withKey.length,
    totalImagesNoKey:   noKey.reduce((a, s) => a + (s.imageCount || 0), 0) + dynNoKeyImages,
    totalImagesWithKey: db.reduce((a, s) => a + (s.imageCount || 0), 0) + dynAllImages,
    allSources:         db,
  };
}

/* ── Onboarding controller ── */
(function initOnboarding() {
  const el        = document.getElementById('onboarding');
  const track     = document.getElementById('ob-track');
  const dotsBox   = document.getElementById('ob-dots');
  const prevBtn   = document.getElementById('ob-prev');
  const nextBtn   = document.getElementById('ob-next');
  const skipBtn   = document.getElementById('ob-skip');
  const startBtn  = document.getElementById('ob-start');
  const helpBtn   = document.getElementById('btn-help');
  const TOTAL     = track.children.length;
  let step        = 0;

  // build dot indicators
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('button');
    d.className = 'ob-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(d);
  }

  function goTo(n) {
    step = Math.max(0, Math.min(n, TOTAL - 1));
    track.style.transform = `translateX(-${step * 100}%)`;
    dotsBox.querySelectorAll('.ob-dot').forEach((d, i) =>
      d.classList.toggle('active', i === step));
    prevBtn.style.visibility = step === 0 ? 'hidden' : 'visible';
    nextBtn.style.display    = step === TOTAL - 1 ? 'none' : '';

    // animate stat counters when landing on step 3 (databases slide)
    if (step === 3) {
      document.querySelectorAll('#ob-stats-row [data-target]').forEach(el => {
        animateCount(el, Number(el.dataset.target));
      });
    }
  }

  function populateStats() {
    const s = getSourceStats();

    // Step 0 — hero statement slide
    const heroSrcEl = document.getElementById('ob-hero-src-count');
    const heroImgEl = document.getElementById('ob-hero-img-count');
    if (heroSrcEl) heroSrcEl.textContent = s.totalFetchSources.toLocaleString();
    if (heroImgEl) heroImgEl.textContent = formatCount(s.totalImagesNoKey);

    // Persistent top info bar
    const sibEl = document.getElementById('sib-text');
    if (sibEl) sibEl.textContent = `${s.totalFetchSources.toLocaleString()} sources · ${formatCount(s.totalImagesNoKey)} images available — add api keys to unlock ${formatCount(s.totalImagesWithKey)}`;

    // stats row (step 4)
    const statsRow = document.getElementById('ob-stats-row');
    const fetchCountEl = document.getElementById('ob-fetch-count');
    if (fetchCountEl) fetchCountEl.textContent = s.totalFetchSources;
    statsRow.innerHTML = `
      <div class="ob-stat">
        <div class="ob-stat-num" id="ob-fetch-count" data-target="${s.totalFetchSources}">0</div>
        <div class="ob-stat-label">sources</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalSources}">0</div>
        <div class="ob-stat-label">databases</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalImagesNoKey}">0</div>
        <div class="ob-stat-label">without keys</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalImagesWithKey}">0</div>
        <div class="ob-stat-label">with all keys</div>
      </div>
    `;

    // category grid (step 3)
    const catGrid = document.getElementById('ob-cat-grid');
    const cats = [
      { icon: '🏛', label: 'museums',      ids: SOURCE_GROUPS.museums },
      { icon: '📷', label: 'photography',   ids: SOURCE_GROUPS.photography },
      { icon: '🌿', label: 'nature',        ids: SOURCE_GROUPS.nature },
      { icon: '📜', label: 'historical',    ids: SOURCE_GROUPS.historical },
      { icon: '🎨', label: 'art & design',  ids: SOURCE_GROUPS.artdesign },
    ];
    catGrid.innerHTML = cats.map(c =>
      `<div class="ob-cat">
        <span>${c.icon}</span> ${c.label}
        <span class="ob-cat-count">${c.ids.length} sources</span>
      </div>`
    ).join('');

    // scrollable source list (step 3)
    const listEl = document.getElementById('ob-source-list');
    listEl.innerHTML = s.allSources.map(src =>
      `<div class="ob-src-item">
        <span>${src.name}${!src.alwaysOn ? '<span class="ob-src-key">key</span>' : ''}</span>
        <span class="ob-src-count">${src.imageCount ? formatCount(src.imageCount) : '—'}</span>
      </div>`
    ).join('');
  }

  function animateCount(el, target) {
    const dur = 1200;
    const start = performance.now();
    const fmt = n => {
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+';
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M+';
      return n.toLocaleString();
    };
    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.floor(target * ease));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  function show(prefillTerm = null, runGuidedSearch = false) {
    el.style.display = 'flex';
    el.classList.remove('hidden');
    step = 0;
    goTo(0);
    populateStats();

    if (prefillTerm) {
      const input = document.getElementById('search-input');
      if (input) input.value = prefillTerm;
    }
    STATE.pendingOnboardingSearch = !!runGuidedSearch;

    requestAnimationFrame(() => el.classList.add('visible'));
  }

  function close() {
    el.classList.remove('visible');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.add('hidden');
    }, 400);
    localStorage.setItem('inspo_onboarding_seen', '1');
    const input = document.getElementById('search-input');
    const q = (input?.value || '').trim();
    if (STATE.pendingOnboardingSearch && q && (q.toLowerCase() !== (STATE.query || '').toLowerCase() || !STATE.results.length)) {
      runSearch(q);
    }
    STATE.pendingOnboardingSearch = false;
    if (input) input.focus();
  }

  // nav events
  nextBtn.addEventListener('click', () => goTo(step + 1));
  prevBtn.addEventListener('click', () => goTo(step - 1));
  skipBtn.addEventListener('click', close);
  startBtn.addEventListener('click', close);
  helpBtn.addEventListener('click', () => show());

  // "Guided Tour" buttons — close onboarding slides, launch walkthrough tooltips
  el.querySelectorAll('.ob-guided-tour').forEach(btn => {
    btn.addEventListener('click', () => {
      close();
      startGuidedTour();
    });
  });

  // Click outside .ob-inner closes onboarding
  el.addEventListener('click', e => {
    if (e.target === el) close();
  });

  // keyboard nav
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); goTo(step + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(step - 1); }
    if (e.key === 'Escape')     close();
  });

  // Touch swipe nav for onboarding
  (function installOnboardingSwipe() {
    let sx = 0, sy = 0;
    const inner = document.querySelector('.ob-inner') || el;
    inner.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    inner.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        dx < 0 ? goTo(step + 1) : goTo(step - 1);
      }
    }, { passive: true });
  })();

  // expose for init check
  window._showOnboarding = show;
  window._refreshOnboardingStats = populateStats;
})();

/* ── Guided Tour — lightweight step-through tooltips ── */
function startGuidedTour() {
  const TOUR_STEPS = [
    { target: 'search-input',   label: 'search bar',       text: 'type anything — a word, a feeling, a color. results stream in from every source at once.' },
    { target: 'image-grid',     label: 'image grid',        text: 'click any image to open the preview panel. ctrl+click (⌘+click on mac) to select multiple for the floating toolbar.' },
    { target: 'btn-advanced',   label: 'advanced search',   text: 'filter by date range, medium, orientation, region, source category, and precise hex colors.' },
    { target: 'sidebar',        label: 'sidebar',           text: 'toggle sources on/off, search by color, adjust image count, and manage api keys.' },
    { target: 'btn-board',      label: 'board mode',        text: 'switch to board view — drag, arrange, and export a collection that lives in your browser.' },
    { target: 'btn-help',       label: 'help',              text: 'reopen the onboarding slides anytime from this button.' },
  ];

  let current = 0;
  let overlay = null;
  let tipEl = null;

  function cleanup() {
    if (tipEl) { tipEl.remove(); tipEl = null; }
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function showStep(i) {
    cleanup();
    if (i >= TOUR_STEPS.length) return;
    current = i;
    const step = TOUR_STEPS[i];
    const target = document.getElementById(step.target);
    if (!target) { showStep(i + 1); return; }

    // Light overlay
    overlay = document.createElement('div');
    overlay.className = 'guided-overlay';
    overlay.addEventListener('click', () => { cleanup(); });
    document.body.appendChild(overlay);

    // Bring target above overlay
    const origZ = target.style.zIndex;
    const origPos = target.style.position;
    target.style.zIndex = '10600';
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

    // Tooltip
    tipEl = document.createElement('div');
    tipEl.className = 'guided-tip';
    tipEl.innerHTML = `
      <div class="guided-tip-label">${step.label}</div>
      <div>${step.text}</div>
      <span class="guided-tip-counter">${i + 1} / ${TOUR_STEPS.length}</span>
      <button class="guided-tip-dismiss">${i < TOUR_STEPS.length - 1 ? 'next →' : 'done'}</button>
    `;
    document.body.appendChild(tipEl);

    // Position below target
    const rect = target.getBoundingClientRect();
    let top = rect.bottom + 10;
    let left = Math.max(10, Math.min(window.innerWidth - 270, rect.left));
    // If below viewport, show above
    if (top + 100 > window.innerHeight) top = Math.max(10, rect.top - tipEl.offsetHeight - 10);
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';

    requestAnimationFrame(() => tipEl.classList.add('visible'));

    const dismiss = tipEl.querySelector('.guided-tip-dismiss');
    dismiss.addEventListener('click', () => {
      target.style.zIndex = origZ;
      target.style.position = origPos;
      cleanup();
      showStep(i + 1);
    });

    // Escape to exit tour
    const onKey = e => {
      if (e.key === 'Escape') {
        target.style.zIndex = origZ;
        target.style.position = origPos;
        cleanup();
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);
  }

  showStep(0);
}

/* Persistent top info bar — updated on load & after dynamic discovery */
export function updateInfoBar() {
  const sibEl = document.getElementById('sib-text');
  if (!sibEl) return;
  const s = getSourceStats();
  sibEl.textContent = `${s.totalFetchSources.toLocaleString()} sources · ${formatCount(s.totalImagesNoKey)} images available`;
}
updateInfoBar();

/* API status badge + dropdown on info bar */
export function updateApiStatus() {
  const badge = document.getElementById('sib-api-badge');
  const countEl = document.getElementById('sib-api-count');
  const listEl = document.getElementById('sib-dd-list');
  if (!badge || !listEl) return;

  // Gather all key-required (non-AI) sources
  const keyed = KEY_SOURCES.filter(s => !s.alwaysOn && !s.aiProvider && s.getKeyUrl);
  const missing = keyed.filter(s => !STATE[s.stateKey]);
  const connected = keyed.filter(s => !!STATE[s.stateKey]);
  const allDone = missing.length === 0;

  // Badge appearance
  badge.classList.toggle('all-connected', allDone);
  countEl.textContent = allDone ? '✓' : `${missing.length}`;

  // Build dropdown rows
  listEl.innerHTML = '';
  // Missing first
  missing.forEach(src => {
    const row = document.createElement('div');
    row.className = 'sib-dd-row';
    row.innerHTML = `<span class="sib-dd-name">${src.name}</span>` +
      `<span class="sib-dd-status missing">not set</span>` +
      `<a class="sib-dd-link" href="${src.getKeyUrl}" target="_blank" rel="noopener noreferrer">get key ↗</a>`;
    listEl.appendChild(row);
  });
  // Connected after
  connected.forEach(src => {
    const row = document.createElement('div');
    row.className = 'sib-dd-row connected';
    row.innerHTML = `<span class="sib-dd-name">${src.name}</span>` +
      `<span class="sib-dd-status active">✓ active</span>` +
      `<a class="sib-dd-link" href="${src.getKeyUrl}" target="_blank" rel="noopener noreferrer">manage ↗</a>`;
    listEl.appendChild(row);
  });

  // If all connected show a congrats line
  if (allDone && listEl.children.length) {
    const note = document.createElement('div');
    note.style.cssText = 'padding:8px 12px;font-size:9px;color:#4a9;letter-spacing:0.04em;';
    note.textContent = 'all database keys connected — full access unlocked';
    listEl.prepend(note);
  }
}

// Toggle dropdown
(function initApiDropdown() {
  const badge = document.getElementById('sib-api-badge');
  const dd = document.getElementById('sib-api-dropdown');
  if (!badge || !dd) return;
  badge.addEventListener('click', e => {
    e.stopPropagation();
    dd.classList.toggle('hidden');
  });
  document.addEventListener('click', e => {
    if (!dd.contains(e.target) && e.target !== badge) dd.classList.add('hidden');
  });
})();
updateApiStatus();

/* Track DOM refs for badge/input per source */
export const keyRowRefs = {};

export function updateKeysDot() {
  const anySet = KEY_SOURCES
    .filter(s => !s.alwaysOn)
    .some(s => STATE[s.stateKey]);
  document.getElementById('keys-dot').style.display = anySet ? 'inline-block' : 'none';
  if (typeof updateApiStatus === 'function') updateApiStatus();
}

export function setAIProvider(p) {
  STATE.aiProvider = p;
  localStorage.setItem('inspo_ai_provider', p);
  document.querySelectorAll('.ai-provider-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.provider === p);
  });
  const badge = document.getElementById('chat-provider-badge');
  if (badge) badge.textContent = p;
}

export function buildKeyRows() {
  const container = document.getElementById('keys-rows-container');
  container.innerHTML = '';

  // ── AI PROVIDER section (always at top) ──
  const aiSources = KEY_SOURCES.filter(s => s.aiProvider);
  const dbSources = KEY_SOURCES.filter(s => !s.aiProvider);

  const aiLabel = document.createElement('div');
  aiLabel.className = 'section-label';
  aiLabel.style.marginBottom = '4px';
  aiLabel.textContent = 'ai vision provider';
  container.appendChild(aiLabel);

  const aiHint = document.createElement('div');
  aiHint.className = 'keys-panel-subheader';
  aiHint.style.cssText = 'margin:-2px 0 8px;font-size:9px;';
  aiHint.textContent = 'for optimal results use vision-enabled models (gemini, gpt-4o, llava, claude sonnet)';
  container.appendChild(aiHint);

  const pills = document.createElement('div');
  pills.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;';
  ['gemini', 'claude', 'openai', 'ollama'].forEach(p => {
    const pill = document.createElement('button');
    pill.className = 'btn ai-provider-pill' + (STATE.aiProvider === p ? ' active' : '');
    pill.dataset.provider = p;
    pill.textContent = p;
    pill.addEventListener('click', () => setAIProvider(p));
    pills.appendChild(pill);
  });
  container.appendChild(pills);

  // Render AI source rows
  aiSources.forEach(src => buildSourceRow(container, src));

  // ── DATABASE SOURCES section ──
  const dbDivider = document.createElement('div');
  dbDivider.className = 'divider';
  dbDivider.style.margin = '14px 0 8px';
  container.appendChild(dbDivider);
  const dbLabel = document.createElement('div');
  dbLabel.className = 'section-label';
  dbLabel.style.marginBottom = '6px';
  dbLabel.textContent = 'databases';
  container.appendChild(dbLabel);

  dbSources.forEach(src => buildSourceRow(container, src));

  // re-apply view filter after rebuild
  applySourceFilter();
}
hooks.buildKeyRows = buildKeyRows;

export function buildSourceRow(container, src) {
    const row = document.createElement('div');
    row.className = 'key-source-row';
    row.dataset.sourceId = src.id;

    // --- top row ---
    const top = document.createElement('div');
    top.className = 'key-source-top';

    const name = document.createElement('span');
    name.className = 'key-source-name';
    name.textContent = '';
    name.appendChild(createSourceIdentity(src.toggleId || src.id, src.name));

    const isActive = src.alwaysOn || Boolean(src.stateKey && STATE[src.stateKey]);
    const badge = document.createElement('span');
    const badgeActive = src.isOllama ? (STATE.aiProvider === 'ollama') : isActive;
    badge.className = 'key-status-badge ' + (badgeActive ? 'badge-active' : 'badge-inactive') + (src.cors ? ' badge-cors' : '');
    if (src.isOllama) {
      badge.textContent = STATE.aiProvider === 'ollama' ? '\u2713 ' + (STATE.ollamaModel || 'llava') : 'click to configure';
    } else {
      badge.textContent = isActive ? (src.cors ? '\u2713 active (cors)' : '\u2713 active') : 'not set';
    }
    if (src.cors) badge.title = 'May be blocked on some networks';

    // Source toggle button (left of name) — only for sources in ALL_SOURCES
    const toggleId = src.toggleId || src.id;
    if (ALL_SOURCES.includes(toggleId)) {
      const isDisabled = STATE.disabledSources.has(toggleId);
      if (isDisabled) row.classList.add('source-disabled');
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'source-toggle' + (isDisabled ? '' : ' enabled');
      toggleBtn.textContent = isDisabled ? '○' : '●';
      toggleBtn.title = isDisabled ? 'click to enable' : 'click to disable';
      toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleSource(toggleId);
        buildKeyRows();
      });
      top.appendChild(toggleBtn);
    }

    top.appendChild(name);
    top.appendChild(badge);

    if (src.getKeyUrl) {
      const link = document.createElement('a');
      link.className = 'key-get-link';
      link.textContent = src.isOllama ? '\u2197 download' : '\u2197 get key';
      link.href = src.getKeyUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.addEventListener('click', e => e.stopPropagation());
      top.appendChild(link);
    }

    // --- description ---
    const desc = document.createElement('div');
    desc.className = 'key-source-desc';
    desc.textContent = src.desc;

    row.appendChild(top);
    row.appendChild(desc);

    // --- input row (key-required, alwaysOn with optional upgrade key, or Ollama config) ---
    let inputRow = null;
    let inputEl = null;
    if (!src.alwaysOn || src.optionalKey || src.isOllama) {
      inputRow = document.createElement('div');
      inputRow.className = 'key-source-input-row';

      if (src.isOllama) {
        // Ollama: endpoint + model name inputs (no API key needed)
        const epInput = document.createElement('input');
        epInput.type = 'text';
        epInput.className = 'key-source-input';
        epInput.placeholder = 'endpoint — default: http://localhost:11434';
        epInput.autocomplete = 'off';
        epInput.value = STATE.ollamaEndpoint !== 'http://localhost:11434' ? STATE.ollamaEndpoint : '';
        epInput.style.marginBottom = '4px';

        const modelInput = document.createElement('input');
        modelInput.type = 'text';
        modelInput.className = 'key-source-input';
        modelInput.placeholder = 'model name — default: llava (vision-enabled)';
        modelInput.autocomplete = 'off';
        modelInput.value = STATE.ollamaModel !== 'llava' ? STATE.ollamaModel : '';

        const saveOllama = () => {
          const ep = epInput.value.trim() || 'http://localhost:11434';
          const model = modelInput.value.trim() || 'llava';
          STATE.ollamaEndpoint = ep;
          STATE.ollamaModel = model;
          localStorage.setItem('inspo_ollama_endpoint', ep);
          localStorage.setItem('inspo_ollama_model', model);
          setAIProvider('ollama');
          badge.className = 'key-status-badge badge-active';
          badge.textContent = '\u2713 ' + model;
        };

        epInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); saveOllama(); } });
        modelInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); saveOllama(); } });

        inputRow.appendChild(epInput);
        inputRow.appendChild(modelInput);
        inputEl = epInput;

        // Click row → toggle config visibility
        row.addEventListener('click', () => {
          inputRow.classList.toggle('visible');
          if (inputRow.classList.contains('visible')) epInput.focus();
        });

      } else if (src.artsyDual) {
        // Two-field input: client_id + client_secret
        const idInput = document.createElement('input');
        idInput.type = 'password';
        idInput.className = 'key-source-input';
        idInput.placeholder = 'client_id — press enter';
        idInput.autocomplete = 'off';
        idInput.style.marginBottom = '4px';

        const secretInput = document.createElement('input');
        secretInput.type = 'password';
        secretInput.className = 'key-source-input';
        secretInput.placeholder = 'client_secret — press enter';
        secretInput.autocomplete = 'off';

        const saveArtsy = () => {
          const id  = idInput.value.trim();
          const sec = secretInput.value.trim();
          if (!id || !sec) return;
          STATE.artsyId     = id;
          STATE.artsySecret = sec;
          STATE.artsyToken  = null; // reset cached token
          localStorage.setItem('inspo_artsy_id',     id);
          localStorage.setItem('inspo_artsy_secret', sec);
          idInput.value = '';
          secretInput.value = '';
          inputRow.classList.remove('visible');
          badge.className = 'key-status-badge badge-active';
          badge.textContent = '\u2713 active';
          updateKeysDot();
        };

        idInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); saveArtsy(); } });
        secretInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); saveArtsy(); } });

        badge.addEventListener('click', e => {
          e.stopPropagation();
          if (!STATE.artsyId) return;
          if (!confirm('clear Artsy credentials?')) return;
          STATE.artsyId = null; STATE.artsySecret = null; STATE.artsyToken = null;
          localStorage.removeItem('inspo_artsy_id');
          localStorage.removeItem('inspo_artsy_secret');
          badge.className = 'key-status-badge badge-inactive';
          badge.textContent = 'not set';
          inputRow.classList.remove('visible');
          updateKeysDot();
        });

        row.addEventListener('click', () => {
          inputRow.classList.toggle('visible');
          if (inputRow.classList.contains('visible')) idInput.focus();
        });

        inputRow.appendChild(idInput);
        inputRow.appendChild(secretInput);
        inputEl = idInput; // ref for keyRowRefs

      } else {
        inputEl = document.createElement('input');
        inputEl.type = 'password';
        inputEl.className = 'key-source-input';
        inputEl.placeholder = src.placeholder || 'paste key and press enter';
        inputEl.autocomplete = 'off';

        inputRow.appendChild(inputEl);

        // Optional: endpoint input for OpenAI-compatible sources
        if (src.hasEndpoint) {
          const epInput = document.createElement('input');
          epInput.type = 'text';
          epInput.className = 'key-source-input';
          epInput.placeholder = 'endpoint url (optional — for self-hosted / Ollama)';
          epInput.autocomplete = 'off';
          epInput.style.marginTop = '4px';
          if (STATE.openaiEndpoint) epInput.value = STATE.openaiEndpoint;
          epInput.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const val = epInput.value.trim();
            STATE.openaiEndpoint = val;
            localStorage.setItem('inspo_openai_endpoint', val);
            e.stopPropagation();
          });
          inputRow.appendChild(epInput);
        }

        // Save on Enter
        inputEl.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          const val = inputEl.value.trim();
          if (!val) return;
          STATE[src.stateKey] = val;
          localStorage.setItem(src.storageKey, val);
          inputEl.value = '';
          inputRow.classList.remove('visible');
          badge.className = 'key-status-badge badge-active';
          badge.textContent = '\u2713 active';
          updateKeysDot();
          // Reset health so source is no longer paused after adding key
          if (STATE.sourceHealth[src.id]) {
            STATE.sourceHealth[src.id].misses = 0;
            STATE.sourceHealth[src.id]._notified = false;
          }
          // Also reset health for sub-sources (e.g. euro_* when europeana key is added)
          Object.keys(STATE.sourceHealth).forEach(k => {
            if (k.startsWith(src.id + '_')) {
              STATE.sourceHealth[k].misses = 0;
              STATE.sourceHealth[k]._notified = false;
            }
          });
          // If it's the Gemini key, update the counter UI
          if (src.stateKey === 'geminiKey') {
            document.getElementById('no-key-note').textContent = '';
            updateGeminiCounterUI();
          }
          // Auto-select this provider when key is entered
          if (src.aiProvider) setAIProvider(src.id);
          e.stopPropagation();
        });

        // Click badge when active → confirm clear
        badge.addEventListener('click', e => {
          e.stopPropagation();
          if (!STATE[src.stateKey]) return;
          if (!confirm(`clear ${src.name} key?`)) return;
          STATE[src.stateKey] = null;
          localStorage.removeItem(src.storageKey);
          badge.className = 'key-status-badge badge-inactive';
          badge.textContent = 'not set';
          inputRow.classList.remove('visible');
          updateKeysDot();
          if (src.stateKey === 'geminiKey') {
            document.getElementById('panel-ai-tags').style.display = 'none';
            document.getElementById('no-key-note').textContent = 'no key — add gemini key for vision';
          }
          // If we just cleared the active provider key, fall back to gemini
          if (src.aiProvider && STATE.aiProvider === src.id) {
            setAIProvider('gemini');
          }
        });

        // Click row body → toggle input visibility
        row.addEventListener('click', () => {
          if (src.alwaysOn && !src.optionalKey) return;
          inputRow.classList.toggle('visible');
          if (inputRow.classList.contains('visible')) inputEl.focus();
        });
      }

      row.appendChild(inputRow);
    }

    keyRowRefs[src.id] = { badge, inputRow, inputEl };
    container.appendChild(row);
}

/* Build rows on load */
buildKeyRows();
updateKeysDot();
updatePresetButtons();

/* Show onboarding on first visit — no auto-search, just show the homepage */
if (!localStorage.getItem('inspo_onboarding_seen')) {
  window._showOnboarding(undefined, true);
}

/* Preset buttons event delegation */
document.getElementById('source-presets')?.addEventListener('click', e => {
  const btn = e.target.closest('.preset-btn');
  if (btn) applyPreset(btn.dataset.preset);
});

/* Phase 2: view filter pill event delegation */
export const viewFiltersEl = document.getElementById('source-view-filters');
if (viewFiltersEl) {
  viewFiltersEl.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    setSourceViewFilter(pill.dataset.filter, pill.dataset.value);
  });
}

/* Gemini usage counter element — injected after Gemini row */
(function() {
  const geminiRow = document.querySelector('[data-source-id="gemini"]');
  if (geminiRow) {
    const counter = document.createElement('div');
    counter.id = 'gemini-usage-counter';
    counter.style.cssText = 'font-family:var(--font-ui);font-size:9px;letter-spacing:0.06em;color:var(--ink-3);margin-top:4px;padding:0 0 4px 0;';
    geminiRow.appendChild(counter);
    updateGeminiCounterUI();
  }
})();

/* Export keys */
document.getElementById('btn-export-keys')?.addEventListener('click', () => {
  const KEY_LIST = [
    'inspo_gemini_key', 'inspo_claude_key', 'inspo_openai_key', 'inspo_openai_endpoint',
    'inspo_ollama_endpoint', 'inspo_ollama_model',
    'inspo_ai_provider', 'inspo_rijks_key', 'inspo_europeana_key',
    'inspo_harvard_key', 'inspo_smithsonian_key', 'inspo_pexels_key',
    'inspo_pixabay_key', 'inspo_trove_key', 'inspo_digitalnz_key',
    'inspo_dpla_key', 'inspo_ddb_key', 'inspo_artsy_id', 'inspo_artsy_secret',
    'inspo_unsplash_key',
  ];
  const keys = {};
  KEY_LIST.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) keys[k] = v;
  });
  const blob = new Blob([JSON.stringify(keys, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'insposearch-keys.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

/* Import keys */
document.getElementById('btn-import-keys')?.addEventListener('click', () => {
  document.getElementById('keys-import-input')?.click();
});

document.getElementById('keys-import-input')?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data !== 'object' || Array.isArray(data)) return;
      Object.entries(data).forEach(([k, v]) => {
        if (typeof k === 'string' && k.startsWith('inspo_') && typeof v === 'string') {
          localStorage.setItem(k, v);
        }
      });
      // Reload all keys into STATE
      STATE.geminiKey      = localStorage.getItem('inspo_gemini_key')      || null;
      STATE.claudeKey      = localStorage.getItem('inspo_claude_key')      || null;
      STATE.openaiKey      = localStorage.getItem('inspo_openai_key')      || null;
      STATE.openaiEndpoint = localStorage.getItem('inspo_openai_endpoint') || '';
      STATE.ollamaEndpoint = localStorage.getItem('inspo_ollama_endpoint') || 'http://localhost:11434';
      STATE.ollamaModel    = localStorage.getItem('inspo_ollama_model')    || 'llava';
      STATE.aiProvider     = localStorage.getItem('inspo_ai_provider')     || 'gemini';
      STATE.europeanaKey   = localStorage.getItem('inspo_europeana_key')   || null;
      STATE.harvardKey     = localStorage.getItem('inspo_harvard_key')     || null;
      STATE.smithsonianKey = localStorage.getItem('inspo_smithsonian_key') || null;
      STATE.pexelsKey      = localStorage.getItem('inspo_pexels_key')      || null;
      STATE.pixabayKey     = localStorage.getItem('inspo_pixabay_key')     || null;
      STATE.flickrKey      = localStorage.getItem('inspo_flickr_key')      || null;
      STATE.troveKey       = localStorage.getItem('inspo_trove_key')       || null;
      STATE.digitalnzKey   = localStorage.getItem('inspo_digitalnz_key')   || null;
      STATE.ddbKey          = localStorage.getItem('inspo_ddb_key')          || null;
      // Refresh panel badges
      buildKeyRows();
      updateKeysDot();
    } catch (err) {
      console.warn('insposearch: failed to import keys:', err.message);
    }
    // Reset input so same file can be re-imported
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* Panel open / close */
document.getElementById('btn-keys')?.addEventListener('click', () => {
  document.getElementById('keys-panel')?.classList.toggle('open');
  document.getElementById('settings-panel')?.classList.remove('open');
});

document.getElementById('keys-panel-close')?.addEventListener('click', () => {
  document.getElementById('keys-panel')?.classList.remove('open');
});

/* Gemini no-key note initial state */
document.getElementById('no-key-note').textContent =
  (STATE.geminiKey || STATE.claudeKey || STATE.openaiKey) ? '' : 'no key — add an ai key for vision';

console.log('[insposearch] Phase 7 — Keys Panel ready.');

/* ============================================================
   PHASE 8 — GEMINI INTEGRATION
============================================================ */

/* -- Convert image URL to base64 for Gemini inline_data -- */
export async function urlToBase64(url) {
  // Strategy 1: direct fetch with CORS mode
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // Strategy 2: draw image to canvas and export as base64
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(img.naturalWidth, 200);
          canvas.height = Math.round(
            img.naturalHeight * (canvas.width / img.naturalWidth)
          );
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl.split(',')[1]);
        } catch (canvasErr) {
          reject(canvasErr);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}

/* -- analyzeWithGemini: AI vision tagging — routes to active provider -- */
export async function analyzeWithGemini(item) {
  const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  if (!hasKey) { console.warn('[ai] no key'); return []; }

  // Check in-memory cache
  if (item.aiTags && item.aiTags.length > 0) return item.aiTags;

  // Check localStorage cache
  const cached = getAITagsCache(item.id);
  if (cached) { item.aiTags = cached; return cached; }

  // Gemini daily limit check
  if ((STATE.aiProvider || 'gemini') === 'gemini' && STATE.geminiDailyCount >= 1500) {
    renderAiSection(null, 'daily limit reached — resets at midnight');
    return [];
  }

  // Per-minute rate limit check
  if ((STATE.aiProvider || 'gemini') === 'gemini' && isGeminiRateLimited()) {
    renderAiSection(null, 'rate limited — too many requests, wait a moment');
    return [];
  }

  // Rate limiting — minimum 2000ms between calls
  const elapsed = Date.now() - (STATE.lastGeminiCall || 0);
  if (elapsed < 2000) await sleep(2000 - elapsed);
  STATE.lastGeminiCall = Date.now();

  try {
    const b64      = await urlToBase64(item.thumb);
    const mimeType = item.thumb.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const prompt   = 'List 8 visual and conceptual tags for this image. Focus on: mood, texture, color palette name, era, style, emotion, material, and composition. Return only a JSON array of strings. No other text.';

    const text = await callAI(prompt, b64, mimeType);

    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const fixed = clean.endsWith(']') ? clean : clean.replace(/,?\s*"[^"]*$/, '') + ']';
      const tags  = JSON.parse(fixed);
      const result = Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : [];
      if (result.length) {
        setAITagsCache(item.id, result);
        item.aiTags = result;
        if ((STATE.aiProvider || 'gemini') === 'gemini') incrementGeminiCounter();
      }
      return result;
    } catch (parseErr) {
      console.warn('[ai] parse failed:', parseErr.message, text);
      renderAiSection(null, 'AI analysis failed — showing metadata tags');
      return [];
    }
  } catch (err) {
    console.error('[ai] caught error:', err.name, err.message, err);
    if (err.message?.includes('tainted') || err.message?.includes('cross-origin') || err.message?.includes('CORS')) {
      renderAiSection(null, 'AI unavailable — image blocked by CORS. Try a Met image.');
    } else if (err.message?.includes('no ai key')) {
      renderAiSection(null, 'no key — add an AI key in api keys panel');
    } else {
      renderAiSection(null, `AI error: ${err.message || 'unavailable'}`);
    }
    return [];
  }
}

/* -- Render AI tags section in panel -- */
export function renderAiSection(tags, errorMsg) {
  const section   = document.getElementById('panel-ai-tags');
  const container = document.getElementById('ai-tags-container');
  container.innerHTML = '';

  if (errorMsg) {
    section.style.display = 'block';
    const errSpan = document.createElement('span');
    errSpan.style.cssText = 'font-family:var(--font-ui);font-size:10px;color:var(--ink-3);';
    errSpan.textContent = errorMsg;
    container.appendChild(errSpan);
    return;
  }

  if (!tags || !tags.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  tags.forEach(tag => {
    const pill = document.createElement('button');
    pill.className = 'tag ai';
    pill.textContent = tag;
    pill.addEventListener('click', () => {
      document.getElementById('search-input').value = tag;
      runSearch(tag);
    });
    container.appendChild(pill);
  });
}

/* -- Trigger AI analysis for latest selected item -- */
export async function runGeminiOnSelected() {
  const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  if (!hasKey || !STATE.selected.length) return;
  const item = STATE.selected[STATE.selected.length - 1];

  // Already have AI tags for this item
  if (item.aiTags && item.aiTags.length) {
    document.getElementById('analyse-section').style.display = 'none';
    renderAiSection(item.aiTags);
    return;
  }

  // Show loading state in button
  const analyseSection = document.getElementById('analyse-section');
  const analyseBtn     = document.getElementById('analyse-btn');
  const analyseLabel   = document.getElementById('analyse-btn-label');
  if (analyseBtn)   { analyseBtn.disabled = true; }
  if (analyseLabel) { analyseLabel.textContent = 'analysing…'; }

  const tags = await analyzeWithGemini(item);
  item.aiTags = tags;

  // Hide button section — results (or error) shown in panel-ai-tags
  if (analyseSection) analyseSection.style.display = 'none';

  if (tags.length) {
    renderAiSection(tags);
  } else {
    // analyzeWithGemini already rendered the error — re-enable button for retry
    if (analyseBtn) analyseBtn.disabled = false;
    if (analyseLabel) analyseLabel.textContent = 'retry analysis';
    if (analyseSection) analyseSection.style.display = '';
  }
}

/* -- Patch updatePanel to also trigger Gemini when key present -- */

/* -- updateAnalyseButton: controls #analyse-section visibility and state -- */
export function updateAnalyseButton(item) {
  const section = document.getElementById('analyse-section');
  const btn     = document.getElementById('analyse-btn');
  const label   = document.getElementById('analyse-btn-label');
  if (!section || !btn || !item) return;

  // Reset button state
  btn.disabled = false;
  if (label) label.textContent = 'analyse with ai';

  // If cached or already analysed: show results directly, hide button
  const cached = getAITagsCache(item.id);
  if (cached && cached.length) {
    section.style.display = 'none';
    renderAiSection(cached);
    return;
  }
  if (item.aiTags && item.aiTags.length) {
    section.style.display = 'none';
    renderAiSection(item.aiTags);
    return;
  }

  // No results yet — show the button
  document.getElementById('panel-ai-tags').style.display = 'none';
  section.style.display = '';
  const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
  if (!hasAiKey) {
    btn.disabled = true;
    btn.title = 'add an ai key to unlock';
  } else {
    btn.title = '';
  }
}

/* ============================================================
   PHASE 8 — POLISH
============================================================ */

// Ensure panel sections have correct initial visibility
document.getElementById('panel-colors').style.display  = 'none';
document.getElementById('panel-tags').style.display    = 'none';
document.getElementById('panel-related').style.display = 'none';
document.getElementById('panel-ai-tags').style.display = 'none';
// no-key-note text was set in Phase 7 keys panel init — do not override here

// Pulse the search input border-bottom to accent on focus (already in CSS)
// Ensure label text stays lowercase in all states
document.querySelectorAll('.btn').forEach(b => {
  b.addEventListener('focus', () => b.style.outline = 'none');
});

// Keep canvas opacity reset if it somehow gets stuck (e.g. rapid clicks)
document.getElementById('canvas')?.addEventListener('transitionend', e => {
  if (e.propertyName === 'opacity' && e.target.style.opacity === '0') {
    // Safety net: never leave canvas invisible longer than 400ms
  }
});

// On window resize, keep Three.js renderer in sync
// (ResizeObserver handles it per-renderer — this is a belt-and-suspenders
//  fallback for the canvas element reference)
window.addEventListener('resize', () => {
  if (STATE.view === '3d' && threeRenderer && threeCamera) {
    const c  = document.getElementById('three-canvas');
    const nw = c.offsetWidth;
    const nh = c.offsetHeight;
    threeCamera.aspect = nw / nh;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(nw, nh);
  }
});

// Reflect dark-mode changes in Three.js background
export function syncThreeBg() {
  if (threeScene) threeScene.background = new THREE.Color(getThreeBg());
}
document.getElementById('theme-toggle')?.addEventListener('click', syncThreeBg);

// Auto-focus search input on load
document.getElementById('search-input').focus();

console.log('[insposearch] Phase 8 — Gemini Integration ready.');

/* ============================================================
   PHASE 3B — AI CHAT PANEL
============================================================ */
(function initChatPanel() {
  const CHAT_STARTERS = q => [
    `what visual connections exist in these results?`,
    `suggest 5 unexpected directions for "${q || 'this search'}"`,
    `what art movements or historical periods are represented?`,
    `find something surprising — what am I missing?`,
    `I'm building a moodboard — what should I add to deepen it?`,
  ];

  function getChatSystemPrompt(meta) {
    const sources = (meta.activeSources || []).join(', ') || 'multiple sources';
    const sel = (meta.selectedImages || []).map(s => `"${s.title}" (${s.source})`).join(', ');
    return `You are a visual research assistant inside InspoSearch, a multi-source creative research tool. ` +
      `The user is searching for "${meta.searchTerm || 'unknown'}". ` +
      `The grid shows ${meta.imageCount || 0} images from ${meta.sourceCount || 0} sources (${sources}). ` +
      (sel ? `Selected: ${sel}. ` : '') +
      `Be a concise creative research partner — not a chatbot. ` +
      `When suggesting searches, wrap each term in double square brackets: [[term here]]. ` +
      `Keep responses to 2-4 sentences, then list search suggestions as [[pills]].`;
  }

  function renderChatEmpty() {
    const el = document.getElementById('chat-messages');
    el.innerHTML = '';
    const q = STATE.query || '';
    const wrap = document.createElement('div');
    wrap.className = 'chat-empty';
    const label = document.createElement('div');
    label.className = 'chat-empty-label';
    label.textContent = 'ask anything about your search';
    wrap.appendChild(label);
    CHAT_STARTERS(q).forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'chat-starter';
      btn.textContent = s;
      btn.addEventListener('click', () => sendChatMessage(s));
      wrap.appendChild(btn);
    });
    el.appendChild(wrap);
  }

  function appendChatMessage(role, content) {
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.querySelector('.chat-empty')?.remove();
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;

    const label = document.createElement('div');
    label.className = 'chat-msg-label';
    label.textContent = role === 'user' ? 'you' : (STATE.aiProvider || 'gemini');
    msg.appendChild(label);

    if (role === 'assistant') {
      // Strip [[pills]] from body text, collect them
      const pills = [];
      const re = /\[\[([^\]]+)\]\]/g;
      let m;
      while ((m = re.exec(content)) !== null) pills.push(m[1]);
      const cleanText = content.replace(/\[\[([^\]]+)\]\]/g, '').trim();

      const body = document.createElement('div');
      body.textContent = cleanText;
      msg.appendChild(body);

      if (pills.length) {
        const pillRow = document.createElement('div');
        pillRow.className = 'chat-pills';
        pills.forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'chat-pill';
          btn.textContent = p;
          btn.addEventListener('click', () => {
            document.getElementById('search-input').value = p;
            runSearch(p);
          });
          pillRow.appendChild(btn);
        });
        msg.appendChild(pillRow);
      }
    } else {
      const body = document.createElement('div');
      body.textContent = content;
      msg.appendChild(body);
    }

    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendChatMessage(text) {
    if (!text?.trim()) return;
    document.getElementById('chat-input').value = '';
    appendChatMessage('user', text);
    STATE.chatHistory.push({ role: 'user', content: text });
    // Keep chatHistory bounded — preserve the first message (context) and trim oldest middle entries
    if (STATE.chatHistory.length > CONSTANTS.MAX_CHAT_HISTORY) {
      STATE.chatHistory = [STATE.chatHistory[0], ...STATE.chatHistory.slice(-(CONSTANTS.MAX_CHAT_HISTORY - 1))];
    }

    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'chat-thinking';
    thinkingEl.textContent = '…';
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.appendChild(thinkingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const snap    = STATE.chatSnapshot;
      const meta    = snap?.metadata || { searchTerm: STATE.query, imageCount: STATE.results.length, sourceCount: 0, activeSources: [], selectedImages: [] };
      const sysPrompt = getChatSystemPrompt(meta);
      // Only send the snapshot image on the very first user message
      const isFirst = STATE.chatHistory.length === 1;
      const base64  = (isFirst && snap?.base64) ? snap.base64 : null;

      const reply = await callAIChat(STATE.chatHistory, sysPrompt, base64, 'image/jpeg');
      thinkingEl.remove();
      STATE.chatHistory.push({ role: 'assistant', content: reply });
      appendChatMessage('assistant', reply);
      // Update Gemini counter if Gemini was used
      if ((STATE.aiProvider || 'gemini') === 'gemini') incrementGeminiCounter();
    } catch (e) {
      thinkingEl.remove();
      appendChatMessage('assistant', `Could not reach AI: ${e.message}`);
    }
  }

  async function refreshChatSnapshot() {
    const btn = document.getElementById('btn-chat-snapshot');
    if (btn) { btn.textContent = '↺ …'; btn.disabled = true; }
    STATE.chatSnapshot = await captureGridSnapshot();
    if (btn) { btn.textContent = '↺ context'; btn.disabled = false; }
  }

  async function openChat() {
    document.getElementById('ai-chat-panel').classList.add('open');
    document.getElementById('btn-ai-chat').classList.add('active');
    if (_fabricCanvas) setTimeout(positionFabricOverlay, 380);
    document.getElementById('chat-provider-badge').textContent = STATE.aiProvider || 'gemini';
    // Reset history & snapshot when query changes
    if (!STATE.chatHistory._query || STATE.chatHistory._query !== STATE.query) {
      STATE.chatHistory = [];
      STATE.chatHistory._query = STATE.query;
      STATE.chatSnapshot = null;
    }
    if (!STATE.chatSnapshot && STATE.results.length) {
      await refreshChatSnapshot();
    }
    if (!STATE.chatHistory.length) renderChatEmpty();
  }

  function closeChat() {
    document.getElementById('ai-chat-panel').classList.remove('open');
    document.getElementById('btn-ai-chat').classList.remove('active');
    if (_fabricCanvas) setTimeout(positionFabricOverlay, 380);
  }

  document.getElementById('btn-ai-chat')?.addEventListener('click', () => {
    document.getElementById('ai-chat-panel').classList.contains('open') ? closeChat() : openChat();
  });
  document.getElementById('ai-chat-close')?.addEventListener('click', closeChat);
  document.getElementById('btn-chat-snapshot')?.addEventListener('click', refreshChatSnapshot);
  document.getElementById('btn-chat-send')?.addEventListener('click', () => {
    sendChatMessage(document.getElementById('chat-input').value.trim());
  });
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(e.target.value.trim());
    }
  });
})();

console.log('[insposearch] Phase 3B — AI Chat Panel ready.');

console.log('[insposearch] Phase 9 — Polish complete. insposearch is ready.');

/* ============================================================
   PHASE 10 — SETTINGS MODULE
============================================================ */

STATE.showBadges       = true;
STATE.keywordExpansion = true;
STATE.autoSearch       = false;
STATE.rememberLast     = false;
STATE.autoAnalyse      = false;
STATE.searchMode       = 'explore';

export function applyBadgeVisibility() {
  document.getElementById('canvas').classList.toggle('no-badges', !STATE.showBadges);
}

export function updateSettingsCacheStatus() {
  const el = document.getElementById('settings-cache-status');
  if (!el) return;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) count++;
  }
  el.textContent = count === 0 ? 'cache is empty' : `${count} search${count !== 1 ? 'es' : ''} cached`;
}

export function updateSettingsPanelUI() {
  const storedTheme = localStorage.getItem('inspo_theme');
  document.getElementById('settings-theme-dark').classList.toggle('active', storedTheme === 'dark');
  document.getElementById('settings-theme-light').classList.toggle('active', storedTheme === 'light');
  document.getElementById('settings-theme-system').classList.toggle('active', storedTheme === 'system' || !storedTheme);

  document.getElementById('settings-sketch-on').classList.toggle('active', STATE.sketchMode);
  document.getElementById('settings-sketch-off').classList.toggle('active', !STATE.sketchMode);

  document.getElementById('settings-badges-on').classList.toggle('active', STATE.showBadges);
  document.getElementById('settings-badges-off').classList.toggle('active', !STATE.showBadges);

  document.getElementById('settings-kwexp-on').classList.toggle('active', STATE.keywordExpansion);
  document.getElementById('settings-kwexp-off').classList.toggle('active', !STATE.keywordExpansion);

  document.getElementById('settings-autosearch-on').classList.toggle('active', STATE.autoSearch);
  document.getElementById('settings-autosearch-off').classList.toggle('active', !STATE.autoSearch);

  document.getElementById('settings-remember-on').classList.toggle('active', STATE.rememberLast);
  document.getElementById('settings-remember-off').classList.toggle('active', !STATE.rememberLast);

  document.getElementById('settings-autoanalyse-on').classList.toggle('active', STATE.autoAnalyse);
  document.getElementById('settings-autoanalyse-off').classList.toggle('active', !STATE.autoAnalyse);

  const count = STATE.geminiDailyCount;
  const usageEl = document.getElementById('settings-gemini-usage');
  if (usageEl) {
    if (count >= 1500) {
      usageEl.textContent = 'daily limit reached — resets midnight';
      usageEl.style.color = '#E24B4A';
    } else if (count >= 1400) {
      usageEl.textContent = `✦ ${count} used — approaching limit`;
      usageEl.style.color = 'var(--accent)';
    } else {
      usageEl.textContent = `✦ ${count} used today / 1500 free`;
      usageEl.style.color = 'var(--ink-3)';
    }
  }
  updateSettingsCacheStatus();
  // Sync language selector to current locale
  var langSel2 = document.getElementById('settings-language');
  if (langSel2) langSel2.value = getLocale();
  // Sync NSFW toggle
  document.getElementById('settings-nsfw-on')?.classList.toggle('active', STATE._nsfwFilter);
  document.getElementById('settings-nsfw-off')?.classList.toggle('active', !STATE._nsfwFilter);
}

export function loadSettings() {
  const showBadges = localStorage.getItem('inspo_show_badges');
  STATE.showBadges = showBadges === null ? true : showBadges !== 'false';

  const kwExp = localStorage.getItem('inspo_keyword_expansion');
  STATE.keywordExpansion = kwExp === null ? true : kwExp !== 'false';

  STATE.autoSearch   = localStorage.getItem('inspo_auto_search')   === 'true';
  STATE.rememberLast = localStorage.getItem('inspo_remember_last') === 'true';
  STATE.autoAnalyse  = localStorage.getItem('inspo_auto_analyse')  === 'true';
  STATE.searchMode   = localStorage.getItem('inspo_search_mode') === 'exact' ? 'exact' : 'explore';

  applyBadgeVisibility();
  setSearchMode(STATE.searchMode, false);

  if (STATE.rememberLast) {
    const lastQuery = localStorage.getItem('inspo_last_query');
    if (lastQuery) document.getElementById('search-input').value = lastQuery;
  }
}

/* -- Panel open/close -- */
document.getElementById('btn-settings')?.addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  const isOpen = panel.classList.toggle('open');
  if (isOpen) {
    document.getElementById('keys-panel')?.classList.remove('open');
    updateSettingsPanelUI();
  }
});

document.getElementById('settings-panel-close')?.addEventListener('click', () => {
  document.getElementById('settings-panel')?.classList.remove('open');
});

/* -- Language selector -- */
(function () {
  var langSel = document.getElementById('settings-language');
  if (!langSel) return;

  // Populate all supported locales dynamically (HTML only has the 6 base options)
  const currentOptions = new Set(Array.from(langSel.options).map(o => o.value));
  const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames([], { type: 'language' })
    : null;
  SUPPORTED_LOCALES.forEach(function (code) {
    if (currentOptions.has(code)) return; // skip already present
    const opt = document.createElement('option');
    opt.value = code;
    try { opt.textContent = displayNames ? displayNames.of(code) : code; }
    catch (e) { opt.textContent = code; }
    langSel.appendChild(opt);
  });

  // Restore current locale in selector
  langSel.value = getLocale();
  langSel.addEventListener('change', function () {
    setLocale(langSel.value);
    // Re-apply count label since it contains a translated word
    var cl = document.getElementById('count-label');
    if (cl) {
      var n = parseInt(document.getElementById('count-slider')?.value || '24', 10);
      cl.textContent = n + ' ' + tr('images');
    }
  });
})();

/* -- NSFW filter settings wiring -- */
(function () {
  var onBtn  = document.getElementById('settings-nsfw-on');
  var offBtn = document.getElementById('settings-nsfw-off');
  if (!onBtn || !offBtn) return;

  // Restore from localStorage
  STATE._nsfwFilter = localStorage.getItem('inspo_nsfw_filter') === 'true';
  onBtn.classList.toggle('active', STATE._nsfwFilter);
  offBtn.classList.toggle('active', !STATE._nsfwFilter);

  onBtn.addEventListener('click', function () {
    STATE._nsfwFilter = true;
    localStorage.setItem('inspo_nsfw_filter', 'true');
    onBtn.classList.add('active'); offBtn.classList.remove('active');
  });
  offBtn.addEventListener('click', function () {
    STATE._nsfwFilter = false;
    localStorage.setItem('inspo_nsfw_filter', 'false');
    offBtn.classList.add('active'); onBtn.classList.remove('active');
  });
})();

/* -- Theme: shared applier -- */
export function applyThemePref(pref) {
  document.body.classList.remove('dark', 'light');
  if (pref === 'dark') {
    document.body.classList.add('dark');
    localStorage.setItem('inspo_theme', 'dark');
  } else if (pref === 'light') {
    document.body.classList.add('light');
    localStorage.setItem('inspo_theme', 'light');
  } else {
    localStorage.setItem('inspo_theme', 'system');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    }
  }
  const isDark = document.body.classList.contains('dark');
  const tt = document.getElementById('theme-toggle');
  if (tt) tt.textContent = isDark ? 'light' : 'dark';
  if (typeof syncThreeBg === 'function') syncThreeBg();
  updateSettingsPanelUI();
}

document.getElementById('settings-theme-dark')?.addEventListener('click',   () => applyThemePref('dark'));
document.getElementById('settings-theme-light')?.addEventListener('click',  () => applyThemePref('light'));
document.getElementById('settings-theme-system')?.addEventListener('click', () => applyThemePref('system'));

/* -- B&W mode from settings -- */
document.getElementById('settings-sketch-on')?.addEventListener('click', () => {
  if (!STATE.sketchMode) {
    STATE.sketchMode = true;
    applySketchMode();
    const sb = document.getElementById('btn-bw');
    sb.textContent = 'colour';
    sb.classList.add('active');
  }
  updateSettingsPanelUI();
});

document.getElementById('settings-sketch-off')?.addEventListener('click', () => {
  if (STATE.sketchMode) {
    STATE.sketchMode = false;
    removeSketchMode();
    const sb = document.getElementById('btn-bw');
    sb.textContent = 'b&w';
    sb.classList.remove('active');
  }
  updateSettingsPanelUI();
});

/* -- Source badges -- */
document.getElementById('settings-badges-on')?.addEventListener('click', () => {
  STATE.showBadges = true;
  localStorage.setItem('inspo_show_badges', 'true');
  applyBadgeVisibility();
  updateSettingsPanelUI();
});

document.getElementById('settings-badges-off')?.addEventListener('click', () => {
  STATE.showBadges = false;
  localStorage.setItem('inspo_show_badges', 'false');
  applyBadgeVisibility();
  updateSettingsPanelUI();
});

/* -- Keyword expansion -- */
document.getElementById('settings-kwexp-on')?.addEventListener('click', () => {
  STATE.keywordExpansion = true;
  localStorage.setItem('inspo_keyword_expansion', 'true');
  updateSettingsPanelUI();
});

document.getElementById('settings-kwexp-off')?.addEventListener('click', () => {
  STATE.keywordExpansion = false;
  localStorage.setItem('inspo_keyword_expansion', 'false');
  updateSettingsPanelUI();
});

/* -- Auto-search -- */
document.getElementById('settings-autosearch-on')?.addEventListener('click', () => {
  STATE.autoSearch = true;
  localStorage.setItem('inspo_auto_search', 'true');
  updateSettingsPanelUI();
});

document.getElementById('settings-autosearch-off')?.addEventListener('click', () => {
  STATE.autoSearch = false;
  localStorage.setItem('inspo_auto_search', 'false');
  updateSettingsPanelUI();
});

/* -- Remember query -- */
document.getElementById('settings-remember-on')?.addEventListener('click', () => {
  STATE.rememberLast = true;
  localStorage.setItem('inspo_remember_last', 'true');
  updateSettingsPanelUI();
});

document.getElementById('settings-remember-off')?.addEventListener('click', () => {
  STATE.rememberLast = false;
  localStorage.setItem('inspo_remember_last', 'false');
  updateSettingsPanelUI();
});

/* -- Auto-analyse -- */
document.getElementById('settings-autoanalyse-on')?.addEventListener('click', () => {
  STATE.autoAnalyse = true;
  localStorage.setItem('inspo_auto_analyse', 'true');
  updateSettingsPanelUI();
});

document.getElementById('settings-autoanalyse-off')?.addEventListener('click', () => {
  STATE.autoAnalyse = false;
  localStorage.setItem('inspo_auto_analyse', 'false');
  updateSettingsPanelUI();
});

/* -- Clear AI cache -- */
document.getElementById('btn-clear-ai-cache')?.addEventListener('click', () => {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('inspo_aitags_')) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  const btn = document.getElementById('btn-clear-ai-cache');
  const prev = btn.textContent;
  btn.textContent = `cleared (${toRemove.length})`;
  setTimeout(() => { btn.textContent = prev; }, 2000);
});

/* -- Clear search cache -- */
document.getElementById('btn-clear-search-cache')?.addEventListener('click', () => {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  updateSettingsCacheStatus();
});

/* -- Clear all data -- */
document.getElementById('btn-clear-all-data')?.addEventListener('click', () => {
  if (!confirm('clear all settings, api keys, and cached data?\nthis cannot be undone.')) return;
  localStorage.clear();
  location.reload();
});

/* -- Export settings -- */
document.getElementById('btn-settings-export')?.addEventListener('click', () => {
  const data = { _version: '1.0', _exported: new Date().toISOString() };
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('inspo_')) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'insposearch-settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

/* -- Import settings -- */
document.getElementById('btn-settings-import')?.addEventListener('click', () => {
  document.getElementById('settings-import-input')?.click();
});

document.getElementById('settings-import-input')?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data !== 'object' || Array.isArray(data)) return;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('inspo_') && typeof v === 'string') localStorage.setItem(k, v);
      });
      loadSettings();
      STATE.geminiKey      = localStorage.getItem('inspo_gemini_key')      || null;
      STATE.claudeKey      = localStorage.getItem('inspo_claude_key')      || null;
      STATE.openaiKey      = localStorage.getItem('inspo_openai_key')      || null;
      STATE.openaiEndpoint = localStorage.getItem('inspo_openai_endpoint') || '';
      STATE.ollamaEndpoint = localStorage.getItem('inspo_ollama_endpoint') || 'http://localhost:11434';
      STATE.ollamaModel    = localStorage.getItem('inspo_ollama_model')    || 'llava';
      STATE.aiProvider     = localStorage.getItem('inspo_ai_provider')     || 'gemini';
      STATE.europeanaKey   = localStorage.getItem('inspo_europeana_key')   || null;
      STATE.harvardKey     = localStorage.getItem('inspo_harvard_key')     || null;
      STATE.smithsonianKey = localStorage.getItem('inspo_smithsonian_key') || null;
      STATE.pexelsKey      = localStorage.getItem('inspo_pexels_key')      || null;
      STATE.pixabayKey     = localStorage.getItem('inspo_pixabay_key')     || null;
      STATE.flickrKey      = localStorage.getItem('inspo_flickr_key')      || null;
      STATE.troveKey       = localStorage.getItem('inspo_trove_key')       || null;
      STATE.digitalnzKey   = localStorage.getItem('inspo_digitalnz_key')   || null;
      STATE.ddbKey          = localStorage.getItem('inspo_ddb_key')          || null;
      buildKeyRows();
      updateKeysDot();
      const theme = localStorage.getItem('inspo_theme');
      document.body.classList.remove('dark', 'light');
      if (theme === 'dark')  { document.body.classList.add('dark');  document.getElementById('theme-toggle').textContent = 'light'; }
      if (theme === 'light') { document.body.classList.add('light'); document.getElementById('theme-toggle').textContent = 'dark';  }
      updateSettingsPanelUI();
    } catch (err) {
      console.warn('insposearch: failed to import settings:', err.message);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* -- About: view guide -- */
document.getElementById('btn-settings-guide')?.addEventListener('click', () => {
  document.getElementById('settings-panel').classList.remove('open');
  if (typeof window._showOnboarding === 'function') window._showOnboarding();
});

/* -- Auto-search debounce -- */
export const debouncedAutoSearch = debounce(q => {
  if (!STATE.autoSearch || !q.trim() || q.trim() === STATE.query) return;
  runSearch(q.trim());
}, 800);

/* -- Remember last query on Enter -- */
document.getElementById('search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && STATE.rememberLast) {
    const q = e.target.value.trim();
    if (q) localStorage.setItem('inspo_last_query', q);
  }
});

/* -- Sync settings panel when sidebar b&w/sketch/theme toggles are used -- */
document.getElementById('btn-bw')?.addEventListener('click', () => {
  if (document.getElementById('settings-panel')?.classList.contains('open')) updateSettingsPanelUI();
});

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  if (document.getElementById('settings-panel')?.classList.contains('open')) updateSettingsPanelUI();
});

/* -- Auto-analyse: patch updatePanel to trigger AI on selection -- */
(function patchUpdatePanelForAutoAnalyse() {
  const _orig = updatePanel;
  updatePanel = async function(previewItem) {
    await _orig(previewItem);
    const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    const displayItems = previewItem ? [previewItem] : STATE.selected;
    if (!STATE.autoAnalyse || !hasKey || !displayItems.length) return;
    const item = displayItems[displayItems.length - 1];
    if (item.aiTags && item.aiTags.length) return;
    const cached = getAITagsCache(item.id);
    if (cached) {
      item.aiTags = cached;
      renderAiSection(cached);
      document.getElementById('analyse-section').style.display = 'none';
    } else {
      runGeminiOnSelected();
    }
  };
})();

/* -- Init -- */
loadSettings();

/* ── Phase 2: Load source manifest (extends KEY_SOURCES with community entries) ── */
STATE.manifestSources = [];

export async function loadSourceManifest() {
  try {
    const res = await fetch('./sources.manifest.json');
    if (!res.ok) return;
    const manifest = await res.json();
    const sources = manifest.sources || [];

    let added = 0;
    for (const cfg of sources) {
      if (!cfg.active) continue;
      // Skip sources already registered (hardcoded)
      if (KEY_SOURCES.find(s => s.id === cfg.id)) continue;

      // Register in KEY_SOURCES for panel display
      KEY_SOURCES.push({
        id:         cfg.id,
        name:       cfg.name,
        desc:       cfg.description || '',
        imageCount: cfg.imageCount || 0,
        alwaysOn:   !cfg.keyRequired,
        stateKey:   cfg.keyRequired ? cfg.id + 'Key' : null,
        storageKey: cfg.keyRequired ? 'inspo_' + cfg.id + '_key' : null,
        getKeyUrl:  cfg.getKeyUrl || null,
        cors:       cfg.corsMode !== 'direct' ? undefined : undefined,
      });

      // Register in ALL_SOURCES for health tracking
      if (!ALL_SOURCES.includes(cfg.id)) {
        ALL_SOURCES.push(cfg.id);
      }

      // Register/update metadata for filtering — manifest is authoritative
      SOURCE_META[cfg.id] = {
        category: cfg.category || SOURCE_META[cfg.id]?.category || [],
        region:   cfg.region   || SOURCE_META[cfg.id]?.region   || 'global',
        access:   cfg.keyRequired ? 'free_key' : (SOURCE_META[cfg.id]?.access || 'no_key'),
        corsBlocked: cfg.corsMode === 'prefetched' || SOURCE_META[cfg.id]?.corsBlocked || false,
      };

      // Queue for generic adapter in fetchAll
      if (['iiif_search', 'simple_rest', 'iiif_content_search', 'iiif_collection'].includes(cfg.adapter) && cfg.endpoint) {
        STATE.manifestSources.push(cfg);
      }

      added++;
    }

    if (added > 0) {
      buildKeyRows();
      window._refreshOnboardingStats?.();
      console.log(`[insposearch] Manifest loaded — ${added} additional sources registered.`);
    }
  } catch (e) {
    // Manifest is optional — fail silently
    console.debug('[insposearch] sources.manifest.json not loaded:', e.message);
  }
}

loadSourceManifest();

/* ============================================================
   DYNAMIC SOURCE DISCOVERY — live provider enumeration
   Runs at startup when API keys are available. Fetches the full
   list of providers/hubs from aggregator APIs and adds them to
   DYNAMIC_REGISTRY. No storage — purely in-memory.
============================================================ */

/* Europeana: discover all DATA_PROVIDER values via facet API */
export async function discoverEuropeanaProviders() {
  if (!STATE.europeanaKey) return 0;
  try {
    const url = `https://api.europeana.eu/record/v2/search.json?wskey=${encodeURIComponent(STATE.europeanaKey)}&query=*&facet=DATA_PROVIDER&f.DATA_PROVIDER.facet.limit=10000&rows=0&profile=facets`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json();
    const facet = (data.facets || []).find(f => f.name === 'DATA_PROVIDER');
    if (!facet || !facet.fields) return 0;

    const existingIds = new Set(Object.keys(EUROPEANA_PROVIDERS));
    const existingDynamic = new Set(DYNAMIC_REGISTRY.map(s => s.id));
    let added = 0;
    for (const field of facet.fields) {
      if (field.count < 50) continue;  // skip tiny providers for signal:noise
      const id = 'euro_' + field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
      if (existingIds.has(id) || existingDynamic.has(id)) continue;
      DYNAMIC_REGISTRY.push({
        id,
        adapter: 'europeana_provider',
        config:  { filterParam: 'DATA_PROVIDER', filterValue: field.label },
        name:    field.label,
        tags:    ['art', 'archives'],
        keyRequired: 'europeanaKey',
        imageCount: field.count,
      });
      added++;
    }
    return added;
  } catch (e) {
    console.debug('[insposearch] Europeana discovery failed:', e.message);
    return 0;
  }
}

/* DPLA: discover all provider.name values via facet API */
export async function discoverDPLAProviders() {
  if (!STATE.dplaKey) return 0;
  try {
    const url = `https://api.dp.la/v2/items?api_key=${encodeURIComponent(STATE.dplaKey)}&facets=provider.name&page_size=0`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json();
    const terms = data.facets?.['provider.name']?.terms || [];

    const existingIds = new Set(Object.keys(DPLA_HUBS));
    const existingDynamic = new Set(DYNAMIC_REGISTRY.map(s => s.id));
    let added = 0;
    for (const term of terms) {
      if (term.count < 50) continue;
      const id = 'dpla_' + term.term.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
      if (existingIds.has(id) || existingDynamic.has(id)) continue;
      DYNAMIC_REGISTRY.push({
        id,
        adapter: 'dpla_hub',
        config:  { provider: term.term },
        name:    term.term,
        tags:    ['archives', 'history'],
        keyRequired: 'dplaKey',
        imageCount: term.count,
      });
      added++;
    }
    return added;
  } catch (e) {
    console.debug('[insposearch] DPLA discovery failed:', e.message);
    return 0;
  }
}

/* Master discovery — runs once at startup, re-runs when keys change */
export async function discoverDynamicSources() {
  const [euroCount, dplaCount] = await Promise.all([
    discoverEuropeanaProviders(),
    discoverDPLAProviders(),
  ]);
  const total = DYNAMIC_REGISTRY.length;
  if (euroCount || dplaCount) {
    console.log(`[insposearch] Discovery complete — ${euroCount} Europeana + ${dplaCount} DPLA providers. Total dynamic: ${total}`);
  }
  updateSourcesActiveCounter();
  window._refreshOnboardingStats?.();
  updateInfoBar();
}

// Run discovery after manifest loads (keys are loaded by then)
discoverDynamicSources();

console.log('[insposearch] Phase 10 — Settings Module ready.');

// ── Mobile sidebar toggle ──────────────────────────────────
(function () {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const backdrop  = document.getElementById('sidebar-backdrop');
  const sidebar   = document.getElementById('sidebar');
  if (!mobileBtn || !backdrop || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('visible');
  }
  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('visible');
  }

  mobileBtn.addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);

  // Swipe-to-close sidebar on mobile
  let swipeStartX = 0;
  sidebar.addEventListener('touchstart', e => {
    swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  sidebar.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - swipeStartX;
    if (dx < -60 && sidebar.classList.contains('mobile-open')) closeSidebar();
  }, { passive: true });

  // Close sidebar when user triggers a search (taps search result area)
  document.getElementById('search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') closeSidebar();
  });
})();

/* ============================================================
   DATE RANGE FILTER
   Shows after results load; filters visible results by year.
============================================================ */
/* --- extractYear exposed globally (date filter is in advanced search) --- */
export function _extractYearFn(item) {
  if (item.year) {
    var n = parseInt(item.year, 10);
    if (n > 0 && n <= 2100) return n;
  }
  var text = (item.title || '') + ' ' + (item.description || '') + ' ' + (item.date || '');
  var m = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return m ? parseInt(m[1], 10) : null;
}
window._extractYear = _extractYearFn;

(function initDateFilter() {
  var applyBtn = document.getElementById('date-filter-apply');
  var clearBtn = document.getElementById('date-filter-clear');
  var fromInput = document.getElementById('date-from');
  var toInput = document.getElementById('date-to');
  if (!applyBtn) return;

  function applyDateFilter() {
    var from = parseInt(fromInput.value, 10) || 0;
    var to = parseInt(toInput.value, 10) || 9999;
    if (from === 0 && to === 9999) return;
    STATE._dateFilter = { from: from, to: to };
    refilterResults();
  }

  applyBtn.addEventListener('click', applyDateFilter);
  fromInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') applyDateFilter(); });
  toInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') applyDateFilter(); });

  clearBtn.addEventListener('click', function() {
    fromInput.value = '';
    toInput.value = '';
    STATE._dateFilter = null;
    refilterResults();
  });
})();

/* ── License quick-filter pills ── */
(function initLicenseFilter() {
  var row = document.getElementById('license-pill-row');
  if (!row) return;
  row.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-license]');
    if (!btn) return;
    row.querySelectorAll('.filter-pill').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    STATE._licenseFilter = btn.dataset.license || null;
    refilterResults();
  });
})();

export function refilterResults() {
  if (!STATE.results.length) return;
  let items = [...STATE.results];

  // Date filter
  if (STATE._dateFilter) {
    const { from, to } = STATE._dateFilter;
    items = items.filter(item => {
      const y = window._extractYear(item);
      if (y === null) return true; // keep items without a date
      return y >= from && y <= to;
    });
  }

  // Aspect ratio filter
  if (STATE._aspectFilter && STATE._aspectFilter !== 'all') {
    const af = STATE._aspectFilter;
    items = items.filter(item => {
      if (!item._aspect) return true; // keep if unknown
      return item._aspect === af;
    });
  }

  // License filter
  if (STATE._licenseFilter) {
    items = applyLicenseFilter(items, STATE._licenseFilter);
  }

  clearGrid();
  const visible = getDisplayResults(items, STATE.query);
  if (visible.length) renderGrid(visible);
  else showEmptyState();
}

/* ============================================================
   ASPECT RATIO FILTER
============================================================ */
(function initAspectFilter() {
  const section = document.getElementById('aspect-filter-section');
  if (!section) return;
  const buttons = section.querySelectorAll('.aspect-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE._aspectFilter = btn.dataset.aspect;
      refilterResults();
    });
  });
})();

/* ============================================================
   RELEVANCE SCORING V2
   Enhanced scoring with source authority, completeness, and
   image quality signals.
============================================================ */
export const SOURCE_AUTHORITY = {
  met: 10, rijksmuseum: 10, va: 9, chicago: 9, nga: 9, louvre: 9,
  cleveland: 8, harvard: 8, yale: 8, tate: 8, prado: 8, mia: 8,
  lacma: 8, smithsonian: 8, europeana: 7, loc: 7, gallica: 7,
  nasa: 7, inaturalist: 7, gbif: 6, flickr: 5,
  unsplash: 5, pixabay: 4, pexels: 4,
};

(function upgradeScoreItemRelevance() {
  // Wrap the existing scoreItemRelevance to add v2 signals
  const _origScore = scoreItemRelevance;
  setScoreItemRelevance(function(item, query) {
    let score = _origScore(item, query);
    // Source authority bonus
    const auth = SOURCE_AUTHORITY[item.source] || 0;
    score += auth * 0.3;
    // Completeness bonus: has title + description + tags
    if (item.title && item.description) score += 2;
    if (item.tags && item.tags.length >= 2) score += 1;
    // High-res bonus: has a distinct url (not just thumb)
    if (item.url && item.url !== item.thumb) score += 1;
    return score;
  });
})();

/* ============================================================
   TITLE-BASED DEDUPLICATION
   Removes near-duplicate results from different sources that
   share the same image (matched by title similarity).
============================================================ */
export function deduplicateResults(items) {
  if (!items || items.length < 2) return items;
  const seen = new Map(); // normalised title → item
  const out = [];
  for (const item of items) {
    const norm = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (!norm || norm.length < 5) { out.push(item); continue; }
    if (seen.has(norm)) {
      // Keep the one from the higher-authority source
      const existing = seen.get(norm);
      const authNew = SOURCE_AUTHORITY[item.source] || 0;
      const authOld = SOURCE_AUTHORITY[existing.source] || 0;
      if (authNew > authOld) {
        // Replace
        const idx = out.indexOf(existing);
        if (idx >= 0) out[idx] = item;
        seen.set(norm, item);
      }
      // else skip the new one
    } else {
      seen.set(norm, item);
      out.push(item);
    }
  }
  return out;
}

// Patch getDisplayResults to run dedup
(function patchDedup() {
  const _origGetDisplay = getDisplayResults;
  setGetDisplayResults(function(items, query) {
    return _origGetDisplay(deduplicateResults(items), query);
  });
})();

/* ============================================================
   SAVED SEARCHES
   Stores bookmarked searches separately from history.
   Clicking a saved search re-runs it.
============================================================ */
export const _SAVED_KEY = 'inspo_saved_searches';
export const _SAVED_MAX = 50;

export function loadSavedSearches() {
  try { return JSON.parse(localStorage.getItem(_SAVED_KEY)) || []; } catch { return []; }
}

export function saveSavedSearch(q) {
  if (!q || q.length < 2) return;
  let saved = loadSavedSearches();
  if (saved.includes(q)) return; // already saved
  saved = [q, ...saved].slice(0, _SAVED_MAX);
  try { localStorage.setItem(_SAVED_KEY, JSON.stringify(saved)); } catch {}
}

export function removeSavedSearch(q) {
  let saved = loadSavedSearches();
  saved = saved.filter(s => s !== q);
  try { localStorage.setItem(_SAVED_KEY, JSON.stringify(saved)); } catch {}
}

// Add a "save search" button to the search row after a search completes
(function initSavedSearches() {
  const row = document.querySelector('.search-row');
  if (!row) return;

  const saveBtn = document.createElement('button');
  saveBtn.id = 'btn-save-search';
  saveBtn.className = 'search-mode-toggle';
  saveBtn.title = 'save this search';
  saveBtn.textContent = '★';
  saveBtn.style.display = 'none';
  saveBtn.style.fontSize = '14px';
  saveBtn.style.padding = '4px 8px';
  row.appendChild(saveBtn);

  saveBtn.addEventListener('click', () => {
    if (STATE.query) {
      const saved = loadSavedSearches();
      if (saved.includes(STATE.query)) {
        removeSavedSearch(STATE.query);
        saveBtn.style.color = '';
        saveBtn.title = 'save this search';
      } else {
        saveSavedSearch(STATE.query);
        saveBtn.style.color = 'var(--accent)';
        saveBtn.title = 'unsave this search';
      }
    }
  });

  // Show + style when a search finishes
  const _origRunSearch = runSearch;
  const _ors2 = async function(query, forceRefresh) {
    await _origRunSearch(query, forceRefresh);
    saveBtn.style.display = '';
    const saved = loadSavedSearches();
    if (saved.includes(STATE.query)) {
      saveBtn.style.color = 'var(--accent)';
      saveBtn.title = 'unsave this search';
    } else {
      saveBtn.style.color = '';
      saveBtn.title = 'save this search';
    }
  };
  // Replace global runSearch — must be done carefully
  window.runSearch = _ors2;
  // Also re-assign the module-level ref for internal calls
  runSearch = _ors2;

  // Append saved searches to history dropdown
  const _origRenderHistory = renderSearchHistory;
  renderSearchHistory = function(filter) {
    _origRenderHistory(filter);
    const el = document.getElementById('search-history-dropdown');
    if (!el) return;
    const saved = loadSavedSearches().filter(s =>
      !filter || s.toLowerCase().includes(filter.toLowerCase())
    );
    if (!saved.length) return;
    if (el.hidden && !saved.length) return;
    // Append saved section
    const divider = document.createElement('div');
    divider.style.cssText = 'border-top:1px solid var(--line-strong);font-family:var(--font-ui);font-size:8px;color:var(--ink-3);padding:4px 8px;letter-spacing:0.1em;text-transform:uppercase;';
    divider.textContent = 'saved';
    el.appendChild(divider);
    saved.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'search-history-item';
      btn.textContent = '★ ' + s;
      btn.style.color = 'var(--accent)';
      btn.setAttribute('role', 'option');
      el.appendChild(btn);
    });
    el.hidden = false;
  };
})();

/* ============================================================
   LIGHTBOX SLIDESHOW
   Full-screen auto-advance viewer for selected images.
   Triggered from the floating bar "slideshow" button.
============================================================ */
export function openLightbox(items, startIndex) {
  if (!items || !items.length) return;
  let idx = startIndex || 0;
  let autoTimer = null;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="close">&times;</button>
    <button class="lightbox-nav prev" aria-label="previous">&#8249;</button>
    <img class="lightbox-img" alt="">
    <div class="lightbox-caption"></div>
    <button class="lightbox-nav next" aria-label="next">&#8250;</button>
    <div class="lightbox-counter"></div>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox-img');
  const caption = overlay.querySelector('.lightbox-caption');
  const counter = overlay.querySelector('.lightbox-counter');

  function show(i) {
    idx = ((i % items.length) + items.length) % items.length;
    const item = items[idx];
    img.src = item.fullUrl || item.url || item.thumb;
    img.alt = item.title || '';
    caption.textContent = `${item.title || 'untitled'} — ${item.source || ''}`;
    counter.textContent = `${idx + 1} / ${items.length}`;
  }

  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }

  function close() {
    clearInterval(autoTimer);
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') prev();
  }

  document.addEventListener('keydown', onKey);
  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.querySelector('.lightbox-nav.prev').addEventListener('click', prev);
  overlay.querySelector('.lightbox-nav.next').addEventListener('click', next);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  show(idx);

  // Auto-advance every 5 seconds
  autoTimer = setInterval(next, 5000);
}

// Connect the floating bar slideshow button
document.getElementById('bar-slideshow-btn')?.addEventListener('click', () => {
  if (STATE.selected.length) openLightbox(STATE.selected, 0);
});

/* ============================================================
   CITATION EXPORT
   Generates MLA/APA citation text for selected images.
============================================================ */
export function generateCitation(item, style) {
  const title = item.title || 'Untitled';
  const source = item.source || 'Unknown source';
  const url = item.sourceUrl || item.url || '';
  const year = item.year || 'n.d.';
  const accessed = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (style === 'apa') {
    return `${title}. (${year}). ${source}. Retrieved ${accessed}, from ${url}`;
  }
  // Default: MLA
  return `"${title}." ${source}, ${year}. Web. ${accessed}. <${url}>.`;
}

export function copyCitations(items, style) {
  const text = items.map(item => generateCitation(item, style)).join('\n\n');
  navigator.clipboard.writeText(text).then(() => {
    // Brief visual confirmation
    const btn = document.getElementById('bar-cite-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'copied!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  }).catch(() => {});
}

// Connect cite button — shows a mini popup to pick format
document.getElementById('bar-cite-btn')?.addEventListener('click', () => {
  if (!STATE.selected.length) return;
  // Toggle a tiny dropdown
  let dd = document.getElementById('cite-format-dropdown');
  if (dd) { dd.remove(); return; }
  dd = document.createElement('div');
  dd.id = 'cite-format-dropdown';
  dd.style.cssText = 'position:absolute;bottom:50px;right:10px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;display:flex;gap:4px;padding:6px;';
  dd.innerHTML = '<button class="btn" data-fmt="mla" style="font-size:9px;padding:4px 10px;">MLA</button><button class="btn" data-fmt="apa" style="font-size:9px;padding:4px 10px;">APA</button>';
  document.getElementById('floating-bar').appendChild(dd);
  dd.addEventListener('click', e => {
    const fmt = e.target.dataset.fmt;
    if (fmt) { copyCitations(STATE.selected, fmt); dd.remove(); }
  });
  setTimeout(() => { document.addEventListener('click', function rm() { dd?.remove(); document.removeEventListener('click', rm); }); }, 100);
});

/* ============================================================
   PREFETCH ON HOVER
   When user hovers a grid card, start loading the full-res
   image in the background so detail panel opens instantly.
============================================================ */
(function initPrefetchOnHover() {
  const grid = document.getElementById('image-grid');
  if (!grid) return;
  let prefetchTimeout = null;

  grid.addEventListener('mouseover', e => {
    const card = e.target.closest('.image-card');
    if (!card) return;
    clearTimeout(prefetchTimeout);
    prefetchTimeout = setTimeout(() => {
      const id = card.dataset.id;
      const item = _gridItemMap.get(id);
      if (item && item.url && item.url !== item.thumb) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = item.url;
        link.as = 'image';
        // Avoid duplicate prefetches
        if (!document.querySelector(`link[href="${CSS.escape(item.url)}"]`)) {
          document.head.appendChild(link);
        }
      }
    }, 200);
  });

  grid.addEventListener('mouseout', () => {
    clearTimeout(prefetchTimeout);
  });
})();

/* ============================================================
   NAMED BOARDS
   Save/load multiple boards with names.
   Stored in localStorage as inspo_boards = { name: boardData }.
============================================================ */
export const _BOARDS_KEY = 'inspo_named_boards';

export function loadNamedBoards() {
  try { return JSON.parse(localStorage.getItem(_BOARDS_KEY)) || {}; } catch { return {}; }
}

export function saveNamedBoard(name) {
  if (!name) return;
  const boards = loadNamedBoards();
  boards[name] = {
    items: STATE.selected.map(s => ({
      id: s.id, thumb: s.thumb, title: s.title, source: s.source,
      tags: s.tags || [], sourceUrl: s.sourceUrl || '',
      year: s.year || '', colors: s.colors || [],
    })),
    positions: { ...boardPositions },
    savedAt: Date.now(),
  };
  try { localStorage.setItem(_BOARDS_KEY, JSON.stringify(boards)); } catch {}
}

export function loadNamedBoard(name) {
  const boards = loadNamedBoards();
  const board = boards[name];
  if (!board) return;
  STATE.selected = board.items || [];
  if (board.positions) Object.assign(boardPositions, board.positions);
  STATE.selected.forEach(item => {
    document.getElementById('card-' + item.id)?.classList.add('selected');
  });
  if (typeof updateFloatingBar === 'function') updateFloatingBar();
  if (typeof syncBoardOverlay === 'function') syncBoardOverlay();
  if (typeof persistBoardState === 'function') persistBoardState();
}

export function deleteNamedBoard(name) {
  const boards = loadNamedBoards();
  delete boards[name];
  try { localStorage.setItem(_BOARDS_KEY, JSON.stringify(boards)); } catch {}
}

// Add board save/load UI to the board overlay header
(function initNamedBoards() {
  const header = document.getElementById('board-overlay-header');
  if (!header) return;

  const boardMenuBtn = document.createElement('button');
  boardMenuBtn.className = 'btn';
  boardMenuBtn.style.cssText = 'padding:2px 8px;font-size:9px;letter-spacing:0.06em;';
  boardMenuBtn.textContent = 'boards';
  boardMenuBtn.title = 'Save/load named boards';
  header.insertBefore(boardMenuBtn, header.querySelector('#btn-board-popout'));

  boardMenuBtn.addEventListener('click', () => {
    let dd = document.getElementById('named-boards-dropdown');
    if (dd) { dd.remove(); return; }
    dd = document.createElement('div');
    dd.id = 'named-boards-dropdown';
    dd.style.cssText = 'position:absolute;top:36px;left:8px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;min-width:200px;max-height:300px;overflow-y:auto;';

    // Save current board
    const saveRow = document.createElement('div');
    saveRow.style.cssText = 'display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid var(--line);';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'board name...';
    nameInput.style.cssText = 'flex:1;font-family:var(--font-ui);font-size:10px;background:transparent;border:1px solid var(--line-strong);color:var(--ink);padding:3px 6px;outline:none;';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.style.cssText = 'padding:3px 8px;font-size:9px;';
    saveBtn.textContent = 'save';
    saveBtn.addEventListener('click', () => {
      const n = nameInput.value.trim();
      if (n) { saveNamedBoard(n); dd.remove(); }
    });
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { saveBtn.click(); }
    });
    saveRow.append(nameInput, saveBtn);
    dd.appendChild(saveRow);

    // List existing boards
    const boards = loadNamedBoards();
    const names = Object.keys(boards).sort((a,b) => (boards[b].savedAt||0) - (boards[a].savedAt||0));
    if (names.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:8px;font-family:var(--font-ui);font-size:10px;color:var(--ink-3);';
      empty.textContent = 'no saved boards yet';
      dd.appendChild(empty);
    }
    names.forEach(name => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--line);';
      const label = document.createElement('button');
      label.style.cssText = 'background:none;border:none;color:var(--ink);font-family:var(--font-ui);font-size:10px;cursor:pointer;text-align:left;flex:1;padding:0;';
      label.textContent = `${name} (${boards[name].items?.length || 0})`;
      label.addEventListener('click', () => { loadNamedBoard(name); dd.remove(); });
      const del = document.createElement('button');
      del.style.cssText = 'background:none;border:none;color:var(--ink-3);font-size:12px;cursor:pointer;padding:0 4px;';
      del.textContent = '×';
      del.title = 'delete board';
      del.addEventListener('click', () => { deleteNamedBoard(name); dd.remove(); });
      row.append(label, del);
      dd.appendChild(row);
    });

    header.style.position = 'relative';
    header.appendChild(dd);
    setTimeout(() => {
      document.addEventListener('click', function rm(ev) {
        if (!dd.contains(ev.target) && ev.target !== boardMenuBtn) { dd.remove(); document.removeEventListener('click', rm); }
      });
    }, 100);
  });
})();

/* ============================================================
   SERVICE WORKER REGISTRATION
   Caches static assets + recent API responses for offline use.
============================================================ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ============================================================
   COLOR SEARCH FILTER
   Filters results by dominant color. Works by sampling the
   thumbnail at render-time, caching a dominant hue bucket on
   each item, then post-filtering.
============================================================ */
export const COLOR_HUES = {
  red:    { h: [0, 15], h2: [345, 360] },
  orange: { h: [15, 45] },
  yellow: { h: [45, 70] },
  green:  { h: [70, 170] },
  blue:   { h: [170, 260] },
  purple: { h: [260, 310] },
  pink:   { h: [310, 345] },
};

export function classifyDominantColor(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  // Achromatic check
  if (d < 25) {
    if (l < 50) return 'black';
    if (l > 200) return 'white';
    return null; // grey, no strong color
  }

  // Saturation check - if low, it's brownish/gold
  const s = d / (255 - Math.abs(2 * l - 255));
  if (s < 0.2) {
    if (r > g && r > b && l > 80 && l < 180) return 'brown';
    return null;
  }

  // Gold detection
  if (r > 180 && g > 140 && g < 200 && b < 100 && s > 0.3) return 'gold';

  // Brown detection
  if (r > 100 && r > g * 1.1 && g > b * 1.3 && l < 140 && s < 0.5) return 'brown';

  // Hue calculation
  let h;
  if (max === r)      h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else                h = (r - g) / d + 4;
  h = ((h * 60) + 360) % 360;

  for (const [name, ranges] of Object.entries(COLOR_HUES)) {
    if (h >= ranges.h[0] && h < ranges.h[1]) return name;
    if (ranges.h2 && h >= ranges.h2[0] && h < ranges.h2[1]) return name;
  }
  return null;
}

/* ── CIE Lab color space conversion ── */
export function rgbToLab(r, g, b) {
  var rl = r/255, gl = g/255, bl = b/255;
  rl = rl > 0.04045 ? Math.pow((rl+0.055)/1.055, 2.4) : rl/12.92;
  gl = gl > 0.04045 ? Math.pow((gl+0.055)/1.055, 2.4) : gl/12.92;
  bl = bl > 0.04045 ? Math.pow((bl+0.055)/1.055, 2.4) : bl/12.92;
  var x = (rl*0.4124564 + gl*0.3575761 + bl*0.1804375) / 0.95047;
  var y = (rl*0.2126729 + gl*0.7151522 + bl*0.0721750);
  var z = (rl*0.0193339 + gl*0.1191920 + bl*0.9503041) / 1.08883;
  var fx = x > 0.008856 ? Math.cbrt(x) : (7.787*x + 16/116);
  var fy = y > 0.008856 ? Math.cbrt(y) : (7.787*y + 16/116);
  var fz = z > 0.008856 ? Math.cbrt(z) : (7.787*z + 16/116);
  return [116*fy - 16, 500*(fx - fy), 200*(fy - fz)];
}

/* ── CIEDE2000 perceptual color distance ── */
export function deltaE00(lab1, lab2) {
  var L1 = lab1[0], a1 = lab1[1], b1 = lab1[2];
  var L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];
  var C1 = Math.sqrt(a1*a1 + b1*b1);
  var C2 = Math.sqrt(a2*a2 + b2*b2);
  var Cab = (C1 + C2) / 2;
  var Cab7 = Math.pow(Cab, 7);
  var G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 6103515625)));
  var a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  var C1p = Math.sqrt(a1p*a1p + b1*b1);
  var C2p = Math.sqrt(a2p*a2p + b2*b2);
  var h1p = Math.atan2(b1, a1p) * 180 / Math.PI; if (h1p < 0) h1p += 360;
  var h2p = Math.atan2(b2, a2p) * 180 / Math.PI; if (h2p < 0) h2p += 360;
  var dLp = L2 - L1, dCp = C2p - C1p;
  var dhp;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;
  var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  var Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  var hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbp = (h1p + h2p + 360) / 2;
  else hbp = (h1p + h2p - 360) / 2;
  var T = 1
    - 0.17 * Math.cos((hbp - 30) * Math.PI / 180)
    + 0.24 * Math.cos((2 * hbp) * Math.PI / 180)
    + 0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * hbp - 63) * Math.PI / 180);
  var Lbp50sq = (Lbp - 50) * (Lbp - 50);
  var SL = 1 + 0.015 * Lbp50sq / Math.sqrt(20 + Lbp50sq);
  var SC = 1 + 0.045 * Cbp;
  var SH = 1 + 0.015 * Cbp * T;
  var Cbp7 = Math.pow(Cbp, 7);
  var RC = 2 * Math.sqrt(Cbp7 / (Cbp7 + 6103515625));
  var dtheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  var RT = -Math.sin(2 * dtheta * Math.PI / 180) * RC;
  return Math.sqrt(
    Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH)
  );
}

/* ── Session color cache (keyed by image URL, max 2000 entries) ── */
export const _colorCache = new Map();

/* ── Multi-color image sampling: center-weighted 32×32, top-3 histogram colors ── */
export function sampleImageColors(img) {
  var cacheKey = img.src || img.dataset.src;
  if (cacheKey && _colorCache.has(cacheKey)) return _colorCache.get(cacheKey);
  try {
    var canvas = document.createElement('canvas');
    var sz = 32;
    canvas.width = sz; canvas.height = sz;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, sz, sz);
    var data = ctx.getImageData(0, 0, sz, sz).data;
    var qSz = sz >> 2; // quarter for center region
    var buckets = {};
    var rT = 0, gT = 0, bT = 0, wT = 0;
    for (var y = 0; y < sz; y++) {
      for (var x = 0; x < sz; x++) {
        var i = (y * sz + x) * 4;
        var r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 128) continue;
        var inCenter = x >= qSz && x < sz - qSz && y >= qSz && y < sz - qSz;
        var w = inCenter ? 4 : 1;
        rT += r * w; gT += g * w; bT += b * w; wT += w;
        var rq = Math.round(r / 32) * 32;
        var gq = Math.round(g / 32) * 32;
        var bq = Math.round(b / 32) * 32;
        var key = (rq << 16) | (gq << 8) | bq;
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, w: 0 };
        buckets[key].r += r * w; buckets[key].g += g * w;
        buckets[key].b += b * w; buckets[key].w += w;
      }
    }
    if (wT === 0) return null;
    var avgRGB = [Math.round(rT/wT), Math.round(gT/wT), Math.round(bT/wT)];
    var sorted = Object.values(buckets).sort(function(a2, b2) { return b2.w - a2.w; });
    var topColors = sorted.slice(0, 3).map(function(bk) {
      return { r: Math.round(bk.r/bk.w), g: Math.round(bk.g/bk.w), b: Math.round(bk.b/bk.w), weight: bk.w / wT };
    });
    var dominant = classifyDominantColor(avgRGB[0], avgRGB[1], avgRGB[2]);
    var colorNames = new Set();
    if (dominant) colorNames.add(dominant);
    topColors.forEach(function(c) {
      var name = classifyDominantColor(c.r, c.g, c.b);
      if (name) colorNames.add(name);
    });
    var result = { dominant: dominant, colorNames: Array.from(colorNames), topColors: topColors, avgRGB: avgRGB };
    if (cacheKey) {
      if (_colorCache.size > 2000) _colorCache.clear();
      _colorCache.set(cacheKey, result);
    }
    return result;
  } catch { return null; }
}

export function sampleImageColor(img) {
  var d = sampleImageColors(img);
  return d ? d.dominant : null;
}

export function sampleImageRGB(img) {
  var d = sampleImageColors(img);
  return d ? d.avgRGB : null;
}

(function initColorFilter() {
  const section = document.getElementById('color-filter-section');
  if (!section) return;
  const buttons = section.querySelectorAll('.color-swatch-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE._colorFilter = btn.dataset.color;
      refilterResults();
    });
  });

  // Patch refilterResults to include color
  const _origRefilter = refilterResults;
  refilterResults = function() {
    if (!STATE.results.length) return;
    let items = [...STATE.results];

    // Date filter
    if (STATE._dateFilter) {
      const { from, to } = STATE._dateFilter;
      items = items.filter(item => {
        const y = window._extractYear(item);
        if (y === null) return true;
        return y >= from && y <= to;
      });
    }

    // Aspect ratio filter
    if (STATE._aspectFilter && STATE._aspectFilter !== 'all') {
      items = items.filter(item => !item._aspect || item._aspect === STATE._aspectFilter);
    }

    // Color filter — multi-color: match if ANY extracted color matches
    if (STATE._colorFilter && STATE._colorFilter !== 'all') {
      items = items.filter(item => {
        const names = item._colorNames || (item._dominantColor ? [item._dominantColor] : null);
        return !names || names.includes(STATE._colorFilter);
      });
    }

    // Hex palette filter — keep unsampled items
    if (typeof window._hexPaletteMatch === 'function' && STATE._hexPalette && STATE._hexPalette.length) {
      items = items.filter(item => (!item._avgRGB && !item._topColors) || window._hexPaletteMatch(item));
    }

    clearGrid();
    const visible = getDisplayResults(items, STATE.query);
    if (visible.length) renderGrid(visible);
    else showEmptyState();
  };
})();

/* ============================================================
   SIDE-BY-SIDE COMPARISON VIEW
   Opens an overlay showing 2-4 selected images side by side
   with their metadata for easy visual comparison.
============================================================ */
export function openCompareView(items) {
  if (!items || items.length < 2) return;
  const compareItems = items.slice(0, 4); // max 4

  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-header">
      <span class="section-label">comparing ${compareItems.length} images</span>
      <button class="compare-close" aria-label="close">&times;</button>
    </div>
    <div class="compare-grid" data-count="${compareItems.length}"></div>
  `;

  const grid = overlay.querySelector('.compare-grid');
  compareItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'compare-card';
    card.innerHTML = `
      <img src="${item.url || item.thumb}" alt="${item.title || ''}">
      <div class="compare-meta">
        <div class="title">${item.title || 'untitled'}</div>
        <div>${item.source || ''} ${item.year ? '· ' + item.year : ''}</div>
        ${item.description ? '<div style="margin-top:4px;font-size:9px;max-height:60px;overflow:hidden;">' + (item.description.length > 200 ? item.description.slice(0, 200) + '…' : item.description) + '</div>' : ''}
        ${item.tags?.length ? '<div style="margin-top:4px;font-size:8px;color:var(--ink-3);">' + item.tags.slice(0, 6).join(' · ') + '</div>' : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  document.body.appendChild(overlay);

  function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.compare-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

document.getElementById('bar-compare-btn')?.addEventListener('click', () => {
  if (STATE.selected.length >= 2) openCompareView(STATE.selected);
});

/* ============================================================
   IMAGE DOWNLOAD WITH AUTO-ATTRIBUTION
   Shows a modal listing each selected image with a generated
   attribution string, copy button, and direct download button.
============================================================ */
export function buildAttributionString(item) {
  const title = item.title || 'Untitled';
  const source = item.source || 'Unknown source';
  const url = item.sourceUrl || item.url || '';
  const year = item.year || '';
  const parts = [`"${title}"`];
  if (year) parts.push(`(${year})`);
  parts.push('—');
  parts.push(source);
  if (url) parts.push(`[${url}]`);
  parts.push('— via InspoSearch');
  return parts.join(' ');
}

export function openDownloadPanel(items) {
  if (!items?.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'dl-overlay';

  const panel = document.createElement('div');
  panel.className = 'dl-panel';
  panel.innerHTML = '<button class="dl-panel-close" aria-label="close">&times;</button><div class="section-label" style="margin-bottom:12px;">download with attribution</div>';

  items.forEach(item => {
    const attr = buildAttributionString(item);
    const row = document.createElement('div');
    row.className = 'dl-item';
    row.innerHTML = `
      <img src="${item.thumb}" alt="${item.title || ''}">
      <div class="dl-item-info">
        <div class="title">${item.title || 'untitled'}</div>
        <div>${item.source || ''} ${item.year ? '· ' + item.year : ''}</div>
        <div class="attribution">${attr}</div>
        <div class="dl-item-actions">
          <button data-action="copy">copy attribution</button>
          <button data-action="download">download image</button>
        </div>
      </div>
    `;
    row.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
      navigator.clipboard.writeText(attr).then(() => {
        e.target.textContent = 'copied!';
        setTimeout(() => { e.target.textContent = 'copy attribution'; }, 1500);
      }).catch(() => {});
    });
    row.querySelector('[data-action="download"]').addEventListener('click', () => {
      const url = item.fullUrl || item.url || item.thumb;
      // Use fetch+blob to bypass CORS where possible, with fallback to window.open
      fetch(url, { mode: 'cors' })
        .then(r => r.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const ext = url.match(/\.(jpe?g|png|webp|gif|tiff?)(?:\?|$)/i)?.[1] || 'jpg';
          a.download = `${(item.title || 'image').replace(/[^a-z0-9]/gi, '_').slice(0, 60)}.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
        })
        .catch(() => { window.open(url, '_blank'); });
    });
    panel.appendChild(row);
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  panel.querySelector('.dl-panel-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

document.getElementById('bar-download-btn')?.addEventListener('click', () => {
  if (STATE.selected.length) openDownloadPanel(STATE.selected);
});

/* ============================================================
   BOARD SHARING — BASE64 URL EXPORT
   Encodes the current board as a compact base64 URL parameter.
   Loading the page with ?board=<data> restores the board.
============================================================ */
export function encodeBoardToURL() {
  if (!STATE.selected.length) return null;
  const compact = STATE.selected.map(s => ({
    i: s.id, t: s.thumb, n: s.title, s: s.source,
    u: s.sourceUrl || '', y: s.year || '',
  }));
  const json = JSON.stringify(compact);
  // Use base64url encoding (safe for URL params)
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(window.location.href);
  url.searchParams.set('board', b64);
  url.hash = '';
  return url.toString();
}

export function decodeBoardFromURL() {
  const params = new URLSearchParams(window.location.search);
  const b64 = params.get('board');
  if (!b64) return null;
  try {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(padded)));
    const compact = JSON.parse(json);
    if (!Array.isArray(compact)) return null;
    return compact.map(c => ({
      id: c.i, thumb: c.t, title: c.n, source: c.s,
      sourceUrl: c.u || '', year: c.y || '',
      tags: [], colors: [],
    }));
  } catch { return null; }
}

// Share button — KV short link (preferred) with URL-encoded fallback
const _API_BASE = 'https://insposearch-api.official-ndsclsd.workers.dev';

document.getElementById('bar-share-btn')?.addEventListener('click', async () => {
  if (!STATE.selected.length) return;
  const btn = document.getElementById('bar-share-btn');
  if (btn) btn.setAttribute('disabled', '');

  // Build compact items payload
  const items = STATE.selected.map(s => ({
    i: s.id, t: s.thumb, n: s.title, s: s.source,
    u: s.sourceUrl || '', y: s.year || '',
  }));
  const currentQuery = document.getElementById('search-input')?.value?.trim() || '';

  try {
    const res = await fetch(`${_API_BASE}/board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, query: currentQuery }),
    });
    if (res.ok) {
      const data = await res.json();
      const shareUrl = data.url || encodeBoardToURL();
      await navigator.clipboard.writeText(shareUrl);
      if (btn) {
        btn.removeAttribute('disabled');
        btn.textContent = 'link copied!';
        setTimeout(() => { btn.textContent = ''; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'; }, 2500);
      }
      return;
    }
  } catch { /* fall through */ }

  // Fallback: long URL-encoded board
  const url = encodeBoardToURL();
  if (!url) { if (btn) btn.removeAttribute('disabled'); return; }
  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      btn.removeAttribute('disabled');
      btn.textContent = 'link copied!';
      setTimeout(() => { btn.textContent = ''; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'; }, 2500);
    }
  }).catch(() => { if (btn) btn.removeAttribute('disabled'); });
});

// On page load, check for shared board data in URL
// Supports both ?board=<base64> (legacy long URL) and ?share=<id> (KV short link)
(function restoreSharedBoard() {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('share');

  function applyItems(items) {
    if (!items || !items.length) return;
    if (STATE.selected.length) return;
    STATE.selected = items;
    if (typeof updateFloatingBar === 'function') updateFloatingBar();
    if (typeof syncBoardOverlay === 'function') syncBoardOverlay();
    if (typeof persistBoardState === 'function') persistBoardState();
    const u = new URL(window.location.href);
    u.searchParams.delete('board');
    u.searchParams.delete('share');
    window.history.replaceState({}, '', u.pathname + u.search + u.hash);
  }

  if (shareId && /^[a-zA-Z0-9_-]{6,32}$/.test(shareId)) {
    // KV short link — fetch from API
    fetch(`${_API_BASE}/board/${encodeURIComponent(shareId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !Array.isArray(data.items)) return;
        applyItems(data.items.map(c => ({
          id: c.i, thumb: c.t, title: c.n, source: c.s,
          sourceUrl: c.u || '', year: c.y || '', tags: [], colors: [],
        })));
      })
      .catch(() => {});
    return;
  }

  // Legacy ?board= base64 URL
  applyItems(decodeBoardFromURL());
})();

/* ============================================================
   BOARD TEMPLATES
   Pre-defined layout arrangements for the board overlay.
   Triggered from a "templates" button in the board header.
============================================================ */
export const BOARD_TEMPLATES = [
  {
    name: 'grid 2×2',
    cols: 2, rows: 2,
    layout: (items, w, h) => items.slice(0, 4).map((_, i) => ({
      x: (i % 2) * (w / 2) + w * 0.05,
      y: Math.floor(i / 2) * (h / 2) + h * 0.05,
      w: w * 0.4, h: h * 0.4,
    })),
  },
  {
    name: 'row',
    layout: (items, w, h) => {
      const n = Math.min(items.length, 6);
      const iw = (w - 40) / n;
      return items.slice(0, n).map((_, i) => ({
        x: 20 + i * iw, y: h * 0.2, w: iw * 0.9, h: h * 0.6,
      }));
    },
  },
  {
    name: 'focus + 3',
    layout: (items, w, h) => {
      const positions = [
        { x: w * 0.05, y: h * 0.05, w: w * 0.55, h: h * 0.9 },
      ];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
        positions.push({
          x: w * 0.65, y: h * 0.05 + (i - 1) * (h * 0.32),
          w: w * 0.3, h: h * 0.28,
        });
      }
      return positions;
    },
  },
  {
    name: 'mosaic',
    layout: (items, w, h) => {
      const n = Math.min(items.length, 6);
      const cols = n <= 3 ? n : 3;
      const rows = Math.ceil(n / cols);
      return items.slice(0, n).map((_, i) => ({
        x: (i % cols) * (w / cols) + 10,
        y: Math.floor(i / cols) * (h / rows) + 10,
        w: (w / cols) - 20,
        h: (h / rows) - 20,
      }));
    },
  },
  {
    name: 'compare 2',
    layout: (items, w, h) => [
      { x: w * 0.02, y: h * 0.05, w: w * 0.46, h: h * 0.9 },
      { x: w * 0.52, y: h * 0.05, w: w * 0.46, h: h * 0.9 },
    ],
  },
  {
    name: 'scatter',
    layout: (items, w, h) => {
      // Deterministic pseudo-random scatter
      const n = Math.min(items.length, 8);
      return items.slice(0, n).map((_, i) => ({
        x: (((i * 137) % 100) / 100) * (w * 0.7) + w * 0.05,
        y: (((i * 97 + 31) % 100) / 100) * (h * 0.6) + h * 0.1,
        w: w * 0.25, h: h * 0.35,
      }));
    },
  },
];

export function applyBoardTemplate(template) {
  const boardEl = document.getElementById('board-canvas') || document.getElementById('board-overlay-content');
  if (!boardEl || !STATE.selected.length) return;
  const w = boardEl.clientWidth || 800;
  const h = boardEl.clientHeight || 600;
  const positions = template.layout(STATE.selected, w, h);

  STATE.selected.forEach((item, i) => {
    if (positions[i]) {
      boardPositions[item.id] = {
        x: positions[i].x, y: positions[i].y,
        width: positions[i].w, height: positions[i].h,
      };
    }
  });

  if (typeof syncBoardOverlay === 'function') syncBoardOverlay();
  if (typeof persistBoardState === 'function') persistBoardState();
}

// Add templates button to board overlay header
(function initBoardTemplates() {
  const header = document.getElementById('board-overlay-header');
  if (!header) return;

  const tmplBtn = document.createElement('button');
  tmplBtn.className = 'btn';
  tmplBtn.style.cssText = 'padding:2px 8px;font-size:9px;letter-spacing:0.06em;';
  tmplBtn.textContent = 'layout';
  tmplBtn.title = 'Apply a board layout template';
  // Insert after the "boards" button (or before popout)
  const popout = header.querySelector('#btn-board-popout');
  if (popout) header.insertBefore(tmplBtn, popout);
  else header.appendChild(tmplBtn);

  tmplBtn.addEventListener('click', () => {
    let dd = document.getElementById('tmpl-dropdown');
    if (dd) { dd.remove(); return; }
    dd = document.createElement('div');
    dd.id = 'tmpl-dropdown';
    dd.style.cssText = 'position:absolute;top:36px;left:80px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;';
    dd.className = 'tmpl-grid';

    BOARD_TEMPLATES.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'tmpl-card';
      card.textContent = tmpl.name;
      card.addEventListener('click', () => {
        applyBoardTemplate(tmpl);
        dd.remove();
      });
      dd.appendChild(card);
    });

    header.style.position = 'relative';
    header.appendChild(dd);
    setTimeout(() => {
      document.addEventListener('click', function rm(ev) {
        if (!dd.contains(ev.target) && ev.target !== tmplBtn) { dd.remove(); document.removeEventListener('click', rm); }
      });
    }, 100);
  });
})();

/* ============================================================
   PATCH: Sample dominant color when thumbnail loads
   Adds _dominantColor to each item for color filter support.
============================================================ */
(function patchColorSampling() {
  const _origRenderGrid = renderGrid;
  renderGrid = function(items) {
    _origRenderGrid(items);
    // After rendering, set up color sampling on newly loaded images
    requestAnimationFrame(() => {
      const grid = document.getElementById('image-grid');
      if (!grid) return;
      grid.querySelectorAll('.image-card img.loaded').forEach(img => {
        const card = img.closest('.image-card');
        if (!card) return;
        const item = _gridItemMap.get(card.dataset.id);
        if (item && !item._dominantColor) {
          item._dominantColor = sampleImageColor(img);
        }
        if (item && !item._avgRGB) {
          item._avgRGB = sampleImageRGB(img);
        }
      });
    });
    // Also set up a mutation observer to catch lazy-loaded images
    setTimeout(() => {
      const grid = document.getElementById('image-grid');
      if (!grid) return;
      grid.querySelectorAll('.image-card img:not(.loaded)').forEach(img => {
        const origOnload = img.onload;
        img.onload = function() {
          if (origOnload) origOnload.call(this);
          const card = img.closest('.image-card');
          if (card) {
            const item = _gridItemMap.get(card.dataset.id);
            if (item && !item._dominantColor) {
              item._dominantColor = sampleImageColor(img);
            }
            if (item && !item._avgRGB) {
              item._avgRGB = sampleImageRGB(img);
            }
          }
        };
      });
    }, 100);
  };
})();

/* ============================================================
   PWA INSTALL PROMPT
   Captures beforeinstallprompt event and shows a subtle banner.
============================================================ */
(function initPWAInstall() {
  let _deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    // Show install button after a short delay so it doesn't interrupt
    setTimeout(showInstallBanner, 3000);
  });

  function showInstallBanner() {
    if (!_deferredPrompt) return;
    if (document.getElementById('pwa-install-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:var(--bg-panel);border:1px solid var(--line-strong);padding:10px 18px;display:flex;align-items:center;gap:12px;font-family:var(--font-ui);font-size:11px;letter-spacing:0.04em;color:var(--ink);box-shadow:0 4px 20px rgba(0,0,0,0.2);';
    banner.innerHTML = `
      <span>install insposearch as an app</span>
      <button id="pwa-install-btn" style="background:var(--accent);color:#0E0E0D;border:none;padding:6px 14px;font-family:var(--font-ui);font-size:10px;cursor:pointer;letter-spacing:0.06em;">install</button>
      <button id="pwa-dismiss-btn" style="background:none;border:none;color:var(--ink-3);cursor:pointer;font-size:14px;line-height:1;">&times;</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      banner.remove();
      if (_deferredPrompt) {
        _deferredPrompt.prompt();
        await _deferredPrompt.userChoice;
        _deferredPrompt = null;
      }
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      banner.remove();
      _deferredPrompt = null;
    });
  }
})();

/* ------------------------------------------------------------------
   Discover Landing — shown when no search is active
   ------------------------------------------------------------------ */
(function initDiscoverLanding() {
  const POPULAR = [
    'still life', 'portrait', 'landscape', 'botanical', 'architecture',
    'mythology', 'water', 'light', 'textile', 'manuscript',
    'sculpture', 'ceramic', 'gold', 'vanitas', 'japanese'
  ];

  const CATEGORIES = [
    { name: 'paintings',      query: 'painting oil canvas' },
    { name: 'photography',    query: 'photograph vintage' },
    { name: 'sculpture',      query: 'sculpture marble bronze' },
    { name: 'architecture',   query: 'architecture building cathedral' },
    { name: 'manuscripts',    query: 'manuscript illuminated medieval' },
    { name: 'maps & charts',  query: 'map cartography atlas' },
    { name: 'textiles',       query: 'textile tapestry embroidery' },
    { name: 'prints',         query: 'print etching engraving woodcut' },
    { name: 'ceramics',       query: 'ceramic pottery porcelain' },
    { name: 'natural history', query: 'botanical flora fauna specimen' },
  ];

  const HEROES = [
    { label: "today's muse",  title: 'the dutch golden age',          sub: 'rembrandt, vermeer, and the art of everyday life',   query: 'dutch golden age painting',     imgKey: 'the dutch golden age' },
    { label: 'explore',       title: 'japanese woodblock prints',     sub: 'ukiyo-e masters \u2014 hokusai, hiroshige, utamaro', query: 'ukiyo-e woodblock print',        imgKey: 'japanese woodblock prints' },
    { label: 'discover',      title: 'art nouveau & organic form',    sub: 'when nature met design \u2014 mucha, klimt, gall\u00e9', query: 'art nouveau ornamental',      imgKey: 'art nouveau & organic form' },
    { label: 'look closer',   title: 'illuminated manuscripts',       sub: 'gold leaf, ultramarine, and sacred geometry',        query: 'illuminated manuscript medieval', imgKey: 'illuminated manuscripts' },
    { label: 'inspiration',   title: 'botanical illustration',        sub: 'the beauty of scientific precision',                 query: 'botanical illustration flower',  imgKey: 'botanical illustration' },
    { label: 'venture into',  title: 'ancient maps & cartography',    sub: 'when the edges of the world were imagined',          query: 'antique map cartography',        imgKey: 'ancient maps & cartography' },
    { label: 'a closer look', title: 'impressionist light',           sub: 'monet, renoir, and the capture of fleeting moments', query: 'impressionist painting light',   imgKey: 'impressionist light' },
  ];

  // Image pools — fetched once from homepage-images.json, then cached
  var _imgPools = null;

  function getDay() { return Math.floor(Date.now() / 86400000); }

  // Pick a URL from a pool by day+offset so each slot rotates independently
  function pickFromPool(pools, key, offset) {
    if (!pools) return '';
    var pool = pools[key];
    if (!pool || !pool.length) return '';
    return pool[(getDay() * 7 + (offset || 0)) % pool.length] || '';
  }

  function getHeroOfDay() {
    return HEROES[getDay() % HEROES.length];
  }

  function escAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function buildHTML(pools) {
    const hero = getHeroOfDay();
    const heroImg = pickFromPool(pools ? pools.heroes : null, hero.imgKey, 0);
    const heroStyle = heroImg
      ? ' style="background-image:url(\'' + escAttr(heroImg) + '\')"'
      : '';

    const pillsHTML = POPULAR.map(t =>
      '<button class="discover-pill" data-query="' + escAttr(t) + '">' + escHtml(t) + '</button>'
    ).join('');

    const catsHTML = CATEGORIES.map(function(c, idx) {
      var bgImg = pickFromPool(pools ? pools.categories : null, c.name, idx + 1);
      var style = bgImg
        ? ' style="background-image:url(\'' + escAttr(bgImg) + '\')"'
        : '';
      return '<button class="discover-cat" data-query="' + escAttr(c.query) + '"' + style + '>' +
        '<span class="discover-cat-name">' + escHtml(c.name) + '</span>' +
      '</button>';
    }).join('');

    return '<div id="discover-landing" class="discover-landing" style="grid-column:1/-1;">' +
      '<div class="discover-hero"' + heroStyle + ' data-query="' + escAttr(hero.query) + '">' +
        '<div class="discover-hero-content">' +
          '<div class="discover-hero-label">' + escHtml(hero.label) + '</div>' +
          '<div class="discover-hero-title">' + escHtml(hero.title) + '</div>' +
          '<div class="discover-hero-sub">' + escHtml(hero.sub) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="discover-section">' +
        '<div class="discover-section-label">popular searches</div>' +
        '<div class="discover-pills">' + pillsHTML + '</div>' +
      '</div>' +
      '<div class="discover-section">' +
        '<div class="discover-section-label">browse by category</div>' +
        '<div class="discover-categories">' + catsHTML + '</div>' +
      '</div>' +
    '</div>';
  }

  function show() {
    const grid = document.getElementById('image-grid');
    if (!grid || grid.querySelector('#discover-landing')) return;
    const es = grid.querySelector('.empty-state');
    if (es) es.style.display = 'none';

    // Insert with whatever we have (may be no images yet while fetch completes)
    grid.insertAdjacentHTML('afterbegin', buildHTML(_imgPools));

    // Fetch image pools if not yet loaded, then patch background-images in place
    if (!_imgPools) {
      fetch('data/homepage-images.json')
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(pools) {
          if (!pools) return;
          _imgPools = pools;
          // Patch hero background
          var heroEl = document.querySelector('.discover-hero');
          if (heroEl && !heroEl.style.backgroundImage) {
            var hero = getHeroOfDay();
            var img = pickFromPool(pools.heroes, hero.imgKey, 0);
            if (img) heroEl.style.backgroundImage = 'url(\'' + img.replace(/'/g, "\\'") + '\')';
          }
          // Patch category backgrounds
          document.querySelectorAll('.discover-cat').forEach(function(btn, idx) {
            if (!btn.style.backgroundImage) {
              var cat = CATEGORIES[idx];
              if (!cat) return;
              var img = pickFromPool(pools.categories, cat.name, idx + 1);
              if (img) btn.style.backgroundImage = 'url(\'' + img.replace(/'/g, "\\'") + '\')';
            }
          });
        })
        .catch(function() {});
    }
  }

  // Delegate clicks inside #image-grid for discover elements
  document.getElementById('image-grid').addEventListener('click', function (e) {
    var target = e.target.closest('.discover-pill') ||
                 e.target.closest('.discover-cat') ||
                 e.target.closest('.discover-hero');
    if (!target || !target.dataset.query) return;
    var q = target.dataset.query;
    document.getElementById('search-input').value = q;
    runSearch(q);
  });

  // Re-show when logo resets the search
  document.querySelector('.logo').addEventListener('click', function () {
    requestAnimationFrame(show);
  });

  // Expose for external use
  window._showDiscoverLanding = show;

  // Show on initial page load
  show();
})();

/* ------------------------------------------------------------------
   Onboarding Tour & Help Cheat Sheet
   ------------------------------------------------------------------ */
(function initOnboardingTour() {
  var TOUR_STEPS = [
    { el: '#search-input',        title: 'search',          body: 'type any word, feeling, or concept. explore mode automatically expands your query with synonyms.' },
    { el: '#btn-search-mode',     title: 'search mode',     body: 'toggle between explore (synonym expansion) and exact (literal terms only).' },
    { el: '#count-slider',        title: 'image count',     body: 'drag to control how many images load per source. higher = more results but slower.' },
    { el: '#btn-settings',        title: 'api keys',        body: 'manage api keys to unlock premium sources like unsplash, met museum iiif, and more.' },
    { el: '#sources-active-counter', title: 'active sources', body: 'shows how many sources are currently enabled and responding.' },
    { el: '#btn-board',           title: 'board mode',      body: 'click images to select them, then switch to board to arrange and export your picks.' },
  ];

  var _backdrop = null;
  var _tooltip = null;
  var _step = 0;

  function startTour() {
    _step = 0;
    _backdrop = document.createElement('div');
    _backdrop.className = 'tour-backdrop';
    _backdrop.addEventListener('click', endTour);
    document.body.appendChild(_backdrop);
    showStep();
  }

  function showStep() {
    if (_step >= TOUR_STEPS.length) { endTour(); return; }
    var s = TOUR_STEPS[_step];
    var target = document.querySelector(s.el);
    if (!target) { _step++; showStep(); return; }

    // Remove previous highlight
    var prev = document.querySelector('.tour-highlight');
    if (prev) prev.classList.remove('tour-highlight');
    target.classList.add('tour-highlight');

    // Remove old tooltip
    if (_tooltip) _tooltip.remove();

    _tooltip = document.createElement('div');
    _tooltip.className = 'tour-tooltip';
    _tooltip.innerHTML =
      '<div class="tour-tooltip-title">' + s.title + '</div>' +
      '<div class="tour-tooltip-body">' + s.body + '</div>' +
      '<div class="tour-tooltip-footer">' +
        '<button class="tour-tooltip-skip" id="tour-skip">skip tour</button>' +
        '<span class="tour-tooltip-step">' + (_step + 1) + ' / ' + TOUR_STEPS.length + '</span>' +
        '<button class="tour-tooltip-btn" id="tour-next">' + (_step < TOUR_STEPS.length - 1 ? 'next' : 'done') + '</button>' +
      '</div>';
    document.body.appendChild(_tooltip);

    // Position tooltip near target
    var rect = target.getBoundingClientRect();
    var ttW = _tooltip.offsetWidth;
    var ttH = _tooltip.offsetHeight;
    var left = rect.left + rect.width / 2 - ttW / 2;
    var top = rect.bottom + 12;
    // If too far right, shift
    if (left + ttW > window.innerWidth - 12) left = window.innerWidth - ttW - 12;
    if (left < 12) left = 12;
    // If below viewport, flip above
    if (top + ttH > window.innerHeight - 12) top = rect.top - ttH - 12;
    _tooltip.style.left = left + 'px';
    _tooltip.style.top = top + 'px';

    document.getElementById('tour-next').addEventListener('click', function () { _step++; showStep(); });
    document.getElementById('tour-skip').addEventListener('click', endTour);
  }

  function endTour() {
    var hl = document.querySelector('.tour-highlight');
    if (hl) hl.classList.remove('tour-highlight');
    if (_tooltip) { _tooltip.remove(); _tooltip = null; }
    if (_backdrop) { _backdrop.remove(); _backdrop = null; }
    try { localStorage.setItem('inspo_tour_done', '1'); } catch (_) {}
  }

  // Auto-start on first visit
  try {
    if (!localStorage.getItem('inspo_tour_done')) {
      setTimeout(startTour, 800);
    }
  } catch (_) {}

  // ---- Cheat Sheet Overlay ----
  var CHEAT_HTML =
    '<div class="cheat-overlay" id="cheat-overlay">' +
      '<div class="cheat-panel" style="position:relative;">' +
        '<button class="cheat-close" id="cheat-close">&times;</button>' +
        '<h2>help & shortcuts</h2>' +
        '<h3>search syntax</h3>' +
        '<dl>' +
          '<dt><code>marble</code></dt><dd>search with synonym expansion (explore mode)</dd>' +
          '<dt><code>"exact phrase"</code></dt><dd>match these words exactly</dd>' +
          '<dt><code>marble NOT statue</code></dt><dd>exclude results containing "statue"</dd>' +
          '<dt><code>landscape --no:photo</code></dt><dd>negative filter by source type</dd>' +
        '</dl>' +
        '<h3>keyboard shortcuts</h3>' +
        '<dl>' +
          '<dt><code>Enter</code></dt><dd>run search</dd>' +
          '<dt><code>Ctrl/Cmd + Shift + E</code></dt><dd>toggle explore / exact mode</dd>' +
          '<dt><code>Escape</code></dt><dd>close modals and panels</dd>' +
        '</dl>' +
        '<h3>tips</h3>' +
        '<dl>' +
          '<dt>select images</dt><dd>click any image to select it, then use board or compare</dd>' +
          '<dt>boards</dt><dd>switch to board view to arrange, annotate, and export selected images</dd>' +
          '<dt>color swatches</dt><dd>click a swatch to filter results by dominant color</dd>' +
        '</dl>' +
        '<div style="margin-top:20px; text-align:center;">' +
          '<button class="tour-tooltip-btn" id="cheat-tour-btn">restart tour</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  function showCheatSheet() {
    if (document.getElementById('cheat-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', CHEAT_HTML);
    document.getElementById('cheat-close').addEventListener('click', hideCheatSheet);
    document.getElementById('cheat-overlay').addEventListener('click', function (e) {
      if (e.target === this) hideCheatSheet();
    });
    document.getElementById('cheat-tour-btn').addEventListener('click', function () {
      hideCheatSheet();
      try { localStorage.removeItem('inspo_tour_done'); } catch (_) {}
      startTour();
    });
  }

  function hideCheatSheet() {
    var el = document.getElementById('cheat-overlay');
    if (el) el.remove();
  }

  // Help button
  var helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.addEventListener('click', showCheatSheet);

  // ESC closes cheat sheet
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideCheatSheet();
  });
})();

/* ------------------------------------------------------------------
   Hex Color Palette Search — CIE76 delta-E distance matching
   ------------------------------------------------------------------ */
(function initHexPalette() {
  var MAX_COLORS = 5;
  var palette = []; // array of {hex, rgb:[r,g,b]}

  var pickerEl = document.getElementById('hex-picker');
  var inputEl  = document.getElementById('hex-input');
  var addBtn   = document.getElementById('hex-add-btn');
  var chipsEl  = document.getElementById('hex-chips');
  if (!pickerEl || !inputEl || !addBtn || !chipsEl) return;

  // Sync picker → text field
  pickerEl.addEventListener('input', function () { inputEl.value = pickerEl.value; });

  function hexToRGB(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }

  // Uses global rgbToLab + deltaE00 (CIEDE2000) defined above

  function addColor(hex) {
    if (palette.length >= MAX_COLORS) return;
    hex = hex.trim().toLowerCase();
    if (!hex.startsWith('#')) hex = '#' + hex;
    var rgb = hexToRGB(hex);
    if (!rgb) return;
    if (palette.some(function(c) { return c.hex === hex; })) return;
    palette.push({ hex: hex, rgb: rgb });
    renderChips();
    applyPaletteFilter();
    updateURL();
  }

  function removeColor(idx) {
    palette.splice(idx, 1);
    renderChips();
    applyPaletteFilter();
    updateURL();
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    palette.forEach(function (c, i) {
      var chip = document.createElement('span');
      chip.className = 'hex-chip';
      chip.innerHTML =
        '<span class="hex-chip-swatch" style="background:' + c.hex + ';"></span>' +
        '<span>' + c.hex + '</span>' +
        '<button class="hex-chip-remove" data-idx="' + i + '">&times;</button>';
      chipsEl.appendChild(chip);
    });
  }

  chipsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.hex-chip-remove');
    if (btn) removeColor(parseInt(btn.dataset.idx, 10));
  });

  addBtn.addEventListener('click', function () {
    addColor(inputEl.value || pickerEl.value);
  });
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addColor(inputEl.value || pickerEl.value);
  });

  // Clear named-color swatch when palette is active, and vice versa
  function clearNamedSwatches() {
    var btns = document.querySelectorAll('.color-swatch-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    var allBtn = document.querySelector('.color-swatch-btn[data-color="all"]');
    if (allBtn) allBtn.classList.add('active');
    STATE._colorFilter = 'all';
  }

  var THRESHOLD = 18; // CIEDE2000 perceptual threshold

  function applyPaletteFilter() {
    STATE._hexPalette = palette.length ? palette.slice() : null;
    if (palette.length) clearNamedSwatches();
    if (typeof refilterResults === 'function') refilterResults();
  }

  // URL param support: ?palette=ff5733-3498db
  function updateURL() {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location);
    if (palette.length) {
      url.searchParams.set('palette', palette.map(function(c) { return c.hex.slice(1); }).join('-'));
    } else {
      url.searchParams.delete('palette');
    }
    window.history.replaceState(null, '', url);
  }

  function loadFromURL() {
    try {
      var p = new URLSearchParams(window.location.search).get('palette');
      if (!p) return;
      p.split('-').forEach(function(h) { addColor('#' + h); });
    } catch (_) {}
  }

  // Expose for refilterResults
  window._hexPaletteMatch = function (item) {
    if (!STATE._hexPalette || !STATE._hexPalette.length) return true;
    var colors = item._topColors;
    if (!colors || !colors.length) {
      if (!item._avgRGB) return false;
      colors = [{ r: item._avgRGB[0], g: item._avgRGB[1], b: item._avgRGB[2] }];
    }
    for (var i = 0; i < STATE._hexPalette.length; i++) {
      var pLab = rgbToLab(STATE._hexPalette[i].rgb[0], STATE._hexPalette[i].rgb[1], STATE._hexPalette[i].rgb[2]);
      for (var j = 0; j < colors.length; j++) {
        var cLab = rgbToLab(colors[j].r, colors[j].g, colors[j].b);
        if (deltaE00(pLab, cLab) <= THRESHOLD) return true;
      }
    }
    return false;
  };

  loadFromURL();
})();

/* ------------------------------------------------------------------
   Taxonomy Browse — expandable categories in sidebar
   ------------------------------------------------------------------ */
(function initTaxonomyBrowse() {
  var TAXONOMY = [
    { name: 'movements', tags: [
      { label: 'renaissance',     query: 'renaissance painting' },
      { label: 'baroque',         query: 'baroque art painting' },
      { label: 'rococo',          query: 'rococo ornamental painting' },
      { label: 'romanticism',     query: 'romanticism painting' },
      { label: 'impressionism',   query: 'impressionist painting' },
      { label: 'post-impressionism', query: 'post-impressionist art' },
      { label: 'art nouveau',     query: 'art nouveau design' },
      { label: 'art deco',        query: 'art deco design' },
      { label: 'expressionism',   query: 'expressionist art painting' },
      { label: 'cubism',          query: 'cubist art painting' },
      { label: 'surrealism',      query: 'surrealist art' },
      { label: 'abstract',        query: 'abstract art painting' },
      { label: 'minimalism',      query: 'minimalist art' },
      { label: 'pop art',         query: 'pop art' },
    ]},
    { name: 'genres', tags: [
      { label: 'portrait',        query: 'portrait painting' },
      { label: 'landscape',       query: 'landscape painting' },
      { label: 'still life',      query: 'still life painting' },
      { label: 'history painting', query: 'history painting' },
      { label: 'genre scene',     query: 'genre painting daily life' },
      { label: 'religious',       query: 'religious art sacred painting' },
      { label: 'mythology',       query: 'mythological painting' },
      { label: 'nude',            query: 'nude figure painting' },
      { label: 'marine',          query: 'marine painting seascape' },
      { label: 'vanitas',         query: 'vanitas still life memento mori' },
    ]},
    { name: 'media', tags: [
      { label: 'oil painting',    query: 'oil painting canvas' },
      { label: 'watercolor',      query: 'watercolor painting' },
      { label: 'fresco',          query: 'fresco mural painting' },
      { label: 'etching',         query: 'etching print' },
      { label: 'lithograph',      query: 'lithograph print' },
      { label: 'woodcut',         query: 'woodcut print' },
      { label: 'engraving',       query: 'engraving print' },
      { label: 'drawing',         query: 'drawing charcoal pencil' },
      { label: 'pastel',          query: 'pastel drawing painting' },
      { label: 'mosaic',          query: 'mosaic tile art' },
      { label: 'tapestry',        query: 'tapestry weaving textile' },
      { label: 'photograph',      query: 'photograph vintage' },
    ]},
    { name: 'periods', tags: [
      { label: 'ancient',         query: 'ancient art antiquity' },
      { label: 'medieval',        query: 'medieval art' },
      { label: '15th century',    query: '15th century art 1400s' },
      { label: '16th century',    query: '16th century art 1500s' },
      { label: '17th century',    query: '17th century art 1600s' },
      { label: '18th century',    query: '18th century art 1700s' },
      { label: '19th century',    query: '19th century art 1800s' },
      { label: 'early 20th c.',   query: '20th century early modern art' },
      { label: 'contemporary',    query: 'contemporary art modern' },
    ]},
    { name: 'regions', tags: [
      { label: 'italian',         query: 'italian art painting' },
      { label: 'dutch & flemish', query: 'dutch flemish painting' },
      { label: 'french',          query: 'french art painting' },
      { label: 'spanish',         query: 'spanish art painting' },
      { label: 'german',          query: 'german art painting' },
      { label: 'british',         query: 'british art painting' },
      { label: 'japanese',        query: 'japanese art ukiyo-e' },
      { label: 'chinese',         query: 'chinese art painting' },
      { label: 'islamic',         query: 'islamic art calligraphy' },
      { label: 'african',         query: 'african art sculpture' },
      { label: 'pre-columbian',   query: 'pre-columbian mesoamerican art' },
    ]},
  ];

  var tree = document.getElementById('taxonomy-tree');
  if (!tree) return;

  TAXONOMY.forEach(function (group) {
    var div = document.createElement('div');
    div.className = 'taxonomy-group';
    var tagsHTML = group.tags.map(function (t) {
      return '<button class="taxonomy-tag" data-query="' + t.query.replace(/"/g, '&quot;') + '">' + t.label + '</button>';
    }).join('');
    div.innerHTML =
      '<button class="taxonomy-group-header">' +
        '<span>' + group.name + '</span>' +
        '<span class="taxonomy-group-arrow">\u25B6</span>' +
      '</button>' +
      '<div class="taxonomy-group-body">' + tagsHTML + '</div>';
    tree.appendChild(div);
  });

  tree.addEventListener('click', function (e) {
    var header = e.target.closest('.taxonomy-group-header');
    if (header) {
      header.parentElement.classList.toggle('open');
      return;
    }
    var tag = e.target.closest('.taxonomy-tag');
    if (tag && tag.dataset.query) {
      document.getElementById('search-input').value = tag.dataset.query;
      runSearch(tag.dataset.query);
    }
  });
})();

/* ------------------------------------------------------------------
   Artist Entity Pages — extract artist, show panel with works
   ------------------------------------------------------------------ */
(function initArtistEntity() {
  var _wikiCache = {}; // sessionStorage fallback

  function extractArtist(item) {
    if (!item || !item.description) return null;
    // Take first segment before " — " or " - "
    var parts = item.description.split(/\s[\u2014\u2013\-]\s/);
    var name = (parts[0] || '').trim();
    // Skip if it looks like medium/date rather than a name
    if (!name || name.length < 3 || /^\d{4}/.test(name) || /^(oil|watercolor|photograph|drawing|etching|lithograph|engraving|pastel|ink|tempera|fresco)/i.test(name)) return null;
    // Skip if it contains "unknown" or "anonymous"
    if (/unknown|anonymous|unidentified|after\s|attributed|circle|school|workshop|manner|follower|studio/i.test(name)) return null;
    return name;
  }

  function getArtistWorks(artistName) {
    return STATE.results.filter(function (item) {
      return extractArtist(item) === artistName;
    });
  }

  function fetchWikidata(name) {
    return new Promise(function (resolve) {
      var cached = _wikiCache[name];
      if (cached) { resolve(cached); return; }
      try {
        var s = sessionStorage.getItem('inspo_wiki_' + name);
        if (s) { _wikiCache[name] = JSON.parse(s); resolve(_wikiCache[name]); return; }
      } catch (_) {}

      var url = 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=' +
        encodeURIComponent(name) + '&language=en&limit=1&format=json&origin=*';

      fetch(url).then(function (r) { return r.json(); }).then(function (data) {
        var entity = data.search && data.search[0];
        if (!entity) { resolve(null); return; }
        var qid = entity.id;
        var detailUrl = 'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' + qid +
          '&props=claims|descriptions&languages=en&format=json&origin=*';
        return fetch(detailUrl).then(function (r2) { return r2.json(); }).then(function (d2) {
          var ent = d2.entities && d2.entities[qid];
          if (!ent) { resolve(null); return; }
          var claims = ent.claims || {};
          var info = {
            description: ent.descriptions && ent.descriptions.en ? ent.descriptions.en.value : '',
            birth: claims.P569 && claims.P569[0]
              ? (claims.P569[0].mainsnak.datavalue && claims.P569[0].mainsnak.datavalue.value.time || '').slice(1, 5) : '',
            death: claims.P570 && claims.P570[0]
              ? (claims.P570[0].mainsnak.datavalue && claims.P570[0].mainsnak.datavalue.value.time || '').slice(1, 5) : '',
          };
          _wikiCache[name] = info;
          try { sessionStorage.setItem('inspo_wiki_' + name, JSON.stringify(info)); } catch (_) {}
          resolve(info);
        });
      }).catch(function () { resolve(null); });
    });
  }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function openArtistPanel(artistName) {
    if (document.querySelector('.artist-overlay')) return;
    var works = getArtistWorks(artistName);
    var thumbsHTML = works.slice(0, 12).map(function (it) {
      return '<img class="artist-panel-thumb" src="' + esc(it.thumb || it.url) + '" alt="' + esc(it.title) + '" crossorigin="anonymous">';
    }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'artist-overlay';
    overlay.innerHTML =
      '<div class="artist-panel">' +
        '<button class="artist-panel-close">&times;</button>' +
        '<div class="artist-panel-name">' + esc(artistName) + '</div>' +
        '<div class="artist-panel-meta" id="artist-meta">' + tr('loading') + '</div>' +
        '<div class="artist-panel-works">' + thumbsHTML + '</div>' +
        '<button class="artist-panel-search">' + tr('searchAllBy') + ' ' + esc(artistName) + '</button>' +
      '</div>';
    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.artist-panel-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    // Search button
    overlay.querySelector('.artist-panel-search').addEventListener('click', function () {
      overlay.remove();
      document.getElementById('search-input').value = artistName;
      runSearch(artistName);
    });

    // Fetch Wikidata
    fetchWikidata(artistName).then(function (info) {
      var meta = document.getElementById('artist-meta');
      if (!meta) return;
      if (!info) { meta.textContent = works.length + ' ' + tr('worksInResults'); return; }
      var parts = [];
      if (info.description) parts.push(info.description);
      if (info.birth) parts.push((info.birth || '?') + ' \u2013 ' + (info.death || 'present'));
      parts.push(works.length + ' ' + tr('worksInResults'));
      meta.textContent = parts.join(' \u00B7 ');
    });
  }

  // Make artist name clickable in grid card descriptions
  // We'll add an artist link via the existing grid delegation
  var grid = document.getElementById('image-grid');
  if (!grid) return;

  // Double-click on a card's description area opens artist panel
  grid.addEventListener('dblclick', function (e) {
    var card = e.target.closest('.image-card');
    if (!card) return;
    var item = _gridItemMap.get(card.dataset.id);
    if (!item) return;
    var artist = extractArtist(item);
    if (artist) openArtistPanel(artist);
  });

  // Expose for external use
  window._extractArtist = extractArtist;
  window._openArtistPanel = openArtistPanel;
})();

/* ------------------------------------------------------------------
   Visual Similarity — "More Like This" re-sort
   Uses color distance + tag overlap (no ML model needed)
   ------------------------------------------------------------------ */
(function initVisualSimilarity() {
  function rgbToLab(r, g, b) {
    var rl = r/255, gl = g/255, bl = b/255;
    rl = rl > 0.04045 ? Math.pow((rl+0.055)/1.055, 2.4) : rl/12.92;
    gl = gl > 0.04045 ? Math.pow((gl+0.055)/1.055, 2.4) : gl/12.92;
    bl = bl > 0.04045 ? Math.pow((bl+0.055)/1.055, 2.4) : bl/12.92;
    var x = (rl*0.4124564 + gl*0.3575761 + bl*0.1804375) / 0.95047;
    var y = (rl*0.2126729 + gl*0.7151522 + bl*0.0721750);
    var z = (rl*0.0193339 + gl*0.1191920 + bl*0.9503041) / 1.08883;
    var fx = x > 0.008856 ? Math.cbrt(x) : (7.787*x + 16/116);
    var fy = y > 0.008856 ? Math.cbrt(y) : (7.787*y + 16/116);
    var fz = z > 0.008856 ? Math.cbrt(z) : (7.787*z + 16/116);
    return [116*fy - 16, 500*(fx - fy), 200*(fy - fz)];
  }

  function deltaE(rgb1, rgb2) {
    var lab1 = rgbToLab(rgb1[0], rgb1[1], rgb1[2]);
    var lab2 = rgbToLab(rgb2[0], rgb2[1], rgb2[2]);
    return Math.sqrt(
      Math.pow(lab1[0]-lab2[0],2) + Math.pow(lab1[1]-lab2[1],2) + Math.pow(lab1[2]-lab2[2],2)
    );
  }

  function tagOverlap(tagsA, tagsB) {
    if (!tagsA || !tagsB || !tagsA.length || !tagsB.length) return 0;
    var setA = new Set(tagsA);
    var inter = 0;
    for (var i = 0; i < tagsB.length; i++) { if (setA.has(tagsB[i])) inter++; }
    var union = new Set(tagsA.concat(tagsB)).size;
    return union ? inter / union : 0;
  }

  function similarity(refItem, item) {
    var colorScore = 0;
    if (refItem._avgRGB && item._avgRGB) {
      var de = deltaE(refItem._avgRGB, item._avgRGB);
      colorScore = Math.max(0, 1 - de / 100); // normalize to 0-1
    }
    var tagScore = tagOverlap(refItem.tags, item.tags);
    var aspectScore = (refItem._aspect && item._aspect && refItem._aspect === item._aspect) ? 1 : 0;
    return colorScore * 0.5 + tagScore * 0.35 + aspectScore * 0.15;
  }

  function moreLikeThis(refItem) {
    if (!refItem || !STATE.results.length) return;
    var scored = STATE.results
      .filter(function (it) { return it.id !== refItem.id; })
      .map(function (it) { return { item: it, score: similarity(refItem, it) }; })
      .sort(function (a, b) { return b.score - a.score; });

    clearGrid();
    // Add a banner
    var grid = document.getElementById('image-grid');
    var banner = document.createElement('div');
    banner.className = 'sim-banner';
    banner.innerHTML =
      '<span>showing results similar to: <strong>' +
      (refItem.title || 'untitled').replace(/</g, '&lt;') +
      '</strong></span>' +
      '<button class="sim-banner-close" title="clear">&times;</button>';
    grid.appendChild(banner);
    banner.querySelector('.sim-banner-close').addEventListener('click', function () {
      clearGrid();
      renderGrid(getDisplayResults(STATE.results, STATE.query));
    });

    var items = scored.map(function (s) { return s.item; });
    renderGrid(items);
  }

  // Delegate click on .sim-btn
  document.getElementById('image-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('.sim-btn');
    if (!btn) return;
    e.stopPropagation();
    var card = btn.closest('.image-card');
    if (!card) return;
    var item = _gridItemMap.get(card.dataset.id);
    if (item) moreLikeThis(item);
  });
})();

/* ------------------------------------------------------------------
   Stories / Editorial — curated themed articles
   ------------------------------------------------------------------ */
(function initStories() {
  var STORIES = [
    {
      id: 'dutch-light',
      title: 'The Science of Dutch Light',
      intro: 'How 17th-century Dutch painters captured light that still feels alive today.',
      searches: [
        { label: 'vermeer interiors', query: 'vermeer interior light' },
        { label: 'rembrandt chiaroscuro', query: 'rembrandt chiaroscuro shadow' },
        { label: 'dutch still life', query: 'dutch golden age still life' },
      ],
    },
    {
      id: 'pattern-nature',
      title: 'Patterns in Nature',
      intro: 'From spiral shells to fractal ferns \u2014 how artists recorded the geometry of the natural world.',
      searches: [
        { label: 'botanical illustration', query: 'botanical illustration scientific' },
        { label: 'shells & specimens', query: 'shell specimen natural history' },
        { label: 'ernst haeckel', query: 'haeckel kunstformen natur' },
      ],
    },
    {
      id: 'gold-sacred',
      title: 'Gold & the Sacred',
      intro: 'The use of gold leaf from Byzantine icons to Klimt \u2014 when material becomes meaning.',
      searches: [
        { label: 'byzantine icons', query: 'byzantine icon gold' },
        { label: 'illuminated manuscripts', query: 'illuminated manuscript gold leaf' },
        { label: 'klimt gold', query: 'klimt gold painting' },
      ],
    },
    {
      id: 'map-edge',
      title: 'At the Edge of the Map',
      intro: 'Sea monsters, terra incognita, and the art of mapping the unknown.',
      searches: [
        { label: 'antique maps', query: 'antique map world cartography' },
        { label: 'sea monsters', query: 'sea monster map illustration' },
        { label: 'celestial charts', query: 'celestial chart constellation map' },
      ],
    },
    {
      id: 'color-blue',
      title: 'The Invention of Blue',
      intro: 'From ultramarine to Prussian blue \u2014 the expensive, rare, and sometimes accidental history of a color.',
      searches: [
        { label: 'ultramarine paintings', query: 'ultramarine blue painting' },
        { label: 'delftware', query: 'delft blue porcelain' },
        { label: 'cyanotype', query: 'cyanotype blueprint photograph' },
      ],
    },
    {
      id: 'body-motion',
      title: 'The Body in Motion',
      intro: 'From Greek athletes to Degas dancers \u2014 capturing movement in stillness.',
      searches: [
        { label: 'greek sculpture', query: 'greek sculpture athlete' },
        { label: 'degas dancers', query: 'degas dancer ballet' },
        { label: 'muybridge motion', query: 'muybridge motion photograph' },
      ],
    },
    {
      id: 'print-revolution',
      title: 'The Print Revolution',
      intro: 'How woodcuts, etchings, and lithographs democratized images before photography.',
      searches: [
        { label: 'd\u00fcrer woodcuts', query: 'durer woodcut print' },
        { label: 'hokusai prints', query: 'hokusai ukiyo-e woodblock' },
        { label: 'goya etchings', query: 'goya etching caprichos' },
      ],
    },
    {
      id: 'garden-paradise',
      title: 'The Garden as Paradise',
      intro: 'Walled gardens, pleasure grounds, and painted edens across cultures.',
      searches: [
        { label: 'persian gardens', query: 'persian garden miniature painting' },
        { label: 'monet giverny', query: 'monet garden water lilies giverny' },
        { label: 'botanical gardens', query: 'botanical garden illustration' },
      ],
    },
    {
      id: 'textile-world',
      title: 'Woven Worlds',
      intro: 'Tapestries, silks, and embroideries that tell stories thread by thread.',
      searches: [
        { label: 'medieval tapestry', query: 'medieval tapestry unicorn' },
        { label: 'japanese textiles', query: 'japanese kimono textile pattern' },
        { label: 'william morris', query: 'william morris textile design pattern' },
      ],
    },
    {
      id: 'night-sky',
      title: 'Under the Night Sky',
      intro: 'How artists painted darkness, stars, and the mystery between dusk and dawn.',
      searches: [
        { label: 'nocturne paintings', query: 'nocturne night painting' },
        { label: 'starry skies', query: 'star night sky painting' },
        { label: 'moon illustrations', query: 'moon illustration astronomy' },
      ],
    },
  ];

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  // ---- Story reader overlay ----
  function openStory(story) {
    if (document.getElementById('story-overlay')) return;
    var searchBtns = story.searches.map(function (s) {
      return '<button class="story-search-btn" data-query="' + esc(s.query) + '">' + esc(s.label) + ' \u2192</button>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'story-overlay';
    overlay.className = 'story-overlay';
    overlay.innerHTML =
      '<div class="story-reader">' +
        '<button class="story-close">&times;</button>' +
        '<div class="story-reader-title">' + esc(story.title) + '</div>' +
        '<div class="story-reader-intro">' + esc(story.intro) + '</div>' +
        '<div class="story-reader-label">search this story</div>' +
        '<div class="story-reader-searches">' + searchBtns + '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.story-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.story-search-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        overlay.remove();
        document.getElementById('search-input').value = btn.dataset.query;
        runSearch(btn.dataset.query);
      });
    });
  }

  // ---- Stories list in sidebar ----
  // Inject a "stories" button near the chat button
  var chatSection = document.getElementById('btn-ai-chat');
  if (chatSection) {
    var storiesBtn = document.createElement('button');
    storiesBtn.className = 'btn';
    storiesBtn.id = 'btn-stories';
    storiesBtn.textContent = '\u270E stories';
    storiesBtn.style.marginTop = '4px';
    chatSection.parentElement.appendChild(storiesBtn);

    storiesBtn.addEventListener('click', function () {
      openStoriesList();
    });
  }

  function openStoriesList() {
    if (document.getElementById('stories-list-overlay')) return;
    var cardsHTML = STORIES.map(function (s) {
      return '<button class="stories-list-card" data-sid="' + s.id + '">' +
        '<div class="stories-list-title">' + esc(s.title) + '</div>' +
        '<div class="stories-list-intro">' + esc(s.intro) + '</div>' +
      '</button>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'stories-list-overlay';
    overlay.className = 'story-overlay';
    overlay.innerHTML =
      '<div class="stories-list-panel">' +
        '<button class="story-close">&times;</button>' +
        '<div class="stories-list-heading">stories</div>' +
        '<div class="stories-list-grid">' + cardsHTML + '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.story-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.stories-list-card').forEach(function (card) {
      card.addEventListener('click', function () {
        overlay.remove();
        var story = STORIES.find(function (s) { return s.id === card.dataset.sid; });
        if (story) openStory(story);
      });
    });
  }

  // Expose for discover landing
  window._inspoStories = STORIES;
  window._openStory = openStory;
})();

/* ------------------------------------------------------------------
   SEO — Dynamic title, meta description, Open Graph updates
   ------------------------------------------------------------------ */
(function initDynamicSEO() {
  var DEFAULT_TITLE = 'insposearch';
  var DEFAULT_DESC = 'Search 2487+ museum, archive, and photo sources for creative inspiration.';

  function updateMeta(name, content) {
    var el = document.querySelector('meta[property="' + name + '"]') ||
             document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute('content', content);
  }

  function setSearchMeta(query) {
    var title = query + ' — insposearch';
    var desc = 'Search results for "' + query + '" across 2487+ cultural heritage sources.';
    document.title = title;
    updateMeta('description', desc);
    updateMeta('og:title', title);
    updateMeta('og:description', desc);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', desc);
  }

  function resetMeta() {
    document.title = DEFAULT_TITLE;
    updateMeta('description', DEFAULT_DESC);
    updateMeta('og:title', DEFAULT_TITLE);
    updateMeta('og:description', DEFAULT_DESC);
    updateMeta('twitter:title', DEFAULT_TITLE);
    updateMeta('twitter:description', DEFAULT_DESC);
  }

  // Patch runSearch to update SEO on search
  var _origRunSearch = runSearch;
  runSearch = async function(query, forceRefresh) {
    setSearchMeta(query.trim());
    return _origRunSearch.call(this, query, forceRefresh);
  };
  // Keep window.runSearch in sync so external callers (taxonomy, stories) get SEO too
  window.runSearch = runSearch;

  // Reset on logo click
  document.querySelector('.logo').addEventListener('click', resetMeta);
})();

/* ============================================================
   VIRTUAL SCROLLING — Recycle off-screen cards
   When a card scrolls far out of view (>2000px margin), its
   heavy children (img, buttons) are detached and replaced with
   a lightweight placeholder that preserves the card's height.
   When the placeholder scrolls back near the viewport, the full
   card content is restored from a cache. This keeps the live
   DOM lean even with 1000+ results.
============================================================ */
(function initVirtualScroll() {
  const OFFSCREEN_MARGIN = '2000px';
  const _cardCache = new Map();  // id → DocumentFragment of removed children

  const virtualObs = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target;
      if (!card.classList.contains('image-card')) continue;
      const id = card.dataset.id;
      if (!id) continue;

      if (!entry.isIntersecting && !card.classList.contains('v-placeholder')) {
        // Card scrolled far offscreen — virtualize it
        const h = card.offsetHeight;
        const frag = document.createDocumentFragment();
        while (card.firstChild) frag.appendChild(card.firstChild);
        _cardCache.set(id, frag);
        card.classList.add('v-placeholder');
        card.style.minHeight = h + 'px';
      } else if (entry.isIntersecting && card.classList.contains('v-placeholder')) {
        // Card scrolling back into view — restore it
        const frag = _cardCache.get(id);
        if (frag) {
          card.appendChild(frag);
          _cardCache.delete(id);
          card.classList.remove('v-placeholder');
          card.style.minHeight = '';
        }
      }
    }
  }, { rootMargin: OFFSCREEN_MARGIN });

  // Observe cards as they are added to the grid
  const grid = document.getElementById('image-grid');
  const gridMO = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains('image-card')) {
          virtualObs.observe(node);
        }
        // Fragments append children directly
        if (node.nodeType === 1) {
          node.querySelectorAll && node.querySelectorAll('.image-card').forEach(c => virtualObs.observe(c));
        }
      }
    }
  });
  gridMO.observe(grid, { childList: true });
})();

/* ============================================================
   SEARCH-AS-YOU-TYPE — Live preview while typing
   After 500ms of idle typing (≥3 chars), fires a lightweight
   search using the already-prefetched keywords. Skips if the
   user hits Enter first (which triggers the full search).
============================================================ */
(function initSearchAsYouType() {
  const input = document.getElementById('search-input');
  let _saytTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(_saytTimer);
    const q = input.value.trim();
    if (q.length < 3) return;
    // Only update the history dropdown while typing — don't fire a full search
    _saytTimer = setTimeout(() => {
      renderSearchHistory(q);
    }, 300);
  });

  // Cancel preview if user submits with Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(_saytTimer);
    }
  });
})();

/* ============================================================
   ADVANCED SEARCH PANEL
   Structured form: query, date range, medium, region, category,
   color, orientation, exclude terms.  Builds a composite query
   string and applies filters before running the standard search.
============================================================ */
(function initAdvancedSearch() {
  var overlay  = document.getElementById('adv-search-overlay');
  var openBtn  = document.getElementById('btn-advanced-search');
  if (!overlay || !openBtn) return;

  var panel    = overlay.querySelector('.adv-panel');
  var closeBtn = document.getElementById('adv-close');
  var resetBtn = document.getElementById('adv-reset');
  var runBtn   = document.getElementById('adv-run');

  // Field references
  var qInput       = document.getElementById('adv-query');
  var dateFromEl   = document.getElementById('adv-date-from');
  var dateToEl     = document.getElementById('adv-date-to');
  var mediumEl     = document.getElementById('adv-medium');
  var orientEl     = document.getElementById('adv-orient');
  var regionEl     = document.getElementById('adv-region');
  var categoryEl   = document.getElementById('adv-category');
  var excludeEl    = document.getElementById('adv-exclude');
  var licenseEl    = document.getElementById('adv-license');
  var colorEnEl    = document.getElementById('adv-color-enable');
  var colorEl      = document.getElementById('adv-color');

  function open() {
    var q = document.getElementById('search-input').value.trim();
    if (qInput) qInput.value = q;
    overlay.style.display = 'block';
    // Focus query input after animation
    setTimeout(function() { if (qInput) qInput.focus(); }, 250);
  }

  function close() {
    overlay.style.display = 'none';
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.style.display === 'block') close();
  });

  // Reset all fields + state
  resetBtn.addEventListener('click', function() {
    if (qInput)     qInput.value = '';
    if (dateFromEl) dateFromEl.value = '';
    if (dateToEl)   dateToEl.value = '';
    if (mediumEl)   mediumEl.value = '';
    if (orientEl)   orientEl.value = '';
    if (regionEl)   regionEl.value = '';
    if (categoryEl) categoryEl.value = '';
    if (excludeEl)  excludeEl.value = '';
    if (licenseEl)  licenseEl.value = '';
    if (colorEnEl)  colorEnEl.checked = false;
    STATE._dateFilter = null;
    STATE._mediumFilter = null;
    STATE._aspectFilter = null;
    STATE._licenseFilter = null;
  });

  // Enter key in any input triggers search
  overlay.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.matches('.adv-input')) {
      e.preventDefault();
      runBtn.click();
    }
  });

  // Run search with all filters
  runBtn.addEventListener('click', function() {
    var query    = (qInput ? qInput.value : '').trim();
    var medium   = mediumEl   ? mediumEl.value   : '';
    var exclude  = (excludeEl ? excludeEl.value  : '').trim();
    var dateFrom = dateFromEl ? dateFromEl.value  : '';
    var dateTo   = dateToEl   ? dateToEl.value    : '';
    var region   = regionEl   ? regionEl.value    : '';
    var category = categoryEl ? categoryEl.value  : '';
    var orient   = orientEl   ? orientEl.value    : '';
    var colorEn  = colorEnEl  ? colorEnEl.checked : false;
    var color    = colorEl    ? colorEl.value     : '';

    // Build composite query string
    var parts = [];
    if (query)  parts.push(query);
    if (medium) parts.push(medium);
    var compositeQuery = parts.join(' ');

    // Append NOT terms
    if (exclude) {
      exclude.split(/[\s,]+/).filter(Boolean).forEach(function(t) {
        compositeQuery += ' NOT ' + t;
      });
    }

    if (!compositeQuery) {
      // Flash the query input to indicate it's required
      if (qInput) {
        qInput.style.borderColor = '#c0392b';
        setTimeout(function() { qInput.style.borderColor = ''; }, 1200);
      }
      return;
    }

    // Source category filter — enable only matching sources
    if (category && SOURCE_GROUPS[category]) {
      var groupSet = new Set(SOURCE_GROUPS[category]);
      ALL_SOURCES.forEach(function(sid) {
        if (groupSet.has(sid)) {
          STATE.disabledSources.delete(sid);
        } else {
          STATE.disabledSources.add(sid);
        }
      });
      if (typeof updateSourcesActiveCounter === 'function') updateSourcesActiveCounter();
    }

    // Region filter via SOURCE_META
    if (region) {
      ALL_SOURCES.forEach(function(sid) {
        var meta = SOURCE_META[sid];
        if (meta && meta.region === region) {
          STATE.disabledSources.delete(sid);
        } else if (meta && meta.region !== region) {
          STATE.disabledSources.add(sid);
        }
      });
      if (typeof updateSourcesActiveCounter === 'function') updateSourcesActiveCounter();
    }

    // Date range filter → STATE
    if (dateFrom || dateTo) {
      STATE._dateFilter = {
        from: parseInt(dateFrom, 10) || 0,
        to:   parseInt(dateTo, 10)   || 9999
      };
    } else {
      STATE._dateFilter = null;
    }

    // Medium filter → STATE (used by Europeana TYPE param + client-side filtering)
    STATE._mediumFilter = medium || null;

    // Orientation filter → STATE
    STATE._aspectFilter = orient || null;

    // License filter → STATE
    var license = licenseEl ? licenseEl.value : '';
    STATE._licenseFilter = license || null;

    // Color filter — add to hex palette
    if (colorEn && color) {
      var hInput = document.getElementById('hex-input');
      var hAdd   = document.getElementById('hex-add-btn');
      if (hInput && hAdd) {
        hInput.value = color;
        hAdd.click();
      }
    }

    // Set main search input and run
    document.getElementById('search-input').value = compositeQuery;
    close();
    runSearch(compositeQuery);
  });
})();

/* ------------------------------------------------------------------
   Artist Button in Detail Panel
   Shows "view artist" when a selected image has an extractable artist name
------------------------------------------------------------------ */
(function initPanelArtistButton() {
  var section = document.getElementById('panel-artist-section');
  var btn = document.getElementById('btn-panel-artist');
  if (!section || !btn) return;

  var _currentArtist = null;

  btn.addEventListener('click', function () {
    if (_currentArtist && window._openArtistPanel) {
      window._openArtistPanel(_currentArtist);
    }
  });

  // Patch updatePanel to show/hide artist button
  var _origUpdatePanel = window.updatePanel || updatePanel;
  var _patchedUpdatePanel = async function (previewItem) {
    await _origUpdatePanel.apply(this, arguments);
    _currentArtist = null;
    var displayItems = previewItem ? [previewItem] : STATE.selected;
    if (displayItems.length && window._extractArtist) {
      var last = displayItems[displayItems.length - 1];
      _currentArtist = window._extractArtist(last);
    }
    if (_currentArtist) {
      section.style.display = '';
      btn.textContent = 'view artist \u2014 ' + _currentArtist;
    } else {
      section.style.display = 'none';
    }
  };
  // Replace global reference
  if (typeof updatePanel === 'function') {
    window.updatePanel = _patchedUpdatePanel;
    // Also patch the local scope reference used by toggleSelection
    updatePanel = _patchedUpdatePanel;
  }
})();

/* ------------------------------------------------------------------
   Reverse Image Search / Find Visually Similar
   Panel section that appears when any image is selected.
   Primary: Workers AI caption → InspoSearch query
   Secondary: Direct links to Google Lens and TinEye
------------------------------------------------------------------ */
(function initReverseImageSearch() {
  var section = document.getElementById('panel-reverse-section');
  var findBtn = document.getElementById('btn-find-similar');
  var lensLink = document.getElementById('btn-google-lens');
  var tineyeLink = document.getElementById('btn-tineye');
  if (!section || !findBtn) return;

  var _currentImageUrl = null;

  // Patch updatePanel to show/hide the reverse section
  var _origRevPanel = window.updatePanel || updatePanel;
  var _patchedRevPanel = async function (previewItem) {
    await _origRevPanel.apply(this, arguments);
    var displayItems = previewItem ? [previewItem] : STATE.selected;
    if (!displayItems.length) { section.style.display = 'none'; return; }
    var last = displayItems[displayItems.length - 1];
    _currentImageUrl = last.url || last.thumb || null;
    section.style.display = _currentImageUrl ? '' : 'none';
    if (_currentImageUrl) {
      var encoded = encodeURIComponent(_currentImageUrl);
      if (lensLink) lensLink.href = 'https://lens.google.com/uploadbyurl?url=' + encoded;
      if (tineyeLink) tineyeLink.href = 'https://www.tineye.com/search?url=' + encoded;
    }
  };
  if (typeof updatePanel === 'function') {
    window.updatePanel = _patchedRevPanel;
    updatePanel = _patchedRevPanel;
  }

  findBtn.addEventListener('click', async function () {
    if (!_currentImageUrl) return;
    findBtn.textContent = 'captioning\u2026';
    findBtn.disabled = true;
    try {
      var res = await fetch(_API_BASE + '/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: _currentImageUrl }),
      });
      if (res.ok) {
        var data = await res.json();
        var caption = data.caption || '';
        if (caption) {
          var inp = document.getElementById('search-input');
          if (inp) inp.value = caption;
          runSearch(caption);
          findBtn.textContent = '\u2714 searching\u2026';
          setTimeout(function () {
            findBtn.textContent = '\u2726 find visually similar';
            findBtn.disabled = false;
          }, 3000);
          return;
        }
      }
    } catch { /* fall through */ }
    // Fallback: open Google Lens in new tab
    if (lensLink && lensLink.href) { window.open(lensLink.href, '_blank', 'noopener'); }
    findBtn.textContent = '\u2726 find visually similar';
    findBtn.disabled = false;
  });
})();

/* ------------------------------------------------------------------
   Source Health Indicator
   Shows count of unhealthy sources below the active counter
------------------------------------------------------------------ */
(function initSourceHealthIndicator() {
  var el = document.getElementById('sources-health-indicator');
  if (!el) return;

  function update() {
    var unhealthy = 0;
    var names = [];
    ALL_SOURCES.forEach(function (id) {
      if (!isSourceHealthy(id) && !STATE.disabledSources.has(id)) {
        unhealthy++;
        var meta = SOURCE_META[id];
        if (meta && meta.name && names.length < 5) names.push(meta.name);
      }
    });
    if (unhealthy > 0) {
      el.style.display = '';
      el.textContent = unhealthy + ' source' + (unhealthy > 1 ? 's' : '') + ' temporarily paused';
      el.title = names.length ? names.join(', ') + (unhealthy > names.length ? ' + more' : '') : '';
    } else {
      el.style.display = 'none';
    }
  }

  el.addEventListener('click', function () {
    // Reset all health — re-enable paused sources
    try { sessionStorage.removeItem('inspo_source_health'); } catch (_) {}
    ALL_SOURCES.forEach(function (id) { STATE.sourceHealth[id] = { misses: 0, hits: 0, _notified: false }; });
    update();
    updateSourcesActiveCounter();
  });

  // Hook into the counter update cycle
  var _origCounter = _updateSourcesActiveCounterImmediate;
  set_updateSourcesActiveCounterImmediate(function () {
    _origCounter();
    update();
  });
  update();
})();

