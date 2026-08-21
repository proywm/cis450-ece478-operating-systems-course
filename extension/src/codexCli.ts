import { execFile } from 'node:child_process';

export const UM_CODEX_CLASSROOM_URL = 'https://www.its.umich.edu/computing/ai/codex-classroom';

export interface CodexCliStatus {
  ready: boolean;
  installed: boolean;
  authenticated: boolean;
  command?: string;
  version?: string;
  detail: string;
}

export function codexCommandCandidates(platform: NodeJS.Platform = process.platform): readonly string[] {
  return platform === 'win32' ? ['codex.exe', 'codex.cmd', 'codex'] : ['codex'];
}

export function codexProbeInvocation(
  command: string,
  platform: NodeJS.Platform = process.platform,
  args: readonly string[] = ['--version']
): { executable: string; args: string[] } {
  if (platform === 'win32' && command !== 'codex.exe') {
    return { executable: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', [command, ...args].join(' ')] };
  }
  return { executable: command, args: [...args] };
}

async function runProbe(
  command: string,
  args: readonly string[],
  run: typeof execFile
): Promise<{ ok: boolean; output: string }> {
  const invocation = codexProbeInvocation(command, process.platform, args);
  return new Promise((resolve) => {
    run(invocation.executable, invocation.args, { timeout: 10_000, windowsHide: true }, (error, stdout, stderr) => {
      resolve({ ok: !error, output: `${stdout ?? ''}${stderr ?? ''}`.trim().slice(0, 240) });
    });
  });
}

export async function probeCodexCli(
  candidates: readonly string[] = codexCommandCandidates(),
  run: typeof execFile = execFile
): Promise<CodexCliStatus> {
  for (const command of candidates) {
    const version = await runProbe(command, ['--version'], run);
    if (version.ok) {
      const login = await runProbe(command, ['login', 'status'], run);
      if (!login.ok) {
        return {
          ready: false,
          installed: true,
          authenticated: false,
          command,
          version: version.output || 'Codex CLI detected',
          detail: 'Codex CLI is installed but is not authenticated. Complete the official U-M Codex setup, then run this check again. SystemStudio never reads or stores the student key.'
        };
      }
      return {
        ready: true,
        installed: true,
        authenticated: true,
        command,
        version: version.output || 'Codex CLI detected',
        detail: 'Codex CLI is installed and its login status is confirmed. Authentication remains student-owned; SystemStudio never reads or stores the student key.'
      };
    }
  }
  return {
    ready: false,
    installed: false,
    authenticated: false,
    detail: 'Codex CLI was not found in the VS Code process PATH. Complete the official U-M setup, then restart VS Code and retry.'
  };
}
