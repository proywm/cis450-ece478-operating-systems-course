# Internal reference execution audit

The public guided labs are intentionally incomplete formative starters. Release
verification therefore uses completed references under
`extension/test/internal-fixtures/`, a path excluded by `.vscodeignore` and
checked again against the finished VSIX. These references are small formative
analogs—not current assignment answers.

## Executed lab references

| Module | Reference behavior asserted | Manual/non-reproducible boundary |
|---:|---|---|
| 1 | C toolchain builds and executes a process check | Environment report quality and prediction |
| 2 | `fork`, `exec`, exit status, and `waitpid` | Source annotation and partial-order diagram |
| 3 | Deterministic FCFS/SJF traces and metrics | Workload interpretation |
| 4 | Valid/boundary/fault relocation and segment permissions | Fragmentation sketch |
| 5 | Page-table/TLB translation, hit/miss, and invalid VPN | Binary and sparse-table sketches |
| 6 | FIFO=7 and LRU=6 faults on the published practice trace | Additional workloads and locality explanation |
| 7 | Mutex-repaired counter reaches 400,000 | Sanitizer availability and proof argument |
| 8 | Locked transfer preserves total 200,000 | Granularity analysis |
| 9 | Bounded buffer consumes 1–8, sum 36, final count 0 | Event trace and semaphore comparison |
| 10 | Inverted order cycles; global order is acyclic | Four-condition classification |
| 11 | Write, `fsync`, reopen, and content validation | `strace`/device behavior varies by runtime |
| 12 | Same-inode hard link survives unlink; symbolic link dangles | Open-descriptor explanation |
| 13 | Committed journal replay preserves the finite model invariant | Not a real power-loss or file-system test |

Six C references compile with strict warnings as errors and pthread support;
six Python references execute their own assertions; one Bash fixture checks
temporary-file link behavior and cleans only its `mktemp` directory.

The student-facing portable workspace is also generated into a disposable
directory and executed end to end. Its fixed runner checks HW1 (process API and
scheduling), HW2 (relocation, paging, and replacement), HW3 (races, locking,
condition variables, and deadlock), and PA3 synchronization prerequisites. On
this release node all public routes ran with the native POSIX toolchain. Docker
Compose configuration passed; daemon-backed image build/container execution
was skipped because this node cannot access the Docker socket. The suite does
not convert that skip into a cross-platform execution claim.

## Coursework-guide mapping

All three homework and four programming planning guides reference one or more
of the executed behaviors above. Tests require every published evidence line to
be classified as automated or manual. Important limits are explicit:

- PA1A/PA1B/PA2 have a verified real-kernel **historical reference** pinned to
  official MIT x86 xv6-public commit
  `eeb7b415dbcb12cc362d0783e41c3d1f44066b17`; Canvas must still identify
  whether active Fall 2026 assessed work uses that source and behavior;
- current Canvas questions, submission formats, teamwork rules, timestamps,
  explanations, and safety/liveness arguments require student/instructor review;
- the historical traffic scenario for Programming 3 may change.

## Real xv6 execution

`npm run test:xv6` clones the pinned official source into a disposable folder,
applies only the public modern-GCC compatibility setup, and then performs three
cumulative executions:

1. **PA1A:** clean build and interactive QEMU shell.
2. **PA1B:** apply the private known-good instrumentation fixture; run calibrated
   volatile spin workloads; observe Queue Type 0 / Quantum Size 4 evidence.
3. **PA2:** apply the private known-good FQ/AQ/EQ fixture; assert distinct FQ
   service, three consecutive AQ timer ticks per process, completion, and full
   upstream xv6 `usertests` with `ALL TESTS PASSED`.

The one-CPU route is deterministic and runs in every release check. A separate
clean-image, two-CPU audit also completed all workloads and full `usertests`.
Exact environment and defect findings are retained in
`instructor-sources/xv6-validation/VALIDATION_REPORT.md`.

The student VSIX contains the pinned source recipe, setup guide, and behavioral
validator—not either known-good kernel patch. The validator reports a failing
assertion and asks the student to inspect their own invariant/diff; it never
applies a solution.

Run `npm run test:starters`, `npm run test:references`, and `npm run test:xv6`
from `extension/`. A failure
reports the fixture, command, working directory, exit status, stdout, and
stderr. `npm run package` runs both and then `audit:vsix`, which rejects
internal fixtures, scripts, instructor sources, patches, solution/answer-key
names, environment files, or student-data paths in the finished archive.
