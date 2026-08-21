'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const vscode = require('vscode');

const EXTENSION_ID = 'probir-roy.systemstudio-cis450-ece478';
const REQUIRED_COMMANDS = [
  'systemstudioOs.openLearningHub',
  'systemstudioOs.openCanvas',
  'systemstudioOs.openSyllabus',
  'systemstudioOs.openAccessibleLessons',
  'systemstudioOs.createLabWorkspace',
  'systemstudioOs.runCourseworkPreflight',
  'systemstudioOs.checkEnvironment',
  'systemstudioOs.createModuleLab',
  'systemstudioOs.prepareXv6',
  'systemstudioOs.verifyXv6',
  'systemstudioOs.prepareOstepSimulators',
  'systemstudioOs.runOstepSimulator'
];

async function assertPackagedResource(extension, ...segments) {
  const resource = vscode.Uri.joinPath(extension.extensionUri, ...segments);
  const stat = await vscode.workspace.fs.stat(resource);
  assert.ok(stat.size > 0, `Packaged resource is empty: ${segments.join('/')}`);
}

async function assertNotPackaged(extension, ...segments) {
  const resource = vscode.Uri.joinPath(extension.extensionUri, ...segments);
  await assert.rejects(vscode.workspace.fs.stat(resource), undefined, `Internal path was packaged: ${segments.join('/')}`);
}

async function run() {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, `${EXTENSION_ID} was not installed from the VSIX`);

  const expectedRoot = path.resolve(process.env.SYSTEMSTUDIO_EXPECTED_EXTENSIONS_DIR || '');
  const installedPath = path.resolve(extension.extensionPath);
  const relative = path.relative(expectedRoot, installedPath);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Expected packaged install under ${expectedRoot}; got ${installedPath}`);
  assert.equal(extension.packageJSON.version, process.env.SYSTEMSTUDIO_EXPECTED_VERSION);
  assert.equal(extension.packageJSON.main, './dist/extension.js');

  await assertPackagedResource(extension, 'dist', 'extension.js');
  await assertPackagedResource(extension, 'course-pack', 'fall2026', 'lessons', 'CIS450_ECE478_Fall2026_Accessible_Lessons.html');
  await assertPackagedResource(extension, 'course-pack', 'fall2026', 'syllabus', 'CIS450_ECE478_Fall2026_Syllabus.html');
  await assertNotPackaged(extension, 'integration');
  await assertNotPackaged(extension, 'test');
  await assertNotPackaged(extension, 'scripts');

  await extension.activate();
  assert.equal(extension.isActive, true, 'Packaged extension did not activate');
  const commands = new Set(await vscode.commands.getCommands(true));
  for (const command of REQUIRED_COMMANDS) assert.ok(commands.has(command), `Missing registered command ${command}`);

  await vscode.commands.executeCommand('systemstudioOs.openLearningHub');
  await new Promise((resolve) => setTimeout(resolve, 400));
  const hub = vscode.window.tabGroups.all.flatMap((group) => group.tabs).find((tab) => tab.input instanceof vscode.TabInputWebview && tab.input.viewType === 'systemstudioOs.learningHub');
  assert.ok(hub, 'The packaged Open Learning Hub command did not create its webview');
  assert.match(hub.label, /CIS 450 \/ ECE 478/);
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  console.log(`PASS packaged VSIX Extension Host integration (${process.platform}; VS Code ${vscode.version}; extension ${extension.packageJSON.version})`);
}

module.exports = { run };
