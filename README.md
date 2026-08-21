# SystemStudio CIS 450 / ECE 478

Active student course materials for **CIS 450 / ECE 478: Operating Systems,
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
- [`docs/CIS310_FEATURE_PARITY_AUDIT.md`](docs/CIS310_FEATURE_PARITY_AUDIT.md)
  — equivalent learning surfaces and intentional OS-specific differences
- [`docs/PROFESSIONAL_LEARNING_PLATFORM_AUDIT.md`](docs/PROFESSIONAL_LEARNING_PLATFORM_AUDIT.md)
  — feature-by-feature professional learning experience and release boundaries
- [`docs/USABILITY_EVALUATION.md`](docs/USABILITY_EVALUATION.md) — reconstructed
  three-student/three-educator usability, readability, and cognitive-load review
- [`docs/FEATURE_CONFIDENCE_SCORECARD.md`](docs/FEATURE_CONFIDENCE_SCORECARD.md)
  — implementation-confidence and learner-evidence gates kept separate
- [`docs/REFERENCE_EXECUTION_AUDIT.md`](docs/REFERENCE_EXECUTION_AUDIT.md) —
  completed internal reference execution, including actual xv6/QEMU results
- [`docs/OSTEP_LECTURE_SIMULATION_AUDIT.md`](docs/OSTEP_LECTURE_SIMULATION_AUDIT.md)
  — individual 29-chapter/nine-deck alignment and official simulator map
- [`docs/CONTINUOUS_INTEGRATION.md`](docs/CONTINUOUS_INTEGRATION.md) — packaged
  VSIX Extension Host matrix and Ubuntu-native runtime evidence boundaries

## Verified Fall 2026 facts

- Section 001, Dr. Probir Roy
- Monday/Wednesday, 2:00–3:45 p.m., CASL 1048
- No GSI or grader is currently assigned or confirmed; check Canvas and
  department announcements for updates.
- Classes begin Wednesday, August 26, 2026

Canvas remains authoritative for assignment specifications, due dates,
submission links, exam details, policy changes, and official grades. The direct
Fall 2026 course link is <https://canvas.umd.umich.edu/courses/552201>; optional
discussion and private-message routes remain configurable because no specific
Canvas topic/Inbox URL was supplied.

The extension now includes a 27-meeting dated reading plan, 29 exact official
OSTEP chapter links with reading-focus prompts, 104 source-grounded questions,
five-question practice with spaced review and analytics, 15 mapped official
OSTEP prediction tools, thirteen executable guided lab starters, explicit
self-evaluation, a self-paced walkthrough,
coursework evidence planning, a dedicated local grade predictor with projected
results and target-final calculations, a student-evidence-informed FAQ/help
clinic, and reviewed-before-save Canvas calendar import. A generated portable
workspace supplies one visible Linux container recipe and fixed HW1/HW2/HW3/PA3
preflights on Windows, macOS, and Linux. All learning indicators are private
self-evaluation and remain separate from Canvas grades.

The beginner-facing tree starts by choosing optional assistance and then runs
one **Set up or repair my course environment** workflow; manual commands remain
under **Advanced Setup and Diagnostics**. An original animated Orbit companion
opens a deterministic offline helper, short practice, or an actual U-M learning
coach. The AI chooser uses a published U-M Maizey student App for course-grounded
help or no-cost U-M GPT for broader troubleshooting. No instructor LLM key,
private instructor-hosted model, file, or Canvas data is attached, and prompts
remain student-reviewed and attempt-first.

The release suite compiles/runs all 13 public starters and 13 completed
internal-only references, then executes seven coursework reference suites.
Internal references are excluded from the student VSIX and are not current
assignment answers.

The simulator release suite additionally fetches the official OSTEP homework
repository at commit `afb36ca8ddbf81d847d18f6bd18a87f0a18667f2`
and executes all 15 mapped presets both without `-c` (prediction) and with
`-c` (feedback). The upstream source is not bundled or modified; students
explicitly fetch the pinned checkout after consent.

The common route requires an installed, running Docker engine. After that
system runtime is available, the guided setup creates the course workspace,
builds the visible pinned Ubuntu container, and runs all portable prerequisite
checks. On Windows, separate host installations of GCC, Make, Python, and QEMU
are not required. The extension can open Docker Desktop and wait for its engine,
but it cannot accept licenses, elevate privileges, enable WSL/virtualization,
or silently install a system runtime on student or university-managed devices.

The xv6 release suite additionally clones the official MIT x86 source at an
exact commit, clean-builds and boots it in QEMU, executes the historical PA1B
instrumentation, executes a known-good simplified FQ/AQ/EQ PA2 scheduler, and
runs the full upstream `usertests`. Student setup and behavioral tests are
bundled; the known-good kernel patches stay under `instructor-sources/` and are
rejected by the VSIX boundary audit.

## Build

```bash
cd extension
npm install
npm run check
npm run package
```

The generated `.vsix` is active course software distributed through the
repository release page; it is not published to the Visual Studio Marketplace.

GitHub Actions also installs the packaged artifact in real VS Code Extension
Hosts on Windows, macOS, and Ubuntu. Compiler, OSTEP, xv6/QEMU, and generated
container execution are enforced separately on Ubuntu; hosted Windows/macOS
jobs do not claim Docker Desktop or physical student-device acceptance.
