# Continuous integration and release evidence

The private repository runs two complementary GitHub Actions jobs. A green
workflow means the committed extension passed these automated checks; it does
not replace student-device testing, Canvas review, or instructor acceptance.

## Packaged VSIX matrix

The `packaged-extension-host` job runs on GitHub-hosted Windows, macOS, and
Ubuntu runners. Each runner:

1. installs the locked Node dependencies with `npm ci`;
2. regenerates the accessible exports and bundled course pack;
3. type-checks, unit-tests, bundles, packages, and audits the VSIX;
4. installs that VSIX—not the source directory—into an isolated VS Code
   extensions directory;
5. starts a real VS Code Extension Host, activates the installed course
   extension, checks packaged accessible resources and registered commands,
   and opens the Learning Hub webview; and
6. uploads the audited VSIX and a small machine-readable integration report.

Linux uses `xvfb-run -a`, as required for a graphical VS Code process on a
headless runner. The isolated profile prevents a developer's locally installed
extensions and settings from masking release defects.

## Ubuntu-native course runtime

The separate `ubuntu-native-course-runtime` job is intentionally Linux-only.
It compiles and runs all published C/Python/shell lab starters, runs the
internal known-good requirement fixtures, exercises the pinned official OSTEP
simulators, and builds/boots the pinned x86 xv6 source with headless QEMU. It
also requires the hosted Docker daemon, builds the generated Ubuntu course
image, and executes the fixed HW1/HW2/HW3/PA3 prerequisite runner in that
container. The job fails rather than silently skipping Docker.

GitHub-hosted Windows and macOS jobs do **not** test Docker Desktop, WSL 2,
Apple-silicon emulation, virtualization settings, graphical QEMU, or a physical
student computer. Those hosts test the packaged extension itself. The shared
Linux container recipe is tested on Ubuntu CI; actual Docker Desktop acceptance
still requires manual testing on representative student devices.

## Local commands

From `extension/`:

```text
npm ci
npm run package:portable
xvfb-run -a npm run test:integration   # Linux
npm run test:integration               # Windows or macOS desktop session
npm run check:native                   # Linux with the documented prerequisites
SYSTEMSTUDIO_REQUIRE_DOCKER=1 npm run test:starters
```

`npm run package` remains the full local release path: portable checks plus the
native course-runtime checks, followed by packaging and the VSIX boundary
audit. Integration harnesses, test sources, scripts, private fixtures, and
known-good answers are rejected from the student VSIX.

## Evidence and retention

Workflow logs show every command and assertion. Per-platform VSIX/integration
artifacts and the Ubuntu native-runtime transcript are retained for 14 days.
The workflow has read-only repository permissions and performs no publication
or Canvas operation.
