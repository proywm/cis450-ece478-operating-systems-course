import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OSTEP_HOMEWORK_COMMIT, OSTEP_HOMEWORK_REMOTE, OSTEP_SIMULATORS, simulatorArguments } from '../src/ostepSimulators.js';

function execute(command: string, args: string[], cwd: string, label: string, timeout = 120_000): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 32 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const diagnostic = [`command: ${command} ${args.join(' ')}`, `cwd: ${cwd}`, `exit: ${String(result.status)}`, output, result.error?.message ?? ''].join('\n');
  assert.equal(result.error, undefined, `${label} could not start\n${diagnostic}`);
  assert.equal(result.status, 0, `${label} failed\n${diagnostic}`);
  return output;
}

async function main(): Promise<void> {
  execute('git', ['--version'], process.cwd(), 'required dependency git', 20_000);
  execute('python3', ['--version'], process.cwd(), 'required dependency Python 3', 20_000);
  const root = await mkdtemp(join(tmpdir(), 'systemstudio-ostep-simulators-'));
  try {
    execute('git', ['clone', '--quiet', '--no-checkout', OSTEP_HOMEWORK_REMOTE, 'official'], root, 'clone official OSTEP homework');
    execute('git', ['checkout', '--quiet', '--detach', OSTEP_HOMEWORK_COMMIT], join(root, 'official'), 'checkout exact OSTEP homework revision');
    assert.equal(execute('git', ['rev-parse', 'HEAD'], join(root, 'official'), 'verify exact OSTEP revision').trim(), OSTEP_HOMEWORK_COMMIT);
    for (const simulator of OSTEP_SIMULATORS) {
      const simulatorDirectory = join(root, 'official', simulator.directory);
      const practice = execute('python3', simulatorArguments(simulator, 'practice'), simulatorDirectory, `${simulator.id} prediction`);
      const reveal = execute('python3', simulatorArguments(simulator, 'reveal'), simulatorDirectory, `${simulator.id} reveal`);
      assert.ok(practice.trim().length > 20, `${simulator.id} prediction produced no meaningful output`);
      assert.ok(reveal.trim().length > 20, `${simulator.id} reveal produced no meaningful output`);
      assert.notEqual(practice, reveal, `${simulator.id} prediction/reveal output should differ`);
      process.stdout.write(`PASS official OSTEP ${simulator.id}: prediction and reveal\n`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void main();
