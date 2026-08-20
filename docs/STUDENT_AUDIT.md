# Student-facing audit

## Primary tasks

- A student can reach the 13-module sequence from the activity bar and from the
  learning hub. The sequence exposes reading, explanation, practice, hands-on
  work, and a local reflection status in one place.
- Coursework is separated into three homework and four programming components.
  It is explicitly a planning map so stale historical requirements cannot be
  mistaken for Fall 2026 instructions.
- Canvas is one click away and is repeatedly identified as the authority for
  submissions, deadlines, feedback, and grades.
- The environment checker is non-mutating. Workspace creation is explicit,
  refuses to overwrite an existing destination, and exposes the Docker recipe
  for review.

## Accessibility

- Webviews use semantic headings, landmarks, labels, native inputs, buttons,
  lists, tables, and `<progress>`.
- Every interaction is keyboard-accessible; focus has a visible outline; no
  meaning depends only on color; the layout reflows at narrow widths.
- Tutor and grade results use live regions. Module controls expose expanded
  state. Text follows the VS Code theme, while standalone HTML provides tested
  high-contrast light/dark palettes.
- The course pack exports a no-script standalone HTML lesson collection for
  Canvas and assistive technology.

## Learning and integrity boundaries

- Practice attempts, confidence, and status are local self-evaluation—not a
  course grade and not visible to staff.
- The grade calculator is a planning estimate based on verified historical
  weights. It does not read Canvas, apply an unverified drop rule, or claim an
  official result.
- The helper is offline and deterministic. It refuses finished assignment
  answers/code and redirects to invariants, analogous examples, errors, and the
  student's own attempt.

## Remaining instructor checks before launch

- Confirm or replace the provisional grading policy in the Fall 2026 syllabus.
- Add the direct Canvas URL and current office hours.
- Publish all assignment specifications and due dates before the corresponding
  module begins; confirm the xv6 revision/container.
- Run the packaged VSIX in a clean Windows, macOS, and Linux VS Code profile;
  the repository test suite cannot prove host Docker/virtualization support.
- Verify the generated Canvas HTML with the campus accessibility checker and a
  screen reader in the actual Canvas theme.

