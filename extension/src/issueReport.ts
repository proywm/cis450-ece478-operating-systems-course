export const ISSUE_REPORT_CATEGORIES = [
  { label: 'Setup or installation', value: 'setup' },
  { label: 'Course tool stopped working', value: 'tool' },
  { label: 'Content, link, or schedule', value: 'content' },
  { label: 'Accessibility or usability', value: 'accessibility' },
  { label: 'Something else', value: 'other' }
] as const;

export type IssueReportCategory = typeof ISSUE_REPORT_CATEGORIES[number]['value'];

export interface IssueReportEnvironment {
  extensionVersion: string;
  vscodeVersion: string;
  platform: string;
  architecture: string;
  remoteName?: string;
  uiKind: 'desktop' | 'web';
  workspaceTrusted: boolean;
}

export interface IssueReportDraft {
  category: IssueReportCategory;
  summary: string;
  lastAction?: string;
  visibleError?: string;
  environment: IssueReportEnvironment;
}

const CATEGORY_LABEL = Object.fromEntries(
  ISSUE_REPORT_CATEGORIES.map((category) => [category.value, category.label])
) as Record<IssueReportCategory, string>;

export function buildGitHubIssueDraftUrl(repository: string, draft: IssueReportDraft): string {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('The GitHub repository identifier is invalid.');
  }
  const summary = clean(draft.summary, 160) || 'Extension problem';
  const body = [
    '> This is a public GitHub report. Remove names, grades, credentials, private course content, or other sensitive information before submitting.',
    '',
    '### Problem category',
    CATEGORY_LABEL[draft.category],
    '',
    '### What happened',
    quote(summary),
    '',
    '### Last action before the problem',
    quote(clean(draft.lastAction, 800) || 'Not provided'),
    '',
    '### Visible error message',
    quote(clean(draft.visibleError, 800) || 'No visible error message'),
    '',
    '### Automatically collected environment',
    `- Extension version: ${clean(draft.environment.extensionVersion, 40)}`,
    `- VS Code version: ${clean(draft.environment.vscodeVersion, 40)}`,
    `- Operating system: ${clean(draft.environment.platform, 30)} / ${clean(draft.environment.architecture, 30)}`,
    `- VS Code host: ${clean(draft.environment.remoteName, 80) || 'local'} (${draft.environment.uiKind})`,
    `- Workspace trusted: ${draft.environment.workspaceTrusted ? 'yes' : 'no'}`,
    '',
    '### Review before submitting',
    '- [ ] I removed any names, grades, API keys, passwords, private files, assignment solutions, and unrelated logs.',
    '- [ ] I understand this report will be public after I click **Submit new issue** on GitHub.',
    '',
    '_SystemStudio prepared this draft locally after explicit consent. It did not attach files, source code, grades, credentials, Canvas data, or logs, and it did not submit the issue._'
  ].join('\n');
  const url = new URL(`https://github.com/${repository}/issues/new`);
  url.searchParams.set('title', `[Student report · ${CATEGORY_LABEL[draft.category]}] ${summary}`);
  url.searchParams.set('body', body);
  return url.toString();
}

function clean(value: string | undefined, maximum: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maximum);
}

function quote(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}
