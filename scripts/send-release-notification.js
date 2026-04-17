#!/usr/bin/env node
/**
 * scripts/send-release-notification.js
 *
 * Sends a release notification email to validationlabs@bcbsfl.com
 * using the Resend API (same service used for VentureWell OTP emails).
 *
 * Called from release-intelligence.yml after Firestore record is written.
 * Email failure does NOT block the pipeline.
 *
 * Environment variables required:
 *   RESEND_API_KEY           - Resend API key (re_ZWPaZw3m_...)
 *   RELEASE_SHA              - Git commit SHA
 *   APP_NAME                 - e.g. "QuantivaAI"
 *   FIREBASE_STORAGE_BUCKET  - For constructing release card URL
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const TO_EMAIL   = 'validationlabs@bcbsfl.com';
const FROM_EMAIL = 'releases@validationlabs.io';
const FROM_NAME  = 'ValidationLabs Release Intelligence';
const PORTAL_URL = 'https://releases.validationlabs.io';

async function main() {
  const sha     = process.env.RELEASE_SHA || 'local';
  const appName = process.env.APP_NAME    || 'ValidationLabs App';
  const bucket  = process.env.FIREBASE_STORAGE_BUCKET;

  const outputDir   = path.join('release-artifacts', sha);
  const summaryPath = path.join(outputDir, 'ai-summary.json');

  if (!fs.existsSync(summaryPath)) {
    console.warn('[release-notification] ai-summary.json not found — skipping email');
    return;
  }

  const summary        = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const releaseCardUrl = `https://storage.googleapis.com/${bucket}/releases/${sha}/release-card.html`;
  const shortSha       = sha.slice(0, 7);
  const impactEmoji    = { major: '🚀', minor: '✨', patch: '🔧' }[summary.impactLevel] || '📦';

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ─────────────────────────────────────────────────────
  // Build section helper
  // ─────────────────────────────────────────────────────
  const buildSection = (icon, title, items) => {
    if (!items || items.length === 0) return '';
    return `
      <tr><td style="padding:0 0 24px 0;">
        <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;
                   color:#6366F1;letter-spacing:0.08em;text-transform:uppercase;">
          ${icon}&nbsp; ${title}
        </p>
        <ul style="margin:0;padding:0 0 0 18px;color:#334155;">
          ${items.map(item =>
            `<li style="font-size:14px;line-height:1.7;margin-bottom:4px;">${item}</li>`
          ).join('')}
        </ul>
      </td></tr>`;
  };

  // ─────────────────────────────────────────────────────
  // HTML email body
  // ─────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
             style="max-width:600px;margin:0 auto;background:#FFFFFF;
                    border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 32px rgba(0,0,0,0.08);">

        <!-- ── Header ─────────────────────────────── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);
                     padding:36px 40px 32px;">
            <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;
                       letter-spacing:0.12em;text-transform:uppercase;
                       color:#6366F1;">
              ValidationLabs · Release Intelligence
            </p>
            <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:800;
                        color:#F8FAFC;line-height:1.35;letter-spacing:-0.01em;">
              ${impactEmoji}&nbsp; ${summary.headline}
            </h1>
            <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
              <strong style="color:#CBD5E1;">${appName}</strong>
              &nbsp;·&nbsp; ${dateStr}
              &nbsp;·&nbsp; <span style="font-family:monospace;background:rgba(255,255,255,0.08);
                                         padding:2px 6px;border-radius:4px;">${shortSha}</span>
            </p>
          </td>
        </tr>

        <!-- ── Body ───────────────────────────────── -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${buildSection('✨', "What's New",     summary.whatsNew)}
              ${buildSection('🐛', "What's Fixed",   summary.whatsFixed)}
              ${buildSection('📊', "What Changed",   summary.whatsChanged)}
            </table>
          </td>
        </tr>

        <!-- ── CTAs ───────────────────────────────── -->
        <tr>
          <td style="padding:8px 40px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${releaseCardUrl}"
                     style="display:inline-block;padding:12px 22px;
                            background:#6366F1;color:#FFFFFF;
                            font-size:14px;font-weight:700;
                            text-decoration:none;border-radius:10px;
                            letter-spacing:-0.01em;">
                    View Release Brief
                  </a>
                </td>
                <td>
                  <a href="${PORTAL_URL}"
                     style="display:inline-block;padding:12px 22px;
                            background:#F8FAFC;color:#334155;
                            border:1px solid #E2E8F0;
                            font-size:14px;font-weight:700;
                            text-decoration:none;border-radius:10px;">
                    All Releases
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Footer ─────────────────────────────── -->
        <tr>
          <td style="padding:16px 40px 20px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">
              Sent automatically after every ValidationLabs deployment.
              &nbsp;<a href="${PORTAL_URL}" style="color:#6366F1;text-decoration:none;">
                View all releases →
              </a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ─────────────────────────────────────────────────────
  // Plain text fallback
  // ─────────────────────────────────────────────────────
  const text =
    `${appName} · ${shortSha} · ${dateStr}\n\n` +
    `${impactEmoji} ${summary.headline}\n\n` +
    (summary.whatsNew?.length
      ? `WHAT'S NEW\n${summary.whatsNew.map(i => `• ${i}`).join('\n')}\n\n` : '') +
    (summary.whatsFixed?.length
      ? `WHAT'S FIXED\n${summary.whatsFixed.map(i => `• ${i}`).join('\n')}\n\n` : '') +
    (summary.whatsChanged?.length
      ? `WHAT CHANGED\n${summary.whatsChanged.map(i => `• ${i}`).join('\n')}\n\n` : '') +
    `View release brief: ${releaseCardUrl}\n` +
    `All releases: ${PORTAL_URL}`;

  // ─────────────────────────────────────────────────────
  // Send via Resend API
  // ─────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[release-notification] RESEND_API_KEY not set — skipping email');
    return;
  }

  const payload = JSON.stringify({
    from:    `${FROM_NAME} <${FROM_EMAIL}>`,
    to:      [TO_EMAIL],
    subject: `${impactEmoji} [${appName}] ${summary.headline}`,
    html,
    text,
  });

  await new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path:     '/emails',
        method:   'POST',
        headers: {
          'Authorization':  `Bearer ${apiKey}`,
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(body);
            console.log(`[release-notification] ✅ Email sent → ${TO_EMAIL} (id: ${parsed.id})`);
          } else {
            // Don't fail the pipeline — log and move on
            console.error(`[release-notification] Resend error ${res.statusCode}: ${body}`);
          }
          resolve();
        });
      }
    );
    req.on('error', err => {
      console.error('[release-notification] Network error:', err.message);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}

main().catch(err => {
  console.error('[release-notification] Unexpected error:', err);
  // Don't exit(1) — email failure should never block the pipeline
});
