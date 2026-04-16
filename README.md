# ValidationLabs Project Template

A GitHub Template Repository for all ValidationLabs applications.
Click **"Use this template"** to bootstrap a new project with the complete
governance, testing, and deployment stack pre-wired.

---

## What's Included

```
project-template/
    speckit.ps1                          Universal CLI (e2e, deploy, analyze, etc.)
    playwright.config.ts                 E2E config — reads URL from PLAYWRIGHT_BASE_URL
    tests/e2e/
        smoke.spec.ts                    Generic smoke tests — work on any app
    specs/
        governance/
            constitution.md              Master ValidationLabs Constitution v2.0
        innovation-lab/
            README.md                    Innovation Lab Stage Guide
            01-business-opportunity-brief.md
            02-poc-specification.md
            05-production-readiness.md
            scoring-rubric.md            QuantivaAI prioritization dimensions
        venture-design/
            03-venture-design-document.md
            04-technical-specification.md
    .github/
        workflows/
            ci.yml                       lint > typecheck > build > e2e > label-issues
            deploy.yml                   Cloud Run deploy via WIF (no static keys)
        ISSUE_TEMPLATE/
            speckit-task.md              GitHub Issue template with Gherkin
    .env.example                         All required env vars documented
    .gitignore
    .dockerignore
    Dockerfile                           Cloud Run ready
    nginx/nginx.conf                     SPA routing
```

---

## Quick Start

### 1. Use This Template
Click **"Use this template"** on GitHub → name your new repository.

### 2. Clone and Configure
```powershell
git clone https://github.com/ValidationLabs/<your-new-repo>.git
cd <your-new-repo>

# Copy the env template and fill in your values
copy .env.example .env
```

### 3. Configure `.env`
```env
PLAYWRIGHT_BASE_URL=https://your-app.run.app
CLOUD_RUN_SERVICE=your-service-name
GCP_PROJECT_ID=your-gcp-project
GCP_REGION=us-central1
GEMINI_API_KEY=your-key
FIREBASE_PROJECT_ID=your-firebase-project
```

### 4. First-Time Setup
```powershell
.\speckit.ps1 setup
```
This installs Playwright browsers on your machine (one-time per machine).

### 5. Run E2E Tests
```powershell
.\speckit.ps1 e2e
```

### 6. Deploy
```powershell
.\speckit.ps1 deploy
```

---

## The Development Workflow

Every feature follows this cycle — enforced by the Constitution:

```
/speckit.analyze    Understand what needs to be built
        ↓
/speckit.plan       Define the technical approach
        ↓
/speckit.tasks      Generate GitHub Issues with Gherkin acceptance criteria
        ↓
  Development       Branch per issue: feature/T0XX-description
        ↓
  Pull Request      Must include: Closes #N
        ↓
  CI Pipeline       lint → typecheck → build → e2e (against live URL)
        ↓
  E2E Pass?         Issues labeled "ready-for-review"
  E2E Fail?         Issues labeled "e2e-failed"
        ↓
  PR Merged         Issues auto-closed, deploy.yml triggers
        ↓
  Production        .\speckit.ps1 deploy
```

---

## Innovation Lab Stage Templates

This template includes the full ValidationLabs Innovation Lab process:

| Stage | Template | Command |
|---|---|---|
| 1. Discovery | `specs/innovation-lab/01-business-opportunity-brief.md` | `/speckit.analyze` |
| 2. Validation | `specs/innovation-lab/02-poc-specification.md` | `/speckit.plan` |
| 3. Venture Design | `specs/venture-design/03-venture-design-document.md` | `/speckit.plan` |
| 4. Technical Build | `specs/venture-design/04-technical-specification.md` | `/speckit.tasks` |
| 5. Production Gate | `specs/innovation-lab/05-production-readiness.md` | `.\speckit.ps1 e2e` |

**Scoring**: All ideas are prioritized using the rubric in `specs/innovation-lab/scoring-rubric.md`
(Strategic Alignment 30% + ROI 30% + Impact 20% + Urgency 20%).

---

## GitHub Actions Setup (Required Once Per Repo)

### Repository Secrets
| Secret | Description |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Live URL for E2E tests |
| `WIF_PROVIDER` | Workload Identity Federation provider |
| `WIF_SERVICE_ACCOUNT` | GCP service account email |

### Repository Variables
| Variable | Description |
|---|---|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_REGION` | Deployment region (e.g., `us-central1`) |
| `CLOUD_RUN_SERVICE` | Your Cloud Run service name |

---

## SpecKit Commands

```powershell
.\speckit.ps1 setup              # First-time: install Playwright browsers
.\speckit.ps1 e2e                # Run E2E tests against PLAYWRIGHT_BASE_URL
.\speckit.ps1 e2e --headed       # Run with visible browser
.\speckit.ps1 e2e --ui           # Open Playwright interactive UI
.\speckit.ps1 e2e --grep name    # Run only matching tests
.\speckit.ps1 lint               # TypeScript typecheck
.\speckit.ps1 deploy             # Deploy to Cloud Run
.\speckit.ps1 analyze            # Run Speckit analysis
.\speckit.ps1 tasks              # Generate GitHub Issues
.\speckit.ps1 help               # Show all commands
```

---

## Projects Using This Template

| Project | URL | Status |
|---|---|---|
| QuantivaAI | https://epm.validationlabs.io | Production |
| InnovationHub | https://validationlabs.io/hub | Production |
| TrainingGenie | https://genie.validationlabs.io | Production |

---

*ValidationLabs Project Template — maintained by the Innovation Engineering team.*
*Constitution version: 2.0.0*
