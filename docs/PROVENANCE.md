# Course evidence and provenance

## Verified current-term evidence

- Di Ma's August 14, 2026 email attachment, *CIS Class Schedule Fall 2026*,
  generated August 14, lists Dr. Probir Roy for CIS 450-001, Monday/Wednesday
  2:00–3:45 p.m., CASL 1048.
- Official department notices assign the previously proposed student to CIS
  200 Lab 002 with Dr. Abu-Nasr, not CIS 450 / ECE 478. Susan Guinn has been
  asked to remove the earlier Canvas role. No GSI or grader is currently
  assigned or confirmed; check Canvas and department announcements for
  updates.
- Instructor identity, email, phone, and CIS 230 office location agree across
  the Fall 2025 and Winter 2026 syllabi.
- The instructor supplied the active Fall 2026 Canvas course URL:
  `https://canvas.umd.umich.edu/courses/552201`.
- The official 2026–2027 academic-calendar dates already validated for the
  companion Fall 2026 course establish August 26 start, September 7 holiday,
  Thanksgiving recess, December 7 end of classes, December 8–9 study days, and
  December 10–16 examination period.
- The current Fall 2026 course calendar and syllabus place the planned midterm
  on Wednesday, October 14, 2:00–3:45 p.m., covering Modules 1–6. This exam
  replaces that day's regular class; the next regular meeting is Monday,
  October 19 and begins Module 7.
- The same current materials list the final examination on Monday, December 14,
  3:00–6:00 p.m., in CASL 1048 unless the Registrar or Canvas announces a
  change.

## Verified historical policy/content basis

The Winter 2026 syllabus states: participation 10%, three homework assignments
15%, four programming components 40%, and two exams 35% (midterm 15%, final
20%). The letter-grade thresholds implemented by the local estimator match that
syllabus. The Fall 2025 syllabus uses the same scheme.

Historical Fall 2025/Winter 2026 assignments establish the progression used by
the planning map: process/xv6 setup and instrumentation, CPU scheduling,
address translation, scheduler implementation, concurrency, and a pthread
synchronization system. Historical dates and submission details are not copied
into the active course pack.

The exact Winter 2026 PA1 Part 1, PA1 Part 2, and PA2 PDFs are retained under
`instructor-sources/reference-assignment-pdfs/`. Executable validation maps them
to the official MIT x86 `xv6-public` repository at commit
`eeb7b415dbcb12cc362d0783e41c3d1f44066b17`. The known-good reference was built
and booted in QEMU; its PA1 runtime evidence and PA2 FQ/AQ/EQ behavior were
observed; full upstream `usertests` passed on clean one- and two-CPU images.
This is explicitly labeled a historical reference, not an inferred Fall 2026
assignment source.

All 29 assigned OSTEP chapters and all nine locally available instructor
PowerPoint sources received an individual structural/content audit documented
in `docs/OSTEP_LECTURE_SIMULATION_AUDIT.md`. The decks ground concurrency and
persistence modules. No virtualization deck was found locally, so those
modules are explicitly grounded in the recent homework/programming prompts,
syllabus, and mapped OSTEP chapters without claiming a deck comparison. The
project links to OSTEP rather than redistributing the book.

The official OSTEP homework repository was inspected and pinned at commit
`afb36ca8ddbf81d847d18f6bd18a87f0a18667f2`. Fifteen chapter-mapped presets
were executed both in prediction mode and computed-feedback mode. Because no
top-level license file was present in that checkout, the extension does not
redistribute or modify the simulator source; it fetches the pinned official
repository only after explicit student consent.

## Student-evaluation design response

Fall 2024, Fall 2025, and Winter 2026 evaluations repeatedly identified a steep
transition into C/xv6 programming, compiler/Docker setup friction, limited
practical demonstrations, unclear project starts or evidence expectations,
lecture pacing, delayed feedback, and reading schedules that did not match the
actual class sequence. Relevant historical course-email threads independently
showed Apple-silicon/QEMU input problems, archive/extraction ambiguity,
difficulty translating an in-class scheduler into xv6, and uncertainty about
required boot evidence. No student names, messages, or identifiers are copied
into this repository.

The extension responds with a visible 13-module map; a dated plan for 26
regular classes plus the October 14 midterm and December 14 final;
29 direct links to the current official OSTEP chapter PDFs with focus prompts;
concise accessible explanations; 104 formative questions with explanations;
15 official predict-first simulator presets; hands-on artifacts; a portable
lab; a headless two-CPU PA1A baseline that
checks CPU and shell boot markers; evidence checklists; early project routes;
and a focused FAQ/help clinic.

The portable lab now maps HW1, HW2, HW3, and PA3 to fixed prerequisite
preflights in one visible Ubuntu container recipe. This directly addresses the
compiler/environment setup concern without treating a successful environment
check as proof of assignment correctness. Docker installation, virtualization,
and managed-device permission remain host prerequisites rather than claimed
extension capabilities.

## Not verified—therefore not claimed

- Fall 2026 assignment release/due dates or exact prompt wording
- Fall 2026 exam scope, format, and allowed materials beyond the current
  planned coverage statements
- Fall 2026 office hours
- Any grading-policy change after Winter 2026
- Any future CIS 450 / ECE 478 GSI or grader assignment
- Whether Fall 2026 will use the verified historical xv6 reference or another
  revision/container/specification

Those details are labeled Canvas-authoritative throughout the product.
