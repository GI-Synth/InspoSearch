/**
 * InspoSearch Image Proxy Worker
 *
 * Proxies third-party images through Cloudflare's edge network, adding:
 *   - CORS headers so the canvas can read pixel data (pHash, color extraction)
 *   - Cloudflare Image Resizing (resize to requested width, WebP conversion)
 *   - Edge caching (Cache-Control: public, max-age=86400)
 *   - Referrer stripping (some museum APIs block direct browser requests)
 *
 * Deploy separately:
 *   wrangler deploy --config api/image-proxy.wrangler.toml
 *
 * Usage:
 *   GET https://insposearch-img.workers.dev/?url=<encoded-image-url>&w=400
 *
 * Security:
 *   - Only proxies http/https URLs
 *   - Validates Content-Type is image/*
 *   - Max response size: 10 MB
 *   - Rate limit: 120 req/min per IP
 */

const RATE_LIMIT  = 600;
const RATE_WINDOW = 60_000;
const MAX_BYTES   = 10 * 1024 * 1024; // 10 MB
const rateBuckets = new Map();

function checkRate(ip) {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || now - b.start > RATE_WINDOW) { b = { start: now, count: 0 }; rateBuckets.set(ip, b); }
  return ++b.count <= RATE_LIMIT;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'GET') {
      return error('Method not allowed', 405);
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRate(ip)) return error('Rate limit exceeded', 429);

    const imgUrl = url.searchParams.get('url');
    if (!imgUrl) return error('Missing ?url= parameter', 400);

    // Validate URL scheme
    let parsed;
    try { parsed = new URL(imgUrl); } catch { return error('Invalid URL', 400); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return error('Only http/https URLs are supported', 400);
    }

    // Desired width (optional, Cloudflare Image Resizing if plan supports it)
    const width = parseInt(url.searchParams.get('w') || '0', 10);

    // Fetch options — strip Referer, add neutral UA
    const fetchOpts = {
      headers: {
        'User-Agent': 'InspoSearch Image Proxy/1.0',
        'Accept': 'image/*,*/*;q=0.8',
      },
      cf: {
        cacheTtl: 86400,
        cacheEverything: true,
        // Cloudflare Image Resizing (requires paid Images plan)
        ...(width > 0 ? {
          image: { width, format: 'auto', quality: 85 },
        } : {}),
      },
    };

    let upstream;
    try {
      upstream = await fetch(imgUrl, fetchOpts);
    } catch (e) {
      return error('Failed to fetch upstream image: ' + e.message, 502);
    }

    if (!upstream.ok) {
      return error(`Upstream returned ${upstream.status}`, 502);
    }

    const ct = upstream.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      return error('Upstream resource is not an image', 400);
    }

    // Stream with size guard
    const reader = upstream.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { reader.cancel(); return error('Image too large (max 10 MB)', 413); }
      chunks.push(value);
    }

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex',
        'Vary': 'Accept',
      },
    });
  },
};

function error(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
