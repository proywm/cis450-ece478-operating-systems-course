import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { GUIDED_LABS } from '../src/labs.js';
import { labFiles, workspaceFiles } from '../src/workspace.js';

function available(command: string): boolean {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function run(command: string, args: string[], cwd: string, label: string, timeout = 15_000): void {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout });
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed (${String(result.status)}):\n${result.stdout}\n${result.stderr}\n${result.error?.message ?? ''}`);
  }
  process.stdout.write(`PASS ${label}\n`);
}

async function main(): Promise<void> {
const requireDocker = process.env.SYSTEMSTUDIO_REQUIRE_DOCKER === '1';
const root = await mkdtemp(join(tmpdir(), 'systemstudio-os-labs-'));
try {
  for (const lab of GUIDED_LABS) {
    const directory = join(root, `module-${String(lab.moduleNumber).padStart(2, '0')}`);
    await mkdir(directory, { recursive: true });
    for (const [relative, content] of Object.entries(labFiles(lab))) await writeFile(join(directory, relative), content, 'utf8');
    if (lab.runCommand.startsWith('make ')) {
      const requested = lab.runCommand.split(/\s+/)[1] ?? 'run';
      const target = requested === 'trace' && !available('strace') ? 'run' : requested;
      run('make', [target], directory, `Module ${lab.moduleNumber} C starter${target !== requested ? ' (trace tool unavailable; executable run)' : ''}`);
    } else if (lab.runCommand.startsWith('python3 ')) {
      run('python3', [lab.runCommand.slice('python3 '.length)], directory, `Module ${lab.moduleNumber} Python starter`);
    } else if (lab.runCommand.startsWith('bash ')) {
      run('bash', [lab.runCommand.slice('bash '.length)], directory, `Module ${lab.moduleNumber} shell starter`);
    }
  }

  const workspace = join(root, 'portable-workspace');
  for (const [relative, content] of Object.entries(workspaceFiles())) {
    const target = join(workspace, relative);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  run('make', ['run'], workspace, 'portable workspace root starter');
  run('python3', ['.systemstudio/coursework.py', 'check', 'all'], workspace, 'HW1/HW2/HW3/PA3 portable prerequisite runner', 120_000);
  if (available('docker')) {
    run('docker', ['compose', 'config', '--quiet'], workspace, 'portable workspace Compose configuration');
    if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0) {
      run('docker', ['build', '--check', '--file', '.devcontainer/Dockerfile', '.'], workspace, 'portable workspace Dockerfile build check');
      run('docker', ['compose', 'run', '--rm', 'oslab', 'python3', '.systemstudio/coursework.py', 'check', 'all'], workspace, 'containerized HW1/HW2/HW3/PA3 prerequisite runner', 300_000);
      process.stdout.write('PASS generated Linux container image built and executed the fixed coursework preflight\n');
    } else if (requireDocker) {
      throw new Error('Docker daemon is required for this CI job but docker info failed.');
    } else {
      process.stdout.write('SKIP Dockerfile daemon-backed build and container execution (Docker socket unavailable); native execution, static Dockerfile assertions, and Compose validation passed.\n');
    }
  } else if (requireDocker) {
    throw new Error('Docker and Compose are required for this CI job but the docker client is unavailable.');
  } else {
    process.stdout.write('SKIP Docker/Compose validation (Docker client unavailable); native starter execution passed.\n');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
}

void main();
