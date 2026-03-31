/**
 * InspoSearch — Core Unit Tests
 *
 * These test pure functions extracted from app.js.
 * Since app.js is a monolith (no exports), we copy the function
 * logic here. When modules are extracted to src/, these imports
 * will point to the real modules.
 */
import { describe, it, expect } from 'vitest';

// ── formatCount (from app.js ~line 10676) ──
function formatCount(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return String(n);
}

describe('formatCount', () => {
  it('formats billions', () => {
    expect(formatCount(3_400_000_000)).toBe('3.4B+');
    expect(formatCount(1_000_000_000)).toBe('1B+');
  });
  it('formats millions', () => {
    expect(formatCount(50_000_000)).toBe('50M');
    expect(formatCount(1_500_000)).toBe('1.5M');
  });
  it('formats thousands', () => {
    expect(formatCount(300_000)).toBe('300k');
    expect(formatCount(5_000)).toBe('5k');
  });
  it('formats small numbers as-is', () => {
    expect(formatCount(42)).toBe('42');
    expect(formatCount(0)).toBe('0');
  });
});

// ── cacheKey (from app.js ~line 2065) ──
const CACHE_PREFIX = 'inspo_cache_';
function cacheKey(keyword, searchMode = 'explore') {
  const mode = searchMode === 'exact' ? 'exact_' : '';
  return CACHE_PREFIX + mode + keyword.toLowerCase().trim();
}

describe('cacheKey', () => {
  it('lowercases and trims', () => {
    expect(cacheKey('  Brutalism  ')).toBe('inspo_cache_brutalism');
  });
  it('adds exact_ prefix in exact mode', () => {
    expect(cacheKey('marble', 'exact')).toBe('inspo_cache_exact_marble');
  });
  it('no prefix in explore mode', () => {
    expect(cacheKey('shadow', 'explore')).toBe('inspo_cache_shadow');
  });
});

// ── classifyQuery (from app.js ~line 333) ──
const NATURE_QUERY_TERMS = [
  'beetle','moth','butterfly','lichen','fungus','coral','species','genus',
  'flora','fauna','specimen','fern','moss','mushroom','insect','bird','fish',
];
const SPACE_QUERY_TERMS = [
  'galaxy','nebula','supernova','asteroid','comet','exoplanet','pulsar',
  'quasar','spacecraft','satellite','orbit','cosmic','stellar','mars','jupiter',
];

function classifyQuery(q) {
  const lower = (q || '').toLowerCase();
  const isNature = NATURE_QUERY_TERMS.some(t => lower.includes(t));
  const isSpace  = SPACE_QUERY_TERMS.some(t => lower.includes(t));
  return { isNature, isSpace };
}

describe('classifyQuery', () => {
  it('detects nature queries', () => {
    expect(classifyQuery('blue butterfly').isNature).toBe(true);
    expect(classifyQuery('blue butterfly').isSpace).toBe(false);
  });
  it('detects space queries', () => {
    expect(classifyQuery('andromeda galaxy').isSpace).toBe(true);
    expect(classifyQuery('andromeda galaxy').isNature).toBe(false);
  });
  it('handles empty/null', () => {
    expect(classifyQuery('').isNature).toBe(false);
    expect(classifyQuery(null).isSpace).toBe(false);
  });
  it('detects neither for generic terms', () => {
    const r = classifyQuery('renaissance portrait');
    expect(r.isNature).toBe(false);
    expect(r.isSpace).toBe(false);
  });
});

// ── deduplicateResults (from app.js ~line 12561) ──
function deduplicateResults(items) {
  if (!items || items.length < 2) return items;
  const seen = new Map();
  const out = [];
  const SOURCE_AUTHORITY = { met: 10, rijksmuseum: 9, chicago: 8, wikimedia: 3 };
  for (const item of items) {
    const norm = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (!norm || norm.length < 5) { out.push(item); continue; }
    if (seen.has(norm)) {
      const existing = seen.get(norm);
      const authNew = SOURCE_AUTHORITY[item.source] || 0;
      const authOld = SOURCE_AUTHORITY[existing.source] || 0;
      if (authNew > authOld) {
        const idx = out.indexOf(existing);
        if (idx >= 0) out[idx] = item;
        seen.set(norm, item);
      }
    } else {
      seen.set(norm, item);
      out.push(item);
    }
  }
  return out;
}

describe('deduplicateResults', () => {
  it('removes duplicate titles keeping higher authority', () => {
    const items = [
      { id: '1', title: 'Starry Night', source: 'wikimedia' },
      { id: '2', title: 'Starry Night', source: 'met' },
    ];
    const result = deduplicateResults(items);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('met');
  });
  it('keeps items with short/empty titles', () => {
    const items = [
      { id: '1', title: 'ab', source: 'met' },
      { id: '2', title: '', source: 'wikimedia' },
      { id: '3', title: 'Real Title Here', source: 'chicago' },
    ];
    const result = deduplicateResults(items);
    expect(result).toHaveLength(3);
  });
  it('handles null/empty input', () => {
    expect(deduplicateResults(null)).toBe(null);
    expect(deduplicateResults([])).toEqual([]);
    expect(deduplicateResults([{ id: '1', title: 'x', source: 'met' }])).toHaveLength(1);
  });
});

// ── CIE76 Delta-E color distance (from hex palette feature) ──
function rgb2lab(r, g, b) {
  let rr = r / 255, gg = g / 255, bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047;
  let y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722);
  let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + 16 / 116;
  y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + 16 / 116;
  z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function deltaE(rgb1, rgb2) {
  const lab1 = rgb2lab(...rgb1);
  const lab2 = rgb2lab(...rgb2);
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  );
}

describe('deltaE color distance', () => {
  it('returns 0 for identical colors', () => {
    expect(deltaE([128, 64, 32], [128, 64, 32])).toBe(0);
  });
  it('returns small distance for similar colors', () => {
    const d = deltaE([255, 0, 0], [250, 10, 5]);
    expect(d).toBeLessThan(10);
  });
  it('returns large distance for opposite colors', () => {
    const d = deltaE([255, 0, 0], [0, 0, 255]);
    expect(d).toBeGreaterThan(100);
  });
  it('black vs white is high distance', () => {
    const d = deltaE([0, 0, 0], [255, 255, 255]);
    expect(d).toBeGreaterThan(90);
  });
});

// ── Title normalization for dedup ──
function normalizeTitle(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
}

describe('normalizeTitle', () => {
  it('lowercases and strips non-alphanum', () => {
    expect(normalizeTitle('The Starry Night (1889)')).toBe('thestarrynight1889');
  });
  it('truncates to 60 chars', () => {
    const long = 'a'.repeat(100);
    expect(normalizeTitle(long)).toHaveLength(60);
  });
  it('handles empty/null', () => {
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle(null)).toBe('');
  });
});
