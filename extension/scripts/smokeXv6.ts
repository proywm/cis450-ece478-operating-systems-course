import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { XV6_COMMIT, XV6_REMOTE, applyXv6Compatibility, xv6WorkspaceFiles } from '../src/xv6.js';

function execute(command: string, args: string[], cwd: string, label: string, timeout = 600_000): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 32 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const diagnostic = [`command: ${command} ${args.join(' ')}`, `cwd: ${cwd}`, `exit: ${String(result.status)}`, output, result.error?.message ?? ''].join('\n');
  assert.equal(result.error, undefined, `${label} could not start\n${diagnostic}`);
  assert.equal(result.status, 0, `${label} failed\n${diagnostic}`);
  return output;
}

async function installPublicTooling(root: string): Promise<void> {
  const makefilePath = join(root, 'Makefile');
  await writeFile(makefilePath, applyXv6Compatibility(await readFile(makefilePath, 'utf8')), 'utf8');
  for (const [relative, contents] of Object.entries(xv6WorkspaceFiles())) {
    const target = join(root, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
  }
  await chmod(join(root, '.systemstudio', 'verify_xv6.py'), 0o755);
}

async function main(): Promise<void> {
  for (const dependency of [['git', '--version'], ['make', '--version'], ['gcc', '--version'], ['python3', '--version'], ['qemu-system-i386', '--version']] as const) {
    execute(dependency[0], [dependency[1]], process.cwd(), `required dependency ${dependency[0]}`, 20_000);
  }
  const root = await mkdtemp(join(tmpdir(), 'systemstudio-xv6-release-'));
  const source = join(root, 'xv6-public');
  const patches = resolve(process.cwd(), '../instructor-sources/xv6-validation/patches');
  try {
    execute('git', ['clone', '--quiet', '--no-checkout', XV6_REMOTE, source], root, 'clone pinned official xv6', 120_000);
    execute('git', ['checkout', '--quiet', '--detach', XV6_COMMIT], source, 'checkout exact xv6 revision');
    assert.equal(execute('git', ['rev-parse', 'HEAD'], source, 'verify exact xv6 revision').trim(), XV6_COMMIT);
    await installPublicTooling(source);
    execute('docker', ['compose', '-f', '.systemstudio/compose.yaml', 'config', '--quiet'], source, 'validate xv6 Docker Compose fallback', 30_000);
    process.stdout.write('PASS xv6 Docker Compose fallback configuration\n');

    let output = execute('python3', ['.systemstudio/verify_xv6.py', 'pa1a'], source, 'public PA1A behavioral preflight');
    assert.match(output, /PASS PA1A/);
    process.stdout.write('PASS real xv6 PA1A: clean build and interactive QEMU shell\n');

    execute('git', ['apply', join(patches, '0001-pa1-instrumentation-reference.patch')], source, 'apply private PA1 reference patch');
    output = execute('python3', ['.systemstudio/verify_xv6.py', 'pa1b'], source, 'public PA1B behavioral preflight');
    assert.match(output, /PASS PA1B/);
    process.stdout.write('PASS real xv6 PA1B: PCB fields, calibrated spin workload, and runtime evidence\n');

    execute('git', ['apply', join(patches, '0002-pa2-o1-scheduler-reference.patch')], source, 'apply private PA2 reference patch');
    output = execute('python3', ['.systemstudio/verify_xv6.py', 'pa2'], source, 'public PA2 behavioral preflight');
    assert.match(output, /PASS PA2/);
    assert.match(output, /ALL TESTS PASSED/);
    process.stdout.write('PASS real xv6 PA2: FQ/AQ quanta, completion, and full upstream usertests in QEMU\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void main();
