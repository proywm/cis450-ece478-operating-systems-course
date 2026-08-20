# Coursework planning guides

These seven guides turn the recent course sequence into an advance-preparation
map. They are **not Fall 2026 assignment specifications**. Canvas controls the
required task, release/due dates, team rules, files, late policy, rubric, and
submission. Do not submit a planning-guide artifact unless the Canvas prompt
asks for it.

The xv6 guides have an additional executable reference path. The extension
pins the official MIT x86 `xv6-public` source at commit
`eeb7b415dbcb12cc362d0783e41c3d1f44066b17` and validates the historical Winter
2026 PA1/PA2 behavior in QEMU. This reduces setup ambiguity; it does not assert
that the active Fall 2026 Canvas assignment uses the same revision or tests.

| Sequence | Guide | Preparation modules |
|---:|---|---|
| 1 | [Homework 1: CPU virtualization and scheduling](hw1-cpu-scheduling.md) | 2–3 |
| 2 | [Programming 1A: reproducible xv6 environment](pa1a-xv6-environment.md) | 1–2 |
| 3 | [Programming 1B: process instrumentation](pa1b-process-instrumentation.md) | 2–3 |
| 4 | [Homework 2: memory virtualization](hw2-memory.md) | 4–6 |
| 5 | [Programming 2: xv6 scheduler](pa2-scheduler.md) | 3 |
| 6 | [Homework 3: concurrency](hw3-concurrency.md) | 7–10 |
| 7 | [Programming 3: synchronization system](pa3-synchronization.md) | 7–10 |

For PA1A, PA1B, or PA2, use **Prepare Pinned xv6 Reference Workspace** once,
then **Run xv6 Assignment Preflight**. A pass is local formative evidence only;
it is not an upload, submission, grade, or instructor/GSI evaluation.

For HW1, HW2, HW3, and PA3, create the **Portable OS Coursework Workspace**
once and use **Run Portable Coursework Preflight**. The supplied Linux
container is the common Windows/macOS/Linux route and contains the required
C/pthread and Python tools. It requires Docker to be installed and running; the
extension diagnoses that prerequisite but does not silently install system
software. These preflights execute smaller public analogs, not answers to the
active Canvas assignment.
