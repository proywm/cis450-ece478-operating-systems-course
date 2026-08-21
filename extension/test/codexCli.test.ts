import test from 'node:test';
import assert from 'node:assert/strict';
import { codexCommandCandidates, codexProbeInvocation, probeCodexCli, UM_CODEX_CLASSROOM_URL } from '../src/codexCli.js';

test('U-M Codex readiness is cross-platform and credential-blind', async () => {
  assert.deepEqual(codexCommandCandidates('win32'), ['codex.exe', 'codex.cmd', 'codex']);
  assert.deepEqual(codexCommandCandidates('linux'), ['codex']);
  assert.deepEqual(codexProbeInvocation('codex.exe', 'win32'), { executable: 'codex.exe', args: ['--version'] });
  assert.match(codexProbeInvocation('codex.cmd', 'win32').args.at(-1) ?? '', /^codex\.cmd --version$/);
  assert.match(UM_CODEX_CLASSROOM_URL, /^https:\/\/www\.its\.umich\.edu\//);
  const fake = ((command: string, _args: readonly string[], _options: object, callback: Function) => {
    callback(null, `codex-cli test via ${command}\n`, '');
    return undefined;
  }) as unknown as Parameters<typeof probeCodexCli>[1];
  const status = await probeCodexCli(['codex'], fake);
  assert.equal(status.ready, true);
  assert.equal(status.command, 'codex');
  assert.match(status.detail, /authentication remains student-owned/i);
});
