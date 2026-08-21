import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } from '@vscode/test-electron';

const integrationDirectory = dirname(fileURLToPath(import.meta.url));
const extensionDirectory = resolve(integrationDirectory, '..');
const manifest = JSON.parse(readFileSync(join(extensionDirectory, 'package.json'), 'utf8'));
const vsix = resolve(process.env.SYSTEMSTUDIO_VSIX || join(extensionDirectory, `${manifest.name}-${manifest.version}.vsix`));
const vscodeVersion = process.env.SYSTEMSTUDIO_VSCODE_VERSION || 'stable';
const resultsDirectory = join(extensionDirectory, 'integration-results');
const resultFile = join(resultsDirectory, `packaged-extension-${process.platform}.json`);
const temporaryRoot = mkdtempSync(join(tmpdir(), 'systemstudio-os-vscode-'));
const extensionsDirectory = join(temporaryRoot, 'extensions');
const userDataDirectory = join(temporaryRoot, 'user-data');
const workspaceDirectory = join(temporaryRoot, 'workspace');

mkdirSync(extensionsDirectory, { recursive: true });
mkdirSync(userDataDirectory, { recursive: true });
mkdirSync(workspaceDirectory, { recursive: true });
mkdirSync(resultsDirectory, { recursive: true });
writeFileSync(join(workspaceDirectory, 'README.md'), '# Isolated packaged-extension integration workspace\n', 'utf8');

let status = 'failed';
let detail = 'Integration did not complete.';
let resolvedVscodeExecutable = '';

try {
  assert.ok(existsSync(vsix), `Package the extension first; VSIX not found: ${vsix}`);
  resolvedVscodeExecutable = await downloadAndUnzipVSCode(vscodeVersion);
  const [cli, ...baseArgs] = resolveCliArgsFromVSCodeExecutablePath(resolvedVscodeExecutable, { reuseMachineInstall: true });
  const install = spawnSync(cli, [
    ...baseArgs,
    '--install-extension', vsix,
    '--force',
    '--extensions-dir', extensionsDirectory,
    '--user-data-dir', userDataDirectory
  ], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 180_000,
    maxBuffer: 16 * 1024 * 1024
  });
  assert.equal(install.error, undefined, `VSIX installer could not start: ${install.error?.message || ''}`);
  assert.equal(install.status, 0, `VSIX install failed (${install.status}):\n${install.stdout}\n${install.stderr}`);
  assert.match(`${install.stdout}\n${install.stderr}`, /successfully installed|was successfully installed/i, 'VS Code CLI did not confirm VSIX installation');

  const exitCode = await runTests({
    vscodeExecutablePath: resolvedVscodeExecutable,
    extensionDevelopmentPath: join(integrationDirectory, 'harness'),
    extensionTestsPath: join(integrationDirectory, 'suite', 'index.js'),
    extensionTestsEnv: {
      SYSTEMSTUDIO_EXPECTED_EXTENSIONS_DIR: extensionsDirectory,
      SYSTEMSTUDIO_EXPECTED_VERSION: manifest.version
    },
    launchArgs: [
      workspaceDirectory,
      '--extensions-dir', extensionsDirectory,
      '--user-data-dir', userDataDirectory,
      '--disable-workspace-trust',
      '--skip-welcome',
      '--skip-release-notes'
    ]
  });
  assert.equal(exitCode, 0, `VS Code Extension Host exited with ${exitCode}`);
  status = 'passed';
  detail = 'VSIX installed into an isolated profile; packaged resources, activation, commands, and Learning Hub webview passed.';
} catch (error) {
  detail = error instanceof Error ? error.stack || error.message : String(error);
  throw error;
} finally {
  writeFileSync(resultFile, `${JSON.stringify({
    status,
    platform: process.platform,
    architecture: process.arch,
    extensionVersion: manifest.version,
    requestedVscodeVersion: vscodeVersion,
    vsix: basename(vsix),
    executableResolved: Boolean(resolvedVscodeExecutable),
    detail
  }, null, 2)}\n`, 'utf8');
  if (process.env.SYSTEMSTUDIO_KEEP_INTEGRATION_TEMP !== '1') {
    rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  } else {
    process.stdout.write(`Preserved integration profile: ${temporaryRoot}\n`);
  }
}
