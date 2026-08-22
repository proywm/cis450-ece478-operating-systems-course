import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { buildGitHubIssueDraftUrl } from '../src/issueReport.js';

test('student issue draft is prefilled, bounded, and contains only declared diagnostics', () => {
  const result = new URL(buildGitHubIssueDraftUrl('proywm/cis450-ece478-operating-systems-course', {
    category: 'setup',
    summary: 'Guided lab cannot find the course container',
    lastAction: 'Opened Module 11 and selected the trace lab',
    visibleError: 'strace is unavailable',
    environment: {
      extensionVersion: '0.9.7',
      vscodeVersion: '1.100.0',
      platform: 'darwin',
      architecture: 'arm64',
      remoteName: undefined,
      uiKind: 'desktop',
      workspaceTrusted: true
    }
  }));
  assert.equal(result.origin, 'https://github.com');
  assert.equal(result.pathname, '/proywm/cis450-ece478-operating-systems-course/issues/new');
  assert.match(result.searchParams.get('title') ?? '', /Student report.*Guided lab/);
  const body = result.searchParams.get('body') ?? '';
  for (const marker of ['Extension version: 0.9.7', 'VS Code version: 1.100.0', 'darwin / arm64', 'Workspace trusted: yes', 'did not attach files']) {
    assert.match(body, new RegExp(marker));
  }
  assert.doesNotMatch(body, /workspace path|source code contents|Canvas token/i);
});

test('student issue draft strips control characters and caps student-entered fields', () => {
  const result = new URL(buildGitHubIssueDraftUrl('proywm/cis450-ece478-operating-systems-course', {
    category: 'other',
    summary: `Problem\u0000 ${'x'.repeat(500)}`,
    lastAction: 'clicked\u0007 button',
    environment: {
      extensionVersion: 'test',
      vscodeVersion: 'test',
      platform: 'linux',
      architecture: 'x64',
      uiKind: 'desktop',
      workspaceTrusted: false
    }
  }));
  const title = result.searchParams.get('title') ?? '';
  const body = result.searchParams.get('body') ?? '';
  assert.doesNotMatch(title + body, /[\u0000\u0007]/);
  assert.ok(title.length < 230);
  assert.match(body, /Workspace trusted: no/);
});

test('report workflow asks consent before opening GitHub and never reads student files', async () => {
  const source = await readFile(resolve(process.cwd(), 'src/issueReporter.ts'), 'utf8');
  const consent = source.indexOf('showWarningMessage');
  const transmission = source.indexOf('openExternal');
  assert.ok(consent >= 0 && transmission > consent);
  assert.match(source, /Nothing leaves VS Code before you approve/);
  assert.doesNotMatch(source, /workspace\.fs|activeTextEditor|clipboard|readFile/);
});
