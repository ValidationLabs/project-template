#!/usr/bin/env node
/**
 * scripts/record-release.js
 *
 * After all artifacts are uploaded to Firebase Storage,
 * writes a permanent Firestore document for this release.
 *
 * This is what the Release Portal reads to display release history.
 *
 * Environment variables required:
 *   FIRESTORE_PROJECT_ID     - GCP project with Firestore
 *   FIREBASE_STORAGE_BUCKET  - Storage bucket name
 *   RELEASE_SHA              - Git commit SHA
 *   APP_NAME                 - e.g. "QuantivaAI"
 *   GITHUB_ACTOR             - GitHub user who triggered the push
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

async function main() {
  const sha = process.env.RELEASE_SHA || 'local';
  const appName = process.env.APP_NAME || 'ValidationLabs App';
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  const projectId = process.env.FIRESTORE_PROJECT_ID;
  const outputDir = path.join('release-artifacts', sha);

  // Load AI summary
  const summary = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'ai-summary.json'), 'utf8')
  );

  // Load screenshot manifest
  const screenshotManifest = fs.existsSync(path.join(outputDir, 'screenshot-manifest.json'))
    ? JSON.parse(fs.readFileSync(path.join(outputDir, 'screenshot-manifest.json'), 'utf8'))
    : [];

  // Build public Firebase Storage URLs
  // Format: https://storage.googleapis.com/{bucket}/releases/{sha}/{file}
  const storageBase = `https://storage.googleapis.com/${bucket}/releases/${sha}`;

  const screenshotUrls = screenshotManifest
    .filter(s => s.file)
    .map(s => ({
      route: s.route,
      label: s.label,
      url: `${storageBase}/screenshots/${s.slug}.png`,
    }));

  const releaseCardUrl = `${storageBase}/release-card.html`;

  // Build short version string: YYYY-MM-DD.{shortSha}
  const today = new Date().toISOString().split('T')[0];
  const version = `${today}.${sha.slice(0, 7)}`;

  // Initialize Firebase Admin (uses Application Default Credentials from WIF in CI)
  if (!getApps().length) {
    initializeApp({ projectId });
  }
  const db = getFirestore();

  // Write the release document
  const releaseData = {
    // Identity
    sha,
    version,
    date: Timestamp.now(),

    // AI-generated content
    headline: summary.headline,
    impactLevel: summary.impactLevel,
    summary: {
      whatsNew: summary.whatsNew || [],
      whatsFixed: summary.whatsFixed || [],
      whatsChanged: summary.whatsChanged || [],
    },

    // Visual artifacts
    releaseCardUrl,
    screenshotUrls,
    videoUrls: [], // TODO: add video support in Phase 4

    // Metadata
    app: appName,
    author: process.env.GITHUB_ACTOR || 'ci',
    changedRoutes: screenshotManifest.map(s => s.route),
  };

  await db.collection('releases').doc(sha).set(releaseData);

  console.log(`[release-intelligence] Firestore record written: releases/${sha}`);
  console.log(`[release-intelligence] Release card URL: ${releaseCardUrl}`);
}

main().catch(err => {
  console.error('[release-intelligence] Firestore record failed:', err);
  process.exit(1);
});
