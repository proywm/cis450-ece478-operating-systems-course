# Programming 1B preparation: process instrumentation

**Authority:** Planning guide plus an executable historical reference. Canvas
supplies the active Fall 2026 program, kernel fields, expected output,
contribution rules, tests, and submission format.

The historical Winter 2026 path adds a `spin` user program, places it in
`UPROGS`, adds `queuetype` and `quantumsize` to the process control block,
initializes them to 0 and 4, and prints focused evidence for `spin` processes.
The extension does not implement those kernel changes for the student.

## Corrected workload and implementation sequence

Use `.systemstudio/spin.template.c` as the prescribed workload only if it agrees
with the current Canvas assignment. Its counter is `volatile int x`. This is a
necessary correction to the historical handout: without `volatile`, xv6's
`-O2` build can remove the loop, so a process may finish before any timer
interrupt and produce misleading scheduler evidence.

Work incrementally:

1. Add and run only the user program; confirm its final counter value.
2. Add PCB fields and initialize them in the process-allocation path.
3. Add narrowly filtered instrumentation; avoid printing every process on every
   scheduler pass.
4. Run a clean build after each change and inspect `git diff` from the public
   baseline.
5. Run **xv6 Assignment Preflight → PA1B**. It checks the expected source
   anchors, executes calibrated `spin 5000000` and `spin 9000000` workloads in
   QEMU, confirms both outputs, and requires Queue Type 0 / Quantum Size 4
   runtime evidence.

Evidence to practice: expected output, actual output, focused code diff, the
kernel location responsible for each observation, and team contributions when
teams are authorized.

## Executable formative route

Use the **fork, exec, and wait trace** guided lab first to understand process
creation, image replacement, exit status, and parent waiting. Then use the real
PA1B preflight for the pinned kernel. The release's private known-good PA1
fixture passed that preflight; it is retained for instructor audit and excluded
from the student VSIX.
