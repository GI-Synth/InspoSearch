/* ============================================================
   fetchers.js — Keyword expansion, normalizers, all source fetch functions
   ============================================================ */
import {
  CONSTANTS, MOVEMENT_SYNONYMS, MULTILINGUAL_ART_MAP, PERIOD_ALIASES,
  SEED_MAP, SPECIES_SYNONYMS, STATE, WD_PHASE_H, classifyQueryV2, classifyQueryExtended, ADAPTERS,
  _ERA_REGEX, _MEDIUM_TERMS, _MOVEMENT_SEEDS, _MOVEMENT_TERMS, _SPECIES_PATTERN,
  SOURCE_DOMAINS
} from './state.js';
import {
  cacheGet, cacheSet, extractTags, fetchFromDataCache, isLikelyReal,
  safeFetch, shuffle, sleep, sourceFetch, stripHtml
} from './core.js';

/* Map UI medium values → Europeana TYPE facet values */
const _MEDIUM_TO_EUROPEANA_TYPE = {
  painting:    'IMAGE',
  photograph:  'IMAGE',
  sculpture:   'IMAGE',
  drawing:     'IMAGE',
  print:       'IMAGE',
  textile:     'IMAGE',
  ceramic:     'IMAGE',
  watercolor:  'IMAGE',
  engraving:   'IMAGE',
  mosaic:      'IMAGE',
  fresco:      'IMAGE',
  tapestry:    'IMAGE',
  manuscript:  'TEXT',
};

/* ── Wikidata SPARQL concept expansion for art/design queries ── */
async function expandWithWikidata(keyword, signal) {
  // Find the Wikidata item for this keyword, then get parent/child concepts + translations
  const sparql = `
    SELECT DISTINCT ?label WHERE {
      ?item rdfs:label "${keyword.replace(/"/g, '')}"@en .
      {
        ?item wdt:P279 ?parent .
        ?parent rdfs:label ?label .
        FILTER(LANG(?label) = "en")
      } UNION {
        ?sub wdt:P279 ?item .
        ?sub rdfs:label ?label .
        FILTER(LANG(?label) = "en")
      }
    } LIMIT 15
  `.trim();
  try {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const res = await fetch(url, {
      signal,
      headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': 'InspoSearch/1.0 (https://insposearch.org)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results?.bindings || [])
      .map(b => b.label?.value?.toLowerCase())
      .filter(Boolean)
      .filter(w => w.length > 2 && w.length < 40 && !w.includes('wikimedia'));
  } catch {
    return [];
  }
}

/* ── Wikidata multilingual labels for art terms ── */
async function expandMultilingualWikidata(keyword, signal) {
  const sparql = `
    SELECT ?label WHERE {
      ?item rdfs:label "${keyword.replace(/"/g, '')}"@en .
      ?item rdfs:label ?label .
      FILTER(LANG(?label) IN ("fr","de","es","it","nl","sv","da","pt","ja","zh"))
    } LIMIT 10
  `.trim();
  try {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const res = await fetch(url, {
      signal,
      headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': 'InspoSearch/1.0 (https://insposearch.org)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results?.bindings || [])
      .map(b => b.label?.value?.toLowerCase())
      .filter(Boolean)
      .filter(w => w.length > 1 && w.length < 40);
  } catch {
    return [];
  }
}

// Exact-mode load-more qualifier pool. Fetches Datamuse `rel_trg`
// (topically-triggered words) and `ml` (means-like) for the query and
// keeps only single-word results that act as safe qualifiers when
// appended to the query. Falls back to [] on failure; Lane B then uses
// its hardcoded modifier list. Not synonyms — synonyms substituted into
// the query would break the exact-mode word-boundary filter.
export async function fetchExactModeQualifiers(keyword) {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 3000);
    const [trg, ml] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(keyword)}&max=20`, { signal: ac.signal }).then(r => r.json()),
      fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(keyword)}&max=20`,     { signal: ac.signal }).then(r => r.json()),
    ]);
    clearTimeout(timer);
    const kwLower = keyword.toLowerCase();
    const kwTokens = new Set(kwLower.split(/\s+/));
    const words = [
      ...(trg.status === 'fulfilled' ? trg.value : []),
      ...(ml.status  === 'fulfilled' ? ml.value  : []),
    ]
      .map(w => (w.word || '').toLowerCase().trim())
      .filter(w => w && !w.includes(' ') && w.length > 2 && w.length < 20)
      .filter(w => !kwTokens.has(w));                    // don't re-add the query tokens
    return [...new Set(words)].slice(0, 12);
  } catch {
    return [];
  }
}

export async function expandKeywords(keyword) {
  if (!STATE.keywordExpansion) return [keyword];
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);

    // Classify query to decide expansion strategy
    const qc = classifyQueryExtended(keyword);
    const isArtDomain = qc.isArt || qc.isDesign || qc.isHistory || qc.isArch;

    // Launch all expansion sources in parallel
    const [trg, ml, wikiConcepts, wikiTranslations] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(keyword)}&max=${CONSTANTS.DATAMUSE_MAX}`, { signal: ac.signal })
        .then(r => r.json()),
      fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(keyword)}&max=${CONSTANTS.DATAMUSE_MAX}`, { signal: ac.signal })
        .then(r => r.json()),
      isArtDomain ? expandWithWikidata(keyword, ac.signal) : Promise.resolve([]),
      isArtDomain ? expandMultilingualWikidata(keyword, ac.signal) : Promise.resolve([]),
    ]);
    clearTimeout(timer);

    const datamuseWords = [
      ...(trg.status === 'fulfilled' ? trg.value : []),
      ...(ml.status  === 'fulfilled' ? ml.value  : []),
    ].map(w => w.word);
    const wikiTerms = wikiConcepts.status === 'fulfilled' ? wikiConcepts.value : [];
    const wikiTranslated = wikiTranslations.status === 'fulfilled' ? wikiTranslations.value : [];

    const seeds = SEED_MAP[keyword.toLowerCase()] || [];
    const translations = (MULTILINGUAL_ART_MAP[keyword.toLowerCase()] || []).slice(0, 3);
    const v2 = classifyQueryV2(keyword);
    const v2seeds = [...(v2.movementSeeds || [])].slice(0, 4);
    const movSyns = (MOVEMENT_SYNONYMS[keyword.toLowerCase()] || []).slice(0, 4);
    const specSyns = (SPECIES_SYNONYMS[keyword.toLowerCase()] || []).slice(0, 3);
    const periodSyns = (PERIOD_ALIASES[keyword.toLowerCase()] || []).slice(0, 3);

    // Art domain: prioritize Wikidata concepts + translations, limit Datamuse (avoids "ceramic → heat")
    // Other domains: prioritize Datamuse, add Wikidata as supplement
    const expansions = isArtDomain
      ? [keyword, ...seeds, ...v2seeds, ...wikiTerms.slice(0, 8), ...wikiTranslated.slice(0, 4), ...translations, ...movSyns, ...periodSyns, ...datamuseWords.slice(0, 3)]
      : [keyword, ...seeds, ...v2seeds, ...translations, ...movSyns, ...specSyns, ...periodSyns, ...datamuseWords, ...wikiTerms.slice(0, 3)];

    return [...new Set(expansions)].slice(0, 20);
  } catch (err) {
    console.warn('expandKeywords failed:', err.message);
    return [keyword];
  }
}

/* ============================================================
   9. NORMALISERS
============================================================ */
export function normalizeWikimedia(page) {
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  const u = info.url.toLowerCase();
  if (u.endsWith('.svg') || u.endsWith('.gif')) return null;
  const meta = info.extmetadata || {};
  return {
    id:          `wiki_${page.pageid}`,
    url:         info.url,
    thumb:       info.thumburl || info.url,
    title:       (page.title || '').replace('File:', '').replace(/\.[^.]+$/, ''),
    description: stripHtml(meta.ImageDescription?.value || ''),
    source:      'wikimedia',
    sourceUrl:   info.descriptionurl || '',
    year:        (meta.DateTimeOriginal?.value || '').slice(0, 4) || null,
    tags:        [],
    colors:      [],
    aiTags:      [],
  };
}

export function normalizeMet(obj) {
  const thumb = obj.primaryImageSmall || obj.primaryImage;
  const full  = obj.primaryImage || obj.primaryImageSmall;
  if (!thumb) return null;
  return {
    id:          `met_${obj.objectID}`,
    url:         full,
    thumb:       thumb,
    title:       obj.title || 'Untitled',
    description: [obj.artistDisplayName, obj.medium, obj.culture].filter(Boolean).join(' — '),
    artist:      obj.artistDisplayName || '',
    source:      'met',
    sourceUrl:   obj.objectURL || '',
    year:        (obj.objectDate || '').match(/\d{4}/)?.[0] || null,
    tags:        (obj.tags || []).map(t => t.term.toLowerCase()),
    colors:      [],
    aiTags:      [],
  };
}


/* ============================================================
   10. API FETCH FUNCTIONS
============================================================ */
export async function fetchMet(keyword, limit, signal, offset = 0) {

  try {
    const mediumSuffix = STATE._mediumFilter ? ` ${STATE._mediumFilter}` : '';
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(keyword + mediumSuffix)}&hasImages=true&offset=${offset}`;
    const res = await sourceFetch(searchUrl, { signal }, 'met');
    if (res.status === 429) { await sleep(CONSTANTS.RETRY_DELAY); if (signal && signal.aborted) return []; }
    const ct = (res.headers.get('content-type') || '');
    if (!ct.includes('json')) throw new Error('Met returned non-JSON');
    const data = await res.json();
    const ids = (data.objectIDs || []).slice(0, limit);
    if (!ids.length) return [];
    const fetches = ids.slice(0, CONSTANTS.MET_DETAIL_LIMIT).map(id =>
      sourceFetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, { signal }, 'met')
        .then(r => { if (!(r.headers.get('content-type') || '').includes('json')) return null; return r.json(); })
        .catch(() => null)
    );
    const objects = await Promise.all(fetches);
    return objects
      .filter(Boolean)
      .map(normalizeMet)
      .filter(Boolean)
      .filter(isLikelyReal)
      .map(item => { item.tags = extractTags(item); return item; });
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('Met failed:', err.message);
    return [];
  }
}

/* ============================================================
   10b. NASA / RIJKSMUSEUM / EUROPEANA
============================================================ */
export async function fetchNASA(keyword, limit, signal, page = 1) {

  try {
    const res = await safeFetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(keyword)}&media_type=image&page_size=${limit}&page=${page}`,
      { signal }
    );
    if (!res.ok) throw new Error('NASA fetch failed');
    const data = await res.json();
    const items = data.collection?.items || [];
    return items
      .filter(item => item.links?.[0]?.href && item.data?.[0])
      .map(item => {
        const meta = item.data[0];
        return {
          id:          `nasa_${meta.nasa_id}`,
          url:         item.links[0].href,
          thumb:       item.links[0].href,
          title:       meta.title || 'NASA Image',
          description: meta.description || '',
          source:      'nasa',
          sourceUrl:   `https://images.nasa.gov/details/${meta.nasa_id}`,
          year:        (meta.date_created || '').slice(0, 4) || null,
          tags:        (meta.keywords || []).map(k => k.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('NASA failed:', e.message);
    return [];
  }
}

export async function fetchRijksmuseum(keyword, limit, signal) {
  try {

    const mediumSuffix = STATE._mediumFilter ? ` ${STATE._mediumFilter}` : '';
    const res = await safeFetch(
      `https://data.rijksmuseum.nl/search/collection?description=${encodeURIComponent(keyword + mediumSuffix)}&imageAvailable=true`,
      { signal }
    );
    if (!res.ok) throw new Error('Rijks failed');
    const data = await res.json();
    const items = data.orderedItems || [];

    // Resolve first `limit` identifiers in parallel
    const resolved = await Promise.allSettled(
      items.slice(0, limit).map(item =>
        fetch(item.id, {
          signal,
          headers: { Accept: 'application/json' }
        }).then(r => r.json())
      )
    );

    return resolved
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(obj => obj.representation?.[0]?.id)
      .map(obj => ({
        id:          `rijks_${obj.id?.split('/').pop()}`,
        url:         obj.representation[0].id,
        thumb:       obj.representation[0].id,
        title:       obj._label || 'Rijksmuseum Object',
        description: '',
        artist:      obj.produced_by?.carried_out_by?.[0]?._label || '',
        source:      'rijksmuseum',
        sourceUrl:   obj.id || '',
        year:        null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Rijksmuseum failed:', e.message);
    return [];
  }
}

export async function fetchEuropeana(keyword, limit, signal, start = 1) {
  if (!STATE.europeanaKey) return [];

  try {
    let url = `https://api.europeana.eu/record/v2/search.json?wskey=${STATE.europeanaKey}&query=${encodeURIComponent(keyword)}&media=true&rows=${limit}&profile=rich&start=${start}`;
    if (STATE._licenseFilter === 'cc0' || STATE._licenseFilter === 'cc-by' || STATE._licenseFilter === 'open') url += '&reusability=open';
    if (STATE._dateFilter) {
      const yFrom = STATE._dateFilter.from || 0;
      const yTo   = STATE._dateFilter.to   || 9999;
      url += `&qf=YEAR:[${yFrom} TO ${yTo}]`;
    }
    if (STATE._mediumFilter) {
      const euroType = _MEDIUM_TO_EUROPEANA_TYPE[STATE._mediumFilter];
      if (euroType) url += `&qf=TYPE:${encodeURIComponent(euroType)}`;
    }
    const res = await safeFetch(url, { signal });
    if (!res.ok) throw new Error('Europeana fetch failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.edmIsShownBy?.[0] || item.edmPreview?.[0])
      .map(item => ({
        id:          `euro_${item.id.replace(/\//g, '_')}`,
        url:         item.edmIsShownBy?.[0] || item.edmPreview?.[0],
        thumb:       item.edmPreview?.[0] || item.edmIsShownBy?.[0],
        title:       Array.isArray(item.title) ? item.title[0] : (item.title || 'Untitled'),
        description: Array.isArray(item.dcDescription) ? item.dcDescription[0] : (item.dcDescription || ''),
        artist:      Array.isArray(item.dcCreator) ? item.dcCreator[0] : (item.dcCreator || ''),
        source:      'europeana',
        sourceUrl:   item.guid || '',
        dataProvider: item.dataProvider || [],
        rights:      item.rights?.[0] || '',
        year:        (item.year?.[0] || '').toString().slice(0, 4) || null,
        tags:        (item.dcSubject || []).map(s => s.toLowerCase()),
        colors:      [],
        aiTags:      [],
      }))
      .map(item => { item.tags = extractTags(item); return item; })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Europeana failed:', e.message);
    return [];
  }
}

/* ── Deep pagination variants for exact mode ──────────────────────── */

/** Fetch up to `pages` pages from Met (each page = `pageSize` detail objects) */
export async function fetchMetDeep(keyword, pageSize, signal, pages = 4) {
  try {
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(keyword)}&hasImages=true`;
    const res = await sourceFetch(searchUrl, { signal }, 'met');
    if (res.status === 429) { await sleep(CONSTANTS.RETRY_DELAY); if (signal?.aborted) return []; }
    const data = await res.json();
    const allIds = data.objectIDs || [];
    if (!allIds.length) return [];
    const totalIds = allIds.slice(0, pageSize * pages);
    // Fetch details in batches of pageSize to avoid overwhelming the API
    const results = [];
    for (let i = 0; i < totalIds.length; i += pageSize) {
      if (signal?.aborted) break;
      const batch = totalIds.slice(i, i + pageSize);
      const fetches = batch.map(id =>
        sourceFetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, { signal }, 'met')
          .then(r => r.json()).catch(() => null)
      );
      const objects = await Promise.all(fetches);
      results.push(...objects.filter(Boolean).map(normalizeMet).filter(Boolean).filter(isLikelyReal)
        .map(item => { item.tags = extractTags(item); return item; }));
      // Small delay between batches to respect rate limits
      if (i + pageSize < totalIds.length) await sleep(200);
    }
    return results;
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('Met deep failed:', err.message);
    return [];
  }
}

/** Fetch multiple pages from Europeana (each page = `rows` items) */
export async function fetchEuropeanaDeep(keyword, rows, signal, pages = 3) {
  if (!STATE.europeanaKey) return [];
  const results = [];
  for (let page = 0; page < pages; page++) {
    if (signal?.aborted) break;
    const start = page * rows + 1;
    try {
      const items = await fetchEuropeana(keyword, rows, signal, start);
      results.push(...items);
      if (items.length < rows) break; // no more pages
    } catch { break; }
  }
  return results;
}

/** Fetch multiple pages from Chicago Art Institute */
export async function fetchChicagoArtDeep(keyword, limit, signal, pages = 3) {
  const results = [];
  for (let page = 1; page <= pages; page++) {
    if (signal?.aborted) break;
    try {
      const items = await fetchChicagoArt(keyword, limit, signal, page);
      results.push(...items);
      if (items.length < limit) break;
    } catch { break; }
  }
  return results;
}

export async function fetchEuropeanaFiltered(filterParam, filterValue, keyword, limit, signal, extraQf = '') {
  if (!STATE.europeanaKey) return [];
  try {
    let url = `https://api.europeana.eu/record/v2/search.json?wskey=${STATE.europeanaKey}&query=${encodeURIComponent(keyword)}&media=true&rows=${limit}&profile=rich&qf=${filterParam}:${encodeURIComponent(filterValue)}`;
    if (extraQf) url += `&qf=${encodeURIComponent(extraQf)}`;
    if (STATE._licenseFilter === 'cc0' || STATE._licenseFilter === 'cc-by' || STATE._licenseFilter === 'open') url += '&reusability=open';
    if (STATE._dateFilter) {
      const yFrom = STATE._dateFilter.from || 0;
      const yTo   = STATE._dateFilter.to   || 9999;
      url += `&qf=YEAR:[${yFrom} TO ${yTo}]`;
    }
    if (STATE._mediumFilter) {
      const euroType = _MEDIUM_TO_EUROPEANA_TYPE[STATE._mediumFilter];
      if (euroType) url += `&qf=TYPE:${encodeURIComponent(euroType)}`;
    }
    const res = await safeFetch(url, { signal });
    if (!res.ok) throw new Error('Europeana filtered fetch failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.edmIsShownBy?.[0] || item.edmPreview?.[0])
      .map(item => ({
        id:          `eurofilt_${filterParam}_${item.id.replace(/\//g, '_')}`,
        url:         item.edmIsShownBy?.[0] || item.edmPreview?.[0],
        thumb:       item.edmPreview?.[0] || item.edmIsShownBy?.[0],
        title:       Array.isArray(item.title) ? item.title[0] : (item.title || 'Untitled'),
        description: Array.isArray(item.dcDescription) ? item.dcDescription[0] : (item.dcDescription || ''),
        artist:      Array.isArray(item.dcCreator) ? item.dcCreator[0] : (item.dcCreator || ''),
        source:      'europeana',
        sourceUrl:   item.guid || '',
        dataProvider: item.dataProvider || [],
        rights:      item.rights?.[0] || '',
        year:        (item.year?.[0] || '').toString().slice(0, 4) || null,
        tags:        (item.dcSubject || []).map(s => s.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .map(item => { item.tags = extractTags(item); return item; })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Europeana filtered failed:', e.message);
    return [];
  }
}

/* ============================================================
   10c. HARVARD / SMITHSONIAN / PEXELS
============================================================ */
export async function fetchHarvard(keyword, limit, signal, page = 1) {
  if (!STATE.harvardKey) return [];

  try {
    const res = await safeFetch(
      `https://api.harvardartmuseums.org/object?apikey=${STATE.harvardKey}&keyword=${encodeURIComponent(keyword)}&hasimage=1&size=${limit}&page=${page}&fields=objectid,title,description,dated,primaryimageurl,url,people,medium`,
      { signal }
    );
    if (!res.ok) throw new Error('Harvard fetch failed');
    const data = await res.json();
    return (data.records || [])
      .filter(obj => obj.primaryimageurl)
      .map(obj => ({
        id:          `harvard_${obj.objectid}`,
        url:         obj.primaryimageurl.replace(/\/full\/\d+,\/0\/default\.jpg$/, '/full/max/0/default.jpg'),
        thumb:       obj.primaryimageurl,
        title:       obj.title || 'Untitled',
        description: [obj.people?.[0]?.name, obj.medium, obj.dated].filter(Boolean).join(' — '),
        source:      'harvard',
        sourceUrl:   obj.url || '',
        year:        (obj.dated || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors:      [],
        aiTags:      [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Harvard failed:', e.message);
    return [];
  }
}

export async function fetchSmithsonian(keyword, limit, signal, start = 0) {
  // DEMO_KEY hits a shared global quota that's always exhausted → 429 on every call.
  // Skip entirely unless the user has provided their own key.
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await sourceFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&start=${start}&online_media_type=Images`,
      { signal }, 'smithsonian'
    );
    if (!res.ok) throw new Error('Smithsonian fetch failed');
    const data = await res.json();
    const rows = data.response?.rows || [];
    return rows
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `si_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'Untitled',
          description: row.content?.indexedStructured?.object_type?.[0] || '',
          source:      'smithsonian',
          sourceUrl:   `https://www.si.edu/object/${row.id}`,
          year:        (row.content?.indexedStructured?.date?.[0] || '').slice(0, 4) || null,
          tags:        (row.content?.indexedStructured?.topic || []).map(t => t.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Smithsonian failed:', e.message);
    return [];
  }
}

export async function fetchSmithsonianUnit(unitCode, keyword, limit, signal) {
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await sourceFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=${unitCode}`,
      { signal }, 'smithsonian'
    );
    if (!res.ok) throw new Error('Smithsonian unit fetch failed');
    const data = await res.json();
    const rows = data.response?.rows || [];
    return rows
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `si_${unitCode.toLowerCase()}_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'Untitled',
          description: row.content?.indexedStructured?.object_type?.[0] || '',
          source:      'smithsonian',
          sourceUrl:   `https://www.si.edu/object/${row.id}`,
          year:        (row.content?.indexedStructured?.date?.[0] || '').slice(0, 4) || null,
          tags:        (row.content?.indexedStructured?.topic || []).map(t => t.toLowerCase()),
          colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Smithsonian unit fetch failed:', e.message);
    return [];
  }
}

export async function fetchPexels(keyword, limit, signal, page = 1) {
  if (!STATE.pexelsKey) return [];

  try {
    const res = await safeFetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${limit}&page=${page}`,
      {
        signal,
        headers: { Authorization: STATE.pexelsKey }
      }
    );
    if (!res.ok) throw new Error('Pexels fetch failed');
    const data = await res.json();
    return (data.photos || []).map(photo => ({
      id:          `pexels_${photo.id}`,
      url:         photo.src.large,
      thumb:       photo.src.medium,
      title:       photo.alt || 'Pexels Photo',
      description: `Photo by ${photo.photographer}`,
      source:      'pexels',
      sourceUrl:   photo.url,
      year:        null,
      tags:        [],
      colors:      [],
      aiTags:      [],
    }))
    .filter(isLikelyReal)
    .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Pexels failed:', e.message);
    return [];
  }
}

export async function fetchINaturalist(keyword, limit, signal, page = 1) {

  try {
    const res = await sourceFetch(
      `https://api.inaturalist.org/v1/observations?q=${encodeURIComponent(keyword)}&photos=true&per_page=${limit}&page=${page}&order=votes&license=cc-by,cc-by-nc,cc0`,
      { signal }, 'inaturalist'
    );
    if (!res.ok) throw new Error('iNaturalist fetch failed');
    const data = await res.json();
    return (data.results || [])
      .filter(obs => obs.photos && obs.photos.length)
      .map(obs => {
        const rawUrl  = obs.photos[0].url || '';
        const thumb   = rawUrl.replace('/square.', '/medium.');
        const fullUrl = rawUrl.replace('/square.', '/large.');
        const title   = (obs.taxon && (obs.taxon.preferred_common_name || obs.taxon.name))
                      || obs.species_guess || 'Observation';
        return {
          id:          `inaturalist_${obs.id}`,
          url:         fullUrl,
          thumb,
          title,
          description: obs.description || obs.place_guess || '',
          source:      'inaturalist',
          sourceUrl:   `https://www.inaturalist.org/observations/${obs.id}`,
          year:        obs.observed_on ? obs.observed_on.slice(0, 4) : null,
          tags:        [title, obs.place_guess].filter(Boolean),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(item => item.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('iNaturalist failed:', e.message);
    return [];
  }
}

// Derive a full-resolution IIIF URL from a LOC storage-services thumbnail URL.
// Falls back to the original URL if the pattern doesn't match.
function locIiifUrl(storageUrl) {
  const m = String(storageUrl).match(/\/storage-services\/service\/(.+?)\.(?:jpe?g|png|tiff?)(?:\?.*)?$/i);
  if (!m) return storageUrl;
  return `https://tile.loc.gov/image-services/iiif/service:${m[1].replace(/\//g, ':')}/full/pct:100/0/default.jpg`;
}

export async function fetchLOC(keyword, limit, signal, sp = 1) {

  try {
    const res = await sourceFetch(
      `https://www.loc.gov/search/?q=${encodeURIComponent(keyword)}&fo=json&fa=online-format:image&c=${limit}&sp=${sp}`,
      { signal }, 'loc'
    );
    if (!res.ok) throw new Error('LOC fetch failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.image_url)
      .map(item => {
        const img   = Array.isArray(item.image_url)
          ? (Array.isArray(item.image_url[0]) ? item.image_url[0][0] : item.image_url[0])
          : item.image_url;
        const title = Array.isArray(item.title) ? item.title[0] : (item.title || 'LOC Image');
        const desc  = Array.isArray(item.description) ? item.description[0] : (item.description || '');
        return {
          id:          `loc_${encodeURIComponent(item.id || title)}`,
          url:         img,
          thumb:       img,
          fullUrl:     locIiifUrl(img),
          title,
          description: desc,
          source:      'loc',
          sourceUrl:   item.id || '',
          year:        item.date ? String(item.date).slice(0, 4) : null,
          tags:        (item.subject || []).map(t => t.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(item => item.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('LOC failed:', e.message);
    return [];
  }
}

export async function fetchChicagoArt(keyword, limit, signal, page = 1) {
  // 2026-04: ArtIC IIIF image host (www.artic.edu/iiif/2/...) is now behind a
  // Cloudflare bot challenge that returns 403 to any non-browser fetch, including
  // our image proxy. The API still responds but every rendered image 403s,
  // polluting the console with CORP/CORS errors. Skip until they re-open IIIF
  // or offer signed URLs.
  return [];
  try {
    const res = await sourceFetch(
      `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(keyword)}&limit=${limit}&fields=id,title,image_id,artist_display,date_display,medium_display,subject_titles&page=${page}`,
      { signal }, 'chicago'
    );
    if (!res.ok) throw new Error('AIC failed');
    const data = await res.json();
    const iiif = data.config?.iiif_url || 'https://www.artic.edu/iiif/2';
    return (data.data || [])
      .filter(obj => obj.image_id)
      .map(obj => ({
        id:          `aic_${obj.id}`,
        url:         `${iiif}/${obj.image_id}/full/max/0/default.jpg`,
        thumb:       `${iiif}/${obj.image_id}/full/400,/0/default.jpg`,
        title:       obj.title || 'Untitled',
        description: [obj.artist_display, obj.medium_display, obj.date_display]
          .filter(Boolean).join(' — '),
        source:      'chicago',
        sourceUrl:   `https://www.artic.edu/artworks/${obj.id}`,
        year:        (obj.date_display || '').match(/\d{4}/)?.[0] || null,
        tags:        (obj.subject_titles || []).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('AIC failed:', e.message);
    return [];
  }
}

export async function fetchCleveland(keyword, limit, signal, skip = 0) {
  try {

    const res = await sourceFetch(
      `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(keyword)}&has_image=1&limit=${limit}&skip=${skip}`,
      { signal }, 'cleveland'
    );
    if (!res.ok) throw new Error('Cleveland failed');
    const data = await res.json();
    return (data.data || [])
      .filter(obj => obj.images?.web?.url)
      .map(obj => ({
        id:          `cle_${obj.id}`,
        url:         obj.images.print?.url || obj.images.full?.url || obj.images.web.url,
        thumb:       obj.images.web.url,
        title:       obj.title || 'Untitled',
        description: [obj.creators?.[0]?.description, obj.technique, obj.creation_date]
          .filter(Boolean).join(' — '),
        source:      'cleveland',
        sourceUrl:   obj.url || `https://www.clevelandart.org/art/${obj.id}`,
        year:        (obj.creation_date || '').match(/\d{4}/)?.[0] || null,
        tags:        (obj.tags || []).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Cleveland failed:', e.message);
    return [];
  }
}

export async function fetchVA(keyword, limit, signal, page = 1) {
  try {

    const res = await sourceFetch(
      `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(keyword)}&images_exist=1&page_size=${limit}&page=${page}`,
      { signal }, 'va'
    );
    if (!res.ok) throw new Error('V&A failed');
    const data = await res.json();
    return (data.records || [])
      .filter(obj => obj._primaryImageId)
      .map(obj => ({
        id:          `va_${obj.systemNumber}`,
        url:         `https://framemark.vam.ac.uk/collections/${obj._primaryImageId}/full/max/0/default.jpg`,
        thumb:       `https://framemark.vam.ac.uk/collections/${obj._primaryImageId}/full/400,/0/default.jpg`,
        title:       obj._primaryTitle || 'Untitled',
        description: [obj._primaryMaker?.name, obj._primaryDate]
          .filter(Boolean).join(' — '),
        source:      'va',
        sourceUrl:   `https://collections.vam.ac.uk/item/${obj.systemNumber}`,
        year:        (obj._primaryDate || '').match(/\d{4}/)?.[0] || null,
        tags:        obj._currentLocation?.displayName
          ? [obj._currentLocation.displayName.toLowerCase()] : [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('V&A failed:', e.message);
    return [];
  }
}

export async function fetchFlickrCommons(keyword, limit, signal, page = 1) {
  if (!STATE.flickrKey) return [];
  try {
    const res = await safeFetch(
      `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${STATE.flickrKey}&text=${encodeURIComponent(keyword)}&license=7,8,9,10&content_type=1&media=photos&format=json&nojsoncallback=1&per_page=${limit}&page=${page}&sort=relevance`,
      { signal }
    );
    if (!res.ok) throw new Error('Flickr failed');
    const data = await res.json();
    return (data.photos?.photo || [])
      .map(p => ({
        id:          `flickr_${p.id}`,
        url:         `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
        thumb:       `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_m.jpg`,
        title:       p.title || 'Flickr Photo',
        description: '',
        source:      'flickr',
        sourceUrl:   `https://www.flickr.com/photos/${p.owner}/${p.id}`,
        year:        null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Flickr failed:', e.message);
    return [];
  }
}

export async function fetchPixabay(keyword, limit, signal, page = 1) {
  if (!STATE.pixabayKey) return [];
  const pbKey = 'pixabay_' + keyword + '_p' + page;
  const pbCached = cacheGet(pbKey);
  if (pbCached) return pbCached.results.slice(0, limit);
  try {

    const res = await safeFetch(
      `https://pixabay.com/api/?key=${STATE.pixabayKey}&q=${encodeURIComponent(keyword)}&image_type=photo&per_page=${limit}&page=${page}&safesearch=true`,
      { signal }
    );
    if (!res.ok) throw new Error('Pixabay failed');
    const data = await res.json();
    const results = (data.hits || [])
      .map(img => ({
        id:          `pixabay_${img.id}`,
        url:         img.largeImageURL,
        thumb:       img.webformatURL,
        title:       img.tags || 'Pixabay Image',
        description: `by ${img.user}`,
        source:      'pixabay',
        sourceUrl:   img.pageURL,
        year:        null,
        tags:        (img.tags || '').split(',').map(t => t.trim().toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
    cacheSet(pbKey, results, [keyword]);
    return results;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Pixabay failed:', e.message);
    return [];
  }
}

export async function fetchWikiArt(keyword, limit, signal, page = 1) {
  try {

    const res = await safeFetch(
      `https://www.wikiart.org/en/search/${encodeURIComponent(keyword)}/${page}?json=2&layout=new`,
      { signal }
    );
    if (!res.ok) throw new Error('WikiArt failed');
    const data = await res.json();
    const paintings = data.Paintings || [];
    return paintings
      .filter(p => p.image)
      .map(p => ({
        id:          `wikiart_${p.id}`,
        url:         p.image,
        thumb:       p.image,
        title:       p.title || 'Untitled',
        description: [p.artistName, p.completitionYear]
          .filter(Boolean).join(' — '),
        source:      'wikiart',
        sourceUrl:   p.artistUrl
          ? `https://www.wikiart.org${p.artistUrl}`
          : 'https://www.wikiart.org',
        year:        p.completitionYear?.toString() || null,
        tags:        [p.style, p.genre, p.period]
          .filter(Boolean).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('WikiArt failed:', e.message);
    return [];
  }
}

export async function fetchNordicMuseum(keyword, limit, signal) {
  // 2026-04: api.nordiskamuseet.se resolves to NXDOMAIN — the public API is gone.
  // TODO: replace with Wikimedia Commons incategory:Nordiska_museet pattern.
  return [];
  try {
    const res = await safeFetch(
      `https://api.nordiskamuseet.se/v1/objects?search=${encodeURIComponent(keyword)}&mediaLicense=*&page_size=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Nordic failed');
    const data = await res.json();
    return (data.objects || data.items || [])
      .filter(obj => obj.imageUrl || obj.image_url || obj.media?.[0]?.uri)
      .map(obj => {
        const img = obj.imageUrl || obj.image_url || obj.media?.[0]?.uri;
        return {
          id:          `nordic_${obj.id}`,
          url:         img,
          thumb:       img,
          title:       obj.title || obj.name || 'Nordic Object',
          description: obj.description || obj.material || '',
          source:      'nordic',
          sourceUrl:   obj.url || `https://www.nordiskamuseet.se/en/objects/${obj.id}`,
          year:        (obj.date || obj.year || '').toString().slice(0, 4) || null,
          tags:        (obj.tags || obj.keywords || []).map(t => t.toLowerCase()),
          colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Nordic Museum failed:', e.message);
    return [];
  }
}

export async function fetchGetty(keyword, limit, signal) {
  // API retired — data.getty.edu returns 404 as of 2026-04
  return [];
  try {

    const res = await safeFetch(
      `https://data.getty.edu/museum/collection/object/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Getty failed');
    const data = await res.json();
    return (data.orderedItems || data.items || [])
      .map(item => {
        const imgUrl = item.subject_of?.[0]?.digitally_shown_by?.[0]?.access_point?.[0]?.id;
        if (!imgUrl) return null;
        return {
          id:          `getty_${(item.id || '').split('/').pop()}`,
          url:         imgUrl,
          thumb:       imgUrl,
          title:       item.label?.en?.[0] || 'Getty Object',
          description: item.produced_by?.carried_out_by?.[0]?.label?.en?.[0] || '',
          source:      'getty',
          sourceUrl:   item.id || '',
          year:        item.timespan?.begin_of_the_begin?.slice(0, 4) || null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Getty failed:', e.message);
    return [];
  }
}

export async function fetchNGA(keyword, limit, signal, offset = 0) {
  // API retired — api.nga.gov returns 404 as of 2026-04
  return [];
  try {

    const res = await sourceFetch(
      `https://api.nga.gov/art/tms/objects?q=${encodeURIComponent(keyword)}&hasimages=1&limit=${limit}&offset=${offset}`,
      { signal }, 'nga'
    );
    if (!res.ok) throw new Error('NGA failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.iiifThumbUrl)
      .map(item => ({
        id:          `nga_${item.objectId}`,
        url:         (item.iiifThumbUrl || '').replace('/thumb/', '/full/'),
        thumb:       item.iiifThumbUrl,
        title:       item.title || 'NGA Object',
        description: item.people?.[0]?.displayName || '',
        source:      'nga',
        sourceUrl:   item.url || '',
        year:        (item.displayDate || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('NGA failed:', e.message);
    return [];
  }
}

export async function fetchGBIF(keyword, limit, signal, offset = 0) {
  try {

    const res = await sourceFetch(
      `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(keyword)}&mediaType=StillImage&limit=${limit}&offset=${offset}`,
      { signal }, 'gbif'
    );
    if (!res.ok) throw new Error('GBIF failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.media?.[0]?.identifier)
      .map(item => ({
        id:          `gbif_${item.key}`,
        url:         item.media[0].identifier,
        thumb:       item.media[0].identifier,
        title:       item.species || item.verbatimScientificName || 'Species',
        description: item.country || '',
        source:      'gbif',
        sourceUrl:   `https://www.gbif.org/occurrence/${item.gbifID || item.key}`,
        year:        (item.eventDate || '').slice(0, 4) || null,
        tags:        [item.species, item.country].filter(Boolean).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('GBIF failed:', e.message);
    return [];
  }
}

export async function fetchEOL(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://eol.org/api/search/1.0.json?q=${encodeURIComponent(keyword)}&page=1`,
      { signal }
    );
    if (!res.ok) throw new Error('EOL search failed');
    const data = await res.json();
    const results = (data.results || []).slice(0, Math.min(5, limit));
    if (!results.length) return [];
    const pages = await Promise.allSettled(
      results.map(r =>
        fetch(`https://eol.org/api/pages/1.0/${r.id}.json?images_per_page=1&details=true`, { signal })
          .then(r2 => r2.json())
      )
    );
    return pages
      .filter(p => p.status === 'fulfilled')
      .map((p, i) => {
        const media = p.value?.taxonConcept?.dataObjects?.[0];
        if (!media?.eolMediaURL) return null;
        return {
          id:          `eol_${results[i].id}`,
          url:         media.eolMediaURL,
          thumb:       media.eolMediaURL,
          title:       results[i].title || 'EOL Species',
          description: '',
          source:      'eol',
          sourceUrl:   `https://eol.org/pages/${results[i].id}`,
          year:        null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('EOL failed:', e.message);
    return [];
  }
}

export async function fetchAPOD(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=${limit}&thumbs=true`,
      { signal }
    );
    if (!res.ok) throw new Error('APOD failed');
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter(item => item.media_type === 'image')
      .map(item => ({
        id:          `apod_${(item.date || '').replace(/-/g, '')}`,
        url:         item.hdurl || item.url,
        thumb:       item.url,
        title:       item.title || 'NASA APOD',
        description: item.explanation?.slice(0, 120) || '',
        source:      'apod',
        sourceUrl:   `https://apod.nasa.gov/apod/ap${(item.date || '').replace(/-/g, '').slice(2)}.html`,
        year:        (item.date || '').slice(0, 4) || null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('APOD failed:', e.message);
    return [];
  }
}

export async function fetchGallica(keyword, limit, signal, startRecord = 1) {
  try {
    const query = `dc.type+all+"image"+and+${encodeURIComponent(keyword)}`;
    const res = await safeFetch(
      `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${query}&maximumRecords=${limit}&startRecord=${startRecord}&format=json`,
      { signal }
    );
    if (!res.ok) throw new Error('Gallica failed');
    const data = await res.json();
    const records = data.records?.record || [];
    return records
      .map(rec => {
        const d = rec.recordData;
        const identifier = d?.['dc:identifier']?.[0] || '';
        if (!identifier) return null;
        return {
          id:          `gallica_${identifier.split('/').pop()}`,
          url:         identifier + '.highres',
          thumb:       identifier + '.thumbnail',
          title:       d?.['dc:title']?.[0] || 'Gallica Item',
          description: d?.['dc:description']?.[0] || '',
          source:      'gallica',
          sourceUrl:   identifier,
          year:        d?.['dc:date']?.[0]?.slice(0, 4) || null,
          tags:        (d?.['dc:subject'] || []).map(t => t.toLowerCase()),
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Gallica failed:', e.message);
    return [];
  }
}

export async function fetchChroniclingAmerica(keyword, limit, signal) {
  try {

    const res = await sourceFetch(
      `https://chroniclingamerica.loc.gov/search/pages/results/?andtext=${encodeURIComponent(keyword)}&format=json&rows=${limit}`,
      { signal }, 'chronicling'
    );
    if (!res.ok) throw new Error('ChronAm failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.id)
      .map(item => ({
        id:          `chron_${item.id.replace(/\//g, '_')}`,
        url:         `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:100/0/default.jpg`,
        thumb:       `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:25/0/default.jpg`,
        title:       `${item.title || 'Newspaper'} — ${(item.date || '').slice(0, 4)}`,
        description: item.ocr_eng?.slice(0, 100) || '',
        source:      'chronicling',
        sourceUrl:   `https://chroniclingamerica.loc.gov${item.id}`,
        year:        (item.date || '').slice(0, 4) || null,
        tags:        (item.subject || []).map(s => s.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('ChronAm failed:', e.message);
    return [];
  }
}

export async function fetchTrove(keyword, limit, signal, page = 1) {
  if (!STATE.troveKey) return [];
  try {
    const res = await safeFetch(
      `https://api.trove.nla.gov.au/v3/result?q=${encodeURIComponent(keyword)}&category=picture&encoding=json&n=${limit}&s=${(page - 1) * limit}&key=${STATE.troveKey}`,
      { signal }
    );
    if (!res.ok) throw new Error('Trove failed');
    const data = await res.json();
    const works = data.response?.zone?.[0]?.records?.work || [];
    return works
      .map(item => {
        const thumb = item.identifier?.find(i => i.linktype === 'thumbnail')?.value || '';
        if (!thumb) return null;
        return {
          id:          `trove_${item.id}`,
          url:         thumb,
          thumb:       thumb,
          title:       item.title || 'Trove Item',
          description: item.contributor?.[0] || '',
          source:      'trove',
          sourceUrl:   item.troveUrl || '',
          year:        (item.issued || '').slice(0, 4) || null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Trove failed:', e.message);
    return [];
  }
}

export async function fetchDigitalNZ(keyword, limit, signal) {
  if (!STATE.digitalnzKey) return [];
  try {
    const res = await safeFetch(
      `https://api.digitalnz.org/records.json?text=${encodeURIComponent(keyword)}&and[category][]=Images&per_page=${limit}&api_key=${STATE.digitalnzKey}`,
      { signal }
    );
    if (!res.ok) throw new Error('DigitalNZ failed');
    const data = await res.json();
    return (data.search?.results || [])
      .filter(item => item.thumbnail_url)
      .map(item => ({
        id:          `dnz_${item.id}`,
        url:         item.large_thumbnail_url || item.thumbnail_url,
        thumb:       item.thumbnail_url,
        title:       item.title || 'DigitalNZ Item',
        description: item.description || '',
        source:      'digitalnz',
        sourceUrl:   item.landing_url || '',
        year:        item.date?.[0]?.slice(0, 4) || null,
        tags:        (item.subject || []).map(s => s.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('DigitalNZ failed:', e.message);
    return [];
  }
}

export async function fetchBHL(keyword, limit, signal) {
  // BHL requires a real API key. If the user hasn't supplied one, skip silently
  // rather than hammering them with the placeholder (which just returns empty).
  if (!STATE.bhlKey) return [];
  try {
    const BHL_KEY = STATE.bhlKey;
    const res = await safeFetch(
      `https://www.biodiversitylibrary.org/api3?op=GetTitleSearchSimple&title=${encodeURIComponent(keyword)}&apikey=${BHL_KEY}&format=json`,
      { signal }
    );
    if (!res.ok) throw new Error('BHL failed');
    const text = await res.text();
    if (!text) return [];
    let data;
    try { data = JSON.parse(text); } catch { return []; }
    const titles = (data.Result || []).slice(0, 3);
    if (!titles.length) return [];
    const itemID = titles[0].Items?.[0]?.ItemID;
    if (!itemID) return [];
    const res2 = await safeFetch(
      `https://www.biodiversitylibrary.org/api3?op=GetItemMetadata&id=${itemID}&pages=true&ocr=false&parts=false&apikey=${BHL_KEY}&format=json`,
      { signal }
    );
    if (!res2.ok) throw new Error('BHL pages failed');
    const text2 = await res2.text();
    if (!text2) return [];
    let data2;
    try { data2 = JSON.parse(text2); } catch { return []; }
    const titleFull = data2.Result?.[0]?.FullTitle || 'BHL Title';
    const pages = (data2.Result?.[0]?.Pages || []).filter(p => p.PageID).slice(0, limit);
    return pages
      .map(page => ({
        id:          `bhl_${page.PageID}`,
        url:         `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/1000/1000`,
        thumb:       `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/200/200`,
        title:       `${titleFull} p.${page.PageNumber || '?'}`,
        description: '',
        source:      'bhl',
        sourceUrl:   `https://www.biodiversitylibrary.org/page/${page.PageID}`,
        year:        null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('BHL failed:', e.message);
    return [];
  }
}

export async function fetchCarnegie(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://api.collection.carnegieart.org/artworks?search[search]=${encodeURIComponent(keyword)}&per_page=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Carnegie failed');
    const data = await res.json();
    return (data.data || [])
      .filter(item => item.image_url)
      .map(item => ({
        id:          `cmoa_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image_url,
        thumb:       item.image_url,
        title:       item.title || 'CMOA Object',
        description: item.artist || '',
        source:      'carnegie',
        sourceUrl:   `https://collection.carnegieart.org/objects/${encodeURIComponent(item.id || '')}`,
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Carnegie failed:', e.message);
    return [];
  }
}

export async function fetchPrado(keyword, limit, signal) {
  // Try pre-fetched data cache first
  const cached = await fetchFromDataCache('prado', keyword);
  if (cached) return cached;
  // Fall back to direct API (may fail due to CORS)
  try {
    const res = await safeFetch(
      `https://www.museodelprado.es/api/v1/artwork?language=en&keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Prado failed');
    const data = await res.json();
    return (data.items || data.artworks || [])
      .filter(item => item.image?.large || item.image?.medium || item.image?.small)
      .map(item => ({
        id:          `prado_${item.id}`,
        url:         item.image?.large || item.image?.medium || item.image?.small,
        thumb:       item.image?.small || item.image?.medium || item.image?.large,
        title:       item.title || 'Prado Work',
        description: item.artist?.name || '',
        source:      'prado',
        sourceUrl:   `https://www.museodelprado.es/en/the-collection/art-work/${item.slug || item.id}`,
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return []; // CORS best-effort — fail silently
  }
}

export async function fetchParisMusees(keyword, limit, signal) {
  // Try pre-fetched data cache first
  const cached = await fetchFromDataCache('parismusees', keyword);
  if (cached) return cached;
  // Fall back to direct API (may fail due to CORS)
  try {
    // Sanitize for GraphQL string interpolation — strip quotes, backslashes, newlines
    const safeKw = keyword.replace(/["\\\n\r]/g, '');
    const body = JSON.stringify({
      query: `{ nodeQuery(filter: {conditions: [{field: "title", value: "${safeKw}", operator: LIKE}]}, limit: ${parseInt(limit, 10)}) { entities { ... on NodeOeuvre { title field_auteur field_datation field_visuels { entity { thumbnail { url } } } } } } }`,
    });
    const res = await safeFetch('https://apicollections.parismusees.paris.fr/graphql', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal,
    });
    if (!res.ok) throw new Error('ParisMusees failed');
    const data = await res.json();
    const entities = data.data?.nodeQuery?.entities || [];
    return entities
      .map((entity, i) => {
        const imgUrl = entity.field_visuels?.[0]?.entity?.thumbnail?.url;
        if (!imgUrl) return null;
        return {
          id:          `paris_${i}_${Date.now()}`,
          url:         imgUrl,
          thumb:       imgUrl,
          title:       entity.title || 'Paris Musées Item',
          description: entity.field_auteur || '',
          source:      'parismusees',
          sourceUrl:   'https://www.parismusees.paris.fr',
          year:        (entity.field_datation || '').match(/\d{4}/)?.[0] || null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return []; // CORS best-effort — fail silently
  }
}

export async function fetchYale(keyword, limit, signal) {
  // API returns 403 as of 2026-04
  return [];
  try {

    const res = await safeFetch(
      `https://collections.britishart.yale.edu/api/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Yale failed');
    const data = await res.json();
    return (data.docs || data.items || [])
      .filter(item => item.id)
      .map(item => {
        const iiifId = String(item.id).replace('obj:', '');
        return {
          id:          `yale_${iiifId}`,
          url:         `https://images.britishart.yale.edu/iiif/2/${iiifId}/full/max/0/default.jpg`,
          thumb:       `https://images.britishart.yale.edu/iiif/2/${iiifId}/full/!400,400/0/default.jpg`,
          title:       item.title || 'Yale YCBA Work',
          description: item.artist || '',
          source:      'yale',
          sourceUrl:   `https://collections.britishart.yale.edu/catalog/${item.id}`,
          year:        (item.date || '').match(/\d{4}/)?.[0] || null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Yale failed:', e.message);
    return [];
  }
}

export async function fetchPicsum(keyword, limit, signal) {
  const textureTerms = ['texture', 'abstract', 'minimal', 'surface', 'light', 'pattern', 'grain', 'void', 'blur'];
  if (!textureTerms.some(t => keyword.toLowerCase().includes(t))) return [];
  try {

    const randomPage = Math.floor(Math.random() * 30) + 1;
    const res = await safeFetch(
      `https://picsum.photos/v2/list?page=${randomPage}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Picsum failed');
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .map(item => ({
        id:          `picsum_${item.id}`,
        url:         `https://picsum.photos/id/${item.id}/800/600`,
        thumb:       `https://picsum.photos/id/${item.id}/400/300`,
        title:       `Photo by ${item.author}`,
        description: '',
        source:      'picsum',
        sourceUrl:   item.url || '',
        year:        null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Picsum failed:', e.message);
    return [];
  }
}

export async function fetchUSGS(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://www.sciencebase.gov/catalog/items?q=${encodeURIComponent(keyword)}&filter=tags%3Dimage&format=json&max=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('USGS failed');
    const data = await res.json();
    return (data.items || [])
      .map(item => {
        const imgUrl = item.webLinks?.find(l => l.type === 'thumbnail')?.uri || '';
        if (!imgUrl) return null;
        return {
          id:          `usgs_${item.id}`,
          url:         imgUrl,
          thumb:       imgUrl,
          title:       item.title || 'USGS Item',
          description: item.summary?.slice(0, 100) || '',
          source:      'usgs',
          sourceUrl:   item.link?.url || '',
          year:        item.dates?.[0]?.dateString?.slice(0, 4) || null,
          tags:        [],
          colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('USGS failed:', e.message);
    return [];
  }
}

export async function fetchCooperHewitt(keyword, limit, signal) {
  try {

    const CH_TOKEN = STATE.cooperHewittKey || '4d47366a4e7f1abe2bd9d882dc86e0b5';
    const res = await safeFetch(
      `https://collection.cooperhewitt.org/api/rest/?method=cooperhewitt.search.objects&query=${encodeURIComponent(keyword)}&has_images=1&per_page=${limit}&access_token=${CH_TOKEN}`,
      { signal }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (body.includes('Invalid access token')) throw new Error('CooperHewitt: invalid access token');
      throw new Error('CooperHewitt failed');
    }
    const data = await res.json();
    return (data.objects || [])
      .filter(item => item.images?.[0]?.b?.url)
      .map(item => ({
        id:          `ch_${item.id}`,
        url:         item.images[0].n?.url || item.images[0].b.url,
        thumb:       item.images[0].z?.url || item.images[0].b.url,
        title:       item.title || 'Cooper Hewitt Object',
        description: item.medium || '',
        source:      'cooperhewitt',
        sourceUrl:   item.url || '',
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('CooperHewitt failed:', e.message);
    return [];
  }
}

/* ============================================================
   10B. BATCH 3 FETCH FUNCTIONS
============================================================ */

// C01 — Tate Collection
export async function fetchTate(keyword, limit, signal) {
  // API retired — tate.org.uk/api/v1 returns 404 as of 2026-04
  return [];
  try {

    const res = await safeFetch(
      `https://www.tate.org.uk/api/v1/artworks?q=${encodeURIComponent(keyword)}&page=1&pageSize=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Tate failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.thumbnail?.url)
      .map(item => ({
        id:          'tate_' + item.id,
        url:         item.thumbnail.url,
        thumb:       item.thumbnail.url,
        title:       item.title || 'Tate Artwork',
        description: item.artist?.[0]?.name || '',
        source:      'tate',
        sourceUrl:   `https://www.tate.org.uk/art/artworks/${item.id}`,
        year:        (item.dateText || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Tate failed:', e.message);
    return [];
  }
}

// C02 — Finnish Heritage Agency (Finna.fi)
export async function fetchFinna(keyword, limit, signal, page = 1) {
  try {

    const res = await safeFetch(
      `https://api.finna.fi/api/v1/search?lookfor=${encodeURIComponent(keyword)}&type=AllFields&filter[]=format:0%2FImage%2F&limit=${limit}&page=${page}&field[]=id&field[]=title&field[]=summary&field[]=images&field[]=year`,
      { signal }
    );
    if (!res.ok) throw new Error('Finna failed');
    const data = await res.json();
    return (data.records || [])
      .filter(item => item.images?.[0])
      .map(item => ({
        id:          'finna_' + String(item.id).replace(/[^a-z0-9]/gi, '_'),
        url:         'https://finna.fi' + item.images[0],
        thumb:       'https://finna.fi' + item.images[0],
        title:       Array.isArray(item.title) ? item.title[0] : (item.title || 'Finnish Heritage'),
        description: item.summary?.[0] || '',
        source:      'finna',
        sourceUrl:   `https://www.finna.fi/Record/${encodeURIComponent(item.id)}`,
        year:        item.year || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Finna failed:', e.message);
    return [];
  }
}

// C03 — Swedish National Heritage Board (CORS best-effort)
export async function fetchSOCH(keyword, limit, signal) {
  // Try pre-fetched data cache first
  const cached = await fetchFromDataCache('soch', keyword);
  if (cached) return cached;
  // Fall back to direct API (may fail due to CORS)
  try {
    const res = await safeFetch(
      `https://www.kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage=${limit}&startRecord=1&query=itemName%3D${encodeURIComponent(keyword)}&recordSchema=json`,
      { signal }
    );
    if (!res.ok) throw new Error('SOCH failed');
    const data = await res.json();
    const records = data.result?.records || [];
    return records
      .map((entry, i) => {
        const rec = entry.record || {};
        const thumb = rec.thumbnailSource?.[0];
        if (!thumb) return null;
        return {
          id:          'soch_' + i,
          url:         thumb,
          thumb:       thumb,
          title:       rec.itemName?.[0] || 'Swedish Heritage Item',
          description: '',
          source:      'soch',
          sourceUrl:   rec.url?.[0] || '',
          year:        null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(Boolean)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    return [];
  }
}

// C04 — Joconde (French national museum database)
export async function fetchJoconde(keyword, limit, signal, page = 1) {
  try {
    const res = await safeFetch(
      `https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-joconde-extrait/records?q=${encodeURIComponent(keyword)}&limit=${limit}&offset=${(page - 1) * limit}&select=reference,titre,auteur,presence_image,domaine,periode_de_creation`,
      { signal },
      8000
    );
    if (!res.ok) throw new Error('Joconde failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.reference && item.presence_image === 'oui')
      .map(item => ({
        id:          'joconde_' + item.reference,
        url:         `https://www.pop.culture.gouv.fr/notice/joconde/${item.reference}`,
        thumb:       `https://www.pop.culture.gouv.fr/medias/joconde/${item.reference}/img0.jpg`,
        title:       item.titre || 'French Museum Object',
        description: item.auteur || '',
        source:      'joconde',
        sourceUrl:   `https://www.pop.culture.gouv.fr/notice/joconde/${item.reference}`,
        year:        (item.periode_de_creation || '').match(/\d{4}/)?.[0] || null,
        tags:        (Array.isArray(item.domaine) ? item.domaine : [item.domaine]).filter(Boolean).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Joconde failed:', e.message);
    return [];
  }
}

// C05 — Polish National Museum Warsaw
export async function fetchMNW(keyword, limit, signal, page = 1) {
  try {

    const res = await safeFetch(
      `https://api.mnw.art.pl/api/v1/objects?search=${encodeURIComponent(keyword)}&per_page=${limit}&page=${page}&has_image=true`,
      { signal }
    );
    if (!res.ok) throw new Error('MNW failed');
    const data = await res.json();
    return (data.data || [])
      .filter(item => item.image_url)
      .map(item => ({
        id:          'mnw_' + item.id,
        url:         item.image_url,
        thumb:       item.image_url,
        title:       item.title || 'MNW Object',
        description: item.author || '',
        source:      'mnw',
        sourceUrl:   `https://cyfrowe.mnw.art.pl/pl/katalog/${item.id}`,
        year:        (item.dating || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('MNW failed:', e.message);
    return [];
  }
}

// C06 — Museum of New Zealand Te Papa
export async function fetchTePapa(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://collections.tepapa.govt.nz/search/${encodeURIComponent(keyword)}?filters=hasMedia:true&size=${limit}&from=0`,
      { signal }
    );
    if (!res.ok) throw new Error('Te Papa failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.media?.[0]?.previewUrl)
      .map(item => ({
        id:          'tepapa_' + item.id,
        url:         item.media[0].downloadUrl || item.media[0].previewUrl,
        thumb:       item.media[0].previewUrl,
        title:       item.media[0].title || item.title || 'Te Papa Object',
        description: item.primaryMaker?.title || '',
        source:      'tepapa',
        sourceUrl:   `https://collections.tepapa.govt.nz/object/${item.id}`,
        year:        (item.productionDates?.[0]?.verbatim || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Te Papa failed:', e.message);
    return [];
  }
}

// C07 — DPLA (Digital Public Library of America)
export async function fetchDPLA(keyword, limit, signal, page = 1) {
  if (!STATE.dplaKey) return [];
  try {

    const res = await safeFetch(
      `https://api.dp.la/v2/items?q=${encodeURIComponent(keyword)}&api_key=${encodeURIComponent(STATE.dplaKey)}&page_size=${limit}&page=${page}&fields=id,object,sourceResource`,
      { signal }
    );
    if (!res.ok) throw new Error('DPLA failed');
    const data = await res.json();
    return (data.docs || [])
      .filter(item => item.object)
      .map(item => ({
        id:          'dpla_' + item.id,
        url:         item.object,
        thumb:       item.object,
        title:       item.sourceResource?.title?.[0] || 'DPLA Item',
        description: item.sourceResource?.contributor?.[0] || '',
        source:      'dpla',
        sourceUrl:   `https://dp.la/item/${item.id}`,
        year:        (item.sourceResource?.date?.displayDate || '').slice(0, 4) || null,
        tags:        (item.sourceResource?.subject || []).map(s => s.name?.toLowerCase()).filter(Boolean),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('DPLA failed:', e.message);
    return [];
  }
}

export async function fetchDPLAProvider(provider, keyword, limit, signal) {
  if (!STATE.dplaKey) return [];
  try {
    const res = await safeFetch(
      `https://api.dp.la/v2/items?q=${encodeURIComponent(keyword)}&api_key=${encodeURIComponent(STATE.dplaKey)}&page_size=${limit}&fields=id,object,sourceResource&provider=${encodeURIComponent(provider)}`,
      { signal }
    );
    if (!res.ok) throw new Error('DPLA provider fetch failed');
    const data = await res.json();
    return (data.docs || [])
      .filter(item => item.object)
      .map(item => ({
        id:          'dplap_' + item.id,
        url:         item.object,
        thumb:       item.object,
        title:       item.sourceResource?.title?.[0] || 'DPLA Item',
        description: item.sourceResource?.contributor?.[0] || '',
        source:      'dpla',
        sourceUrl:   `https://dp.la/item/${item.id}`,
        year:        (item.sourceResource?.date?.displayDate || '').slice(0, 4) || null,
        tags:        (item.sourceResource?.subject || []).map(s => s.name?.toLowerCase()).filter(Boolean),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('DPLA provider fetch failed:', e.message);
    return [];
  }
}

/* ── DDB — Deutsche Digitale Bibliothek (key-gated) ──────── */
export async function fetchDDB(keyword, limit, signal, page = 1) {
  if (!STATE.ddbKey) return [];
  try {
    const url = `https://api.deutsche-digitale-bibliothek.de/search?query=${encodeURIComponent(keyword)}&rows=${limit}&offset=${(page - 1) * limit}&type_fct=mediatype_002&oauth_consumer_key=${encodeURIComponent(STATE.ddbKey)}`;
    const res = await safeFetch(url, { signal });
    if (!res.ok) throw new Error('DDB failed');
    const data = await res.json();
    const docs = data.results?.[0]?.docs || data.results || [];
    return (Array.isArray(docs) ? docs : [])
      .filter(item => item.preview || item.thumbnail)
      .map(item => ({
        id:          'ddb_' + item.id,
        url:         item.preview?.image || item.preview?.thumbnail || item.thumbnail || item.preview || '',
        thumb:       item.preview?.thumbnail || item.preview?.image || item.thumbnail || item.preview || '',
        title:       item.title || item.label || 'DDB Item',
        description: item.subtitle || '',
        source:      'ddb',
        sourceUrl:   `https://www.deutsche-digitale-bibliothek.de/item/${item.id}`,
        year:        null,
        tags:        [],
        colors: [], aiTags: [],
      }))
      .filter(i => i.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('DDB failed:', e.message);
    return [];
  }
}

// C08 — Artsy (xapp token, two-credential)
export async function fetchArtsy(keyword, limit, signal) {
  if (!STATE.artsyId || !STATE.artsySecret) return [];
  try {

    // Acquire or reuse xapp token
    if (!STATE.artsyToken) {
      const tokenRes = await safeFetch('https://api.artsy.net/api/tokens/xapp_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: STATE.artsyId, client_secret: STATE.artsySecret }),
        signal,
      });
      if (!tokenRes.ok) throw new Error('Artsy token failed');
      const tokenData = await tokenRes.json();
      STATE.artsyToken = tokenData.token;
    }
    const res = await safeFetch(
      `https://api.artsy.net/api/artworks?q=${encodeURIComponent(keyword)}&size=${limit}`,
      { headers: { 'X-Xapp-Token': STATE.artsyToken }, signal }
    );
    if (!res.ok) throw new Error('Artsy search failed');
    const data = await res.json();
    return (data._embedded?.artworks || [])
      .filter(item => item._links?.thumbnail?.href)
      .map(item => ({
        id:          'artsy_' + item.id,
        url:         (item._links?.image?.href || item._links?.thumbnail?.href || '').replace('{image_version}', 'larger'),
        thumb:       item._links.thumbnail.href,
        title:       item.title || 'Artsy Artwork',
        description: item.date || '',
        source:      'artsy',
        sourceUrl:   (item._links?.self?.href || '').replace('api.artsy.net/api', 'www.artsy.net'),
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Artsy failed:', e.message);
    STATE.artsyToken = null; // reset on error so next search retries token
    return [];
  }
}

// C09 — Portable Antiquities Scheme (UK finds)
export async function fetchPAS(keyword, limit, signal) {
  // API now requires authentication (403) as of 2026-04
  return [];
  try {

    const res = await safeFetch(
      `https://finds.org.uk/api/search.json?q=${encodeURIComponent(keyword)}&has_images=1&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('PAS failed');
    const data = await res.json();
    return (data.hits || [])
      .filter(item => item.thumbnail)
      .map(item => ({
        id:          'pas_' + item.id,
        url:         item.thumbnail,
        thumb:       item.thumbnail,
        title:       item.title || 'UK Find',
        description: (item.broadperiod ? item.broadperiod + ' — ' : '') + (item.description || '').slice(0, 80),
        source:      'pas',
        sourceUrl:   `https://finds.org.uk/database/artefacts/record/id/${item.id}`,
        year:        (item.created || '').slice(0, 4) || null,
        tags:        [item.broadperiod?.toLowerCase()].filter(Boolean),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('PAS failed:', e.message);
    return [];
  }
}

// C10 — Science Museum Group UK
export async function fetchSMG(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://collection.sciencemuseumgroup.org.uk/search/objects?q=${encodeURIComponent(keyword)}&has_image=1&page[number]=1&page[size]=${limit}`,
      { signal, headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error('SMG failed');
    const ct = (res.headers.get('content-type') || '');
    if (!ct.includes('json')) throw new Error('SMG returned non-JSON: ' + ct);
    const data = await res.json();
    return (data.data || [])
      .filter(item => item.attributes?.images?.[0]?.processed?.medium?.location)
      .map(item => ({
        id:          'smg_' + item.id,
        url:         item.attributes.images[0].processed.large?.location || item.attributes.images[0].processed.medium.location,
        thumb:       item.attributes.images[0].processed.medium.location,
        title:       item.attributes?.summary_title || 'Science Museum Object',
        description: item.attributes?.description?.[0]?.value?.slice(0, 100) || '',
        source:      'smg',
        sourceUrl:   item.links?.self || '',
        year:        null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('SMG failed:', e.message);
    return [];
  }
}

// C11 — Auckland War Memorial Museum
export async function fetchAuckland(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://api.aucklandmuseum.com/id/media/v2/mediaartifact/?q=${encodeURIComponent(keyword)}&size=${limit}`,
      { signal, headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error('Auckland failed');
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Error('Auckland returned non-JSON: ' + ct);
    const data = await res.json();
    return (data.hits?.hits || [])
      .filter(item => item._source?.media_id?.[0])
      .map(item => {
        const src = item._source;
        const mediaId = src.media_id[0];
        const thumb = `https://api.aucklandmuseum.com/id/media/v2/mediaartifact/${mediaId}`;
        return {
          id:          'auck_' + item._id.replace(/\//g, '_'),
          url:         thumb,
          thumb:       thumb,
          title:       src.dc_title?.[0] || 'Auckland Museum Object',
          description: src.dc_description?.[0]?.slice(0, 100) || '',
          source:      'auckland',
          sourceUrl:   `https://www.aucklandmuseum.com/collection/${item._id}`,
          year:        (src.dc_date?.[0] || '').slice(0, 4) || null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Auckland failed:', e.message);
    return [];
  }
}

// C12 — Photogrammar (FSA/OWI Depression photographs)
export async function fetchPhotogrammar(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://photogrammar.org/api/search?query=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Photogrammar failed');
    const data = await res.json();
    return (data.photos || [])
      .filter(item => item.lc_id)
      .map(item => ({
        id:          'fsa_' + item.lc_id,
        url:         `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:50/0/default.jpg`,
        thumb:       `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:25/0/default.jpg`,
        title:       item.title || 'FSA Photograph',
        description: [item.photographer, item.county, item.state].filter(Boolean).join(', '),
        source:      'photogrammar',
        sourceUrl:   `https://photogrammar.org/photos/${item.lc_id}`,
        year:        item.year || null,
        tags:        [item.photographer, item.state].filter(Boolean).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Photogrammar failed:', e.message);
    return [];
  }
}

// C13 — Wellcome Collection
export async function fetchWellcome(keyword, limit, signal, page = 1) {
  try {

    const res = await safeFetch(
      `https://api.wellcomecollection.org/catalogue/v2/works?query=${encodeURIComponent(keyword)}&workType=k&items.locations.locationType=iiif-image&pageSize=${limit}&page=${page}`,
      { signal }
    );
    if (!res.ok) throw new Error('Wellcome failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.thumbnail?.url)
      .map(item => {
        const base = item.thumbnail.url.replace(/\/full\/[^/]+\/\d+\/default\.\w+$/, '');
        return {
        id:          'wellcome_' + item.id,
        url:         base + '/full/max/0/default.jpg',
        thumb:       base + '/full/400,/0/default.jpg',
        title:       item.title || 'Wellcome Item',
        description: item.contributors?.[0]?.agent?.label || '',
        source:      'wellcome',
        sourceUrl:   `https://wellcomecollection.org/works/${item.id}`,
        year:        item.production?.[0]?.dates?.[0]?.label?.match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Wellcome failed:', e.message);
    return [];
  }
}

// C14 — Powerhouse Museum (MAAS) Sydney
export async function fetchMAAS(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://collection.maas.museum/api/search?q=${encodeURIComponent(keyword)}&has_image=yes&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('MAAS failed');
    const data = await res.json();
    return (data.records || [])
      .filter(item => item.images?.[0]?.url)
      .map(item => ({
        id:          'maas_' + String(item.id).replace(/\//g, '_'),
        url:         item.images[0].url,
        thumb:       item.images[0].url,
        title:       item.title || 'Powerhouse Object',
        description: item.maker?.[0] || '',
        source:      'maas',
        sourceUrl:   `https://collection.maas.museum/object/${encodeURIComponent(item.id)}`,
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('MAAS failed:', e.message);
    return [];
  }
}

// C15 — Statens Museum for Kunst (Denmark)
export async function fetchSMK(keyword, limit, signal) {
  try {

    const res = await safeFetch(
      `https://api.smk.dk/api/v1/art/search/?keys=${encodeURIComponent(keyword)}&has_image=true&offset=0&rows=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('SMK failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.image_thumbnail)
      .map(item => ({
        id:          'smk_' + item.object_number,
        url:         (item.image_thumbnail || '').replace('/thumb/', '/full/'),
        thumb:       item.image_thumbnail,
        title:       item.titles?.[0]?.title || 'SMK Artwork',
        description: item.artist?.[0] || '',
        source:      'smk',
        sourceUrl:   `https://open.smk.dk/artwork/image/${item.object_number}`,
        year:        item.production_date?.[0]?.period?.match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('SMK failed:', e.message);
    return [];
  }
}

// C16 — Museo Thyssen-Bornemisza (CORS best-effort)
export async function fetchThyssen(keyword, limit, signal) {
  // Try pre-fetched data cache first
  const cached = await fetchFromDataCache('thyssen', keyword);
  if (cached) return cached;
  // Fall back to direct API (may fail due to CORS)
  try {
    const res = await safeFetch(
      `https://www.museothyssen.org/api/v1/coleccion/obras?search=${encodeURIComponent(keyword)}&page=1&per_page=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Thyssen failed');
    const data = await res.json();
    return (data.data || [])
      .filter(item => item.imagen_url)
      .map(item => ({
        id:          'thyssen_' + item.id,
        url:         item.imagen_url,
        thumb:       item.imagen_url,
        title:       item.titulo || 'Thyssen Artwork',
        description: item.autor || '',
        source:      'thyssen',
        sourceUrl:   `https://www.museothyssen.org/coleccion/obras/${item.id}`,
        year:        (item.fecha || '').match(/\d{4}/)?.[0] || null,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    return [];
  }
}

// ── BATCH 4 FETCH FUNCTIONS ──────────────────────────────────

export async function fetchWalters(keyword, limit, signal) {
  // API now requires authentication (403) as of 2026-04
  return [];
  try {
    const res = await safeFetch(
      `https://api.thewalters.org/v1/objects.json?keyword=${encodeURIComponent(keyword)}&orderBy=relevance&page=1&pageSize=${limit}&apikey=`,
      { signal }
    );
    if (!res.ok) throw new Error('Walters failed');
    const data = await res.json();
    return (data.Items || [])
      .filter(item => item.PrimaryImage?.Lg)
      .map(item => ({
        id:          'walters_' + item.ObjectID,
        url:         item.PrimaryImage.Lg,
        thumb:       item.PrimaryImage.Sm || item.PrimaryImage.Lg,
        title:       item.Title || 'Walters Object',
        description: [item.Artist, item.Dated].filter(Boolean).join(' — '),
        year:        (item.Dated || '').match(/\d{4}/)?.[0] || null,
        source:      'walters',
        sourceUrl:   item.ResourceURL || '',
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Walters failed:', e.message);
    return [];
  }
}

export async function fetchPrinceton(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://data.artmuseum.princeton.edu/search?query=${encodeURIComponent(keyword)}&size=${limit}&from=0`,
      { signal }
    );
    if (!res.ok) throw new Error('Princeton failed');
    const data = await res.json();
    return (data.hits?.hits || [])
      .filter(item => item._source?.images?.[0]?.iiifbaseuri)
      .map(item => {
        const base = item._source.images[0].iiifbaseuri;
        return {
          id:          'princeton_' + item._id,
          url:         base + '/full/max/0/default.jpg',
          thumb:       base + '/full/!400,400/0/default.jpg',
          title:       item._source.title || 'Princeton Object',
          description: item._source.displaymaker || '',
          year:        (item._source.displaydate || '').match(/\d{4}/)?.[0] || null,
          source:      'princeton',
          sourceUrl:   `https://artmuseum.princeton.edu/collections/objects/${item._source.id}`,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Princeton failed:', e.message);
    return [];
  }
}

export async function fetchWikidata(keyword, limit, signal, offset = 0) {
  try {
    const sparql = `SELECT ?item ?itemLabel ?image ?date WHERE {
  ?item wdt:P18 ?image.
  ?item rdfs:label ?itemLabel.
  FILTER(LANG(?itemLabel) = "en")
  FILTER(CONTAINS(LCASE(?itemLabel), LCASE("${keyword.replace(/"/g, '')}")))
  OPTIONAL { ?item wdt:P571 ?date. }
} LIMIT ${limit} OFFSET ${offset}`.trim();
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const res = await safeFetch(url, {
      signal,
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'InpoSearch/1.0',
      },
    });
    if (!res.ok) throw new Error('Wikidata failed');
    const data = await res.json();
    return (data.results?.bindings || [])
      .filter(b => b.image?.value)
      .map(b => ({
        id:          'wd_' + b.item.value.split('/').pop(),
        url:         b.image.value.replace('http://', 'https://'),
        thumb:       b.image.value.replace('http://', 'https://') + '?width=400',
        title:       b.itemLabel?.value || 'Wikidata Item',
        description: '',
        year:        b.date?.value?.slice(0, 4) || null,
        source:      'wikidata',
        sourceUrl:   b.item.value.replace('http://', 'https://'),
        tags:        [b.itemLabel?.value?.toLowerCase()].filter(Boolean),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Wikidata failed:', e.message);
    return [];
  }
}

export async function fetchNOAA(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://www.photolib.noaa.gov/api/search?q=${encodeURIComponent(keyword)}&format=json&rows=${limit}&start=0`,
      { signal }
    );
    if (!res.ok) throw new Error('NOAA failed');
    const data = await res.json();
    return (data.response?.docs || [])
      .filter(item => item.url_full)
      .map(item => ({
        id:          'noaa_' + item.id,
        url:         item.url_full,
        thumb:       item.url_thumbnail || item.url_full,
        title:       item.title || 'NOAA Photo',
        description: item.photographer || '',
        year:        (item.date || '').slice(0, 4) || null,
        source:      'noaa',
        sourceUrl:   `https://www.photolib.noaa.gov/search?q=${encodeURIComponent(keyword)}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('NOAA failed:', e.message);
    return [];
  }
}

export async function fetchHubble(keyword, limit, signal) {
  try {
    const cacheAge = STATE.hubbleCacheTimestamp
      ? Date.now() - STATE.hubbleCacheTimestamp
      : Infinity;

    if (!STATE.hubbleCache.length || cacheAge > 6 * 60 * 60 * 1000) {
      const res = await safeFetch(
        'https://hubblesite.org/api/v3/external_feed?service=NEWS_IMAGES&page=all',
        { signal }
      );
      if (!res.ok) throw new Error('Hubble failed');
      const data = await res.json();
      STATE.hubbleCache = (data || [])
        .filter(item => item.thumbnail_url)
        .map(item => ({
          id:          'hubble_' + item.id,
          url:         (item.thumbnail_url || '').replace('_thumb', ''),
          thumb:       item.thumbnail_url,
          title:       item.name || 'Hubble Image',
          description: (item.description || '').slice(0, 100),
          year:        item.news_id?.slice(0, 4) || null,
          source:      'hubble',
          sourceUrl:   `https://hubblesite.org/contents/news-releases/${item.news_id || ''}`,
          tags:        ['space', 'astronomy', 'nebula', 'hubble'],
          colors: [], aiTags: [],
        }))
        .filter(i => i.thumb);
      STATE.hubbleCacheTimestamp = Date.now();
    }

    const kw = keyword.toLowerCase();
    const matched = STATE.hubbleCache.filter(item =>
      (item.title + ' ' + item.description + ' ' + item.tags.join(' '))
        .toLowerCase().includes(kw)
    );

    const pool = matched.length > 0 ? matched : STATE.hubbleCache;
    return shuffle([...pool]).slice(0, limit);
  } catch (e) {
    console.warn('Hubble failed:', e.message);
    return [];
  }
}

export async function fetchCornell(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://digital.library.cornell.edu/catalog.json?q=${encodeURIComponent(keyword)}&f[format][]=Image&per_page=${limit}&page=1`,
      { signal }
    );
    if (!res.ok) throw new Error('Cornell failed');
    const data = await res.json();
    return (data.data || [])
      .filter(item => item.attributes?.thumbnail_path_ss)
      .map(item => {
        const thumb = 'https://digital.library.cornell.edu' + item.attributes.thumbnail_path_ss;
        const url   = thumb.replace('thumbnail', 'large');
        return {
          id:          'cornell_' + item.id.replace(/[^a-z0-9]/gi, '_'),
          url,
          thumb,
          title:       item.attributes.title_tesim?.[0] || 'Cornell Item',
          description: item.attributes.creator_tesim?.[0] || '',
          year:        item.attributes.date_created_tesim?.[0]?.match(/\d{4}/)?.[0] || null,
          source:      'cornell',
          sourceUrl:   `https://digital.library.cornell.edu/catalog/${item.id}`,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Cornell failed:', e.message);
    return [];
  }
}

export async function fetchFolger(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://collections.folger.edu/search?q=${encodeURIComponent(keyword)}&per_page=${limit}&format=json`,
      { signal },
      6000
    );
    if (!res.ok) throw new Error('Folger failed');
    const data = await res.json();
    return (data.response?.docs || [])
      .filter(item => item.thumbnail_path)
      .map(item => ({
        id:          'folger_' + item.id.replace(/[^a-z0-9]/gi, '_'),
        url:         item.thumbnail_path,
        thumb:       item.thumbnail_path,
        title:       item.title_display || 'Folger Item',
        description: item.author_display?.[0] || '',
        year:        (item.pub_date || '').match(/\d{4}/)?.[0] || null,
        source:      'folger',
        sourceUrl:   `https://collections.folger.edu/detail/${item.id}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchONB(keyword, limit, signal, page = 1) {
  try {
    const res = await safeFetch(
      `https://api.onb.ac.at/api/v1/search?q=${encodeURIComponent(keyword)}&imageOnly=true&rows=${limit}&start=${(page - 1) * limit}`,
      { signal },
      6000
    );
    if (!res.ok) throw new Error('ONB failed');
    const data = await res.json();
    return (data.docs || [])
      .filter(item => item.thumbnail)
      .map(item => ({
        id:          'onb_' + item.id.replace(/[^a-z0-9]/gi, '_'),
        url:         item.thumbnail,
        thumb:       item.thumbnail,
        title:       item.title || 'ÖNB Item',
        description: item.creator?.[0] || '',
        year:        (item.date || '').slice(0, 4) || null,
        source:      'onb',
        sourceUrl:   `https://digital.onb.ac.at/search?q=${encodeURIComponent(keyword)}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchNYPL(keyword, limit, signal, page = 1) {
  try {
    const res = await safeFetch(
      `https://api.repo.nypl.org/api/v2/items/search?q=${encodeURIComponent(keyword)}&per_page=${limit}&page=${page}`,
      { signal }
    );
    if (!res.ok) throw new Error('NYPL failed');
    const data = await res.json();
    const results = data.nyplAPI?.response?.result || [];
    return results
      .filter(item => item.imageLinks?.imageLink?.[0])
      .map(item => {
        const url = item.imageLinks.imageLink[0];
        return {
          id:          'nypl_' + item.uuid,
          url,
          thumb:       url.replace('t=w', 't=t'),
          title:       item.title || 'NYPL Item',
          description: '',
          year:        item.dateStructured?.[0]?.decade || null,
          source:      'nypl',
          sourceUrl:   `https://digitalcollections.nypl.org/items/${item.uuid}`,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('NYPL failed:', e.message);
    return [];
  }
}

export async function fetchMAK(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://sammlung.mak.at/api/v1/search?q=${encodeURIComponent(keyword)}&has_image=true&per_page=${limit}`,
      { signal }, 'mak'
    );
    if (!res.ok) throw new Error('MAK failed');
    const data = await res.json();
    return (data.objects || [])
      .filter(item => item.image_url)
      .map(item => ({
        id:          'mak_' + String(item.id).replace(/[^a-z0-9]/gi, '_'),
        url:         item.image_url,
        thumb:       item.image_url,
        title:       item.title || 'MAK Object',
        description: item.artist || '',
        year:        (item.date || '').match(/\d{4}/)?.[0] || null,
        source:      'mak',
        sourceUrl:   `https://sammlung.mak.at/en/objectdb/detail/${item.id}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchMNA(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://mna.inah.gob.mx/api/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }, 'mna'
    );
    if (!res.ok) throw new Error('MNA failed');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || []);
    return items
      .filter(item => item.image || item.image_url)
      .map(item => ({
        id:          'mna_' + String(item.id || item.objectId || Math.random()).replace(/[^a-z0-9]/gi, '_'),
        url:         item.image || item.image_url,
        thumb:       item.image || item.image_url,
        title:       item.title || item.nombre || 'MNA Object',
        description: item.culture || item.cultura || '',
        year:        (item.date || item.fecha || '').match(/\d{4}/)?.[0] || null,
        source:      'mna',
        sourceUrl:   `https://mna.inah.gob.mx`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

// ── BATCH 7 FETCH FUNCTIONS ──────────────────────────────────

export async function fetchMia(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://search.artsmia.org/?q=${encodeURIComponent(keyword)}&size=${limit}`,
      { signal }, 'mia'
    );
    if (!res.ok) throw new Error('Mia failed');
    // Mia's search endpoint returns application/json content with text/plain CT.
    // Parse as JSON from text regardless of the advertised content-type.
    const text = await res.text();
    if (!text) return [];
    let data;
    try { data = JSON.parse(text); } catch { return []; }
    return (data.hits?.hits || [])
      .filter(hit => hit._source?.image === 'valid' && hit._source?.restricted === 0)
      .map(hit => ({
        id:          `mia_${hit._id}`,
        url:         `https://api.artsmia.org/images/${hit._id}/large.jpg`,
        thumb:       `https://api.artsmia.org/images/${hit._id}/medium.jpg`,
        title:       hit._source.title || 'Mia Object',
        description: hit._source.artist || '',
        year:        (hit._source.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'mia',
        sourceUrl:   `https://collections.artsmia.org/art/${hit._id}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Mia failed:', e.message);
    return [];
  }
}

export async function fetchLACMA(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://collections.lacma.org/api/search?q=${encodeURIComponent(keyword)}&f[]=has_image:true&f[]=public_domain:true&rows=${limit}&start=0`,
      { signal }, 'lacma'
    );
    if (!res.ok) throw new Error('LACMA failed');
    const data = await res.json();
    return (data.response?.docs || [])
      .filter(item => item.thumbnail_url_s)
      .map(item => ({
        id:          `lacma_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.thumbnail_url_s,
        thumb:       item.thumbnail_url_s,
        title:       item.title_s || 'LACMA Object',
        description: item.artist_s || '',
        year:        (item.date_s || '').match(/\d{4}/)?.[0] || null,
        source:      'lacma',
        sourceUrl:   `https://collections.lacma.org/node/${(item.id || '').split(':')[1] || ''}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchMunch(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://www.munchmuseet.no/api/v1/works?q=${encodeURIComponent(keyword)}&limit=${limit}&hasImage=true`,
      { signal }, 'munch'
    );
    if (!res.ok) throw new Error('Munch failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.image?.url)
      .map(item => ({
        id:          `munch_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image.url,
        thumb:       item.image.url,
        title:       item.title || 'Munch Work',
        description: item.technique || '',
        year:        (item.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'munch',
        sourceUrl:   `https://www.munchmuseet.no/en/the-collection/${item.id || ''}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchMauritshuis(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://www.mauritshuis.nl/api/collection/search?query=${encodeURIComponent(keyword)}&limit=${limit}&imageAvailable=true`,
      { signal }, 'mauritshuis'
    );
    if (!res.ok) throw new Error('Mauritshuis failed');
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.image)
      .map(item => ({
        id:          `mauritshuis_${item.id || ''}`,
        url:         item.image,
        thumb:       item.image,
        title:       item.title || 'Mauritshuis Object',
        description: item.maker || '',
        year:        (item.dating || '').match(/\d{4}/)?.[0] || null,
        source:      'mauritshuis',
        sourceUrl:   `https://www.mauritshuis.nl/en/our-collection/artworks/${item.id || ''}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchNationalmuseumSE(keyword, limit, signal) {
  // Swedish national museum via Wikimedia Commons incategory:Nationalmuseum
  try {
    const searchRes = await safeFetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}+incategory:Nationalmuseum&srnamespace=6&srlimit=${limit}&format=json&origin=*`,
      { signal }
    );
    if (!searchRes.ok) throw new Error('NationalmuseumSE search failed');
    const searchData = await searchRes.json();
    const titles = (searchData.query?.search || []).map(r => r.title);
    if (!titles.length) return [];
    const infoRes = await safeFetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
      { signal }
    );
    if (!infoRes.ok) throw new Error('NationalmuseumSE imageinfo failed');
    const infoData = await infoRes.json();
    return Object.values(infoData.query?.pages || {})
      .filter(p => p.imageinfo?.[0]?.url)
      .map(p => {
        const info = p.imageinfo[0];
        const meta = info.extmetadata || {};
        const title = (meta.ObjectName?.value || p.title || '').replace(/^File:/i, '');
        return {
          id:          `nmse_${p.pageid}`,
          url:         info.url,
          thumb:       info.url,
          title:       title || 'Nationalmuseum Work',
          description: meta.Artist?.value?.replace(/<[^>]+>/g, '') || '',
          year:        (meta.DateTimeOriginal?.value || meta.Date?.value || '').match(/\d{4}/)?.[0] || null,
          source:      'nationalmuseumse',
          sourceUrl:   info.descriptionurl || '',
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchNaturalis(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://api.biodiversitydata.nl/v2/specimen/search/?_search=${encodeURIComponent(keyword)}&_hasImage=true&_size=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('Naturalis failed');
    const data = await res.json();
    return (data.resultSet || [])
      .map(r => r.item)
      .filter(item => item?.associatedMultiMediaUris?.[0]?.accessURI)
      .map(item => ({
        id:          `naturalis_${String(item.unitID || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.associatedMultiMediaUris[0].accessURI,
        thumb:       item.associatedMultiMediaUris[0].accessURI,
        title:       item.identifications?.[0]?.scientificName?.fullScientificName || 'Naturalis Specimen',
        description: item.gatheringEvent?.country || '',
        year:        item.gatheringEvent?.dateTimeBegin?.slice(0, 4) || null,
        source:      'naturalis',
        sourceUrl:   `https://bioportal.naturalis.nl/specimen/${encodeURIComponent(item.unitID || '')}`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('Naturalis failed:', e.message);
    return [];
  }
}

export async function fetchNMAAHC(keyword, limit, signal) {
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await sourceFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NMAAHC`,
      { signal }, 'nmaahc'
    );
    if (!res.ok) throw new Error('NMAAHC failed');
    const data = await res.json();
    return (data.response?.rows || [])
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `nmaahc_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'NMAAHC Object',
          description: '',
          source:      'nmaahc',
          sourceUrl:   `https://nmaahc.si.edu/object/${row.id}`,
          year:        null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('NMAAHC failed:', e.message);
    return [];
  }
}

export async function fetchNASM(keyword, limit, signal) {
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await sourceFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NASM`,
      { signal }, 'nasm'
    );
    if (!res.ok) throw new Error('NASM failed');
    const data = await res.json();
    return (data.response?.rows || [])
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `nasm_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'NASM Object',
          description: '',
          source:      'nasm',
          sourceUrl:   `https://airandspace.si.edu/collection/id/${row.id}`,
          year:        null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('NASM failed:', e.message);
    return [];
  }
}

export async function fetchNationalZoo(keyword, limit, signal) {
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await safeFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NZP`,
      { signal }
    );
    if (!res.ok) throw new Error('NationalZoo failed');
    const data = await res.json();
    return (data.response?.rows || [])
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `zoo_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'National Zoo',
          description: '',
          source:      'nationalzoo',
          sourceUrl:   `https://nationalzoo.si.edu/animals`,
          year:        null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('NationalZoo failed:', e.message);
    return [];
  }
}

export async function fetchFreerSackler(keyword, limit, signal) {
  if (!STATE.smithsonianKey) return [];
  try {
    const key = STATE.smithsonianKey;
    const res = await safeFetch(
      `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=FSG`,
      { signal }
    );
    if (!res.ok) throw new Error('FreerSackler failed');
    const data = await res.json();
    return (data.response?.rows || [])
      .filter(row => row.indexedStructured?.online_media?.[0])
      .map(row => {
        const media = row.indexedStructured.online_media[0];
        return {
          id:          `fsg_${row.id}`,
          url:         media.content || media.thumbnail,
          thumb:       media.thumbnail || media.content,
          title:       row.title || 'Freer|Sackler Object',
          description: '',
          source:      'freersackler',
          sourceUrl:   `https://asia.si.edu/object/${row.id}`,
          year:        null,
          tags: [], colors: [], aiTags: [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('FreerSackler failed:', e.message);
    return [];
  }
}

export async function fetchWhitney(keyword, limit, signal) {
  try {
    const cacheAge = STATE.whitneyCacheTimestamp
      ? Date.now() - STATE.whitneyCacheTimestamp
      : Infinity;

    if (!STATE.whitneyCache.length ||
        cacheAge > 24 * 60 * 60 * 1000) {
      const res = await safeFetch(
        'https://raw.githubusercontent.com/whitneymuseum/open-access/main/artworks.csv',
        { signal }
      );
      if (!res.ok) throw new Error('Whitney failed');
      const text = await res.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',')
        .map(h => h.replace(/"/g, '').trim());
      STATE.whitneyCache = lines.slice(1)
        .map(line => {
          // Proper CSV parse — handle quoted fields containing commas
          const vals = [];
          let cur = '', inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; continue; }
            if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
            cur += c;
          }
          vals.push(cur.trim());
          return Object.fromEntries(
            headers.map((h, i) => [h, (vals[i] || '').trim()])
          );
        })
        .filter(a => a.imageURL && a.imageURL.startsWith('http'))
        .map((a, i) => ({
          id:          `whitney_${a.ObjectID || i}`,
          url:         a.imageURL,
          thumb:       a.imageURL,
          title:       a.Title || 'Whitney Artwork',
          description: a.Artist || '',
          year:        (a.Date || '').match(/\d{4}/)?.[0] || null,
          source:      'whitney',
          sourceUrl:   `https://whitney.org/collection/works/${a.ObjectID}`,
          tags:        [a.Classification, a.Medium]
                         .filter(Boolean).map(t => t.toLowerCase()),
          colors: [], aiTags: [],
        }));
      STATE.whitneyCacheTimestamp = Date.now();
    }

    const kw = keyword.toLowerCase();
    const matched = STATE.whitneyCache.filter(item =>
      (item.title + ' ' + item.description + ' ' + item.tags.join(' '))
        .toLowerCase().includes(kw)
    );
    const pool = matched.length > 0 ? matched : STATE.whitneyCache;
    return shuffle([...pool]).slice(0, limit);
  } catch (e) {
    console.warn('Whitney failed:', e.message);
    return [];
  }
}

export async function fetchGBIFLiterature(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(keyword)}&mediaType=StillImage&basisOfRecord=LITERATURE&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('GBIF Literature failed');
    const data = await res.json();
    return (data.results || [])
      .filter(obs => obs.media?.[0]?.identifier)
      .map(obs => ({
        id:          `gbiflit_${obs.key}`,
        url:         obs.media[0].identifier,
        thumb:       obs.media[0].identifier,
        title:       obs.scientificName || obs.species || 'GBIF Literature',
        description: obs.references || '',
        year:        (obs.year || '').toString() || null,
        source:      'gbiflit',
        sourceUrl:   `https://www.gbif.org/occurrence/${obs.key}`,
        tags:        [obs.species, obs.kingdom].filter(Boolean).map(t => t.toLowerCase()),
        colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    console.warn('GBIF Literature failed:', e.message);
    return [];
  }
}

// ── Phase B: iDigBio ── biodiversity media records ────────────────────
export async function fetchIDigBio(keyword, limit, signal) {
  try {
    const rq = encodeURIComponent(JSON.stringify({ hasImage: true }));
    const res = await safeFetch(
      `https://search.idigbio.org/v2/search/media?rq=${rq}&q=${encodeURIComponent(keyword)}&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('iDigBio fetch failed');
    const data = await res.json();
    return (data.items || [])
      .filter(item => item.indexTerms && item.indexTerms.accessuri)
      .map(item => ({
        id:          `idigbio_${item.uuid}`,
        url:         item.indexTerms.accessuri,
        thumb:       item.indexTerms.accessuri,
        title:       (item.data && (item.data['dcterms:title'] || item.data['ac:tag'])) || 'iDigBio Image',
        description: (item.data && (item.data['dcterms:description'] || '')) || '',
        source:      'idigbio',
        sourceUrl:   `https://www.idigbio.org/portal/mediarecords/${item.uuid}`,
        year:        ((item.data && item.data['dcterms:available']) || '').slice(0, 4) || null,
        tags:        [item.indexTerms.tag].filter(Boolean),
        colors:      [],
        aiTags:      [],
      }))
      .filter(item => item.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('iDigBio failed:', e.message);
    return [];
  }
}

// ── Phase B: ALA ── Atlas of Living Australia images ─────────────────────
export async function fetchALA(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://biocache.ala.org.au/ws/occurrences/search?q=${encodeURIComponent(keyword)}&fq=multimedia:Image&pageSize=${limit}&fl=uuid,scientificName,vernacularName,stateProvince,images`,
      { signal }
    );
    if (!res.ok) throw new Error('ALA fetch failed');
    const data = await res.json();
    return (data.occurrences || [])
      .filter(occ => occ.images && occ.images.length)
      .map(occ => {
        const imgId = occ.images[0];
        const url   = `https://images.ala.org.au/image/${imgId}/original`;
        const thumb = `https://images.ala.org.au/image/${imgId}/thumbnail`;
        const title = occ.vernacularName || occ.scientificName || 'ALA Image';
        return {
          id:          `ala_${occ.uuid || imgId}`,
          url,
          thumb,
          title,
          description: occ.stateProvince || occ.scientificName || '',
          source:      'ala',
          sourceUrl:   `https://biocache.ala.org.au/occurrences/${occ.uuid}`,
          year:        null,
          tags:        [occ.scientificName, occ.vernacularName].filter(Boolean).map(t => t.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(item => item.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('ALA failed:', e.message);
    return [];
  }
}

// ── Phase D: NASA Images Library ─────────────────────────────────────────
export async function fetchNASAImages(keyword, limit, signal, page = 1) {
  try {
    const res = await safeFetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(keyword)}&media_type=image&page_size=${limit}&page=${page}`,
      { signal }
    );
    if (!res.ok) throw new Error('NASA Images fetch failed');
    const data = await res.json();
    return (data.collection?.items || [])
      .filter(item => item.links?.[0]?.href)
      .map(item => {
        const d    = item.data?.[0] || {};
        const url  = item.links[0].href;
        const thumb = url.replace('~medium.jpg', '~thumb.jpg').replace('~small.jpg', '~thumb.jpg');
        return {
          id:          `nasaimg_${d.nasa_id || Math.random().toString(36).slice(2)}`,
          url,
          thumb,
          title:       d.title || 'NASA Image',
          description: d.description ? d.description.slice(0, 200) : '',
          source:      'nasa_images',
          sourceUrl:   `https://images.nasa.gov/details/${d.nasa_id}`,
          year:        d.date_created ? d.date_created.slice(0, 4) : null,
          tags:        (d.keywords || []).map(t => t.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(item => item.url)
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('NASA Images failed:', e.message);
    return [];
  }
}

// ── New CORS-blocked sources (cache-first) ───────────────────────────────

// NHM London — Natural History Museum Data Portal (CKAN datastore_search)
// Resource ID for the specimen collection: 05ff2255-c38a-40c9-b657-4ccb55ab2feb
// NHM media store URL pattern: https://www.nhm.ac.uk/services/media-store/asset/{uuid}/contents/preview
// Raw record shape (for reference): { _id, scientificName, genus, family, locality,
//   collectionCode, associatedMedia, occurrenceID, year, dateIdentified, … }
// associatedMedia is pipe-separated when multiple assets are present; take index 0.
// Uncomment the line below to inspect new field shapes in the browser console:
// console.log('[NHM] raw record sample:', records[0]);
export async function fetchNHMLondon(keyword, limit, signal) {
  const cached = await fetchFromDataCache('nhm_london', keyword);
  if (cached) return cached.map(item => ({ ...item, source: 'nhm_london' }));
  try {
    // Request extra rows so we still hit `limit` after filtering to records with images
    const url = `https://data.nhm.ac.uk/api/3/action/datastore_search` +
      `?resource_id=05ff2255-c38a-40c9-b657-4ccb55ab2feb` +
      `&q=${encodeURIComponent(keyword)}` +
      `&limit=${limit * 3}`;
    const res = await safeFetch(url, { signal });
    if (!res.ok) throw new Error(`NHM fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('NHM API returned success:false');
    const records = data.result?.records || [];
    return records
      // Only return records that have an associated image asset
      .filter(r => r.associatedMedia && String(r.associatedMedia).trim())
      .map(r => {
        // associatedMedia may be pipe-delimited; take the first URL
        const mediaUrl = String(r.associatedMedia).split('|')[0].trim();
        const title    = r.scientificName || r.genus || 'NHM Specimen';
        const descParts = [r.family, r.collectionCode, r.locality].filter(Boolean);
        return {
          id:          `nhm_${r._id}`,
          url:         mediaUrl,
          thumb:       mediaUrl,
          title,
          description: descParts.join(' — '),
          source:      'nhm_london',
          sourceUrl:   r.occurrenceID || `https://data.nhm.ac.uk/object/${r._id}`,
          year:        (String(r.year || r.dateIdentified || '')).match(/\d{4}/)?.[0] || null,
          tags:        [r.scientificName, r.genus, r.family, r.collectionCode, r.locality]
                         .filter(Boolean).map(t => t.toLowerCase()),
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('NHM London failed:', err.message);
    return [];
  }
}

// Wallace Collection London
export async function fetchWallaceCollection(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('wallace_collection', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'wallace_collection' }));
  return [];
}

// Fitzwilliam Museum Cambridge
export async function fetchFitzwilliam(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('fitzwilliam', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'fitzwilliam' }));
  return [];
}

// National Gallery London
export async function fetchNationalGalleryLondon(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('national_gallery_london', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'national_gallery_london' }));
  return [];
}

// Scottish National Gallery
export async function fetchScottishNational(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('scottish_national', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'scottish_national' }));
  return [];
}

// Musée d'Orsay (Paris) — Impressionist & Post-Impressionist masterworks
export async function fetchMuseeOrsay(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('musee_orsay', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'musee_orsay' }));
  return [];
}

// Van Gogh Museum (Amsterdam)
export async function fetchVanGoghMuseum(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('vangogh_museum', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'vangogh_museum' }));
  return [];
}

// Kunsthistorisches Museum Vienna
export async function fetchKHM(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('khm', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'khm' }));
  return [];
}

// Belvedere Museum Vienna
export async function fetchBelvedere(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('belvedere', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'belvedere' }));
  return [];
}

// Städel Museum Frankfurt
export async function fetchStaedel(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('staedel', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'staedel' }));
  return [];
}

// Royal Museums of Fine Arts of Belgium (Brussels)
export async function fetchRMFAB(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('rmfab', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'rmfab' }));
  return [];
}

// Musée Guimet Paris (Asian art)
export async function fetchGuimet(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('guimet', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'guimet' }));
  return [];
}

// National Palace Museum Taipei
export async function fetchNPMTaipei(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('npm_taipei', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'npm_taipei' }));
  return [];
}

// ── Fashion & Textile Sources (Phase F) ─────────────────────────────────

// Musée Galliera (Palais Galliera) — Paris couture museum
export async function fetchGalliera(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('galliera', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'galliera' }));
  return [];
}

// Musée des Arts Décoratifs — Paris fashion, design, decorative arts
export async function fetchArtsDecoratifs(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('arts_decoratifs', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'arts_decoratifs' }));
  return [];
}

// Centraal Museum Utrecht — Dutch costume, fashion, art
export async function fetchCentraalMuseum(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('centraal_museum', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'centraal_museum' }));
  return [];
}

// Textile Museum Tilburg — Dutch textile art & fashion
export async function fetchTextileMuseum(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('textile_museum_tilburg', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'textile_museum_tilburg' }));
  return [];
}

// Nationaal Museum van Wereldculturen — world cultures (textiles, costumes)
export async function fetchWereldculturen(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('wereldculturen', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'wereldculturen' }));
  return [];
}

// Museum of Decorative Arts Prague — applied art, textiles, glass, fashion
export async function fetchDecArtsPrague(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('dec_arts_prague', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'dec_arts_prague' }));
  return [];
}

// Designmuseum Danmark — Danish design, fashion, textiles
export async function fetchDesignmuseumDK(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('designmuseum_dk', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'designmuseum_dk' }));
  return [];
}

// Museum Boijmans Van Beuningen — Rotterdam; fashion, applied art
export async function fetchBoijmans(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('boijmans', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'boijmans' }));
  return [];
}

// Museu Nacional do Traje — Lisbon costume museum
export async function fetchMuseuTraje(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('museu_traje', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'museu_traje' }));
  return [];
}

// ── Phase G — Art, Sculpture & History CORS-blocked (14) ──────────────
export async function fetchKMSKA(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('kmska', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'kmska' }));
  return [];
}
export async function fetchAmsterdamMuseum(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('amsterdam_museum', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'amsterdam_museum' }));
  return [];
}
export async function fetchNGI(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('ngi', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'ngi' }));
  return [];
}
export async function fetchFriesMuseum(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('fries_museum', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'fries_museum' }));
  return [];
}
export async function fetchGroeninge(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('groeninge', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'groeninge' }));
  return [];
}
export async function fetchGroninger(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('groninger', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'groninger' }));
  return [];
}
export async function fetchMoMAWD(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('moma_wd', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'moma_wd' }));
  return [];
}
export async function fetchRijksmuseumTwenthe(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('rijksmuseum_twenthe', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'rijksmuseum_twenthe' }));
  return [];
}
export async function fetchHerzogAntonUlrich(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('herzog_anton_ulrich', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'herzog_anton_ulrich' }));
  return [];
}
export async function fetchGalleriaPalatina(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('galleria_palatina', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'galleria_palatina' }));
  return [];
}
export async function fetchLakenhal(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('lakenhal', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'lakenhal' }));
  return [];
}
export async function fetchTeylers(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('teylers', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'teylers' }));
  return [];
}
export async function fetchAltePinakothek(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('alte_pinakothek', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'alte_pinakothek' }));
  return [];
}
export async function fetchQuaiBranly(keyword, limit, signal, page = 1) {
  const cached = await fetchFromDataCache('quai_branly', keyword, (page - 1) * limit);
  if (cached) return cached.map(item => ({ ...item, source: 'quai_branly' }));
  return [];
}
// Phase H — 113 World Museum fetch functions (cache-first)
export const WD_PHASE_H_FETCHERS = {};
WD_PHASE_H.forEach(s => {
  WD_PHASE_H_FETCHERS[s.id] = async function(keyword, limit, signal, page = 1) {
    const cached = await fetchFromDataCache(s.id, keyword, (page - 1) * limit);
    if (cached) return cached.map(item => ({ ...item, source: s.id }));
    return [];
  };
});

export async function fetchAGO(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://www.ago.ca/api/collection/search?q=${encodeURIComponent(keyword)}&limit=${limit}&type=artwork`,
      { signal }, 'ago'
    );
    if (!res.ok) throw new Error('AGO failed');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || data.items || []);
    return items
      .filter(item => item.image || item.image_url || item.imageUrl)
      .map(item => ({
        id:          `ago_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image || item.image_url || item.imageUrl,
        thumb:       item.image || item.image_url || item.imageUrl,
        title:       item.title || 'AGO Object',
        description: item.artist || item.maker || '',
        year:        (item.date || item.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'ago',
        sourceUrl:   `https://www.ago.ca/collection`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchPEM(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://www.pem.org/api/collection/search?q=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
      { signal }, 'pem'
    );
    if (!res.ok) throw new Error('PEM failed');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || data.items || []);
    return items
      .filter(item => item.image || item.image_url || item.imageUrl)
      .map(item => ({
        id:          `pem_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image || item.image_url || item.imageUrl,
        thumb:       item.image || item.image_url || item.imageUrl,
        title:       item.title || 'PEM Object',
        description: item.artist || item.maker || '',
        year:        (item.date || item.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'pem',
        sourceUrl:   `https://www.pem.org/collections`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchNPG(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://www.npg.org.uk/api/search?query=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
      { signal }, 'npg'
    );
    if (!res.ok) throw new Error('NPG failed');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || data.items || []);
    return items
      .filter(item => item.image || item.primaryImage || item.imageUrl)
      .map(item => ({
        id:          `npg_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image || item.primaryImage || item.imageUrl,
        thumb:       item.image || item.primaryImage || item.imageUrl,
        title:       item.title || 'NPG Portrait',
        description: item.sitter || item.artist || '',
        year:        (item.date || item.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'npg',
        sourceUrl:   `https://www.npg.org.uk/collections`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

export async function fetchLouvreAD(keyword, limit, signal) {
  try {
    const res = await safeFetch(
      `https://www.louvreabudhabi.ae/api/collection/search?q=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('LouvreAD failed');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || data.items || []);
    return items
      .filter(item => item.image || item.image_url || item.imageUrl)
      .map(item => ({
        id:          `louvread_${String(item.id || '').replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.image || item.image_url || item.imageUrl,
        thumb:       item.image || item.image_url || item.imageUrl,
        title:       item.title || 'Louvre AD Object',
        description: item.artist || item.maker || '',
        year:        (item.date || item.dated || '').match(/\d{4}/)?.[0] || null,
        source:      'louvread',
        sourceUrl:   `https://www.louvreabudhabi.ae/en/collections`,
        tags: [], colors: [], aiTags: [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

/* ============================================================
   10z. PHASE 2 — NEW SOURCE FETCHERS
============================================================ */

/* Unsplash photography — free key required */
export async function fetchUnsplash(keyword, limit, signal, page = 1) {
  if (!STATE.unsplashKey) return [];
  try {
    const res = await safeFetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${Math.min(limit, 30)}&page=${page}&client_id=${STATE.unsplashKey}`,
      { signal }
    );
    if (!res.ok) throw new Error('Unsplash failed');
    const data = await res.json();
    return (data.results || [])
      .filter(p => p.urls?.regular)
      .map(p => ({
        id:          `unsplash_${p.id}`,
        url:         p.urls.regular,
        thumb:       p.urls.small || p.urls.regular,
        fullUrl:     p.urls.full || p.urls.regular,
        title:       p.description || p.alt_description || 'Unsplash Photo',
        description: p.user?.name ? `Photo by ${p.user.name}` : '',
        source:      'unsplash',
        sourceUrl:   p.links?.html || '',
        year:        p.created_at ? p.created_at.slice(0, 4) : null,
        tags:        (p.tags || []).map(t => (t.title || t.type || '')).filter(Boolean),
        colors:      [],
        aiTags:      [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Unsplash failed:', e.message);
    return [];
  }
}

/* Bodleian Libraries (Oxford) — IIIF-based search, no key */
export async function fetchBodleian(keyword, limit, signal) {
  try {
    const res = await sourceFetch(
      `https://digital.bodleian.ox.ac.uk/search/?q=${encodeURIComponent(keyword)}&format=json&limit=${limit}&start=0`,
      { signal, headers: { 'Accept': 'application/json' } },
      'bodleian'
    );
    if (!res.ok) throw new Error('Bodleian failed');
    const data = await res.json().catch(() => null);
    if (!data) return [];
    return (data.objects || [])
      .filter(obj => obj.thumbnail || obj.thumbnail_url)
      .map(obj => ({
        id:          `bodleian_${String(obj.pk || obj.id || Math.random()).replace(/[^a-z0-9]/gi, '_')}`,
        url:         obj.thumbnail || obj.thumbnail_url,
        thumb:       obj.thumbnail || obj.thumbnail_url,
        title:       obj.name || obj.label || obj.title || 'Bodleian Object',
        description: (obj.description || obj.subjects?.join(', ') || '').slice(0, 200),
        source:      'bodleian',
        sourceUrl:   obj.links?.self || `https://digital.bodleian.ox.ac.uk/objects/${obj.pk || obj.id}/`,
        year:        (String(obj.date || obj.year || '')).match(/\d{4}/)?.[0] || null,
        tags:        (obj.subjects || obj.topics || []).map(s => String(s).toLowerCase()),
        colors:      [],
        aiTags:      [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('Bodleian failed:', e.message);
    return [];
  }
}

/* Bayerische Staatsbibliothek / BSB Munich — no key, best-effort CORS */
export async function fetchBSB(keyword, limit, signal) {
  // API endpoint gone (404) as of 2026-04
  return [];
  try {
    const res = await safeFetch(
      `https://api.digitale-sammlungen.de/search/v1/json?q=${encodeURIComponent(keyword)}&size=${limit}&page=0`,
      { signal }
    );
    if (!res.ok) throw new Error('BSB failed');
    const data = await res.json();
    const items = data.hits?.items || data.results || [];
    return items
      .filter(item => item.thumbnail_url || item.image_url)
      .map(item => ({
        id:          `bsb_${String(item.id || Math.random()).replace(/[^a-z0-9]/gi, '_')}`,
        url:         item.thumbnail_url || item.image_url,
        thumb:       item.thumbnail_url || item.image_url,
        title:       item.title || item.name || 'BSB Object',
        description: item.subtitle || item.origin || '',
        source:      'bsb',
        sourceUrl:   item.link || `https://www.digitale-sammlungen.de/en/view/bsb${item.id}`,
        year:        String(item.year || item.date || '').match(/\d{4}/)?.[0] || null,
        tags:        [],
        colors:      [],
        aiTags:      [],
      }))
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('BSB failed:', e.message);
    return [];
  }
}

/* Cambridge Digital Library (CUDL) — no key, best-effort CORS */
export async function fetchCUDL(keyword, limit, signal) {
  // Try pre-fetched data cache first
  const cached = await fetchFromDataCache('cudl', keyword);
  if (cached) return cached;
  // Fall back to direct API (may fail due to CORS)
  try {
    const res = await safeFetch(
      `https://services.cudl.lib.cam.ac.uk/v1/search?query=${encodeURIComponent(keyword)}&start=1&end=${limit}`,
      { signal }
    );
    if (!res.ok) throw new Error('CUDL failed');
    const data = await res.json();
    const items = data.results?.items || data.items || [];
    return items
      .filter(item => item.thumbnailUrl || item.thumbnail)
      .map(item => {
        const thumb = item.thumbnailUrl || item.thumbnail || '';
        return {
          id:          `cudl_${String(item.fileID || item.id || Math.random()).replace(/[^a-z0-9]/gi, '_')}`,
          url:         thumb,
          thumb:       thumb,
          title:       item.title || (item.descriptiveMetadata?.[0]?.title?.['#text'] ?? 'CUDL Object'),
          description: '',
          source:      'cudl',
          sourceUrl:   `https://cudl.lib.cam.ac.uk/view/${item.fileID || item.id}`,
          year:        null,
          tags:        [],
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn('CUDL failed:', e.message);
    return [];
  }
}

/* Generic IIIF Content Search adapter — used by manifest-loaded sources */
export async function fetchIIIFCollection(config, keyword, limit, signal) {
  try {
    const qp = config.queryParam || 'q';
    // Support non-standard paging params from manifest extraParams.
    // If per_page exists, force it to the slider value and do not append &limit.
    let extraParams = config.extraParams || '';
    const hasPerPage = /(^|&)per_page=/.test(extraParams);
    if (hasPerPage) {
      extraParams = extraParams.replace(/(^|&)per_page=[^&]*/g, `$1per_page=${String(limit)}`);
    }
    if (extraParams.includes('{limit}')) {
      extraParams = extraParams.replace(/\{limit\}/g, String(limit));
    }
    const extra = extraParams ? `&${extraParams}` : '';
    const limitParam = hasPerPage ? '' : `&limit=${limit}`;
    const url = `${config.endpoint}?${qp}=${encodeURIComponent(keyword)}${limitParam}${extra}`;
    const res = await safeFetch(url, { signal });
    // museum-digital returns 404 with a JSON body when a query has zero results.
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`IIIF ${config.id} failed`);
    const data = await res.json().catch(() => null);
    if (!data) return [];

    // Walk resultsPath (dot-notation) to get items array.
    // Use '$' as resultsPath to indicate the root response is already the array.
    let items = data;
    const rp = config.resultsPath;
    if (rp !== '$') {
      for (const key of (rp || 'resources').split('.')) {
        items = items?.[key];
        if (!items) break;
      }
    }
    if (!Array.isArray(items)) return [];

    const getField = (obj, path) => {
      let v = obj;
      for (const k of path.split('.')) { v = v?.[k]; if (v == null) break; }
      return v;
    };

    return items
      .filter(item => getField(item, config.imageField || 'thumbnail'))
      .map((item, i) => {
        const rawImg = getField(item, config.imageField || 'thumbnail') || '';
        // 1. imageBaseUrl: prefix relative verbatim paths
        let imgUrl = (config.imageBaseUrl && rawImg && !rawImg.startsWith('http'))
          ? config.imageBaseUrl + rawImg
          : rawImg;
        // 2. imageUrlTemplate: construct URL from a non-URL ID field value.
        //    Fires when template is configured AND the value is non-empty but not yet an absolute URL.
        //    This handles sources like DigitalCommonwealth where imageField returns an ID, not a URL.
        if (config.imageUrlTemplate && rawImg && !imgUrl.startsWith('http')) {
          imgUrl = config.imageUrlTemplate.replace('{id}', rawImg);
          // Apply imageBaseUrl to template result too, if still relative
          if (config.imageBaseUrl && imgUrl && !imgUrl.startsWith('http')) {
            imgUrl = config.imageBaseUrl + imgUrl;
          }
        }
        const rawThumb = getField(item, config.thumbField || config.imageField || 'thumbnail') || rawImg;
        let thumbUrl = (config.imageBaseUrl && rawThumb && !rawThumb.startsWith('http'))
          ? config.imageBaseUrl + rawThumb
          : rawThumb;
        // Apply template to thumb too if not yet a URL
        if (config.imageUrlTemplate && rawThumb && !thumbUrl.startsWith('http')) {
          thumbUrl = config.imageUrlTemplate.replace('{id}', rawThumb);
          if (config.imageBaseUrl && thumbUrl && !thumbUrl.startsWith('http')) {
            thumbUrl = config.imageBaseUrl + thumbUrl;
          }
        }
        thumbUrl = thumbUrl || imgUrl;
        return {
          id:          `${config.id}_${i}_${String(getField(item, '@id') || i).replace(/[^a-z0-9]/gi, '_').slice(-20)}`,
          url:         String(imgUrl),
          thumb:       String(thumbUrl),
          title:       String(getField(item, config.titleField || 'label') || 'Untitled'),
          description: String(getField(item, config.descField || '') || ''),
          source:      config.id,
          sourceUrl:   String(getField(item, config.sourceUrlField || '@id') || ''),
          year:        null,
          tags:        [],
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn(`IIIF ${config.id} failed:`, e.message);
    return [];
  }
}

/* IIIF Content Search v1 adapter — handles @context-based IIIF Search responses */
export async function fetchIIIFSearch(config, keyword, limit, signal) {
  try {
    const qp = config.queryParam || 'q';
    const url = `${config.endpoint}?${qp}=${encodeURIComponent(keyword)}&limit=${limit}`;
    const res = await safeFetch(url, { signal });
    if (!res.ok) throw new Error(`IIIF Search ${config.id} failed: ${res.status}`);
    const data = await res.json();

    // IIIF Content Search v1 format: { @context, @type: "sc:AnnotationList", resources: [...] }
    // IIIF Content Search v2 format: { @context, type: "AnnotationPage", items: [...] }
    let items = data.resources || data.items || [];
    if (!Array.isArray(items)) return [];

    const getField = (obj, path) => {
      if (!path || !obj) return undefined;
      let v = obj;
      for (const k of path.split('.')) { v = v?.[k]; if (v == null) break; }
      return v;
    };

    return items
      .filter(item => {
        // v1 format: check resource['@id']; v2 format: check body or resource
        const imgUrl = item.resource?.['@id'] || item.body?.['@id'] || item['@id'];
        return imgUrl && (imgUrl.includes('image') || imgUrl.includes('iiif') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.png'));
      })
      .map((item, i) => {
        // Extract image URL (v1: resource['@id'], v2: body['@id'])
        const imgUrl = item.resource?.['@id'] || item.body?.['@id'] || item['@id'] || '';
        
        // Extract title from label, chars, or annotation
        const title = item.resource?.label || item.body?.label || item.label || 
                     (item.chars && item.chars.substring(0, 100)) || 'IIIF Search Result';
        
        // Extract canvas URL (source reference)
        const sourceUrl = item.on || item.target?.['@id'] || '';
        
        // Extract description if available
        const description = item.description || item.body?.value || '';

        return {
          id:          `${config.id}_${i}_${String(sourceUrl).replace(/[^a-z0-9]/gi, '_').slice(-20)}`,
          url:         String(imgUrl),
          thumb:       String(imgUrl), // IIIF typically provides good thumbnails
          title:       String(title),
          description: String(description),
          source:      config.id,
          sourceUrl:   String(sourceUrl),
          year:        null,
          tags:        [],
          colors:      [],
          aiTags:      [],
        };
      })
      .filter(isLikelyReal)
      .slice(0, limit);
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.warn(`IIIF Search ${config.id} failed:`, e.message);
    return [];
  }
}

/* ============================================================
   11. INTERLEAVE & SHUFFLE
============================================================ */
/* interleave() and shuffle() moved to core.js */

/* ── Populate ADAPTERS (imported from state.js) to break circular import ── */
ADAPTERS.europeana_provider  = (cfg, kw, lim, sig) => fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, kw, lim, sig, cfg.extra || '');
ADAPTERS.dpla_hub            = (cfg, kw, lim, sig) => fetchDPLAProvider(cfg.provider, kw, lim, sig);
ADAPTERS.smithsonian_unit    = (cfg, kw, lim, sig) => fetchSmithsonianUnit(cfg.code, kw, lim, sig);
ADAPTERS.iiif_collection     = (cfg, kw, lim, sig) => fetchIIIFCollection(cfg, kw, lim, sig);
ADAPTERS.iiif_content_search = (cfg, kw, lim, sig) => fetchIIIFSearch(cfg, kw, lim, sig);

/* ============================================================
   12. FETCH ORCHESTRATION
============================================================ */
