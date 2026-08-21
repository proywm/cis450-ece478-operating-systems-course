import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('CI matrix installs and exercises the packaged VSIX on all supported hosts', async () => {
  const workflow = await readFile(resolve(process.cwd(), '../.github/workflows/extension-ci.yml'), 'utf8');
  for (const os of ['ubuntu-latest', 'windows-latest', 'macos-latest']) assert.match(workflow, new RegExp(`- ${os}`));
  assert.match(workflow, /npm run package:portable/);
  assert.match(workflow, /xvfb-run -a npm run test:integration/);
  assert.match(workflow, /if: runner\.os != 'Linux'[\s\S]*npm run test:integration/);
  assert.match(workflow, /actions\/upload-artifact@v4/);

  const runner = await readFile(resolve(process.cwd(), 'integration/runPackagedIntegration.mjs'), 'utf8');
  assert.match(runner, /--install-extension/);
  assert.match(runner, /--extensions-dir/);
  assert.match(runner, /resolveCliArgsFromVSCodeExecutablePath\([\s\S]*reuseMachineInstall: true/);
  assert.match(runner, /extensionDevelopmentPath: join\(integrationDirectory, 'harness'\)/);
  assert.doesNotMatch(runner, /--disable-extensions/);

  const suite = await readFile(resolve(process.cwd(), 'integration/suite/index.js'), 'utf8');
  assert.match(suite, /probir-roy\.systemstudio-cis450-ece478/);
  assert.match(suite, /systemstudioOs\.openLearningHub/);
  assert.match(suite, /integrationStatus\(\)\.learningHubOpen/);
});

test('native compiler, xv6, and container execution is isolated to Ubuntu CI', async () => {
  const workflow = await readFile(resolve(process.cwd(), '../.github/workflows/extension-ci.yml'), 'utf8');
  const nativeJob = workflow.slice(workflow.indexOf('ubuntu-native-course-runtime:'));
  assert.match(nativeJob, /runs-on: ubuntu-latest/);
  assert.match(nativeJob, /qemu-system-x86/);
  assert.match(nativeJob, /SYSTEMSTUDIO_REQUIRE_DOCKER: "1"/);
  assert.match(nativeJob, /npm run check:native/);
  assert.doesNotMatch(workflow.slice(0, workflow.indexOf('ubuntu-native-course-runtime:')), /docker version|check:native|qemu-system-x86/);

  const documentation = await readFile(resolve(process.cwd(), '../docs/CONTINUOUS_INTEGRATION.md'), 'utf8');
  assert.match(documentation, /do \*\*not\*\* test Docker Desktop/);
  assert.match(documentation, /actual Docker Desktop acceptance[\s\S]*manual testing/i);
});

test('integration and private verification sources are excluded from the VSIX', async () => {
  const ignore = await readFile(resolve(process.cwd(), '.vscodeignore'), 'utf8');
  for (const directory of ['src/**', 'test/**', 'scripts/**', 'integration/**', 'node_modules/**']) assert.ok(ignore.split(/\r?\n/).includes(directory), directory);

  const audit = await readFile(resolve(process.cwd(), 'scripts/auditVsix.mjs'), 'utf8');
  assert.match(audit, /test\|scripts\|integration\|instructor-sources/);
  assert.match(audit, /known\.\?good\|solution\|answer\.\?key/);
});
