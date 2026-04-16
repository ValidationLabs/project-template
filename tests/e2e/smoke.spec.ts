import { test, expect } from '@playwright/test';

/**
 * ValidationLabs Universal Smoke Test Suite
 *
 * These tests run against any ValidationLabs application on day one.
 * They are intentionally generic — your app-specific tests should extend
 * this foundation in additional spec files (e.g., auth.spec.ts, dashboard.spec.ts).
 *
 * Zero configuration required — reads baseURL from playwright.config.ts
 * which reads PLAYWRIGHT_BASE_URL from your .env file.
 *
 * Per ValidationLabs Constitution XII: Every deployment MUST pass
 * this suite before being considered production-ready.
 */

test.describe('Smoke: Availability', () => {
  test('app homepage returns a successful response', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('app renders visible content on the page', async ({ page }) => {
    await page.goto('/');
    // Any app should render at least one visible element
    await expect(page.locator('body')).not.toBeEmpty();
    const bodyText = await page.innerText('body');
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });
});

test.describe('Smoke: Performance', () => {
  test('homepage loads within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });
});

test.describe('Smoke: Auth Guard', () => {
  test('unauthenticated visit to root does not show an error page', async ({ page }) => {
    const response = await page.goto('/');
    // Should not be a hard 4xx/5xx error — app should either show landing or redirect to login
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('page title is not empty', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});

/**
 * ---------- APP-SPECIFIC TESTS BELOW ----------
 *
 * Replace the examples below with selectors that match your application.
 * Use `.\speckit.ps1 e2e --headed` to interactively find selectors.
 *
 * Example: Auth flow test
 *
 * test.describe('Auth Flow', () => {
 *   test('sign in button is visible', async ({ page }) => {
 *     await page.goto('/');
 *     await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
 *   });
 * });
 */
