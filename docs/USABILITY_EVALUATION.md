# Iterative usability evaluation

Evaluated 2026-08-21. This document records a formative implementation review, not a learner-outcome study.

## Method and evidence boundary

Three independent student personas and three independent educator personas reviewed both extensions:

- Student A: first-time, setup-anxious novice
- Student B: intermediate, outcome-focused learner
- Student C: advanced, efficiency-focused learner
- Educator A: novice scaffolding, cognitive load, and accessibility
- Educator B: learning science and assessment
- Educator C: accessibility and release quality

The reviewers were independent AI review agents inspecting source, generated content, tests, and release behavior. They were not human participants and did not supply observed learner evidence. Scores therefore indicate implementation/usability plausibility only. They do not establish effectiveness, accessibility conformance, learning gains, confidence gains, or mastery.

Each dimension uses a 1–5 scale. For TMI/cognitive load, 5 means information load is exceptionally well controlled. Each cell is **baseline → final**.

## Reconstructed CIS 310 table

| Reviewer | Task clarity | Navigation | Readability | TMI control | Error recovery | Accessibility | Learning confidence | Professional readiness | Mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Student A | 4→4 | 4→5 | 4→4 | 3→4 | 4→4 | 3→3 | 4→4 | 3→4 | 3.63→4.00 |
| Student B | 5→5 | 4→4 | 4→5 | 3→4 | 5→5 | 4→4 | 4→4 | 4→4 | 4.13→4.38 |
| Student C | 4→5 | 4→5 | 4→4 | 3→4 | 4→4 | 3→4 | 4→4 | 4→4 | 3.75→4.25 |
| Educator A | 4→4 | 4→5 | 4→4 | 3→4 | 3→4 | 3→3 | 3→3 | 3→4 | 3.38→3.88 |
| Educator B | 4→4 | 4→4 | 4→5 | 3→4 | 5→5 | 4→4 | 3→3 | 3→4 | 3.75→4.13 |
| Educator C | 4→4 | 4→4 | 4→4 | 3→4 | 4→4 | 3→4 | 4→4 | 3→4 | 3.63→4.00 |
| **All-reviewer mean** | **4.17→4.33** | **4.00→4.50** | **4.00→4.33** | **3.00→4.00** | **4.17→4.33** | **3.33→3.67** | **3.67→3.67** | **3.33→4.00** | **3.71→4.10** |

## Reconstructed CIS 450 / ECE 478 table

| Reviewer | Task clarity | Navigation | Readability | TMI control | Error recovery | Accessibility | Learning confidence | Professional readiness | Mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Student A | 4→4 | 3→4 | 2→4 | 2→4 | 4→4 | 3→4 | 4→4 | 3→4 | 3.13→4.00 |
| Student B | 4→5 | 3→4 | 3→4 | 2→4 | 5→5 | 3→4 | 3→4 | 3→4 | 3.25→4.25 |
| Student C | 4→4 | 3→4 | 3→4 | 3→4 | 4→4 | 3→4 | 4→4 | 3→4 | 3.38→4.00 |
| Educator A | 4→4 | 3→4 | 2→4 | 2→4 | 3→4 | 2→4 | 3→3 | 3→4 | 2.75→3.88 |
| Educator B | 4→4 | 3→4 | 3→4 | 2→4 | 5→5 | 3→4 | 2→3 | 3→4 | 3.13→4.00 |
| Educator C | 4→4 | 3→4 | 3→4 | 3→4 | 4→4 | 3→4 | 4→4 | 3→4 | 3.38→4.00 |
| **All-reviewer mean** | **4.00→4.17** | **3.00→4.00** | **2.67→4.00** | **2.33→4.00** | **4.17→4.33** | **2.83→4.00** | **3.33→3.67** | **3.00→4.00** | **3.17→4.02** |

## Iterations and changes

### Round 1 — baseline review

The common high-impact findings were long pages, large undifferentiated lists, hidden setup details, incomplete keyboard behavior, and audit language that could be read as a learner-effect claim.

### Round 2 — structural simplification

The implementation added:

- wrapping, remembered, semantic tabs for dense views;
- CIS 310 lesson tabs and three module/lab bands;
- OS unit/task tabs across modules, labs, simulators, coursework, practice, and help;
- thirteen focused OS module lesson pages in place of one roughly 11,000-word page;
- visible setup error details, intentional confidence selection, deterministic deep links, focus routing, reduced-motion handling, and honest two-axis confidence documents.

This round was valuable because one reviewer found a release-blocking CIS 310 generated-script error that source-marker tests had missed.

### Round 3 — narrow regression review

The final pass fixed and verified:

- generated CIS 310 dashboard JavaScript parsing;
- help state, Escape behavior, and focus restoration;
- roving answer-radio focus and programmatic confidence state;
- platform-correct Digital readiness on Linux versus Windows/macOS;
- one consistent embedded/native Digital explanation;
- preparation-checkpoint wording everywhere, with no readiness/mastery implication;
- direct first-error reporting for CIS setup and OS setup/OSTEP/xv6 routes;
- OS notification dialog behavior and keyboard-focusable table reflow;
- removal of stale mastery language.

All six reviewers judged another simulated pass unlikely to produce meaningful returns.

## Deliberate design choices and remaining gates

The complete thirteen-module outline remains visible in the VS Code tree because the course owner explicitly required Canvas/Coursera-like module discoverability. Progressive disclosure occurs inside the learning dashboards and pages rather than hiding the course outline.

The remaining important gaps cannot be closed responsibly by inventing content or repeating source review:

- observe first-time students installing, recovering from stopped Docker, locating next work, completing practice and a lab, and finding the Canvas submission route;
- test physical Windows, Intel/Apple-silicon macOS, and representative Linux/managed devices;
- conduct keyboard-only, 200%/400% reflow, screen-reader, and reduced-motion walkthroughs;
- have educators validate distractor-specific misconception feedback and analogous transfer questions before adding them at scale;
- define an equivalent accessible circuit-authoring accommodation for students who cannot use the graphical Digital canvas.

Suggested observed-task measures are task success, time, dead ends, assistance requests, comprehension check, perceived load, and confidence before/after. Pacing estimates should come from observed medians rather than guesses.

## Decision

The simulated evaluation has reached diminishing returns at an implementation-confidence ceiling. The next iteration is an observed-user study. Until then, learner evidence remains **Unverified**, as recorded in `FEATURE_CONFIDENCE_SCORECARD.md`.
