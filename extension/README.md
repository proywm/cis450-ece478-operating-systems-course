# SystemStudio CIS 450 / ECE 478

The Fall 2026 Operating Systems learning hub for section 001.

- 13 visible modules across virtualization, concurrency, and persistence
- a dated 27-meeting plan mapped to 29 direct official OSTEP chapter links,
  concise accessible explanations, and 104 readiness questions with hints,
  source grounding, and justifications
- five-question practice, saved/due/spaced review, confidence checks, and
  private per-topic analytics
- fifteen official OSTEP simulator presets mapped to exact chapters, with a
  pinned opt-in checkout, predict-before-`-c` workflow, native Python/Docker
  routes, explanations, and private run counts
- thirteen guided C, Python, pthread, scheduler, memory, I/O, and file-system
  starters with evidence walkthroughs
- portable Docker/Dev Containers workspace generator with C/pthreads, Python,
  GCC/GDB, and QEMU in one visible Windows/macOS/Linux Linux-container recipe
- one-click, solution-free environment/prerequisite preflights for HW1, HW2,
  HW3, and PA3, with fixed task commands and evidence anchors
- pinned official MIT x86 xv6 workspace generator with native-Linux and Docker
  routes, solution-free baseline, PA1A/PA1B/PA2 QEMU preflights, and focused
  diagnostics
- three-homework/four-programming progression with evidence checks
- private local progress and confidence—not a grade and not sent to Canvas
- a dedicated local grade predictor using the verified historical Winter 2026
  10/15/40/15/20 weights, with weighted contributions, projected result,
  normalized pre-final standing, and target-final calculation; it applies no
  unverified drop rule and remains visibly separate from official Canvas grades
- deterministic offline helper with assessed-work guardrails
- U-M Codex CLI as the only online AI learning/setup coach, using each
  student's own U-M configuration; the extension does not read or store keys
- optional original animated learning companion with reduced-motion and
  hide/restore controls
- consent-based extension issue reporting that prepares a reviewable public
  GitHub draft without reading files, code, grades, credentials, Canvas data,
  or logs; GitHub creates nothing until the student submits the draft
- accessible standalone syllabus and lesson collection
- verified Fall 2026 meeting calendar and OSTEP preparation-plan export
- configurable Canvas links with HTTPS/host validation, reviewed-before-save Canvas ICS import,
  and a pre-class question composer that never posts or promises anonymity

No GSI or grader is currently assigned or confirmed; check Canvas and
department announcements for updates. Dr. Roy's verified office is CIS
Building, Room 230.

Release verification compiles/runs all 13 student starters, executes the
portable HW1/HW2/HW3/PA3 public preflight runner, and runs 13 completed
internal-only formative references, then reruns mapped checks for all seven
coursework guides. It also builds and boots pinned real xv6, validates the PA1B
runtime evidence, validates the historical PA2 queue/quanta behavior, and runs
full upstream `usertests` in QEMU. The package audit proves that private
known-good implementations are not in the VSIX.

It also fetches the official OSTEP homework repository at exact commit
`afb36ca8ddbf81d847d18f6bd18a87f0a18667f2` and runs every one of the 15
mapped presets both without `-c` and with `-c`. Upstream source is never
bundled into the VSIX.

Docker itself is an explicit host prerequisite for the identical cross-platform
route; the extension does not silently install system software, enable
virtualization, or change administrator settings. Linux/macOS students may use
an already-installed native POSIX toolchain as a transparent convenience route.

Canvas is authoritative for current assignments, deadlines, submissions,
exams, feedback, policies, and official grades.

Release automation boundary-audits the VSIX, then installs that artifact into
isolated real VS Code Extension Hosts on Windows, macOS, and Ubuntu. A separate
Ubuntu-native job compiles/runs the OS starters and private verification
fixtures, exercises pinned OSTEP and xv6/QEMU, and builds/runs the generated
Linux course container. Hosted Windows/macOS jobs do not claim Docker Desktop
or physical student-device acceptance; see `docs/CONTINUOUS_INTEGRATION.md` in
the repository.

The default Fall 2026 Canvas course is
<https://canvas.umd.umich.edu/courses/552201>. See the in-extension FAQ and the
generated `TROUBLESHOOTING.md` for setup, Apple-silicon/QEMU, archive, evidence,
xv6, and coursework-specification diagnostics grounded in recurring student
concerns.
