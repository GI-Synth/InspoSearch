/**
 * InspoSearch — API Worker Unit Tests
 *
 * Covers the two Week-1 security/availability fixes:
 *   1. /proxy host gating (previously an open proxy via spoofable Origin)
 *   2. per-endpoint rate-limit tiering (previously a flat 60/min that a
 *      single search exhausted)
 */
import { describe, it, expect } from 'vitest';
import { isAllowedProxyHost, isPrivateOrLocalHost, rateTierFor } from '../api/worker.js';

describe('isAllowedProxyHost', () => {
  it('allows exact hosts from the legacy allowlist', () => {
    expect(isAllowedProxyHost('collectionapi.metmuseum.org')).toBe(true);
    expect(isAllowedProxyHost('search.artsmia.org')).toBe(true);
  });

  it('allows subdomains of allowlisted institution domains', () => {
    expect(isAllowedProxyHost('api.artic.edu')).toBe(true);
    expect(isAllowedProxyHost('iiif.artic.edu')).toBe(true);
    expect(isAllowedProxyHost('collections.vam.ac.uk')).toBe(true);
    expect(isAllowedProxyHost('anything.museum-digital.de')).toBe(true);
  });

  it('allows the bare institution domain', () => {
    expect(isAllowedProxyHost('metmuseum.org')).toBe(true);
    expect(isAllowedProxyHost('europeana.eu')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAllowedProxyHost('API.ARTIC.EDU')).toBe(true);
  });

  // The regression this fix exists for: Origin used to grant blanket access.
  it('rejects arbitrary internet hosts', () => {
    expect(isAllowedProxyHost('example.com')).toBe(false);
    expect(isAllowedProxyHost('evil.tld')).toBe(false);
    expect(isAllowedProxyHost('api.openai.com')).toBe(false);
  });

  // Suffix matching must not be a naive substring/endsWith on the bare domain.
  it('rejects look-alike domains that merely end with an allowed name', () => {
    expect(isAllowedProxyHost('evilmetmuseum.org')).toBe(false);
    expect(isAllowedProxyHost('notartic.edu')).toBe(false);
    expect(isAllowedProxyHost('metmuseum.org.attacker.com')).toBe(false);
  });

  it('rejects empty or malformed hostnames', () => {
    expect(isAllowedProxyHost('')).toBe(false);
    expect(isAllowedProxyHost(undefined)).toBe(false);
  });
});

describe('isPrivateOrLocalHost (SSRF guard)', () => {
  it('blocks loopback and localhost', () => {
    expect(isPrivateOrLocalHost('127.0.0.1')).toBe(true);
    expect(isPrivateOrLocalHost('localhost')).toBe(true);
    expect(isPrivateOrLocalHost('::1')).toBe(true);
  });

  it('blocks RFC1918 private ranges', () => {
    expect(isPrivateOrLocalHost('10.0.0.5')).toBe(true);
    expect(isPrivateOrLocalHost('192.168.1.1')).toBe(true);
    expect(isPrivateOrLocalHost('172.16.0.1')).toBe(true);
    expect(isPrivateOrLocalHost('172.31.255.255')).toBe(true);
  });

  it('blocks cloud metadata and link-local', () => {
    expect(isPrivateOrLocalHost('169.254.169.254')).toBe(true);
    expect(isPrivateOrLocalHost('169.254.0.1')).toBe(true);
  });

  it('allows ordinary public hosts', () => {
    expect(isPrivateOrLocalHost('api.artic.edu')).toBe(false);
    expect(isPrivateOrLocalHost('172.32.0.1')).toBe(false); // just outside RFC1918
  });
});

describe('rateTierFor', () => {
  it('gives /proxy its own tier so a search fan-out cannot starve reads', () => {
    expect(rateTierFor('/proxy')).toBe('proxy');
  });

  it('tiers AI inference separately', () => {
    expect(rateTierFor('/caption')).toBe('ai');
    expect(rateTierFor('/semantic')).toBe('ai');
    expect(rateTierFor('/tags')).toBe('ai');
  });

  it('tiers KV writes most tightly', () => {
    expect(rateTierFor('/board')).toBe('write');
    expect(rateTierFor('/contribute')).toBe('write');
  });

  it('defaults everything else to the read tier', () => {
    expect(rateTierFor('/health')).toBe('read');
    expect(rateTierFor('/sources')).toBe('read');
    expect(rateTierFor('/search')).toBe('read');
    expect(rateTierFor('/unknown')).toBe('read');
  });
});

describe('retired sources', () => {
  it('excludes NXDOMAIN sources from ALL_SOURCES so they stop burning request slots', async () => {
    const { ALL_SOURCES, RETIRED_SOURCES } = await import('../src/state.js');
    expect(RETIRED_SOURCES.size).toBeGreaterThan(0);
    for (const id of RETIRED_SOURCES) {
      expect(ALL_SOURCES).not.toContain(id);
    }
  });

  it('keeps the rest of the registry intact', async () => {
    const { ALL_SOURCES } = await import('../src/state.js');
    expect(ALL_SOURCES).toContain('met');
    expect(ALL_SOURCES).toContain('cleveland');
    expect(ALL_SOURCES.length).toBeGreaterThan(200);
  });
});

describe('server-held API keys', () => {
  it('maps key-gated hosts (and their subdomains) to the right secret', async () => {
    const { serverKeyForHost } = await import('../api/worker.js');
    expect(serverKeyForHost('api.europeana.eu')).toBe('EUROPEANA_KEY');
    expect(serverKeyForHost('api.harvardartmuseums.org')).toBe('HARVARD_KEY');
    expect(serverKeyForHost('api.dp.la')).toBe('DPLA_KEY');
    expect(serverKeyForHost('api.si.edu')).toBe('SMITHSONIAN_KEY');
    expect(serverKeyForHost('api.nla.gov.au')).toBe('TROVE_KEY');
    expect(serverKeyForHost('api.pexels.com')).toBe('PEXELS_KEY');
    expect(serverKeyForHost('pixabay.com')).toBe('PIXABAY_KEY');
    expect(serverKeyForHost('api.unsplash.com')).toBe('UNSPLASH_KEY');
  });

  it('returns no secret for hosts that are not key-gated', async () => {
    const { serverKeyForHost } = await import('../api/worker.js');
    expect(serverKeyForHost('api.artic.edu')).toBe(null);
    expect(serverKeyForHost('example.com')).toBe(null);
  });

  // A sentinel aimed at one API must never be able to surface another's key.
  it('does not let a look-alike host claim a secret', async () => {
    const { serverKeyForHost } = await import('../api/worker.js');
    expect(serverKeyForHost('notpexels.com')).toBe(null);
    expect(serverKeyForHost('europeana.eu.attacker.com')).toBe(null);
  });

  it('advertises only the keys this deployment actually holds', async () => {
    const { availableServerKeys } = await import('../api/worker.js');
    expect(availableServerKeys({})).toEqual([]);
    expect(availableServerKeys({ EUROPEANA_KEY: '' })).toEqual([]);
    expect(availableServerKeys({ EUROPEANA_KEY: 'abc', PEXELS_KEY: 'def' }))
      .toEqual(['EUROPEANA_KEY', 'PEXELS_KEY']);
  });
});
