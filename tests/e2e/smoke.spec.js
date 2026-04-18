import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Dismiss the onboarding tour so it doesn't block clicks
    await page.addInitScript(() => {
      localStorage.setItem('inspo_tour_done', '1');
      localStorage.setItem('inspo_onboarding_seen', '1');
    });
  });

  test('page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/insposearch/i);
  });

  test('search input exists and is focusable', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#search-input');
    await expect(input).toBeVisible();
    await input.focus();
    await expect(input).toBeFocused();
  });

  test('search mode toggle works', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#btn-search-mode');
    await expect(btn).toBeVisible();
    const initialText = await btn.textContent();
    await btn.click();
    const newText = await btn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('sidebar elements are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1.logo')).toContainText('insposearch');
    await expect(page.locator('#count-slider')).toBeVisible();
    await expect(page.locator('#btn-grid')).toBeVisible();
    await expect(page.locator('#btn-board')).toBeVisible();
    await expect(page.locator('#btn-3d')).toBeVisible();
    await expect(page.locator('#btn-keys')).toBeVisible();
    await expect(page.locator('#btn-ai-chat')).toBeVisible();
  });

  test('theme toggle switches theme', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#theme-toggle');
    const htmlEl = page.locator('html');
    const classBefore = await htmlEl.getAttribute('class') || '';
    const dataBefore = await htmlEl.getAttribute('data-theme') || '';
    await toggle.click();
    await page.waitForTimeout(300);
    const classAfter = await htmlEl.getAttribute('class') || '';
    const dataAfter = await htmlEl.getAttribute('data-theme') || '';
    expect(classAfter + dataAfter).not.toBe(classBefore + dataBefore);
  });

  test('search returns results for "monet"', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'monet');
    await page.press('#search-input', 'Enter');
    const grid = page.locator('#image-grid');
    await expect(grid.locator('img').first()).toBeVisible({ timeout: 45000 });
    const count = await grid.locator('img').count();
    expect(count).toBeGreaterThan(0);
  });

  test('image click opens detail panel', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'rembrandt');
    await page.press('#search-input', 'Enter');
    const grid = page.locator('#image-grid');
    const firstImg = grid.locator('img').first();
    await firstImg.waitFor({ state: 'visible', timeout: 45000 });
    await firstImg.click();
    // Detail panel or overlay should appear
    const panel = page.locator('#image-panel, .detail-panel, .overlay-panel, [role="dialog"], .panel');
    await expect(panel.first()).toBeVisible({ timeout: 10000 });
  });

  test('institutions page loads', async ({ page }) => {
    await page.goto('/institutions');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('color filter buttons exist', async ({ page }) => {
    await page.goto('/');
    const swatches = page.locator('.color-swatch-btn');
    const count = await swatches.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('image count slider adjusts label', async ({ page }) => {
    await page.goto('/');
    const slider = page.locator('#count-slider');
    const label = page.locator('#count-label');
    await slider.fill('100');
    await slider.dispatchEvent('input');
    await page.waitForTimeout(500);
    const text = await label.textContent();
    expect(text).toContain('100');
  });

  test('PWA manifest is valid JSON', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.name).toBeTruthy();
    expect(json.start_url).toBeTruthy();
  });

  test('view toggle buttons work', async ({ page }) => {
    await page.goto('/');
    const boardBtn = page.locator('#btn-board');
    await boardBtn.click();
    await expect(boardBtn).toHaveClass(/active/);
    const gridBtn = page.locator('#btn-grid');
    await gridBtn.click();
    await expect(gridBtn).toHaveClass(/active/);
  });

  test('API keys panel opens', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-keys').click();
    // Should show a keys panel/section
    const keysSection = page.locator('#keys-panel, .keys-panel, [id*="key"], .api-keys');
    await expect(keysSection.first()).toBeVisible({ timeout: 5000 });
  });
});
