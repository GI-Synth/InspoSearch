#!/usr/bin/env node
/*
  Audit image search results for a batch of query words.
  Usage:
    node scripts/audit-image-search.js --words words.txt --out reports/audit-batch-01.md --mode explore --limit 15
*/
import fs from 'fs/promises';
import path from 'path';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}

function ensureBrowserStubs() {
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = { search: '' };
  }
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = makeStorage();
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = makeStorage();
  }
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
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value !== undefined) {
        parsed[key] = value;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          parsed[key] = next;
          i++;
        } else {
          parsed[key] = true;
        }
      }
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Audit image search results across query words

Usage:
  node scripts/audit-image-search.js --words words.txt --out reports/audit-batch-01.md [options]

Options:
  --words <file>       Path to a newline-delimited list of query words or phrases.
  --out <file>         Output markdown file path. Default: reports/audit-<timestamp>.md
  --mode <mode>        Search mode: explore or exact. Default: explore
  --limit <n>          Number of top results to keep per query. Default: 15
  --concurrency <n>    Number of parallel fetchers. Default: 10
  --help               Show this help text.
`);
}

function timestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function normalizeSourceId(fetcherName) {
  return fetcherName.slice(5)
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function safeMarkdown(text) {
  return String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

function fieldMatches(queryTerms, fieldValue) {
  const lower = String(fieldValue || '').toLowerCase();
  return queryTerms.filter(term => term.length > 0 && lower.includes(term));
}

function buildFlags(query, item) {
  const lowerQuery = String(query || '').toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);
  const title = String(item.title || '').toLowerCase();
  const desc = String(item.description || '').toLowerCase();
  const artist = String(item.artist || '').toLowerCase();
  const tags = String((item.tags || []).join(' ')).toLowerCase();
  const titleMatches = fieldMatches(terms, title);
  const descMatches = fieldMatches(terms, desc);
  const artistMatches = fieldMatches(terms, artist);
  const tagsMatches = fieldMatches(terms, tags);
  const genericTitle = /^(photographs?|image|picture|photo|file|img[_\s]?\d+|dsc[_\s]?\d+|untitled|no title|page \d+|volume \d+|issue \d+)/i.test(item.title || '');

  const flags = [];
  if (!titleMatches.length && !descMatches.length && !artistMatches.length && !tagsMatches.length) {
    flags.push('no visible match');
  }
  if (genericTitle) flags.push('generic title');
  if (!titleMatches.length && (descMatches.length || tagsMatches.length) && !artistMatches.length) {
    flags.push('description/tag-only');
  }
  if (descMatches.length && !titleMatches.length && !artistMatches.length && !tagsMatches.length) {
    flags.push('only description');
  }
  if (titleMatches.length && !artistMatches.length && !tagsMatches.length && !descMatches.length) {
    flags.push('title-only');
  }
  if (artistMatches.length && !titleMatches.length) {
    flags.push('artist-only');
  }
  return {
    titleMatches,
    descMatches,
    artistMatches,
    tagsMatches,
    genericTitle,
    flags,
    anyMatch: titleMatches.length || descMatches.length || artistMatches.length || tagsMatches.length,
  };
}

function renderItemRow(rank, item, qualityTag) {
  const title = safeMarkdown(item.title || item.description || item.id || '(no title)');
  const artist = safeMarkdown(item.artist || '');
  const source = safeMarkdown(item._source || item.source || 'unknown');
  const score = Number(item._score ?? 0).toFixed(1);
  const url = item.url ? `[link](${safeMarkdown(item.url)})` : '';
  const notes = safeMarkdown(item._notes || '');
  return `| ${rank} | ${source} | ${title} | ${artist} | ${score} | ${qualityTag} | ${notes} | ${url} |`;
}

function promisePool(tasks, concurrency) {
  const results = [];
  let index = 0;
  const runNext = async () => {
    while (index < tasks.length) {
      const current = index++;
      try {
        results[current] = await tasks[current]();
      } catch (err) {
        results[current] = { error: err };
      }
    }
  };
  return Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, runNext)).then(() => results);
}

function getDefaultOutPath(batchLabel) {
  const dir = 'reports';
  const file = batchLabel
    ? `audit-${batchLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp()}.md`
    : `audit-${timestamp()}.md`;
  return path.join(dir, file);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.words && !args.query)) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const wordsFile = args.words;
  const directQuery = args.query;
  const mode = String(args.mode || 'explore').toLowerCase() === 'exact' ? 'exact' : 'explore';
  const limit = Number(args.limit || 15);
  const concurrency = Number(args.concurrency || 10);
  const out = args.out || getDefaultOutPath(args.batch || 'batch');

  const rawWords = [];
  if (wordsFile) {
    const content = await fs.readFile(wordsFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) rawWords.push(trimmed);
    }
  }
  if (directQuery) {
    rawWords.push(...directQuery.split(',').map(s => s.trim()).filter(Boolean));
  }
  if (!rawWords.length) {
    throw new Error('No query words found. Provide --words or --query.');
  }

  ensureBrowserStubs();
  const [{ scoreItemRelevance, getDisplayResults }, fetchersModule, stateModule] = await Promise.all([
    import('../src/core.js'),
    import('../src/fetchers.js'),
    import('../src/state.js'),
  ]);
  const { STATE } = stateModule;

  STATE.searchMode = mode;

  const excludedFetchers = new Set([
    'fetchDPLAProvider',
    'fetchIIIFCollection',
    'fetchIIIFSearch',
    'fetchEuropeanaFiltered',
    'fetchSmithsonianUnit',
  ]);

  const availableFetchers = Object.entries(fetchersModule)
    .filter(([name, fn]) => name.startsWith('fetch') && typeof fn === 'function' && fn.length === 3 && !excludedFetchers.has(name))
    .sort(([a], [b]) => a.localeCompare(b));

  if (!availableFetchers.length) {
    throw new Error('No compatible fetcher functions found in src/fetchers.js.');
  }

  await fs.mkdir(path.dirname(out), { recursive: true });
  const lines = [];
  lines.push(`# InspoSearch Audit Report`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Mode: ${mode}`);
  lines.push(`Query count: ${rawWords.length}`);
  lines.push(`Fetcher functions used: ${availableFetchers.map(([name]) => name).join(', ')}`);
  lines.push('');

  for (const [index, query] of rawWords.entries()) {
    lines.push(`## Query ${index + 1}: ${safeMarkdown(query)}`);
    lines.push('');
    lines.push(`- Search mode: **${mode}**`);
    lines.push(`- Top results limit: **${limit}**`);
    lines.push('');

    const allItems = [];
    const fetchTasks = availableFetchers.map(([name, fn]) => async () => {
      const source = normalizeSourceId(name);
      let items = [];
      try {
        items = await fn(query, limit, new AbortController().signal);
      } catch (err) {
        return { source, name, error: String(err) };
      }
      if (!items) return { source, name, items: [] };
      if (!Array.isArray(items)) items = [items];
      return { source, name, items };
    });

    const settled = await promisePool(fetchTasks, concurrency);
    for (const result of settled) {
      if (result?.error) continue;
      const items = Array.isArray(result.items) ? result.items : [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (!item.id && item.url) item.id = item.url;
        item._source = result.source;
        item._fetcher = result.name;
        allItems.push(item);
      }
    }

    const uniqueMap = new Map();
    for (const item of allItems) {
      const key = item.id || item.url || JSON.stringify(item).slice(0, 200);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    const globalItems = Array.from(uniqueMap.values());
    for (const item of globalItems) {
      item._score = scoreItemRelevance(item, query);
      const audit = buildFlags(query, item);
      item._notes = audit.flags.join('; ');
      item._quality = audit.flags.includes('no visible match') || audit.flags.includes('generic title') ? 'bad' : (audit.flags.includes('description/tag-only') || audit.flags.includes('only description') ? 'borderline' : 'good');
    }

    const visible = getDisplayResults(globalItems, query).slice(0, limit);

    lines.push(`- Total fetch results: **${allItems.length}**`);
    lines.push(`- Unique deduped items: **${globalItems.length}**`);
    lines.push(`- Displayed results: **${visible.length}**`);
    lines.push('');

    lines.push('### Top results');
    lines.push('');
    lines.push('| Rank | Source | Title | Artist | Score | Auto Quality | Notes | URL |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    visible.forEach((item, rank) => {
      lines.push(renderItemRow(rank + 1, item, item._quality));
    });
    lines.push('');

    const flagged = visible.filter(item => item._quality !== 'good');
    if (flagged.length) {
      lines.push('### Auto-flagged issues');
      lines.push('');
      for (const item of flagged) {
        lines.push(`- **${item._quality}** — ${safeMarkdown(item.title || item.description || item.id || '(no title)')} — ${safeMarkdown(item._notes)} (${safeMarkdown(item._source)})`);
      }
      lines.push('');
    }

    const suggestions = new Set();
    if (flagged.some(item => item._quality === 'bad')) {
      suggestions.add('Penalise generic or metadata-heavy titles more strongly.');
      suggestions.add('Boost title and artist matches relative to description/tag-only matches.');
    }
    if (flagged.some(item => item._notes?.includes('description/tag-only'))) {
      suggestions.add('Reduce the weight of description/tags when the title does not match the query.');
    }
    if (flagged.some(item => item._notes?.includes('no visible match'))) {
      suggestions.add('Require at least one visible query term match in title, artist, description, or tags.');
    }
    if (suggestions.size) {
      lines.push('### Suggested fix ideas');
      lines.push('');
      for (const suggestion of suggestions) {
        lines.push(`- ${suggestion}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  await fs.writeFile(out, lines.join('\n'), 'utf8');
  console.log(`Audit report saved to ${out}`);
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
