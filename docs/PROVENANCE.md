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
- The official 2026–2027 academic-calendar dates already validated for the
  companion Fall 2026 course establish August 26 start, September 7 holiday,
  Thanksgiving recess, December 7 end of classes, December 8–9 study days, and
  December 10–16 examination period.

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

Nine locally available instructor PowerPoint sources ground concurrency and
persistence modules. Virtualization modules are grounded in the recent
homework/programming prompts and explicitly mapped OSTEP chapters. The project
links to OSTEP rather than redistributing the book.

## Student-evaluation design response

The Winter 2026 evaluation specifically identified late-posted material,
mismatched reading schedules, rushed slides, limited practical setup guidance,
late feedback, unclear project starts, and a desire for concrete Docker,
Makefile, C, race-condition, semaphore, and programming demonstrations. The
extension responds with a visible 13-module map, advance readings, concise text
explanations, formative checks with explanations, hands-on artifacts, a
portable lab, evidence checklists, and a focused help ladder.

The portable lab now maps HW1, HW2, HW3, and PA3 to fixed prerequisite
preflights in one visible Ubuntu container recipe. This directly addresses the
compiler/environment setup concern without treating a successful environment
check as proof of assignment correctness. Docker installation, virtualization,
and managed-device permission remain host prerequisites rather than claimed
extension capabilities.

## Not verified—therefore not claimed

- Direct Fall 2026 Canvas course ID
- Fall 2026 assignment release/due dates or exact prompt wording
- Fall 2026 exam dates and room
- Fall 2026 office hours
- Any grading-policy change after Winter 2026
- Any future CIS 450 / ECE 478 GSI or grader assignment
- Whether Fall 2026 will use the verified historical xv6 reference or another
  revision/container/specification

Those details are labeled Canvas-authoritative throughout the product.
