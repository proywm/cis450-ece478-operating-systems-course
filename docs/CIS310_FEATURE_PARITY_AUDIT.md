# CIS 310 feature-parity audit for SystemStudio OS

This audit compares the current CIS 450 / ECE 478 extension with the current
CIS 310 learning surfaces. “Parity” means the same student need is addressed;
it does not mean copying circuit, Digital, MASM/NASM, artwork, or course content.

| Learning surface | SystemStudio OS implementation | Verification |
|---|---|---|
| Visible course map | Thirteen sidebar and in-hub modules grouped by virtualization, concurrency, and persistence, plus a dated 27-meeting preparation plan | `courseData.test.ts`; calendar and webview parity tests |
| Accessible lessons | Semantic standalone HTML with objectives, direct explanation, source, hands-on activity, and 104 explained checks | Accessible export test; 104 `<details>` assertions |
| Short and cumulative practice | Five-question recommended/due/saved/topic sessions, confidence, explanations, saved items, and spaced review | `learning.test.ts` |
| Textbook simulations | Fifteen exact OSTEP chapter presets, pinned official opt-in checkout, predict/reveal separation, private counts, and native Python/Docker routes | `ostepSimulators.test.ts`; `smokeOstepSimulators.ts` |
| Guided building | Thirteen non-overwriting C/Python/shell starters mapped one-to-one to modules | `labs.test.ts`; `smokeLabs.ts` |
| Completed reference behavior | Thirteen internal-only known-good formative references, mapped to every lab step | `referenceSolutions.test.ts`; `smokeReferences.ts` |
| Coursework progression | Seven ordered planning cards, self-reported progression bar, evidence checklist, local file validation, and release-tested formative routes | webview parity and course-data tests |
| Orientation | First-run, skippable, resumable, and rerunnable walkthrough covering reading, questions, OSTEP simulations, labs, portable tools, xv6, Canvas, and help | `learning.test.ts`; webview syntax test |
| Progress boundary | Local status, confidence, practice, lab, and coursework indicators repeatedly distinguished from Canvas grades/evaluation | webview parity and release tests |
| Grade planning | Optional historical Winter 2026 estimator only; no Canvas access and no invented drop rule | `core.test.ts`; syllabus/provenance notices |
| FAQ/helper | Structured evaluation/email-informed FAQ and deterministic offline helper with assessed-work refusal and attempt-first prompts | `core.test.ts`; `learning.test.ts`; student audit |
| Optional companion | Original inline vector/CSS control opening only local helper/practice; hide/restore, Escape, focus handling, and reduced-motion support | `webviewParity.test.ts`; `checkWebviewSyntax.mjs` |
| Course operations | Verified meeting calendar, 29-link OSTEP plan, accessible syllabus, conservative staffing status, verified Canvas course 552201, reviewed ICS import, and pre-class draft handoff | calendar, learning, and release tests |
| Portable tools | Reviewable Ubuntu Docker/Dev Container recipe with GCC, GDB, Python, QEMU, strace, and Valgrind; nothing installed silently | workspace tests; starter smoke; Compose validation |
| Assessed-system preflight | Solution-free pinned MIT x86 xv6 setup; PA1A/PA1B/PA2 validators run the current workspace in QEMU and PA2 runs upstream `usertests` | `xv6.test.ts`; `smokeXv6.ts`; instructor-only validation report; VSIX exclusion audit |

## Intentional differences

- Digital circuit simulation and assembly workbenches are not relevant to this
  operating-systems course and were not copied.
- The OS course has a verified historical x86 xv6 reference and verified Fall
  2026 Canvas course 552201, but no confirmed Fall 2026 xv6 revision,
  assignment deadlines, or grading change. The extension labels the
  distinction and defers active facts to Canvas instead of fabricating them.
- The optional companion is an original terminal-window vector and CSS
  animation. It uses no CIS 310 companion asset and no `vscode-pets` code or
  artwork.
- No external AI service is bundled. The helper is deterministic and offline.

## Accessibility checks

- Semantic headings, labeled form fields and progress elements, keyboard
  controls, visible focus, focus restoration, Escape dismissal, and a trapped
  walkthrough dialog are present.
- Companion motion is disabled under `prefers-reduced-motion: reduce`.
- Accessible HTML lessons and syllabus work without extension scripts.
- A clean student-profile and campus accessibility-checker pass remains an
  instructor launch check because this node cannot reproduce every assistive
  technology or host theme.
