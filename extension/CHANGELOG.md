# Change log

## 0.5.0 — 2026-08-20

- Added a dated 27-meeting Fall 2026 plan that maps every class meeting to the
  relevant lecture module and 29 direct, official OSTEP chapter links across
  virtualization, concurrency, and persistence.
- Exposed every chapter and its focused before-class prompt in the learning
  hub and accessible Canvas-ready export; all 104 explained questions and
  private self-evaluations remain attached to their mapped modules.
- Added the verified CIS 450 / ECE 478 Canvas course 552201 as the default
  course link while retaining safe instructor overrides for discussions and
  private messages.
- Expanded the FAQ and troubleshooting routes using anonymized recurring
  student-evaluation and email concerns: C/Make prerequisites, Docker and
  Apple-silicon setup, xv6 translation, archive recovery, evidence ambiguity,
  scheduler specifications, formative feedback, and Canvas-grade boundaries.
- Tightened PA1A to select a tested legacy-compatible QEMU machine and verify a
  clean two-CPU xv6 boot, both CPU startup messages, shell startup, a runnable
  shell marker, and process exit. This fixes the verified case where a modern
  default QEMU machine accepted `-smp 2` but exposed only one CPU to xv6.
- Updated the syllabus and accessible lesson collection with the reading plan,
  support routes, and explicit Canvas-authority boundaries.

## 0.4.0 — 2026-08-20

- Added a manifest-validated portable coursework workspace for HW1, HW2, HW3,
  and PA3 with fixed, shell-free prerequisite preflights and expected evidence
  anchors.
- Standardized the common Windows/macOS/Linux route on one visible Ubuntu
  Docker/Dev Containers recipe containing C/pthreads, Python, Make, GDB,
  Valgrind, `strace`, and QEMU.
- Added course-home, tree, and per-coursework actions for setup diagnostics,
  preflight execution, and the cross-platform guide; native execution is only
  offered on detected POSIX hosts.
- Added an optional one-click Dev Container handoff. Microsoft Dev Containers
  is installed only after a modal student confirmation; Docker remains a
  separate explicit prerequisite.
- Kept setup claims explicit: the extension does not silently install Docker,
  enable virtualization, change administrator settings, grade, upload, or
  submit work.
- Extended release execution to run all public HW1/HW2/HW3/PA3 prerequisite
  routes; the Docker path runs too when a daemon is available.

## 0.3.0 — 2026-08-20

- Added a pinned, solution-free official MIT x86 xv6 workspace generator with
  exact revision verification, reviewable Docker fallback, local baseline
  commit/tag, and no silent dependency installation.
- Added PA1A build/boot, PA1B instrumentation, and PA2 FQ/AQ behavioral
  preflights that execute the student's current kernel in QEMU; PA2 also runs
  full upstream `usertests`.
- Corrected two validated historical setup defects: narrow modern-GCC
  compatibility flags and a `volatile` spin counter so `-O2` cannot remove the
  timer workload.
- Made completion assertions robust to legitimate character-level interleaving
  between xv6 user output and kernel timer logging, a defect found by repeated
  end-to-end release execution.
- Expanded the PA2 guide with queue-membership, locking, wakeup, partial-quantum,
  O(1)-swap, and evidence invariants identified during implementation.
- Retained cumulative known-good PA1/PA2 patches and a reproducible validation
  report outside the student package; the VSIX audit rejects them.

## 0.2.0 — 2026-08-20

- Expanded to 104 explained, source-grounded questions: eight per module with
  multiple Bloom levels, hints, and accessible HTML export.
- Added five-question practice, saved/due/spaced review, confidence-aware
  attempts, and local per-topic analytics.
- Added a skippable/rerunnable self-paced walkthrough, structured FAQ, guarded
  offline helper, and a student-controlled pre-class Canvas question handoff.
- Added thirteen tested guided OS lab starters, portable workspace diagnostics,
  coursework mission control, read-only evidence validation, configurable
  Canvas links, and reviewed-before-save ICS import.
- Removed an unverified GSI identity after official department assignment
  evidence showed that person was assigned to another course.
- Added a release-tested formative route for every coursework guide, a local
  coursework progression visualization, and exact automated/manual coverage.
- Added 13 completed internal-only lab references and seven coursework
  reference suites with strict compile/run diagnostics and VSIX exclusion.
- Added an optional original animated OS companion with privacy,
  reduced-motion, keyboard, focus, hide, and restore behavior.

## 0.1.0 — 2026-08-20

- Initial private Fall 2026 CIS 450 / ECE 478 active-course release.
- Added 13 OSTEP-aligned modules, 39 explained questions, and mapped hands-on
  activities.
- Added coursework progression, portable OS lab, local progress/confidence,
  a planning-only grade estimate, an offline integrity-guarded helper,
  accessible HTML content, and a verified calendar.
