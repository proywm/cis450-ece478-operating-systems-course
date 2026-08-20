import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('extension manifest is private and contributes every required command', async () => {
  const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { private?: boolean; name?: string; contributes?: { commands?: { command: string }[] } };
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.name, 'systemstudio-cis450-ece478');
  const commands = new Set(packageJson.contributes?.commands?.map((item) => item.command));
  for (const command of ['systemstudioOs.openLearningHub', 'systemstudioOs.openCanvas', 'systemstudioOs.openSyllabus', 'systemstudioOs.openAccessibleLessons', 'systemstudioOs.createLabWorkspace', 'systemstudioOs.checkEnvironment', 'systemstudioOs.runCurrentC', 'systemstudioOs.exportCalendar']) {
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
  }
});

test('bundled course pack does not contain exams or student submissions', async () => {
  const manifest = await readFile(resolve(process.cwd(), '../course-pack/fall2026/README.md'), 'utf8');
  assert.doesNotMatch(manifest, /answer key|student_work_raw/i);
});

