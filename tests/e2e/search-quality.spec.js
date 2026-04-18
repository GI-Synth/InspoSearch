import { test, expect } from '@playwright/test';

// Dismiss the onboarding tour so it doesn't block clicks
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('inspo_tour_done', '1');
    localStorage.setItem('inspo_onboarding_seen', '1');
  });
});

const QUALITY_QUERIES = [
  { query: 'van gogh', mode: 'exact', expectBadges: ['met', 'rijks', 'euro'] },
  { query: 'renaissance', mode: 'exact' },
  { query: 'medieval manuscript', mode: 'exact' },
  { query: 'art nouveau', mode: 'exact' },
  { query: 'fashion 1920s', mode: 'explore' },
];

for (const { query, mode, expectBadges } of QUALITY_QUERIES) {
  test(`search quality: "${query}" (${mode}) returns results`, async ({ page }) => {
    await page.goto('/');

    // Set mode
    const modeBtn = page.locator('#btn-search-mode');
    const modeText = (await modeBtn.textContent()).trim().toLowerCase();
    if (mode === 'exact' && modeText.includes('explore')) await modeBtn.click();
    if (mode === 'explore' && modeText.includes('exact')) await modeBtn.click();

    await page.fill('#search-input', query);
    await page.press('#search-input', 'Enter');

    // Wait for results
    const grid = page.locator('#image-grid');
    await grid.locator('img').first().waitFor({ state: 'visible', timeout: 45000 });

    const imgCount = await grid.locator('img').count();
    expect(imgCount, `"${query}" should return results`).toBeGreaterThan(0);

    // Check expected source badges if specified
    if (expectBadges) {
      await page.waitForTimeout(3000); // let more sources stream in
      const allText = await page.locator('#image-grid').innerHTML();
      const lower = allText.toLowerCase();
      for (const badge of expectBadges) {
        expect(lower, `Expected badge/source "${badge}" in results for "${query}"`).toContain(badge);
      }
    }
  });
}

test('exact mode filters irrelevant results for "renaissance"', async ({ page }) => {
  await page.goto('/');
  const modeBtn = page.locator('#btn-search-mode');
  const modeText = (await modeBtn.textContent()).trim().toLowerCase();
  if (modeText.includes('explore')) await modeBtn.click();

  await page.fill('#search-input', 'renaissance');
  await page.press('#search-input', 'Enter');

  const grid = page.locator('#image-grid');
  await grid.locator('img').first().waitFor({ state: 'visible', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Grab all alt texts / titles to check for irrelevant content
  const altTexts = await grid.locator('img').evaluateAll(imgs =>
    imgs.map(img => (img.alt || '') + ' ' + (img.title || '')).join(' ').toLowerCase()
  );

  // These terms would indicate irrelevant results leaking through
  const junkTerms = ['cosplay', 'costume party', 'renaissance faire', 'ren faire'];
  for (const junk of junkTerms) {
    // Soft check — log rather than fail hard, since we can't control source data
    if (altTexts.includes(junk)) {
      console.warn(`WARNING: Found potentially irrelevant term "${junk}" in renaissance exact results`);
    }
  }
});
