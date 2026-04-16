import { defineConfig, devices } from '@playwright/test';

/**
 * ValidationLabs Universal Playwright Configuration
 *
 * Reads target URL from PLAYWRIGHT_BASE_URL environment variable.
 * Set this in your .env file to point at your live deployment.
 * Falls back to localhost:3000 for local development.
 *
 * No hardcoded app URLs — this config works for any ValidationLabs project.
 *
 * Per ValidationLabs Constitution XII: Every deployment MUST run
 * the full Playwright E2E suite before being considered production-ready.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [
        ['json', { outputFile: 'e2e-results/results.json' }],
        ['html', { open: 'never', outputFolder: 'e2e-results/html' }],
      ]
    : [['html', { open: 'on-failure' }]],

  use: {
    // Reads from .env via speckit.ps1 or set directly in CI
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer intentionally omitted:
  // Tests target the live production/staging deployment URL.
  // Use PLAYWRIGHT_BASE_URL to configure the target.
});
