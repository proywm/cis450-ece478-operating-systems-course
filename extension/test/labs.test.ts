import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDED_LABS } from '../src/labs.js';
import { labFiles, workspaceFiles } from '../src/workspace.js';

test('all 13 modules have actionable, source-grounded guided labs', () => {
  assert.equal(GUIDED_LABS.length, 13);
  assert.deepEqual(GUIDED_LABS.map((lab) => lab.moduleNumber), Array.from({ length: 13 }, (_, index) => index + 1));
  for (const lab of GUIDED_LABS) {
    assert.equal(lab.steps.length, 5, lab.id);
    assert.ok(lab.steps.every((step) => step.evidence.length > 15), lab.id);
    assert.ok(lab.source.length > 15, lab.id);
    assert.ok(Object.keys(lab.files).length >= 1, lab.id);
    assert.match(lab.reflection, /Canvas|formative/i, lab.id);
  }
});

test('every declared run command is supported by generated lab files', () => {
  for (const lab of GUIDED_LABS) {
    const files = labFiles(lab);
    if (lab.runCommand.startsWith('make ')) {
      const target = lab.runCommand.split(/\s+/)[1];
      assert.match(files.Makefile ?? '', new RegExp(`(?:^|\\n)${target}:`), lab.id);
    } else if (lab.runCommand.startsWith('python3 ')) {
      assert.ok(files[lab.runCommand.slice('python3 '.length)], lab.id);
    } else if (lab.runCommand.startsWith('bash ')) {
      const source = files[lab.runCommand.slice('bash '.length)];
      assert.match(source ?? '', /^#!\/usr\/bin\/env bash/);
      assert.match(source ?? '', /mktemp -d/);
    } else {
      assert.fail(`Unsupported run command for ${lab.id}: ${lab.runCommand}`);
    }
    assert.match(files['README.md'] ?? '', /formative starter/i);
  }
});

test('portable workspace Dockerfile is syntactically shaped and has no patch-marker commands', () => {
  const files = workspaceFiles();
  const dockerfile = files['.devcontainer/Dockerfile'] ?? '';
  assert.match(dockerfile, /^FROM ubuntu:22\.04/m);
  assert.match(dockerfile, /^RUN apt-get update && apt-get install/m);
  assert.match(dockerfile, /^    build-essential .* \\$/m);
  assert.match(dockerfile, /^    && rm -rf \/var\/lib\/apt\/lists\/\*$/m);
  assert.doesNotMatch(dockerfile, /^\+/m);
  assert.match(files['compose.yaml'] ?? '', /dockerfile: \.devcontainer\/Dockerfile/);
  for (const lab of GUIDED_LABS) assert.ok(files[`labs/module-${String(lab.moduleNumber).padStart(2, '0')}/README.md`], lab.id);
});
