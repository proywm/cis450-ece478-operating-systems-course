import test from 'node:test';
import assert from 'node:assert/strict';
import { applyXv6Compatibility, parseXv6Manifest, xv6WorkspaceFiles, XV6_COMMIT, XV6_REMOTE } from '../src/xv6.js';

const PINNED_MAKEFILE = 'CFLAGS = -fno-pic -static -fno-builtin -fno-strict-aliasing -O2 -Wall -MD -ggdb -m32 -Werror -fno-omit-frame-pointer\n';

test('modern GCC compatibility is narrow, idempotent, and pinned-shape only', () => {
  const patched = applyXv6Compatibility(PINNED_MAKEFILE);
  assert.match(patched, /-Werror -fno-omit-frame-pointer\n# SystemStudio compatibility/);
  assert.match(patched, /-Wno-array-bounds -Wno-stringop-overflow -Wno-infinite-recursion/);
  assert.equal(applyXv6Compatibility(patched), patched);
  assert.throws(() => applyXv6Compatibility('CFLAGS=-O2\n'), /stopped without guessing/);
});

test('workspace manifest is exact and rejects substituted sources or revisions', () => {
  const files = xv6WorkspaceFiles();
  const manifest = JSON.parse(files['.systemstudio/manifest.json'] ?? '{}');
  assert.equal(manifest.source, XV6_REMOTE);
  assert.equal(manifest.commit, XV6_COMMIT);
  assert.ok(parseXv6Manifest(manifest));
  assert.equal(parseXv6Manifest({ ...manifest, commit: 'HEAD' }), undefined);
  assert.equal(parseXv6Manifest({ ...manifest, source: 'https://example.invalid/xv6' }), undefined);
});

test('public workspace contains reproducible tooling and no assignment implementation', () => {
  const files = xv6WorkspaceFiles();
  assert.deepEqual(Object.keys(files).sort(), [
    '.systemstudio/Dockerfile',
    '.systemstudio/README.md',
    '.systemstudio/compose.yaml',
    '.systemstudio/manifest.json',
    '.systemstudio/spin.template.c',
    '.systemstudio/verify_xv6.py',
    '.vscode/tasks.json'
  ]);
  const combined = Object.values(files).join('\n');
  assert.match(combined, /Canvas remains\s+authoritative/i);
  assert.match(combined, /volatile int x/);
  assert.match(combined, /pa1a\|pa1b\|pa2/);
  assert.match(combined, /ALL TESTS PASSED/);
  assert.match(combined, /qemu-nox/);
  assert.doesNotMatch(combined, /static struct runqueue|scheduler_tick\(void\)|queueput\(|QUEUE_EXPIRED/);
});

test('validator covers build, boot, instrumentation, queue quanta, and regression behavior', () => {
  const validator = xv6WorkspaceFiles()['.systemstudio/verify_xv6.py'] ?? '';
  for (const marker of [
    'make", "clean', 'Qemu(1)', 'SYSTEMSTUDIO_XV6_BOOT_OK',
    'Queue Type\\s+0.*Quantum Size\\s+4',
    'first three observed spin quanta', 'three consecutive 10 ms ticks',
    'normalized = re.sub', 'zombie![\\s\\S]*', 'usertests', 'ALL TESTS PASSED'
  ]) assert.ok(validator.includes(marker), marker);
});

test('portable container recipe has the x86 build and QEMU dependencies', () => {
  const files = xv6WorkspaceFiles();
  const dockerfile = files['.systemstudio/Dockerfile'] ?? '';
  for (const packageName of ['gcc-multilib', 'make', 'python3', 'qemu-system-x86']) assert.match(dockerfile, new RegExp(`\\b${packageName}\\b`));
  const compose = files['.systemstudio/compose.yaml'] ?? '';
  assert.match(compose, /\.\.:\/xv6/);
  assert.match(compose, /working_dir:\s*\/xv6/);
});
