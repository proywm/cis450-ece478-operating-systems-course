# Programming 2 preparation: xv6 scheduler

**Authority:** Planning guide plus an executable historical reference. Canvas
determines the active Fall 2026 scheduling policy, xv6 revision, tests,
deliverables, allowed help, and deadline.

The historical Winter 2026 specification uses three logical queues:

- first-time queue (FQ): a newly runnable process receives one 10 ms timer tick;
- active queue (AQ): a process receives a 30 ms quantum, represented by three
  consecutive 10 ms ticks; and
- expired queue (EQ): a process moves here after exhausting its AQ quantum.

FQ has priority over AQ. When AQ is empty, AQ and EQ are swapped in constant
time. The historical trace line is `Process spin <pid> has consumed 10 ms in
FQ` or `... in AQ`.

## Gaps that must be resolved in the design

The handout names the queues and quanta but does not fully spell out these
correctness obligations. State and enforce them before coding:

1. A RUNNABLE process is represented in exactly one run queue; a process cannot
   be inserted twice.
2. Queue insertion, removal, state changes, timer charging, wakeup, and kill
   transitions use one documented locking discipline.
3. A process that yields because of a timer tick but has AQ time remaining must
   resume its current quantum before the next AQ process; voluntary sleep/exit
   must not be treated as timer exhaustion.
4. New or newly created processes enter FQ. A woken process has one explicit,
   justified policy; it cannot disappear from the runnable set.
5. AQ/EQ swapping exchanges queue identities or pointers in O(1); it does not
   copy all process entries.
6. Debug output is filtered and cannot be the scheduler's source of truth.

Locate the scheduler, `struct proc`, process allocation/creation, wakeup/kill
paths, timer interrupt, and `yield` path. Draw the state/queue transitions and
lock ownership before editing. Implement one invariant at a time.

Evidence check: design diagram, invariants, focused diff, clean build, multiple
traces, explanation of each trace, known limitation, and contribution record.

## Executable formative route

Use the **scheduler metric workbench** first for deterministic policy reasoning.
Then run **xv6 Assignment Preflight → PA2** on the pinned real kernel. The
preflight clean-builds, boots with one CPU, launches three calibrated `spin`
processes, and checks:

- the first three observed spin quanta are FQ service for three distinct PIDs;
- AQ service appears as three consecutive 10 ms ticks per process;
- all three workloads complete; and
- the full upstream xv6 `usertests` suite prints `ALL TESTS PASSED`.

One CPU makes the historical trace deterministic. Release validation also ran
the private known-good scheduler from a clean image with two CPUs and repeated
the full upstream suite to check queue-lock behavior. The private implementation
patches are not included in the extension or course pack.

A pass does not prove every interleaving, fairness property, or active Canvas
rubric item. Explain the trace, run additional edge cases, and verify the current
Canvas requirements before submission.
