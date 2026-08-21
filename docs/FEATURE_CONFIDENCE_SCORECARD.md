# Feature confidence scorecard

This course uses two separate evidence axes:

1. **Implementation confidence** — source contracts, automated checks, packaged-extension checks, manual representative walkthroughs, recovery, keyboard/reflow behavior, and clean regression.
2. **Learner evidence** — observed intended users completing prespecified tasks, plus accessibility and comprehension evidence where relevant.

| Feature family | Strong implementation gate | Current learner evidence |
|---|---|---|
| Navigation and tabs | Semantic relationships; keyboard order; visible focus; remembered state; deterministic deep links; narrow reflow; regression checks | Unverified |
| Lessons and orientation | Purpose and scope; bounded vocabulary; examples before prediction; minimum/deeper-work distinction; recoverable navigation | Unverified |
| Practice | Source map; fresh evidence; intentional confidence; explanation; hint; retry/review; no mastery overclaim | Unverified |
| Coach | Course-grounded prompt; progressive hint; assessed-work refusal; privacy; offline fallback; human escalation | Unverified |
| Setup and execution | One next action; first actionable error in the UI; safe retry; no hidden Output dependency; verified readiness | Unverified |
| Progress | Explainable next action; version-aware local evidence; due/saved review; export/reset; no surveillance or hidden mastery | Unverified |
| Accessibility | Semantics; focus restoration; keyboard; 200%/400% reflow; contrast; reduced motion; live status; failure recovery | Unverified |

“Strong” may be used only feature-by-feature after every applicable implementation gate is checked. “Effective,” “improves,” and similar learner claims require observed learner evidence.
