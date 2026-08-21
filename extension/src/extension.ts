import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { COURSE, COURSEWORK, MODULES, SOURCE_BOUNDARIES } from './courseData.js';
import { buildCalendar, fall2026Schedule, tutorReply } from './core.js';
import { FAQS, MAX_ICS_BYTES, WALKTHROUGH_STEPS, formatPreClassQuestion, normalizeLearningState, parseCanvasIcs, practiceAnalytics, recordPracticeAnswer, safeCanvasUrl, selectPracticeQuestions, toggleSavedQuestion, validateEvidenceFiles } from './learning.js';
import { GUIDED_LABS, guidedLab } from './labs.js';
import { PORTABLE_COURSEWORK_IDS, PORTABLE_COURSEWORK_LABELS, labFiles, parseCourseworkWorkspaceManifest, workspaceFiles, type PortableCourseworkId } from './workspace.js';
import { XV6_BASELINE_TAG, XV6_COMMIT, XV6_REMOTE, applyXv6Compatibility, parseXv6Manifest, xv6WorkspaceFiles } from './xv6.js';
import { OSTEP_HOMEWORK_COMMIT, OSTEP_HOMEWORK_PAGE, OSTEP_HOMEWORK_REMOTE, OSTEP_SIMULATORS, ostepSimulator, ostepSimulatorWorkspaceFiles, parseOstepSimulatorManifest, simulatorArguments, type OstepSimulatorMode } from './ostepSimulators.js';

const execFileAsync = promisify(execFile);
let hub: LearningHub | undefined;

export interface SystemStudioExtensionApi {
  integrationStatus(): {
    courseTitle: string;
    moduleCount: number;
    courseworkCount: number;
    learningHubOpen: boolean;
  };
}

export function activate(context: vscode.ExtensionContext): SystemStudioExtensionApi {
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
    vscode.commands.registerCommand('systemstudioOs.runCourseworkPreflight', (itemId?: string) => runCourseworkPreflight(itemId)),
    vscode.commands.registerCommand('systemstudioOs.openPortableSetup', openPortableSetup),
    vscode.commands.registerCommand('systemstudioOs.reopenInCourseContainer', reopenInCourseContainer),
    vscode.commands.registerCommand('systemstudioOs.runCurrentC', runCurrentC),
    vscode.commands.registerCommand('systemstudioOs.exportCalendar', exportCalendar),
    vscode.commands.registerCommand('systemstudioOs.configureCanvas', configureCanvasLinks),
    vscode.commands.registerCommand('systemstudioOs.importCanvasCalendar', () => importCanvasCalendar()),
    vscode.commands.registerCommand('systemstudioOs.createModuleLab', (moduleNumber?: number) => createModuleLab(moduleNumber)),
    vscode.commands.registerCommand('systemstudioOs.validateEvidence', (itemId?: string) => validateCourseworkEvidence(itemId)),
    vscode.commands.registerCommand('systemstudioOs.prepareXv6', prepareXv6Workspace),
    vscode.commands.registerCommand('systemstudioOs.verifyXv6', (mode?: string) => verifyXv6Workspace(mode)),
    vscode.commands.registerCommand('systemstudioOs.openXv6Guide', openXv6Guide),
    vscode.commands.registerCommand('systemstudioOs.prepareOstepSimulators', () => prepareOstepSimulatorWorkspace(context)),
    vscode.commands.registerCommand('systemstudioOs.runOstepSimulator', (id?: string, mode?: string) => runOstepSimulator(context, id, mode)),
    vscode.commands.registerCommand('systemstudioOs.openOstepSimulatorGuide', () => openOstepSimulatorGuide(context))
  );
  return {
    integrationStatus: () => ({
      courseTitle: COURSE.title,
      moduleCount: MODULES.length,
      courseworkCount: COURSEWORK.length,
      learningHubOpen: hub !== undefined
    })
  };
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
        action('Check cross-platform course environment', 'systemstudioOs.checkEnvironment', 'action', 'Windows · macOS · Linux diagnostics'),
        action('Create portable OS coursework workspace', 'systemstudioOs.createLabWorkspace', 'action', 'Docker · C/pthreads · Python · GDB · QEMU'),
        action('Run portable coursework preflight', 'systemstudioOs.runCourseworkPreflight', 'action', 'HW1 · HW2 · HW3 · PA3 · all'),
        action('Reopen in course Dev Container', 'systemstudioOs.reopenInCourseContainer', 'action', 'optional integrated compiler/debugger'),
        action('Open cross-platform setup guide', 'systemstudioOs.openPortableSetup', 'action', 'official install routes · honest prerequisites'),
        action('Create a guided module lab', 'systemstudioOs.createModuleLab', 'action', '13 source-mapped starters'),
        action('Prepare official OSTEP simulators', 'systemstudioOs.prepareOstepSimulators', 'action', '15 chapter-mapped prediction tools · pinned source'),
        action('Run an official OSTEP simulator', 'systemstudioOs.runOstepSimulator', 'action', 'predict first · reveal after recording work'),
        action('Open OSTEP simulator guide', 'systemstudioOs.openOstepSimulatorGuide', 'action', 'official source · exact commands · boundaries'),
        action('Build and run current C file', 'systemstudioOs.runCurrentC', 'action', 'inside the course container'),
        action('Prepare pinned xv6 reference workspace', 'systemstudioOs.prepareXv6', 'action', 'official MIT x86 source · exact verified commit'),
        action('Run xv6 assignment preflight', 'systemstudioOs.verifyXv6', 'action', 'PA1A · PA1B · PA2 behavioral checks'),
        action('Open xv6 workspace guide', 'systemstudioOs.openXv6Guide', 'action', 'setup · tests · Canvas boundary')
      ];
    }
    if (element.kind === 'support') {
      return [
        action(`${COURSE.meeting} · ${COURSE.room}`, 'systemstudioOs.openLearningHub', 'info', 'verified Fall 2026 schedule'),
        action(`Instructor: ${COURSE.instructor}`, 'systemstudioOs.openLearningHub', 'info', COURSE.instructorOffice),
        action(COURSE.gsiStatus, 'systemstudioOs.openLearningHub', 'info', 'current course staffing status'),
        action('Open dated OSTEP course plan', 'systemstudioOs.openLearningHub', 'action', '27 meetings · exact chapter map'),
        action('Export Fall 2026 calendar', 'systemstudioOs.exportCalendar', 'action', '27 meetings · planned topics and readings'),
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
          const allowed = new Set(['systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.checkEnvironment', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.runCourseworkPreflight', 'systemstudioOs.openPortableSetup', 'systemstudioOs.reopenInCourseContainer', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar', 'systemstudioOs.configureCanvas', 'systemstudioOs.importCanvasCalendar', 'systemstudioOs.prepareXv6', 'systemstudioOs.verifyXv6', 'systemstudioOs.openXv6Guide', 'systemstudioOs.prepareOstepSimulators', 'systemstudioOs.openOstepSimulatorGuide']);
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
        } else if (message.type === 'verifyXv6') {
          await verifyXv6Workspace(typeof message.mode === 'string' ? message.mode : undefined);
        } else if (message.type === 'runCourseworkPreflight') {
          await runCourseworkPreflight(typeof message.itemId === 'string' ? message.itemId : undefined);
        } else if (message.type === 'runOstepSimulator') {
          const result = await runOstepSimulator(this.context, typeof message.id === 'string' ? message.id : undefined, typeof message.mode === 'string' ? message.mode : undefined);
          if (result) void this.panel?.webview.postMessage({ type: 'simulationResult', ...result });
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
    { label: 'Course home', description: 'Verified Fall 2026 course 552201; change only if Canvas moves the course', key: 'canvasCourseUrl' },
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

function simulatorMode(value: unknown): OstepSimulatorMode | undefined {
  return value === 'practice' || value === 'reveal' ? value : undefined;
}

async function prepareOstepSimulatorWorkspace(context: vscode.ExtensionContext): Promise<void> {
  const consent = await vscode.window.showWarningMessage(
    `This downloads the official OSTEP homework repository and checks out the exact release-tested commit ${OSTEP_HOMEWORK_COMMIT.slice(0, 12)}. The upstream source is not bundled or modified. Docker or an existing Python 3 installation runs the simulators; current Canvas rules remain authoritative.`,
    { modal: true },
    'Choose parent folder'
  );
  if (consent !== 'Choose parent folder') return;
  const selected = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Create OSTEP simulator workspace here' });
  if (!selected?.[0]) return;
  const root = vscode.Uri.joinPath(selected[0], 'cis450-ostep-simulators');
  try {
    await vscode.workspace.fs.stat(root);
    void vscode.window.showWarningMessage(`Nothing was overwritten: ${root.fsPath} already exists.`);
    return;
  } catch {}

  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 OSTEP Simulators');
  output.clear();
  output.appendLine(`Official source: ${OSTEP_HOMEWORK_REMOTE}`);
  output.appendLine(`Pinned commit: ${OSTEP_HOMEWORK_COMMIT}`);
  output.appendLine('The extension adds only a local guide/container wrapper outside the unmodified official checkout.');
  output.show(true);
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Preparing official OSTEP simulators', cancellable: false }, async (progress) => {
      await vscode.workspace.fs.createDirectory(root);
      const official = vscode.Uri.joinPath(root, 'official');
      progress.report({ message: 'Cloning official simulator source…' });
      await execFileAsync('git', ['clone', '--quiet', '--no-checkout', OSTEP_HOMEWORK_REMOTE, official.fsPath], { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
      await execFileAsync('git', ['checkout', '--quiet', '--detach', OSTEP_HOMEWORK_COMMIT], { cwd: official.fsPath, timeout: 30_000 });
      const resolved = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: official.fsPath, timeout: 10_000 })).stdout.trim();
      if (resolved !== OSTEP_HOMEWORK_COMMIT) throw new Error(`Pinned revision verification failed: expected ${OSTEP_HOMEWORK_COMMIT}, received ${resolved || 'no revision'}.`);
      progress.report({ message: 'Adding transparent local launch wrapper…' });
      for (const [relative, contents] of Object.entries(ostepSimulatorWorkspaceFiles())) {
        const parts = relative.split('/');
        if (parts.length > 1) await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, ...parts.slice(0, -1)));
        await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(root, ...parts), Buffer.from(contents, 'utf8'));
      }
      await context.globalState.update('ostepSimulatorWorkspace', root.fsPath);
    });
    output.appendLine(`READY: ${root.fsPath}`);
    output.appendLine('Next: read README.md, run a prediction problem without -c, record your work, then reveal/explain.');
    const choice = await vscode.window.showInformationMessage('The pinned official OSTEP simulator workspace is ready.', 'Open workspace', 'Run a simulator');
    if (choice === 'Open workspace') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
    if (choice === 'Run a simulator') await runOstepSimulator(context);
  } catch (error) {
    output.appendLine(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
    output.appendLine(`A partial directory may remain at ${root.fsPath}; it was not deleted automatically.`);
    void vscode.window.showErrorMessage('OSTEP simulator setup did not complete. Review the simulator output; no existing folder was overwritten or deleted.');
  }
}

async function validateOstepSimulatorRoot(root: vscode.Uri): Promise<boolean> {
  try {
    const raw = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, '.systemstudio', 'ostep-homework.json'))).toString('utf8');
    if (!parseOstepSimulatorManifest(JSON.parse(raw))) return false;
    const resolved = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: vscode.Uri.joinPath(root, 'official').fsPath, timeout: 10_000 })).stdout.trim();
    return resolved === OSTEP_HOMEWORK_COMMIT;
  } catch {
    return false;
  }
}

async function findOstepSimulatorWorkspace(context: vscode.ExtensionContext): Promise<vscode.Uri | undefined> {
  const candidates: vscode.Uri[] = [];
  const remembered = context.globalState.get<string>('ostepSimulatorWorkspace');
  if (remembered) candidates.push(vscode.Uri.file(remembered));
  for (const folder of vscode.workspace.workspaceFolders ?? []) candidates.push(folder.uri);
  for (const candidate of candidates) if (await validateOstepSimulatorRoot(candidate)) return candidate;
  const choice = await vscode.window.showWarningMessage('Prepare or open the pinned official OSTEP simulator workspace before running a simulation.', 'Prepare workspace');
  if (choice === 'Prepare workspace') await prepareOstepSimulatorWorkspace(context);
  return undefined;
}

async function openOstepSimulatorGuide(context: vscode.ExtensionContext): Promise<void> {
  const root = await findOstepSimulatorWorkspace(context);
  if (!root) return;
  const guide = vscode.Uri.joinPath(root, 'README.md');
  try {
    await vscode.workspace.fs.stat(guide);
    await vscode.commands.executeCommand('markdown.showPreview', guide);
  } catch {
    void vscode.window.showErrorMessage('The OSTEP simulator guide is missing or unreadable. Recreate the workspace in a new folder.');
  }
}

async function runOstepSimulator(context: vscode.ExtensionContext, requestedId?: string, requestedMode?: string): Promise<{ id: string; mode: OstepSimulatorMode; route: 'native' | 'docker' } | undefined> {
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showErrorMessage('Trust the simulator workspace before executing downloaded textbook code. No code was run.');
    return undefined;
  }
  const root = await findOstepSimulatorWorkspace(context);
  if (!root) return undefined;
  let simulator = requestedId ? ostepSimulator(requestedId) : undefined;
  if (!simulator) {
    simulator = (await vscode.window.showQuickPick(OSTEP_SIMULATORS.map((entry) => ({ label: `${entry.chapter} · ${entry.title}`, description: `Module ${entry.moduleNumber} · ${entry.purpose}`, entry })), { title: 'Choose an official OSTEP prediction tool', placeHolder: 'Each preset is chapter-mapped and release-tested' }))?.entry;
  }
  if (!simulator) return undefined;
  let mode = simulatorMode(requestedMode);
  if (!mode) {
    mode = (await vscode.window.showQuickPick([
      { label: 'New prediction problem', description: 'Run without -c; record your prediction before seeing the computed trace', value: 'practice' as const },
      { label: 'Reveal after prediction', description: 'Rerun the same preset with -c and explain the first mismatch', value: 'reveal' as const }
    ], { title: simulator.title, placeHolder: simulator.predict }))?.value;
  }
  if (!mode) return undefined;
  if (mode === 'reveal') {
    const confirmed = await vscode.window.showWarningMessage(`Reveal the computed ${simulator.title} trace only after recording your prediction? Revealed output is formative feedback, not work to submit.`, { modal: true }, 'I recorded my prediction — reveal');
    if (confirmed !== 'I recorded my prediction — reveal') return undefined;
  }

  const [native, compose, engine] = await Promise.all([
    commandVersion('Python 3', 'python3', ['--version']),
    commandVersion('Docker Compose', 'docker', ['compose', 'version']),
    commandVersion('Docker engine', 'docker', ['info', '--format', '{{.ServerVersion}}'])
  ]);
  const routes = [
    ...(compose.ok && engine.ok ? [{ label: 'Portable Python container (recommended)', description: 'Same visible Python 3 recipe on Windows, macOS, and Linux', value: 'docker' as const }] : []),
    ...(native.ok ? [{ label: 'Native Python 3', description: 'Convenience route using the installed interpreter', value: 'native' as const }] : [])
  ];
  if (!routes.length) {
    void vscode.window.showErrorMessage('Neither a running Docker engine nor Python 3 is available. Nothing was run; open the simulator guide for the transparent prerequisites.');
    return undefined;
  }
  const route = routes.length === 1 ? routes[0] : await vscode.window.showQuickPick(routes, { title: `Run ${simulator.title}`, placeHolder: 'Choose the execution environment' });
  if (!route) return undefined;
  const scriptArgs = simulatorArguments(simulator, mode);
  const executable = route.value === 'docker' ? 'docker' : 'python3';
  const simulatorDirectory = vscode.Uri.joinPath(root, 'official', simulator.directory);
  const args = route.value === 'docker'
    ? ['compose', 'run', '--rm', '--workdir', `/workspace/official/${simulator.directory}`, 'simulator', 'python3', ...scriptArgs]
    : scriptArgs;
  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 OSTEP Simulators');
  output.clear();
  output.appendLine(`${simulator.chapter} · ${simulator.title}`);
  output.appendLine(`Mode: ${mode === 'practice' ? 'PREDICT (no -c)' : 'REVEAL AFTER PREDICTION (-c)'}`);
  output.appendLine(`Source: ${OSTEP_HOMEWORK_REMOTE} @ ${OSTEP_HOMEWORK_COMMIT}`);
  output.appendLine(`Before: ${simulator.predict}`);
  output.appendLine(`After: ${simulator.explain}`);
  output.appendLine(`Command: ${executable} ${args.join(' ')}`);
  output.appendLine('');
  output.show(true);
  try {
    const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running ${simulator.title}`, cancellable: false }, () => execFileAsync(executable, args, { cwd: route.value === 'docker' ? root.fsPath : simulatorDirectory.fsPath, timeout: 120_000, maxBuffer: 16 * 1024 * 1024 }));
    output.append(result.stdout);
    output.append(result.stderr);
    output.appendLine('');
    output.appendLine(`COMPLETE: ${simulator.explain}`);
    output.appendLine('Boundary: this local run is not a Canvas submission, grade, or permission to copy a computed trace into assessed work.');
    return { id: simulator.id, mode, route: route.value };
  } catch (error) {
    output.appendLine(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
    output.appendLine('Keep this first error and run the environment check before reinstalling anything.');
    void vscode.window.showErrorMessage('The OSTEP simulator did not complete. Review the simulator output for the first actionable error.');
    return undefined;
  }
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

type Xv6Mode = 'pa1a' | 'pa1b' | 'pa2';

const XV6_MODE_LABELS: Record<Xv6Mode, string> = {
  pa1a: 'PA1A · clean build and interactive boot',
  pa1b: 'PA1B · PCB fields, spin workload, and runtime evidence',
  pa2: 'PA2 · FQ/AQ scheduling behavior plus upstream usertests'
};

function xv6Mode(value: unknown): Xv6Mode | undefined {
  return value === 'pa1a' || value === 'pa1b' || value === 'pa2' ? value : undefined;
}

async function prepareXv6Workspace(): Promise<void> {
  const consent = await vscode.window.showWarningMessage(
    `This downloads the official MIT x86 xv6 source and checks out the exact release-tested commit ${XV6_COMMIT.slice(0, 12)}. It then adds public setup and preflight files, but no assignment solution. Current Fall 2026 Canvas instructions remain authoritative.`,
    { modal: true },
    'Choose parent folder'
  );
  if (consent !== 'Choose parent folder') return;
  const selected = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Create xv6 reference workspace here' });
  if (!selected?.[0]) return;
  const root = vscode.Uri.joinPath(selected[0], 'cis450-xv6-public');
  try {
    await vscode.workspace.fs.stat(root);
    void vscode.window.showWarningMessage(`Nothing was overwritten: ${root.fsPath} already exists.`);
    return;
  } catch {}

  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 xv6 Setup');
  output.clear();
  output.appendLine(`Source: ${XV6_REMOTE}`);
  output.appendLine(`Pinned commit: ${XV6_COMMIT}`);
  output.appendLine('Canvas boundary: this is a release-tested reference workspace, not an active assignment specification.');
  output.show(true);
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Preparing pinned xv6 reference workspace', cancellable: false }, async (progress) => {
      progress.report({ message: 'Cloning official MIT source…' });
      await execFileAsync('git', ['clone', '--no-checkout', XV6_REMOTE, root.fsPath], { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
      await execFileAsync('git', ['checkout', '-b', 'cis450-xv6-work', XV6_COMMIT], { cwd: root.fsPath, timeout: 30_000 });
      const resolved = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root.fsPath, timeout: 10_000 })).stdout.trim();
      if (resolved !== XV6_COMMIT) throw new Error(`Pinned revision verification failed: expected ${XV6_COMMIT}, received ${resolved || 'no revision'}.`);

      progress.report({ message: 'Adding compatibility and behavioral preflight…' });
      const makefileUri = vscode.Uri.joinPath(root, 'Makefile');
      const makefile = Buffer.from(await vscode.workspace.fs.readFile(makefileUri)).toString('utf8');
      await vscode.workspace.fs.writeFile(makefileUri, Buffer.from(applyXv6Compatibility(makefile), 'utf8'));
      for (const [relative, contents] of Object.entries(xv6WorkspaceFiles())) {
        const parts = relative.split('/');
        const target = vscode.Uri.joinPath(root, ...parts);
        if (parts.length > 1) await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, ...parts.slice(0, -1)));
        await vscode.workspace.fs.writeFile(target, Buffer.from(contents, 'utf8'));
      }

      progress.report({ message: 'Recording a solution-free baseline…' });
      await execFileAsync('git', ['config', 'user.name', 'SystemStudio Course Tool'], { cwd: root.fsPath, timeout: 10_000 });
      await execFileAsync('git', ['config', 'user.email', 'systemstudio-local@example.invalid'], { cwd: root.fsPath, timeout: 10_000 });
      await execFileAsync('git', ['add', '--', 'Makefile', '.systemstudio', '.vscode'], { cwd: root.fsPath, timeout: 10_000 });
      await execFileAsync('git', ['commit', '-m', 'chore: add verified SystemStudio xv6 reference tooling'], { cwd: root.fsPath, timeout: 30_000, maxBuffer: 8 * 1024 * 1024 });
      await execFileAsync('git', ['tag', XV6_BASELINE_TAG], { cwd: root.fsPath, timeout: 10_000 });
    });
    output.appendLine(`READY: ${root.fsPath}`);
    output.appendLine(`Baseline tag: ${XV6_BASELINE_TAG}`);
    output.appendLine('Next: open the workspace, read .systemstudio/README.md, compare with Canvas, and run PA1A preflight before changing code.');
    const choice = await vscode.window.showInformationMessage('Pinned xv6 reference workspace is ready. No PA1 or PA2 solution was added.', 'Open workspace');
    if (choice === 'Open workspace') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
  } catch (error) {
    output.appendLine(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
    output.appendLine(`A partial directory may remain at ${root.fsPath}; it was not deleted automatically.`);
    void vscode.window.showErrorMessage('xv6 setup did not complete. Review the xv6 Setup output; no existing folder was overwritten or deleted.');
  }
}

async function findXv6Workspace(): Promise<vscode.Uri | undefined> {
  const matches: vscode.Uri[] = [];
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    try {
      const raw = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.systemstudio', 'manifest.json'))).toString('utf8');
      if (parseXv6Manifest(JSON.parse(raw))) matches.push(folder.uri);
    } catch {}
  }
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    return vscode.window.showQuickPick(matches.map((uri) => ({ label: uri.path.split('/').pop() ?? uri.fsPath, description: uri.fsPath, uri })), { title: 'Choose the pinned xv6 workspace' }).then((picked) => picked?.uri);
  }
  const choice = await vscode.window.showWarningMessage('Open the workspace created by “Prepare Pinned xv6 Reference Workspace” before running or opening its guide.', 'Prepare workspace');
  if (choice === 'Prepare workspace') await prepareXv6Workspace();
  return undefined;
}

async function openXv6Guide(): Promise<void> {
  const root = await findXv6Workspace();
  if (!root) return;
  const guide = vscode.Uri.joinPath(root, '.systemstudio', 'README.md');
  try {
    await vscode.workspace.fs.stat(guide);
    await vscode.commands.executeCommand('markdown.showPreview', guide);
  } catch {
    void vscode.window.showErrorMessage('The pinned xv6 guide is missing or unreadable. Recreate the reference workspace in a new folder.');
  }
}

async function verifyXv6Workspace(requestedMode?: string): Promise<void> {
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showErrorMessage('Trust this xv6 workspace before executing its build and QEMU tests. No code was run.');
    return;
  }
  const root = await findXv6Workspace();
  if (!root) return;
  let mode = xv6Mode(requestedMode);
  if (!mode) {
    const chosen = await vscode.window.showQuickPick((Object.keys(XV6_MODE_LABELS) as Xv6Mode[]).map((value) => ({ label: XV6_MODE_LABELS[value], description: value.toUpperCase(), value })), { title: 'Choose an xv6 behavioral preflight', placeHolder: 'The test builds and executes the current workspace; it does not grade or submit.' });
    mode = chosen?.value;
  }
  if (!mode) return;

  const nativeChecks = process.platform === 'linux' ? await Promise.all([
    commandVersion('Python 3', 'python3', ['--version']),
    commandVersion('Make', 'make', ['--version']),
    commandVersion('32-bit GCC frontend', 'gcc', ['-m32', '-E', '-x', 'c', '/dev/null']),
    commandVersion('QEMU x86', 'qemu-system-i386', ['--version'])
  ]) : [];
  const nativeReady = nativeChecks.length === 4 && nativeChecks.every((check) => check.ok);
  const dockerChecks = await Promise.all([
    commandVersion('Docker Compose', 'docker', ['compose', 'version']),
    commandVersion('Docker engine', 'docker', ['info', '--format', '{{.ServerVersion}}'])
  ]);
  const dockerReady = dockerChecks.every((check) => check.ok);
  const routes = [
    ...(nativeReady ? [{ label: 'Native Linux tools', description: 'Use local GCC, Make, Python, and qemu-system-i386', value: 'native' as const }] : []),
    ...(dockerReady ? [{ label: 'Portable Docker environment', description: 'Build the pinned Ubuntu/x86 tool recipe, then run the same validator', value: 'docker' as const }] : [])
  ];
  if (!routes.length) {
    const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 xv6 Preflight');
    output.clear();
    output.appendLine('No executable xv6 route is currently ready. Nothing was run or installed.');
    [...nativeChecks, ...dockerChecks].forEach((check) => output.appendLine(`${check.ok ? 'READY' : 'NEEDS ATTENTION'}  ${check.name}: ${check.detail}`));
    output.appendLine('Use “Check Cross-platform Course Environment” for the full diagnostic, or install/start Docker and retry.');
    output.show(true);
    void vscode.window.showErrorMessage('Neither the native Linux xv6 toolchain nor the Docker fallback is ready. Review the xv6 Preflight output.');
    return;
  }
  const route = routes.length === 1 ? routes[0] : await vscode.window.showQuickPick(routes, { title: `Run ${XV6_MODE_LABELS[mode]}`, placeHolder: 'Choose a transparent execution environment' });
  if (!route) return;
  const consent = await vscode.window.showWarningMessage(
    `Run ${XV6_MODE_LABELS[mode]} against the current workspace? This will run make, current xv6 code in QEMU, and for PA2 the upstream xv6 usertests. It does not grade, upload, or submit.`,
    { modal: true },
    'Run preflight'
  );
  if (consent !== 'Run preflight') return;

  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 xv6 Preflight');
  output.clear();
  output.appendLine(`${XV6_MODE_LABELS[mode]}`);
  output.appendLine(`Workspace: ${root.fsPath}`);
  output.appendLine(`Environment: ${route.value}`);
  output.appendLine('Boundary: formative local verification only; Canvas and instructor/GSI evaluation remain authoritative.');
  output.show(true);
  const executable = route.value === 'native' ? 'python3' : 'docker';
  const args = route.value === 'native'
    ? ['.systemstudio/verify_xv6.py', mode]
    : ['compose', '-f', '.systemstudio/compose.yaml', 'run', '--rm', 'xv6', 'python3', '.systemstudio/verify_xv6.py', mode];
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running xv6 ${mode.toUpperCase()} behavioral preflight`, cancellable: false }, async () => {
      const result = await execFileAsync(executable, args, { cwd: root.fsPath, timeout: 600_000, maxBuffer: 32 * 1024 * 1024 });
      output.append(result.stdout);
      if (result.stderr) output.append(result.stderr);
    });
    output.appendLine('\nPASS: the selected local preflight completed. Explain the evidence and compare the current Canvas requirements before submitting.');
    void vscode.window.showInformationMessage(`${mode.toUpperCase()} local behavioral preflight passed. This is formative evidence, not an official grade or submission.`);
  } catch (error) {
    const details = error as Error & { stdout?: string; stderr?: string };
    if (details.stdout) output.append(details.stdout);
    if (details.stderr) output.append(details.stderr);
    output.appendLine(`\nFAIL: ${details.message ?? String(error)}`);
    output.appendLine('Use the first failed assertion as a debugging lead. The tool does not provide or apply an assignment solution.');
    void vscode.window.showErrorMessage(`${mode.toUpperCase()} preflight failed. Review the xv6 Preflight output for the first actionable assertion.`);
  }
}

async function checkEnvironment(): Promise<void> {
  const checks = await Promise.all([
    commandVersion('Docker client', 'docker', ['--version']),
    commandVersion('Docker Compose', 'docker', ['compose', 'version']),
    commandVersion('Docker engine', 'docker', ['info', '--format', '{{.ServerVersion}}']),
    commandVersion('Git', 'git', ['--version']),
    commandVersion('C compiler', process.platform === 'win32' ? 'where' : 'sh', process.platform === 'win32' ? ['gcc'] : ['-lc', 'command -v gcc || command -v clang']),
    commandVersion('Make', process.platform === 'win32' ? 'where' : 'make', process.platform === 'win32' ? ['make'] : ['--version']),
    commandVersion('Python 3', process.platform === 'win32' ? 'where' : 'python3', process.platform === 'win32' ? ['python3'] : ['--version']),
    commandVersion('QEMU x86', process.platform === 'win32' ? 'where' : 'qemu-system-i386', process.platform === 'win32' ? ['qemu-system-i386'] : ['--version']),
    ...(process.platform === 'linux' ? [commandVersion('32-bit GCC frontend', 'gcc', ['-m32', '-E', '-x', 'c', '/dev/null'])] : [])
  ]);
  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 Environment');
  output.clear();
  output.appendLine(`SystemStudio OS environment check (${process.platform}/${process.arch})`);
  output.appendLine('This diagnostic changes nothing and installs nothing.');
  for (const check of checks) output.appendLine(`${check.ok ? 'READY' : 'NEEDS ATTENTION'}  ${check.name}: ${check.detail}`);
  output.appendLine('\nCOMMON ROUTE: the portable coursework workspace needs Docker client, Compose, and a running Linux-container engine. The same visible Ubuntu recipe is used on Windows, macOS, and Linux.');
  output.appendLine('NATIVE CONVENIENCE: non-Windows hosts may run HW1/HW2/HW3/PA3 prerequisites with Python 3, Make, and a POSIX C compiler; this can differ from the release container.');
  output.appendLine('XV6: native Linux also needs QEMU x86 and a working 32-bit GCC frontend. The extension installs nothing and never changes administrator or virtualization settings.');
  output.appendLine('Use “Open Cross-platform Setup Guide” for official Docker/Dev Containers routes and the managed-computer fallback.');
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

type PortablePreflightMode = PortableCourseworkId | 'all';

function portablePreflightMode(value: unknown): PortablePreflightMode | undefined {
  return value === 'all' || PORTABLE_COURSEWORK_IDS.includes(value as PortableCourseworkId) ? value as PortablePreflightMode : undefined;
}

async function findPortableWorkspace(): Promise<vscode.Uri | undefined> {
  const matches: vscode.Uri[] = [];
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    try {
      const raw = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.systemstudio', 'coursework-manifest.json'))).toString('utf8');
      if (parseCourseworkWorkspaceManifest(JSON.parse(raw))) matches.push(folder.uri);
    } catch {}
  }
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    return vscode.window.showQuickPick(matches.map((uri) => ({ label: uri.path.split('/').pop() ?? uri.fsPath, description: uri.fsPath, uri })), { title: 'Choose the portable OS coursework workspace' }).then((picked) => picked?.uri);
  }
  const choice = await vscode.window.showWarningMessage('Open the workspace created by “Create Portable OS Coursework Workspace” before using its setup guide or preflights.', 'Create workspace');
  if (choice === 'Create workspace') await createLabWorkspace();
  return undefined;
}

async function openPortableSetup(): Promise<void> {
  const root = await findPortableWorkspace();
  if (!root) return;
  const guide = vscode.Uri.joinPath(root, 'SETUP.md');
  try {
    await vscode.workspace.fs.stat(guide);
    await vscode.commands.executeCommand('markdown.showPreview', guide);
  } catch {
    void vscode.window.showErrorMessage('The cross-platform setup guide is missing. Create a new portable workspace with this extension release.');
  }
}

async function reopenInCourseContainer(): Promise<void> {
  if (vscode.env.remoteName === 'dev-container') {
    void vscode.window.showInformationMessage('This workspace is already open in a Dev Container. Use the integrated terminal or “Build and Run Current C File.”');
    return;
  }
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showErrorMessage('Trust this portable coursework workspace before starting its visible container recipe. No container was started.');
    return;
  }
  const root = await findPortableWorkspace();
  if (!root) return;
  const activeRoot = vscode.workspace.workspaceFolders?.some((folder) => folder.uri.fsPath === root.fsPath);
  if (!activeRoot) {
    void vscode.window.showErrorMessage('Open the generated portable coursework folder as the current VS Code workspace before reopening it in a container.');
    return;
  }
  let extension = vscode.extensions.getExtension('ms-vscode-remote.remote-containers');
  if (!extension) {
    const choice = await vscode.window.showInformationMessage(
      'The optional Microsoft Dev Containers extension is not installed. Installing it adds integrated editing/debugging but does not install or start Docker.',
      { modal: true },
      'Install Microsoft Dev Containers',
      'Use Docker tasks instead'
    );
    if (choice !== 'Install Microsoft Dev Containers') return;
    try {
      await vscode.commands.executeCommand('workbench.extensions.installExtension', 'ms-vscode-remote.remote-containers');
      extension = vscode.extensions.getExtension('ms-vscode-remote.remote-containers');
    } catch (error) {
      void vscode.window.showErrorMessage(`Dev Containers installation failed: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
  try {
    await extension?.activate();
    await vscode.commands.executeCommand('remote-containers.reopenInContainer');
  } catch (error) {
    void vscode.window.showErrorMessage(`Could not reopen the course workspace in its container: ${error instanceof Error ? error.message : String(error)}. Verify that Docker is installed and running.`);
  }
}

async function runCourseworkPreflight(requestedItem?: string): Promise<void> {
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showErrorMessage('Trust this portable coursework workspace before executing its compiler/runtime checks. No code was run.');
    return;
  }
  const root = await findPortableWorkspace();
  if (!root) return;
  let item = portablePreflightMode(requestedItem);
  if (!item) {
    const choices = [
      { label: 'All remaining non-xv6 coursework prerequisites', description: 'HW1 · HW2 · HW3 · PA3', value: 'all' as const },
      ...PORTABLE_COURSEWORK_IDS.map((value) => ({ label: PORTABLE_COURSEWORK_LABELS[value], description: value.toUpperCase(), value }))
    ];
    item = (await vscode.window.showQuickPick(choices, { title: 'Choose a solution-free portable coursework preflight', placeHolder: 'These checks execute formative analogs; they do not grade or submit.' }))?.value;
  }
  if (!item) return;

  const dockerChecks = await Promise.all([
    commandVersion('Docker Compose', 'docker', ['compose', 'version']),
    commandVersion('Docker engine', 'docker', ['info', '--format', '{{.ServerVersion}}'])
  ]);
  const dockerReady = dockerChecks.every((check) => check.ok);
  const nativeChecks = process.platform === 'win32' ? [] : await Promise.all([
    commandVersion('Python 3', 'python3', ['--version']),
    commandVersion('Make', 'make', ['--version']),
    commandVersion('POSIX C compiler', 'sh', ['-lc', 'command -v cc'])
  ]);
  const nativeReady = nativeChecks.length === 3 && nativeChecks.every((check) => check.ok);
  const routes = [
    ...(dockerReady ? [{ label: 'Portable Linux course container (recommended)', description: 'Same visible recipe on Windows, macOS, and Linux', value: 'docker' as const }] : []),
    ...(nativeReady ? [{ label: 'Native Unix tools', description: 'Linux/macOS convenience route; may differ from release container', value: 'native' as const }] : [])
  ];
  if (!routes.length) {
    const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 Portable Coursework');
    output.clear();
    output.appendLine('No executable portable-coursework route is ready. Nothing was run or installed.');
    [...dockerChecks, ...nativeChecks].forEach((check) => output.appendLine(`${check.ok ? 'READY' : 'NEEDS ATTENTION'}  ${check.name}: ${check.detail}`));
    output.appendLine('Windows requires the supplied Linux container route. macOS/Linux can also use Python 3, Make, and a POSIX C compiler already installed on the host.');
    output.appendLine('Open SETUP.md for official installation routes. The extension does not silently install Docker or change administrator settings.');
    output.show(true);
    const choice = await vscode.window.showErrorMessage('The container route is not ready, and no equivalent native Unix toolchain was found.', 'Open setup guide');
    if (choice === 'Open setup guide') await openPortableSetup();
    return;
  }
  const route = routes.length === 1 ? routes[0] : await vscode.window.showQuickPick(routes, { title: `Run ${item.toUpperCase()} prerequisite preflight`, placeHolder: 'Choose the transparent execution environment' });
  if (!route) return;
  const consent = await vscode.window.showWarningMessage(
    `Execute the ${item.toUpperCase()} solution-free prerequisite preflight using ${route.value === 'docker' ? 'the supplied Linux container' : 'native Unix tools'}? It compiles/runs bundled formative programs but does not inspect an active assignment answer, grade, upload, or submit.`,
    { modal: true },
    'Run preflight'
  );
  if (consent !== 'Run preflight') return;

  const output = vscode.window.createOutputChannel('CIS 450 / ECE 478 Portable Coursework');
  output.clear();
  output.appendLine(`${item.toUpperCase()} solution-free prerequisite preflight`);
  output.appendLine(`Workspace: ${root.fsPath}`);
  output.appendLine(`Environment: ${route.value}`);
  output.appendLine('Boundary: formative environment/prerequisite evidence only; Canvas and instructor evaluation remain authoritative.');
  output.show(true);
  const executable = route.value === 'native' ? 'python3' : 'docker';
  const args = route.value === 'native'
    ? ['.systemstudio/coursework.py', 'check', item]
    : ['compose', 'run', '--rm', 'oslab', 'python3', '.systemstudio/coursework.py', 'check', item];
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running ${item.toUpperCase()} portable prerequisite preflight`, cancellable: false }, async () => {
      const result = await execFileAsync(executable, args, { cwd: root.fsPath, timeout: 300_000, maxBuffer: 16 * 1024 * 1024 });
      output.append(result.stdout);
      if (result.stderr) output.append(result.stderr);
    });
    output.appendLine('\nPASS: all selected formative programs compiled/ran and emitted the expected evidence anchors.');
    void vscode.window.showInformationMessage(`${item.toUpperCase()} prerequisite preflight passed. This is not an assignment grade or Canvas submission.`);
  } catch (error) {
    const details = error as Error & { stdout?: string; stderr?: string };
    if (details.stdout) output.append(details.stdout);
    if (details.stderr) output.append(details.stderr);
    output.appendLine(`\nFAIL: ${details.message ?? String(error)}`);
    output.appendLine('Use the first failed environment or formative step as the debugging lead; the extension will not replace an active assignment solution.');
    void vscode.window.showErrorMessage(`${item.toUpperCase()} prerequisite preflight failed. Review the Portable Coursework output.`);
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
  const choice = await vscode.window.showInformationMessage(`Created the portable OS coursework workspace at ${root.fsPath}. It includes one fixed Windows/macOS/Linux container route plus HW1, HW2, HW3, and PA3 prerequisite preflights. Review SETUP.md before running it.`, 'Open workspace');
  if (choice === 'Open workspace') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
}

async function runCurrentC(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const folder = editor ? vscode.workspace.getWorkspaceFolder(editor.document.uri) : undefined;
  if (!editor || editor.document.languageId !== 'c' || !folder) {
    void vscode.window.showWarningMessage('Open a C file inside the generated portable coursework workspace before running this command.');
    return;
  }
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showErrorMessage('Trust this portable coursework workspace before compiling its C code. No code was run.');
    return;
  }
  try {
    const raw = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.systemstudio', 'coursework-manifest.json'))).toString('utf8');
    if (!parseCourseworkWorkspaceManifest(JSON.parse(raw))) throw new Error('invalid manifest');
  } catch {
    void vscode.window.showErrorMessage('This command runs only in a manifest-validated workspace created by “Create Portable OS Coursework Workspace.”');
    return;
  }
  const relative = vscode.workspace.asRelativePath(editor.document.uri, false);
  if (relative.startsWith('..') || !/^[A-Za-z0-9_./-]+\.c$/.test(relative)) {
    void vscode.window.showErrorMessage('For safety, the current C file must be inside the workspace and use a simple path.');
    return;
  }
  const dockerReady = (await Promise.all([
    commandVersion('Docker Compose', 'docker', ['compose', 'version']),
    commandVersion('Docker engine', 'docker', ['info', '--format', '{{.ServerVersion}}'])
  ])).every((check) => check.ok);
  const nativeReady = process.platform !== 'win32' && (await Promise.all([
    commandVersion('Make', 'make', ['--version']),
    commandVersion('POSIX C compiler', 'sh', ['-lc', 'command -v cc'])
  ])).every((check) => check.ok);
  const inDevContainer = vscode.env.remoteName === 'dev-container';
  const routes = [
    ...(inDevContainer || nativeReady ? [{ label: inDevContainer ? 'Current course Dev Container' : 'Native Unix compiler', description: inDevContainer ? 'Use the compiler already inside the generated course container' : 'Linux/macOS convenience route', value: 'native' as const }] : []),
    ...(!inDevContainer && dockerReady ? [{ label: 'Portable Linux course container (recommended)', description: 'Same visible recipe on Windows, macOS, and Linux', value: 'docker' as const }] : [])
  ];
  if (!routes.length) {
    const choice = await vscode.window.showErrorMessage('No supported C/pthread compiler route is ready. Nothing was compiled.', 'Open setup guide');
    if (choice === 'Open setup guide') await openPortableSetup();
    return;
  }
  const route = routes.length === 1 ? routes[0] : await vscode.window.showQuickPick(routes, { title: 'Build and run the current C file', placeHolder: 'Choose a transparent execution environment' });
  if (!route) return;
  await editor.document.save();
  const terminal = vscode.window.createTerminal({ name: 'CIS 450 OS Lab', cwd: folder.uri });
  terminal.show();
  const nativeCommand = `mkdir -p build && cc -Wall -Wextra -Wpedantic -g -pthread ${relative} -o build/current && ./build/current`;
  terminal.sendText(route.value === 'docker' ? `docker compose run --rm oslab bash -lc '${nativeCommand}'` : nativeCommand, true);
}

async function exportCalendar(): Promise<void> {
  const target = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('CIS450_ECE478_Fall2026.ics'), filters: { Calendar: ['ics'] }, saveLabel: 'Export local calendar' });
  if (!target) return;
  await vscode.workspace.fs.writeFile(target, Buffer.from(buildCalendar(), 'utf8'));
  void vscode.window.showInformationMessage('Exported 27 verified class meetings plus academic-calendar boundaries. Assignment and exam details remain Canvas-authoritative.');
}

export function buildHubHtmlForTesting(options: { firstRun?: boolean; canvasCourseUrl?: string } = {}): string {
  const data = JSON.stringify({ course: COURSE, modules: MODULES, schedule: fall2026Schedule(), coursework: COURSEWORK, boundaries: SOURCE_BOUNDARIES, labs: GUIDED_LABS, simulations: OSTEP_SIMULATORS, simulatorSource: { page: OSTEP_HOMEWORK_PAGE, commit: OSTEP_HOMEWORK_COMMIT }, faqs: FAQS, walkthrough: WALKTHROUGH_STEPS, firstRun: options.firstRun === true, canvasCourseUrl: options.canvasCourseUrl ?? COURSE.canvasUrl }).replaceAll('<', '\\u003c');
  const nonce = Math.random().toString(36).slice(2);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>${COURSE.title}</title><style nonce="${nonce}">
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font:15px/1.55 var(--vscode-font-family);display:grid;grid-template-columns:minmax(220px,280px) 1fr;min-height:100vh}a{color:var(--vscode-textLink-foreground)}button,input,select,textarea{font:inherit}button{border:1px solid var(--vscode-button-border,transparent);border-radius:5px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:.48rem .72rem;cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button.quiet{background:transparent;color:var(--vscode-textLink-foreground);border-color:var(--vscode-panel-border)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--vscode-focusBorder);outline-offset:2px}.skip{position:fixed;left:-10000px}.skip:focus{left:1rem;top:1rem;z-index:20;background:var(--vscode-editor-background);padding:.5rem}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.nav{border-right:1px solid var(--vscode-panel-border);padding:1rem;position:sticky;top:0;height:100vh;overflow:auto}.nav h1{font-size:1.1rem}.nav button{width:100%;text-align:left;margin:.2rem 0;background:transparent;color:var(--vscode-foreground);border-color:transparent}.nav button[aria-current="page"]{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}main{padding:clamp(1rem,3vw,2.5rem);max-width:1180px;width:100%}.panel[hidden],.module-content[hidden],[hidden]{display:none!important}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--vscode-descriptionForeground)}.notice{border-left:5px solid var(--vscode-textLink-foreground);padding:.8rem 1rem;background:var(--vscode-textBlockQuote-background);margin:1rem 0}.warning{border-left-color:var(--vscode-editorWarning-foreground)}.success{border-left-color:var(--vscode-testing-iconPassed)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:1rem}.card,.module{border:1px solid var(--vscode-panel-border);border-radius:8px;padding:1rem;background:var(--vscode-sideBar-background)}.module{padding:0}.module>button{width:100%;display:flex;justify-content:space-between;text-align:left;background:transparent;color:inherit;border:0;padding:1rem}.module-content{padding:0 1rem 1rem}.module-list{display:grid;gap:.75rem}.pill{display:inline-block;border:1px solid var(--vscode-panel-border);border-radius:999px;padding:.1rem .5rem;color:var(--vscode-descriptionForeground);font-size:.84rem}.question{border-top:1px solid var(--vscode-panel-border);padding-top:.8rem;margin-top:.8rem}.choice{display:block;margin:.45rem 0}.explanation{padding:.7rem;background:var(--vscode-textCodeBlock-background);border-radius:5px;margin-top:.5rem}.source{font-size:.9rem;color:var(--vscode-descriptionForeground)}.status-row,.actions,.practice-controls{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap}.status-row select{min-width:150px}progress{width:100%;height:1rem}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.5rem;border-bottom:1px solid var(--vscode-panel-border);vertical-align:top}.grade-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(105px,170px);gap:.7rem;max-width:680px}.grade-grid label{align-self:center}.grade-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.8rem;margin-top:1rem}.grade-number{font-size:1.65rem;font-weight:750}.contribution{font-variant-numeric:tabular-nums}input,select,textarea{padding:.45rem;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)}textarea{width:100%;min-height:105px}.result{font-size:1.2rem;font-weight:700}.source-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.muted{color:var(--vscode-descriptionForeground)}.checklist label{display:grid;grid-template-columns:auto 1fr;gap:.55rem;margin:.6rem 0}.analytics{font-variant-numeric:tabular-nums}.overlay{position:fixed;inset:0;background:color-mix(in srgb,var(--vscode-editor-background) 86%,transparent);z-index:15;display:grid;place-items:center;padding:1rem}.dialog{width:min(720px,100%);max-height:90vh;overflow:auto;border:2px solid var(--vscode-focusBorder);box-shadow:0 12px 40px #0008}.step-dots{display:flex;gap:.4rem}.dot{width:.8rem;height:.8rem;border-radius:50%;padding:0;background:var(--vscode-panel-border)}.dot.current{background:var(--vscode-textLink-foreground)}.companion{position:fixed;right:1rem;bottom:1rem;z-index:10;display:grid;justify-items:end;gap:.55rem}.companion-launch{width:3.7rem;height:3.7rem;border-radius:50%;display:grid;place-items:center;box-shadow:0 5px 18px #0006}.companion-launch svg{width:2.25rem;height:2.25rem;animation:companion-breathe 2.8s ease-in-out infinite;transform-origin:center}.companion-panel{width:min(330px,calc(100vw - 2rem));box-shadow:0 8px 28px #0007}.companion-panel h2{margin-top:0}.companion-panel .actions{align-items:stretch}.companion-panel .actions button{flex:1 1 120px}@keyframes companion-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.04)}}code{overflow-wrap:anywhere}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important}.companion-launch svg{animation:none}}@media(max-width:760px){body{display:block}.nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--vscode-panel-border)}.source-grid{grid-template-columns:1fr}.grade-grid{grid-template-columns:1fr}main{padding:1rem}.companion{right:.6rem;bottom:.6rem}}
</style></head><body><a class="skip" href="#main">Skip to content</a>
<nav class="nav" aria-label="Course sections"><h1>SystemStudio OS</h1><p class="muted">CIS 450 / ECE 478</p><div id="nav"></div><hr><p><strong>Canvas is authoritative</strong><br><span class="muted">Deadlines · submissions · official grades</span></p></nav>
<main id="main" tabindex="-1"><section id="home" class="panel"></section><section id="schedule" class="panel" hidden></section><section id="modules" class="panel" hidden></section><section id="practice" class="panel" hidden></section><section id="labs" class="panel" hidden></section><section id="simulations" class="panel" hidden></section><section id="coursework" class="panel" hidden></section><section id="grades" class="panel" hidden></section><section id="progress" class="panel" hidden></section><section id="help" class="panel" hidden></section></main><aside id="walkthrough" class="overlay" role="dialog" aria-modal="true" aria-labelledby="walk-title" hidden><div class="dialog card"><p class="eyebrow">Self-paced orientation</p><h2 id="walk-title"></h2><p id="walk-detail"></p><div id="walk-dots" class="step-dots" aria-label="Walkthrough progress"></div><p id="walk-count" class="muted"></p><div class="actions"><button id="walk-prev" class="secondary">Previous</button><button id="walk-next">Next</button><button id="walk-skip" class="quiet">Skip for now</button></div></div></aside><div id="global-notice" class="overlay" hidden><div class="dialog card" role="status" aria-live="polite"><p id="global-notice-text"></p><button id="global-notice-close">Close</button></div></div><aside id="companion" class="companion" aria-label="Optional OS learning companion"><section id="companion-panel" class="companion-panel card" aria-labelledby="companion-title" hidden><h2 id="companion-title" tabindex="-1">Need a next step?</h2><p>I can open the offline helper or a five-question practice set. I do not send data or provide assignment answers.</p><div class="actions"><button id="companion-help">Ask the offline helper</button><button id="companion-practice" class="secondary">Practice five</button><button id="companion-hide" class="quiet">Hide companion</button></div></section><button id="companion-launch" class="companion-launch" aria-expanded="false" aria-controls="companion-panel"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12" y="15" width="24" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M17 22l4 3-4 3M24 29h7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr-only">Open OS learning companion</span></button></aside>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi(), DATA=${data};
const emptyLearning=()=>({version:1,questions:{},attempts:[]});
const defaults={section:'home',moduleStatus:{},confidence:{},grade:{participation:'',homework:'',programming:'',midterm:'',finalExam:''},gradeTarget:'83.34',learning:emptyLearning(),coursework:{},labSteps:{},simulationRuns:{},canvasEvents:[],walkthroughOpen:DATA.firstRun,walkthroughStep:0,companionEnabled:true,companionOpen:false};
let state=Object.assign({},defaults,vscode.getState()||{});state.moduleStatus=state.moduleStatus||{};state.confidence=state.confidence||{};state.grade=Object.assign({},defaults.grade,state.grade||{});state.learning=state.learning||emptyLearning();state.coursework=state.coursework||{};state.labSteps=state.labSteps||{};state.simulationRuns=state.simulationRuns||{};state.canvasEvents=state.canvasEvents||[];
let practiceQuestions=[],analytics=[],icsPreview=[];
const tabs=[['home','Course home'],['schedule','Course plan'],['modules','Modules'],['practice','Practice & review'],['labs','Guided labs'],['simulations','OSTEP simulations'],['coursework','Coursework'],['grades','Grade planner'],['progress','My local progress'],['help','Questions & help']];
function esc(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function command(name){vscode.postMessage({type:'command',command:name});}
function external(url){vscode.postMessage({type:'openExternal',command:url});}
function persist(){vscode.setState(state);}
function show(id){state.section=id;persist();document.querySelectorAll('.panel').forEach(x=>x.hidden=x.id!==id);document.querySelectorAll('#nav button').forEach(x=>x.setAttribute('aria-current',x.dataset.id===id?'page':'false'));document.getElementById(id).focus?.();}
document.getElementById('nav').innerHTML=tabs.map(t=>'<button data-id="'+t[0]+'">'+t[1]+'</button>').join('');document.getElementById('nav').onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.id)};
function bindCommands(root){root.querySelectorAll('[data-command]').forEach(button=>{button.onclick=()=>command(button.dataset.command)});}
function renderHome(){const el=document.getElementById('home');el.innerHTML='<p class="eyebrow">Active student course material · Fall 2026</p><h1>'+esc(DATA.course.title)+'</h1><div class="notice"><strong>Verified meeting:</strong> '+esc(DATA.course.meeting)+', '+esc(DATA.course.room)+'.<br><strong>Instructor:</strong> '+esc(DATA.course.instructor)+' · '+esc(DATA.course.instructorOffice)+'<br><strong>Course staffing:</strong> '+esc(DATA.course.gsiStatus)+'</div><div class="grid"><article class="card"><h2>Prepare for the next class</h2><ol><li>Open the dated course plan.</li><li>Read each mapped OSTEP chapter using its focus prompt.</li><li>Read the accessible explanation.</li><li>Try the eight-question module check and record confidence.</li><li>Predict, run, and explain the mapped simulator or guided lab.</li></ol><div class="actions"><button id="home-schedule">Open course plan</button><button id="home-modules" class="secondary">Open modules</button><button id="home-practice" class="quiet">Practice five</button></div></article><article class="card"><h2>Build observable behavior</h2><p>Fifteen official OSTEP simulator presets and thirteen guided starters cover processes, scheduling, memory, concurrency, I/O, files, and recovery. The official simulator source is fetched at a pinned revision only after consent; it is not copied into this extension. A separate pinned MIT x86 xv6 path runs the historical PA1/PA2 behaviors in headless QEMU.</p><div class="actions"><button id="home-simulations">Open OSTEP simulations</button><button id="home-labs" class="secondary">Open guided labs</button><button data-command="systemstudioOs.createLabWorkspace" class="secondary">Create portable coursework workspace</button><button data-command="systemstudioOs.runCourseworkPreflight" class="secondary">Run coursework preflight</button><button data-command="systemstudioOs.openPortableSetup" class="quiet">Cross-platform setup</button><button data-command="systemstudioOs.prepareXv6" class="secondary">Prepare verified xv6 reference</button><button data-command="systemstudioOs.verifyXv6" class="secondary">Run xv6 preflight</button><button data-command="systemstudioOs.checkEnvironment" class="quiet">Check environment</button></div></article><article class="card"><h2>Canvas authority and planning</h2><p>Verified destination: <code>'+esc(DATA.canvasCourseUrl)+'</code></p><div class="actions"><button data-command="systemstudioOs.openCanvas">Open Canvas course 552201</button><button id="home-grades" class="secondary">Open grade predictor</button><button data-command="systemstudioOs.configureCanvas" class="secondary">Configure discussion/private routes</button><button data-command="systemstudioOs.exportCalendar" class="quiet">Export chapter-mapped calendar</button></div></article></div><div class="actions"><button id="rerun-walk" class="secondary">Rerun orientation</button><button data-command="systemstudioOs.openAccessibleLessons" class="secondary">Accessible lesson collection</button><button data-command="systemstudioOs.openSyllabus" class="secondary">Accessible syllabus</button></div><h2>Evidence boundaries</h2><div class="source-grid"><div class="card"><h3>Verified Fall 2026</h3><ul>'+DATA.boundaries.verifiedCurrent.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Verified reference implementations</h3><ul>'+DATA.boundaries.verifiedReference.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Historical planning basis</h3><ul>'+DATA.boundaries.historicalPolicy.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Confirm in Canvas</h3><ul>'+DATA.boundaries.canvasOnly.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>';el.querySelector('#home-schedule').onclick=()=>show('schedule');el.querySelector('#home-modules').onclick=()=>show('modules');el.querySelector('#home-practice').onclick=()=>show('practice');el.querySelector('#home-labs').onclick=()=>show('labs');el.querySelector('#home-simulations').onclick=()=>show('simulations');el.querySelector('#home-grades').onclick=()=>show('grades');el.querySelector('#rerun-walk').onclick=()=>{state.walkthroughOpen=true;state.walkthroughStep=0;persist();renderWalkthrough()};bindCommands(el);}
function renderSchedule(){const el=document.getElementById('schedule');const rows=DATA.schedule.map(m=>'<tr><td>'+m.number+'</td><td>'+esc(new Date(m.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}))+'</td><td><button class="quiet schedule-module" data-module-number="'+m.moduleNumbers[0]+'">'+m.moduleNumbers.map(n=>'M'+n).join(', ')+'</button></td><td>'+esc(m.topic)+'</td><td>'+esc(m.prepare)+'</td></tr>').join('');el.innerHTML='<p class="eyebrow">27 verified meetings · planned topic and reading sequence</p><h1>Fall 2026 course plan</h1><div class="notice warning"><strong>Preparation plan, not an assessment calendar.</strong> Meeting dates, time, and room are verified. Topic order and readings are the instructor’s current learning plan; Canvas announcements control changes, assignments, deadlines, and exams.</div><div class="actions"><button data-command="systemstudioOs.exportCalendar">Export this plan (.ics)</button><button data-command="systemstudioOs.openCanvas" class="secondary">Open Canvas course</button></div><table><caption>Monday/Wednesday preparation map</caption><thead><tr><th>Meeting</th><th>Date</th><th>Module</th><th>Planned class focus</th><th>Read before class</th></tr></thead><tbody>'+rows+'</tbody></table>';el.onclick=e=>{const b=e.target.closest('.schedule-module');if(b)openModule(Number(b.dataset.moduleNumber))};bindCommands(el);}
function questionHtml(q,prefix){return '<div class="question" data-q="'+q.id+'"><p><span class="pill">'+esc(q.level)+'</span> <strong>'+esc(q.prompt)+'</strong></p>'+q.choices.map((c,i)=>'<label class="choice"><input type="radio" name="'+prefix+q.id+'" value="'+i+'"> '+esc(c)+'</label>').join('')+(q.hint?'<details><summary>Hint</summary><p>'+esc(q.hint)+'</p></details>':'')+'<div class="actions"><button class="check" data-q="'+q.id+'" data-prefix="'+prefix+'">Check reasoning</button><button class="quiet save" data-q="'+q.id+'">'+(state.learning.questions[q.id]?.saved?'Unsave':'Save for review')+'</button></div><div class="explanation" id="'+prefix+'ex-'+q.id+'" hidden aria-live="polite"></div><p class="source"><strong>Grounding:</strong> '+esc(q.source)+'</p></div>';}
function simulatorButtons(simulator){return '<div class="actions"><button class="run-sim secondary" data-sim-id="'+simulator.id+'" data-sim-mode="practice" aria-label="Run a new prediction problem for '+esc(simulator.title)+'">New prediction problem</button><button class="run-sim quiet" data-sim-id="'+simulator.id+'" data-sim-mode="reveal" aria-label="Reveal '+esc(simulator.title)+' only after recording a prediction">Reveal after prediction</button></div>';}
function moduleCard(m){const readingList=m.readings.map(r=>'<li><button class="secondary reading" data-url="'+esc(r.url)+'">'+esc(r.chapter+': '+r.title)+'</button><br><span class="muted"><strong>Read for:</strong> '+esc(r.focus)+'</span></li>').join('');const levels=[...new Set(m.questions.map(q=>q.level))].join(' · '),simulators=DATA.simulations.filter(s=>s.moduleNumber===m.number),simulationSection=simulators.length?'<h3>Official OSTEP prediction tools</h3><p class="muted">Read the named chapter and record the requested work before revealing output.</p>'+simulators.map(s=>'<article class="card"><p class="pill">'+esc(s.chapter)+'</p><h4>'+esc(s.title)+'</h4><p>'+esc(s.purpose)+'</p><p><strong>Before:</strong> '+esc(s.predict)+'</p>'+simulatorButtons(s)+'</article>').join(''):'';return '<article class="module" id="module-'+m.number+'"><button class="toggle" aria-expanded="false"><span><span class="pill">'+m.unit+'</span> Module '+m.number+': '+esc(m.title)+' · '+m.readings.length+' chapter'+(m.readings.length===1?'':'s')+' · 8 questions · guided lab'+(simulators.length?' · '+simulators.length+' simulator'+(simulators.length===1?'':'s'):'')+'</span><span aria-hidden="true">＋</span></button><div class="module-content" hidden><h3>Learning objectives</h3><ul>'+m.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><h3>Read before class</h3><p class="muted">Open each official OSTEP chapter directly. The book authors request linking to the current chapters rather than redistributing copies.</p><ol>'+readingList+'</ol>'+m.lesson.map(x=>'<p>'+esc(x)+'</p>').join('')+simulationSection+'<div class="notice"><strong>Hands-on:</strong> '+esc(m.handsOn)+'<br><strong>Evidence artifact:</strong> '+esc(m.artifact)+'<br><button class="create-lab secondary" data-module-number="'+m.number+'">Create this guided starter</button></div><details><summary>Source basis</summary><p>'+esc(m.sourceBasis)+'</p></details><h3>Reading-aligned readiness and mastery check</h3><p class="muted">Eight formative questions span '+esc(levels)+'. Try them before class, read every explanation, then revisit missed or low-confidence items after the lab.</p>'+m.questions.map(q=>questionHtml(q,'module-')).join('')+'<fieldset><legend><strong>Private self-evaluation after reading, questions, simulator, and lab</strong></legend><div class="status-row"><label for="status-'+m.id+'">Learning stage:</label><select id="status-'+m.id+'" data-module="'+m.id+'"><option value="not-started">Not started</option><option value="preparing">Read/explain in progress</option><option value="practicing">Questions/lab in progress</option><option value="confident">Can explain and apply — self-assessed</option></select><label for="confidence-'+m.id+'">Confidence 1–5:</label><input id="confidence-'+m.id+'" data-confidence="'+m.id+'" type="number" min="1" max="5" value="'+esc(state.confidence[m.id]||'')+'"></div><p class="muted">Use “confident” only when you can explain the objectives, predict a new case, and interpret the simulator/lab evidence. This is not a grade.</p></fieldset></div></article>';}
function renderModules(){const el=document.getElementById('modules');el.innerHTML='<p class="eyebrow">Read → explain → retrieve → predict → build → self-evaluate</p><h1>Thirteen learning modules</h1><div class="notice"><strong>29 exact official OSTEP chapter links, 104 explained questions, and 15 chapter-mapped simulators:</strong> every module maps reading to focus prompts, accessible explanations, Bloom-level practice, and a verified formative lab. The nine available instructor decks were individually audited for concurrency and persistence; virtualization modules remain textbook/syllabus/assignment-grounded because no corresponding deck was found locally.</div><div class="module-list">'+DATA.modules.map(moduleCard).join('')+'</div>';el.querySelectorAll('select[data-module]').forEach(s=>s.value=state.moduleStatus[s.dataset.module]||'not-started');el.onchange=e=>{if(e.target.dataset.module)state.moduleStatus[e.target.dataset.module]=e.target.value;if(e.target.dataset.confidence)state.confidence[e.target.dataset.confidence]=e.target.value;persist();renderProgress()};el.onclick=e=>{const toggle=e.target.closest('.toggle');if(toggle){const content=toggle.nextElementSibling,open=content.hidden;content.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.lastElementChild.textContent=open?'−':'＋';return}const read=e.target.closest('.reading');if(read){external(read.dataset.url);return}const sim=e.target.closest('.run-sim');if(sim){vscode.postMessage({type:'runOstepSimulator',id:sim.dataset.simId,mode:sim.dataset.simMode});return}const lab=e.target.closest('.create-lab');if(lab){vscode.postMessage({type:'createModuleLab',moduleNumber:Number(lab.dataset.moduleNumber)});return}handleQuestionClick(e,el)};}
function handleQuestionClick(e,root){const save=e.target.closest('.save');if(save){vscode.postMessage({type:'toggleSave',questionId:save.dataset.q,learning:state.learning});return}const check=e.target.closest('.check');if(!check)return;const id=check.dataset.q,prefix=check.dataset.prefix||'',chosen=root.querySelector('input[name="'+prefix+id+'"]:checked'),out=document.getElementById(prefix+'ex-'+id);if(!chosen){out.hidden=false;out.textContent='Choose an answer before requesting feedback.';return}check.disabled=true;vscode.postMessage({type:'practiceAnswer',questionId:id,selectedIndex:Number(chosen.value),confidence:root.querySelector('[data-confidence-q="'+id+'"]')?.value||'medium',learning:state.learning});}
function requestPractice(){const focus=document.getElementById('practice-focus')?.value||'recommended',moduleNumber=Number(document.getElementById('practice-module')?.value||0);vscode.postMessage({type:'practiceSelect',focus,moduleNumber,learning:state.learning});}
function renderPractice(){const el=document.getElementById('practice');const moduleOptions='<option value="0">All modules</option>'+DATA.modules.map(m=>'<option value="'+m.number+'">'+m.number+'. '+esc(m.title)+'</option>').join('');el.innerHTML='<p class="eyebrow">Short retrieval · explanation · spaced review</p><h1>Five-question practice</h1><div class="notice"><strong>Local formative practice only.</strong> Attempts, confidence, saves, and review dates remain on this device; they are not grades or mastery claims.</div><div class="practice-controls"><label>Focus <select id="practice-focus"><option value="recommended">Recommended</option><option value="due">Due now</option><option value="saved">Saved</option><option value="all">All</option></select></label><label>Topic <select id="practice-module">'+moduleOptions+'</select></label><button id="practice-start">Build five-question set</button></div><div id="practice-set">'+(practiceQuestions.length?practiceQuestions.map(q=>'<article class="card">'+questionHtml(q,'practice-').replace('<div class="actions">','<label>Confidence <select data-confidence-q="'+q.id+'"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></label><div class="actions">')+'</article>').join(''):'<p class="muted">Choose a focus and start a five-question session. A due or saved filter may return fewer than five.</p>')+'</div><h2>Per-topic analytics</h2><div id="analytics">'+analyticsTable()+'</div>';el.querySelector('#practice-start').onclick=requestPractice;el.onclick=e=>handleQuestionClick(e,el);}
function analyticsTable(){return analytics.length?'<table class="analytics"><thead><tr><th>Module</th><th>Attempted</th><th>Accuracy</th><th>Due</th><th>Saved</th><th>Confident misses</th></tr></thead><tbody>'+analytics.map(a=>'<tr><td>'+a.moduleNumber+'. '+esc(a.title)+'</td><td>'+a.attemptedQuestions+'/'+a.totalQuestions+'</td><td>'+(a.accuracy===undefined?'—':a.accuracy.toFixed(0)+'%')+'</td><td>'+a.due+'</td><td>'+a.saved+'</td><td>'+a.confidentMisses+'</td></tr>').join('')+'</tbody></table>':'<p class="muted">Analytics appear after the first practice set is prepared.</p>';}
function renderLabs(){const el=document.getElementById('labs');el.innerHTML='<p class="eyebrow">Predict → run → capture → explain</p><h1>Guided OS labs</h1><div class="notice"><strong>Formative starters, not assignment solutions.</strong> Every starter is tied to a module and source. Create it in a new folder; nothing is overwritten. Use current Canvas instructions for assessed work and xv6.</div><section class="card"><p class="pill">Executed in QEMU</p><h2>Pinned MIT x86 xv6 reference path</h2><p>The extension can create a solution-free workspace at the exact source revision used in release validation. Its public preflight checks PA1A build/boot, PA1B instrumentation behavior, and the historical PA2 FQ/AQ scheduler behavior plus upstream <code>usertests</code>.</p><div class="actions"><button data-command="systemstudioOs.prepareXv6">Prepare pinned xv6 workspace</button><button data-command="systemstudioOs.verifyXv6" class="secondary">Run assignment preflight</button><button data-command="systemstudioOs.openXv6Guide" class="quiet">Open xv6 guide</button></div><p class="muted">This is verified reference behavior, not proof that Fall 2026 Canvas will use the same revision or specification.</p></section><div class="module-list">'+DATA.labs.map(lab=>{const done=new Set(state.labSteps[lab.id]||[]);return '<article class="card" id="lab-'+lab.id+'"><p class="pill">Module '+lab.moduleNumber+'</p><h2 tabindex="-1">'+esc(lab.title)+'</h2><p>'+esc(lab.purpose)+'</p><p class="source"><strong>Grounding:</strong> '+esc(lab.source)+'</p><div class="checklist">'+lab.steps.map((s,i)=>'<label><input type="checkbox" data-lab="'+lab.id+'" data-step="'+s.id+'" '+(done.has(s.id)?'checked':'')+'><span><strong>'+(i+1)+'. '+esc(s.instruction)+'</strong><br>Evidence: '+esc(s.evidence)+'</span></label>').join('')+'</div><p><strong>Run:</strong> <code>'+esc(lab.runCommand)+'</code></p><p><strong>Reflect:</strong> '+esc(lab.reflection)+'</p><button class="create-lab" data-module-number="'+lab.moduleNumber+'">Create this starter safely</button></article>'}).join('')+'</div>';el.onchange=e=>{if(e.target.dataset.lab){const values=new Set(state.labSteps[e.target.dataset.lab]||[]);e.target.checked?values.add(e.target.dataset.step):values.delete(e.target.dataset.step);state.labSteps[e.target.dataset.lab]=[...values];persist();renderProgress()}};el.onclick=e=>{const b=e.target.closest('.create-lab');if(b)vscode.postMessage({type:'createModuleLab',moduleNumber:Number(b.dataset.moduleNumber)})};bindCommands(el);}
function renderSimulations(){const el=document.getElementById('simulations'),practiced=DATA.simulations.filter(s=>(state.simulationRuns[s.id]?.practice||0)>0).length,revealed=DATA.simulations.filter(s=>(state.simulationRuns[s.id]?.reveal||0)>0).length;el.innerHTML='<p class="eyebrow">Official OSTEP tools · predict first · reveal second</p><h1>Chapter-mapped simulations</h1><div class="notice"><strong>15 release-tested presets from the official OSTEP homework repository.</strong> The extension fetches the exact pinned revision after consent and never bundles or changes upstream code. A practice run omits <code>-c</code>; reveal adds <code>-c</code> only after you confirm that your prediction is recorded.</div><div class="grid"><article class="card"><p class="result">'+practiced+'/15</p><p>tools practiced locally</p></article><article class="card"><p class="result">'+revealed+'/15</p><p>computed traces revealed after confirmation</p></article></div><div class="actions"><button data-command="systemstudioOs.prepareOstepSimulators">Prepare pinned simulator workspace</button><button data-command="systemstudioOs.openOstepSimulatorGuide" class="secondary">Open local workflow guide</button><button class="quiet simulator-source" data-url="'+esc(DATA.simulatorSource.page)+'">Open author documentation</button></div><p class="source"><strong>Pinned source revision:</strong> <code>'+esc(DATA.simulatorSource.commit)+'</code></p><div class="module-list">'+DATA.simulations.map(s=>{const runs=state.simulationRuns[s.id]||{practice:0,reveal:0};return '<article class="card" id="sim-'+s.id+'"><p class="pill">Module '+s.moduleNumber+' · '+esc(s.chapter)+'</p><h2>'+esc(s.title)+'</h2><p>'+esc(s.purpose)+'</p><p><strong>Prepare:</strong> '+esc(s.priorKnowledge)+'</p><p><strong>Predict:</strong> '+esc(s.predict)+'</p><p><strong>Explain after checking:</strong> '+esc(s.explain)+'</p>'+simulatorButtons(s)+'<p class="muted" aria-live="polite">Local record: '+(runs.practice||0)+' prediction run'+((runs.practice||0)===1?'':'s')+' · '+(runs.reveal||0)+' reveal'+((runs.reveal||0)===1?'':'s')+'. This is not a grade.</p></article>'}).join('')+'</div>';el.onclick=e=>{const sim=e.target.closest('.run-sim');if(sim){vscode.postMessage({type:'runOstepSimulator',id:sim.dataset.simId,mode:sim.dataset.simMode});return}const source=e.target.closest('.simulator-source');if(source)external(source.dataset.url)};bindCommands(el);}
function courseworkState(id){return state.coursework[id]||{status:'not-started',evidence:[]};}
function openLab(id){show('labs');const card=document.getElementById('lab-'+id);if(card){card.scrollIntoView({behavior:'smooth',block:'start'});card.querySelector('h2')?.focus()}}
function renderCoursework(){const el=document.getElementById('coursework'),scores={'not-started':0,planning:1,working:2,'ready-to-submit':3,submitted:4,'receipt-confirmed':5},points=DATA.coursework.reduce((n,x)=>n+(scores[courseworkState(x.id).status]||0),0),pathPercent=Math.round(points/(DATA.coursework.length*5)*100);el.innerHTML='<p class="eyebrow">Mission control · 3 homework · 4 programming components</p><h1>Coursework planning and evidence</h1><div class="notice warning"><strong>Not an assignment sheet or gradebook.</strong> Fall 2026 wording, files, tests, dates, teams, AI rules, and submission requirements come only from Canvas.</div><section class="card"><h2>My self-reported coursework pathway</h2><p class="result">'+pathPercent+'%</p><progress max="100" value="'+pathPercent+'" aria-label="Self-reported coursework planning progression">'+pathPercent+'%</progress><p class="muted">This visualization reflects only the local status choices below. It is not completion evidence, an instructor evaluation, or a Canvas grade.</p></section><div class="actions"><button data-command="systemstudioOs.openCanvas">Open Canvas</button><button id="import-ics" class="secondary">Review Canvas calendar file</button></div><div id="ics-review"></div><div class="module-list">'+DATA.coursework.map((x,i)=>{const p=courseworkState(x.id),evidence=new Set(p.evidence||[]),routes=x.practiceLabIds.map(id=>DATA.labs.find(l=>l.id===id)).filter(Boolean);return '<article class="card"><p class="pill">'+x.kind+'</p><h2>'+(i+1)+'. '+esc(x.title)+'</h2><p>'+esc(x.focus)+'</p><p><strong>Mapped modules:</strong> '+x.modules.join(', ')+'</p><div class="notice"><strong>Release-tested formative routes:</strong> these public starters exercise prerequisite behavior without supplying an assignment answer.<div class="actions">'+routes.map(l=>'<button class="course-lab secondary" data-lab-id="'+l.id+'">Module '+l.moduleNumber+': '+esc(l.title)+'</button>').join('')+'</div></div><label>Status — local planning only <select data-course-status="'+x.id+'"><option value="not-started">Not started</option><option value="planning">Planning</option><option value="working">Working</option><option value="ready-to-submit">Ready to compare with Canvas</option><option value="submitted">Submitted — self-reported</option><option value="receipt-confirmed">Canvas receipt confirmed — self-reported</option></select></label><h3>Evidence checklist</h3><div class="checklist">'+x.evidence.map((y,j)=>'<label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-e'+j+'" '+(evidence.has(x.id+'-e'+j)?'checked':'')+'><span>'+esc(y)+'</span></label>').join('')+'<label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-canvas"><span>I opened the current Canvas assignment and checked requirements, due date, allowed help/AI, files, and submission route.</span></label><label><input type="checkbox" data-course-evidence="'+x.id+'" value="'+x.id+'-receipt"><span>I submitted in Canvas and reopened the receipt/files; a local folder is not a submission.</span></label></div><div class="actions"><button class="validate-evidence secondary" data-item="'+x.id+'">Validate selected local files</button><button data-command="systemstudioOs.openCanvas" class="quiet">Open official Canvas record</button></div><div id="validation-'+x.id+'" aria-live="polite"></div></article>'}).join('')+'</div><h2>Reviewed Canvas reminders</h2><div id="saved-events">'+eventsHtml(state.canvasEvents)+'</div>';el.querySelectorAll('[data-course-status]').forEach(s=>s.value=courseworkState(s.dataset.courseStatus).status);el.onchange=e=>{if(e.target.dataset.courseStatus){const p=courseworkState(e.target.dataset.courseStatus);state.coursework[e.target.dataset.courseStatus]={...p,status:e.target.value};persist();renderCoursework();renderProgress()}if(e.target.dataset.courseEvidence){const p=courseworkState(e.target.dataset.courseEvidence),set=new Set(p.evidence||[]);e.target.checked?set.add(e.target.value):set.delete(e.target.value);state.coursework[e.target.dataset.courseEvidence]={...p,evidence:[...set]};persist()}};el.onclick=e=>{if(e.target.id==='import-ics'){vscode.postMessage({type:'importIcs'});return}const route=e.target.closest('.course-lab');if(route){openLab(route.dataset.labId);return}const validate=e.target.closest('.validate-evidence');if(validate){vscode.postMessage({type:'validateEvidence',itemId:validate.dataset.item});return}const open=e.target.closest('[data-event-url]');if(open)external(open.dataset.eventUrl)};bindCommands(el);renderIcsReview();}
function eventsHtml(events){return events.length?'<div class="card"><p><strong>'+events.length+' reviewed local reminder(s).</strong> These do not replace Canvas.</p>'+events.slice(0,50).map(e=>'<p><strong>'+esc(e.title)+'</strong><br>'+esc(e.allDay?e.startsAt:new Date(e.startsAt).toLocaleString())+(e.url?'<br><button class="quiet" data-event-url="'+esc(e.url)+'">Open Canvas item</button>':'')+'</p>').join('')+'</div>':'<p class="muted">No Canvas calendar events have been reviewed and kept locally.</p>';}
function renderIcsReview(){const root=document.getElementById('ics-review');if(!root)return;root.innerHTML=icsPreview.length?'<div class="card notice warning"><h2>Review before keeping</h2><p>This calendar may contain unrelated courses. Check every title/date and use Canvas as the authority. Unsafe/non-Canvas URLs were removed.</p>'+eventsHtml(icsPreview)+'<div class="actions"><button id="keep-ics">Keep this reviewed list locally</button><button id="discard-ics" class="secondary">Discard preview</button></div></div>':'';root.querySelector('#keep-ics')?.addEventListener('click',()=>{state.canvasEvents=icsPreview.slice(0,500);icsPreview=[];persist();renderCoursework()});root.querySelector('#discard-ics')?.addEventListener('click',()=>{icsPreview=[];renderIcsReview()});}
const gradeLabels={participation:'Participation / Canvas quizzes',homework:'Homework category',programming:'Programming category',midterm:'Midterm examination',finalExam:'Final examination'};
const gradeWeights={participation:.10,homework:.15,programming:.40,midterm:.15,finalExam:.20};
const gradeCuts=[[96.67,'A+'],[93.34,'A'],[90,'A−'],[86.67,'B+'],[83.34,'B'],[80,'B−'],[76.67,'C+'],[73.34,'C'],[70,'C−'],[66.67,'D+'],[63.34,'D'],[60,'D−'],[0,'E']];
function gradeLetter(percent){return gradeCuts.find(x=>percent>=x[0])[1]}
function renderGrades(){const el=document.getElementById('grades'),targets=gradeCuts.filter(x=>x[1]!=='E');el.innerHTML='<p class="eyebrow">Private what-if planning · manually entered</p><h1>Grade predictor</h1><div class="notice warning"><strong>Planning estimate—not an official grade or confirmed Fall 2026 policy.</strong> The 10% / 15% / 40% / 15% / 20% weights and letter thresholds are carried forward from the verified Winter 2026 syllabus. Copy current category percentages from Canvas or enter a clearly understood what-if value. The OS policy has no verified two-lowest-score drop rule, so this predictor drops nothing.</div><form id="grade-form" class="card"><h2>Canvas category percentages or what-if estimates</h2><p class="muted">Use the category percentage reported by Canvas when available. This avoids incorrectly assuming that items with different point values are equally weighted.</p><div class="grade-grid">'+Object.keys(gradeLabels).map(k=>'<label for="g-'+k+'">'+gradeLabels[k]+' · '+Math.round(gradeWeights[k]*100)+'%</label><input id="g-'+k+'" data-grade="'+k+'" aria-label="'+gradeLabels[k]+' percentage" type="number" min="0" max="100" step="0.01" inputmode="decimal" value="'+esc(state.grade[k])+'" required>').join('')+'<label for="grade-target">Target course grade</label><select id="grade-target">'+targets.map(x=>'<option value="'+x[0]+'" '+(String(state.gradeTarget)===String(x[0])?'selected':'')+'>'+x[1]+' · '+Number(x[0]).toFixed(2)+'%</option>').join('')+'</select></div><div class="actions"><button type="submit">Calculate projection</button><button type="button" id="clear-grade" class="secondary">Clear local entries</button><button type="button" data-command="systemstudioOs.openCanvas" class="quiet">Open official Canvas grades</button></div></form><div id="grade-result" aria-live="polite"></div><section class="card"><h2>How to interpret this predictor</h2><ul><li><strong>Projected course result</strong> uses all five values, including the final-exam what-if value.</li><li><strong>Standing before the final</strong> normalizes the first four weighted categories over their combined 80% course weight.</li><li><strong>Needed on the final</strong> solves for the selected target using the entered first-four-category values.</li><li>Unpublished scores, excused work, extra credit, category rules, policy changes, and instructor adjustments can make Canvas differ.</li></ul><p>Nothing is read from or written to Canvas. Values stay in this VS Code webview state and can be cleared above or with the full local-data reset.</p></section>';el.querySelectorAll('[data-grade]').forEach(input=>input.oninput=()=>{state.grade[input.dataset.grade]=input.value;persist()});el.querySelector('#grade-target').onchange=e=>{state.gradeTarget=e.target.value;persist()};el.querySelector('#grade-form').onsubmit=e=>{e.preventDefault();calculateGrade()};el.querySelector('#clear-grade').onclick=()=>{state.grade=Object.assign({},defaults.grade);state.gradeTarget=defaults.gradeTarget;persist();renderGrades()};bindCommands(el);if(Object.keys(gradeLabels).every(k=>state.grade[k]!==''))calculateGrade()}
function calculateGrade(){const keys=Object.keys(gradeLabels),values=keys.map(k=>Number(state.grade[k])),out=document.getElementById('grade-result');if(values.some(x=>!Number.isFinite(x)||x<0||x>100)||keys.some(k=>state.grade[k]==='')){out.innerHTML='<div class="notice warning"><strong>Complete all five fields.</strong> Enter percentages from 0 through 100. Use a what-if estimate for an unfinished category.</div>';return}const contributions=Object.fromEntries(keys.map((k,i)=>[k,values[i]*gradeWeights[k]])),projected=Object.values(contributions).reduce((sum,value)=>sum+value,0),pointsBeforeFinal=contributions.participation+contributions.homework+contributions.programming+contributions.midterm,currentStanding=pointsBeforeFinal/.80,target=Number(state.gradeTarget),required=(target-pointsBeforeFinal)/gradeWeights.finalExam,targetLabel=gradeCuts.find(x=>x[0]===target)?.[1]||target.toFixed(2)+'%';let targetMessage;if(required<=0)targetMessage='The entered pre-final categories already contribute enough weighted points for '+targetLabel+' even with 0% on the final. Confirm all remaining-work and course-policy assumptions in Canvas.';else if(required>100)targetMessage=targetLabel+' is not reachable through the final exam alone from these entered category values; the calculated requirement is '+required.toFixed(2)+'%.';else targetMessage='You would need approximately '+required.toFixed(2)+'% on the final examination to reach '+targetLabel+' ('+target.toFixed(2)+'% overall).';out.innerHTML='<div class="grade-summary"><article class="card"><p class="grade-number">'+projected.toFixed(2)+'% · '+gradeLetter(projected)+'</p><p>Projected course result using the entered final-exam value</p></article><article class="card"><p class="grade-number">'+currentStanding.toFixed(2)+'%</p><p>Normalized standing across the first 80% of the carried-forward policy</p></article></div><div class="notice"><strong>Target calculation:</strong> '+esc(targetMessage)+'</div><table class="contribution"><caption>Weighted contribution breakdown</caption><thead><tr><th scope="col">Category</th><th scope="col">Entered</th><th scope="col">Weight</th><th scope="col">Course points</th></tr></thead><tbody>'+keys.map((k,i)=>'<tr><th scope="row">'+gradeLabels[k]+'</th><td>'+values[i].toFixed(2)+'%</td><td>'+Math.round(gradeWeights[k]*100)+'%</td><td>'+contributions[k].toFixed(2)+'</td></tr>').join('')+'</tbody></table><p class="muted"><strong>Boundary:</strong> historical-policy local prediction only. Canvas and the instructor determine the official Fall 2026 calculation.</p>'}
function renderProgress(){const values={"not-started":0,preparing:1,practicing:2,confident:3};let pts=0;DATA.modules.forEach(m=>pts+=values[state.moduleStatus[m.id]||'not-started']);const percent=Math.round(pts/(DATA.modules.length*3)*100),attempts=state.learning.attempts||[],correct=attempts.filter(x=>x.correct).length,labDone=Object.values(state.labSteps).reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0),simPractice=DATA.simulations.filter(s=>(state.simulationRuns[s.id]?.practice||0)>0).length,simReveal=DATA.simulations.filter(s=>(state.simulationRuns[s.id]?.reveal||0)>0).length,courseReady=DATA.coursework.filter(x=>['ready-to-submit','submitted','receipt-confirmed'].includes(courseworkState(x.id).status)).length;const rows=DATA.modules.map(m=>{const a=analytics.find(x=>x.moduleNumber===m.number);return '<tr><td>'+m.number+'. '+esc(m.title)+'</td><td>'+esc((state.moduleStatus[m.id]||'not-started').replaceAll('-',' '))+'</td><td>'+(state.confidence[m.id]||'—')+'</td><td>'+(a?.attemptedQuestions||0)+'/8</td><td>'+(a?.due||0)+'</td></tr>'}).join('');const el=document.getElementById('progress');el.innerHTML='<p class="eyebrow">Private · local · self-evaluation</p><h1>My learning progress</h1><div class="grid"><div class="card"><p class="result">'+percent+'%</p><p>Self-reported module pathway</p><progress max="100" value="'+percent+'">'+percent+'%</progress></div><div class="card"><p class="result">'+attempts.length+'</p><p>Practice attempts · '+(attempts.length?Math.round(correct/attempts.length*100)+'% observed accuracy':'no accuracy yet')+'</p></div><div class="card"><p class="result">'+simPractice+'/15</p><p>Official simulator presets practiced · '+simReveal+' revealed after confirmation</p></div><div class="card"><p class="result">'+labDone+'</p><p>Guided-lab evidence steps checked</p></div><div class="card"><p class="result">'+courseReady+'/'+DATA.coursework.length+'</p><p>Coursework items locally marked ready or later</p></div></div><div class="notice"><strong>These indicators are not grades or instructor evaluations.</strong> They stay in this VS Code webview state and are not sent to Canvas. Official assessment and feedback are recorded in Canvas.</div><table><thead><tr><th>Module</th><th>Local status</th><th>Confidence</th><th>Questions tried</th><th>Due</th></tr></thead><tbody>'+rows+'</tbody></table><h2>Practice analytics</h2>'+analyticsTable()+'<div class="actions"><button id="open-grade-planner">Open grade predictor</button><button id="reset-local" class="secondary">Reset all local learning data</button></div>';el.querySelector('#open-grade-planner').onclick=()=>show('grades');el.querySelector('#reset-local').onclick=()=>{if(confirm('Reset local module status, confidence, practice history, simulator counts, saved/review questions, lab checkmarks, coursework planning, reviewed calendar events, and grade inputs? Canvas is not affected.')){const keepSection=state.section;state=Object.assign({},defaults,{section:keepSection,walkthroughOpen:false});practiceQuestions=[];analytics=[];icsPreview=[];persist();renderAll();show('progress');requestPractice()}};}
function renderHelp(){
  const el=document.getElementById('help');
  el.innerHTML='<p class="eyebrow">Structured FAQ · offline coach · student-controlled Canvas handoff</p><h1>Questions and help</h1><section><h2>Start here when blocked</h2><div class="grid"><article class="card"><h3>Compiler, Docker, or Make is missing</h3><p>Run the non-mutating environment check first. Then open the official cross-platform setup guide and use the one visible course container.</p><div class="actions"><button data-command="systemstudioOs.checkEnvironment">Check environment</button><button data-command="systemstudioOs.openPortableSetup" class="secondary">Open setup guide</button></div></article><article class="card"><h3>QEMU or xv6 fails—especially on Apple silicon</h3><p>Use the headless linux/amd64 Docker preflight. It avoids the graphical emulator input path and preserves the first actionable failure.</p><div class="actions"><button data-command="systemstudioOs.prepareXv6">Prepare clean reference</button><button data-command="systemstudioOs.verifyXv6" class="secondary">Run xv6 preflight</button></div></article><article class="card"><h3>I know the algorithm but not where it belongs</h3><p>Ask the helper to route an invariant, trace, or first mismatch to the right module; it will not write the assessed implementation.</p><button class="quick" data-question="I can describe the scheduler on paper, but how do I identify the xv6 state transitions, timer accounting, and lock invariant I should inspect first?">Build a debugging route</button></article><article class="card"><h3>I am unsure what evidence to submit</h3><p>Open the current Canvas rubric first. Use local preflights to generate formative evidence, then verify required files and reopen the Canvas receipt.</p><div class="actions"><button data-command="systemstudioOs.openCanvas">Open Canvas course</button><button class="quick secondary" data-question="Help me build an evidence checklist from a requirement without doing the assignment for me.">Plan evidence</button></div></article></div></section><section class="card"><h2>Optional animated learning companion</h2><label><input id="companion-enabled" type="checkbox"> Show the original SystemStudio OS companion button</label><p class="muted">It only opens local course tools. The animation follows your reduced-motion setting, uses no external artwork, and can be hidden at any time.</p></section><section class="card"><h2>Ask the offline OS learning helper</h2><p>It maps your question to course content and refuses submission-ready assessed work. It has no LLM or AI-service account and sends no question off this machine.</p><label for="question"><strong>Your question</strong></label><textarea id="question" placeholder="State the concept, prediction, evidence, and smallest mismatch."></textarea><div class="actions"><button id="ask">Ask helper</button><button class="quick" data-question="Can you give me the answer to homework 2?">Test the integrity boundary</button></div><div id="tutor-result" class="card" hidden aria-live="polite"></div></section><section><h2>Frequently asked questions</h2>'+DATA.faqs.map(f=>'<details><summary>'+esc(f.question)+'</summary><p>'+esc(f.answer)+'</p></details>').join('')+'</section><section class="card"><h2>Ask before class through Canvas</h2><p>The extension prepares and copies a draft; it does not post, impersonate you, send email, or promise anonymity. You review the course, recipient, visibility, and content in Canvas.</p><label>Topic<input id="pre-topic" maxlength="160"></label><label>Focused question<textarea id="pre-question" maxlength="2000"></textarea></label><label>What I understand so far<textarea id="pre-understanding" maxlength="2000"></textarea></label><label>What I tried or checked<textarea id="pre-attempted" maxlength="2000"></textarea></label><fieldset><legend>Canvas route</legend><label><input type="radio" name="pre-route" value="discussion" checked> Configured discussion</label><label><input type="radio" name="pre-route" value="private-message"> Configured private message/Inbox route</label></fieldset><label><input id="pre-anon" type="checkbox"> I would prefer anonymity if Canvas explicitly offers it</label><p class="muted">Checking this box does not make the post anonymous. Confirm the actual Canvas control before posting.</p><div class="actions"><button id="compose">Copy draft and open Canvas</button><button data-command="systemstudioOs.configureCanvas" class="secondary">Configure routes</button></div></section><div class="notice"><strong>Academic-integrity boundary:</strong> Ask for concept explanations, one hint, an analogous example, error interpretation, or feedback on your own reasoning. Do not request or submit generated answers, code, calculations, traces, or prose as your own. The current Canvas rules control each assessed task.</div>';
  const enabled=el.querySelector('#companion-enabled');enabled.checked=state.companionEnabled!==false;enabled.onchange=()=>{state.companionEnabled=enabled.checked;if(!enabled.checked)state.companionOpen=false;persist();renderCompanion()};
  el.querySelector('#ask').onclick=()=>vscode.postMessage({type:'tutor',question:el.querySelector('#question').value});
  el.querySelectorAll('.quick').forEach(button=>button.onclick=e=>{el.querySelector('#question').value=e.currentTarget.dataset.question;el.querySelector('#ask').click();el.querySelector('#question').scrollIntoView({behavior:'smooth',block:'center'})});
  el.querySelector('#compose').onclick=()=>vscode.postMessage({type:'composePreClass',draft:{topic:el.querySelector('#pre-topic').value,question:el.querySelector('#pre-question').value,understanding:el.querySelector('#pre-understanding').value,attempted:el.querySelector('#pre-attempted').value,route:el.querySelector('input[name="pre-route"]:checked').value,anonymityRequested:el.querySelector('#pre-anon').checked}});
  bindCommands(el);
}
let companionReturnFocus=null;
function closeCompanion(restore=true){state.companionOpen=false;persist();renderCompanion();if(restore)companionReturnFocus?.focus?.()}
function renderCompanion(){
  const shell=document.getElementById('companion'),panel=document.getElementById('companion-panel'),launch=document.getElementById('companion-launch');
  shell.hidden=state.companionEnabled===false;
  if(shell.hidden){panel.hidden=true;return}
  panel.hidden=!state.companionOpen;launch.setAttribute('aria-expanded',String(state.companionOpen));
  launch.onclick=()=>{companionReturnFocus=launch;state.companionOpen=!state.companionOpen;persist();renderCompanion();if(state.companionOpen)document.getElementById('companion-title').focus()};
  document.getElementById('companion-help').onclick=()=>{closeCompanion(false);show('help');requestAnimationFrame(()=>document.getElementById('question')?.focus())};
  document.getElementById('companion-practice').onclick=()=>{closeCompanion(false);show('practice');requestPractice()};
  document.getElementById('companion-hide').onclick=()=>{state.companionEnabled=false;state.companionOpen=false;persist();renderCompanion();show('help');renderHelp();document.getElementById('companion-enabled')?.focus()};
}
function renderWalkthrough(){const root=document.getElementById('walkthrough');root.hidden=!state.walkthroughOpen;if(root.hidden)return;const index=Math.max(0,Math.min(DATA.walkthrough.length-1,Number(state.walkthroughStep)||0)),step=DATA.walkthrough[index];document.getElementById('walk-title').textContent=step.title;document.getElementById('walk-detail').textContent=step.detail;document.getElementById('walk-count').textContent='Step '+(index+1)+' of '+DATA.walkthrough.length;document.getElementById('walk-dots').innerHTML=DATA.walkthrough.map((_,i)=>'<span class="dot '+(i===index?'current':'')+'" aria-label="Step '+(i+1)+(i===index?', current':'')+'"></span>').join('');document.getElementById('walk-prev').disabled=index===0;document.getElementById('walk-next').textContent=index===DATA.walkthrough.length-1?'Finish':'Next';document.getElementById('walk-prev').onclick=()=>{state.walkthroughStep=index-1;persist();renderWalkthrough()};document.getElementById('walk-next').onclick=()=>{if(index===DATA.walkthrough.length-1){state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'completed'})}else{state.walkthroughStep=index+1;persist()}renderWalkthrough()};document.getElementById('walk-skip').onclick=()=>{state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'skipped'});renderWalkthrough()};document.getElementById('walk-title').focus?.();}
let walkthroughReturnFocus=null,noticeReturnFocus=null;
function showNotice(text){noticeReturnFocus=document.activeElement;document.getElementById('global-notice-text').textContent=text;document.getElementById('global-notice').hidden=false;document.getElementById('global-notice-close').focus()}
document.getElementById('global-notice-close').onclick=()=>{document.getElementById('global-notice').hidden=true;noticeReturnFocus?.focus?.()};
window.addEventListener('message',e=>{const m=e.data;if(m.type==='tutorReply'){const r=m.reply,out=document.getElementById('tutor-result');out.hidden=false;out.innerHTML='<p class="pill">'+esc(r.mode)+'</p><h2>'+esc(r.title)+'</h2><p>'+esc(r.response)+'</p><ol>'+r.prompts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';if(r.moduleNumber)out.innerHTML+='<button id="open-map">Open Module '+r.moduleNumber+'</button>';out.querySelector('#open-map')?.addEventListener('click',()=>openModule(r.moduleNumber))}if(m.type==='selectModule')openModule(m.number);if(m.type==='practiceSet'){practiceQuestions=m.questions;state.learning=m.learning;analytics=m.analytics;persist();renderPractice();renderProgress()}if(m.type==='practiceResult'){state.learning=m.state;analytics=m.analytics;persist();const q=DATA.modules.flatMap(x=>x.questions).find(x=>x.id===m.questionId);['module-','practice-'].forEach(prefix=>{const out=document.getElementById(prefix+'ex-'+m.questionId);if(out&&q){out.hidden=false;out.innerHTML=(m.correct?'<strong>Correct.</strong> ':'<strong>Not yet.</strong> ')+esc(q.explanation)+'<br><strong>Next review:</strong> '+new Date(m.nextReviewAt).toLocaleString()+'<br><strong>Source:</strong> '+esc(q.source)}});document.querySelectorAll('[data-q="'+m.questionId+'"].check').forEach(b=>b.disabled=false);renderProgress()}if(m.type==='learningState'){state.learning=m.learning;analytics=m.analytics;persist();renderModules();renderPractice();renderProgress()}if(m.type==='simulationResult'){const prior=state.simulationRuns[m.id]||{practice:0,reveal:0};state.simulationRuns[m.id]={...prior,[m.mode]:(prior[m.mode]||0)+1,lastRunAt:new Date().toISOString(),route:m.route};persist();renderSimulations();renderProgress();showNotice((m.mode==='practice'?'Prediction problem completed. Record your work before revealing the computed trace.':'Computed trace revealed. Explain the first mismatch before moving on.')+' This local record is not a grade.')}if(m.type==='icsPreview'){icsPreview=m.events;show('coursework');renderCoursework()}if(m.type==='evidenceValidation'){const out=document.getElementById('validation-'+m.itemId);if(out)out.innerHTML='<div class="explanation"><strong>Local file check</strong><ul>'+m.result.lines.map(x=>'<li>'+esc(x)+'</li>').join('')+m.result.warnings.map(x=>'<li><strong>Review:</strong> '+esc(x)+'</li>').join('')+'</ul><p>This did not package, upload, submit, or grade any file.</p></div>'}if(m.type==='notice')showNotice(m.message)});
function openModule(n){show('modules');const card=document.getElementById('module-'+n);if(card){const btn=card.querySelector('.toggle'),content=card.querySelector('.module-content');content.hidden=false;btn.setAttribute('aria-expanded','true');btn.lastElementChild.textContent='−';card.scrollIntoView({behavior:'smooth',block:'start'});btn.focus()}}
function addCourseworkExecutionControls(){document.querySelectorAll('#coursework .module-list>article.card').forEach((card,index)=>{const item=DATA.coursework[index];if(!item||card.querySelector('.course-execution-actions'))return;const xv6=['pa1a','pa1b','pa2'].includes(item.id),portable=['hw1','hw2','hw3','pa3'].includes(item.id);if(!xv6&&!portable)return;const actions=document.createElement('div');actions.className='actions course-execution-actions';const run=document.createElement('button');run.className='secondary';run.textContent=xv6?'Run '+item.id.toUpperCase()+' xv6 preflight':'Run '+item.id.toUpperCase()+' prerequisite preflight';run.setAttribute('aria-label',(xv6?'Run local xv6 behavioral preflight for ':'Run portable compiler and prerequisite preflight for ')+item.title);run.onclick=()=>vscode.postMessage(xv6?{type:'verifyXv6',mode:item.id}:{type:'runCourseworkPreflight',itemId:item.id});const guide=document.createElement('button');guide.className='quiet';guide.textContent=xv6?'Open pinned xv6 guide':'Open cross-platform setup';guide.setAttribute('aria-label',(xv6?'Open pinned xv6 guide for ':'Open cross-platform setup guide for ')+item.title);guide.onclick=()=>command(xv6?'systemstudioOs.openXv6Guide':'systemstudioOs.openPortableSetup');actions.append(run,guide);card.querySelector('label')?.before(actions)})}
function applyA11y(){const title=document.getElementById('walk-title'),walk=document.getElementById('walkthrough');title.tabIndex=-1;if(!walk.hidden&&!walk.contains(document.activeElement))title.focus();document.querySelectorAll('progress:not([aria-label])').forEach(p=>p.setAttribute('aria-label','Self-reported module learning pathway progress'));document.querySelectorAll('[data-course-status]').forEach(s=>{const item=DATA.coursework.find(x=>x.id===s.dataset.courseStatus);if(item)s.setAttribute('aria-label','Local planning status for '+item.title)});addCourseworkExecutionControls()}
function modalKeys(event){const walk=document.getElementById('walkthrough');if(walk.hidden)return;if(event.key==='Escape'){event.preventDefault();state.walkthroughOpen=false;persist();vscode.postMessage({type:'walkthroughStatus',status:'skipped'});renderWalkthrough();walkthroughReturnFocus?.focus?.();return}if(event.key!=='Tab')return;const controls=[...walk.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
document.addEventListener('keydown',modalKeys);document.addEventListener('click',event=>{if(event.target.closest('#rerun-walk'))walkthroughReturnFocus=event.target.closest('button');if(event.target.closest('#walk-next,#walk-skip'))queueMicrotask(()=>{if(document.getElementById('walkthrough').hidden)walkthroughReturnFocus?.focus?.()})});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.companionOpen&&document.getElementById('walkthrough').hidden){event.preventDefault();closeCompanion()}});
function renderAll(){renderHome();renderSchedule();renderModules();renderPractice();renderLabs();renderSimulations();renderCoursework();renderGrades();renderProgress();renderHelp();renderWalkthrough();renderCompanion();applyA11y()}
new MutationObserver(applyA11y).observe(document.getElementById('main'),{childList:true,subtree:true});renderAll();show(state.section||'home');requestPractice();
</script></body></html>`;
}
