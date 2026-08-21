# Professional learning-experience audit

Reviewed 2026-08-21 using the two-axis method in `FEATURE_CONFIDENCE_SCORECARD.md`. Repository evidence and learner-effect evidence are reported separately; feature counts are not treated as proof of usability or learning.

| Capability | Implementation confidence | Learner evidence | Important remaining gate |
|---|---|---|---|
| First action and navigation | Moderate–strong: four-task home, one setup action, section navigator, unit tabs, and task tabs inside modules | Unverified | Observe first-time students finding setup, next reading, practice, lab, and Canvas |
| Setup and recovery | Moderate–strong: Docker/client/engine distinction, attempted Desktop start, manifest-safe workspace, pinned environment, verified preflights, deterministic help, and optional Orbit escalation | Unverified | Physical Windows/macOS/Apple-silicon and managed-device trials |
| Source-mapped instruction | Moderate–strong: 13 modules, exact OSTEP links, accessible explanations, focus prompts, source trails, and automated coverage checks | Unverified | Instructor content validation and observed reading-to-class preparation |
| Practice and continuation | Moderate: 104 mapped questions, hints, explanations, intentional confidence in short sessions, saved/due review, and transparent analytics | Unverified | Choice-specific misconception feedback, transfer cases, and observed usefulness |
| Hands-on systems work | Strong for tested public contracts: 13 starters, 15 pinned OSTEP presets, portable prerequisites, and pinned xv6/QEMU preflights | Unverified | Representative student task completion and physical host validation |
| AI/offline coaching | Moderate: student-account Copilot, optional published/indexed U-M route, deterministic helper/FAQ, attempt-first guardrails, and no instructor key | Unverified | Published student-facing U-M app, copied-question evaluation, and observed escalation behavior |
| Progress and grade planning | Moderate–strong: deterministic local indicators, transparent historical-policy calculation, privacy boundary, and Canvas separation | Unverified | Student interpretation study and confirmed Fall 2026 Canvas policy |
| Accessibility | Moderate: semantic HTML, wrapping keyboard tabs, focus routing, reduced-motion-aware deep links, theme support, and standalone accessible content | Unverified | Keyboard/200%/400%/screen-reader checks on representative devices and Canvas theme |
| Release and cross-platform packaging | Strong for automated scope: package, Extension Host, integrity, Linux containers, C, OSTEP, and xv6/QEMU checks | Not applicable as learner-effect evidence | Hosted CI does not reproduce physical Docker Desktop, firmware, campus policy, or every assistive-technology path |

## Release judgment

The repository supports a release-quality, course-specific desktop workflow with substantial automated implementation evidence. It does **not** yet establish that the interface improves learning, confidence, setup time, accessibility, or course outcomes. Those learner-effect claims remain pending observed task studies and accessibility checks.

The next evidence step is a representative task walkthrough: install the VSIX, recover one setup failure, find the next module, complete one practice sequence, run one OSTEP or xv6 task, and locate the authoritative Canvas submission route. Further source-only review cannot move learner evidence above “unverified.”
