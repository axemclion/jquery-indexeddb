const { test, expect } = require('@playwright/test');

test('QUnit tests all pass', async ({ page }) => {
  await page.goto('/test/index.html');

  // Wait for QUnit to finish running (the #qunit-testresult element shows final stats)
  await page.waitForFunction(() => {
    const result = document.getElementById('qunit-testresult');
    return result && result.textContent.includes('Tests completed');
  }, { timeout: 60000 });

  // Check for failures
  const failed = await page.evaluate(() => {
    const result = document.getElementById('qunit-testresult');
    const text = result ? result.textContent : '';
    // QUnit shows "X failed" in the result
    const match = text.match(/(\d+) failed/);
    return match ? parseInt(match[1]) : 0;
  });

  expect(failed).toBe(0);
});
