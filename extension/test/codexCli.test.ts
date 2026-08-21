import test from 'node:test';
import assert from 'node:assert/strict';
import { codexCommandCandidates, codexProbeInvocation, probeCodexCli, UM_CODEX_CLASSROOM_URL } from '../src/codexCli.js';

test('U-M Codex readiness checks installation and student-owned login status', async () => {
  assert.deepEqual(codexCommandCandidates('win32'), ['codex.exe', 'codex.cmd', 'codex']);
  assert.deepEqual(codexCommandCandidates('linux'), ['codex']);
  assert.deepEqual(codexProbeInvocation('codex.exe', 'win32'), { executable: 'codex.exe', args: ['--version'] });
  assert.match(codexProbeInvocation('codex.cmd', 'win32').args.at(-1) ?? '', /^codex\.cmd --version$/);
  assert.match(codexProbeInvocation('codex.cmd', 'win32', ['login', 'status']).args.at(-1) ?? '', /^codex\.cmd login status$/);
  assert.match(UM_CODEX_CLASSROOM_URL, /^https:\/\/www\.its\.umich\.edu\//);
  const calls: string[][] = [];
  const fake = ((command: string, args: readonly string[], _options: object, callback: Function) => {
    calls.push([command, ...args]);
    callback(null, args.includes('--version') ? `codex-cli test via ${command}\n` : 'Logged in using ChatGPT\n', '');
    return undefined;
  }) as unknown as Parameters<typeof probeCodexCli>[1];
  const status = await probeCodexCli(['codex'], fake);
  assert.equal(status.ready, true);
  assert.equal(status.installed, true);
  assert.equal(status.authenticated, true);
  assert.equal(status.command, 'codex');
  assert.deepEqual(calls.map((call) => call.slice(1)), [['--version'], ['login', 'status']]);
  assert.match(status.detail, /login status is confirmed/i);
});

test('an installed but unauthenticated Codex CLI is not reported ready', async () => {
  const fake = ((_command: string, args: readonly string[], _options: object, callback: Function) => {
    callback(args.includes('--version') ? null : new Error('Not logged in'), args.includes('--version') ? 'codex-cli test' : '', '');
    return undefined;
  }) as unknown as Parameters<typeof probeCodexCli>[1];
  const status = await probeCodexCli(['codex'], fake);
  assert.equal(status.ready, false);
  assert.equal(status.installed, true);
  assert.equal(status.authenticated, false);
  assert.match(status.detail, /not authenticated/i);
});
