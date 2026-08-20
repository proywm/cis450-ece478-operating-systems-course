# Programming 1A preparation: reproducible xv6 environment

**Authority:** Planning guide plus an executable historical reference. Canvas
will name the active Fall 2026 xv6 revision, required environment, deliverables,
allowed help, tests, and deadline.

## Verified reference setup

1. Run **CIS 450 / ECE 478: Prepare Pinned xv6 Reference Workspace**.
2. The extension clones the official MIT x86 `xv6-public` repository, checks
   out `eeb7b415dbcb12cc362d0783e41c3d1f44066b17`, and verifies that exact commit
   before writing anything.
3. It adds a public guide, QEMU validator, Docker fallback, and three narrowly
   scoped modern-GCC compatibility flags. It creates a solution-free baseline
   commit and tag. It does not add PA1 PCB code or a PA2 scheduler.
4. Open `.systemstudio/README.md`, inspect `git show
   systemstudio-xv6-reference-baseline`, and compare this historical reference
   with the current Canvas prompt.
5. Run **Run xv6 Assignment Preflight → PA1A**. The validator performs a clean
   build, starts the current kernel with two CPUs in headless
   `qemu-system-i386` on a tested legacy-compatible machine, checks
   `cpu0: starting`, `cpu1: starting`, and
   `init: starting sh`, waits for an interactive xv6 shell, sends a marker
   command, and closes QEMU cleanly.

The explicit machine selection matters: a modern QEMU default was verified to
accept `-smp 2` while exposing only one CPU to this historical xv6 source. If
the required compatibility machine is unavailable locally, use the supplied
Ubuntu 22.04 Docker route rather than accepting a misleading one-CPU result.

On Linux, the extension can use local GCC/Make/Python/QEMU. On Windows, macOS,
or a Linux host without those dependencies, it offers the visible Docker
recipe in `.systemstudio/`; it does not silently install or start Docker.

Evidence to practice: clean build/boot output including both CPU-start markers
and the shell marker, exact commands, source commit, version summary, one
failure and repair, and an accessibility/portability note. Canvas controls
whether identity, time, screenshots, a transcript, or a report is required.

## Executable formative route

Use both routes for different purposes:

- **Reproducible OS environment** is the short, platform-neutral prerequisite
  lab for predicting, building, and documenting a C toolchain.
- **PA1A xv6 preflight** builds and boots the pinned real kernel in QEMU.

Release verification clean-built and booted this exact reference. A passing
student run confirms the local pinned workspace behavior, not compliance with a
different source or specification that Canvas may announce.
