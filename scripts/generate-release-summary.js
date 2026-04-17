#!/usr/bin/env node
/**
 * scripts/generate-release-summary.js
 *
 * Reads the git log and diff for the current deployment,
 * then calls Gemini AI to produce a human-readable, stakeholder-friendly
 * release summary in structured JSON format.
 *
 * Outputs to: release-artifacts/{sha}/ai-summary.json
 *
 * Environment variables required:
 *   GEMINI_API_KEY   - Gemini API key
 *   RELEASE_SHA      - Git commit SHA
 *   APP_NAME         - e.g. "QuantivaAI"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Uses @google/genai (the unified ValidationLabs AI package)
const { GoogleGenAI } = require('@google/genai');

async function main() {
  const sha = process.env.RELEASE_SHA || 'local';
  const appName = process.env.APP_NAME || 'ValidationLabs App';
  const outputDir = path.join('release-artifacts', sha);
  fs.mkdirSync(outputDir, { recursive: true });

  // ─────────────────────────────────────────────────────
  // Gather git context
  // ─────────────────────────────────────────────────────
  let gitLog = '';
  let gitDiffStat = '';
  let gitDiffDetails = '';

  try {
    gitLog = execSync('git log --oneline -15 HEAD', { encoding: 'utf8' }).trim();
    gitDiffStat = execSync('git diff --stat HEAD~5 HEAD 2>/dev/null || git diff --stat HEAD~1 HEAD', { encoding: 'utf8' }).trim();
    gitDiffDetails = execSync('git diff --name-status HEAD~5 HEAD 2>/dev/null || git diff --name-status HEAD~1 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    gitLog = `Commit: ${sha}`;
    gitDiffStat = 'Diff not available';
  }

  // Read PR info from git log (look for PR merge messages)
  const prMerges = gitLog
    .split('\n')
    .filter(line => line.includes('Merge pull request') || line.includes('(#'))
    .join('\n');

  // ─────────────────────────────────────────────────────
  // Call Gemini AI for structured summary
  // ─────────────────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are a product communications expert writing release notes for "${appName}".

Your audience is non-technical: product managers, executives, customers, and business stakeholders.
Do NOT use: file names, function names, variable names, code jargon, or technical implementation details.
DO use: plain language that focuses on what users can do differently, what problems are solved, what improved.

Here is the git activity for this release:

--- RECENT COMMITS ---
${gitLog}

--- FILES CHANGED ---
${gitDiffStat}

--- CHANGE DETAILS ---
${gitDiffDetails}

Generate a structured release brief. Rules:
- headline: One sentence summarizing the most impactful change. Max 12 words.
- impactLevel: "major" (new features, breaking changes), "minor" (improvements, new capabilities), or "patch" (bug fixes, invisible changes)
- whatsNew: list of truly NEW capabilities users gain (max 5 items). Only include if genuinely new.
- whatsFixed: list of problems that were broken and are now fixed (max 5 items). Only include real fixes.
- whatsChanged: list of improvements to existing things (max 5 items). Focus on user experience.
- Each item must be ONE sentence in plain language, starting with a verb (e.g. "Sign in now works with...", "The dashboard now shows...").
- If a category has nothing meaningful, return an empty array.
- technicalNote: One sentence for developers explaining the key technical change (can use technical terms here).`;

  const responseSchema = {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      impactLevel: { type: 'string', enum: ['major', 'minor', 'patch'] },
      whatsNew: { type: 'array', items: { type: 'string' } },
      whatsFixed: { type: 'array', items: { type: 'string' } },
      whatsChanged: { type: 'array', items: { type: 'string' } },
      technicalNote: { type: 'string' },
    },
    required: ['headline', 'impactLevel', 'whatsNew', 'whatsFixed', 'whatsChanged'],
  };

  let summary;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.4,
      },
    });

    summary = JSON.parse(response.text);
    console.log(`[release-intelligence] AI summary generated: "${summary.headline}"`);
  } catch (err) {
    console.error('[release-intelligence] Gemini call failed, using fallback summary:', err.message);
    summary = {
      headline: `${appName} updated with ${sha.slice(0, 7)} improvements`,
      impactLevel: 'patch',
      whatsNew: [],
      whatsFixed: [],
      whatsChanged: ['Various improvements were made to the application.'],
      technicalNote: `Commit ${sha}`,
    };
  }

  // Save the summary
  const output = {
    sha,
    appName,
    generatedAt: new Date().toISOString(),
    gitLog,
    ...summary,
  };

  fs.writeFileSync(
    path.join(outputDir, 'ai-summary.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('[release-intelligence] AI summary saved.');
}

main().catch(err => {
  console.error('[release-intelligence] Summary generation failed:', err);
  process.exit(1);
});
