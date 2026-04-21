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

// ── classifyQuery — import the real implementation from src/state.js
// so regressions in the term lists or matcher are caught here.
import { classifyQuery, classifyQueryExtended } from '../src/state.js';
import { matchesAsWholeWord } from '../src/core.js';

describe('matchesAsWholeWord (diacritic-safe exact-mode filter)', () => {
  it('matches plain ASCII word boundary', () => {
    expect(matchesAsWholeWord('vincent van gogh self-portrait', 'gogh')).toBe(true);
    expect(matchesAsWholeWord('antique vase', 'ant')).toBe(false);
  });
  it('strips NFD combining diacritics from hay', () => {
    // "Gögh" / "Gógh" → NFD strip → "Gogh" → matches "gogh"
    expect(matchesAsWholeWord('vincent van gögh', 'gogh')).toBe(true);
    expect(matchesAsWholeWord('café de flore', 'cafe')).toBe(true);
  });
  it('strips diacritics from the query term too', () => {
    expect(matchesAsWholeWord('vincent van gogh', 'gögh')).toBe(true);
  });
  it('treats hyphens as word boundaries (Van-Gogh variants)', () => {
    expect(matchesAsWholeWord('van-gogh museum', 'gogh')).toBe(true);
    expect(matchesAsWholeWord('van-gogh museum', 'van')).toBe(true);
  });
  it('is case-insensitive', () => {
    expect(matchesAsWholeWord('VINCENT VAN GOGH', 'gogh')).toBe(true);
  });
});

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
  // Regression: "ant" must not match "antique", "sun" must not match "sunset",
  // etc. — substring matches on these short tokens routed biology/space-only
  // sources (GBIF, NASA APOD) into unrelated art/cartography searches.
  it('does not substring-match short nature tokens inside unrelated words', () => {
    expect(classifyQuery('antique map cartography').isNature).toBe(false);
    expect(classifyQuery('antarctic expedition').isNature).toBe(false);
    expect(classifyQuery('beethoven portrait').isNature).toBe(false);
    expect(classifyQuery('birdcage architecture').isNature).toBe(false); // "bird" only as substring
    expect(classifyQuery('a single bird').isNature).toBe(true); // whole-word match
  });
  it('does not substring-match short space tokens inside unrelated words', () => {
    expect(classifyQuery('sunset over venice').isSpace).toBe(false); // "sun" embedded in "sunset"
    expect(classifyQuery('the sun and moon').isSpace).toBe(true);    // whole-word match
    expect(classifyQuery('earthenware pottery').isSpace).toBe(false);
    expect(classifyQuery('starbucks logo').isSpace).toBe(false);
  });
  it('classifyQueryExtended applies the same word-boundary rule', () => {
    const r = classifyQueryExtended('antique map cartography');
    expect(r.isNature).toBe(false);
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

// ── Reciprocal Rank Fusion (RRF) ──
// Kept pure / STATE-free, mirrors src/core.js:rrfFuse
function rrfFuse(rankings, k = 60, keyFn = (x) => x && (x.url || x.id)) {
  const scores = new Map();
  const seen = new Map();
  for (const ranking of rankings) {
    if (!Array.isArray(ranking)) continue;
    for (let i = 0; i < ranking.length; i++) {
      const item = ranking[i];
      const key = keyFn(item);
      if (!key) continue;
      scores.set(key, (scores.get(key) || 0) + 1 / (k + i + 1));
      if (!seen.has(key)) seen.set(key, item);
    }
  }
  const merged = [];
  for (const [key, item] of seen) merged.push({ item, score: scores.get(key) });
  merged.sort((a, b) => b.score - a.score);
  return merged.map(x => x.item);
}

describe('rrfFuse', () => {
  it('returns empty for empty input', () => {
    expect(rrfFuse([])).toEqual([]);
    expect(rrfFuse([[]])).toEqual([]);
  });
  it('boosts items appearing in multiple rankings', () => {
    const A = [{url:'a'}, {url:'b'}, {url:'c'}];
    const B = [{url:'c'}, {url:'a'}, {url:'d'}];
    // 'a' is rank 0 in A, rank 1 in B → strong; 'c' rank 0 in B rank 2 in A → strong
    // 'b' and 'd' each appear once
    const out = rrfFuse([A, B]).map(x => x.url);
    expect(out[0]).toMatch(/^(a|c)$/);
    expect(out[1]).toMatch(/^(a|c)$/);
    expect(out.indexOf('b')).toBeGreaterThan(out.indexOf('a'));
    expect(out.indexOf('d')).toBeGreaterThan(out.indexOf('c'));
  });
  it('deduplicates across rankings', () => {
    const A = [{url:'a'}, {url:'b'}];
    const B = [{url:'a'}, {url:'b'}];
    expect(rrfFuse([A, B]).length).toBe(2);
  });
  it('item without url or id is dropped', () => {
    const A = [{url:'a'}, {title:'no-key'}];
    expect(rrfFuse([A]).length).toBe(1);
  });
});

// ── MMR diversification ──
function trigramSim(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  const tri = s => {
    const t = new Set();
    const p = '  ' + s + ' ';
    for (let i = 0; i < p.length - 2; i++) t.add(p.slice(i, i + 3));
    return t;
  };
  const tA = tri(a), tB = tri(b);
  let m = 0;
  for (const t of tA) if (tB.has(t)) m++;
  return m / Math.max(tA.size, tB.size);
}
function itemSimilarity(a, b) {
  if (!a || !b) return 0;
  let sim = 0;
  const aa = (a.artist || '').toLowerCase();
  const ab = (b.artist || '').toLowerCase();
  if (aa && aa === ab) sim += 0.5;
  if (a.source && a.source === b.source) sim += 0.15;
  const ya = a.year ? parseInt(a.year, 10) : null;
  const yb = b.year ? parseInt(b.year, 10) : null;
  if (ya !== null && yb !== null && !isNaN(ya) && !isNaN(yb) && Math.abs(ya - yb) < 25) sim += 0.1;
  const ta = (a.title || '').toLowerCase();
  const tb = (b.title || '').toLowerCase();
  if (ta && tb) sim += trigramSim(ta, tb) * 0.4;
  return Math.min(1, sim);
}
function mmrRerank(ranked, lambda = 0.5, limit = Infinity) {
  if (!Array.isArray(ranked) || ranked.length < 2) return ranked;
  const remaining = ranked.slice();
  const selected = [];
  const n = Math.min(limit, remaining.length);
  const relOf = (item) => {
    const idx = remaining.indexOf(item);
    return idx === -1 ? 0 : 1 - idx / ranked.length;
  };
  selected.push(remaining.shift());
  while (selected.length < n && remaining.length) {
    let bestIdx = 0, bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const rel = relOf(cand);
      let maxSim = 0;
      for (const s of selected) {
        const sim = itemSimilarity(cand, s);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestScore) { bestScore = mmr; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  return selected.concat(remaining);
}

describe('mmrRerank', () => {
  it('returns short arrays unchanged', () => {
    expect(mmrRerank([])).toEqual([]);
    const one = [{url:'a'}];
    expect(mmrRerank(one)).toBe(one);
  });
  it('keeps the top-ranked item first', () => {
    const ranked = [
      {url:'1', artist:'van gogh'},
      {url:'2', artist:'van gogh'},
      {url:'3', artist:'monet'},
    ];
    expect(mmrRerank(ranked)[0].url).toBe('1');
  });
  it('breaks clumping of same-artist items', () => {
    const ranked = [
      {url:'1', artist:'van gogh', title:'starry night'},
      {url:'2', artist:'van gogh', title:'sunflowers'},
      {url:'3', artist:'van gogh', title:'self portrait'},
      {url:'4', artist:'monet',    title:'water lilies'},
      {url:'5', artist:'picasso',  title:'guernica'},
    ];
    const out = mmrRerank(ranked, 0.5).map(x => x.url);
    // After the first Van Gogh, the next pick should NOT be another Van Gogh
    expect(['4','5']).toContain(out[1]);
  });
});

// ── Orientation detection ──
function orientationOf(item) {
  const w = +item.width || 0;
  const h = +item.height || 0;
  if (w && h) {
    const r = w / h;
    if (r > 1.15) return 'landscape';
    if (r < 1 / 1.15) return 'portrait';
    return 'square';
  }
  return item._aspect || null;
}

describe('orientationOf', () => {
  it('returns null when no dimensions and no fallback', () => {
    expect(orientationOf({})).toBe(null);
  });
  it('falls back to item._aspect if no dimensions', () => {
    expect(orientationOf({_aspect: 'portrait'})).toBe('portrait');
  });
  it('detects square within tolerance', () => {
    expect(orientationOf({width: 1000, height: 1000})).toBe('square');
    expect(orientationOf({width: 1000, height: 950})).toBe('square');
  });
  it('detects landscape / portrait', () => {
    expect(orientationOf({width: 1600, height: 900})).toBe('landscape');
    expect(orientationOf({width: 600, height: 900})).toBe('portrait');
  });
  it('API dimensions win over _aspect fallback', () => {
    expect(orientationOf({width: 1600, height: 900, _aspect: 'portrait'})).toBe('landscape');
  });
});
