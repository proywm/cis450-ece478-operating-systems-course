import { spawnSync } from 'node:child_process';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(script) {
  const result = spawnSync(npmExecutable, ['run', script], {
    stdio: 'inherit',
    shell: false,
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('check:portable');
if (process.platform === 'linux') {
  run('check:native');
} else {
  process.stdout.write(
    `SKIP check:native on ${process.platform}: the native compiler, OSTEP, xv6/QEMU, and container-runtime gate is Linux-specific and remains required in Ubuntu CI.\n`
  );
}
