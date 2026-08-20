import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { COURSE, COURSEWORK, MODULES, SOURCE_BOUNDARIES } from './courseData.js';
import { buildCalendar, tutorReply } from './core.js';

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
    vscode.commands.registerCommand('systemstudioOs.openCanvas', () => vscode.env.openExternal(vscode.Uri.parse(COURSE.canvasUrl))),
    vscode.commands.registerCommand('systemstudioOs.openSyllabus', () => openBundledHtml(context, 'syllabus', 'CIS450_ECE478_Fall2026_Syllabus.html')),
    vscode.commands.registerCommand('systemstudioOs.openAccessibleLessons', () => openBundledHtml(context, 'lessons', 'CIS450_ECE478_Fall2026_Accessible_Lessons.html')),
    vscode.commands.registerCommand('systemstudioOs.checkEnvironment', checkEnvironment),
    vscode.commands.registerCommand('systemstudioOs.createLabWorkspace', createLabWorkspace),
    vscode.commands.registerCommand('systemstudioOs.runCurrentC', runCurrentC),
    vscode.commands.registerCommand('systemstudioOs.exportCalendar', exportCalendar)
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
        action('Build and run current C file', 'systemstudioOs.runCurrentC', 'action', 'inside the course container')
      ];
    }
    if (element.kind === 'support') {
      return [
        action(`${COURSE.meeting} · ${COURSE.room}`, 'systemstudioOs.openLearningHub', 'info', 'verified Fall 2026 schedule'),
        action(`Instructor: ${COURSE.instructor}`, 'systemstudioOs.openLearningHub', 'info', COURSE.instructorOffice),
        action(`GSI: ${COURSE.gsiPreferred}`, 'systemstudioOs.openLearningHub', 'info', COURSE.gsiEmail),
        action('Export Fall 2026 calendar', 'systemstudioOs.exportCalendar', 'action', '27 class meetings'),
        action('Open Fall 2026 syllabus', 'systemstudioOs.openSyllabus', 'action', 'accessible HTML · instructor review required'),
        action('Open accessible lesson collection', 'systemstudioOs.openAccessibleLessons', 'action', '13 standalone HTML modules'),
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
      this.panel.webview.html = buildHubHtmlForTesting();
      this.panel.onDidDispose(() => { this.panel = undefined; hub = undefined; }, undefined, this.context.subscriptions);
      this.panel.webview.onDidReceiveMessage(async (message: { type?: string; question?: string; command?: string }) => {
        if (message.type === 'tutor') {
          this.panel?.webview.postMessage({ type: 'tutorReply', reply: tutorReply(message.question ?? '') });
        } else if (message.type === 'command' && typeof message.command === 'string') {
          const allowed = new Set(['systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.checkEnvironment', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar']);
          if (allowed.has(message.command)) await vscode.commands.executeCommand(message.command);
        } else if (message.type === 'openExternal' && typeof message.command === 'string') {
          const uri = vscode.Uri.parse(message.command);
          if (uri.scheme === 'https') await vscode.env.openExternal(uri);
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
  for (const [relative, contents] of Object.entries(files)) {
    const target = vscode.Uri.joinPath(root, ...relative.split('/'));
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(target, '..'));
    await vscode.workspace.fs.writeFile(target, Buffer.from(contents, 'utf8'));
  }
  const choice = await vscode.window.showInformationMessage(`Created the portable OS lab at ${root.fsPath}. Review the container recipe before running it.`, 'Open workspace');
  if (choice === 'Open workspace') await vscode.commands.executeCommand('vscode.openFolder', root, { forceNewWindow: true });
}

function workspaceFiles(): Record<string, string> {
  return {
    '.devcontainer/devcontainer.json': JSON.stringify({ name: 'CIS 450 / ECE 478 OS Lab', dockerComposeFile: '../compose.yaml', service: 'oslab', workspaceFolder: '/workspace', shutdownAction: 'stopCompose', customizations: { vscode: { extensions: ['ms-vscode.cpptools'] } } }, null, 2) + '\n',
    'compose.yaml': "services:\n  oslab:\n    build:\n      context: .\n      dockerfile: .devcontainer/Dockerfile\n    working_dir: /workspace\n    volumes:\n      - .:/workspace\n    stdin_open: true\n    tty: true\n",
    '.devcontainer/Dockerfile': "FROM ubuntu:22.04\nARG DEBIAN_FRONTEND=noninteractive\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n+    build-essential gcc-multilib gdb git make python3 python3-pip qemu-system-x86 strace valgrind ca-certificates \\\n+    && rm -rf /var/lib/apt/lists/*\nWORKDIR /workspace\nCMD [\"bash\"]\n",
    'src/main.c': "#include <stdio.h>\n#include <unistd.h>\n\nint main(void) {\n    printf(\"CIS 450 OS lab ready: pid=%ld\\n\", (long)getpid());\n    return 0;\n}\n",
    'Makefile': "CC=gcc\nCFLAGS=-Wall -Wextra -Wpedantic -g -pthread\n\nall: build/main\n\nbuild/main: src/main.c\n\tmkdir -p build\n\t$(CC) $(CFLAGS) $< -o $@\n\nrun: build/main\n\t./build/main\n\nclean:\n\trm -rf build\n",
    'README.md': `# CIS 450 / ECE 478 portable OS lab\n\nThis local workspace is a practice environment, not a submission. Canvas is authoritative.\n\n1. Review \`.devcontainer/Dockerfile\` and \`compose.yaml\`.\n2. Run \`docker compose run --rm oslab make run\`, or reopen in a VS Code Dev Container.\n3. Keep assessed work private. Do not put solutions in a public repository.\n4. Add xv6 only from the source/version named in the current Canvas assignment. Historical course documents used an older x86 xv6; do not assume that version for Fall 2026.\n`,
    'labs/START_HERE.md': '# Lab workflow\n\nPredict → run the smallest test → capture evidence → explain the invariant or translation → compare with Canvas requirements.\n'
  };
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

export function buildHubHtmlForTesting(): string {
  const data = JSON.stringify({ course: COURSE, modules: MODULES, coursework: COURSEWORK, boundaries: SOURCE_BOUNDARIES }).replaceAll('<', '\\u003c');
  const nonce = Math.random().toString(36).slice(2);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>${COURSE.title}</title><style nonce="${nonce}">
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font:15px/1.55 var(--vscode-font-family);display:grid;grid-template-columns:minmax(220px,280px) 1fr;min-height:100vh}a{color:var(--vscode-textLink-foreground)}button,input,select,textarea{font:inherit}button{border:1px solid var(--vscode-button-border,transparent);border-radius:5px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:.48rem .72rem;cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:focus-visible,input:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--vscode-focusBorder);outline-offset:2px}.skip{position:fixed;left:-10000px}.skip:focus{left:1rem;top:1rem;z-index:9}.nav{border-right:1px solid var(--vscode-panel-border);padding:1rem;position:sticky;top:0;height:100vh;overflow:auto}.nav h1{font-size:1.1rem}.nav button{width:100%;text-align:left;margin:.2rem 0;background:transparent;color:var(--vscode-foreground);border-color:transparent}.nav button[aria-current="page"]{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}main{padding:clamp(1rem,3vw,2.5rem);max-width:1100px;width:100%}.panel[hidden]{display:none}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--vscode-descriptionForeground)}.notice{border-left:5px solid var(--vscode-textLink-foreground);padding:.8rem 1rem;background:var(--vscode-textBlockQuote-background);margin:1rem 0}.warning{border-left-color:var(--vscode-editorWarning-foreground)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.card{border:1px solid var(--vscode-panel-border);border-radius:8px;padding:1rem;background:var(--vscode-sideBar-background)}.module-list{display:grid;gap:.7rem}.module{border:1px solid var(--vscode-panel-border);border-radius:8px}.module>button{width:100%;display:flex;justify-content:space-between;text-align:left;background:transparent;color:inherit;border:0;padding:1rem}.module-content{padding:0 1rem 1rem}.module-content[hidden]{display:none}.pill{display:inline-block;border:1px solid var(--vscode-panel-border);border-radius:999px;padding:.1rem .5rem;color:var(--vscode-descriptionForeground);font-size:.86rem}progress{width:100%;height:1rem}.question{border-top:1px solid var(--vscode-panel-border);padding-top:.8rem;margin-top:.8rem}.choice{display:block;margin:.45rem 0}.explanation{padding:.7rem;background:var(--vscode-textCodeBlock-background);border-radius:5px}.status-row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.status-row select{min-width:150px}.grade-grid{display:grid;grid-template-columns:minmax(180px,1fr) minmax(100px,160px);gap:.7rem;max-width:520px}.grade-grid input{padding:.45rem;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)}textarea{width:100%;min-height:110px;padding:.7rem;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)}.result{font-size:1.2rem;font-weight:700}.source-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.muted{color:var(--vscode-descriptionForeground)}@media(max-width:760px){body{display:block}.nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--vscode-panel-border)}.source-grid{grid-template-columns:1fr}}
</style></head><body><a class="skip" href="#main">Skip to content</a>
<nav class="nav" aria-label="Course sections"><h1>SystemStudio OS</h1><p class="muted">CIS 450 / ECE 478</p><div id="nav"></div><hr><p><strong>Canvas is authoritative</strong><br><span class="muted">Deadlines · submissions · official grades</span></p></nav>
<main id="main" tabindex="-1"><section id="home" class="panel"></section><section id="modules" class="panel" hidden></section><section id="coursework" class="panel" hidden></section><section id="progress" class="panel" hidden></section><section id="grade" class="panel" hidden></section><section id="help" class="panel" hidden></section></main>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi(), DATA=${data};
const defaults={section:'home',moduleStatus:{},answers:{},confidence:{},grade:{participation:'',homework:'',programming:'',midterm:'',finalExam:''}};
let state=Object.assign({},defaults,vscode.getState()||{}); state.moduleStatus=state.moduleStatus||{}; state.answers=state.answers||{}; state.confidence=state.confidence||{}; state.grade=Object.assign({},defaults.grade,state.grade||{});
const tabs=[['home','Course home'],['modules','13 learning modules'],['coursework','Coursework progression'],['progress','My local progress'],['grade','Grade estimate'],['help','Tutor and help']];
function esc(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function command(name){vscode.postMessage({type:'command',command:name});}
function external(url){vscode.postMessage({type:'openExternal',command:url});}
function persist(){vscode.setState(state);}
function show(id){state.section=id;persist();document.querySelectorAll('.panel').forEach(x=>x.hidden=x.id!==id);document.querySelectorAll('#nav button').forEach(x=>x.setAttribute('aria-current',x.dataset.id===id?'page':'false'));document.getElementById(id).focus?.();}
document.getElementById('nav').innerHTML=tabs.map(t=>'<button data-id="'+t[0]+'">'+t[1]+'</button>').join('');document.getElementById('nav').onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.id)};
function bindCommands(root){root.querySelectorAll('[data-command]').forEach(button=>{button.onclick=()=>command(button.dataset.command)});}
function renderHome(){const el=document.getElementById('home');el.innerHTML='<p class="eyebrow">Active student course material · Fall 2026</p><h1>'+esc(DATA.course.title)+'</h1><div class="notice"><strong>Verified meeting:</strong> '+esc(DATA.course.meeting)+', '+esc(DATA.course.room)+'.<br><strong>Instructor:</strong> '+esc(DATA.course.instructor)+' · '+esc(DATA.course.instructorOffice)+'<br><strong>GSI:</strong> '+esc(DATA.course.gsi)+' ('+esc(DATA.course.gsiPreferred)+')</div><div class="grid"><article class="card"><h2>Start this week</h2><ol><li>Open the current Canvas module and note deadlines.</li><li>Complete the mapped OSTEP reading.</li><li>Read the module explanation here.</li><li>Try readiness questions before class.</li><li>Complete the hands-on artifact.</li></ol><button id="home-modules">Open modules</button> <button class="secondary" data-command="systemstudioOs.openAccessibleLessons">Accessible HTML</button></article><article class="card"><h2>Portable lab</h2><p>Create a consistent Docker-based C, pthread, simulator, and xv6-ready workspace on Windows, macOS, or Linux. The extension does not install Docker silently.</p><button data-command="systemstudioOs.createLabWorkspace">Create lab workspace</button> <button class="secondary" data-command="systemstudioOs.checkEnvironment">Check environment</button></article><article class="card"><h2>Course authority</h2><p>This hub supports practice and planning. Submit through Canvas. Instructor/GSI feedback and grades in Canvas are official.</p><button data-command="systemstudioOs.openCanvas">Open Canvas</button> <button class="secondary" data-command="systemstudioOs.openSyllabus">Open syllabus</button> <button class="secondary" data-command="systemstudioOs.exportCalendar">Export calendar</button></article></div><h2>Evidence boundaries</h2><div class="source-grid"><div class="card"><h3>Verified Fall 2026</h3><ul>'+DATA.boundaries.verifiedCurrent.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Historical policy basis</h3><ul>'+DATA.boundaries.historicalPolicy.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="card"><h3>Confirm in Canvas</h3><ul>'+DATA.boundaries.canvasOnly.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>';el.querySelector('#home-modules').onclick=()=>show('modules');bindCommands(el);}
function moduleCard(m){const qs=m.questions.map(q=>'<div class="question" data-q="'+q.id+'"><p><span class="pill">'+q.level+'</span> <strong>'+esc(q.prompt)+'</strong></p>'+q.choices.map((c,i)=>'<label class="choice"><input type="radio" name="'+q.id+'" value="'+i+'"> '+esc(c)+'</label>').join('')+'<button class="secondary check" data-q="'+q.id+'">Check reasoning</button><div class="explanation" id="ex-'+q.id+'" hidden aria-live="polite"></div></div>').join('');return '<article class="module" id="module-'+m.number+'"><button class="toggle" aria-expanded="false"><span><span class="pill">'+m.unit+'</span> Module '+m.number+': '+esc(m.title)+'</span><span aria-hidden="true">＋</span></button><div class="module-content" hidden><h3>Learning objectives</h3><ul>'+m.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p><strong>Read:</strong> <button class="secondary reading" data-url="'+esc(m.readingUrl)+'">'+esc(m.reading)+'</button></p>'+m.lesson.map(x=>'<p>'+esc(x)+'</p>').join('')+'<div class="notice"><strong>Hands-on:</strong> '+esc(m.handsOn)+'<br><strong>Evidence artifact:</strong> '+esc(m.artifact)+'</div><details><summary>Why this module is here</summary><p>'+esc(m.sourceBasis)+'</p></details><h3>Readiness practice</h3>'+qs+'<div class="status-row"><label for="status-'+m.id+'"><strong>My local status:</strong></label><select id="status-'+m.id+'" data-module="'+m.id+'"><option value="not-started">Not started</option><option value="preparing">Preparing</option><option value="practicing">Practicing</option><option value="confident">Confident — self-assessed</option></select><label for="confidence-'+m.id+'">Confidence 1–5:</label><input id="confidence-'+m.id+'" data-confidence="'+m.id+'" type="number" min="1" max="5" value="'+esc(state.confidence[m.id]||'')+'"></div></div></article>';}
function renderModules(){const el=document.getElementById('modules');el.innerHTML='<p class="eyebrow">Prepare → explain → practice → build → reflect</p><h1>Learning modules</h1><p>Questions are formative and include explanations. Hands-on artifacts connect each concept to observable OS behavior.</p><div class="module-list">'+DATA.modules.map(moduleCard).join('')+'</div>';el.querySelectorAll('select[data-module]').forEach(s=>s.value=state.moduleStatus[s.dataset.module]||'not-started');el.onchange=e=>{if(e.target.dataset.module)state.moduleStatus[e.target.dataset.module]=e.target.value;if(e.target.dataset.confidence)state.confidence[e.target.dataset.confidence]=e.target.value;persist();renderProgress()};el.onclick=e=>{const toggle=e.target.closest('.toggle');if(toggle){const content=toggle.nextElementSibling,open=content.hidden;content.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.lastElementChild.textContent=open?'−':'＋';return}const read=e.target.closest('.reading');if(read){external(read.dataset.url);return}const check=e.target.closest('.check');if(check){const id=check.dataset.q,q=DATA.modules.flatMap(m=>m.questions).find(x=>x.id===id),chosen=el.querySelector('input[name="'+id+'"]:checked'),out=document.getElementById('ex-'+id);if(!chosen){out.hidden=false;out.textContent='Choose an answer first.';return}state.answers[id]=Number(chosen.value);persist();out.hidden=false;out.innerHTML=(Number(chosen.value)===q.answer?'<strong>Correct.</strong> ':'<strong>Not yet.</strong> ')+esc(q.explanation)}};}
function renderCoursework(){document.getElementById('coursework').innerHTML='<p class="eyebrow">3 homework · 4 programming components</p><h1>Coursework progression</h1><div class="notice warning"><strong>Planning map, not an assignment sheet.</strong> These titles and topics are grounded in the recent course package. Fall 2026 wording, dates, teams, formats, and late rules come only from Canvas.</div><div class="module-list">'+DATA.coursework.map((x,i)=>'<article class="card"><p class="pill">'+x.kind+'</p><h2>'+(i+1)+'. '+esc(x.title)+'</h2><p>'+esc(x.focus)+'</p><p><strong>Mapped modules:</strong> '+x.modules.join(', ')+'</p><h3>Pre-submission evidence check</h3><ul>'+x.evidence.map(y=>'<li>'+esc(y)+'</li>').join('')+'</ul></article>').join('')+'</div>';}
function renderProgress(){const values={"not-started":0,preparing:1,practicing:2,confident:3};let pts=0;DATA.modules.forEach(m=>pts+=values[state.moduleStatus[m.id]||'not-started']);const percent=Math.round(pts/(DATA.modules.length*3)*100);const rows=DATA.modules.map(m=>'<tr><td>'+m.number+'. '+esc(m.title)+'</td><td>'+esc((state.moduleStatus[m.id]||'not-started').replaceAll('-',' '))+'</td><td>'+(state.confidence[m.id]||'—')+'</td></tr>').join('');document.getElementById('progress').innerHTML='<p class="eyebrow">Private · local · self-reported</p><h1>My learning progress</h1><p class="result">'+percent+'% through the self-study pathway</p><progress max="100" value="'+percent+'" aria-label="Self-study pathway progress">'+percent+'%</progress><div class="notice"><strong>This is not a grade.</strong> It records your own preparation and confidence on this device. It is not sent to the instructor, GSI, or Canvas. Canvas contains official evaluations.</div><table><thead><tr><th>Module</th><th>Local status</th><th>Confidence</th></tr></thead><tbody>'+rows+'</tbody></table>';}
function renderGrade(){const labels={participation:'Participation / Canvas quizzes (10%)',homework:'Homework category (15%)',programming:'Programming category (40%)',midterm:'Midterm exam (15%)',finalExam:'Final exam (20%)'};document.getElementById('grade').innerHTML='<p class="eyebrow">Manual planning estimate</p><h1>Grade estimator</h1><div class="notice warning"><strong>Not an official grade.</strong> Copy current category percentages from Canvas manually. This tool stores values locally and does not read or write Canvas. No drops are applied because the verified syllabus does not specify a drop rule.</div><div class="grade-grid">'+Object.keys(labels).map(k=>'<label for="g-'+k+'">'+labels[k]+'</label><input id="g-'+k+'" data-grade="'+k+'" type="number" min="0" max="100" step="0.01" value="'+esc(state.grade[k])+'">').join('')+'</div><p><button id="calc">Calculate estimate</button></p><div id="grade-result" aria-live="polite"></div>';const el=document.getElementById('grade');el.onchange=e=>{if(e.target.dataset.grade){state.grade[e.target.dataset.grade]=e.target.value;persist()}};el.querySelector('#calc').onclick=()=>{const k=['participation','homework','programming','midterm','finalExam'],w=[.10,.15,.40,.15,.20],v=k.map(x=>Number(state.grade[x]));const out=el.querySelector('#grade-result');if(v.some(x=>!Number.isFinite(x)||x<0||x>100)||k.some(x=>state.grade[x]==='')){out.textContent='Enter every Canvas category percentage from 0 through 100.';return}const p=v.reduce((s,x,i)=>s+x*w[i],0);const cut=[[96.67,'A+'],[93.34,'A'],[90,'A−'],[86.67,'B+'],[83.34,'B'],[80,'B−'],[76.67,'C+'],[73.34,'C'],[70,'C−'],[66.67,'D+'],[63.34,'D'],[60,'D−'],[0,'E']];const letter=cut.find(x=>p>=x[0])[1];out.innerHTML='<p class="result">Planning estimate: '+p.toFixed(2)+'% ('+letter+')</p><p>'+v.map((x,i)=>x.toFixed(2)+' × '+Math.round(w[i]*100)+'% = '+(x*w[i]).toFixed(2)).join('<br>')+'</p><p>Confirm the official total and any Fall 2026 policy changes in Canvas.</p>'};}
function renderHelp(){const el=document.getElementById('help');el.innerHTML='<p class="eyebrow">Course-grounded · offline</p><h1>Ask the OS learning helper</h1><p>The helper maps a question to the course modules and coaches reasoning. It has no LLM account, sends no code, and will not create assignment answers.</p><label for="question"><strong>Your question</strong></label><textarea id="question" placeholder="Example: I predicted both threads would increment the counter. Why can the final value be smaller?"></textarea><p><button id="ask">Ask helper</button> <button class="secondary" data-command="systemstudioOs.openCanvas">Ask through Canvas</button></p><div id="tutor-result" class="card" hidden aria-live="polite"></div><h2>Fast help ladder</h2><ol><li>Read the mapped objective and explanation.</li><li>Predict one small example before running it.</li><li>Capture the exact command, error, or trace.</li><li>Ask Tariq or Dr. Roy a focused question with that evidence.</li><li>Use Canvas for deadline, accommodation, grade, or submission questions.</li></ol><div class="notice"><strong>Academic integrity:</strong> You may ask for concept explanations, debugging questions, analogous examples, and feedback on your reasoning. Do not ask a helper to produce code, calculations, or prose that you submit as your own. Follow the current Canvas policy.</div>';el.querySelector('#ask').onclick=()=>vscode.postMessage({type:'tutor',question:el.querySelector('#question').value});bindCommands(el);}
window.addEventListener('message',e=>{if(e.data.type==='tutorReply'){const r=e.data.reply,out=document.getElementById('tutor-result');out.hidden=false;out.innerHTML='<p class="pill">'+esc(r.mode)+'</p><h2>'+esc(r.title)+'</h2><p>'+esc(r.response)+'</p><ol>'+r.prompts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';if(r.moduleNumber)out.innerHTML+='<button id="open-map">Open Module '+r.moduleNumber+'</button>';out.querySelector('#open-map')?.addEventListener('click',()=>openModule(r.moduleNumber))}if(e.data.type==='selectModule')openModule(e.data.number)});
function openModule(n){show('modules');const card=document.getElementById('module-'+n);if(card){const btn=card.querySelector('.toggle'),content=card.querySelector('.module-content');content.hidden=false;btn.setAttribute('aria-expanded','true');btn.lastElementChild.textContent='−';card.scrollIntoView({behavior:'smooth',block:'start'});btn.focus()}}
renderHome();renderModules();renderCoursework();renderProgress();renderGrade();renderHelp();show(state.section||'home');
</script></body></html>`;
}
