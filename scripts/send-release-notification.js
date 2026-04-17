#!/usr/bin/env node
/**
 * scripts/send-release-notification.js
 *
 * Sends a release notification email to validationlabs@bcbsfl.com
 * via SendGrid after each deployment.
 *
 * Called from release-intelligence.yml after Firestore record is written.
 *
 * Environment variables required:
 *   SENDGRID_API_KEY        - SendGrid API key
 *   RELEASE_SHA             - Git commit SHA
 *   APP_NAME                - e.g. "QuantivaAI"
 *   FIREBASE_STORAGE_BUCKET - For constructing release card URL
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const TO_EMAIL = 'validationlabs@bcbsfl.com';
const FROM_EMAIL = 'releases@validationlabs.io';
const FROM_NAME  = 'ValidationLabs Release Intelligence';

async function main() {
  const sha = process.env.RELEASE_SHA || 'local';
  const appName = process.env.APP_NAME || 'ValidationLabs App';
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;

  const outputDir = path.join('release-artifacts', sha);
  const summaryPath = path.join(outputDir, 'ai-summary.json');

  if (!fs.existsSync(summaryPath)) {
    console.error('[release-notification] ai-summary.json not found — skipping email');
    process.exit(0);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const releaseCardUrl = `https://storage.googleapis.com/${bucket}/releases/${sha}/release-card.html`;
  const portalUrl = 'https://releases.validationlabs.io';

  const shortSha = sha.slice(0, 7);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const impactEmoji = { major: '🚀', minor: '✨', patch: '🔧' }[summary.impactLevel] || '📦';

  // ─────────────────────────────────────────────────────
  // Build stakeholder-friendly email HTML
  // ─────────────────────────────────────────────────────
  const buildSection = (icon, title, items) => {
    if (!items || items.length === 0) return '';
    return `
      <tr><td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700;
                   color: #6366F1; letter-spacing: 0.05em; text-transform: uppercase;">
          ${icon} ${title}
        </p>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #334155;">
          ${items.map(item => `
            <li style="font-size: 14px; line-height: 1.6; margin-bottom: 4px;">
              ${item}
            </li>`).join('')}
        </ul>
      </td></tr>`;
  };

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
             style="max-width:600px;margin:0 auto;background:#FFFFFF;
                    border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:32px 40px;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;
                       letter-spacing:0.1em;text-transform:uppercase;color:#6366F1;">
              ValidationLabs · Release Intelligence
            </p>
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;
                        color:#F8FAFC;line-height:1.3;letter-spacing:-0.02em;">
              ${impactEmoji} ${summary.headline}
            </h1>
            <p style="margin:0;font-size:12px;color:#94A3B8;">
              ${appName} &nbsp;·&nbsp; ${dateStr} &nbsp;·&nbsp;
              <span style="font-family:monospace;">${shortSha}</span>
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${buildSection('✨', "What's New", summary.whatsNew)}
              ${buildSection('🐛', "What's Fixed", summary.whatsFixed)}
              ${buildSection('📊', "What Changed", summary.whatsChanged)}
            </table>
          </td>
        </tr>

        <!-- CTA buttons -->
        <tr>
          <td style="padding:8px 40px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${releaseCardUrl}"
                     style="display:inline-block;padding:12px 24px;
                            background:#6366F1;color:#FFFFFF;
                            font-size:14px;font-weight:700;
                            text-decoration:none;border-radius:10px;">
                    View Release Brief
                  </a>
                </td>
                <td>
                  <a href="${portalUrl}"
                     style="display:inline-block;padding:12px 24px;
                            background:#F1F5F9;color:#334155;
                            font-size:14px;font-weight:700;
                            text-decoration:none;border-radius:10px;">
                    Open Release Portal
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#94A3B8;">
              This notification was sent automatically by the ValidationLabs Release Intelligence
              pipeline after every deployment. &nbsp;·&nbsp;
              <a href="${portalUrl}" style="color:#6366F1;">View all releases</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ─────────────────────────────────────────────────────
  // Send via SendGrid API
  // ─────────────────────────────────────────────────────
  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `${impactEmoji} [${appName}] ${summary.headline}`,
    content: [
      {
        type: 'text/plain',
        value: `${appName} released ${shortSha} on ${dateStr}\n\n` +
               `${summary.headline}\n\n` +
               (summary.whatsNew?.length  ? `What's New:\n${summary.whatsNew.map(i=>`• ${i}`).join('\n')}\n\n` : '') +
               (summary.whatsFixed?.length ? `What's Fixed:\n${summary.whatsFixed.map(i=>`• ${i}`).join('\n')}\n\n` : '') +
               (summary.whatsChanged?.length ? `What Changed:\n${summary.whatsChanged.map(i=>`• ${i}`).join('\n')}\n\n` : '') +
               `View release brief: ${releaseCardUrl}\nRelease Portal: ${portalUrl}`,
      },
      { type: 'text/html', value: emailHtml },
    ],
  });

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[release-notification] SENDGRID_API_KEY not set — skipping email');
    process.exit(0);
  }

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[release-notification] Email sent to ${TO_EMAIL}`);
            resolve();
          } else {
            console.error(`[release-notification] SendGrid error ${res.statusCode}: ${body}`);
            resolve(); // Don't fail the pipeline for email issues
          }
        });
      }
    );
    req.on('error', err => {
      console.error('[release-notification] Network error:', err.message);
      resolve(); // Don't fail the pipeline
    });
    req.write(payload);
    req.end();
  });
}

main().catch(err => {
  console.error('[release-notification] Failed:', err);
  process.exit(0); // Email failure should not block the pipeline
});
