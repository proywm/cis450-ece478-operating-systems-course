import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const archive = resolve(`${manifest.name}-${manifest.version}.vsix`);
const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split(/\r?\n/);
const forbidden = entries.filter((entry) => /(?:^|\/)(?:test|scripts|instructor-sources)(?:\/|$)|internal-fixture|known.?good|solution|answer.?key|student.?submission|\.patch$|\.env(?:\.|$)/i.test(entry));
assert.deepEqual(forbidden, [], `Student VSIX contains forbidden internal paths:\n${forbidden.join('\n')}`);
for (const required of [
  'extension/dist/extension.js',
  'extension/course-pack/fall2026/lessons/CIS450_ECE478_Fall2026_Accessible_Lessons.html',
  'extension/course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.html'
]) assert.ok(entries.includes(required), `VSIX is missing ${required}`);
process.stdout.write(`PASS VSIX boundary audit (${entries.length} entries; no internal references or student data)\n`);
