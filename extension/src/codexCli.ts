import { execFile } from 'node:child_process';

export const UM_CODEX_CLASSROOM_URL = 'https://www.its.umich.edu/computing/ai/codex-classroom';

export interface CodexCliStatus {
  ready: boolean;
  command?: string;
  version?: string;
  detail: string;
}

export function codexCommandCandidates(platform: NodeJS.Platform = process.platform): readonly string[] {
  return platform === 'win32' ? ['codex.exe', 'codex.cmd', 'codex'] : ['codex'];
}

export function codexProbeInvocation(command: string, platform: NodeJS.Platform = process.platform): { executable: string; args: string[] } {
  if (platform === 'win32' && command !== 'codex.exe') {
    return { executable: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `${command} --version`] };
  }
  return { executable: command, args: ['--version'] };
}

export async function probeCodexCli(
  candidates: readonly string[] = codexCommandCandidates(),
  run: typeof execFile = execFile
): Promise<CodexCliStatus> {
  for (const command of candidates) {
    const invocation = codexProbeInvocation(command);
    const result = await new Promise<{ ok: boolean; output: string }>((resolve) => {
      run(invocation.executable, invocation.args, { timeout: 10_000, windowsHide: true }, (error, stdout, stderr) => {
        resolve({ ok: !error, output: `${stdout ?? ''}${stderr ?? ''}`.trim().slice(0, 240) });
      });
    });
    if (result.ok) {
      return {
        ready: true,
        command,
        version: result.output || 'Codex CLI detected',
        detail: 'Codex CLI is installed. U-M authentication remains student-owned and is verified inside Codex.'
      };
    }
  }
  return {
    ready: false,
    detail: 'Codex CLI was not found in the VS Code process PATH. Complete the official U-M setup, then restart VS Code and retry.'
  };
}
