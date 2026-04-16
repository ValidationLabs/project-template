# Innovation Lab Scoring Rubric
# ValidationLabs | Used by QuantivaAI for automated idea prioritization

## Prioritization Dimensions

All innovation ideas are scored across four dimensions that map directly to
the QuantivaAI strategic matrix visualization.

---

## Dimension 1: Strategic Alignment (30% weight)

**Core Question**: To what degree does this idea accelerate one or more Strategic Pillars?

| Score | Criteria |
|---|---|
| 9-10 | Directly accelerates 2+ primary Strategic Pillars. Evidence is explicit. |
| 7-8 | Directly accelerates 1 primary Pillar. Clear connection to strategy. |
| 5-6 | Indirectly supports strategy. Connection requires inference. |
| 3-4 | Tangential alignment. Could be re-framed to align better. |
| 1-2 | No clear connection to Strategic Pillars. Opportunistic. |

**AI Rule**: Gemini MUST cite specific Pillars from the EnterpriseContext.
A score without cited evidence is invalid.

---

## Dimension 2: Value / ROI (30% weight)

**Core Question**: What is the direct or indirect P&L impact?

| Score | Criteria |
|---|---|
| 9-10 | Quantifiable, direct revenue generation or cost elimination > $1M annually |
| 7-8 | Clear indirect financial benefit, or direct benefit $250K-$1M |
| 5-6 | Moderate efficiency gains or cost avoidance, $50K-$250K range |
| 3-4 | Difficult to quantify, soft benefits only (morale, brand, etc.) |
| 1-2 | No clear financial benefit identified |

---

## Dimension 3: Magnitude of Impact (20% weight)

**Core Question**: What is the cost of the status quo? How urgent is the problem?

| Score | Criteria |
|---|---|
| 9-10 | Status quo is actively causing harm or critical competitive disadvantage |
| 7-8 | Significant operational friction, affects many users daily |
| 5-6 | Moderate impact, affects some users or processes |
| 3-4 | Minor inconvenience, workarounds exist |
| 1-2 | Nice to have, current state is acceptable |

---

## Dimension 4: Horizon / Urgency (20% weight)

**Core Question**: What is the competitive advantage window?

| Score | Criteria |
|---|---|
| 9-10 | Market window closing in < 6 months. First-mover advantage critical. |
| 7-8 | 6-12 month window. Early movers will gain meaningful advantage. |
| 5-6 | 1-2 year window. Moderate competitive pressure. |
| 3-4 | 2-3 year horizon. Low urgency. |
| 1-2 | Market-independent. Can be built anytime. |

---

## Final Score Calculation

```
Total Score = (Alignment × 0.30) + (ROI × 0.30) + (Impact × 0.20) + (Urgency × 0.20)
```

## Strategic Matrix Placement

```
         HIGH ALIGNMENT
              |
  Moonshots   |   ★ Star Ventures
  (Invest in  |   (Pursue Now)
   future)    |
──────────────┼──────────────
  Defer /     |   Efficiency
  Deprioritize|   Wins
              |   (Quick ROI)
         LOW ALIGNMENT
     LOW IMPACT           HIGH IMPACT
```

| Quadrant | Alignment | Impact | Strategy |
|---|---|---|---|
| Star Ventures | High (>6) | High (>6) | Immediate pursuit — full investment |
| Strategic Moonshots | High (>6) | Low (<6) | Invest long-term — phased approach |
| Efficiency Wins | Low (<6) | High (>6) | Fast-track for quick ROI |
| Defer | Low (<6) | Low (<6) | Deprioritize or archive |

---

## Auto-Rescoring Trigger

When Strategic Pillars are updated in QuantivaAI's StrategyConfig:
1. All pending ideas are automatically re-scored against new pillars
2. Dashboard reflects updated prioritization matrix
3. Stakeholders are notified of ranking changes
