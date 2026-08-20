export const XV6_REMOTE = 'https://github.com/mit-pdos/xv6-public.git';
export const XV6_COMMIT = 'eeb7b415dbcb12cc362d0783e41c3d1f44066b17';
export const XV6_BASELINE_TAG = 'systemstudio-xv6-reference-baseline';
export const XV6_VALIDATOR_VERSION = 2;

const COMPATIBILITY_FLAGS = '-Wno-array-bounds -Wno-stringop-overflow -Wno-infinite-recursion';

export interface Xv6Manifest {
  schemaVersion: 1;
  source: string;
  commit: string;
  validatorVersion: number;
  activeCourseBoundary: string;
}

export function applyXv6Compatibility(makefile: string): string {
  if (makefile.includes(COMPATIBILITY_FLAGS)) return makefile;
  const marker = 'CFLAGS = -fno-pic -static -fno-builtin -fno-strict-aliasing -O2 -Wall -MD -ggdb -m32 -Werror -fno-omit-frame-pointer';
  if (!makefile.includes(marker)) throw new Error('The pinned xv6 Makefile shape was not found; setup stopped without guessing.');
  return makefile.replace(marker, `${marker}\n# SystemStudio compatibility for modern GCC; not an assignment solution.\nCFLAGS += ${COMPATIBILITY_FLAGS}`);
}

export function parseXv6Manifest(value: unknown): Xv6Manifest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const item = value as Record<string, unknown>;
  if (item.schemaVersion !== 1 || item.source !== XV6_REMOTE || item.commit !== XV6_COMMIT || item.validatorVersion !== XV6_VALIDATOR_VERSION || typeof item.activeCourseBoundary !== 'string') return undefined;
  return item as unknown as Xv6Manifest;
}

export function xv6WorkspaceFiles(): Record<string, string> {
  const manifest: Xv6Manifest = {
    schemaVersion: 1,
    source: XV6_REMOTE,
    commit: XV6_COMMIT,
    validatorVersion: XV6_VALIDATOR_VERSION,
    activeCourseBoundary: 'Validated against the Winter 2026 reference assignments; current Fall 2026 Canvas requirements remain authoritative.'
  };
  return {
    '.systemstudio/manifest.json': `${JSON.stringify(manifest, null, 2)}\n`,
    '.systemstudio/Dockerfile': `FROM ubuntu:22.04
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential gcc-multilib make python3 qemu-system-x86 ca-certificates \\
    && rm -rf /var/lib/apt/lists/*
WORKDIR /xv6
CMD ["bash"]
`,
    '.systemstudio/compose.yaml': `services:
  xv6:
    build:
      context: .
      dockerfile: Dockerfile
    working_dir: /xv6
    volumes:
      - ..:/xv6
    stdin_open: true
    tty: true
`,
    '.systemstudio/spin.template.c': `#include "types.h"
#include "user.h"

int
main(int argc, char *argv[])
{
  int i;
  volatile int x = 0;  // Required so -O2 does not remove the timer workload.

  if(argc != 2){
    printf(2, "usage: spin positive-iterations\\n");
    exit();
  }
  for(i = 1; i < atoi(argv[1]); i++)
    x++;
  printf(1, "pid(%d): x = %d\\n", getpid(), x);
  exit();
}
`,
    '.systemstudio/README.md': `# Verified xv6 reference environment

This workspace pins the official MIT x86 \`xv6-public\` source at
\`${XV6_COMMIT}\`. SystemStudio verified this source against the historical
Winter 2026 PA1 and simplified O(1)-scheduler specifications. Canvas remains
authoritative for the active Fall 2026 assignment, deadline, teams, allowed
help, and submission files.

The setup commit contains only:

- three modern-GCC warning compatibility flags in \`Makefile\`;
- this guide, container recipe, prescribed \`spin\` template, and behavioral
  validator; and
- a local baseline tag named \`${XV6_BASELINE_TAG}\`.

It contains no PA1 PCB implementation and no PA2 scheduler solution.

## Student workflow

1. Read the current Canvas assignment and compare it with this reference path.
2. Inspect \`git show ${XV6_BASELINE_TAG}\` and \`git diff ${XV6_BASELINE_TAG}\`.
3. Implement one small change at a time in your private workspace.
4. Run a local behavioral preflight:
   - \`python3 .systemstudio/verify_xv6.py pa1a\`
   - \`python3 .systemstudio/verify_xv6.py pa1b\`
   - \`python3 .systemstudio/verify_xv6.py pa2\`
5. On Windows/macOS, or when host dependencies are missing, use:
   - \`docker compose -f .systemstudio/compose.yaml run --rm xv6 python3 .systemstudio/verify_xv6.py pa1a\`
6. Read every diagnostic and explain your own design. A passing preflight is
   formative evidence, not a grade, upload, or Canvas submission.

## PA1A path: reproduce before modifying

Run the PA1A preflight on the untouched setup commit. It performs a clean build,
boots the current kernel in headless QEMU with two CPUs, verifies both CPU start
messages and \`init: starting sh\`, waits for the interactive shell, and executes
a marker command. Record the exact commit, native/Docker route, tool versions,
full relevant transcript, and any repair. If this baseline fails, fix the
environment before changing kernel code.

## PA1B path: make the workload observable

Compare the Canvas-supplied workload with the supplied spin template. For the
historical reference, add spin.c to UPROGS, add the named PCB fields,
initialize them, and emit focused evidence for spin processes. Make one change
at a time and explain it. The PA1B preflight checks source anchors, runs two
calibrated processes, reconstructs user output if timer logs interleave with a
user printf, and requires Queue Type 0 / Quantum Size 4 evidence.

## PA2 path: specify invariants before code

For the historical FQ/AQ/EQ policy, state these obligations explicitly:

- a RUNNABLE process is present in exactly one run queue;
- queue/state/timer/wakeup/kill transitions follow one locking discipline;
- FQ receives one 10 ms tick and has priority over AQ;
- AQ receives three consecutive 10 ms ticks before moving to EQ;
- a partially used AQ quantum resumes without jumping behind the next process;
- new processes and woken processes follow an explicit, justified queue rule;
- AQ/EQ swap in O(1) by identity/pointer exchange, not entry copying; and
- logging observes the policy but is never its source of truth.

The PA2 preflight boots with one CPU for deterministic policy evidence, checks
three concurrent calibrated workloads, and then runs the full upstream xv6
usertests suite. Add your own edge cases; one passing run cannot prove every
interleaving, fairness property, or current Canvas rubric item.

## Help without outsourcing the assignment

Use the extension's offline helper to ask for an invariant, a smaller analogous
trace, or interpretation of the first failing assertion. Include your own diff,
prediction, and evidence. The helper will not generate or apply the PA1/PA2
kernel implementation, and the public workspace contains no known-good patch.

## Verified corrections to the historical handout

- Modern GCC 12 needs the three compatibility suppressions already isolated in
  the setup commit; all other warnings remain errors.
- The historical \`spin.c\` counter must be \`volatile\`. Otherwise \`-O2\`
  can remove the loop and the documented small workloads may never cross a
  timer interrupt.
- Use calibrated workloads \`5000000\`, \`9000000\`, and \`15000000\` for
  behavioral traces. Runtime speed varies; the validator reports a focused
  diagnostic when evidence is too short.
- PA2 is evaluated on one CPU for deterministic FQ/AQ ordering and then runs
  the upstream regression suite. A separate two-CPU release validation checks
  the reference implementation for queue-lock correctness.
`,
    '.systemstudio/verify_xv6.py': XV6_VALIDATOR,
    '.vscode/tasks.json': `${JSON.stringify({
      version: '2.0.0',
      tasks: [
        { label: 'xv6: verify environment (PA1A)', type: 'shell', command: 'python3 .systemstudio/verify_xv6.py pa1a', problemMatcher: [] },
        { label: 'xv6: verify instrumentation (PA1B)', type: 'shell', command: 'python3 .systemstudio/verify_xv6.py pa1b', problemMatcher: [] },
        { label: 'xv6: verify scheduler (PA2)', type: 'shell', command: 'python3 .systemstudio/verify_xv6.py pa2', problemMatcher: [] }
      ]
    }, null, 2)}\n`
  };
}

const XV6_VALIDATOR = String.raw`#!/usr/bin/env python3
"""Behavioral preflight for the pinned CIS 450/ECE 478 xv6 reference path."""
from __future__ import annotations
import os
import re
import select
import subprocess
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ANSI = re.compile(r"\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))")
QEMU_MACHINE = "pc-i440fx-2.9"

def fail(message: str) -> None:
    raise SystemExit("FAIL: " + message)

def run(args: list[str], timeout: int = 120) -> None:
    print("+", " ".join(args), flush=True)
    result = subprocess.run(args, cwd=ROOT, text=True, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, timeout=timeout)
    print(result.stdout, end="")
    if result.returncode != 0:
        fail("command exited with status %d" % result.returncode)

def require_text(path: str, patterns: list[tuple[str, str]]) -> None:
    full = os.path.join(ROOT, path)
    try:
        text = open(full, encoding="utf-8").read()
    except OSError as exc:
        fail("cannot read %s: %s" % (path, exc))
    for pattern, message in patterns:
        if not re.search(pattern, text, re.I | re.M):
            fail("%s: %s" % (path, message))

class Qemu:
    def __init__(self, cpus: int = 1):
        import pty
        machines = subprocess.run(["qemu-system-i386", "-machine", "help"],
                                  text=True, stdout=subprocess.PIPE,
                                  stderr=subprocess.STDOUT).stdout
        if QEMU_MACHINE not in machines:
            fail("QEMU lacks the %s compatibility machine required by pinned x86 xv6; use the supplied Ubuntu 22.04 Docker route" % QEMU_MACHINE)
        self.master, slave = pty.openpty()
        self.proc = subprocess.Popen(["make", "qemu-nox", "CPUS=%d" % cpus,
                                      "QEMUEXTRA=-machine %s" % QEMU_MACHINE],
                                     cwd=ROOT, stdin=slave, stdout=slave, stderr=slave,
                                     close_fds=True)
        os.close(slave)
        self.transcript = ""

    def wait(self, pattern: str, timeout: int = 60) -> re.Match[str]:
        compiled = re.compile(pattern, re.I | re.M)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            match = compiled.search(self.transcript)
            if match:
                return match
            if self.proc.poll() is not None:
                fail("QEMU exited before matching %r\n%s" % (pattern, self.transcript[-2000:]))
            ready, _, _ = select.select([self.master], [], [], min(0.25, max(0, deadline-time.monotonic())))
            if not ready:
                continue
            try:
                chunk = os.read(self.master, 8192).decode("utf-8", "replace")
            except OSError:
                chunk = ""
            if chunk:
                sys.stdout.write(chunk); sys.stdout.flush()
                self.transcript += ANSI.sub("", chunk).replace("\r", "")
        fail("timed out waiting for %r\n%s" % (pattern, self.transcript[-3000:]))

    def send(self, command: str) -> None:
        os.write(self.master, command.encode() + b"\n")

    def stop(self) -> None:
        if self.proc.poll() is None:
            os.write(self.master, b"\x01x")
            try:
                self.proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                self.proc.terminate()
                self.proc.wait(timeout=5)
        os.close(self.master)

def clean_build() -> None:
    run(["make", "clean"])
    run(["make", "-j2"], 180)

def pa1a() -> None:
    clean_build()
    q = Qemu(2)
    try:
        q.wait(r"cpu0: starting", 90)
        q.wait(r"cpu1: starting", 90)
        q.wait(r"init: starting sh", 90)
        q.wait(r"\$ ", 90)
        q.send("echo SYSTEMSTUDIO_XV6_BOOT_OK")
        q.wait(r"SYSTEMSTUDIO_XV6_BOOT_OK", 20)
    finally:
        q.stop()
    print("PASS PA1A: two CPUs started on the pinned compatible QEMU machine, init launched sh, and the interactive marker completed.")

def pa1b() -> None:
    require_text("spin.c", [(r"volatile\s+int\s+x", "make x volatile so -O2 cannot remove the timer workload")])
    require_text("Makefile", [(r"(?m)^\s*_spin\\?\s*$", "add _spin to UPROGS")])
    require_text("proc.h", [(r"int\s+queuetype\s*;", "add queuetype to struct proc"), (r"int\s+quantumsize\s*;", "add quantumsize to struct proc")])
    require_text("proc.c", [(r"queuetype\s*=\s*0", "initialize queuetype to 0"), (r"quantumsize\s*=\s*4", "initialize quantumsize to 4"), (r"Queue Type.*Quantum Size", "print focused PCB evidence")])
    clean_build()
    q = Qemu(1)
    try:
        q.wait(r"\$ ", 90)
        q.send("spin 5000000 &; spin 9000000 &")
        q.wait(r"(?:zombie![\s\S]*){2}", 100)
        normalized = re.sub(r"Process spin[^\n]*\n", "", q.transcript)
        if not re.search(r"pid\([0-9]+\): x = 4999999", normalized):
            fail("the first calibrated spin workload did not complete with x = 4999999")
        if not re.search(r"pid\([0-9]+\): x = 8999999", normalized):
            fail("the second calibrated spin workload did not complete with x = 8999999")
        if not re.search(r"Queue Type\s+0.*Quantum Size\s+4", q.transcript, re.I):
            fail("spin completed, but no Queue Type 0 / Quantum Size 4 kernel evidence was observed")
    finally:
        q.stop()
    print("PASS PA1B: spin workload, PCB initialization, and runtime instrumentation were observed.")

def pa2() -> None:
    require_text("spin.c", [(r"volatile\s+int\s+x", "use the calibrated non-optimized spin workload")])
    require_text("proc.c", [(r"FQ", "emit or identify first-time queue behavior"), (r"AQ", "emit or identify active queue behavior"), (r"EQ|expired", "implement the expired queue")])
    clean_build()
    q = Qemu(1)
    try:
        q.wait(r"\$ ", 90)
        q.send("spin 5000000 &; spin 9000000 &; spin 15000000 &")
        q.wait(r"(?:zombie![\s\S]*){3}", 180)
        normalized = re.sub(r"Process spin[^\n]*\n", "", q.transcript)
        for expected in (4999999, 8999999, 14999999):
            if not re.search(r"pid\([0-9]+\): x = %d" % expected, normalized):
                fail("a calibrated spin workload did not complete with x = %d" % expected)
        events = re.findall(r"Process spin\s+([0-9]+).*?10 ms in\s+(FQ|AQ)", q.transcript, re.I)
        if len(events) < 12:
            fail("too few scheduler events; check timer accounting and the volatile workload")
        first = events[:3]
        if [queue.upper() for _, queue in first] != ["FQ", "FQ", "FQ"] or len({pid for pid, _ in first}) != 3:
            fail("the first three observed spin quanta must serve three distinct FQ processes")
        aq = [(pid, queue.upper()) for pid, queue in events[3:] if queue.upper() == "AQ"][:9]
        groups = [aq[index:index+3] for index in range(0, 9, 3)]
        if len(aq) != 9 or any(len({pid for pid, _ in group}) != 1 for group in groups):
            fail("AQ did not provide three consecutive 10 ms ticks per process")
        q.send("usertests")
        q.wait(r"ALL TESTS PASSED", 260)
    finally:
        q.stop()
    print("PASS PA2: FQ priority, 30 ms AQ chunks, completion, and upstream usertests passed.")

def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"pa1a", "pa1b", "pa2"}:
        fail("usage: verify_xv6.py pa1a|pa1b|pa2")
    {"pa1a": pa1a, "pa1b": pa1b, "pa2": pa2}[sys.argv[1]]()

if __name__ == "__main__":
    main()
`;
