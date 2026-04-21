/**
 * Tests for src/sourceCount.js — the single source of truth for active/total
 * source counts and reachable federated-institution counts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { STATE } from '../src/state.js';
import {
  computeSourceCount,
  pickKeys,
  formatHeadline,
  KEY_VARS,
  SOURCE_COUNTS_META,
} from '../src/sourceCount.js';

function clearKeys() {
  for (const k of KEY_VARS) STATE[k] = null;
}

describe('sourceCount metadata', () => {
  it('has a non-empty compact audit', () => {
    expect(SOURCE_COUNTS_META.total_entries).toBeGreaterThan(200);
    expect(SOURCE_COUNTS_META.schema_version).toBe(3);
  });
  it('exposes only access-gating keys', () => {
    expect(KEY_VARS).toContain('europeanaKey');
    expect(KEY_VARS).toContain('troveKey');
    // smithsonianKey is optional (lifts rate limits only, does not gate
    // access) — it should NOT appear in KEY_VARS.
    expect(KEY_VARS).not.toContain('smithsonianKey');
  });
});

describe('pickKeys', () => {
  beforeEach(clearKeys);
  it('returns an empty snapshot when no keys are set', () => {
    expect(pickKeys()).toEqual({});
  });
  it('only includes truthy non-empty strings', () => {
    STATE.europeanaKey = 'abc';
    STATE.harvardKey = '   ';
    STATE.pexelsKey = '';
    const keys = pickKeys();
    expect(keys.europeanaKey).toBe(true);
    expect(keys.harvardKey).toBeUndefined();
    expect(keys.pexelsKey).toBeUndefined();
  });
});

describe('computeSourceCount — zero keys', () => {
  beforeEach(clearKeys);
  it('matches the headline baseline from the audit', () => {
    const c = computeSourceCount({});
    expect(c.total).toBeGreaterThan(280);
    // Zero-key active must equal "no_key" or "optional key" sources.
    expect(c.active).toBeGreaterThanOrEqual(240);
    expect(c.active).toBeLessThan(c.total);
    // Federated-institution count should match the audit's zero-key baseline.
    expect(c.federatedActive).toBeGreaterThanOrEqual(7000);
    expect(c.federatedActive).toBeLessThan(c.federatedMax);
  });
  it('reports key-gated sources as missing', () => {
    const c = computeSourceCount({});
    expect(c.keysMissing).toContain('europeanaKey');
    expect(c.keysMissing).toContain('dplaKey');
  });
  it('inactive + active + broken = total', () => {
    const c = computeSourceCount({});
    expect(c.active + c.inactive + c.broken).toBe(c.total);
  });
});

describe('computeSourceCount — europeanaKey enabled', () => {
  beforeEach(clearKeys);
  it('reactivates Europeana + its 20 sub-collections', () => {
    const before = computeSourceCount({});
    const after = computeSourceCount({ europeanaKey: true });
    expect(after.active).toBeGreaterThan(before.active);
    expect(after.keysMissing).not.toContain('europeanaKey');
    // Europeana federated provider count (~4260) should land in the delta.
    expect(after.federatedActive - before.federatedActive).toBeGreaterThan(4000);
  });
});

describe('computeSourceCount — all keys enabled', () => {
  it('unlocks the maximum', () => {
    const keys = Object.fromEntries(KEY_VARS.map(k => [k, true]));
    const c = computeSourceCount(keys);
    expect(c.keysMissing).toEqual([]);
    expect(c.federatedActive).toBe(c.federatedMax);
    expect(c.active + c.broken).toBe(c.total);
  });
});

describe('formatHeadline', () => {
  it('produces a stable one-line string', () => {
    const s = formatHeadline(computeSourceCount({}));
    expect(s).toMatch(/\/\d+ sources active/);
    expect(s).toMatch(/federated institutions/);
  });
});
