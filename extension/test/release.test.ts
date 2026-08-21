import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('extension manifest is private and contributes every required command', async () => {
  const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { private?: boolean; name?: string; contributes?: { commands?: { command: string }[] } };
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.name, 'systemstudio-cis450-ece478');
  const commands = new Set(packageJson.contributes?.commands?.map((item) => item.command));
  for (const command of ['systemstudioOs.openLearningHub', 'systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openPretest', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.setupCourseEnvironment', 'systemstudioOs.openAiTutor', 'systemstudioOs.configureAiAssistance', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.runCourseworkPreflight', 'systemstudioOs.openPortableSetup', 'systemstudioOs.reopenInCourseContainer', 'systemstudioOs.checkEnvironment', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar', 'systemstudioOs.configureCanvas', 'systemstudioOs.importCanvasCalendar', 'systemstudioOs.createModuleLab', 'systemstudioOs.validateEvidence', 'systemstudioOs.prepareXv6', 'systemstudioOs.verifyXv6', 'systemstudioOs.openXv6Guide', 'systemstudioOs.prepareOstepSimulators', 'systemstudioOs.runOstepSimulator', 'systemstudioOs.openOstepSimulatorGuide']) {
    assert.ok(commands.has(command), command);
  }
});

test('bundled pre-test is a 0-point unaided diagnostic', async () => {
  const content = await readFile(resolve(process.cwd(), '../course-pack/fall2026/diagnostics/PRETEST.html'), 'utf8');
  assert.match(content, /0 points/i);
  assert.match(content, /Do not use an AI assistant/i);
  assert.match(content, /does not affect your course grade/i);
});

test('accessible syllabus and lesson export avoid Google Drive and stale course identity', async () => {
  const files = [
    resolve(process.cwd(), '../course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.html'),
    resolve(process.cwd(), '../course-pack/fall2026/lessons/CIS450_ECE478_Fall2026_Accessible_Lessons.html')
  ];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.match(content, /<html lang="en">/);
    assert.doesNotMatch(content, /drive\.google\.com|SystemStudio CIS 310|CIS 310 Course Materials|Magoosh/i);
    assert.doesNotMatch(content, /staff are verified|schedule\/staff are verified/i);
  }
  const lessons = await readFile(files[1]!, 'utf8');
  const modulePages = await Promise.all(Array.from({ length: 13 }, (_, index) =>
    readFile(resolve(process.cwd(), `../course-pack/fall2026/lessons/module-${String(index + 1).padStart(2, '0')}.html`), 'utf8')
  ));
  const lessonModules = modulePages.join('\n');
  assert.doesNotMatch(lessonModules, /Winter 2026|historical (?:HW|PA)|individually audited|no matching .*lecture deck|student-evaluation/i);
  assert.doesNotMatch(lessonModules, /Chapter and lecture alignment/);
  assert.equal((lessonModules.match(/How the sources fit together/g) ?? []).length, 26);
  assert.equal((lessonModules.match(/<details><summary><span class="level">/g) ?? []).length, 104);
  assert.equal((lessons.match(/<tr(?: class="assessment")?><td>/g) ?? []).length, 27);
  assert.match(lessons, /class="assessment"><td>Midterm<\/td><td>2026-10-14/);
  assert.match(lessons, /<strong>Final:<\/strong> 2026-12-14, 3:00–6:00 p\.m\., CASL 1048/);
  assert.doesNotMatch(lessons, /2026-10-14[\s\S]{0,240}Threads, shared state/);
  assert.equal((lessonModules.match(/https:\/\/pages\.cs\.wisc\.edu\/~remzi\/OSTEP\/[a-z0-9-]+\.pdf/g) ?? []).length, 29);
  assert.match(lessonModules, /<strong>Source:<\/strong>/);
  assert.match(lessons, /Dated OSTEP preparation plan/);
  assert.equal((lessonModules.match(/<h4>Chapter \d+: /g) ?? []).length, 15);
  assert.match(lessons, /afb36ca8ddbf81d847d18f6bd18a87f0a18667f2/);
  assert.match(lessons, /https:\/\/canvas\.umd\.umich\.edu\/courses\/552201/);
  assert.ok((lessons.match(/href="module-\d\d\.html"/g) ?? []).length >= 13 + 27);
  for (const [index, page] of modulePages.entries()) {
    assert.match(page, new RegExp(`<section id="module-${index + 1}"`));
    assert.match(page, /Course plan and all modules/);
  }
});

test('bundled course pack does not contain exams or student submissions', async () => {
  const manifest = await readFile(resolve(process.cwd(), '../course-pack/fall2026/README.md'), 'utf8');
  assert.doesNotMatch(manifest, /answer key|student_work_raw/i);
});

test('release does not retain an unverified CIS 450 GSI identity', async () => {
  const content = [
    await readFile(resolve(process.cwd(), '../README.md'), 'utf8'),
    await readFile(resolve(process.cwd(), '../docs/PROVENANCE.md'), 'utf8'),
    await readFile(resolve(process.cwd(), '../course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.md'), 'utf8'),
    await readFile(resolve(process.cwd(), '../course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.html'), 'utf8')
  ].join('\n');
  assert.doesNotMatch(content, /ssmtariq@umich|planned\/requested GSI/i);
  assert.doesNotMatch(content, /staff are verified|schedule\/staff are verified/i);
  assert.match(content, /No GSI or grader is currently assigned or confirmed;\s+check Canvas and\s+department announcements for updates\./);
});

test('release scripts separate portable packaging from Linux-native course execution', async () => {
  const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const platformChecks = await readFile(resolve(process.cwd(), 'scripts/runPlatformChecks.mjs'), 'utf8');
  assert.match(packageJson.scripts?.['package:portable'] ?? '', /check:portable[\s\S]*audit:vsix/);
  assert.doesNotMatch(packageJson.scripts?.['check:portable'] ?? '', /test:starters|test:xv6|test:ostep|test:references/);
  for (const script of ['test:starters', 'test:references', 'test:ostep', 'test:xv6']) assert.match(packageJson.scripts?.['check:native'] ?? '', new RegExp(script.replace(':', '\\:')));
  assert.match(packageJson.scripts?.check ?? '', /runPlatformChecks\.mjs/);
  assert.match(platformChecks, /process\.platform === 'linux'[\s\S]*run\('check:native'\)/);
  assert.match(platformChecks, /process\.env\.npm_execpath/);
  assert.match(platformChecks, /spawnSync\(process\.execPath, \[npmCli, 'run', script\]/);
  assert.doesNotMatch(platformChecks, /npm\.cmd|shell:\s*true/);
  assert.match(platformChecks, /SKIP check:native/);
  assert.match(packageJson.scripts?.['test:integration'] ?? '', /runPackagedIntegration\.mjs/);
});

test('every Docker readiness check probes the server rather than docker info', async () => {
  const sources = [
    await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8'),
    await readFile(resolve(process.cwd(), 'scripts/smokeLabs.ts'), 'utf8')
  ].join('\n');
  assert.match(sources, /docker['"], \['version', '--format', '\{\{\.Server\.Version\}\}'\]/);
  assert.doesNotMatch(sources, /docker['"], \['info'|docker info|ServerVersion/);
  assert.equal((sources.match(/commandVersion\('Docker engine', 'docker', DOCKER_SERVER_VERSION_ARGS\)/g) ?? []).length, 6);
});
