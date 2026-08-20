import { GUIDED_LABS, type GuidedLab } from './labs.js';

export function labFiles(lab: GuidedLab): Record<string, string> {
  const files: Record<string, string> = { ...lab.files };
  const cSource = Object.keys(files).find((name) => name.endsWith('.c'));
  if (cSource) {
    files.Makefile = `CC=gcc
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
  const files: Record<string, string> = {
    '.devcontainer/devcontainer.json': JSON.stringify({ name: 'CIS 450 / ECE 478 OS Lab', dockerComposeFile: '../compose.yaml', service: 'oslab', workspaceFolder: '/workspace', shutdownAction: 'stopCompose', customizations: { vscode: { extensions: ['ms-vscode.cpptools'] } } }, null, 2) + '\n',
    'compose.yaml': "services:\n  oslab:\n    build:\n      context: .\n      dockerfile: .devcontainer/Dockerfile\n    working_dir: /workspace\n    volumes:\n      - .:/workspace\n    stdin_open: true\n    tty: true\n",
    '.devcontainer/Dockerfile': "FROM ubuntu:22.04\nARG DEBIAN_FRONTEND=noninteractive\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    build-essential gcc-multilib gdb git make python3 python3-pip qemu-system-x86 strace valgrind ca-certificates \\\n    && rm -rf /var/lib/apt/lists/*\nWORKDIR /workspace\nCMD [\"bash\"]\n",
    'src/main.c': "#include <stdio.h>\n#include <unistd.h>\n\nint main(void) {\n    printf(\"CIS 450 OS lab ready: pid=%ld\\n\", (long)getpid());\n    return 0;\n}\n",
    'Makefile': "CC=gcc\nCFLAGS=-Wall -Wextra -Wpedantic -g -pthread\n\nall: build/main\n\nbuild/main: src/main.c\n\tmkdir -p build\n\t$(CC) $(CFLAGS) $< -o $@\n\nrun: build/main\n\t./build/main\n\nclean:\n\trm -rf build\n",
    'README.md': '# CIS 450 / ECE 478 portable OS lab\n\nThis local workspace is a practice environment, not a submission. Canvas is authoritative.\n\n1. Review `.devcontainer/Dockerfile` and `compose.yaml`.\n2. Run `docker compose run --rm oslab make run`, or reopen in a VS Code Dev Container.\n3. Open `labs/START_HERE.md`; each module folder has its own source-grounded walkthrough and exact run command.\n4. Keep assessed work private. Do not put solutions in a public repository.\n5. Add xv6 only from the source/version named in the current Canvas assignment. Historical course documents do not establish the Fall 2026 revision.\n',
    'labs/START_HERE.md': '# Guided lab workflow\n\nEach module folder is a formative starter with a five-step evidence checklist. From inside the container, change into that folder and use the exact run command in its README.\n\nPredict → run the smallest test → capture evidence → explain the invariant or translation → compare with current Canvas requirements.\n'
  };
  for (const lab of GUIDED_LABS) {
    for (const [relative, content] of Object.entries(labFiles(lab))) files[`labs/module-${String(lab.moduleNumber).padStart(2, '0')}/${relative}`] = content;
  }
  return files;
}
