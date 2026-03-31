/**
 * InspoSearch Public REST API — Cloudflare Worker
 *
 * Endpoints:
 *   GET /search?q=<query>&limit=<n>    — Search across all sources
 *   GET /sources                        — List available sources
 *   GET /random?count=<n>              — Random items
 *   GET /health                        — Health check
 *
 * Rate limit: 60 requests per minute per IP (in-memory, per-isolate).
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
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

// Minimal source list (mirrors sources.manifest.json structure)
const SOURCES_URL = 'https://insposearch.pages.dev/sources.manifest.json';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== 'GET') {
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

      default:
        return json({
          name: 'InspoSearch API',
          version: '1.0.0',
          endpoints: ['/search?q=...&limit=24', '/sources', '/random?count=6', '/health'],
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

  // Proxy to a few fast, CORS-friendly sources for the API
  const results = [];

  // Art Institute of Chicago (fast, reliable, free)
  try {
    const artic = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&limit=${limit}&fields=id,title,image_id,artist_display,date_display`
    );
    const data = await artic.json();
    if (data.data) {
      for (const obj of data.data) {
        if (!obj.image_id) continue;
        results.push({
          id: `artic_${obj.id}`,
          title: obj.title || 'Untitled',
          artist: obj.artist_display || '',
          date: obj.date_display || '',
          thumbnail: `https://www.artic.edu/iiif/2/${obj.image_id}/full/400,/0/default.jpg`,
          source: 'Art Institute of Chicago',
          sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
        });
      }
    }
  } catch { /* skip */ }

  return json({
    query: q,
    count: results.length,
    results: results.slice(0, limit),
  }, 200, env);
}

async function handleRandom(url, env) {
  const count = Math.min(Math.max(parseInt(url.searchParams.get('count')) || 6, 1), 24);
  const randomTerms = ['landscape', 'portrait', 'still life', 'botanical', 'architecture',
    'sculpture', 'textile', 'manuscript', 'ceramic', 'mythology'];
  const term = randomTerms[Math.floor(Math.random() * randomTerms.length)];

  try {
    const artic = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(term)}&limit=${count}&fields=id,title,image_id,artist_display,date_display`
    );
    const data = await artic.json();
    const results = (data.data || [])
      .filter(obj => obj.image_id)
      .map(obj => ({
        id: `artic_${obj.id}`,
        title: obj.title || 'Untitled',
        artist: obj.artist_display || '',
        date: obj.date_display || '',
        thumbnail: `https://www.artic.edu/iiif/2/${obj.image_id}/full/400,/0/default.jpg`,
        source: 'Art Institute of Chicago',
        sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
      }));
    return json({ term, count: results.length, results }, 200, env);
  } catch {
    return json({ error: 'Failed to fetch random items' }, 502, env);
  }
}
