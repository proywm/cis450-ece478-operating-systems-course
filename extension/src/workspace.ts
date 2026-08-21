import { GUIDED_LABS, type GuidedLab } from './labs.js';
import { courseAgentsMd } from './aiCoach.js';

export const PORTABLE_COURSEWORK_IDS = ['hw1', 'hw2', 'hw3', 'pa3'] as const;
export type PortableCourseworkId = typeof PORTABLE_COURSEWORK_IDS[number];

export interface CourseworkWorkspaceManifest {
  kind: 'systemstudio-os-portable-coursework';
  version: 1;
  coursework: PortableCourseworkId[];
}

export function parseCourseworkWorkspaceManifest(value: unknown): CourseworkWorkspaceManifest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<CourseworkWorkspaceManifest>;
  if (candidate.kind !== 'systemstudio-os-portable-coursework' || candidate.version !== 1 || !Array.isArray(candidate.coursework)) return undefined;
  if (candidate.coursework.length !== PORTABLE_COURSEWORK_IDS.length || !PORTABLE_COURSEWORK_IDS.every((id) => candidate.coursework?.includes(id))) return undefined;
  return { kind: candidate.kind, version: candidate.version, coursework: [...PORTABLE_COURSEWORK_IDS] };
}

export const PORTABLE_COURSEWORK_LABELS: Record<PortableCourseworkId, string> = {
  hw1: 'Homework 1 prerequisites · processes and scheduling',
  hw2: 'Homework 2 prerequisites · address translation and replacement',
  hw3: 'Homework 3 prerequisites · concurrency and deadlock',
  pa3: 'Programming 3 prerequisites · pthread synchronization'
};

const courseworkRunner = String.raw`#!/usr/bin/env python3
"""Run solution-free formative prerequisites in a fixed, shell-free allowlist."""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PLANS = {
    "hw1": [
        ("process API", "labs/module-02", ["make", "run"], ["parent pid=", "child exec complete"]),
        ("scheduler metrics", "labs/module-03", ["python3", "scheduler_lab.py"], ["response", "turnaround"]),
    ],
    "hw2": [
        ("relocation bounds", "labs/module-04", ["python3", "translate.py"], ["fault"]),
        ("paging translation", "labs/module-05", ["python3", "paging.py"], ["vpn", "offset"]),
        ("replacement trace", "labs/module-06", ["python3", "replacement.py"], ["faults"]),
    ],
    "hw3": [
        ("race observation", "labs/module-07", ["make", "run"], ["expected=", "observed="]),
        ("lock invariant", "labs/module-08", ["make", "run"], ["total=200000"]),
        ("condition-variable buffer", "labs/module-09", ["make", "run"], ["put count=", "get count="]),
        ("finite deadlock model", "labs/module-10", ["python3", "lock_order.py"], ["cycle:"]),
    ],
    "pa3": [
        ("race observation", "labs/module-07", ["make", "run"], ["expected=", "observed="]),
        ("lock invariant", "labs/module-08", ["make", "run"], ["total=200000"]),
        ("condition-variable buffer", "labs/module-09", ["make", "run"], ["put count=", "get count="]),
        ("finite deadlock model", "labs/module-10", ["python3", "lock_order.py"], ["cycle:"]),
    ],
}

def doctor() -> int:
    print("SystemStudio portable coursework environment")
    print(f"platform={sys.platform} python={sys.version.split()[0]}")
    if os.name == "nt":
        print("FAIL native Windows does not provide the POSIX process/pthread environment used by this course.")
        print("Use: docker compose run --rm oslab python3 .systemstudio/coursework.py check all")
        return 2
    missing = []
    for tool in ("python3", "make", "cc"):
        path = shutil.which(tool)
        print(("READY" if path else "MISSING"), tool, path or "not found")
        if not path:
            missing.append(tool)
    if missing:
        print("FAIL missing tool(s): " + ", ".join(missing))
        print("Use the supplied Docker/Dev Container route instead of changing the assignment source.")
        return 2
    probe = subprocess.run(
        ["cc", "-x", "c", "-pthread", "-o", os.devnull, "-"],
        input="int main(void){return 0;}\n", text=True, capture_output=True, timeout=20
    )
    if probe.returncode:
        print("FAIL the C compiler could not link a pthread program")
        print(probe.stderr.strip())
        return 2
    print("READY POSIX C/pthread compilation")
    print("PASS environment diagnostic")
    return 0

def run_step(label: str, directory: str, argv: list[str], anchors: list[str]) -> bool:
    location = ROOT / directory
    print(f"\nRUN {label}: {' '.join(argv)}")
    try:
        result = subprocess.run(argv, cwd=location, text=True, capture_output=True, timeout=45)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"FAIL {label}: {error}")
        return False
    output = result.stdout + result.stderr
    print(output.rstrip())
    missing = [anchor for anchor in anchors if anchor not in output]
    if result.returncode or missing:
        print(f"FAIL {label}: exit={result.returncode}; missing evidence={missing}")
        return False
    print(f"PASS {label}: executable formative evidence observed")
    return True

def check(item: str) -> int:
    if doctor():
        return 2
    selected = list(PLANS) if item == "all" else [item]
    if any(name not in PLANS for name in selected):
        print("Choose one of: " + ", ".join([*PLANS, "all"]))
        return 2
    passed = failed = 0
    for name in selected:
        print(f"\n=== {name.upper()} solution-free prerequisite preflight ===")
        for step in PLANS[name]:
            if run_step(*step):
                passed += 1
            else:
                failed += 1
    print(f"\nSUMMARY passed={passed} failed={failed}")
    print("BOUNDARY: this checked the bundled formative analogs, not the current Canvas questions, rubric, submission, or grade.")
    return 1 if failed else 0

def main() -> int:
    if len(sys.argv) == 2 and sys.argv[1] == "doctor":
        return doctor()
    if len(sys.argv) == 3 and sys.argv[1] == "check":
        return check(sys.argv[2].lower())
    print("Usage: python3 .systemstudio/coursework.py doctor|check <hw1|hw2|hw3|pa3|all>")
    return 2

if __name__ == "__main__":
    raise SystemExit(main())
`;

export function labFiles(lab: GuidedLab): Record<string, string> {
  const files: Record<string, string> = { ...lab.files };
  const cSource = Object.keys(files).find((name) => name.endsWith('.c'));
  if (cSource) {
    files.Makefile = `CC ?= cc
CFLAGS=-Wall -Wextra -Wpedantic -g -pthread
TARGET=build/lab
SOURCE=${cSource}

all: run

$(TARGET): $(SOURCE)
	mkdir -p build
	$(CC) $(CFLAGS) $(SOURCE) -o $(TARGET)

run: $(TARGET)
	./$(TARGET)

race:
	mkdir -p build
	$(CC) $(CFLAGS) -fsanitize=thread $(SOURCE) -o $(TARGET)-tsan
	./$(TARGET)-tsan

trace: $(TARGET)
	strace -f -e trace=openat,read,write,fsync,close ./$(TARGET)

clean:
	rm -rf build
`;
  }
  files['README.md'] = `# Module ${lab.moduleNumber}: ${lab.title}

${lab.purpose}

**Source grounding:** ${lab.source}

**Boundary:** This is a formative starter. Current Canvas instructions control assessed work and submission.

## Walkthrough

${lab.steps.map((step, index) => `${index + 1}. ${step.instruction}
   - Evidence: ${step.evidence}`).join('\n')}

Run from this folder: \`${lab.runCommand}\`

## Explain before leaving

${lab.reflection}
`;
  return files;
}
export function workspaceFiles(): Record<string, string> {
  const manifest: CourseworkWorkspaceManifest = { kind: 'systemstudio-os-portable-coursework', version: 1, coursework: [...PORTABLE_COURSEWORK_IDS] };
  const files: Record<string, string> = {
    'AGENTS.md': courseAgentsMd(),
    '.devcontainer/devcontainer.json': JSON.stringify({ name: 'CIS 450 / ECE 478 OS Lab', dockerComposeFile: '../compose.yaml', service: 'oslab', workspaceFolder: '/workspace', shutdownAction: 'stopCompose', postCreateCommand: 'python3 .systemstudio/coursework.py doctor', customizations: { vscode: { extensions: ['ms-vscode.cpptools', 'ms-python.python'] } } }, null, 2) + '\n',
    'compose.yaml': "services:\n  oslab:\n    platform: linux/amd64\n    build:\n      context: .\n      dockerfile: .devcontainer/Dockerfile\n    working_dir: /workspace\n    volumes:\n      - .:/workspace\n    stdin_open: true\n    tty: true\n",
    '.devcontainer/Dockerfile': "FROM ubuntu:22.04\nARG DEBIAN_FRONTEND=noninteractive\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    build-essential gcc-multilib gdb git make python3 python3-pip qemu-system-x86 strace valgrind ca-certificates \\\n    && rm -rf /var/lib/apt/lists/*\nWORKDIR /workspace\nCMD [\"bash\"]\n",
    '.systemstudio/coursework-manifest.json': JSON.stringify(manifest, null, 2) + '\n',
    '.systemstudio/coursework.py': courseworkRunner,
    'src/main.c': "#include <stdio.h>\n#include <unistd.h>\n\nint main(void) {\n    printf(\"CIS 450 OS lab ready: pid=%ld\\n\", (long)getpid());\n    return 0;\n}\n",
    'Makefile': "CC ?= cc\nCFLAGS=-Wall -Wextra -Wpedantic -g -pthread\n\nall: build/main\n\nbuild/main: src/main.c\n\tmkdir -p build\n\t$(CC) $(CFLAGS) $< -o $@\n\nrun: build/main\n\t./build/main\n\nclean:\n\trm -rf build\n",
    '.vscode/tasks.json': JSON.stringify({ version: '2.0.0', tasks: [
      { label: 'OS: Check portable environment', type: 'process', command: 'docker', args: ['compose', 'run', '--rm', 'oslab', 'python3', '.systemstudio/coursework.py', 'doctor'], problemMatcher: [] },
      ...PORTABLE_COURSEWORK_IDS.map((id) => ({ label: `OS: ${id.toUpperCase()} prerequisite preflight`, type: 'process', command: 'docker', args: ['compose', 'run', '--rm', 'oslab', 'python3', '.systemstudio/coursework.py', 'check', id], problemMatcher: [] })),
      { label: 'OS: All non-xv6 prerequisite preflights', type: 'process', command: 'docker', args: ['compose', 'run', '--rm', 'oslab', 'python3', '.systemstudio/coursework.py', 'check', 'all'], problemMatcher: [], group: { kind: 'test', isDefault: true } }
    ] }, null, 2) + '\n',
    'README.md': '# CIS 450 / ECE 478 portable OS coursework workspace\n\nThis local workspace provides the same visible Linux compiler/runtime recipe on Windows, macOS, and Linux. It is a formative environment, not an assignment specification, submission, or grade. Canvas is authoritative.\n\n1. Open `SETUP.md` and run the extension’s environment check. Docker must be installed and running; the extension does not silently install system software.\n2. Use the extension’s **Run portable coursework preflight** action, or run `docker compose run --rm oslab python3 .systemstudio/coursework.py check all`.\n3. Optionally reopen this folder with VS Code Dev Containers for integrated editing, C/Python language support, building, and debugging.\n4. Open `coursework/START_HERE.md` for HW1, HW2, HW3, and PA3 mappings. Open `labs/START_HERE.md` for the 13 module walkthroughs.\n5. If setup, Apple-silicon emulation, paths, or evidence are confusing, open `TROUBLESHOOTING.md` before deleting or reinstalling anything.\n6. Keep assessed work private. Do not put solutions in a public repository. Compare every activity with the current Canvas prompt before submission.\n7. PA1A, PA1B, and PA2 use the extension’s separate pinned xv6 workspace and headless QEMU preflights.\n',
    'SETUP.md': '# Cross-platform setup\n\n## Common route for Windows, macOS, and Linux\n\n1. Install and start Docker using the official instructions for your operating system. On Windows, use Linux containers with the WSL 2 backend.\n2. In VS Code, run **CIS 450 / ECE 478: Check Cross-platform Course Environment**. Docker client, Compose, and engine must all report ready.\n3. Run **CIS 450 / ECE 478: Run Portable Coursework Preflight** and choose an item. The first run builds the visible Ubuntu toolchain in `.devcontainer/Dockerfile`. The Compose file requests `linux/amd64` so Intel/AMD hosts and Docker Desktop on Apple silicon use the same instruction set needed by the x86 course tools.\n4. Optional: install Microsoft’s Dev Containers extension and choose **Dev Containers: Reopen in Container** for compiler navigation and debugging inside the same environment.\n\nOfficial setup references:\n\n- Windows: https://docs.docker.com/desktop/setup/install/windows-install/\n- macOS: https://docs.docker.com/desktop/setup/install/mac-install/\n- Linux: https://docs.docker.com/engine/install/\n- VS Code Dev Containers: https://code.visualstudio.com/docs/devcontainers/containers\n\n## Native convenience route\n\nLinux and macOS can run `python3 .systemstudio/coursework.py check all` when Python 3, Make, and a POSIX C compiler are already installed. This route is convenient but may differ from the release container. Native Windows is intentionally not offered because these activities use Unix process APIs and pthreads.\n\n## What the extension does and does not do\n\nThe extension creates source files, a visible container recipe, fixed task commands, and local diagnostics. It does not silently install Docker, enable virtualization, change administrator settings, upload files, submit to Canvas, or grade coursework. If a managed computer does not permit Docker or x86 container emulation, contact the instructor or campus IT for an approved Linux environment before the assignment deadline.\n',
    'TROUBLESHOOTING.md': '# Setup and evidence clinic\n\n## Diagnose before reinstalling\n\n1. Run **Check Cross-platform Course Environment** and keep the first failing line.\n2. Run the smallest matching preflight and keep its exact command, full error, host OS/architecture, Docker version, and expected versus observed behavior.\n3. Do not repeatedly delete images or change several tools at once; that erases useful evidence.\n\n## Apple silicon and xv6\n\nThe Compose recipe requests `linux/amd64`. Docker Desktop performs the architecture translation, and the separate xv6 preflight uses headless `qemu-nox` through a terminal instead of a graphical emulator window. Confirm that Docker Desktop is running, then choose the Docker route. If it remains unavailable on a managed or incompatible computer, request an approved Linux fallback before the deadline.\n\n## Archive and path problems\n\nUse the extension’s workspace creators rather than manually extracting a nested archive. They refuse to overwrite an existing target. xv6 is cloned from a pinned official commit and verified before public support files are added. Avoid spaces or cloud-synchronized folders if an external tool reports quoting, permission, or locking failures.\n\n## Evidence and Canvas\n\nA passing preflight proves only the named local checks. Open the current Canvas rubric to learn which transcript, screenshot, identity/time marker, report, source file, archive, and tests are required. After submission, reopen the Canvas receipt and attached files. A local folder or screenshot is not a submission.\n',
    'coursework/START_HERE.md': '# Coursework prerequisite map\n\nUse these routes before working on the current Canvas item. They execute smaller public analogs and verify the compiler/runtime. They do not contain answers to assessed questions.\n\n| Item | Formative modules | Fixed container command |\n|---|---|---|\n| HW1 | Process API; scheduling metrics | `docker compose run --rm oslab python3 .systemstudio/coursework.py check hw1` |\n| HW2 | Relocation; paging; replacement | `docker compose run --rm oslab python3 .systemstudio/coursework.py check hw2` |\n| HW3 | Races; invariants; condition variables; deadlock | `docker compose run --rm oslab python3 .systemstudio/coursework.py check hw3` |\n| PA3 | Pthread synchronization prerequisites | `docker compose run --rm oslab python3 .systemstudio/coursework.py check pa3` |\n\nA pass means the bundled formative programs compiled/ran and emitted their expected evidence anchors. It does not validate a student’s answer to the active Canvas assignment.\n',
    'labs/START_HERE.md': '# Guided lab workflow\n\nEach module folder is a formative starter with a five-step evidence checklist. From inside the container, change into that folder and use the exact run command in its README.\n\nPredict → run the smallest test → capture evidence → explain the invariant or translation → compare with current Canvas requirements.\n'
  };
  for (const lab of GUIDED_LABS) {
    for (const [relative, content] of Object.entries(labFiles(lab))) files[`labs/module-${String(lab.moduleNumber).padStart(2, '0')}/${relative}`] = content;
  }
  return files;
}
