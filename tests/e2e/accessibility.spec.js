import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('inspo_tour_done', '1');
      localStorage.setItem('inspo_onboarding_seen', '1');
    });
  });

  test('skip link exists and points to image grid', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('a.skip-link, a[href="#image-grid"]');
    await expect(skip.first()).toBeAttached();
    const href = await skip.first().getAttribute('href');
    expect(href).toContain('image-grid');
  });

  test('search input has aria-label', async ({ page }) => {
    await page.goto('/');
    const label = await page.locator('#search-input').getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('all visible buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    const missingLabel = [];
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute('aria-label');
      const text = (await btn.textContent()).trim();
      const title = await btn.getAttribute('title');
      if (!label && !text && !title) {
        const html = await btn.evaluate(el => el.outerHTML.slice(0, 100));
        missingLabel.push(html);
      }
    }
    expect(missingLabel, `Buttons missing accessible names:\n${missingLabel.join('\n')}`).toHaveLength(0);
  });

  test('images have alt text after search', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'portrait');
    await page.press('#search-input', 'Enter');
    await page.locator('#image-grid img').first().waitFor({ state: 'visible', timeout: 45000 });

    const images = page.locator('#image-grid img');
    const count = await images.count();
    const missingAlt = [];
    const checkCount = Math.min(count, 12);
    for (let i = 0; i < checkCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (!alt) missingAlt.push(i);
    }
    expect(missingAlt, `Images missing alt text at indices: ${missingAlt.join(', ')}`).toHaveLength(0);
  });

  test('slider has aria-label', async ({ page }) => {
    await page.goto('/');
    const label = await page.locator('#count-slider').getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('view toggle buttons have role="radio"', async ({ page }) => {
    await page.goto('/');
    const gridRole = await page.locator('#btn-grid').getAttribute('role');
    const boardRole = await page.locator('#btn-board').getAttribute('role');
    expect(gridRole).toBe('radio');
    expect(boardRole).toBe('radio');
  });

  test('loading indicator has aria-live', async ({ page }) => {
    await page.goto('/');
    const live = await page.locator('#loading-indicator').getAttribute('aria-live');
    expect(live).toBeTruthy();
  });

  test('no duplicate IDs on page', async ({ page }) => {
    await page.goto('/');
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      const seen = new Set();
      const dupes = [];
      for (const id of ids) {
        if (seen.has(id)) dupes.push(id);
        seen.add(id);
      }
      return dupes;
    });
    expect(duplicates, `Duplicate IDs found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('page language is set', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });
});
