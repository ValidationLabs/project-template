#!/usr/bin/env node
/**
 * scripts/capture-release-screenshots.js
 *
 * Uses Playwright to capture full-page screenshots and video clips
 * of every route defined in release-manifest.json.
 *
 * Outputs to: release-artifacts/{sha}/screenshots/*.png
 *             release-artifacts/{sha}/videos/*.webm
 *
 * Environment variables required:
 *   PLAYWRIGHT_BASE_URL   - Live deployment URL
 *   RELEASE_SHA           - Git commit SHA (used as folder name)
 *   RELEASE_TEST_EMAIL    - Test account for auth-gated routes (optional)
 *   RELEASE_TEST_PASSWORD - Test account password (optional)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const sha = process.env.RELEASE_SHA || 'local';
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const outputDir = path.join('release-artifacts', sha);
  const screenshotsDir = path.join(outputDir, 'screenshots');
  const videosDir = path.join(outputDir, 'videos');

  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  // Load route manifest
  const manifest = JSON.parse(fs.readFileSync('release-manifest.json', 'utf8'));
  const routes = manifest.routes || [];

  console.log(`[release-intelligence] Capturing ${routes.length} routes from ${baseUrl}`);

  const browser = await chromium.launch();
  const capturedScreenshots = [];

  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    const slug = route.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const screenshotFile = path.join(screenshotsDir, `${slug}.png`);
    const videoFile = path.join(videosDir, `${slug}.webm`);

    const captureVideo = (manifest.captureVideo || []).includes(route.path);

    console.log(`  -> Capturing: ${route.label} (${url})`);

    try {
      const contextOptions = captureVideo
        ? { recordVideo: { dir: videosDir, size: { width: 1280, height: 720 } } }
        : {};

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ...contextOptions,
      });
      const page = await context.newPage();

      // Handle auth-required routes
      if (route.authRequired && process.env.RELEASE_TEST_EMAIL) {
        // Navigate to root first, attempt sign-in if possible
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 15000 });
        // App-specific: look for sign-in inputs
        const emailInput = page.getByPlaceholder('Email Address').or(page.getByPlaceholder('Email'));
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailInput.fill(process.env.RELEASE_TEST_EMAIL);
          const passInput = page.getByPlaceholder('Password');
          if (await passInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await passInput.fill(process.env.RELEASE_TEST_PASSWORD || '');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
          }
        }
      }

      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500); // Let animations settle

      await page.screenshot({
        path: screenshotFile,
        fullPage: route.fullPage !== false,
      });

      capturedScreenshots.push({
        route: route.path,
        label: route.label,
        file: screenshotFile,
        slug,
      });

      if (captureVideo) {
        await page.waitForTimeout(3000); // Capture a few seconds of video
        await context.close();
        // Playwright saves video after context close
        const videoFiles = fs.readdirSync(videosDir).filter(f => f.endsWith('.webm'));
        if (videoFiles.length > 0) {
          const latestVideo = videoFiles.sort().pop();
          fs.renameSync(path.join(videosDir, latestVideo), videoFile);
        }
      } else {
        await context.close();
      }

      console.log(`     OK: ${screenshotFile}`);
    } catch (err) {
      console.error(`     FAILED: ${route.label} — ${err.message}`);
      capturedScreenshots.push({
        route: route.path,
        label: route.label,
        file: null,
        slug,
        error: err.message,
      });
    }
  }

  await browser.close();

  // Write manifest for next steps
  fs.writeFileSync(
    path.join(outputDir, 'screenshot-manifest.json'),
    JSON.stringify(capturedScreenshots, null, 2)
  );

  console.log(`[release-intelligence] Screenshots complete: ${capturedScreenshots.filter(s => s.file).length}/${routes.length} captured`);
}

main().catch(err => {
  console.error('[release-intelligence] Screenshot capture failed:', err);
  process.exit(1);
});
