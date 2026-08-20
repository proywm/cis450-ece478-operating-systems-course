import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COURSEWORK_REFERENCE_CHECKS, KNOWN_GOOD_LAB_FIXTURES, type KnownGoodFixture } from '../test/internal-fixtures/knownGoodSolutions.js';

function execute(command: string, args: string[], cwd: string, label: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 20_000 });
  const diagnostic = [`command: ${command} ${args.join(' ')}`, `cwd: ${cwd}`, `exit: ${String(result.status)}`, `stdout:\n${result.stdout}`, `stderr:\n${result.stderr}`, result.error?.message ?? ''].join('\n');
  assert.equal(result.error, undefined, `${label} could not start\n${diagnostic}`);
  assert.equal(result.status, 0, `${label} failed\n${diagnostic}`);
  return `${result.stdout}\n${result.stderr}`;
}

async function runFixture(fixture: KnownGoodFixture, root: string, label: string): Promise<void> {
  const directory = join(root, label.replaceAll(/[^a-zA-Z0-9_-]/g, '-'));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, fixture.filename), fixture.source, 'utf8');
  let output: string;
  if (fixture.language === 'c') {
    execute('gcc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-Wpedantic', '-pthread', fixture.filename, '-o', 'reference'], directory, `${label} compile`);
    output = execute(join(directory, 'reference'), [], directory, `${label} execute`);
  } else if (fixture.language === 'python') {
    output = execute('python3', [fixture.filename], directory, `${label} execute`);
  } else {
    output = execute('bash', [fixture.filename], directory, `${label} execute`);
  }
  for (const expected of fixture.expectedOutput) assert.ok(output.includes(expected), `${label} missing expected output ${JSON.stringify(expected)}\n${output}`);
}

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'systemstudio-os-reference-'));
  try {
    const byId = new Map(KNOWN_GOOD_LAB_FIXTURES.map((fixture) => [fixture.id, fixture]));
    for (const fixture of KNOWN_GOOD_LAB_FIXTURES) {
      await runFixture(fixture, root, `lab-${fixture.labId}`);
      process.stdout.write(`PASS known-good lab reference ${fixture.labId}\n`);
    }
    for (const [courseworkId, check] of Object.entries(COURSEWORK_REFERENCE_CHECKS)) {
      for (const fixtureId of check.fixtureIds) {
        const fixture = byId.get(fixtureId);
        assert.ok(fixture, `${courseworkId} references missing fixture ${fixtureId}`);
        await runFixture(fixture, root, `coursework-${courseworkId}-${fixtureId}`);
      }
      process.stdout.write(`PASS coursework reference suite ${courseworkId} (${check.fixtureIds.length} executable check${check.fixtureIds.length === 1 ? '' : 's'})\n`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void main();
