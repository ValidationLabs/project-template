# ValidationLabs SpecKit Constitution
# Version: 2.0.0 | Effective: 2026-04-16
#
# This is the MASTER constitution for all ValidationLabs projects.
# Stack-specific addenda live in specs/governance/<stack>.md
# Innovation Lab templates live in specs/innovation-lab/
# Venture Design templates live in specs/venture-design/
#
# The Constitution supersedes all other guidance.
# Amendments require a version bump and commit.

## Article I: Core Principles (Non-Negotiable)

### 1.1 Spec-First Development
No line of production code is written without a corresponding spec.
Workflow: `/speckit.analyze` → `/speckit.plan` → `/speckit.tasks` → implement.

### 1.2 Test-Driven Delivery
Tests are written BEFORE implementation. A task is not complete until:
- [ ] Tests were written and confirmed FAILING
- [ ] Implementation made them pass
- [ ] CI pipeline confirms green

### 1.3 Issue Traceability (Non-Negotiable)
Every task MUST have a corresponding GitHub Issue with Gherkin acceptance criteria.
No code ships without a traceable Issue → Branch → PR → E2E chain.

### 1.4 Deployment Gate
Every deployment MUST pass the full Playwright E2E suite against the live URL.
Failing E2E = deployment blocked. No exceptions.

---

## Article II: Technology Stack

### 2.1 Frontend Options
| Stack | When to Use |
|---|---|
| Vite + React + TypeScript | Single-page apps, innovation prototypes, standalone tools |
| Next.js 15+ (App Router) | Multi-page apps, SEO-critical, server-rendered platforms |
| Turborepo + pnpm | Multi-app monorepos sharing packages |

### 2.2 Mandatory Stack Components
- **Language**: TypeScript strict mode. `any` is prohibited everywhere.
- **AI**: `@google/genai` (Gemini). Unified across all projects.
- **Database**: Firebase / Firestore. Firebase Auth for authentication.
- **Hosting**: Google Cloud Run (containerized via Docker). Never shared hosting.
- **Secrets**: GCP Secret Manager for production. `.env` for local only.
- **Package Management**: `uv` for Python, `pnpm` for Node monorepos, `npm` for standalone apps.

### 2.3 Prohibited Patterns
- No hardcoded credentials or API keys in source code
- No `any` TypeScript type (use `unknown` and narrow it)
- No vendor SDK imports outside designated provider/service files
- No mock at the vendor SDK level — mock at the interface boundary
- No deployment without a passing E2E suite

---

## Article III: Architecture Principles

### 3.1 Layer Separation
```
UI Components  →  only render, no business logic
Actions/API    →  thin entry points, delegate to services
Services       →  business logic, orchestration
Providers      →  ONLY place vendor SDKs are imported
Types/Domain   →  pure TypeScript, no SDKs, no async
```

### 3.2 Security Defaults
- Firebase/Firestore rules default to `deny all`. Access must be explicitly granted.
- Storage rules default to `deny all`.
- All Firestore access must validate `request.auth != null` and role weight.
- Production secrets live in GCP Secret Manager, never in `.env` files committed to git.

### 3.3 RBAC Role Weights (Canonical — Do Not Alter Without Amendment)
| Role | Weight |
|---|---|
| Admin | 100 |
| Lead | 50 |
| User | 10 |

---

## Article IV: CI/CD Pipeline (Non-Negotiable)

### 4.1 Pipeline Stages (in order)
```
1. lint         ESLint + TypeScript tsc --noEmit
2. typecheck    Full type validation
3. build        Production build
4. e2e          Playwright against staging/production URL
5. label        GitHub Issues labeled based on E2E result
```

### 4.2 Branch & PR Convention
- Branch naming: `feature/T0XX-short-description`
- PR title: `[T0XX] Description (Closes #N)`
- Every PR must include `Closes #N` to auto-close the linked issue

### 4.3 Issue Creation Contract
Every task generates a GitHub Issue with:
- **Title**: `[T0XX] Task description`
- **Labels**: `speckit`, phase label, priority label
- **Body**: Description + Why + Gherkin Acceptance Criteria + Technical Notes

---

## Article V: E2E Testing Standards

### 5.1 Test File Convention
```
tests/e2e/
  smoke.spec.ts       # Always present — generic availability/perf tests
  auth.spec.ts        # Authentication flow
  <feature>.spec.ts   # One file per major feature
```

### 5.2 Selector Priority (in order)
1. `getByRole()` — semantic, most resilient
2. `getByLabel()` / `getByPlaceholder()` — form elements
3. `getByText()` — visible text (scope with `.locator()` if ambiguous)
4. `data-testid` — last resort for complex cases

### 5.3 Target URL Strategy
- **Default**: Point at live production/staging URL via `PLAYWRIGHT_BASE_URL`
- **Local dev**: Falls back to `http://localhost:3000` if env var not set
- **No webServer block**: Tests do not spin up a local dev server in CI

---

## Article VI: Deployment Standards

### 6.1 Cloud Run Requirements
- Every app ships as a Docker container
- Nginx serves the frontend SPA with `try_files $uri /index.html` for client-side routing
- Health check endpoint at `/` returns HTTP 200
- Container listens on `$PORT` (default 8080)

### 6.2 Environment Variables
```
# Required in .env.example for every project
PLAYWRIGHT_BASE_URL=   # Live URL for E2E tests
CLOUD_RUN_SERVICE=     # Cloud Run service name
GCP_PROJECT_ID=        # GCP project ID
GCP_REGION=            # Deployment region
GEMINI_API_KEY=        # AI model access
FIREBASE_PROJECT_ID=   # Firebase project
```

---

## Article VII: Innovation Lab Process
See `specs/innovation-lab/` for full templates.

### 7.1 Stage Gates
```
Stage 1: Idea Discovery   → Business Opportunity Brief
Stage 2: Validation       → PoC / Prototype
Stage 3: Design           → Venture Design Document
Stage 4: Build            → Technical Specification
Stage 5: Production       → Deployment + E2E Gate
```

### 7.2 Speckit Command Flow (Per Stage)
```
/speckit.analyze    Audit current state
/speckit.plan       Define implementation approach
/speckit.tasks      Generate GitHub Issues with Gherkin
/speckit.implement  Execute against tasks
/speckit.e2e        Validate against live deployment
```

---

## Governance

This Constitution is the source of truth.
All amendments require:
1. A version bump (patch for clarification, minor for new rules, major for breaking changes)
2. Update to this file and a git commit with message: `chore(constitution): vX.Y.Z - <change summary>`
