#!/usr/bin/env node
/**
 * admin/server.cjs — Local dev server for InspoSearch admin dashboard
 *
 * Serves the admin/ folder statically + provides a write-back endpoint
 * so the browser can persist review state directly to the candidates JSON.
 *
 * Usage:  node admin/server.cjs
 *         http://localhost:8787
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = 8787;
const ROOT      = __dirname;                                           // admin/
const DATA_FILE = path.join(ROOT, 'data', 'homepage-candidates.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonRes(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ── server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url    = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // ── API: POST /api/save  — merge keep/reject map into candidates file ──────
  if (method === 'POST' && url.pathname === '/api/save') {
    try {
      const body = await readBody(req);
      const { reviewMap } = JSON.parse(body);   // { [url]: true|false|null }
      if (!reviewMap || typeof reviewMap !== 'object') {
        return jsonRes(res, 400, { error: 'invalid payload' });
      }

      if (!fs.existsSync(DATA_FILE)) {
        return jsonRes(res, 404, { error: 'candidates file not found' });
      }

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

      let updated = 0;
      for (const section of [data.categories, data.heroes]) {
        for (const items of Object.values(section)) {
          for (const item of items) {
            if (reviewMap[item.url] !== undefined) {
              item.keep = reviewMap[item.url];
              updated++;
            }
          }
        }
      }

      data._reviewSaved = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      jsonRes(res, 200, { ok: true, updated });
    } catch (e) {
      jsonRes(res, 500, { error: e.message });
    }
    return;
  }

  // ── API: GET /api/stats — quick count of keep/reject state ────────────────
  if (method === 'GET' && url.pathname === '/api/stats') {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const stats = {};
      for (const [section, groups] of [['categories', data.categories], ['heroes', data.heroes]]) {
        for (const [key, items] of Object.entries(groups)) {
          const kept      = items.filter(i => i.keep === true).length;
          const rejected  = items.filter(i => i.keep === false).length;
          const total     = items.length;
          stats[key] = { total, kept, rejected, unreviewed: total - kept - rejected };
        }
      }
      jsonRes(res, 200, stats);
    } catch (e) {
      jsonRes(res, 500, { error: e.message });
    }
    return;
  }

  // ── Static file serving ───────────────────────────────────────────────────
  let filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  InspoSearch Admin Server`);
  console.log(`  http://localhost:${PORT}\n`);
});
