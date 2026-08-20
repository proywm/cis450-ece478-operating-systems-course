# SystemStudio CIS 450 / ECE 478

Private, active-course materials for **CIS 450 / ECE 478: Operating Systems,
Fall 2026**. This is a separate course project—not a senior-design repository
and not a copy of the CIS 310 content.

## Start here

- [`extension/`](extension/) — VS Code extension source, tests, and packaging
- [`course-pack/fall2026/`](course-pack/fall2026/) — syllabus, accessible HTML
  lessons, assignment planning guides, and course calendar source
- [`instructor-sources/`](instructor-sources/) — private historical sources used
  to ground the Fall 2026 build; not packaged into the VSIX
- [`docs/PROVENANCE.md`](docs/PROVENANCE.md) — exactly what was verified,
  carried forward, or intentionally left to Canvas
- [`docs/STUDENT_AUDIT.md`](docs/STUDENT_AUDIT.md) — student-facing usability,
  accessibility, and academic-integrity audit

## Verified Fall 2026 facts

- Section 001, Dr. Probir Roy
- Monday/Wednesday, 2:00–3:45 p.m., CASL 1048
- No GSI or grader is currently assigned or confirmed; check Canvas and
  department announcements for updates.
- Classes begin Wednesday, August 26, 2026

Canvas remains authoritative for assignment specifications, due dates,
submission links, exam details, policy changes, and official grades. The direct
Fall 2026 course URL was not present in the local or email evidence, so the
extension opens the UM-Dearborn Canvas dashboard rather than inventing a link.
The link is configurable after the instructor verifies the direct course URL.

The extension now includes 104 source-grounded questions, five-question
practice with spaced review and analytics, thirteen executable guided lab
starters, a self-paced walkthrough, coursework evidence planning, guarded local
help, and reviewed-before-save Canvas calendar import. All learning indicators
are private self-evaluation and remain separate from Canvas grades.

## Build

```bash
cd extension
npm install
npm run check
npm run package
```

The generated `.vsix` is private course software. Do not publish it to a public
marketplace or repository.
