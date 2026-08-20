# Homework 3 preparation: concurrency

**Authority:** Planning guide only. Canvas controls active questions.

Prepare process/thread tradeoffs, concrete race interleavings, atomic
instructions, mutexes, condition variables, semaphores, and deadlock/liveness.
For every scenario, name shared state, state the invariant/predicate, identify
the critical section, and separate safety from progress and fairness.

Avoid answers that merely name a primitive. Explain why the chosen primitive
and ordering enforce the required state transition.

## Executable formative route

Use the **race repair**, **lock invariant**, **bounded buffer**, and **deadlock
ordering** guided labs. Their completed internal references verify counters,
state invariants, producer/consumer completion, and cycle detection. Written
safety, liveness, and fairness arguments still require student reasoning.

Create the portable coursework workspace once, then choose **Run Portable
Coursework Preflight → HW3**. The supplied Linux container provides one
C/pthread compiler and Python environment on Windows, macOS, and Linux and
executes all four prerequisite analogs with expected evidence anchors.
