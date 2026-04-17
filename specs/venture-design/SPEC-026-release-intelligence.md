# SPEC-026: Automated Release Intelligence
# ValidationLabs | /speckit.specify
# Version: 1.0 | Author: Speckit | Date: 2026-04-17

---

## Problem Statement

Every code push produces changes that affect real users — new features, fixed
bugs, UI improvements. Currently:

- Stakeholders have no visibility into what changed after a deployment
- Developers write release notes manually (inconsistently, incompletely)
- Screenshots only exist locally and expire from CI artifacts
- Non-technical stakeholders cannot understand git commit messages
- There is no permanent, linkable audit trail of what the product looked like at each release

---

## Solution: Automated Release Intelligence Pipeline

On every push to `main` (post-deployment), a pipeline automatically:

1. **Captures** — Playwright takes full-page screenshots and short video clips of
   every UI route defined in the release manifest
2. **Translates** — Gemini AI reads the git diff + PR titles and rewrites them
   as a user-friendly narrative any stakeholder can understand
3. **Assembles** — A styled HTML release brief ("Release Card") is generated,
   embedding the AI summary, screenshots, and a visual change summary
4. **Persists** — All artifacts (screenshots, videos, HTML) are uploaded to
   Firebase Storage with public permanent URLs
5. **Records** — A Firestore document is created for each release, enabling a
   public Release Portal page that is always viewable by anyone

---

## Architecture

```
git push main
      |
      v
.github/workflows/release-intelligence.yml
      |
      +-- 1. deploy.yml (Cloud Run deployment, already exists)
      |
      +-- 2. release-intelligence.yml (NEW)
             |
             +-- [Step 1] Checkout + resolve changed routes
             |     scripts/resolve-changed-routes.js
             |       reads git diff → maps changed files → known UI routes
             |
             +-- [Step 2] Playwright screenshot capture
             |     scripts/capture-release-screenshots.js
             |       navigates to each changed route
             |       captures full-page PNG + short WebM video clip
             |       saves to /release-artifacts/{sha}/
             |
             +-- [Step 3] Gemini AI release summary
             |     scripts/generate-release-summary.js
             |       input: git log, git diff --stat, PR titles
             |       prompt: "Translate these changes into a release brief
             |                for non-technical users and stakeholders.
             |                Group by: What's New, What's Fixed, What Changed."
             |       output: structured JSON { headline, sections[], impactLevel }
             |
             +-- [Step 4] Assemble Release Card (HTML infographic)
             |     scripts/assemble-release-card.js
             |       branded HTML with:
             |         - Release headline (from Gemini)
             |         - Version badge + date
             |         - Screenshot gallery (each changed UI view)
             |         - "What's New / Fixed / Changed" sections
             |         - Video clips (if captured)
             |       saved as release-{sha}.html
             |
             +-- [Step 5] Upload to Firebase Storage
             |     gsutil / Firebase Admin SDK
             |       gs://[bucket]/releases/{sha}/
             |         screenshots/*.png
             |         videos/*.webm
             |         release-card.html   (publicly accessible URL)
             |
             +-- [Step 6] Write Firestore release record
                   Collection: releases/{sha}
                   Fields: version, date, headline, summary, 
                           screenshotUrls[], videoUrls[], 
                           releaseCardUrl, impactLevel, changedRoutes[]
```

---

## Data Model

### Firestore: `releases/{commitSha}`

```typescript
interface ReleaseRecord {
  // Identity
  sha: string;                    // Git commit SHA (document ID)
  version: string;                // e.g. "2026-04-17.a515fca"
  tag?: string;                   // Semver tag if present (e.g. "v1.2.0")
  date: Timestamp;                // Deployment timestamp

  // AI-generated content
  headline: string;               // e.g. "Authentication flow redesigned + 3 bug fixes"
  impactLevel: 'major' | 'minor' | 'patch';
  summary: {
    whatsNew: string[];           // New features in plain language
    whatsFixed: string[];         // Bug fixes in plain language
    whatsChanged: string[];       // Updates/improvements in plain language
  };

  // Visual artifacts (Firebase Storage URLs — permanent, public)
  releaseCardUrl: string;         // HTML release brief
  screenshotUrls: {
    route: string;                // e.g. "/", "/#/dashboard"
    label: string;                // e.g. "Landing Page"
    url: string;                  // Firebase Storage public URL
  }[];
  videoUrls: {
    route: string;
    label: string;
    url: string;
  }[];

  // Metadata
  changedRoutes: string[];        // Which UI paths were affected
  prTitles: string[];             // PR titles merged in this release
  author: string;                 // GitHub actor who triggered the push
  app: string;                    // Which app (e.g. "QuantivaAI", "InnovationHub")
}
```

### Firebase Storage: `releases/{sha}/`
```
releases/
  a515fca/
    release-card.html       <- Main artifact: styled HTML release brief
    screenshots/
      landing-page.png
      auth-modal.png
      dashboard.png
    videos/
      auth-flow.webm
```

---

## Release Portal (Viewer)

A public-facing page at `/releases` (or `releases.validationlabs.io`) that:

- Renders a card gallery of all `releases` Firestore documents
- Each card shows: headline, date, impact badge, screenshot thumbnails
- Click a card → opens the full `release-card.html` in Firebase Storage
- Anyone with the URL can view — no auth required
- Can be embedded in InnovationHub, QuantivaAI, or any project's admin area

### Example Release Card (HTML output)
```
┌─────────────────────────────────────────────────────────────┐
│ 🚀  QuantivaAI  |  Release v2026-04-17  |  ● Minor Update   │
├─────────────────────────────────────────────────────────────┤
│  "Authentication flow redesigned for faster client sign-in" │
│                                                             │
│  [Screenshot: Landing Page]  [Screenshot: Auth Modal]       │
│                                                             │
│  ✨ What's New                                              │
│   • Clients can now sign in with a single click from the    │
│     hero section — no more navigating to a separate page    │
│                                                             │
│  🐛 What's Fixed                                            │
│   • Sign-in button now works on mobile safari               │
│   • Password field no longer auto-fills incorrectly         │
│                                                             │
│  📊 What Changed                                            │
│   • Navigation bar redesigned with clearer action buttons   │
│                                                             │
│  [View Full Release Notes]  [Watch Demo Clip]               │
└─────────────────────────────────────────────────────────────┘
```

---

## Routes Manifest (per project)

Each project defines which UI routes to screenshot in `release-manifest.json`:

```json
{
  "app": "QuantivaAI",
  "baseUrl": "${PLAYWRIGHT_BASE_URL}",
  "routes": [
    { "path": "/",           "label": "Landing Page",   "fullPage": true },
    { "path": "/#/dashboard","label": "Dashboard",      "fullPage": true },
    { "path": "/#/profile",  "label": "Profile",        "fullPage": false },
    { "path": "/#/workspace","label": "Workspace",      "fullPage": true }
  ],
  "captureVideo": ["/#/dashboard"],
  "authRequired": ["/#/dashboard", "/#/profile", "/#/workspace"]
}
```

---

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Automated Release Intelligence

  Scenario: Release card generated on push to main
    Given a developer pushes commits to the main branch
    And the CI pipeline deploys the new version successfully
    When the release-intelligence workflow runs
    Then Playwright captures screenshots of all routes in release-manifest.json
    And Gemini AI generates a human-readable release summary
    And an HTML release card is assembled with screenshots embedded
    And all artifacts are uploaded to Firebase Storage
    And a Firestore document is created at releases/{sha}
    And the release card is publicly accessible at its Firebase Storage URL

  Scenario: Stakeholder views release portal
    Given multiple releases have been deployed
    When a stakeholder visits the /releases page (or releases portal URL)
    Then they see a card gallery of all releases in reverse chronological order
    And each card shows: headline, date, impact level, screenshot thumbnail
    And clicking a card opens the full release brief with all screenshots

  Scenario: AI summary is non-technical and accurate
    Given a release includes changes to authentication UI
    When Gemini AI generates the release summary
    Then "What's New" section describes the change in plain language
    And the description does not contain technical jargon (no file paths, no function names)
    And the description accurately reflects what the user will experience differently

  Scenario: Screenshots are permanently accessible
    Given a release card was generated 6 months ago
    When a stakeholder opens the release card URL
    Then all screenshots are still visible (not expired or broken)
    And the Firebase Storage URL returns HTTP 200

  Scenario: No Firebase credentials in push (auth-required routes)
    Given some routes require authentication to access
    When Playwright captures screenshots
    Then auth-required routes use a seeded test account (via env secrets)
    And the screenshots show the authenticated state of the route
    And no real user credentials are exposed in the release card
```

---

## Implementation Task Breakdown

### Phase 1: Screenshot Capture Infrastructure
- [ ] **T001**: Create `release-manifest.json` schema and validator
- [ ] **T002**: Write `scripts/capture-release-screenshots.js`
  - Playwright navigates to each route, full-page screenshot
  - Saves to `/release-artifacts/{sha}/screenshots/`
- [ ] **T003**: Add video capture for designated routes (Playwright video option)
- [ ] **T004**: Handle auth-required routes via `RELEASE_TEST_EMAIL` + `RELEASE_TEST_PASSWORD` secrets

### Phase 2: AI Summary Generation
- [ ] **T005**: Write `scripts/generate-release-summary.js`
  - Reads: `git log --oneline HEAD~10..HEAD`, `git diff --stat`
  - Calls Gemini w/ structured prompt
  - Returns: `{ headline, impactLevel, whatsNew[], whatsFixed[], whatsChanged[] }`
- [ ] **T006**: Add Gemini responseSchema for guaranteed JSON output
- [ ] **T007**: Handle edge case: no meaningful changes (trivial commits)

### Phase 3: Release Card Assembly
- [ ] **T008**: Write `scripts/assemble-release-card.js`
  - Inputs: AI summary JSON + screenshot file paths
  - Outputs: styled HTML file using inline CSS (no external assets)
  - Branded per project (reads `release-manifest.json` `app` field)
- [ ] **T009**: Add ValidationLabs brand tokens (colors, logo, typography)
- [ ] **T010**: Mobile-responsive HTML layout

### Phase 4: Firebase Storage + Firestore
- [ ] **T011**: Write `scripts/upload-release-artifacts.js`
  - Uploads all files to `gs://[bucket]/releases/{sha}/`
  - Returns public download URLs
- [ ] **T012**: Write `scripts/record-release.js`
  - Writes Firestore document at `releases/{sha}`
  - Sets all fields from data model above
- [ ] **T013**: Configure Firebase Storage CORS for public read access
- [ ] **T014**: Add Firestore security rules for `releases/` collection (public read, write = CI only)

### Phase 5: GitHub Actions Workflow
- [ ] **T015**: Create `.github/workflows/release-intelligence.yml`
  - Triggers: `on: push: branches: [main]` (after deploy.yml succeeds)
  - Uses WIF for GCP auth (already configured)
  - Runs all 4 scripts in sequence
- [ ] **T016**: Add required secrets: `GEMINI_API_KEY`, `RELEASE_TEST_EMAIL`, `RELEASE_TEST_PASSWORD`
- [ ] **T017**: Add artifact retention: upload HTML + screenshots to GitHub Actions artifacts (30 days) as backup

### Phase 6: Release Portal UI
- [ ] **T018**: Create `/releases` route in the app (or standalone portal)
  - Reads `releases` Firestore collection, ordered by `date` desc
  - Renders release cards in masonry grid layout
- [ ] **T019**: Add release card component
  - Headline, date badge, impact level chip
  - Screenshot thumbnail strip
  - "View Full Release" button → opens Firebase Storage HTML URL
- [ ] **T020**: Add to project template `release-manifest.json` with placeholder routes
- [ ] **T021**: Update `speckit.ps1` with `releases` command → opens release portal

---

## New `speckit.ps1` Command

```powershell
.\speckit.ps1 releases          # Open the release portal in browser
.\speckit.ps1 release --preview # Preview the release card for current branch (local)
```

---

## GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key for AI summary generation |
| `PLAYWRIGHT_BASE_URL` | Live deployment URL (already exists) |
| `RELEASE_TEST_EMAIL` | Test account for auth-gated screenshots |
| `RELEASE_TEST_PASSWORD` | Test account password |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK credentials (or use WIF) |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket for artifact uploads |
| `FIRESTORE_PROJECT_ID` | Firestore project ID |

---

## Phased Rollout

| Phase | Deliverable | Value |
|---|---|---|
| 1 (MVP) | Screenshots uploaded to Firebase Storage + plain Markdown notes | Stakeholders can see what the app looks like after each deploy |
| 2 | AI-generated summaries + HTML release card | Non-technical narrative + visual brief |
| 3 | Release Portal page in the app | Permanent, searchable, browsable release history |
| 4 | Video clips + auth-gated page capture | Full interactive demonstration of new features |

---

## Open Questions

1. **Single portal or per-app?** Should releases from QuantivaAI, InnovationHub, and TrainingGenie all appear in one unified portal at `releases.validationlabs.io`, or stay per-project?
2. **Notification?** Should stakeholders receive a Slack/email notification with the release card link after each deployment?
3. **Public vs. internal?** Should the release portal require a password/login, or be fully public?
