import { test, expect } from '@playwright/test';

// Codifies both paths from E2E_BROWSER_REVIEW.md:
//   1. Grant consent → POST /tags 200 → POST /contribute fires → localStorage set
//   2. Deny consent → POST /tags 200 → POST /contribute NOT fired → token stays null

const API_BASE = 'https://insposearch-api.official-ndsclsd.workers.dev';
const TAGS_MOCK = {
  tags: ['medieval', 'religious', 'painting', 'art'],
  description: '["medieval","religious","painting","art"]',
  model: '@cf/llava-hf/llava-1.5-7b-hf',
  primaryError: null,
};

test.describe('Workers AI consent flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('inspo_tour_done', '1');
      localStorage.setItem('inspo_onboarding_seen', '1');
      localStorage.setItem('inspo_onboarded', '1');
      localStorage.removeItem('inspo_ai_consent');
      localStorage.removeItem('inspo_ai_consent_token');
    });

    // Intercept worker calls so the test doesn't depend on live AI latency.
    await page.route(`${API_BASE}/tags`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TAGS_MOCK) })
    );
    await page.route(`${API_BASE}/contribute`, route =>
      route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true, stored: false, stage: 'stub-d1-pending' }) })
    );
  });

  test('grant path: /tags + /contribute fire, consent token persists', async ({ page }) => {
    const calls = [];
    page.on('request', r => {
      if (r.url().startsWith(API_BASE)) calls.push({ url: r.url(), method: r.method() });
    });

    await page.goto('/?q=monet+water+lilies');
    await page.locator('#image-grid .image-card').first().waitFor({ timeout: 15_000 });
    await page.locator('#image-grid .image-card').first().click();
    await page.locator('#analyse-btn').click();

    const grantBtn = page.locator('#ai-consent-grant');
    await expect(grantBtn).toBeVisible();
    await grantBtn.click();

    await page.waitForResponse(r => r.url().includes('/contribute'), { timeout: 15_000 });

    expect(calls.some(c => c.url.endsWith('/tags') && c.method === 'POST')).toBe(true);
    expect(calls.some(c => c.url.endsWith('/contribute') && c.method === 'POST')).toBe(true);

    const consent = await page.evaluate(() => localStorage.getItem('inspo_ai_consent'));
    const token = await page.evaluate(() => localStorage.getItem('inspo_ai_consent_token'));
    expect(consent).toBe('granted');
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  test('deny path: /tags fires, /contribute does NOT, token stays null', async ({ page }) => {
    const calls = [];
    page.on('request', r => {
      if (r.url().startsWith(API_BASE)) calls.push({ url: r.url(), method: r.method() });
    });

    await page.goto('/?q=hokusai+wave');
    await page.locator('#image-grid .image-card').first().waitFor({ timeout: 15_000 });
    await page.locator('#image-grid .image-card').first().click();
    await page.locator('#analyse-btn').click();

    const denyBtn = page.locator('#ai-consent-deny');
    await expect(denyBtn).toBeVisible();
    await denyBtn.click();

    await page.waitForResponse(r => r.url().includes('/tags'), { timeout: 15_000 });
    // Give any stray /contribute a chance to fire — it shouldn't.
    await page.waitForTimeout(1000);

    expect(calls.some(c => c.url.endsWith('/tags') && c.method === 'POST')).toBe(true);
    expect(calls.some(c => c.url.endsWith('/contribute'))).toBe(false);

    const consent = await page.evaluate(() => localStorage.getItem('inspo_ai_consent'));
    const token = await page.evaluate(() => localStorage.getItem('inspo_ai_consent_token'));
    expect(consent).toBe('denied');
    expect(token).toBeNull();
  });
});
