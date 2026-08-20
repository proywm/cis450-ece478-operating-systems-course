import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { COURSE, COURSEWORK, MODULES, SOURCE_BOUNDARIES } from './courseData.js';
import { buildCalendar, tutorReply } from './core.js';
import { FAQS, MAX_ICS_BYTES, WALKTHROUGH_STEPS, formatPreClassQuestion, normalizeLearningState, parseCanvasIcs, practiceAnalytics, recordPracticeAnswer, safeCanvasUrl, selectPracticeQuestions, toggleSavedQuestion, validateEvidenceFiles } from './learning.js';
import { GUIDED_LABS, guidedLab } from './labs.js';
import { labFiles, workspaceFiles } from './workspace.js';

const execFileAsync = promisify(execFile);
let hub: LearningHub | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CourseTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('systemstudioOs.course', provider),
    vscode.commands.registerCommand('systemstudioOs.openLearningHub', (moduleNumber?: number) => {
      hub = hub ?? new LearningHub(context);
      hub.show(moduleNumber);
    }),
    vscode.commands.registerCommand('systemstudioOs.openCanvas', () => vscode.env.openExternal(vscode.Uri.parse(configuredCanvasUrl('canvasCourseUrl')))),
    vscode.commands.registerCommand('systemstudioOs.openSyllabus', () => openBundledHtml(context, 'syllabus', 'CIS450_ECE478_Fall2026_Syllabus.html')),
    vscode.commands.registerCommand('systemstudioOs.openAccessibleLessons', () => openBundledHtml(context, 'lessons', 'CIS450_ECE478_Fall2026_Accessible_Lessons.html')),
    vscode.commands.registerCommand('systemstudioOs.checkEnvironment', checkEnvironment),
    vscode.commands.registerCommand('systemstudioOs.createLabWorkspace', createLabWorkspace),
    vscode.commands.registerCommand('systemstudioOs.runCurrentC', runCurrentC),
    vscode.commands.registerCommand('systemstudioOs.exportCalendar', exportCalendar),
    vscode.commands.registerCommand('systemstudioOs.configureCanvas', configureCanvasLinks),
    vscode.commands.registerCommand('systemstudioOs.importCanvasCalendar', () => importCanvasCalendar()),
    vscode.commands.registerCommand('systemstudioOs.createModuleLab', (moduleNumber?: number) => createModuleLab(moduleNumber)),
    vscode.commands.registerCommand('systemstudioOs.validateEvidence', (itemId?: string) => validateCourseworkEvidence(itemId))
  );
}

export function deactivate(): void {}

class CourseTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  getTreeItem(element: TreeNode): vscode.TreeItem { return element; }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return [
        action('Open course home', 'systemstudioOs.openLearningHub', 'home', 'Fall 2026 active learning hub'),
        new TreeNode('Modules (13)', vscode.TreeItemCollapsibleState.Expanded, 'modules'),
        new TreeNode('Coursework (3 homework · 4 programming)', vscode.TreeItemCollapsibleState.Collapsed, 'coursework'),
        new TreeNode('Environment and hands-on labs', vscode.TreeItemCollapsibleState.Collapsed, 'tools'),
        new TreeNode('Staff, calendar, and Canvas', vscode.TreeItemCollapsibleState.Collapsed, 'support')
      ];
    }
    if (element.kind === 'modules') {
      return MODULES.map((module) => {
        const node = action(`Module ${module.number}: ${module.title}`, 'systemstudioOs.openLearningHub', 'module', module.unit, [module.number]);
        node.iconPath = new vscode.ThemeIcon(module.unit === 'Virtualization' ? 'server-process' : module.unit === 'Concurrency' ? 'git-merge' : 'database');
        return node;
      });
    }
    if (element.kind === 'coursework') {
      return COURSEWORK.map((item) => action(item.title, 'systemstudioOs.openLearningHub', 'coursework-item', item.focus));
    }
    if (element.kind === 'tools') {
      return [
        action('Check Docker and C toolchain', 'systemstudioOs.checkEnvironment', 'action', 'diagnostic only'),
        action('Create portable OS lab workspace', 'systemstudioOs.createLabWorkspace', 'action', 'Docker · GCC · GDB · Python · QEMU'),
        action('Create a guided module lab', 'systemstudioOs.createModuleLab', 'action', '13 source-mapped starters'),
        action('Build and run current C file', 'systemstudioOs.runCurrentC', 'action', 'inside the course container')
      ];
    }
    if (element.kind === 'support') {
      return [
        action(`${COURSE.meeting} · ${COURSE.room}`, 'systemstudioOs.openLearningHub', 'info', 'verified Fall 2026 schedule'),
        action(`Instructor: ${COURSE.instructor}`, 'systemstudioOs.openLearningHub', 'info', COURSE.instructorOffice),
        action(COURSE.gsiStatus, 'systemstudioOs.openLearningHub', 'info', 'current course staffing status'),
        action('Export Fall 2026 calendar', 'systemstudioOs.exportCalendar', 'action', '27 class meetings'),
        action('Open Fall 2026 syllabus', 'systemstudioOs.openSyllabus', 'action', 'accessible HTML · instructor review required'),
        action('Open accessible lesson collection', 'systemstudioOs.openAccessibleLessons', 'action', '13 standalone HTML modules'),
        action('Configure direct Canvas links', 'systemstudioOs.configureCanvas', 'action', 'HTTPS UM-Dearborn Canvas host only'),
        action('Import Canvas calendar', 'systemstudioOs.importCanvasCalendar', 'action', 'local .ics · no upload'),
        action('Open Canvas', 'systemstudioOs.openCanvas', 'action', 'deadlines · submissions · official grades')
      ];
    }
    return [];
  }
}

class TreeNode extends vscode.TreeItem {
  constructor(label: string, state: vscode.TreeItemCollapsibleState, readonly kind: string) {
    super(label, state);
  }
}

function action(label: string, command: string, kind: string, description?: string, args: unknown[] = []): TreeNode {
  const item = new TreeNode(label, vscode.TreeItemCollapsibleState.None, kind);
  item.command = { command, title: label, arguments: args };
  item.description = description;
  item.tooltip = `${label}${description ? ` — ${description}` : ''}`;
  item.iconPath = new vscode.ThemeIcon(kind === 'home' ? 'home' : kind === 'action' ? 'play' : 'book');
  return item;
}

class LearningHub {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  show(moduleNumber?: number): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('systemstudioOs.learningHub', COURSE.title, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
      const firstRun = this.context.globalState.get<number>('walkthroughVersion') !== 1;
      this.panel.webview.html = buildHubHtmlForTesting({ firstRun, canvasCourseUrl: configuredCanvasUrl('canvasCourseUrl') });
      this.panel.onDidDispose(() => { this.panel = undefined; hub = undefined; }, undefined, this.context.subscriptions);
      this.panel.webview.onDidReceiveMessage(async (message: Record<string, unknown>) => {
        if (message.type === 'tutor') {
          this.panel?.webview.postMessage({ type: 'tutorReply', reply: tutorReply(typeof message.question === 'string' ? message.question : '') });
        } else if (message.type === 'command' && typeof message.command === 'string') {
          const allowed = new Set(['systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.checkEnvironment', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar', 'systemstudioOs.configureCanvas', 'systemstudioOs.importCanvasCalendar']);
          if (allowed.has(message.command)) await vscode.commands.executeCommand(message.command);
        } else if (message.type === 'openExternal' && typeof message.command === 'string') {
          const uri = vscode.Uri.parse(message.command);
          if (safeCourseResource(uri)) await vscode.env.openExternal(uri);
        } else if (message.type === 'practiceSelect') {
          const state = normalizeLearningState(message.learning);
          const focus = ['recommended', 'due', 'saved', 'all'].includes(String(message.focus)) ? message.focus as 'recommended' | 'due' | 'saved' | 'all' : 'recommended';
          const moduleNumber = Number(message.moduleNumber);
          const questions = selectPracticeQuestions(state, { focus, ...(Number.isInteger(moduleNumber) && moduleNumber >= 1 && moduleNumber <= 13 ? { moduleNumber } : {}), count: 5 });
          void this.panel?.webview.postMessage({ type: 'practiceSet', questions, learning: state, analytics: practiceAnalytics(state) });
        } else if (message.type === 'practiceAnswer') {
          try {
            const result = recordPracticeAnswer(normalizeLearningState(message.learning), String(message.questionId ?? ''), Number(message.selectedIndex), message.confidence === 'low' || message.confidence === 'high' ? message.confidence : 'medium');
            void this.panel?.webview.postMessage({ type: 'practiceResult', ...result, analytics: practiceAnalytics(result.state), questionId: message.questionId });
          } catch (error) {
            void this.panel?.webview.postMessage({ type: 'notice', message: error instanceof Error ? error.message : String(error) });
          }
        } else if (message.type === 'toggleSave') {
          try {
            const state = toggleSavedQuestion(normalizeLearningState(message.learning), String(message.questionId ?? ''));
            void this.panel?.webview.postMessage({ type: 'learningState', learning: state, analytics: practiceAnalytics(state) });
          } catch (error) {
            void this.panel?.webview.postMessage({ type: 'notice', message: error instanceof Error ? error.message : String(error) });
          }
        } else if (message.type === 'walkthroughStatus') {
          if (message.status === 'completed' || message.status === 'skipped') await this.context.globalState.update('walkthroughVersion', 1);
        } else if (message.type === 'createModuleLab') {
          await createModuleLab(Number(message.moduleNumber));
        } else if (message.type === 'validateEvidence') {
          const result = await validateCourseworkEvidence(String(message.itemId ?? ''));
          if (result) void this.panel?.webview.postMessage({ type: 'evidenceValidation', itemId: message.itemId, result });
        } else if (message.type === 'importIcs') {
          const events = await importCanvasCalendar();
          if (events) void this.panel?.webview.postMessage({ type: 'icsPreview', events });
        } else if (message.type === 'composePreClass') {
          const formatted = formatPreClassQuestion(message.draft);
          if (!formatted) {
            void this.panel?.webview.postMessage({ type: 'notice', message: 'Add a topic, a focused question, and a Canvas route.' });
          } else {
            await vscode.env.clipboard.writeText(formatted.text);
            const setting = formatted.route === 'discussion' ? 'canvasDiscussionUrl' : 'canvasPrivateMessageUrl';
            const target = configuredCanvasUrl(setting);
            await vscode.env.openExternal(vscode.Uri.parse(target));
            const anonymity = formatted.anonymityRequested
              ? ' Anonymity is not promised: use it only if Canvas visibly offers and confirms that option before posting.'
              : '';
            void this.panel?.webview.postMessage({ type: 'notice', message: `Draft copied; Canvas opened. Review the recipient, course, visibility, and content before posting.${anonymity}` });
          }
        }
      }, undefined, this.context.subscriptions);
    }
    this.panel.reveal(vscode.ViewColumn.One);
    if (moduleNumber) this.panel.webview.postMessage({ type: 'selectModule', number: moduleNumber });
  }
}

async function openBundledHtml(context: vscode.ExtensionContext, folder: 'syllabus' | 'lessons', filename: string): Promise<void> {
  const uri = vscode.Uri.joinPath(context.extensionUri, 'course-pack', 'fall2026', folder, filename);
  try {
    await vscode.workspace.fs.stat(uri);
    await vscode.env.openExternal(uri);
  } catch {
    void vscode.window.showErrorMessage(`The packaged course file is missing: ${filename}. Reinstall the verified VSIX.`);
  }
}

type CanvasSetting = 'canvasCourseUrl' | 'canvasDiscussionUrl' | 'canvasPrivateMessageUrl';

function configuredCanvasUrl(setting: CanvasSetting): string {
  const configured = vscode.workspace.getConfiguration('systemstudioOs').get<string>(setting, '').trim();
  return safeCanvasUrl(configured)?.toString() ?? COURSE.canvasUrl;
}

async function configureCanvasLinks(): Promise<void> {
  const choices: { label: string; description: string; key: CanvasSetting }[] = [
    { label: 'Course home', description: 'Direct Fall 2026 Canvas URL after instructor verification', key: 'canvasCourseUrl' },
    { label: 'Pre-class discussion', description: 'Optional instructor-verified discussion topic URL', key: 'canvasDiscussionUrl' },
    { label: 'Private message route', description: 'Optional instructor-verified Canvas Inbox/contact URL', key: 'canvasPrivateMessageUrl' }
  ];
  const selected = await vscode.window.showQuickPick(choices, { title: 'Configure a UM-Dearborn Canvas link', placeHolder: 'Choose which link to configure' });
  if (!selected) return;
  const current = vscode.workspace.getConfiguration('systemstudioOs').get<string>(selected.key, '');
  const entered = await vscode.window.showInputBox({ title: selected.label, value: current, prompt: 'Paste an https://canvas.umd.umich.edu/ URL. Leave blank to clear this optional setting.', validateInput: (value) => !value.trim() || safeCanvasUrl(value) ? undefined : 'Use an HTTPS URL on canvas.umd.umich.edu with no embedded credentials.' });
  if (entered === undefined) return;
  await vscode.workspace.getConfiguration('systemstudioOs').update(selected.key, entered.trim(), vscode.ConfigurationTarget.Global);
  void vscode.window.showInformationMessage(entered.trim() ? `${selected.label} saved locally. Verify the course and destination in Canvas before acting.` : `${selected.label} cleared.`);
}

function safeCourseResource(uri: vscode.Uri): boolean {
  if (uri.scheme !== 'https') return false;
  return ['pages.cs.wisc.edu', 'canvas.umd.umich.edu', 'umdearborn.edu', 'www.umdearborn.edu'].includes(uri.authority.toLowerCase());
}

async function importCanvasCalendar() {
  const selected = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: { 'iCalendar files': ['ics'] }, openLabel: 'Review this calendar locally' });
  if (!selected?.[0]) return undefined;
  const stat = await vscode.workspace.fs.stat(selected[0]);
  if (stat.size > MAX_ICS_BYTES) {
    void vscode.window.showErrorMessage('The selected calendar is larger than the 2 MiB local safety limit. Nothing was imported.');
    return undefined;
  }
  try {
    const events = parseCanvasIcs(Buffer.from(await vscode.workspace.fs.readFile(selected[0])).toString('utf8'));
    void vscode.window.showInformationMessage(`Parsed ${events.length} event(s) locally. Review the preview before keeping any reminders; a Canvas calendar can contain unrelated courses.`);
    return events;
  } catch (error) {
    void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

async function validateCourseworkEvidence(itemId?: string) {
  const item = COURSEWORK.find((entry) => entry.id === itemId) ?? await vscode.window.showQuickPick(COURSEWORK.map((entry) => ({ label: entry.title, description: entry.focus, entry })), { title: 'Choose the coursework planning item' }).then((picked) => picked?.entry);
  if (!item) return undefined;
  const selected = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, openLabel: 'Validate selected evidence files locally' });
  if (!selected?.length) return undefined;
  const files = await Promise.all(selected.map(async (uri) => {
    const stat = await vscode.workspace.fs.stat(uri);
    return { name: uri.path.split('/').pop() ?? uri.fsPath, size: stat.size, isFile: (stat.type & vscode.FileType.File) !== 0 };
  }));
  const result = validateEvidenceFiles(files, item.expectedExtensions);
  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 Evidence Check');
  output.clear();
  output.appendLine(`${item.title} — local evidence validation`);
  output.appendLine('This is not technical grading, Canvas validation, packaging, upload, or submission.');
  result.lines.forEach((line) => output.appendLine(`OK: ${line}`));
  result.warnings.forEach((line) => output.appendLine(`REVIEW: ${line}`));
  output.appendLine(`Allowed-extension planning hint from historical materials: ${item.expectedExtensions.join(', ')}.`);
  output.appendLine('Open the current Canvas assignment to confirm filenames, archive format, tests, due date, and submission receipt.');
  output.show(true);
  return result;
}

async function createModuleLab(moduleNumber?: number): Promise<void> {
  let lab = Number.isInteger(moduleNumber) ? guidedLab(Number(moduleNumber)) : undefined;
  if (!lab) {
    const selected = await vscode.window.showQuickPick(GUIDED_LABS.map((entry) => ({ label: `Module ${entry.moduleNumber}: ${entry.title}`, description: entry.purpose, entry })), { title: 'Choose a guided formative OS lab' });
    lab = selected?.entry;
  }
  if (!lab) return;
  const selected = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Choose parent folder' });
  if (!selected?.[0]) return;
  const folderName = `cis450-module-${String(lab.moduleNumber).padStart(2, '0')}-${lab.id}`;
  const root = vscode.Uri.joinPath(selected[0], folderName);
  try {
    await vscode.workspace.fs.stat(root);
    void vscode.window.showWarningMessage(`Nothing was overwritten: ${root.fsPath} already exists.`);
    return;
  } catch {}
  await vscode.workspace.fs.createDirectory(root);
  const files = labFiles(lab);
  for (const [relative, content] of Object.entries(files)) await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(root, relative), Buffer.from(content, 'utf8'));
  const choice = await vscode.window.showInformationMessage(`Created Module ${lab.moduleNumber} guided lab. Predict first, then use “${lab.runCommand}”.`, 'Open folder');
  if (choice === 'Open folder') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
}

async function checkEnvironment(): Promise<void> {
  const checks = await Promise.all([
    commandVersion('Docker', 'docker', ['--version']),
    commandVersion('Git', 'git', ['--version']),
    commandVersion('C compiler', process.platform === 'win32' ? 'where' : 'sh', process.platform === 'win32' ? ['gcc'] : ['-lc', 'command -v gcc || command -v clang'])
  ]);
  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 Environment');
  output.clear();
  output.appendLine('SystemStudio OS environment check');
  output.appendLine('This diagnostic changes nothing and installs nothing.');
  for (const check of checks) output.appendLine(`${check.ok ? 'READY' : 'NEEDS ATTENTION'}  ${check.name}: ${check.detail}`);
  output.appendLine('\nThe portable lab needs Docker. A host C compiler is optional because the container supplies GCC.');
  output.show(true);
}

async function commandVersion(name: string, executable: string, args: string[]): Promise<{ name: string; ok: boolean; detail: string }> {
  try {
    const result = await execFileAsync(executable, args, { timeout: 8_000 });
    return { name, ok: true, detail: (result.stdout || result.stderr).trim().split(/\r?\n/)[0] || 'found' };
  } catch (error) {
    const message = error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : String(error);
    return { name, ok: false, detail: message };
  }
}

async function createLabWorkspace(): Promise<void> {
  const selection = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Choose parent folder' });
  if (!selection?.[0]) return;
  const root = vscode.Uri.joinPath(selection[0], 'cis450-os-lab');
  try {
    await vscode.workspace.fs.stat(root);
    void vscode.window.showWarningMessage(`Nothing was changed: ${root.fsPath} already exists. Choose a different parent or rename the existing folder.`);
    return;
  } catch {}
  const files: Record<string, string> = workspaceFiles();
  await vscode.workspace.fs.createDirectory(root);
  for (const [relative, contents] of Object.entries(files)) {
    const parts = relative.split('/');
    const target = vscode.Uri.joinPath(root, ...parts);
    if (parts.length > 1) await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, ...parts.slice(0, -1)));
    await vscode.workspace.fs.writeFile(target, Buffer.from(contents, 'utf8'));
  }
  const choice = await vscode.window.showInformationMessage(`Created the portable OS lab at ${root.fsPath}. Review the container recipe before running it.`, 'Open workspace');
  if (choice === 'Open workspace') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
}

async function runCurrentC(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const folders = vscode.workspace.workspaceFolders;
  if (!editor || editor.document.languageId !== 'c' || !folders?.[0]) {
    void vscode.window.showWarningMessage('Open a C file inside a workspace before running this command.');
    return;
  }
  const relative = vscode.workspace.asRelativePath(editor.document.uri, false);
  if (relative.startsWith('..') || !/^[A-Za-z0-9_./-]+\.c$/.test(relative)) {
    void vscode.window.showErrorMessage('For safety, the current C file must be inside the workspace and use a simple path.');
    return;
  }
  await editor.document.save();
  const terminal = vscode.window.createTerminal({ name: 'CIS 450 OS Lab', cwd: folders[0].uri });
  terminal.show();
  terminal.sendText(`docker compose run --rm oslab bash -lc 'mkdir -p build && gcc -Wall -Wextra -Wpedantic -g -pthread ${relative} -o build/current && ./build/current'`, true);
}

async function exportCalendar(): Promise<void> {
  const target = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('CIS450_ECE478_Fall2026.ics'), filters: { Calendar: ['ics'] }, saveLabel: 'Export local calendar' });
  if (!target) return;
  await vscode.workspace.fs.writeFile(target, Buffer.from(buildCalendar(), 'utf8'));
  void vscode.window.showInformationMessage('Exported 27 verified class meetings plus academic-calendar boundaries. Assignment and exam details remain Canvas-authoritative.');
}

export function buildHubHtmlForTesting(options: { firstRun?: boolean; canvasCourseUrl?: string } = {}): string {
  const data = JSON.stringify({ course: COURSE, modules: MODULES, coursework: COURSEWORK, boundaries: SOURCE_BOUNDARIES, labs: GUIDED_LABS, faqs: FAQS, walkthrough: WALKTHROUGH_STEPS, firstRun: options.firstRun === true, canvasCourseUrl: options.canvasCourseUrl ?? COURSE.canvasUrl }).replaceAll('<', '\\u003c');
  const nonce = Math.random().toString(36).slice(2);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>${COURSE.title}</title><style nonce="${nonce}">
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font:15px/1.55 var(--vscode-font-family);display:grid;grid-template-columns:minmax(220px,280px) 1fr;min-height:100vh}a{color:var(--vscode-textLink-foreground)}button,input,select,textarea{font:inherit}button{border:1px solid var(--vscode-button-border,transparent);border-radius:5px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:.48rem .72rem;cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button.quiet{background:transparent;color:var(--vscode-textLink-foreground);border-color:var(--vscode-panel-border)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--vscode-focusBorder);outline-offset:2px}.skip{position:fixed;left:-10000px}.skip:focus{left:1rem;top:1rem;z-index:20;background:var(--vscode-editor-background);padding:.5rem}.nav{border-right:1px solid var(--vscode-panel-border);padding:1rem;position:sticky;top:0;height:100vh;overflow:auto}.nav h1{font-size:1.1rem}.nav button{width:100%;text-align:left;margin:.2rem 0;background:transparent;color:var(--vscode-foreground);border-color:transparent}.nav button[aria-current="page"]{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}main{padding:clamp(1rem,3vw,2.5rem);max-width:1180px;width:100%}.panel[hidden],.module-content[hidden],[hidden]{display:none!important}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--vscode-descriptionForeground)}.notice{border-left:5px solid var(--vscode-textLink-foreground);padding:.8rem 1rem;background:var(--vscode-textBlockQuote-background);margin:1rem 0}.warning{border-left-color:var(--vscode-editorWarning-foreground)}.success{border-left-color:var(--vscode-testing-iconPassed)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:1rem}.card,.module{border:1px solid var(--vscode-panel-border);border-radius:8px;padding:1rem;background:var(--vscode-sideBar-background)}.module{padding:0}.module>button{width:100%;display:flex;justify-content:space-between;text-align:left;background:transparent;color:inherit;border:0;padding:1rem}.module-content{padding:0 1rem 1rem}.module-list{display:grid;gap:.75rem}.pill{display:inline-block;border:1px solid var(--vscode-panel-border);border-radius:999px;padding:.1rem .5rem;color:var(--vscode-descriptionForeground);font-size:.84rem}.question{border-top:1px solid var(--vscode-panel-border);padding-top:.8rem;margin-top:.8rem}.choice{display:block;margin:.45rem 0}.explanation{padding:.7rem;background:var(--vscode-textCodeBlock-background);border-radius:5px;margin-top:.5rem}.source{font-size:.9rem;color:var(--vscode-descriptionForeground)}.status-row,.actions,.practice-controls{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap}.status-row select{min-width:150px}progress{width:100%;height:1rem}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.5rem;border-bottom:1px solid var(--vscode-panel-border);vertical-align:top}.grade-grid{display:grid;grid-template-columns:minmax(180px,1fr) minmax(100px,160px);gap:.7rem;max-width:560px}input,select,textarea{padding:.45rem;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)}textarea{width:100%;min-height:105px}.result{font-size:1.2rem;font-weight:700}.source-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.muted{color:var(--vscode-descriptionForeground)}.checklist label{display:grid;grid-template-columns:auto 1fr;gap:.55rem;margin:.6rem 0}.analytics{font-variant-numeric:tabular-nums}.overlay{position:fixed;inset:0;background:color-mix(in srgb,var(--vscode-editor-background) 86%,transparent);z-index:15;display:grid;place-items:center;padding:1rem}.dialog{width:min(720px,100%);max-height:90vh;overflow:auto;border:2px solid var(--vscode-focusBorder);box-shadow:0 12px 40px #0008}.step-dots{display:flex;gap:.4rem}.dot{width:.8rem;height:.8rem;border-radius:50%;padding:0;background:var(--vscode-panel-border)}.dot.current{background:var(--vscode-textLink-foreground)}code{overflow-wrap:anywhere}@media(max-width:760px){body{display:block}.nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--vscode-panel-border)}.source-grid{grid-template-columns:1fr}main{padding:1rem}}
</style></head><body><a class="skip" href="#main">Skip to content</a>
<nav class="nav" aria-label="Course sections"><h1>SystemStudio OS</h1><p class="muted">CIS 450 / ECE 478</p><div id="nav"></div><hr><p><strong>Canvas is authoritative</strong><br><span class="muted">Deadlines · submissions · official grades</span></p></nav>
<main id="main" tabindex="-1"><section id="home" class="panel"></section><section id="modules" class="panel" hidden></section><section id="practice" class="panel" hidden></section><section id="labs" class="panel" hidden></section><section id="coursework" class="panel" hidden></section><section id="progress" class="panel" hidden></section><section id="help" class="panel" hidden></section></main><aside id="walkthrough" class="overlay" role="dialog" aria-modal="true" aria-labelledby="walk-title" hidden><div class="dialog card"><p class="eyebrow">Self-paced orientation</p><h2 id="walk-title"></h2><p id="walk-detail"></p><div id="walk-dots" class="step-dots" aria-label="Walkthrough progress"></div><p id="walk-count" class="muted"></p><div class="actions"><button id="walk-prev" class="secondary">Previous</button><button id="walk-next">Next</button><button id="walk-skip" class="quiet">Skip for now</button></div></div></aside><div id="global-notice" class="overlay" hidden><div class="dialog card" role="status" aria-live="polite"><p id="global-notice-text"></p><button id="global-notice-close">Close</button></div></div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi(), DATA=${data};
const emptyLearning=()=>({version:1,questions:{},attempts:[]});
const defaults={section:'home',moduleStatus:{},confidence:{},grade:{participation:'',homework:'',programming:'',midterm:'',finalExam:''},learning:emptyLearning(),coursework:{},labSteps:{},canvasEvents:[],walkthroughOpen:DATA.firstRun,walkthroughStep:0};
let state=Object.assign({},defaults,vscode.getState()||{});state.moduleStatus=state.moduleStatus||{};state.confidence=state.confidence||{};state.grade=Object.assign({},defaults.grade,state.grade||{});state.learning=state.learning||emptyLearning();state.coursework=state.coursework||{};state.labSteps=state.labSteps||{};state.canvasEvents=state.canvasEvents||[];
let practiceQuestions=[],analytics=[],icsPreview=[];
const tabs=[['home','Course home'],['modules','Modules'],['practice','Practice & review'],['labs','Guided labs'],['coursework','Coursework'],['progress','My local progress'],['help','Questions & help']];
function esc(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function command(name){vscode.postMessage({type:'command',command:name});}
function external(url){vscode.postMessage({type:'openExternal',command:url});}
function persist(){vscode.setState(state);}
function show(id){state.section=id;persist();document.querySelectorAll('.panel').forEach(x=>x.hidden=x.id!==id);document.querySelectorAll('#nav button').forEach(x=>x.setAttribute('aria-current',x.dataset.id===id?'page':'false'));document.getElementById(id).focus?.();}
document.getElementById('nav').innerHTML=tabs.map(t=>'<button data-id="'+t[0]+'">'+t[1]+'</button>').join('');document.getElementById('nav').onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.id)};
function bindCommands(root){root.querySelectorAll('[data-command]').forEach(button=>{button.onclick=()=>command(button.dataset.command)});}
function renderHome(){const el=document.getElementById('home');el.innerHTML='<p class="eyebrow">Active student course material · Fall 2026</p><h1>'+esc(DATA.course.title)+'</h1><div class="notice"><strong>Verified meeting:</strong> '+esc(DATA.course.meeting)+', '+esc(DATA.course.room)+'.<br><strong>Instructor:</strong> '+esc(DATA.course.instructor)+' · '+esc(DATA.course.instructorOffice)+'<br><strong>Course staffing:</strong> '+esc(DATA.course.gsiStatus)+'</div><div class="grid"><article class="card"><h2>Learn one module</h2><ol><li>Confirm current Canvas requirements.</li><li>Read the mapped OSTEP source and accessible explanation.</li><li>Try readiness practice and record confidence.</li><li>Complete the guided evidence lab.</li><li>Save uncertainty for spaced review or staff.</li></ol><div class="actions"><button id="home-modules">Open modules</button><button id="home-practice" class="secondary">Practice five</button></div></article><article class="card"><h2>Build observable behavior</h2><p>Thirteen guided starters cover environment, processes, scheduling, memory, concurrency, I/O, files, and recovery.</p><div class="actions"><button id="home-labs">Open guided labs</button><button data-command="systemstudioOs.createLabWorkspace" class="secondary">Create full portable workspace</button><button data-command="systemstudioOs.checkEnvironment" class="quiet">Check environment</button></div></article><article class="card"><h2>Canvas authority</h2><p>Configured destination: <code>'+esc(DATA.canvasCourseUrl)+'</code></p><div class="actions"><button data-command="systemstudioOs.openCanvas">Open Canvas</button><button data-command="systemstudioOs.configureCanvas" class="secondary">Configure links</button><button data-command="systemstudioOs.exportCalendar" class="quiet">Export class calendar</button></div></article></div><div class="actions"><button id="rerun-walk" class="secondary">Rerun orientation</button><button data-command="systemstudioOs.openAccessibleLessons" class="secondary">Accessible lesson collection</button><button data-command="systemstudioOs.openSyllabus" class="secondary">Accessible syllabus</button></div><h2>Evidence boundaries</h2><div class="source-grid"><div class="card"><h3>Verified Fall 2026</h3><ul>'+DATA.boundaries.verifiedCurrent.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Historical planning basis</h3><ul>'+DATA.boundaries.historicalPolicy.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Confirm in Canvas</h3><ul>'+DATA.boundaries.canvasOnly.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>';el.querySelector('#home-modules').onclick=()=>show('modules');el.querySelector('#home-practice').onclick=()=>show('practice');el.querySelector('#home-labs').onclick=()=>show('labs');el.querySelector('#rerun-walk').onclick=()=>{state.walkthroughOpen=true;state.walkthroughStep=0;persist();renderWalkthrough()};bindCommands(el);}
function questionHtml(q,prefix){return '<div class="question" data-q="'+q.id+'"><p><span class="pill">'+esc(q.level)+'</span> <strong>'+esc(q.prompt)+'</strong></p>'+q.choices.map((c,i)=>'<label class="choice"><input type="radio" name="'+prefix+q.id+'" value="'+i+'"> '+esc(c)+'</label>').join('')+(q.hint?'<details><summary>Hint</summary><p>'+esc(q.hint)+'</p></details>':'')+'<div class="actions"><button class="check" data-q="'+q.id+'" data-prefix="'+prefix+'">Check reasoning</button><button class="quiet save" data-q="'+q.id+'">'+(state.learning.questions[q.id]?.saved?'Unsave':'Save for review')+'</button></div><div class="explanation" id="'+prefix+'ex-'+q.id+'" hidden aria-live="polite"></div><p class="source"><strong>Grounding:</strong> '+esc(q.source)+'</p></div>';}
function moduleCard(m){return '<article class="module" id="module-'+m.number+'"><button class="toggle" aria-expanded="false"><span><span class="pill">'+m.unit+'</span> Module '+m.number+': '+esc(m.title)+' · 8 questions · guided lab</span><span aria-hidden="true">＋</span></button><div class="module-content" hidden><h3>Learning objectives</h3><ul>'+m.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p><strong>Read:</strong> <button class="secondary reading" data-url="'+esc(m.readingUrl)+'">'+esc(m.reading)+'</button></p>'+m.lesson.map(x=>'<p>'+esc(x)+'</p>').join('')+'<div class="notice"><strong>Hands-on:</strong> '+esc(m.handsOn)+'<br><strong>Evidence artifact:</strong> '+esc(m.artifact)+'<br><button class="create-lab secondary" data-module-number="'+m.number+'">Create this guided starter</button></div><details><summary>Source basis</summary><p>'+esc(m.sourceBasis)+'</p></details><h3>Eight readiness questions</h3>'+m.questions.map(q=>questionHtml(q,'module-')).join('')+'<div class="status-row"><label for="status-'+m.id+'"><strong>My local status:</strong></label><select id="status-'+m.id+'" data-module="'+m.id+'"><option value="not-started">Not started</option><option value="preparing">Preparing</option><option value="practicing">Practicing</option><option value="confident">Confident — self-assessed</option></select><label for="confidence-'+m.id+'">Confidence 1–5:</label><input id="confidence-'+m.id+'" data-confidence="'+m.id+'" type="number" min="1" max="5" value="'+esc(state.confidence[m.id]||'')+'"></div></div></article>';}
function renderModules(){const el=document.getElementById('modules');el.innerHTML='<p class="eyebrow">Prepare → explain → practice → build → reflect</p><h1>Thirteen learning modules</h1><div class="notice"><strong>104 explained questions:</strong> eight per module, mapped to an OSTEP chapter, packaged lecture source, or verified historical course basis. These are formative—not Canvas quizzes.</div><div class="module-list">'+DATA.modules.map(moduleCard).join('')+'</div>';el.querySelectorAll('select[data-module]').forEach(s=>s.value=state.moduleStatus[s.dataset.module]||'not-started');el.onchange=e=>{if(e.target.dataset.module)state.moduleStatus[e.target.dataset.module]=e.target.value;if(e.target.dataset.confidence)state.confidence[e.target.dataset.confidence]=e.target.value;persist();renderProgress()};el.onclick=e=>{const toggle=e.target.closest('.toggle');if(toggle){const content=toggle.nextElementSibling,open=content.hidden;content.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.lastElementChild.textContent=open?'−':'＋';return}const read=e.target.closest('.reading');if(read){external(read.dataset.url);return}const lab=e.target.closest('.create-lab');if(lab){vscode.postMessage({type:'createModuleLab',moduleNumber:Number(lab.dataset.moduleNumber)});return}handleQuestionClick(e,el)};}
function handleQuestionClick(e,root){const save=e.target.closest('.save');if(save){vscode.postMessage({type:'toggleSave',questionId:save.dataset.q,learning:state.learning});return}const check=e.target.closest('.check');if(!check)return;const id=check.dataset.q,prefix=check.dataset.prefix||'',chosen=root.querySelector('input[name="'+prefix+id+'"]:checked'),out=document.getElementById(prefix+'ex-'+id);if(!chosen){out.hidden=false;out.textContent='Choose an answer before requesting feedback.';return}check.disabled=true;vscode.postMessage({type:'practiceAnswer',questionId:id,selectedIndex:Number(chosen.value),confidence:root.querySelector('[data-confidence-q="'+id+'"]')?.value||'medium',learning:state.learning});}
function requestPractice(){const focus=document.getElementById('practice-focus')?.value||'recommended',moduleNumber=Number(document.getElementById('practice-module')?.value||0);vscode.postMessage({type:'practiceSelect',focus,moduleNumber,learning:state.learning});}
function renderPractice(){const el=document.getElementById('practice');const moduleOptions='<option value="0">All modules</option>'+DATA.modules.map(m=>'<option value="'+m.number+'">'+m.number+'. '+esc(m.title)+'</option>').join('');el.innerHTML='<p class="eyebrow">Short retrieval · explanation · spaced review</p><h1>Five-question practice</h1><div class="notice"><strong>Local formative practice only.</strong> Attempts, confidence, saves, and review dates remain on this device; they are not grades or mastery claims.</div><div class="practice-controls"><label>Focus <select id="practice-focus"><option value="recommended">Recommended</option><option value="due">Due now</option><option value="saved">Saved</option><option value="all">All</option></select></label><label>Topic <select id="practice-module">'+moduleOptions+'</select></label><button id="practice-start">Build five-question set</button></div><div id="practice-set">'+(practiceQuestions.length?practiceQuestions.map(q=>'<article class="card">'+questionHtml(q,'practice-').replace('<div class="actions">','<label>Confidence <select data-confidence-q="'+q.id+'"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></label><div class="actions">')+'</article>').join(''):'<p class="muted">Choose a focus and start a five-question session. A due or saved filter may return fewer than five.</p>')+'</div><h2>Per-topic analytics</h2><div id="analytics">'+analyticsTable()+'</div>';el.querySelector('#practice-start').onclick=requestPractice;el.onclick=e=>handleQuestionClick(e,el);}
function analyticsTable(){return analytics.length?'<table class="analytics"><thead><tr><th>Module</th><th>Attempted</th><th>Accuracy</th><th>Due</th><th>Saved</th><th>Confident misses</th></tr></thead><tbody>'+analytics.map(a=>'<tr><td>'+a.moduleNumber+'. '+esc(a.title)+'</td><td>'+a.attemptedQuestions+'/'+a.totalQuestions+'</td><td>'+(a.accuracy===undefined?'—':a.accuracy.toFixed(0)+'%')+'</td><td>'+a.due+'</td><td>'+a.saved+'</td><td>'+a.confidentMisses+'</td></tr>').join('')+'</tbody></table>':'<p class="muted">Analytics appear after the first practice set is prepared.</p>';}
function renderLabs(){const el=document.getElementById('labs');el.innerHTML='<p class="eyebrow">Predict → run → capture → explain</p><h1>Guided OS labs</h1><div class="notice"><strong>Formative starters, not assignment solutions.</strong> Every starter is tied to a module and source. Create it in a new folder; nothing is overwritten. Use current Canvas instructions for assessed work and xv6.</div><div class="module-list">'+DATA.labs.map(lab=>{const done=new Set(state.labSteps[lab.id]||[]);return '<article class="card"><p class="pill">Module '+lab.moduleNumber+'</p><h2>'+esc(lab.title)+'</h2><p>'+esc(lab.purpose)+'</p><p class="source"><strong>Grounding:</strong> '+esc(lab.source)+'</p><div class="checklist">'+lab.steps.map((s,i)=>'<label><input type="checkbox" data-lab="'+lab.id+'" data-step="'+s.id+'" '+(done.has(s.id)?'checked':'')+'><span><strong>'+(i+1)+'. '+esc(s.instruction)+'</strong><br>Evidence: '+esc(s.evidence)+'</span></label>').join('')+'</div><p><strong>Run:</strong> <code>'+esc(lab.runCommand)+'</code></p><p><strong>Reflect:</strong> '+esc(lab.reflection)+'</p><button class="create-lab" data-module-number="'+lab.moduleNumber+'">Create this starter safely</button></article>'}).join('')+'</div>';el.onchange=e=>{if(e.target.dataset.lab){const values=new Set(state.labSteps[e.target.dataset.lab]||[]);e.target.checked?values.add(e.target.dataset.step):values.delete(e.target.dataset.step);state.labSteps[e.target.dataset.lab]=[...values];persist();renderProgress()}};el.onclick=e=>{const b=e.target.closest('.create-lab');if(b)vscode.postMessage({type:'createModuleLab',moduleNumber:Number(b.dataset.moduleNumber)})};}
function courseworkState(id){return state.coursework[id]||{status:'not-started',evidence:[]};}
function renderCoursework(){const el=document.getElementById('coursework');el.innerHTML='<p class="eyebrow">Mission control · 3 homework · 4 programming components</p><h1>Coursework planning and evidence</h1><div class="notice warning"><strong>Not an assignment sheet or gradebook.</strong> Fall 2026 wording, files, tests, dates, teams, AI rules, and submission requirements come only from Canvas.</div><div class="actions"><button data-command="systemstudioOs.openCanvas">Open Canvas</button><button id="import-ics" class="secondary">Review Canvas calendar file</button></div><div id="ics-review"></div><div class="module-list">'+DATA.coursework.map((x,i)=>{const p=courseworkState(x.id),evidence=new Set(p.evidence||[]);return '<article class="card"><p class="pill">'+x.kind+'</p><h2>'+(i+1)+'. '+esc(x.title)+'</h2><p>'+esc(x.focus)+'</p><p><strong>Mapped modules:</strong> '+x.modules.join(', ')+'</p><label>Status — local planning only <select data-course-status="'+x.id+'"><option value="not-started">Not started</option><option value="planning">Planning</option><option value="working">Working</option><option value="ready-to-submit">Ready to compare with Canvas</option><option value="submitted">Submitted — self-reported</option><option value="receipt-confirmed">Canvas receipt confirmed — self-reported</option></select></label><h3>Evidence checklist</h3><div class="checklist">'+x.evidence.map((y,j)=>'<label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-e'+j+'" '+(evidence.has(x.id+'-e'+j)?'checked':'')+'><span>'+esc(y)+'</span></label>').join('')+'<label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-canvas"><span>I opened the current Canvas assignment and checked requirements, due date, allowed help/AI, files, and submission route.</span></label><label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-receipt"><span>I submitted in Canvas and reopened the receipt/files; a local folder is not a submission.</span></label></div><div class="actions"><button class="validate-evidence secondary" data-item="'+x.id+'">Validate selected local files</button><button data-command="systemstudioOs.openCanvas" class="quiet">Open official Canvas record</button></div><div id="validation-'+x.id+'" aria-live="polite"></div></article>'}).join('')+'</div><h2>Reviewed Canvas reminders</h2><div id="saved-events">'+eventsHtml(state.canvasEvents)+'</div>';el.querySelectorAll('[data-course-status]').forEach(s=>s.value=courseworkState(s.dataset.courseStatus).status);el.onchange=e=>{if(e.target.dataset.courseStatus){const p=courseworkState(e.target.dataset.courseStatus);state.coursework[e.target.dataset.courseStatus]={...p,status:e.target.value};persist();renderProgress()}if(e.target.dataset.courseEvidence){const p=courseworkState(e.target.dataset.courseEvidence),set=new Set(p.evidence||[]);e.target.checked?set.add(e.target.value):set.delete(e.target.value);state.coursework[e.target.dataset.courseEvidence]={...p,evidence:[...set]};persist()}};el.onclick=e=>{if(e.target.id==='import-ics'){vscode.postMessage({type:'importIcs'});return}const validate=e.target.closest('.validate-evidence');if(validate){vscode.postMessage({type:'validateEvidence',itemId:validate.dataset.item});return}const open=e.target.closest('[data-event-url]');if(open)external(open.dataset.eventUrl)};bindCommands(el);renderIcsReview();}
function eventsHtml(events){return events.length?'<div class="card"><p><strong>'+events.length+' reviewed local reminder(s).</strong> These do not replace Canvas.</p>'+events.slice(0,50).map(e=>'<p><strong>'+esc(e.title)+'</strong><br>'+esc(e.allDay?e.startsAt:new Date(e.startsAt).toLocaleString())+(e.url?'<br><button class="quiet" data-event-url="'+esc(e.url)+'">Open Canvas item</button>':'')+'</p>').join('')+'</div>':'<p class="muted">No Canvas calendar events have been reviewed and kept locally.</p>';}
function renderIcsReview(){const root=document.getElementById('ics-review');if(!root)return;root.innerHTML=icsPreview.length?'<div class="card notice warning"><h2>Review before keeping</h2><p>This calendar may contain unrelated courses. Check every title/date and use Canvas as the authority. Unsafe/non-Canvas URLs were removed.</p>'+eventsHtml(icsPreview)+'<div class="actions"><button id="keep-ics">Keep this reviewed list locally</button><button id="discard-ics" class="secondary">Discard preview</button></div></div>':'';root.querySelector('#keep-ics')?.addEventListener('click',()=>{state.canvasEvents=icsPreview.slice(0,500);icsPreview=[];persist();renderCoursework()});root.querySelector('#discard-ics')?.addEventListener('click',()=>{icsPreview=[];renderIcsReview()});}
function renderGradeBlock(){const labels={participation:'Participation / Canvas quizzes (10%)',homework:'Homework category (15%)',programming:'Programming category (40%)',midterm:'Midterm exam (15%)',finalExam:'Final exam (20%)'};return '<details><summary><strong>Optional historical-weight grade planning estimate</strong></summary><div class="notice warning"><strong>Not an official grade or confirmed Fall 2026 policy.</strong> These weights repeat the verified Winter 2026 syllabus only. Enter Canvas category percentages manually; no drop rule is applied.</div><div class="grade-grid">'+Object.keys(labels).map(k=>'<label for="g-'+k+'">'+labels[k]+'</label><input id="g-'+k+'" data-grade="'+k+'" type="number" min="0" max="100" step="0.01" value="'+esc(state.grade[k])+'">').join('')+'</div><p><button id="calc">Calculate planning estimate</button></p><div id="grade-result" aria-live="polite"></div></details>';}
function renderProgress(){const values={"not-started":0,preparing:1,practicing:2,confident:3};let pts=0;DATA.modules.forEach(m=>pts+=values[state.moduleStatus[m.id]||'not-started']);const percent=Math.round(pts/(DATA.modules.length*3)*100),attempts=state.learning.attempts||[],correct=attempts.filter(x=>x.correct).length,labDone=Object.values(state.labSteps).reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0),courseReady=DATA.coursework.filter(x=>['ready-to-submit','submitted','receipt-confirmed'].includes(courseworkState(x.id).status)).length;const rows=DATA.modules.map(m=>{const a=analytics.find(x=>x.moduleNumber===m.number);return '<tr><td>'+m.number+'. '+esc(m.title)+'</td><td>'+esc((state.moduleStatus[m.id]||'not-started').replaceAll('-',' '))+'</td><td>'+(state.confidence[m.id]||'—')+'</td><td>'+(a?.attemptedQuestions||0)+'/8</td><td>'+(a?.due||0)+'</td></tr>'}).join('');const el=document.getElementById('progress');el.innerHTML='<p class="eyebrow">Private · local · self-evaluation</p><h1>My learning progress</h1><div class="grid"><div class="card"><p class="result">'+percent+'%</p><p>Self-reported module pathway</p><progress max="100" value="'+percent+'">'+percent+'%</progress></div><div class="card"><p class="result">'+attempts.length+'</p><p>Practice attempts · '+(attempts.length?Math.round(correct/attempts.length*100)+'% observed accuracy':'no accuracy yet')+'</p></div><div class="card"><p class="result">'+labDone+'</p><p>Guided-lab evidence steps checked</p></div><div class="card"><p class="result">'+courseReady+'/'+DATA.coursework.length+'</p><p>Coursework items locally marked ready or later</p></div></div><div class="notice"><strong>These indicators are not grades or instructor evaluations.</strong> They stay in this VS Code webview state and are not sent to Canvas. Official assessment and feedback are recorded in Canvas.</div><table><thead><tr><th>Module</th><th>Local status</th><th>Confidence</th><th>Questions tried</th><th>Due</th></tr></thead><tbody>'+rows+'</tbody></table><h2>Practice analytics</h2>'+analyticsTable()+renderGradeBlock()+'<p><button id="reset-local" class="secondary">Reset all local learning data</button></p>';el.onchange=e=>{if(e.target.dataset.grade){state.grade[e.target.dataset.grade]=e.target.value;persist()}};el.querySelector('#calc').onclick=calculateGrade;el.querySelector('#reset-local').onclick=()=>{if(confirm('Reset local module status, confidence, practice history, saved/review questions, lab checkmarks, coursework planning, reviewed calendar events, and grade inputs? Canvas is not affected.')){const keepSection=state.section;state=Object.assign({},defaults,{section:keepSection,walkthroughOpen:false});practiceQuestions=[];analytics=[];icsPreview=[];persist();renderAll();show('progress');requestPractice()}};}
function calculateGrade(){const k=['participation','homework','programming','midterm','finalExam'],w=[.10,.15,.40,.15,.20],v=k.map(x=>Number(state.grade[x])),out=document.getElementById('grade-result');if(v.some(x=>!Number.isFinite(x)||x<0||x>100)||k.some(x=>state.grade[x]==='')){out.textContent='Enter every category percentage from 0 through 100.';return}const p=v.reduce((s,x,i)=>s+x*w[i],0),cut=[[96.67,'A+'],[93.34,'A'],[90,'A−'],[86.67,'B+'],[83.34,'B'],[80,'B−'],[76.67,'C+'],[73.34,'C'],[70,'C−'],[66.67,'D+'],[63.34,'D'],[60,'D−'],[0,'E']],letter=cut.find(x=>p>=x[0])[1];out.innerHTML='<p class="result">Historical-policy planning estimate: '+p.toFixed(2)+'% ('+letter+')</p><p>Confirm the Fall 2026 policy and official total in Canvas.</p>';}
function renderHelp(){const el=document.getElementById('help');el.innerHTML='<p class="eyebrow">Structured FAQ · offline coach · student-controlled Canvas handoff</p><h1>Questions and help</h1><section class="card"><h2>Ask the offline OS learning helper</h2><p>It maps your question to course content and refuses submission-ready assessed work. It has no LLM or AI-service account and sends no question off this machine.</p><label for="question"><strong>Your question</strong></label><textarea id="question" placeholder="State the concept, prediction, evidence, and smallest mismatch."></textarea><div class="actions"><button id="ask">Ask helper</button><button class="quick" data-question="Can you give me the answer to homework 2?">Test the integrity boundary</button></div><div id="tutor-result" class="card" hidden aria-live="polite"></div></section><section><h2>Frequently asked questions</h2>'+DATA.faqs.map(f=>'<details><summary>'+esc(f.question)+'</summary><p>'+esc(f.answer)+'</p></details>').join('')+'</section><section class="card"><h2>Ask before class through Canvas</h2><p>The extension prepares and copies a draft; it does not post, impersonate you, send email, or promise anonymity. You review the course, recipient, visibility, and content in Canvas.</p><label>Topic<input id="pre-topic" maxlength="160"></label><label>Focused question<textarea id="pre-question" maxlength="2000"></textarea></label><label>What I understand so far<textarea id="pre-understanding" maxlength="2000"></textarea></label><label>What I tried or checked<textarea id="pre-attempted" maxlength="2000"></textarea></label><fieldset><legend>Canvas route</legend><label><input type="radio" name="pre-route" value="discussion" checked> Configured discussion</label><label><input type="radio" name="pre-route" value="private-message"> Configured private message/Inbox route</label></fieldset><label><input id="pre-anon" type="checkbox"> I would prefer anonymity if Canvas explicitly offers it</label><p class="muted">Checking this box does not make the post anonymous. Confirm the actual Canvas control before posting.</p><div class="actions"><button id="compose">Copy draft and open Canvas</button><button data-command="systemstudioOs.configureCanvas" class="secondary">Configure routes</button></div></section><div class="notice"><strong>Academic-integrity boundary:</strong> Ask for concept explanations, one hint, an analogous example, error interpretation, or feedback on your own reasoning. Do not request or submit generated answers, code, calculations, traces, or prose as your own. The current Canvas rules control each assessed task.</div>';el.querySelector('#ask').onclick=()=>vscode.postMessage({type:'tutor',question:el.querySelector('#question').value});el.querySelector('.quick').onclick=e=>{el.querySelector('#question').value=e.target.dataset.question;el.querySelector('#ask').click()};el.querySelector('#compose').onclick=()=>vscode.postMessage({type:'composePreClass',draft:{topic:el.querySelector('#pre-topic').value,question:el.querySelector('#pre-question').value,understanding:el.querySelector('#pre-understanding').value,attempted:el.querySelector('#pre-attempted').value,route:el.querySelector('input[name="pre-route"]:checked').value,anonymityRequested:el.querySelector('#pre-anon').checked}});bindCommands(el);}
function renderWalkthrough(){const root=document.getElementById('walkthrough');root.hidden=!state.walkthroughOpen;if(root.hidden)return;const index=Math.max(0,Math.min(DATA.walkthrough.length-1,Number(state.walkthroughStep)||0)),step=DATA.walkthrough[index];document.getElementById('walk-title').textContent=step.title;document.getElementById('walk-detail').textContent=step.detail;document.getElementById('walk-count').textContent='Step '+(index+1)+' of '+DATA.walkthrough.length;document.getElementById('walk-dots').innerHTML=DATA.walkthrough.map((_,i)=>'<span class="dot '+(i===index?'current':'')+'" aria-label="Step '+(i+1)+(i===index?', current':'')+'"></span>').join('');document.getElementById('walk-prev').disabled=index===0;document.getElementById('walk-next').textContent=index===DATA.walkthrough.length-1?'Finish':'Next';document.getElementById('walk-prev').onclick=()=>{state.walkthroughStep=index-1;persist();renderWalkthrough()};document.getElementById('walk-next').onclick=()=>{if(index===DATA.walkthrough.length-1){state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'completed'})}else{state.walkthroughStep=index+1;persist()}renderWalkthrough()};document.getElementById('walk-skip').onclick=()=>{state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'skipped'});renderWalkthrough()};document.getElementById('walk-title').focus?.();}
let walkthroughReturnFocus=null,noticeReturnFocus=null;
function showNotice(text){noticeReturnFocus=document.activeElement;document.getElementById('global-notice-text').textContent=text;document.getElementById('global-notice').hidden=false;document.getElementById('global-notice-close').focus()}
document.getElementById('global-notice-close').onclick=()=>{document.getElementById('global-notice').hidden=true;noticeReturnFocus?.focus?.()};
window.addEventListener('message',e=>{const m=e.data;if(m.type==='tutorReply'){const r=m.reply,out=document.getElementById('tutor-result');out.hidden=false;out.innerHTML='<p class="pill">'+esc(r.mode)+'</p><h2>'+esc(r.title)+'</h2><p>'+esc(r.response)+'</p><ol>'+r.prompts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';if(r.moduleNumber)out.innerHTML+='<button id="open-map">Open Module '+r.moduleNumber+'</button>';out.querySelector('#open-map')?.addEventListener('click',()=>openModule(r.moduleNumber))}if(m.type==='selectModule')openModule(m.number);if(m.type==='practiceSet'){practiceQuestions=m.questions;state.learning=m.learning;analytics=m.analytics;persist();renderPractice();renderProgress()}if(m.type==='practiceResult'){state.learning=m.state;analytics=m.analytics;persist();const q=DATA.modules.flatMap(x=>x.questions).find(x=>x.id===m.questionId);['module-','practice-'].forEach(prefix=>{const out=document.getElementById(prefix+'ex-'+m.questionId);if(out&&q){out.hidden=false;out.innerHTML=(m.correct?'<strong>Correct.</strong> ':'<strong>Not yet.</strong> ')+esc(q.explanation)+'<br><strong>Next review:</strong> '+new Date(m.nextReviewAt).toLocaleString()+'<br><strong>Source:</strong> '+esc(q.source)}});document.querySelectorAll('[data-q="'+m.questionId+'"].check').forEach(b=>b.disabled=false);renderProgress()}if(m.type==='learningState'){state.learning=m.learning;analytics=m.analytics;persist();renderModules();renderPractice();renderProgress()}if(m.type==='icsPreview'){icsPreview=m.events;show('coursework');renderCoursework()}if(m.type==='evidenceValidation'){const out=document.getElementById('validation-'+m.itemId);if(out)out.innerHTML='<div class="explanation"><strong>Local file check</strong><ul>'+m.result.lines.map(x=>'<li>'+esc(x)+'</li>').join('')+m.result.warnings.map(x=>'<li><strong>Review:</strong> '+esc(x)+'</li>').join('')+'</ul><p>This did not package, upload, submit, or grade any file.</p></div>'}if(m.type==='notice')showNotice(m.message)});
function openModule(n){show('modules');const card=document.getElementById('module-'+n);if(card){const btn=card.querySelector('.toggle'),content=card.querySelector('.module-content');content.hidden=false;btn.setAttribute('aria-expanded','true');btn.lastElementChild.textContent='−';card.scrollIntoView({behavior:'smooth',block:'start'});btn.focus()}}
function applyA11y(){const title=document.getElementById('walk-title'),walk=document.getElementById('walkthrough');title.tabIndex=-1;if(!walk.hidden&&!walk.contains(document.activeElement))title.focus();document.querySelectorAll('progress:not([aria-label])').forEach(p=>p.setAttribute('aria-label','Self-reported module learning pathway progress'));document.querySelectorAll('[data-course-status]').forEach(s=>{const item=DATA.coursework.find(x=>x.id===s.dataset.courseStatus);if(item)s.setAttribute('aria-label','Local planning status for '+item.title)})}
function modalKeys(event){const walk=document.getElementById('walkthrough');if(walk.hidden)return;if(event.key==='Escape'){event.preventDefault();state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'skipped'});renderWalkthrough();walkthroughReturnFocus?.focus?.();return}if(event.key!=='Tab')return;const controls=[...walk.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
document.addEventListener('keydown',modalKeys);document.addEventListener('click',event=>{if(event.target.closest('#rerun-walk'))walkthroughReturnFocus=event.target.closest('button');if(event.target.closest('#walk-next,#walk-skip'))queueMicrotask(()=>{if(document.getElementById('walkthrough').hidden)walkthroughReturnFocus?.focus?.()})});
function renderAll(){renderHome();renderModules();renderPractice();renderLabs();renderCoursework();renderProgress();renderHelp();renderWalkthrough();applyA11y()}
new MutationObserver(applyA11y).observe(document.getElementById('main'),{childList:true,subtree:true});renderAll();show(state.section||'home');requestPractice();
</script></body></html>`;
}
