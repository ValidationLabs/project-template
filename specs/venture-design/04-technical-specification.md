# Stage 4: Technical Specification
# Template Version: 1.0
# ValidationLabs Innovation Lab | Stage Gate: Build

---

## Spec Header

**Feature/Spec ID**: SPEC-[XXX]
**Title**: [Feature name]
**Venture**: [Venture name]
**Author**: [Name]
**Status**: [ ] Draft  [ ] Review  [ ] Approved  [ ] Implemented
**Venture Design Ref**: `specs/venture-design/03-venture-design-document.md`

---

## Problem Statement
> What engineering problem does this spec solve?

[PLACEHOLDER]

---

## Proposed Solution

### High-Level Approach
[2-3 sentences describing the implementation strategy]

### Component Architecture
```
[Describe the components/services involved and how they interact]
```

### Files to Create/Modify
| File | Action | Purpose |
|---|---|---|
| `components/[Feature].tsx` | CREATE | UI component for [feature] |
| `services/[service].ts` | MODIFY | Add [method] to handle [logic] |
| `types.ts` | MODIFY | Add [TypeName] interface |

---

## Data Model

### New/Modified Firestore Collections
```typescript
// Collection: [collectionName]
interface [DocType] {
  id: string;
  [field]: [type];   // [description]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Rules Addition
```javascript
match /[collection]/{docId} {
  allow read: if request.auth != null && [condition];
  allow write: if request.auth != null && [condition];
}
```

---

## API Contract

### New Endpoints / Functions
```typescript
// [Service method name]
// Input:
interface [InputType] {
  [field]: [type];
}

// Output (always ActionResult):
type Result = ActionResult<[OutputType]>;

// Example call:
const result = await [serviceName].[method]({ ... });
if (!result.ok) { /* handle error */ }
const data = result.data;
```

---

## AI Agent Specification (if applicable)

**Agent Name**: [Name]
**Trigger**: [User action or system event]
**Model**: Gemini [version]
**Prompt Strategy**: [Chain-of-thought / direct / structured output]

```typescript
// Response schema (enforced via responseSchema)
const schema = {
  type: 'object',
  properties: {
    [field]: { type: '[string|number|boolean]', description: '[purpose]' }
  },
  required: ['[field]']
};
```

**Error Handling**: [What happens when the model fails or returns invalid JSON]

---

## Acceptance Criteria (Gherkin)

```gherkin
Feature: [Feature name]

  Scenario: Happy path
    Given [the user is authenticated and in workspace X]
    When [user performs primary action]
    Then [expected outcome is visible]
    And [data is correctly persisted to Firestore]

  Scenario: Edge case — [description]
    Given [edge condition]
    When [action]
    Then [graceful handling]

  Scenario: Error state
    Given [failure condition - e.g., API timeout]
    When [action that depends on the service]
    Then [user sees a helpful error message]
    And [no data corruption occurs]
```

---

## Testing Plan

### Unit Tests
- [ ] [Service method] returns correct output for [input]
- [ ] [Validation logic] rejects [invalid input]

### E2E Tests (Playwright)
- [ ] `tests/e2e/[feature].spec.ts` — covers all Gherkin scenarios above
- [ ] Tests run against `PLAYWRIGHT_BASE_URL` (live deployment)

### Manual QA Checklist
- [ ] Feature works in Chrome
- [ ] Feature degrades gracefully on slow network
- [ ] Firestore rules block unauthorized access

---

## Implementation Checklist
- [ ] Types added to `types.ts`
- [ ] Firestore rules updated and tested
- [ ] E2E tests written BEFORE implementation (TDD)
- [ ] GitHub Issue created with Gherkin acceptance criteria
- [ ] Branch named `feature/SPEC-[XXX]-[slug]`
- [ ] PR includes `Closes #[issue-number]`
- [ ] CI pipeline passes (lint → typecheck → build → e2e)

---

## Metadata
- **GitHub Issue**: #[N]
- **Milestone**: `[venture-name]-v[X.X]`
- **Estimated Effort**: [S/M/L/XL]
- **Dependencies**: [Other specs or issues this depends on]
