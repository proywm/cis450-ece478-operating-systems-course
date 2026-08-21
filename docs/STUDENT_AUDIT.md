# Student-facing audit

## Release verification — 2026-08-20

- TypeScript, automated content/safety/accessibility tests, compiled webview JavaScript,
  CSP-compatible event wiring, accessible-export checks, and VSIX packaging
  passed.
- All 13 generated starters were created in disposable directories and their
  declared C, Python, or shell workflow ran successfully. The portable root C
  starter and `docker compose config --quiet` also passed.
- All 13 completed internal references ran successfully, and seven coursework
  suites reran 15 mapped executable checks. C references compiled with strict
  warnings as errors. Package auditing excludes every internal reference.
- All 15 selected official OSTEP simulator presets ran from the exact pinned
  upstream commit in both prediction mode (without `-c`) and computed-feedback
  mode (with `-c`). The upstream source is not bundled in the VSIX.
- The release cloned the exact official MIT x86 xv6 commit, clean-built and
  booted it in QEMU, executed the private known-good PA1B reference, executed
  the private known-good PA2 FQ/AQ/EQ scheduler, and completed full upstream
  `usertests`. A separate clean two-CPU run also completed full `usertests`.
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
  source evidence, a five-step guided lab, local reflection status, and an
  exact official simulator where the book supplies one.
- The dated 27-meeting plan exposes 29 direct official OSTEP chapter links,
  including a focused before-class reading purpose for every assigned chapter.
  The plan covers virtualization, concurrency, and persistence and does not
  copy or redistribute the book.
- Coursework is separated into three homework and four programming components.
  It is explicitly a planning map so stale historical requirements cannot be
  mistaken for Fall 2026 instructions.
- Canvas is one click away and is repeatedly identified as the authority for
  submissions, deadlines, feedback, and grades.
- The verified Fall 2026 course link is
  `https://canvas.umd.umich.edu/courses/552201`; discussion and private-message
  destinations remain instructor-configurable because their exact URLs were
  not verified.
- The environment checker is non-mutating. Workspace creation is explicit,
  refuses to overwrite an existing destination, and exposes the Docker recipe
  for review.
- Official OSTEP simulator setup is also explicit and non-overwriting. It
  verifies one pinned upstream commit, leaves the checkout unmodified, and
  runs fixed shell-free Python argument arrays either natively or through a
  visible container recipe. Computed output requires a prediction confirmation.
- HW1, HW2, HW3, and PA3 each have a per-card prerequisite-preflight action.
  A manifest prevents the extension from running these commands in an
  unrelated workspace. Docker is the common Windows/macOS/Linux route; native
  execution is offered only on detected POSIX hosts. The fixed Python runner
  invokes no shell and runs only bundled formative analogs.
- The xv6 generator verifies an exact official commit, adds only public
  compatibility/setup/preflight files, records a solution-free baseline, and
  refuses to overwrite a destination. PA1A/PA1B/PA2 preflights execute the
  current workspace only after trust, route selection, and a modal explanation.
- Canvas calendar import enforces a 2 MiB/500-event bound, preserves TZID and
  date-only events, removes unsafe links, and requires an explicit preview step
  before reminders are kept. Mixed-course titles are not silently accepted.
- The pre-class composer copies a structured draft and opens a configured
  Canvas discussion or private route. It never posts and never claims that an
  anonymous preference made a post anonymous.
- The FAQ and generated troubleshooting guide address recurring anonymized
  concerns found in recent evaluations and course email: C/Make background,
  Docker and Apple-silicon setup, graphical QEMU input, archive/path mistakes,
  xv6 scheduler translation, ambiguous evidence, specification edge cases,
  immediate formative feedback, and Canvas-versus-planning grade displays.

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
- The optional companion uses an original inline terminal-window vector, opens
  only local helper/practice surfaces, can be hidden/restored, closes with
  Escape, restores focus, and disables motion under reduced-motion settings.

## Learning and integrity boundaries

- Practice attempts, confidence, and status are local self-evaluation—not a
  Canvas grade or instructor evaluation.
- Saved questions, review dates, per-topic analytics, guided-lab checkmarks,
  simulator practice/reveal counts, coursework status, and reviewed calendar
  reminders also stay local.
- The dedicated grade predictor accepts manually copied Canvas category
  percentages or explicit what-if estimates and exposes each weighted
  contribution, the projected result/letter, normalized pre-final standing,
  and the final-exam percentage needed for a selected target. It remains based
  on verified historical weights, reads no Canvas data, applies no unverified
  drop rule, and never claims an official result.
- The helper is offline and deterministic. It refuses finished assignment
  answers/code and redirects to invariants, analogous examples, errors, and the
  student's own attempt.
- Read-only evidence validation reports file counts, size, and historical
  extension hints. It does not archive, upload, submit, or grade files.
- The coursework pathway bar is explicitly self-reported and separate from
  Canvas evaluation.
- Internal completed references are excluded from the VSIX; package auditing
  rejects test fixtures, instructor-only xv6 patches, solution/answer-key paths,
  and student data.

## Remaining instructor checks before launch

- Confirm or replace the provisional grading policy in the Fall 2026 syllabus.
- Add current office hours when confirmed.
- Add any future department-confirmed GSI or grader. No GSI or grader is
  currently assigned or confirmed; check Canvas and department announcements
  for updates.
- Publish all assignment specifications and due dates before the corresponding
  module begins; explicitly confirm whether Fall 2026 uses the pinned historical
  xv6 reference or another revision/container/specification.
- Run the packaged VSIX in a clean Windows, macOS, and Linux VS Code profile;
  the repository test suite cannot prove host Docker/virtualization support.
  Include Intel and Apple-silicon macOS; the supplied Compose recipe requests
  `linux/amd64`, so Docker's x86-emulation capability must be confirmed.
- Verify the generated Canvas HTML with the campus accessibility checker and a
  screen reader in the actual Canvas theme.
