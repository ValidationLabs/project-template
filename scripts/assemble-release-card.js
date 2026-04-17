#!/usr/bin/env node
/**
 * scripts/assemble-release-card.js
 *
 * Reads the AI summary and screenshot manifest, then assembles
 * a self-contained, branded HTML release brief ("Release Card").
 *
 * The output is a single HTML file with all styles inline —
 * no external dependencies — so it renders correctly from Firebase Storage.
 *
 * Outputs to: release-artifacts/{sha}/release-card.html
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const sha = process.env.RELEASE_SHA || 'local';
  const appName = process.env.APP_NAME || 'ValidationLabs App';
  const outputDir = path.join('release-artifacts', sha);

  // Load AI summary
  const summaryPath = path.join(outputDir, 'ai-summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error('ai-summary.json not found. Run generate-release-summary.js first.');
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

  // Load screenshot manifest
  const screenshotManifestPath = path.join(outputDir, 'screenshot-manifest.json');
  const screenshots = fs.existsSync(screenshotManifestPath)
    ? JSON.parse(fs.readFileSync(screenshotManifestPath, 'utf8'))
    : [];

  // Convert screenshots to base64 for inline embedding
  // (ensures they render even before Firebase upload completes)
  const screenshotData = screenshots
    .filter(s => s.file && fs.existsSync(s.file))
    .map(s => {
      const imgBuffer = fs.readFileSync(s.file);
      const base64 = imgBuffer.toString('base64');
      return { ...s, base64: `data:image/png;base64,${base64}` };
    });

  const impactColors = {
    major: { bg: '#7C3AED', label: '🚀 Major Release' },
    minor: { bg: '#2563EB', label: '✨ Minor Update' },
    patch: { bg: '#059669', label: '🔧 Patch' },
  };
  const impact = impactColors[summary.impactLevel] || impactColors.patch;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const shortSha = sha.slice(0, 7);

  // ─────────────────────────────────────────────────────
  // Build HTML sections
  // ─────────────────────────────────────────────────────

  const screenshotGallery = screenshotData.length > 0
    ? `<div class="gallery">
        ${screenshotData.map(s => `
          <div class="gallery-item">
            <img src="${s.base64}" alt="${s.label}" class="screenshot" />
            <p class="screenshot-label">${s.label}</p>
          </div>
        `).join('')}
      </div>`
    : '';

  const renderSection = (icon, title, items, color) => {
    if (!items || items.length === 0) return '';
    return `
      <div class="section">
        <h3 class="section-title" style="color:${color}">${icon} ${title}</h3>
        <ul class="section-list">
          ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName} Release — ${shortSha}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #F8FAFC;
      color: #1E293B;
      min-height: 100vh;
      padding: 32px 16px;
    }
    .card {
      max-width: 900px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 40px 48px;
      color: white;
    }
    .app-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 100px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .impact-badge {
      display: inline-block;
      background: ${impact.bg};
      color: white;
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-left: 12px;
      vertical-align: middle;
    }
    .headline {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    .meta {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      font-weight: 500;
    }
    .card-body { padding: 40px 48px; }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }
    .gallery-item {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
    }
    .screenshot {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 220px;
    }
    .screenshot-label {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #64748B;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .section-list li {
      padding: 10px 14px;
      background: #F8FAFC;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      border-left: 3px solid currentColor;
      color: #334155;
    }
    .tech-note {
      margin-top: 32px;
      padding: 16px 20px;
      background: #F1F5F9;
      border-radius: 10px;
      font-size: 12px;
      color: #64748B;
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
      font-size: 12px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media (max-width: 600px) {
      .card-header, .card-body { padding: 24px; }
      .headline { font-size: 20px; }
      .gallery { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="app-badge">⚡ ${appName}</div>
      <h1 class="headline">
        ${summary.headline}
        <span class="impact-badge">${impact.label}</span>
      </h1>
      <p class="meta">${dateStr} &nbsp;·&nbsp; Commit <code>${shortSha}</code></p>
    </div>

    <div class="card-body">
      ${screenshotGallery}

      ${renderSection('✨', "What's New", summary.whatsNew, '#7C3AED')}
      ${renderSection('🐛', "What's Fixed", summary.whatsFixed, '#059669')}
      ${renderSection('📊', "What Changed", summary.whatsChanged, '#2563EB')}

      ${summary.technicalNote ? `
      <div class="tech-note">
        <strong>Technical note:</strong> ${summary.technicalNote}
      </div>` : ''}

      <div class="footer">
        <span>Generated by ValidationLabs Release Intelligence</span>
        <span>${sha}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  const outputPath = path.join(outputDir, 'release-card.html');
  fs.writeFileSync(outputPath, html);
  console.log(`[release-intelligence] Release card assembled: ${outputPath}`);
}

main().catch(err => {
  console.error('[release-intelligence] Assembly failed:', err);
  process.exit(1);
});
