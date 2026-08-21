import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { COURSEWORK } from '../src/courseData.js';
import { GUIDED_LABS } from '../src/labs.js';
import { COURSEWORK_REFERENCE_CHECKS, KNOWN_GOOD_LAB_FIXTURES, LAB_REFERENCE_COVERAGE } from './internal-fixtures/knownGoodSolutions.js';

test('each guided lab has one internal known-good fixture and exact step coverage', () => {
  assert.equal(KNOWN_GOOD_LAB_FIXTURES.length, GUIDED_LABS.length);
  const fixtureIds = new Set(KNOWN_GOOD_LAB_FIXTURES.map((fixture) => fixture.id));
  assert.equal(fixtureIds.size, KNOWN_GOOD_LAB_FIXTURES.length);
  for (const lab of GUIDED_LABS) {
    const coverage = LAB_REFERENCE_COVERAGE[lab.id];
    assert.ok(coverage, lab.id);
    assert.ok(fixtureIds.has(coverage.fixtureId), `${lab.id}: ${coverage.fixtureId}`);
    const declared = [...coverage.automatedStepIds, ...coverage.manualStepIds];
    assert.deepEqual([...new Set(declared)].sort(), lab.steps.map((step) => step.id).sort(), lab.id);
    assert.ok(coverage.automatedStepIds.length > 0, lab.id);
    assert.ok(coverage.limitation.length > 35, lab.id);
  }
});

test('each coursework guide maps every evidence line to executable or manual verification', () => {
  const fixtureIds = new Set(KNOWN_GOOD_LAB_FIXTURES.map((fixture) => fixture.id));
  assert.deepEqual(Object.keys(COURSEWORK_REFERENCE_CHECKS).sort(), COURSEWORK.map((item) => item.id).sort());
  for (const item of COURSEWORK) {
    const check = COURSEWORK_REFERENCE_CHECKS[item.id];
    if (!check) assert.fail(`Missing coursework reference check for ${item.id}`);
    assert.ok(check.fixtureIds.length > 0, item.id);
    assert.ok(check.fixtureIds.every((id) => fixtureIds.has(id)), item.id);
    const indexes = [...check.automatedEvidenceIndexes, ...check.manualEvidenceIndexes];
    assert.deepEqual([...new Set(indexes)].sort((a, b) => a - b), item.evidence.map((_, index) => index), item.id);
    assert.ok(check.limitation.length > 35, item.id);
    if (['pa1a', 'pa1b', 'pa2'].includes(item.id)) assert.equal(check.xv6PreflightMode, item.id, item.id);
  }
});

test('every published coursework guide exposes its tested formative route and authority boundary', async () => {
  const files: Readonly<Record<string, string>> = {
    hw1: 'hw1-cpu-scheduling.md', pa1a: 'pa1a-xv6-environment.md',
    pa1b: 'pa1b-process-instrumentation.md', hw2: 'hw2-memory.md',
    pa2: 'pa2-scheduler.md', hw3: 'hw3-concurrency.md',
    pa3: 'pa3-synchronization.md'
  };
  for (const item of COURSEWORK) {
    const guide = await readFile(resolve(process.cwd(), '../course-pack/fall2026/assignments', files[item.id]!), 'utf8');
    assert.match(guide, /Authority:|\*\*Authority:\*\*/i, item.id);
    assert.match(guide, /## Executable formative route/, item.id);
    assert.match(guide, /Canvas/, item.id);
    assert.doesNotMatch(guide, /answer key|official solution/i, item.id);
  }
});

test('internal reference fixtures are excluded from student packaging', async () => {
  const ignore = await readFile(resolve(process.cwd(), '.vscodeignore'), 'utf8');
  assert.match(ignore, /^test\/\*\*$/m);
  assert.match(ignore, /^scripts\/\*\*$/m);
  const manifest = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const platformChecks = await readFile(resolve(process.cwd(), 'scripts/runPlatformChecks.mjs'), 'utf8');
  assert.match(manifest.scripts?.check ?? '', /runPlatformChecks\.mjs/);
  assert.match(platformChecks, /check:native/);
  assert.match(manifest.scripts?.['check:native'] ?? '', /test:references/);
  assert.match(manifest.scripts?.['check:native'] ?? '', /test:xv6/);
  assert.match(manifest.scripts?.package ?? '', /audit:vsix/);
});
