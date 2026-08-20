# xv6 executable validation report

Validation date: 2026-08-20

## Source and environment

- Source: `https://github.com/mit-pdos/xv6-public.git`
- Commit: `eeb7b415dbcb12cc362d0783e41c3d1f44066b17`
- Host compiler: GCC 12.3.0
- Host binutils: 2.38
- Emulator: `qemu-system-i386` 6.2.0
- Historical specifications: local Winter 2026 PA1 Part 1, PA1 Part 2, and PA2
  PDFs under `instructor-sources/reference-assignment-pdfs/`

## Findings corrected in the public setup

1. The pinned historical source does not clean-build under GCC 12 with its
   original `-Werror`: modern `array-bounds`, `stringop-overflow`, and
   `infinite-recursion` diagnostics become errors. The setup suppresses only
   those three compatibility diagnostics and leaves all other warnings as
   errors.
2. The historical `spin.c` uses an ordinary local counter. At xv6's `-O2`, the
   workload can be optimized away, so the documented small input can complete
   without a timer interrupt. The public template uses `volatile int x` and
   calibrated iteration counts.
3. The PA2 prose describes queue behavior but does not fully state queue
   membership, wakeup, lock, and partial-quantum invariants. The student guide
   now asks students to define these before coding and the public validator
   checks observable policy outcomes without shipping an implementation.
4. Repeated release execution showed that kernel timer logging can interrupt a
   user `printf` midway through its final number. The validator now waits for
   process completion and removes only complete scheduler-trace lines before
   checking the reconstructed user output; it no longer mistakes valid console
   interleaving for a failed workload.

## Executed results

- Baseline PA1A: clean build completed and QEMU reached the interactive xv6
  shell.
- Known-good PA1B: two calibrated `spin` processes completed and emitted Queue
  Type 0 / Quantum Size 4 evidence.
- Known-good PA2, `CPUS=1`: the first three spin quanta served three distinct
  FQ processes; AQ service appeared in consecutive three-tick groups; all
  three workloads completed; full upstream `usertests` printed
  `ALL TESTS PASSED`.
- Known-good PA2, `CPUS=2`, from a clean filesystem image: all three workloads
  completed with FQ/AQ evidence and full upstream `usertests` printed
  `ALL TESTS PASSED`.

The public release smoke test reproduces PA1A, PA1B, and deterministic PA2 on
one CPU. Two-CPU execution is retained here as a release audit result because
the historical grading trace is deterministic only on one CPU.

## Claim boundary

These results validate the pinned reference against the historical Winter 2026
documents. They do not establish that Fall 2026 Canvas will use the same xv6
revision, assignment wording, files, tests, deadline, or grading rubric.
