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

