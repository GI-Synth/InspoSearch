/**
 * sourceCount.js — single source of truth for active/total source counts.
 *
 * One function, one number set. Reads the compact audit derived from
 * src/state.js + live aggregator endpoints, combined with the caller's
 * current key state, and returns both top-level-source counts and
 * federated-institution counts (subsource).
 *
 * See insposearch/data/_source_counts.json (generated from
 * insposearch/data/_source_audit.json).
 */

import COUNTS from '../insposearch/data/_source_counts.json' with { type: 'json' };
import { STATE, SOURCE_META } from './state.js';

export const SOURCE_COUNTS_META = {
  generated_at: COUNTS.generated_at,
  schema_version: COUNTS.schema_version,
  total_entries: Object.keys(COUNTS.sources).length,
};

/**
 * All API key state-var names a user can set. Used to derive `keysMissing`
 * and to snapshot the current key environment from STATE.
 */
export const KEY_VARS = (() => {
  const set = new Set();
  for (const s of Object.values(COUNTS.sources)) if (s.k) set.add(s.k);
  return [...set].sort();
})();

/** Snapshot the current key environment from STATE (non-empty strings only). */
export function pickKeys(state = STATE) {
  const out = {};
  for (const k of KEY_VARS) {
    const v = state?.[k];
    if (typeof v === 'string' && v.trim()) out[k] = true;
  }
  return out;
}

/**
 * A source is "reachable" when:
 *   - it has an adapter wired, AND
 *   - either it needs no key, OR its required key is present.
 * Smithsonian-style "optional" keys (access=no_key but key_state_var set)
 * don't gate reachability — they only raise limits — so we still mark them
 * reachable without the key.
 */
function reachable(src, meta, keys) {
  if (!src.a) return false;                       // no adapter → dead
  const access = meta?.access || 'no_key';
  if (access === 'no_key') return true;           // always reachable
  if (!src.k) return true;                        // free_key without mapped key var → treat as reachable
  return !!keys[src.k];                           // required key must be present
}

/**
 * Compute the full count set.
 *
 * @param {object} keys   Object with truthy values for present keys.
 *                        Defaults to the live STATE snapshot.
 * @returns {{
 *   total: number,
 *   active: number,
 *   inactive: number,
 *   broken: number,
 *   byCategory: Record<string, {active:number,total:number}>,
 *   byRegion: Record<string, {active:number,total:number}>,
 *   federatedZero: number,
 *   federatedActive: number,
 *   federatedMax: number,
 *   keysApplied: string[],
 *   keysMissing: string[],
 *   derivedAt: string
 * }}
 */
export function computeSourceCount(keys = pickKeys()) {
  let total = 0, active = 0, broken = 0;
  let fedActive = 0, fedZero = 0, fedMax = 0;
  const byCategory = {};
  const byRegion = {};
  const keysMissing = new Set();

  for (const [id, src] of Object.entries(COUNTS.sources)) {
    total += 1;
    const meta = SOURCE_META[id] || {};
    const access = meta.access || 'no_key';

    if (!src.a) {                                  // adapter missing
      broken += 1;
      continue;
    }

    const isReachable = reachable(src, meta, keys);
    if (isReachable) active += 1;
    else if (src.k) keysMissing.add(src.k);

    // Federated-institution math. Proxies are intentionally zero in the
    // audit to avoid double-counting the parent aggregator.
    const n = src.n || 0;
    if (n > 0) {
      fedMax += n;
      if (access === 'no_key') fedZero += n;
      if (isReachable) fedActive += n;
    }

    // Category/region rollups
    const cats = Array.isArray(meta.category) ? meta.category : (meta.category ? [meta.category] : []);
    for (const c of cats) {
      if (!byCategory[c]) byCategory[c] = { active: 0, total: 0 };
      byCategory[c].total += 1;
      if (isReachable) byCategory[c].active += 1;
    }
    const r = meta.region || 'global';
    if (!byRegion[r]) byRegion[r] = { active: 0, total: 0 };
    byRegion[r].total += 1;
    if (isReachable) byRegion[r].active += 1;
  }

  const inactive = total - active - broken;
  const keysApplied = Object.keys(keys).filter(k => keys[k]).sort();

  return {
    total,
    active,
    inactive,
    broken,
    byCategory,
    byRegion,
    federatedZero: fedZero,
    federatedActive: fedActive,
    federatedMax: fedMax,
    keysApplied,
    keysMissing: [...keysMissing].sort(),
    derivedAt: COUNTS.generated_at,
  };
}

/** One-line public headline. Keep output stable — marketing copy reads it. */
export function formatHeadline(count = computeSourceCount()) {
  return `${count.active}/${count.total} sources active · ${count.federatedActive.toLocaleString()} federated institutions reachable`;
}
