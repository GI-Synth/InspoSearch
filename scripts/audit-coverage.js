#!/usr/bin/env node
/*
  Source coverage audit.
  Runs N representative queries against every source in ALL_SOURCES and
  counts how many return >=1 item on any query. Reports categorized totals.

  Usage:
    node scripts/audit-coverage.js
    node scripts/audit-coverage.js --queries "van gogh,butterfly,cathedral,map"
    node scripts/audit-coverage.js --out reports/coverage.md --per-source-limit 5
*/
import fs from 'fs/promises';
import path from 'path';

function makeStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); },
  };
}

function patchFetchForDataCache() {
  const realFetch = globalThis.fetch.bind(globalThis);
  const dataDir = new URL('../insposearch/data/', import.meta.url);
  globalThis.fetch = async (input, init) => {
    const urlStr = typeof input === 'string' ? input : (input?.url || String(input));
    if (urlStr.startsWith('/data/')) {
      try {
        const filePath = new URL(urlStr.slice(6), dataDir);
        const body = await fs.readFile(filePath, 'utf8');
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
      } catch (e) {
        if (e?.code === 'ENOENT') return new Response('', { status: 404 });
        return new Response(String(e), { status: 500 });
      }
    }
    return realFetch(input, init);
  };
}

function ensureBrowserStubs() {
  if (typeof globalThis.location === 'undefined') globalThis.location = { search: '' };
  if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = makeStorage();
  if (typeof globalThis.sessionStorage === 'undefined') globalThis.sessionStorage = makeStorage();
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      body: { classList: { add() {}, remove() {} } },
      documentElement: { classList: { add() {}, remove() {} }, lang: '' },
      getElementById() { return null; },
      querySelectorAll() { return []; },
      createElement() { return { appendChild() {}, classList: { add() {}, remove() {} } }; },
      createDocumentFragment() { return { appendChild() {} }; },
    };
  }
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = { language: 'en-US', languages: ['en-US'] };
  }
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const [k, v] = a.slice(2).split('=');
    if (v !== undefined) parsed[k] = v;
    else {
      const n = argv[i + 1];
      if (n && !n.startsWith('-')) { parsed[k] = n; i++; }
      else parsed[k] = true;
    }
  }
  return parsed;
}

async function buildDispatch(fetchers, state) {
  const { ALL_SOURCES, EUROPEANA_PROVIDERS, DPLA_HUBS, SI_UNITS, WD_PHASE_H, ADAPTERS } = state;
  const { WD_PHASE_H_FETCHERS } = fetchers;

  const appSrc = await fs.readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const directMap = new Map();

  // Primary dispatch path: callIfHealthy('id', () => fetchFoo(...)) — with optional exact-mode ternary.
  const reCall = /callIfHealthy\('([a-z_0-9]+)',\s*\(\)\s*=>\s*(?:STATE\.searchMode\s*===\s*'exact'\s*\?\s*(\w+)\([^)]*\)\s*:\s*)?(\w+)\(/g;
  let m;
  while ((m = reCall.exec(appSrc)) !== null) {
    const [, id, , fnName] = m;
    if (!directMap.has(id)) directMap.set(id, fnName);
  }

  // Secondary dispatch path: PAGE2_FETCHERS map (handles `loc`, `wikidata`, and paginated fetchers
  // that aren't invoked via callIfHealthy). Parse the object-literal block between `PAGE2_FETCHERS = {` and `};`.
  const pageStart = appSrc.indexOf('PAGE2_FETCHERS = {');
  if (pageStart !== -1) {
    const pageEnd = appSrc.indexOf('\n};', pageStart);
    const block = appSrc.slice(pageStart, pageEnd);
    const rePage = /^\s*([a-z_0-9]+):\s*\([^)]*\)\s*=>\s*(\w+)\(/gm;
    while ((m = rePage.exec(block)) !== null) {
      const [, id, fnName] = m;
      if (!directMap.has(id)) directMap.set(id, fnName);
    }
  }

  const wdIds = new Set(WD_PHASE_H.map(s => s.id));
  const dispatch = new Map();

  for (const id of ALL_SOURCES) {
    if (wdIds.has(id)) {
      const fn = WD_PHASE_H_FETCHERS[id];
      if (fn) dispatch.set(id, { kind: 'wd_phase_h', call: (kw, lim, sig) => fn(kw, lim, sig) });
      else dispatch.set(id, { kind: 'unmapped', reason: 'no WD_PHASE_H_FETCHERS entry' });
      continue;
    }
    if (id.startsWith('euro_')) {
      const cfg = EUROPEANA_PROVIDERS[id];
      const adapter = ADAPTERS.europeana_provider;
      if (cfg && adapter) dispatch.set(id, { kind: 'europeana', call: (kw, lim, sig) => adapter(cfg, kw, lim, sig) });
      else dispatch.set(id, { kind: 'unmapped', reason: 'missing euro config or adapter' });
      continue;
    }
    if (id.startsWith('dpla_')) {
      const cfg = DPLA_HUBS[id];
      const adapter = ADAPTERS.dpla_hub;
      if (cfg && adapter) dispatch.set(id, { kind: 'dpla', call: (kw, lim, sig) => adapter(cfg, kw, lim, sig) });
      else dispatch.set(id, { kind: 'unmapped', reason: 'missing dpla config or adapter' });
      continue;
    }
    if (id.startsWith('si_')) {
      const cfg = SI_UNITS[id];
      const adapter = ADAPTERS.smithsonian_unit;
      if (cfg && adapter) dispatch.set(id, { kind: 'smithsonian', call: (kw, lim, sig) => adapter(cfg, kw, lim, sig) });
      else dispatch.set(id, { kind: 'unmapped', reason: 'missing si config or adapter' });
      continue;
    }
    const fnName = directMap.get(id);
    if (fnName && typeof fetchers[fnName] === 'function') {
      const fn = fetchers[fnName];
      dispatch.set(id, { kind: 'direct', fnName, call: (kw, lim, sig) => fn(kw, lim, sig) });
      continue;
    }
    dispatch.set(id, { kind: 'unmapped', reason: 'no dispatch match in app.js' });
  }
  return { dispatch, directMap };
}

async function runOne(entry, kw, timeoutMs) {
  if (entry.kind === 'unmapped') return { status: 'unmapped', count: 0, reason: entry.reason };
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await entry.call(kw, 15, ac.signal);
    clearTimeout(t);
    const n = Array.isArray(res) ? res.length : 0;
    return { status: n > 0 ? 'hit' : 'empty', count: n };
  } catch (e) {
    clearTimeout(t);
    return { status: 'error', count: 0, error: String(e?.message || e) };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queries = String(args.queries || 'van gogh,butterfly,cathedral,ancient map')
    .split(',').map(s => s.trim()).filter(Boolean);
  const timeoutMs = Number(args.timeout || 15000);
  const concurrency = Number(args.concurrency || 8);
  const out = args.out || `reports/coverage-${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '').slice(0, 13)}.md`;

  ensureBrowserStubs();
  patchFetchForDataCache();
  const [fetchers, state] = await Promise.all([
    import('../src/fetchers.js'),
    import('../src/state.js'),
  ]);

  const { dispatch } = await buildDispatch(fetchers, state);
  const ids = [...dispatch.keys()];
  console.log(`[audit] ${ids.length} source IDs, ${queries.length} queries, timeout ${timeoutMs}ms, concurrency ${concurrency}`);

  const perSource = new Map();
  for (const id of ids) perSource.set(id, { runs: [], bestCount: 0 });

  const tasks = [];
  for (const id of ids) {
    for (const kw of queries) tasks.push({ id, kw });
  }

  let done = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (tasks.length) {
      const { id, kw } = tasks.shift();
      const r = await runOne(dispatch.get(id), kw, timeoutMs);
      const rec = perSource.get(id);
      rec.runs.push({ kw, ...r });
      if (r.count > rec.bestCount) rec.bestCount = r.count;
      done++;
      if (done % 50 === 0) console.log(`[audit] ${done} / ${ids.length * queries.length}`);
    }
  });
  await Promise.all(workers);

  const categorize = (id) => {
    const kind = dispatch.get(id).kind;
    const rec = perSource.get(id);
    if (kind === 'unmapped') return 'unmapped';
    const anyHit = rec.runs.some(r => r.status === 'hit');
    const anyError = rec.runs.some(r => r.status === 'error');
    const anyEmpty = rec.runs.some(r => r.status === 'empty');
    if (anyHit) return 'active';
    if (anyError && !anyEmpty) return 'errored';
    if (anyEmpty && !anyError) return 'silent';
    return 'mixed';
  };

  const buckets = { active: [], silent: [], errored: [], mixed: [], unmapped: [] };
  for (const id of ids) buckets[categorize(id)].push(id);

  const lines = [];
  lines.push(`# InspoSearch source coverage audit`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Queries: ${queries.map(q => `\`${q}\``).join(', ')}`);
  lines.push(`Timeout per call: ${timeoutMs}ms  |  Concurrency: ${concurrency}`);
  lines.push('');
  lines.push(`## Totals`);
  lines.push('');
  lines.push(`| Bucket | Count | % of ${ids.length} |`);
  lines.push(`| --- | --- | --- |`);
  for (const k of ['active', 'silent', 'errored', 'mixed', 'unmapped']) {
    const n = buckets[k].length;
    lines.push(`| ${k} | ${n} | ${((n / ids.length) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  lines.push(`## Active (${buckets.active.length})`);
  lines.push('');
  buckets.active.sort();
  for (const id of buckets.active) {
    const rec = perSource.get(id);
    const hits = rec.runs.filter(r => r.status === 'hit').map(r => `${r.kw}=${r.count}`).join(', ');
    lines.push(`- **${id}** (${dispatch.get(id).kind}) — ${hits}`);
  }
  lines.push('');

  lines.push(`## Silent (${buckets.silent.length}) — returned [] on every query`);
  lines.push('');
  buckets.silent.sort();
  for (const id of buckets.silent) lines.push(`- ${id} (${dispatch.get(id).kind})`);
  lines.push('');

  lines.push(`## Errored (${buckets.errored.length}) — threw on every query`);
  lines.push('');
  buckets.errored.sort();
  for (const id of buckets.errored) {
    const rec = perSource.get(id);
    const errs = [...new Set(rec.runs.map(r => r.error).filter(Boolean))].slice(0, 2).join(' | ');
    lines.push(`- ${id} (${dispatch.get(id).kind}) — ${errs}`);
  }
  lines.push('');

  lines.push(`## Mixed (${buckets.mixed.length}) — some empty, some error, no hits`);
  lines.push('');
  buckets.mixed.sort();
  for (const id of buckets.mixed) {
    const rec = perSource.get(id);
    const summary = rec.runs.map(r => `${r.kw}:${r.status}`).join(' ');
    lines.push(`- ${id} (${dispatch.get(id).kind}) — ${summary}`);
  }
  lines.push('');

  lines.push(`## Unmapped (${buckets.unmapped.length}) — no dispatch path found`);
  lines.push('');
  buckets.unmapped.sort();
  for (const id of buckets.unmapped) {
    lines.push(`- ${id} — ${dispatch.get(id).reason}`);
  }
  lines.push('');

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, lines.join('\n'));
  console.log(`\n[audit] Wrote ${out}`);
  console.log(`[audit] active: ${buckets.active.length}  silent: ${buckets.silent.length}  errored: ${buckets.errored.length}  mixed: ${buckets.mixed.length}  unmapped: ${buckets.unmapped.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
