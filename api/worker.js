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

const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;
const rateBuckets = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start > RATE_WINDOW) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  return bucket.count <= RATE_LIMIT;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://insposearch.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(env),
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
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, env);
    }

    // Rate limiting
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return json({ error: 'Rate limit exceeded. Max 60 requests/min.' }, 429, env);
    }

    const path = url.pathname.replace(/\/+$/, '') || '/';

    switch (path) {
      case '/health':
        return json({ status: 'ok', timestamp: new Date().toISOString() }, 200, env);

      case '/sources':
        return handleSources(env);

      case '/search':
        return handleSearch(url, env);

      case '/random':
        return handleRandom(url, env);

      case '/semantic':
        return handleSemantic(url, env);

      case '/caption':
        return handleCaption(request, env);

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
            '/semantic?q=...',
            'POST /caption  { "url": "..." }',
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
