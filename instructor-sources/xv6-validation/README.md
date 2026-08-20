# Instructor-only xv6 validation fixtures

This directory retains the known-good implementation used to validate the
public CIS 450 / ECE 478 xv6 preflight. It is deliberately outside the
extension package and is rejected by the VSIX boundary audit.

Reference basis:

- official MIT `xv6-public` x86 source;
- pinned source commit `eeb7b415dbcb12cc362d0783e41c3d1f44066b17`;
- the local Winter 2026 PA1 Part 1, PA1 Part 2, and PA2 PDFs; and
- QEMU system emulation, not a user-space scheduler analogy.

The patches are cumulative:

1. `0001-pa1-instrumentation-reference.patch` adds the prescribed observable
   workload and PA1 PCB instrumentation.
2. `0002-pa2-o1-scheduler-reference.patch` transforms that PA1 state into the
   simplified FQ/AQ/EQ scheduler used for behavioral validation.

Run `npm run test:xv6` from `extension/` to clone the pinned public source into
a temporary directory, apply the public compatibility setup, boot PA1A, apply
the private PA1 patch and verify PA1B, then apply the private PA2 patch and run
its behavioral assertions plus upstream `usertests`.

Do not distribute these patches to students or put them in Canvas. They are an
instructor audit fixture, not assignment starter code.
