# Student-facing audit

## Release verification — 2026-08-20

- TypeScript, 27 automated content/safety tests, compiled webview JavaScript,
  CSP-compatible event wiring, accessible-export checks, and VSIX packaging
  passed.
- All 13 generated starters were created in disposable directories and their
  declared C, Python, or shell workflow ran successfully. The portable root C
  starter and `docker compose config --quiet` also passed.
- The generated Dockerfile has exact syntax/content assertions and no stray
  patch-marker commands. A daemon-backed `docker build --check` could not run
  because this node cannot access the Docker socket; a clean host/container
  launch remains an instructor pre-release check.
- The review was read-only with respect to Canvas and university systems. No
  student data, course setting, deadline, assignment, or submission was read or
  changed.

## Primary tasks

- A student can reach the 13-module sequence, five-question practice, guided
  labs, coursework mission control, progress, and help directly from the main
  navigation. The first-run walkthrough is self-paced, skippable, and rerunnable.
- Each module exposes reading, novice explanation, eight explained questions,
  source evidence, a five-step guided lab, and local reflection status.
- Coursework is separated into three homework and four programming components.
  It is explicitly a planning map so stale historical requirements cannot be
  mistaken for Fall 2026 instructions.
- Canvas is one click away and is repeatedly identified as the authority for
  submissions, deadlines, feedback, and grades.
- The environment checker is non-mutating. Workspace creation is explicit,
  refuses to overwrite an existing destination, and exposes the Docker recipe
  for review.
- Canvas calendar import enforces a 2 MiB/500-event bound, preserves TZID and
  date-only events, removes unsafe links, and requires an explicit preview step
  before reminders are kept. Mixed-course titles are not silently accepted.
- The pre-class composer copies a structured draft and opens a configured
  Canvas discussion or private route. It never posts and never claims that an
  anonymous preference made a post anonymous.

## Accessibility

- Webviews use semantic headings, landmarks, labels, native inputs, buttons,
  lists, tables, and `<progress>`.
- Every interaction is keyboard-accessible; focus has a visible outline; no
  meaning depends only on color; the layout reflows at narrow widths. Modal
  walkthrough/notice focus is moved, trapped, dismissible with Escape, and
  restored to the invoking control where one exists.
- Tutor and grade results use live regions. Module controls expose expanded
  state. Text follows the VS Code theme, while standalone HTML provides tested
  high-contrast light/dark palettes.
- The course pack exports a no-script standalone HTML lesson collection for
  Canvas and assistive technology. It contains all 104 question explanations,
  source labels, and guided-lab steps without requiring webview JavaScript.

## Learning and integrity boundaries

- Practice attempts, confidence, and status are local self-evaluation—not a
- Saved questions, review dates, per-topic analytics, guided-lab checkmarks,
  coursework status, and reviewed calendar reminders also stay local.
- The grade calculator is a planning estimate based on verified historical
  weights. It does not read Canvas, apply an unverified drop rule, or claim an
  official result.
- The helper is offline and deterministic. It refuses finished assignment
  answers/code and redirects to invariants, analogous examples, errors, and the
  student's own attempt.
- Read-only evidence validation reports file counts, size, and historical
  extension hints. It does not archive, upload, submit, or grade files.

## Remaining instructor checks before launch

- Confirm or replace the provisional grading policy in the Fall 2026 syllabus.
- Add the direct Canvas URL and current office hours.
- Add any future department-confirmed GSI or grader. No GSI or grader is
  currently assigned or confirmed; check Canvas and department announcements
  for updates.
- Publish all assignment specifications and due dates before the corresponding
  module begins; confirm the xv6 revision/container.
- Run the packaged VSIX in a clean Windows, macOS, and Linux VS Code profile;
  the repository test suite cannot prove host Docker/virtualization support.
- Verify the generated Canvas HTML with the campus accessibility checker and a
  screen reader in the actual Canvas theme.
