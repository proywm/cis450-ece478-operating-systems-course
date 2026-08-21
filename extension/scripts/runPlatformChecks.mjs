import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('npm_execpath is unavailable; run this checker through npm run check.');
}

function run(script) {
  const result = spawnSync(process.execPath, [npmCli, 'run', script], {
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
