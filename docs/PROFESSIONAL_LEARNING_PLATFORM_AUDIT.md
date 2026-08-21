# Professional learning-experience audit

Reviewed 2026-08-21 against the publicly advertised capabilities common to mature self-paced learning platforms. This is an evidence audit, not a marketing claim. Canvas remains the course system of record.

## Feature review

| Professional capability | CIS 450 / ECE 478 implementation | Status and evidence |
|---|---|---|
| Clear first action | **Start Here** leads with one setup/repair workflow, course home, Orbit, and Canvas; manual controls are collapsed under Advanced Diagnostics | Complete; `extension/src/extension.ts` |
| Low-friction setup | One workflow checks Docker/Compose/engine, starts Docker Desktop where possible, creates or safely reuses a manifest-verified workspace, builds the pinned Ubuntu environment, and runs all prerequisite checks before reporting ready | Complete inside the extension's authority. Docker Desktop/Engine, virtualization, licensing, and administrator approval remain an explicit host handoff |
| Setup coaching | Failures offer a bounded Orbit prompt that distinguishes host requirements from container-provided GCC, Make, Python, GDB, and QEMU and gives one verifiable next step | Complete; `aiCoach.ts`, `extension.ts` |
| Modular learning path | Thirteen modules join objectives, exact OSTEP readings, accessible explanations, eight explained questions, simulations, and guided labs | Complete; course-data, reading-map, and webview tests |
| Text and video instruction | Accessible text and exact open-book chapters are mapped per topic | Strong for the available sources. No complete verified author-video collection or bespoke video explanation for each question is claimed |
| Retrieval practice | 104 explained questions, five-question recommended/due/saved/topic sessions, confidence, spaced review, and per-topic analytics | Complete; `learning.test.ts` |
| Personalized continuation | Recommended/due practice, saved review, local confidence/misses, module stage, and coursework progression guide the next action | Complete locally; no opaque mastery claim |
| Hands-on application | Thirteen module starters, fifteen pinned official prediction simulators, portable C/pthreads/Python tooling, and a solution-free pinned xv6/QEMU pathway | Complete for formative preparation; Fall 2026 Canvas specifications remain authoritative |
| Learning coach | Student-account Copilot coach, optional published/indexed U-M tutor route, deterministic offline FAQ, and attempt-first assessed-work guardrails | Complete with an availability boundary: no instructor API key is bundled and no U-M course tutor is claimed ready until published/indexed |
| Human help | FAQ, structured pre-class Canvas draft, private-message route, and instructor/course contacts | Complete as a handoff; no response-time promise |
| Study schedule | Dated 27-meeting preparation plan, exact reading focus, calendar export, and reviewed Canvas calendar import | Complete |
| Progress and confidence | Local module, practice, simulation, lab, coursework, and confidence indicators explicitly separated from Canvas evaluation | Complete and privacy-preserving |
| Grade planning | Manual category entry with weighted contribution, current standing, target-final calculation, and explicit historical-policy warning | Complete as what-if planning; Fall 2026 policy must be confirmed in Canvas |
| Accessibility | Semantic/reflowable HTML, keyboard operation, focus management, reduced motion, native controls, high-contrast/theme support, and standalone lesson export | Strong; physical assistive-technology and Canvas-theme review remains an instructor launch check |
| Cross-platform confidence | Deterministic and packaged Extension Host checks on Windows, macOS, and Ubuntu; actual containers, C, simulations, and xv6/QEMU exercised on Ubuntu CI | Strong. Hosted runners cannot prove an individual student's Docker Desktop, Apple-silicon emulation, firmware virtualization, assistive technology, or campus-device policy |
| Mobile/offline learning | Accessible HTML and local progress/practice run in desktop VS Code | Partial: there is no mobile app; Canvas and the linked open book are the mobile routes |
| Instructor analytics | Official grades, submissions, and instructor evaluation stay in Canvas; private practice state is not uploaded | Intentionally not duplicated, preserving privacy and avoiding a shadow gradebook |

## Release judgment

The extension now meets the professional bar for a desktop, course-specific learning environment: coherent onboarding, source-mapped preparation, retrieval practice, authentic systems work, guarded help, local analytics, accessibility controls, and reproducible release tests operate as one workflow.

It must not be described as a universal commercial learning platform or guaranteed zero-install product. The remaining launch gates are operational: validate the packaged VSIX on representative Intel and Apple-silicon macOS plus Windows devices with Docker Desktop running, confirm the Fall 2026 grading/assignment/xv6 facts in Canvas, publish/index the optional U-M tutor before advertising it, and complete assistive-technology checks in the actual Canvas theme.

