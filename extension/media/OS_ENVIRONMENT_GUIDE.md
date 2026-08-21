# CIS 450 / ECE 478 environment setup

## The shortest path

1. Install and open **Docker Desktop** on Windows or macOS. On Windows, use
   Linux containers with the WSL 2 backend. Linux users can use Docker Engine.
2. In VS Code, run **CIS 450 / ECE 478: Set Up or Repair Course Environment**.
3. Choose a parent folder when asked. SystemStudio creates one
   `cis450-os-lab` folder, builds the pinned Ubuntu course container, and runs
   solution-free prerequisite checks.
4. Open that folder in VS Code. Use the course home for modules, labs,
   simulations, coursework, and help.

The Windows host does **not** need a separate GCC, Make, Python, or QEMU
installation. Those tools are supplied inside the course container. Their
absence on Windows is not an error.

## If Docker is installed but not running

Open Docker Desktop and wait until its dashboard reports that the engine is
running. Then rerun **Set Up or Repair Course Environment**. The extension can
open Docker Desktop and wait for readiness when the operating system supports
the `docker-desktop:` link, but it does not enable virtualization or change
administrator settings.

The message `open //./pipe/docker_engine: The system cannot find the file
specified` means the Docker command-line client is installed but the Windows
Docker engine is not running. Reinstalling the extension, GCC, or QEMU will not
fix that condition.

## Installation boundaries

A VS Code extension cannot safely or reliably install Docker Desktop, enable
WSL 2 or virtualization, accept software licenses, or elevate administrator
privileges on every student-owned or university-managed machine. SystemStudio
therefore automates the course container and its compiler/debugger tools after
Docker is available, while keeping the system-runtime step explicit.

Official installation references:

- Windows: <https://docs.docker.com/desktop/setup/install/windows-install/>
- macOS: <https://docs.docker.com/desktop/setup/install/mac-install/>
- Linux: <https://docs.docker.com/engine/install/>
- VS Code Dev Containers: <https://code.visualstudio.com/docs/devcontainers/containers>

If a managed computer cannot run Docker or x86 container emulation, contact
the instructor or campus IT for an approved Linux environment before the
assignment deadline.
