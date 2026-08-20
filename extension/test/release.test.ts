import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('extension manifest is private and contributes every required command', async () => {
  const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { private?: boolean; name?: string; contributes?: { commands?: { command: string }[] } };
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.name, 'systemstudio-cis450-ece478');
  const commands = new Set(packageJson.contributes?.commands?.map((item) => item.command));
  for (const command of ['systemstudioOs.openLearningHub', 'systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.checkEnvironment', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar', 'systemstudioOs.configureCanvas', 'systemstudioOs.importCanvasCalendar', 'systemstudioOs.createModuleLab', 'systemstudioOs.validateEvidence']) {
    assert.ok(commands.has(command), command);
  }
});

test('accessible syllabus and lesson export avoid Google Drive and stale course identity', async () => {
  const files = [
    resolve(process.cwd(), '../course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.html'),
    resolve(process.cwd(), '../course-pack/fall2026/lessons/CIS450_ECE478_Fall2026_Accessible_Lessons.html')
  ];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.match(content, /<html lang="en">/);
    assert.doesNotMatch(content, /drive\.google\.com|CIS 310|Magoosh/i);
    assert.doesNotMatch(content, /staff are verified|schedule\/staff are verified/i);
  }
  const lessons = await readFile(files[1]!, 'utf8');
  assert.equal((lessons.match(/<details>/g) ?? []).length, 104);
  assert.match(lessons, /<strong>Source:<\/strong>/);
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
  assert.match(content, /No GSI or grader is currently assigned or confirmed; check Canvas and department announcements for updates\./);
});
