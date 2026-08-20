# Programming 3 preparation: synchronization system

**Authority:** Planning guide only. The recent historical project used a
traffic-control simulation; Canvas will confirm or replace that scenario and
all Fall 2026 details.

Practice modeling each actor as a pthread, recording arrival/wait/run/exit
events, and protecting queues and conflict state with explicit invariants.
Design deterministic tests for conflicting and nonconflicting actors, equal or
near-equal arrival times, queue order, and completion.

Evidence check: state diagram, shared-state table, lock/semaphore rationale,
event trace, safety argument, progress argument, repeatable build/run command,
and contribution record when a team is authorized.

## Executable formative route

Use the **lock invariant**, **bounded buffer**, and **deadlock ordering** guided
labs. Their internal references are repeatedly compiled/run, but are not
distributed to students. The historical traffic scenario may change, so the
extension does not claim these small analogs solve the current Canvas project.

Create the portable coursework workspace once, then choose **Run Portable
Coursework Preflight → PA3**. The supplied Linux container gives every student
the same C/pthread runtime on Windows, macOS, and Linux and runs the race,
invariant, condition-variable, and finite-deadlock analogs. This validates the
environment and prerequisite behaviors only; it cannot validate an unannounced
Fall 2026 interface or rubric.
