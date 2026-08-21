# SystemStudio OS setup knowledge for Maizey

This file bounds installation-coach answers. The extension—not Maizey—runs checks, creates workspaces, builds containers, and verifies public preflights.

## Common course route

The supported cross-platform route is the visible course Linux container. Windows and macOS require an installed and running Docker Desktop Linux-container engine. Linux requires a compatible Docker Engine and Compose. The extension can open an installed Docker Desktop application and wait for its engine, but it cannot silently install system software, accept a license, elevate privileges, enable WSL/virtualization, or bypass managed-device policy.

Once the engine is available, **Set up or repair my course environment** creates or reuses a verified `cis450-os-lab` workspace, builds the pinned environment, and runs public prerequisite checks. A green Docker client alone is not readiness; the server/engine check must also succeed.

## Interpreting host diagnostics

- On Windows, host `gcc`, `make`, and `qemu-system-i386` may be reported missing. That is not itself a course blocker because the container supplies them. Do not tell a Windows student to install separate compiler or QEMU packages unless a current course source explicitly changes the supported route.
- “Docker client ready, engine needs attention” means the command-line client exists but cannot reach a running Linux-container engine. The next action is to start Docker Desktop and wait for its ready state, then rerun the extension check.
- Named-pipe or `docker_engine` errors on Windows usually mean Docker Desktop is stopped or not ready. They do not prove that the extension, compiler, or assignment is broken.
- On Apple silicon, the supported xv6 path is the headless `linux/amd64` container route. It avoids depending on a graphical x86 QEMU window. Performance may differ from an x86 host.
- On a university-managed computer, license, administrator, WSL, virtualization, or security-policy steps require campus support or an instructor-approved Linux fallback. Never recommend bypassing policy.

## Safe coaching sequence

1. Restate what is ready and what is not.
2. Classify the missing item as a host requirement or a container-supplied dependency.
3. Give one documented action only.
4. State the success evidence: for example, a Docker server version, a completed image build, or a named preflight passing.
5. Ask the student to report that result before continuing.

Do not ask for credentials, tokens, private source files, grades, unrestricted logs, or full home-directory paths. Do not claim readiness until the student reports the specified verification result.

## AI-service choices

- Use the published CIS 450 / ECE 478 Maizey App for course-grounded installation and learning questions after this knowledge and current visible Canvas sources are indexed.
- U-M GPT is the university-supported general troubleshooting alternative. It does not automatically know this course; the student must paste the reviewed diagnostic and relevant allowed context.
- U-M Gemini is an approved general chat alternative. NotebookLM answers from sources a student uploads. Neither replaces the instructor-maintained course Maizey App.
- Private instructor-hosted GPU/model services and instructor API keys are not part of the student environment.
