/**
 * InspoSearch Public REST API — Cloudflare Worker
 *
 * Endpoints:
 *   GET  /search?q=<query>&limit=<n>     — Search across sources
 *   GET  /sources                         — List available sources
 *   GET  /random?count=<n>               — Random items
 *   GET  /health                          — Health check
 *   GET  /semantic?q=<query>             — AI semantic concept expansion (Workers AI)
 *   POST /caption                         — Caption an image URL (Workers AI vision)
 *   POST /board                           — Save a board to KV (returns {id})
 *   GET  /board/:id                       — Retrieve a board from KV
 *
 * Rate limit: 60 requests per minute per IP (in-memory, per-isolate).
 * KV board TTL: 30 days.
 */

// ── Rate limiting — tiered by endpoint cost ───────────────────────────────
// A single InspoSearch query fans out to 120–200 source calls, a large share
// of which land on /proxy. The old flat 60/min budget was therefore consumed
// by ONE search, and every subsequent search inside that minute got 429s.
// Sources then looked empty, tripped the health tracker, and got paused —
// which is what made result quality visibly decay the more a user searched.
//
// Budgets are sized to the work each endpoint actually does:
//   proxy   — read-only upstream fan-out, ~200/search → 1200/min ≈ 6 searches
//   read    — cheap JSON/edge reads (/health, /sources, /search, /random)
//   ai      — Workers AI inference, costs real compute
//   write   — KV writes (/board, /contribute), the only durable side effects
const RATE_WINDOW = 60_000;
const RATE_LIMITS = {
  proxy: 1200,
  read:   600,
  ai:      60,
  write:   30,
};
const RATE_TIER_BY_PATH = {
  '/proxy':      'proxy',
  '/caption':    'ai',
  '/semantic':   'ai',
  '/tags':       'ai',
  '/board':      'write',
  '/contribute': 'write',
};
const rateBuckets = new Map();

export function rateTierFor(path) {
  return RATE_TIER_BY_PATH[path] || 'read';
}

// Buckets are per-isolate and short-lived, but Cloudflare recycles isolates
// often enough that a stale-entry sweep keeps the Map from growing unbounded.
function sweepRateBuckets(now) {
  if (rateBuckets.size < 5000) return;
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.start > RATE_WINDOW) rateBuckets.delete(key);
  }
}

function checkRateLimit(ip, tier) {
  const now = Date.now();
  sweepRateBuckets(now);
  const key = tier + '|' + ip;
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > RATE_WINDOW) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count++;
  const limit = RATE_LIMITS[tier] ?? RATE_LIMITS.read;
  return { ok: bucket.count <= limit, limit, retryAfter: Math.max(1, Math.ceil((RATE_WINDOW - (now - bucket.start)) / 1000)) };
}

// Reflect a request's Origin if it matches our allowlist; fall back to '*' for
// server-to-server / CLI callers. Keeping the client-visible ACAO dynamic lets
// the site work from insposearch.org, insposearch.pages.dev, and localhost.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/insposearch\.org$/,
  /^https:\/\/([a-z0-9-]+\.)*insposearch\.pages\.dev$/,
  /^https:\/\/insposearch\.official-ndsclsd\.workers\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function resolveAllowedOrigin(request, env) {
  const origin = request?.headers?.get?.('Origin') || '';
  if (origin && ALLOWED_ORIGIN_PATTERNS.some(rx => rx.test(origin))) return origin;
  // Legacy env var fallback
  if (env?.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) return origin;
  return '*';
}

function corsHeaders(env, request) {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(request, env),
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(data, status, env, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(env, request),
  });
}

// ── Safe upstream fetching — prevents WAF/HTML errors from crashing .json() ──
const UA = 'InspoSearch/1.1 (+https://insposearch.pages.dev)';
const UPSTREAM_TIMEOUT = 12_000;

function fetchUA(url) {
  return fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cf: { cacheTtl: 60 },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
  });
}

function safeJson(promise) {
  return promise
    .then(async r => {
      if (!r.ok) return null;
      if (!(r.headers.get('content-type') || '').includes('application/json')) return null;
      return r.json().catch(() => null);
    })
    .catch(() => null);
}

// Minimal source list (mirrors sources.manifest.json structure)
const SOURCES_URL = 'https://insposearch.pages.dev/sources.manifest.json';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, env, request);
    }

    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Rate limiting — per-tier, so a search's /proxy fan-out can't exhaust the
    // budget for cheap reads (or vice versa). See RATE_LIMITS above.
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const tier = rateTierFor(path);
    const rate = checkRateLimit(ip, tier);
    if (!rate.ok) {
      const res = json(
        { error: `Rate limit exceeded. Max ${rate.limit} requests/min for ${tier} endpoints.` },
        429, env, request,
      );
      // Let clients back off for the right amount of time instead of guessing.
      res.headers.set('Retry-After', String(rate.retryAfter));
      return res;
    }

    switch (path) {
      case '/health':
        return json({ status: 'ok', timestamp: new Date().toISOString() }, 200, env);

      case '/sources':
        return handleSources(env);

      case '/search':
        return handleSearch(url, env);

      case '/proxy':
        return handleProxy(url, request, env);

      case '/keys':
        return handleKeys(env, request);

      case '/random':
        return handleRandom(url, env);

      case '/semantic':
        return handleSemantic(url, env);

      case '/caption':
        return handleCaption(request, env);

      case '/tags':
        return handleTags(request, env);

      case '/contribute':
        return handleContribute(request, env);

      case '/board':
        if (request.method === 'POST') return handleBoardSave(request, env);
        return json({ error: 'POST to /board to save a board' }, 405, env);

      default:
        // Match /board/:id
        if (/^\/board\/[a-zA-Z0-9_-]{6,32}$/.test(path)) {
          return handleBoardGet(path.slice(7), env);
        }
        return json({
          name: 'InspoSearch API',
          version: '1.1.0',
          endpoints: [
            '/search?q=...&limit=24',
            '/sources',
            '/random?count=6',
            '/health',
            '/proxy?url=<encoded-api-url>',
            '/semantic?q=...',
            'POST /caption  { "url": "..." }',
            'POST /tags     { "url": "...", "query": "..." }',
            'POST /contribute { "image_url": "...", "tags": [...], "consent_token": "..." }',
            'POST /board    { "items": [...], "query": "..." }',
            '/board/:id',
          ],
          docs: 'https://insposearch.pages.dev/api/docs.html',
        }, 200, env);
    }
  },
};

async function handleSources(env) {
  try {
    const res = await fetch(SOURCES_URL);
    const manifest = await res.json();
    const sources = manifest.sources.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      region: s.region,
      access: s.access,
      imageCount: s.imageCount || null,
    }));
    return json({ count: sources.length, sources }, 200, env);
  } catch {
    return json({ error: 'Failed to load sources' }, 502, env);
  }
}

async function handleSearch(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing required parameter: q' }, 400, env);

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 24, 1), 100);
  const perSource = Math.ceil(limit / 4);

  // Fan out to multiple CORS-friendly sources in parallel
  const [chicagoRes, metRes, clevelandRes, harvardRes, rijksRes, flickrRes] = await Promise.allSettled([
    // Art Institute of Chicago
    safeJson(fetchUA(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&limit=${perSource}&fields=id,title,image_id,artist_display,date_display,medium_display,subject_titles`))
      .then(data => (data?.data || []).filter(obj => obj.image_id).map(obj => ({
        id: `artic_${obj.id}`,
        title: obj.title || 'Untitled',
        artist: obj.artist_display || '',
        date: obj.date_display || '',
        medium: obj.medium_display || '',
        tags: obj.subject_titles || [],
        thumbnail: `https://www.artic.edu/iiif/2/${obj.image_id}/full/400,/0/default.jpg`,
        image: `https://www.artic.edu/iiif/2/${obj.image_id}/full/max/0/default.jpg`,
        source: 'Art Institute of Chicago',
        sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
      }))),
    // Met Museum — search IDs then fetch details
    safeJson(fetchUA(`https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(q)}&hasImages=true`))
      .then(async data => {
        const ids = (data?.objectIDs || []).slice(0, perSource);
        if (!ids.length) return [];
        const details = await Promise.allSettled(
          ids.map(id => safeJson(fetchUA(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)))
        );
        return details
          .filter(r => r.status === 'fulfilled' && r.value?.primaryImageSmall)
          .map(r => r.value)
          .map(obj => ({
            id: `met_${obj.objectID}`,
            title: obj.title || 'Untitled',
            artist: obj.artistDisplayName || '',
            date: obj.objectDate || '',
            medium: obj.medium || '',
            tags: (obj.tags || []).map(t => t.term),
            thumbnail: obj.primaryImageSmall,
            image: obj.primaryImage || obj.primaryImageSmall,
            source: 'The Met Museum',
            sourceUrl: obj.objectURL || '',
          }));
      }),
    // Cleveland Museum of Art
    safeJson(fetchUA(`https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(q)}&has_image=1&limit=${perSource}`))
      .then(data => (data?.data || []).filter(obj => obj.images?.web?.url).map(obj => ({
        id: `cle_${obj.id}`,
        title: obj.title || 'Untitled',
        artist: obj.creators?.[0]?.description || '',
        date: obj.creation_date || '',
        medium: obj.technique || '',
        tags: [],
        thumbnail: obj.images.web.url,
        image: obj.images.print?.url || obj.images.web.url,
        source: 'Cleveland Museum of Art',
        sourceUrl: obj.url || `https://www.clevelandart.org/art/${obj.id}`,
      }))),
    // Harvard Art Museums
    env.HARVARD_KEY
      ? safeJson(fetchUA(`https://api.harvardartmuseums.org/object?q=${encodeURIComponent(q)}&hasimage=1&size=${perSource}&apikey=${env.HARVARD_KEY}`))
          .then(data => (data?.records || []).filter(obj => obj.primaryimageurl).map(obj => ({
            id: `harvard_${obj.id}`,
            title: obj.title || 'Untitled',
            artist: obj.people?.[0]?.name || '',
            date: obj.dated || '',
            medium: obj.medium || '',
            tags: [],
            thumbnail: obj.primaryimageurl + '?width=400',
            image: obj.primaryimageurl,
            source: 'Harvard Art Museums',
            sourceUrl: obj.url || '',
          })))
      : Promise.resolve([]),
    // Rijksmuseum (keyless public API)
    safeJson(fetchUA(`https://www.rijksmuseum.nl/api/en/collection?key=0fiuZFh4&ps=${perSource}&q=${encodeURIComponent(q)}&imgonly=True`))
      .then(data => (data?.artObjects || []).filter(obj => obj.webImage?.url).map(obj => ({
        id: `rijks_${obj.objectNumber}`,
        title: obj.title || 'Untitled',
        artist: obj.principalOrFirstMaker || '',
        date: obj.longTitle || '',
        tags: [],
        thumbnail: obj.webImage.url.replace('=s0', '=s400'),
        image: obj.webImage.url,
        source: 'Rijksmuseum',
        sourceUrl: obj.links?.web || `https://www.rijksmuseum.nl/en/collection/${obj.objectNumber}`,
      }))),
    // Flickr Commons (keyless)
    safeJson(fetchUA(`https://www.flickr.com/services/rest/?method=flickr.photos.search&is_commons=1&text=${encodeURIComponent(q)}&per_page=${perSource}&format=json&nojsoncallback=1`))
      .then(data => (data?.photos?.photo || []).map(p => ({
        id: `flickr_${p.id}`,
        title: p.title || 'Untitled',
        artist: '',
        tags: [],
        thumbnail: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_z.jpg`,
        image: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
        source: 'Flickr Commons',
        sourceUrl: `https://www.flickr.com/photos/${p.owner}/${p.id}`,
      }))),
  ]);

  const results = [
    ...(chicagoRes.status === 'fulfilled' ? chicagoRes.value || [] : []),
    ...(metRes.status === 'fulfilled' ? metRes.value || [] : []),
    ...(clevelandRes.status === 'fulfilled' ? clevelandRes.value || [] : []),
    ...(harvardRes.status === 'fulfilled' ? harvardRes.value || [] : []),
    ...(rijksRes.status === 'fulfilled' ? rijksRes.value || [] : []),
    ...(flickrRes.status === 'fulfilled' ? flickrRes.value || [] : []),
  ];

  return json({
    query: q,
    count: results.length,
    sources: ['Art Institute of Chicago', 'The Met Museum', 'Cleveland Museum of Art', 'Harvard Art Museums', 'Rijksmuseum', 'Flickr Commons'],
    results: results.slice(0, limit),
  }, 200, env);
}

async function handleRandom(url, env) {
  const count = Math.min(Math.max(parseInt(url.searchParams.get('count')) || 6, 1), 24);
  const randomTerms = ['landscape', 'portrait', 'still life', 'botanical', 'architecture',
    'sculpture', 'textile', 'manuscript', 'ceramic', 'mythology'];
  const term = randomTerms[Math.floor(Math.random() * randomTerms.length)];
  const perSource = Math.ceil(count / 3);

  try {
    const [articRes, clevelandRes, rijksRes] = await Promise.allSettled([
      safeJson(fetchUA(
        `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(term)}&limit=${perSource}&fields=id,title,image_id,artist_display,date_display`
      )).then(data => (data?.data || []).filter(obj => obj.image_id).map(obj => ({
        id: `artic_${obj.id}`,
        title: obj.title || 'Untitled',
        artist: obj.artist_display || '',
        date: obj.date_display || '',
        thumbnail: `https://www.artic.edu/iiif/2/${obj.image_id}/full/400,/0/default.jpg`,
        source: 'Art Institute of Chicago',
        sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
      }))),
      safeJson(fetchUA(
        `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(term)}&has_image=1&limit=${perSource}`
      )).then(data => (data?.data || []).filter(obj => obj.images?.web?.url).map(obj => ({
        id: `cle_${obj.id}`,
        title: obj.title || 'Untitled',
        artist: obj.creators?.[0]?.description || '',
        date: obj.creation_date || '',
        thumbnail: obj.images.web.url,
        source: 'Cleveland Museum of Art',
        sourceUrl: obj.url || `https://www.clevelandart.org/art/${obj.id}`,
      }))),
      safeJson(fetchUA(
        `https://www.rijksmuseum.nl/api/en/collection?key=0fiuZFh4&ps=${perSource}&q=${encodeURIComponent(term)}&imgonly=True`
      )).then(data => (data?.artObjects || []).filter(obj => obj.webImage?.url).map(obj => ({
        id: `rijks_${obj.objectNumber}`,
        title: obj.title || 'Untitled',
        artist: obj.principalOrFirstMaker || '',
        thumbnail: obj.webImage.url.replace('=s0', '=s400'),
        source: 'Rijksmuseum',
        sourceUrl: obj.links?.web || `https://www.rijksmuseum.nl/en/collection/${obj.objectNumber}`,
      }))),
    ]);
    const results = [
      ...(articRes.status === 'fulfilled' ? articRes.value || [] : []),
      ...(clevelandRes.status === 'fulfilled' ? clevelandRes.value || [] : []),
      ...(rijksRes.status === 'fulfilled' ? rijksRes.value || [] : []),
    ].slice(0, count);
    return json({ term, count: results.length, results }, 200, env);
  } catch {
    return json({ error: 'Failed to fetch random items' }, 502, env);
  }
}

// ── /semantic — AI query concept expansion ────────────────────────────────
// Uses Workers AI llama to expand a query into 8 related visual concepts.
// Falls back to Datamuse if AI binding unavailable.
async function handleSemantic(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing required parameter: q' }, 400, env);

  // Try Workers AI first (requires [ai] binding in wrangler.toml)
  if (env.AI) {
    try {
      const prompt = `You are a visual search assistant. Given the search query "${q}", list exactly 8 closely related visual concepts, one per line, no numbering, no punctuation, all lowercase. Focus on what someone would visually search for.`;
      const response = await env.AI.run('@cf/meta/llama-3.2-1b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
      });
      const text = (response.response || '').trim();
      const concepts = text
        .split('\n')
        .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim().toLowerCase())
        .filter(s => s.length > 1 && s.length < 50)
        .slice(0, 8);
      if (concepts.length >= 3) {
        return json({ query: q, concepts, source: 'workers-ai' }, 200, env);
      }
    } catch { /* fall through to Datamuse */ }
  }

  // Datamuse fallback — related topics + means-like
  try {
    const [trg, ml] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(q)}&max=5`).then(r => r.json()),
      fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=5`).then(r => r.json()),
    ]);
    const concepts = [
      ...(trg.status === 'fulfilled' ? trg.value : []),
      ...(ml.status  === 'fulfilled' ? ml.value  : []),
    ].map(w => w.word).filter(Boolean).slice(0, 8);
    return json({ query: q, concepts, source: 'datamuse' }, 200, env);
  } catch {
    return json({ error: 'Semantic expansion failed' }, 502, env);
  }
}

// ── /caption — Workers AI image captioning ────────────────────────────────
// Accepts POST { "url": "https://..." }
// Fetches the image bytes, runs @cf/uform/uform-gen2-qwen-500m, returns caption.
async function handleCaption(request, env) {
  if (!env.AI) return json({ error: 'AI binding not configured' }, 503, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  const imgUrl = (body.url || '').trim();
  if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) {
    return json({ error: 'Missing or invalid "url" field' }, 400, env);
  }

  try {
    // Fetch image bytes (Workers can do this for same-network origins)
    const imgResp = await fetch(imgUrl, {
      headers: { 'User-Agent': 'InspoSearch/1.1' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!imgResp.ok) return json({ error: 'Failed to fetch image' }, 502, env);
    const contentType = imgResp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return json({ error: 'URL does not point to an image' }, 400, env);
    const bytes = await imgResp.arrayBuffer();

    const response = await env.AI.run('@cf/uform/uform-gen2-qwen-500m', {
      image: [...new Uint8Array(bytes)],
      prompt: 'Describe this artwork or image in detail. Focus on subject matter, style, medium, and mood.',
      max_tokens: 150,
    });
    const caption = (response.description || '').trim();
    if (!caption) return json({ error: 'Model returned empty caption' }, 502, env);
    return json({ caption, model: '@cf/uform/uform-gen2-qwen-500m' }, 200, env);
  } catch (e) {
    return json({ error: 'Caption generation failed', detail: e.message }, 502, env);
  }
}

// ── /tags — Workers AI structured tag extraction ──────────────────────────
// Accepts POST { url, query? }
// Fetches image bytes, runs vision model with a tag-extraction prompt, returns
// { tags: [...], description, model }. Primary vision entry point for
// InspoSearch's free default AI tier.
const TAGS_MODEL = '@cf/llava-hf/llava-1.5-7b-hf';
const TAGS_FALLBACK_MODEL = '@cf/unum/uform-gen2-qwen-500m';

async function handleTags(request, env) {
  if (!env.AI) return json({ error: 'AI binding not configured' }, 503, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  const imgUrl = (body.url || '').trim();
  const query  = (body.query || '').toString().slice(0, 120);
  if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) {
    return json({ error: 'Missing or invalid "url" field' }, 400, env);
  }

  const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

  try {
    let imgResp = await fetch(imgUrl, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept': 'image/*,*/*;q=0.8', 'Referer': new URL(imgUrl).origin + '/' },
      cf: { cacheTtl: 600, cacheEverything: true },
    });
    if (!imgResp.ok) {
      imgResp = await fetch(imgUrl, { headers: { 'User-Agent': BROWSER_UA } });
    }
    if (!imgResp.ok) return json({ error: 'Failed to fetch image', status: imgResp.status }, 502, env);
    const contentType = imgResp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return json({ error: 'URL does not point to an image', contentType }, 400, env);
    const bytes = new Uint8Array(await imgResp.arrayBuffer());

    const prompt = `Return exactly 8 visual/conceptual tags for this image as a JSON array of lowercase strings. Cover mood, color-palette name, era/movement, style, medium, subject, composition, texture. ${query ? 'Search context: "' + query + '". ' : ''}Reply with ONLY the JSON array, no prose.`;

    let text = '';
    let modelUsed = TAGS_MODEL;
    let primaryError = null;
    try {
      const r = await env.AI.run(TAGS_MODEL, {
        image: [...bytes],
        prompt,
        max_tokens: 256,
      });
      text = (r.description || r.response || '').trim();
      if (!text) throw new Error('empty response from primary model');
    } catch (err) {
      primaryError = err.message || String(err);
      modelUsed = TAGS_FALLBACK_MODEL;
      const r = await env.AI.run(TAGS_FALLBACK_MODEL, {
        image: [...bytes],
        prompt,
        max_tokens: 256,
      });
      text = (r.description || r.response || '').trim();
    }

    let tags = [];
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      try { tags = JSON.parse(match[0]); } catch { /* fall through */ }
    }
    if (!Array.isArray(tags) || !tags.length) {
      tags = text
        .split(/[\n,]/)
        .map(s => s.replace(/^[-*•\d.)"\s]+|["\s]+$/g, '').toLowerCase())
        .filter(s => s.length > 1 && s.length < 40)
        .slice(0, 8);
    }
    tags = tags.filter(t => typeof t === 'string').map(t => t.toLowerCase().trim()).filter(Boolean);
    tags = [...new Set(tags)].slice(0, 8);
    if (!tags.length) return json({ error: 'Model returned no parseable tags', raw: text }, 502, env);

    return json({ tags, description: text, model: modelUsed, primaryError }, 200, env);
  } catch (e) {
    return json({ error: 'Tag generation failed', detail: e.message }, 502, env);
  }
}

// ── /contribute — opt-in community metadata contribution ──────────────────
// Accepts POST { image_url, source_id?, tags: [...], query?, consent_token, model? }
// Stage 1 stub: validates payload shape and returns { ok: true, stored: false }.
// Real D1 persistence plugs in at Stage 2 per INSPOENRICH_ROADMAP.md.
async function handleContribute(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  const imageUrl = String(body.image_url || '').trim();
  const tags     = Array.isArray(body.tags) ? body.tags : null;
  const token    = String(body.consent_token || '').trim();

  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return json({ error: 'Missing or invalid "image_url"' }, 400, env);
  }
  if (!tags || !tags.length || tags.length > 32) {
    return json({ error: '"tags" must be a non-empty array (max 32)' }, 400, env);
  }
  if (!token || token.length < 8 || token.length > 128) {
    return json({ error: 'Missing or invalid "consent_token"' }, 400, env);
  }

  const payload = {
    image_url:     imageUrl.slice(0, 500),
    source_id:     String(body.source_id || '').slice(0, 60),
    tags:          tags.filter(t => typeof t === 'string').map(t => t.slice(0, 60)).slice(0, 32),
    query:         String(body.query || '').slice(0, 200),
    model:         String(body.model || '').slice(0, 80),
    consent_token: token.slice(0, 128),
    received_at:   new Date().toISOString(),
  };

  // Stage 2: persist to D1 (`contributed_metadata` table) here.
  if (env.METADATA_DB) {
    try {
      await env.METADATA_DB.prepare(
        `INSERT INTO contributed_metadata (image_url, source_id, tags, query, model, consent_token, received_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      ).bind(
        payload.image_url, payload.source_id,
        JSON.stringify(payload.tags), payload.query, payload.model,
        payload.consent_token, payload.received_at
      ).run();
      return json({ ok: true, stored: true, stage: 'd1' }, 200, env);
    } catch (e) {
      return json({ ok: false, stored: false, stage: 'd1-error', detail: e.message }, 500, env);
    }
  }

  return json({ ok: true, stored: false, stage: 'stub-d1-pending' }, 202, env);
}

// ── /board POST — save board to KV ───────────────────────────────────────
// Body: { items: [...], query?: string }
// Returns: { id: "abc123", url: "https://insposearch.pages.dev/?share=abc123" }
const BOARD_KV_TTL = 60 * 60 * 24 * 30; // 30 days
const SHARE_ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomId(len = 8) {
  let id = '';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (const b of arr) id += SHARE_ID_CHARS[b % SHARE_ID_CHARS.length];
  return id;
}

async function handleBoardSave(request, env) {
  if (!env.BOARDS) return json({ error: 'KV storage not configured' }, 503, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, env); }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: '"items" must be a non-empty array' }, 400, env);
  }
  if (items.length > 200) return json({ error: 'Board too large (max 200 items)' }, 400, env);

  // Sanitise items — keep only safe fields
  const safe = items.map(it => ({
    i: String(it.i || it.id || '').slice(0, 200),
    t: String(it.t || it.thumb || '').slice(0, 500),
    n: String(it.n || it.title || '').slice(0, 300),
    s: String(it.s || it.source || '').slice(0, 100),
    u: String(it.u || it.sourceUrl || '').slice(0, 500),
    y: String(it.y || it.year || '').slice(0, 10),
  }));

  const payload = {
    items: safe,
    query: String(body.query || '').slice(0, 200),
    savedAt: new Date().toISOString(),
  };

  const id = randomId(8);
  await env.BOARDS.put(id, JSON.stringify(payload), { expirationTtl: BOARD_KV_TTL });

  const origin = env.ALLOWED_ORIGIN || 'https://insposearch.pages.dev';
  return json({ id, url: `${origin}/?share=${id}` }, 201, env);
}

// ── /board/:id GET — retrieve board from KV ───────────────────────────────
async function handleBoardGet(id, env) {
  if (!env.BOARDS) return json({ error: 'KV storage not configured' }, 503, env);
  if (!/^[a-zA-Z0-9_-]{6,32}$/.test(id)) return json({ error: 'Invalid board id' }, 400, env);

  const raw = await env.BOARDS.get(id);
  if (!raw) return json({ error: 'Board not found or expired' }, 404, env);

  try {
    const data = JSON.parse(raw);
    return json(data, 200, env);
  } catch {
    return json({ error: 'Board data corrupted' }, 500, env);
  }
}

// ── /proxy — CORS API proxy ───────────────────────────────────────────────
// Forwards GET requests to museum/library APIs that don't return CORS headers.
//
// Access model: the destination host must appear in PROXY_ALLOWED_DOMAINS
// (exact match) or under PROXY_ALLOWED_SUFFIXES (institution domain + any of
// its subdomains). Origin is NOT part of this decision — an Origin header is
// attacker-controlled outside a browser, so trusting it turned this endpoint
// into an open proxy that would fetch any public URL on our account's bill.
//
// Suffix matching is what keeps the list maintainable: a museum that moves
// from `api.example.org` to `iiif.example.org` keeps working without a code
// change, while the internet at large stays out.
//
// SSRF protection: private/loopback/link-local hosts and non-standard ports
// are always rejected, independent of the allowlist.
const PROXY_ALLOWED_DOMAINS = new Set([
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
  'www.artic.edu',
  'api.artic.edu',
  'openaccess-api.clevelandart.org',
  'api.si.edu',
  'imageapi.khm.at',
  // Added 2026-04-21 sweep.
  'www.pem.org',
  'mna.inah.gob.mx',
  'www.munchmuseet.no',
  'digital.bodleian.ox.ac.uk',
  'search.artsmia.org',
  // Added 2026-04-22 sweep — 5 sources silent due to missing allowlist.
  'collection.cooperhewitt.org',
  'collections.tepapa.govt.nz',
  'api.aucklandmuseum.com',
  // Removed 2026-08-02: api.collection.carnegieart.org, api.mnw.art.pl and
  // collections.folger.edu no longer resolve (NXDOMAIN). See RETIRED_SOURCES
  // in src/state.js.
]);

// ── Server-held API keys ──────────────────────────────────────────────────
// The 8 highest-inventory sources (Europeana, Harvard, DPLA, Smithsonian,
// Trove, Pexels, Pixabay, Unsplash) are key-gated. Historically the key came
// from the visitor's own localStorage, so these sources were dark for the
// ~100% of visitors who never registered for one.
//
// Instead, the client embeds the sentinel below where a key would go and
// routes the request through /proxy; the worker swaps in the real secret,
// chosen by destination host, so the key is never exposed to the browser.
//
// Each entry is inert until its secret exists:  wrangler secret put <NAME>
const KEY_SENTINEL = '__INSPO_SERVER_KEY__';
const SERVER_KEY_HOSTS = [
  { suffix: 'europeana.eu',        secret: 'EUROPEANA_KEY' },
  { suffix: 'harvardartmuseums.org', secret: 'HARVARD_KEY' },
  { suffix: 'dp.la',               secret: 'DPLA_KEY' },
  { suffix: 'si.edu',              secret: 'SMITHSONIAN_KEY' },
  { suffix: 'nla.gov.au',          secret: 'TROVE_KEY' },
  { suffix: 'pexels.com',          secret: 'PEXELS_KEY' },
  { suffix: 'pixabay.com',         secret: 'PIXABAY_KEY' },
  { suffix: 'unsplash.com',        secret: 'UNSPLASH_KEY' },
];

export function serverKeyForHost(hostname) {
  const h = (hostname || '').toLowerCase();
  const hit = SERVER_KEY_HOSTS.find(k => h === k.suffix || h.endsWith('.' + k.suffix));
  return hit ? hit.secret : null;
}

// Which keys this deployment can actually supply. The client calls /keys on
// boot and enables exactly these sources — so adding a secret switches a
// source on for every visitor with no client release.
export function availableServerKeys(env) {
  return SERVER_KEY_HOSTS
    .filter(k => typeof env?.[k.secret] === 'string' && env[k.secret].length > 0)
    .map(k => k.secret);
}

function handleKeys(env, request) {
  return json({ keys: availableServerKeys(env), sentinel: KEY_SENTINEL }, 200, env, request);
}

// Institution domains — any subdomain is proxyable. This is what replaced
// blanket Origin-trust: it covers `api.`, `iiif.`, `collections.`, `data.`
// and friends without an entry per subdomain, while keeping the destination
// set bounded to cultural-heritage institutions we actually source from.
//
// Adding a new museum/library source = add its registrable domain here.
const PROXY_ALLOWED_SUFFIXES = [
  // — North America —
  'metmuseum.org', 'clevelandart.org', 'artic.edu', 'si.edu', 'nga.gov',
  'thewalters.org', 'lacma.org', 'artsmia.org', 'pem.org', 'nypl.org',
  'cooperhewitt.org', 'yale.edu',
  'cornell.edu', 'harvard.edu', 'harvardartmuseums.org', 'loc.gov',
  'digitalcommonwealth.org', 'getty.edu', 'moma.org', 'whitney.org',
  'guggenheim.org', 'philamuseum.org', 'mfa.org', 'brooklynmuseum.org',
  'ago.ca', 'gallery.ca', 'inah.gob.mx', 'dp.la', 'nasa.gov',
  // — UK & Ireland —
  'vam.ac.uk', 'tate.org.uk', 'npg.org.uk', 'nhm.ac.uk', 'ox.ac.uk',
  'cam.ac.uk', 'britishmuseum.org', 'nationalgallery.org.uk',
  'wellcomecollection.org', 'rct.uk', 'nationaltrust.org.uk',
  'nationalgalleries.org', 'iwm.org.uk', 'sciencemuseumgroup.org.uk',
  // — Europe —
  'rijksmuseum.nl', 'mauritshuis.nl', 'boijmans.nl', 'europeana.eu',
  'museum-digital.de', 'bsb-muenchen.de', 'staedelmuseum.de', 'smb.museum',
  'bnf.fr', 'culture.gouv.fr', 'louvre.fr', 'photo.rmn.fr',
  'mak.at', 'khm.at', 'onb.ac.at', 'belvedere.at',
  'smk.dk', 'nationalmuseum.se', 'kulturarvsdata.se', 'finna.fi',
  'munchmuseet.no', 'nasjonalmuseet.no', 'wikiart.org',
  'museodelprado.es', 'museothyssen.org', 'uffizi.it', 'vangoghmuseum.nl',
  // — Rest of world —
  'tepapa.govt.nz', 'aucklandmuseum.com', 'maas.museum', 'nla.gov.au',
  'louvreabudhabi.ae', 'npm.gov.tw', 'nmwa.go.jp',
  // — Aggregators / infrastructure —
  'wikimedia.org', 'wikipedia.org', 'wikidata.org', 'emuseum.com',
  'iiif.io', 'davidrumsey.com', 'archive.org',
  // — Key-gated sources (see SERVER_KEY_HOSTS) —
  'dp.la', 'nla.gov.au', 'pexels.com', 'pixabay.com', 'unsplash.com',
];

// True when `hostname` is the institution domain itself or a subdomain of it.
// Compares against a leading dot so `evilmetmuseum.org` cannot match
// `metmuseum.org` — only `metmuseum.org` and `*.metmuseum.org` do.
export function isAllowedProxyHost(hostname) {
  const h = (hostname || '').toLowerCase();
  if (PROXY_ALLOWED_DOMAINS.has(h)) return true;
  return PROXY_ALLOWED_SUFFIXES.some(d => h === d || h.endsWith('.' + d));
}

// Hostnames that are never proxied, regardless of allowlist (SSRF guard).
// Covers private, loopback, link-local, and metadata-service IPv4/IPv6.
const _PRIVATE_IP_RE = /^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.|::1$|fc|fd|fe80:|169\.254\.169\.254$)/i;
const _LOCAL_HOSTS = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost', 'broadcasthost']);

export function isPrivateOrLocalHost(hostname) {
  const h = (hostname || '').toLowerCase();
  if (_LOCAL_HOSTS.has(h)) return true;
  if (_PRIVATE_IP_RE.test(h)) return true;
  // Bracketed IPv6 like [::1] arrives un-bracketed from URL parsing; covered above.
  return false;
}

async function handleProxy(url, request, env) {
  if (request.method !== 'GET') {
    return json({ error: 'Only GET requests are proxied' }, 405, env);
  }

  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) return json({ error: 'Missing ?url= parameter' }, 400, env);

  let parsed;
  try { parsed = new URL(targetUrl); } catch {
    return json({ error: 'Invalid URL' }, 400, env);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return json({ error: 'Only http/https URLs are supported' }, 400, env);
  }

  // SSRF guard — never proxy to private/loopback hosts or non-standard ports.
  if (isPrivateOrLocalHost(parsed.hostname)) {
    return json({ error: 'Host not allowed' }, 403, env);
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return json({ error: 'Non-standard ports not allowed' }, 403, env);
  }

  // Access gate: destination must be a known cultural-heritage host. Origin is
  // deliberately NOT consulted — it is attacker-controlled outside a browser,
  // so gating on it left this endpoint working as an open proxy.
  if (!isAllowedProxyHost(parsed.hostname)) {
    return json({ error: 'Host not in proxy allowlist' }, 403, env);
  }

  // Swap the client's key sentinel for the real secret. Bound to the
  // destination host so a sentinel aimed at one API can never surface another
  // API's key, and refused outright when the secret isn't configured — better
  // a clear 503 than a request that leaks the literal sentinel upstream.
  let outboundUrl = targetUrl;
  if (targetUrl.includes(KEY_SENTINEL)) {
    const secretName = serverKeyForHost(parsed.hostname);
    const secret = secretName ? env?.[secretName] : null;
    if (!secret) {
      return json({ error: 'No server key configured for this host' }, 503, env);
    }
    outboundUrl = targetUrl.split(KEY_SENTINEL).join(encodeURIComponent(secret));
  }

  try {
    const upstream = await fetch(outboundUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, application/ld+json, text/xml, */*;q=0.5',
      },
      // Never edge-cache a keyed request: the outbound URL carries the secret,
      // so it must not become part of a cache key.
      cf: outboundUrl === targetUrl
        ? { cacheTtl: 300, cacheEverything: true }
        : { cacheTtl: 0 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    });

    // Pass through the response with CORS headers
    const respHeaders = new Headers(upstream.headers);
    respHeaders.set('Access-Control-Allow-Origin', resolveAllowedOrigin(request, env));
    respHeaders.set('Vary', 'Origin');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    // Cache proxied API responses for 5 minutes at the edge
    respHeaders.set('Cache-Control', 'public, max-age=300');

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (e) {
    return json({ error: 'Proxy fetch failed: ' + e.message }, 502, env);
  }
}
