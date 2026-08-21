import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OSTEP_HOMEWORK_COMMIT,
  OSTEP_HOMEWORK_REMOTE,
  OSTEP_SIMULATORS,
  ostepSimulatorWorkspaceFiles,
  parseOstepSimulatorManifest,
  simulatorArguments
} from '../src/ostepSimulators.js';

test('15 official simulator presets are exactly chapter- and module-mapped', () => {
  assert.equal(OSTEP_SIMULATORS.length, 15);
  assert.equal(new Set(OSTEP_SIMULATORS.map((simulator) => simulator.id)).size, 15);
  const expected = new Set(['4', '7', '8', '9', '10', '15', '16', '18', '20', '22', '26', '28', '40', '41', '42']);
  assert.deepEqual(new Set(OSTEP_SIMULATORS.map((simulator) => simulator.chapter.replace('Chapter ', ''))), expected);
  for (const simulator of OSTEP_SIMULATORS) {
    assert.ok(simulator.moduleNumber >= 2 && simulator.moduleNumber <= 13, simulator.id);
    assert.match(simulator.directory, /^[a-z0-9-]+$/);
    assert.match(simulator.entrypoint, /^[a-z0-9-]+\.py$/);
    assert.ok(simulator.priorKnowledge.length > 40, simulator.id);
    assert.ok(simulator.predict.length > 40, simulator.id);
    assert.ok(simulator.explain.length > 40, simulator.id);
  }
});

test('prediction and reveal commands differ only by the official compute flag', () => {
  for (const simulator of OSTEP_SIMULATORS) {
    const practice = simulatorArguments(simulator, 'practice');
    const reveal = simulatorArguments(simulator, 'reveal');
    assert.doesNotMatch(practice.join(' '), /(?:^| )-c(?: |$)/, simulator.id);
    assert.deepEqual(reveal, [...practice, '-c'], simulator.id);
    assert.equal(practice[0], simulator.entrypoint);
  }
});

test('workspace pins the official checkout and does not bundle third-party source', () => {
  const files = ostepSimulatorWorkspaceFiles();
  assert.deepEqual(Object.keys(files).sort(), [
    '.devcontainer/Dockerfile',
    '.systemstudio/ostep-homework.json',
    '.vscode/tasks.json',
    'README.md',
    'compose.yaml'
  ]);
  const manifest = JSON.parse(files['.systemstudio/ostep-homework.json'] ?? '{}');
  assert.ok(parseOstepSimulatorManifest(manifest));
  assert.equal(manifest.source, OSTEP_HOMEWORK_REMOTE);
  assert.equal(manifest.commit, OSTEP_HOMEWORK_COMMIT);
  assert.equal(parseOstepSimulatorManifest({ ...manifest, commit: 'HEAD' }), undefined);
  assert.equal(parseOstepSimulatorManifest({ ...manifest, source: 'https://example.invalid/source.git' }), undefined);
  assert.ok(Object.keys(files).every((path) => !path.startsWith('official/')));
  assert.match(files['README.md'] ?? '', /intentionally omits `-c`/);
  assert.match(files['README.md'] ?? '', /Reveal after prediction/);
  assert.match(files['README.md'] ?? '', /cd official\/threads-intro/);
  assert.match(files['compose.yaml'] ?? '', /\.\:\/workspace/);
});
