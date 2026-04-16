# Stage 3: Venture Design Document
# Template Version: 1.0
# ValidationLabs Innovation Lab | Stage Gate: Design

---

## Venture Summary

**Venture Name**: [PLACEHOLDER]
**Tagline**: [One sentence — what it does and for whom]
**Stage**: Venture Design
**PoC Reference**: `specs/innovation-lab/02-poc-specification.md`

---

## Vision & Mission

**Vision** (where we're going):
> [Future state in 3-5 years if this succeeds]

**Mission** (what we do):
> [How this venture creates value day-to-day]

**Unique Value Proposition**:
> [What makes this defensibly different]

---

## Market Analysis

### User Personas

#### Primary Persona: [Name]
- **Role**: [Job title]
- **Goals**: [What they want to achieve]
- **Frustrations**: [What blocks them today]
- **Success looks like**: [Measurable outcome they care about]
- **Quote**: "[Typical thing this person says]"

#### Secondary Persona: [Name]
[Same structure]

### Jobs to Be Done (JTBD)
| Job | Frequency | Pain Level | Current Solution |
|---|---|---|---|
| [Primary job] | Daily/Weekly/Monthly | H/M/L | |
| [Secondary job] | | | |

---

## Product Architecture

### Feature Set (MVP)
| Feature | User Story | Priority | Complexity |
|---|---|---|---|
| | As a [persona], I want to [action] so that [outcome] | Must/Should/Could | S/M/L/XL |

### System Architecture
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │───►│  API Layer   │───►│  AI Engine  │
│  (React/    │    │  (Cloud Run) │    │  (Gemini)   │
│   Next.js)  │    └──────────────┘    └─────────────┘
└─────────────┘           │
                    ┌─────▼──────┐
                    │  Firestore │
                    │  + Storage │
                    └────────────┘
```

### Data Model (High Level)
```typescript
// Core entities — fill in fields per your domain
interface Workspace {
  id: string;
  name: string;
  slug: string;              // [brand]-[uid] format
  createdAt: Timestamp;
  // add domain fields...
}

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'lead' | 'user';
  roleWeight: 100 | 50 | 10;
  workspaces: string[];
}
```

### AI Agent Design
| Agent | Trigger | Model | Output Format |
|---|---|---|---|
| [Agent name] | [User action / event] | Gemini [version] | JSON |

---

## Go-to-Market

### Launch Strategy
- **Phase 1 (Internal)**: [Target early adopters, timeline]
- **Phase 2 (Pilot)**: [Controlled external rollout]
- **Phase 3 (Scale)**: [Broad availability]

### Success Metrics (OKRs)
| Objective | Key Result | Target | Timeline |
|---|---|---|---|
| | | | |

---

## Venture Design Stage Gate

### Readiness Checklist
- [ ] User personas validated with real user interviews
- [ ] MVP feature set defined and prioritized
- [ ] System architecture reviewed and approved
- [ ] Go-to-market plan drafted
- [ ] Resource requirements identified (team, budget, timeline)
- [ ] Compliance/regulatory review completed

### Advance Decision
[ ] Advance to Technical Build (Stage 4)
[ ] Refine design (gaps: _____________)
[ ] Deprioritize (reason: _____________)

---

## Metadata
- **Venture Lead**: [Name, Role]
- **Executive Sponsor**: [Name, Role]
- **Design Date**: [YYYY-MM-DD]
- **Target Build Start**: [YYYY-MM-DD]
- **GitHub Project**: [URL]
- **Status**: [ ] Drafting  [ ] Review  [ ] Approved  [ ] Rejected
