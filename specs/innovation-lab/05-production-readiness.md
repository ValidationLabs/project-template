# Stage 5: Production Readiness Checklist
# Template Version: 1.0
# ValidationLabs Innovation Lab | Stage Gate: Production

---

## Application Details

**Venture Name**: [PLACEHOLDER]
**Version**: [X.Y.Z]
**Target URL**: [https://...]
**Cloud Run Service**: [service-name]
**GCP Project**: [project-id]

---

## Pre-Deployment Gate (ALL must pass)

### Security
- [ ] No hardcoded API keys or credentials in source code
- [ ] All secrets in GCP Secret Manager (not .env committed)
- [ ] Firebase Auth enabled and tested
- [ ] Firestore rules: deny all by default, explicit grants tested
- [ ] Storage rules: deny all by default, explicit grants tested
- [ ] CORS configured correctly on API endpoints
- [ ] No `console.log` with sensitive data

### Code Quality
- [ ] TypeScript strict mode — zero `any` types
- [ ] `npm run build` (or `pnpm build`) succeeds with zero errors
- [ ] `tsc --noEmit` passes — zero type errors
- [ ] ESLint passes — zero warnings elevated to errors

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Playwright E2E suite passes against staging URL
- [ ] Playwright E2E suite passes against production URL
- [ ] No skipped tests in CI (`.skip` removed)

### Infrastructure
- [ ] Docker build succeeds locally: `docker build .`
- [ ] Docker run succeeds locally: `docker run -p 8080:8080 [image]`
- [ ] Nginx serves SPA correctly (`try_files` configured)
- [ ] Health check at `/` returns HTTP 200
- [ ] Cloud Run service deployed and accessible
- [ ] Load balancer / custom domain configured (if applicable)

### CI/CD Pipeline
- [ ] `.github/workflows/ci.yml` runs: lint → typecheck → build → e2e
- [ ] `.github/workflows/deploy.yml` deploys on merge to main
- [ ] Workload Identity Federation (WIF) configured — no static service account keys
- [ ] All GitHub Issues linked to PRs via `Closes #N`

### Documentation
- [ ] `README.md` updated with setup and deployment instructions
- [ ] `.env.example` captures all required environment variables
- [ ] `ARCHITECTURE.md` reflects current system design
- [ ] `CHANGELOG.md` updated with release notes

---

## Playwright E2E Sign-Off

Run: `.\speckit.ps1 e2e`

| Test Suite | Result | Notes |
|---|---|---|
| smoke.spec.ts | PASS / FAIL | |
| auth.spec.ts | PASS / FAIL | |
| [feature].spec.ts | PASS / FAIL | |

**E2E Run URL**: [https://epm.validationlabs.io or staging URL]
**Run Date**: [YYYY-MM-DD HH:MM]
**Total Tests**: [N] passing, [N] failing

---

## Deployment Sign-Off

Run: `.\speckit.ps1 deploy`

- [ ] Deployment completed without errors
- [ ] Live URL verified: [https://...]
- [ ] Smoke tests pass on production URL
- [ ] Rollback plan documented: [previous Cloud Run revision]

### Deployment Command Used
```bash
.\speckit.ps1 deploy
# or manually:
# gcloud run deploy [service] --source . --project [project] --region [region]
```

---

## Post-Deployment Monitoring

- [ ] Cloud Run logs reviewed — no unexpected errors
- [ ] Cloud Monitor alerts configured (error rate, latency)
- [ ] Firestore usage within expected bounds
- [ ] AI model API usage within quota limits

---

## Approval Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Venture Lead | | | |
| Engineering Lead | | | |
| Executive Sponsor | | | |

**Production Gate Decision**:
[ ] APPROVED — Deploy to production
[ ] CONDITIONAL — Deploy after fixing: [list items]
[ ] REJECTED — Return to development (reason: _____________)

---

## Metadata
- **Checklist Completed By**: [Name]
- **Date**: [YYYY-MM-DD]
- **Cloud Run Revision**: [revision-name]
- **Git Commit**: [SHA]
- **GitHub Release**: [URL]
