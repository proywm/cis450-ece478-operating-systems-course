# CIS 310 feature-parity audit for SystemStudio OS

This audit compares the current CIS 450 / ECE 478 extension with the current
CIS 310 learning surfaces. “Parity” means the same student need is addressed;
it does not mean copying circuit, Digital, MASM/NASM, artwork, or course content.

| Learning surface | SystemStudio OS implementation | Verification |
|---|---|---|
| Visible course map | Thirteen sidebar and in-hub modules grouped by virtualization, concurrency, and persistence, plus a dated plan for 26 regular classes, the October 14 midterm, and the December 14 final | `core.test.ts`; calendar and webview parity tests |
| Accessible lessons | Semantic standalone HTML with objectives, direct explanation, source, hands-on activity, and 104 explained checks | Accessible export test; 104 `<details>` assertions |
| Short and cumulative practice | Five-question recommended/due/saved/topic sessions, confidence, explanations, saved items, and spaced review | `learning.test.ts` |
| Textbook simulations | Fifteen exact OSTEP chapter presets, pinned official opt-in checkout, predict/reveal separation, private counts, and native Python/Docker routes | `ostepSimulators.test.ts`; `smokeOstepSimulators.ts` |
| Guided building | Thirteen non-overwriting C/Python/shell starters mapped one-to-one to modules | `labs.test.ts`; `smokeLabs.ts` |
| Completed reference behavior | Thirteen internal-only known-good formative references, mapped to every lab step | `referenceSolutions.test.ts`; `smokeReferences.ts` |
| Coursework progression | Seven ordered planning cards, self-reported progression bar, evidence checklist, local file validation, and release-tested formative routes | webview parity and course-data tests |
| Orientation | First-run, skippable, resumable, and rerunnable walkthrough covering reading, questions, OSTEP simulations, labs, portable tools, xv6, Canvas, and help | `learning.test.ts`; webview syntax test |
| Progress boundary | Local status, confidence, practice, lab, and coursework indicators repeatedly distinguished from Canvas grades/evaluation | webview parity and release tests |
| Grade planning | Dedicated predictor with manual category entry, weighted contributions, projected result/letter, normalized pre-final standing, selected target grade, and required-final calculation; no Canvas access and no invented drop rule | `core.test.ts`; webview parity; syllabus/provenance notices |
| FAQ/helper | Structured evaluation/email-informed FAQ and deterministic offline helper with assessed-work refusal and attempt-first prompts | `core.test.ts`; `learning.test.ts`; student audit |
| Optional companion | Original animated Orbit artwork opening actual optional AI coaching, local helper, or practice; hide/restore, Escape, focus handling, and reduced-motion support | `webviewParity.test.ts`; `checkWebviewSyntax.mjs` |
| AI learning coach | Student-account Copilot panel, optional published/indexed U-M tutor route, module-grounded prompts, and deterministic assessed-work refusal before model access | `aiCoach.test.ts`; packaged Extension Host checks |
| Setup and recovery | One guided Docker/container workflow, verified existing-workspace reuse, Windows/macOS Docker Desktop startup, bounded Orbit diagnostics, and readiness only after preflight | `release.test.ts`; `workspace.test.ts`; integration checks |
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
- The optional companion uses original course artwork and no third-party pet
  code or artwork.
- No external AI service or instructor key is bundled. AI access is optional
  through the student's account; the separate deterministic helper remains
  offline.

## Accessibility checks

- Semantic headings, labeled form fields and progress elements, keyboard
  controls, visible focus, focus restoration, Escape dismissal, and a trapped
  walkthrough dialog are present.
- Companion motion is disabled under `prefers-reduced-motion: reduce`.
- Accessible HTML lessons and syllabus work without extension scripts.
- A clean student-profile and campus accessibility-checker pass remains an
  instructor launch check because this node cannot reproduce every assistive
  technology or host theme.
