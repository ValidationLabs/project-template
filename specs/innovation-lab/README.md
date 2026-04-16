# Innovation Lab Stage Templates

This directory contains reusable Speckit specification templates for each stage
of the ValidationLabs Innovation Lab process.

## How to Use

1. Copy the relevant template file into your project's `specs/` directory
2. Fill in the `[PLACEHOLDER]` sections
3. Run `/speckit.analyze` to validate your spec against the constitution
4. Run `/speckit.tasks` to generate GitHub Issues with Gherkin acceptance criteria

## Stage Map

| Stage | Template | Description |
|---|---|---|
| 1. Discovery | `01-business-opportunity-brief.md` | Initial idea capture and strategic framing |
| 2. Validation | `02-poc-specification.md` | Proof of concept definition and success criteria |
| 3. Venture Design | `03-venture-design-document.md` | Full venture architecture and go-to-market |
| 4. Technical Build | `04-technical-specification.md` | Engineering spec, data model, API contracts |
| 5. Production Gate | `05-production-readiness.md` | E2E checklist before go-live |

## Prioritization Framework

All ideas are scored across four dimensions (see `specs/innovation-lab/scoring-rubric.md`):
- **Strategic Alignment** (30%) — How well does this advance our strategic pillars?
- **Value / ROI** (30%) — What is the direct/indirect P&L impact?
- **Magnitude of Impact** (20%) — What is the cost of the status quo?
- **Horizon / Urgency** (20%) — What is the competitive advantage window?
