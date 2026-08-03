/**
 * InspoSearch — Throttle-awareness tests
 *
 * Regression cover for the Week-1 fix: an HTTP 429 means a source is BUSY,
 * not BROKEN. Before this, a throttled source returned an empty array, the
 * health tracker counted it as a miss, and five misses paused the source for
 * five minutes — which is why result quality visibly decayed across a run of
 * searches once the API worker's rate limit was hit.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { noteThrottled, wasRecentlyThrottled, _resetThrottleState } from '../src/core.js';

describe('throttle tracking', () => {
  beforeEach(() => { _resetThrottleState(); });
  afterEach(() => { vi.useRealTimers(); });

  it('reports no throttle in a clean state', () => {
    expect(wasRecentlyThrottled()).toBe(false);
  });

  it('reports a throttle immediately after one is recorded', () => {
    noteThrottled();
    expect(wasRecentlyThrottled()).toBe(true);
  });

  it('keeps reporting throttled across an in-flight fan-out', () => {
    vi.useFakeTimers();
    noteThrottled();
    // Sources called early in a search must still count as throttled when
    // their siblings hit the limit seconds later.
    vi.advanceTimersByTime(10_000);
    expect(wasRecentlyThrottled()).toBe(true);
  });

  it('expires the throttle window so sources are not exempt forever', () => {
    vi.useFakeTimers();
    noteThrottled();
    vi.advanceTimersByTime(20_000);
    expect(wasRecentlyThrottled()).toBe(false);
  });

  it('re-arms on a fresh throttle after expiry', () => {
    vi.useFakeTimers();
    noteThrottled();
    vi.advanceTimersByTime(20_000);
    expect(wasRecentlyThrottled()).toBe(false);
    noteThrottled();
    expect(wasRecentlyThrottled()).toBe(true);
  });
});
