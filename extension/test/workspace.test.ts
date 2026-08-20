import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTABLE_COURSEWORK_IDS, parseCourseworkWorkspaceManifest, workspaceFiles } from '../src/workspace.js';

test('portable workspace covers every remaining non-xv6 coursework item', () => {
  const files = workspaceFiles();
  const manifest = parseCourseworkWorkspaceManifest(JSON.parse(files['.systemstudio/coursework-manifest.json']!));
  assert.ok(manifest);
  assert.deepEqual(manifest.coursework, [...PORTABLE_COURSEWORK_IDS]);

  const runner = files['.systemstudio/coursework.py']!;
  for (const id of PORTABLE_COURSEWORK_IDS) {
    assert.match(runner, new RegExp(`"${id}"\\s*:`));
    assert.match(files['coursework/START_HERE.md']!, new RegExp(`check ${id}`));
  }
  for (const module of ['02', '03', '04', '05', '06', '07', '08', '09', '10']) {
    assert.ok(Object.keys(files).some((path) => path.startsWith(`labs/module-${module}/`)), module);
  }
});

test('portable runner is fixed, solution-free, and does not invoke a shell', () => {
  const files = workspaceFiles();
  const runner = files['.systemstudio/coursework.py']!;
  assert.match(runner, /subprocess\.run\(argv/);
  assert.doesNotMatch(runner, /shell\s*=\s*True|os\.system|current Canvas answer|traffic-control solution/i);
  assert.match(runner, /BOUNDARY: this checked the bundled formative analogs/);
  assert.match(runner, /native Windows does not provide the POSIX process\/pthread environment/);
});

test('workspace exposes one cross-platform container recipe and transparent tasks', () => {
  const files = workspaceFiles();
  assert.match(files['.devcontainer/Dockerfile']!, /^FROM ubuntu:22\.04/m);
  for (const tool of ['build-essential', 'gcc-multilib', 'gdb', 'python3', 'qemu-system-x86', 'strace', 'valgrind']) {
    assert.match(files['.devcontainer/Dockerfile']!, new RegExp(tool));
  }
  const compose = files['compose.yaml']!;
  assert.match(compose, /platform: linux\/amd64/);
  assert.match(compose, /working_dir: \/workspace/);
  assert.match(compose, /- \.:\/workspace/);
  const tasks = JSON.parse(files['.vscode/tasks.json']!) as { tasks: { label: string; command: string; args: string[] }[] };
  assert.equal(tasks.tasks.length, 6);
  assert.ok(tasks.tasks.every((task) => task.command === 'docker'));
  assert.ok(tasks.tasks.some((task) => task.args[task.args.length - 1] === 'all'));
  assert.match(files['SETUP.md']!, /Windows, macOS, and Linux/);
  assert.match(files['SETUP.md']!, /does not silently install Docker/);
  assert.match(files['TROUBLESHOOTING.md']!, /Apple silicon/i);
  assert.match(files['TROUBLESHOOTING.md']!, /headless `qemu-nox`/i);
  assert.match(files['TROUBLESHOOTING.md']!, /current Canvas rubric/i);
});

test('coursework manifest parser rejects spoofed or incomplete workspaces', () => {
  assert.equal(parseCourseworkWorkspaceManifest(undefined), undefined);
  assert.equal(parseCourseworkWorkspaceManifest({ kind: 'systemstudio-os-portable-coursework', version: 1, coursework: ['hw1'] }), undefined);
  assert.equal(parseCourseworkWorkspaceManifest({ kind: 'different', version: 1, coursework: [...PORTABLE_COURSEWORK_IDS] }), undefined);
});
