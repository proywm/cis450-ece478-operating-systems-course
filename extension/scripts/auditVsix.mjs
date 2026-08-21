import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AdmZip from 'adm-zip';

const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const archive = resolve(`${manifest.name}-${manifest.version}.vsix`);
const entries = new AdmZip(archive).getEntries().map((entry) => entry.entryName);
const forbidden = entries.filter((entry) => /(?:^|\/)(?:test|scripts|integration|instructor-sources)(?:\/|$)|internal-fixture|known.?good|solution|answer.?key|student.?submission|\.patch$|\.env(?:\.|$)/i.test(entry));
assert.deepEqual(forbidden, [], `Student VSIX contains forbidden internal paths:\n${forbidden.join('\n')}`);
for (const required of [
  'extension/dist/extension.js',
  'extension/media/orbit-os-anime.svg',
  'extension/media/OS_ENVIRONMENT_GUIDE.md',
  'extension/course-pack/fall2026/lessons/CIS450_ECE478_Fall2026_Accessible_Lessons.html',
  'extension/course-pack/fall2026/syllabus/CIS450_ECE478_Fall2026_Syllabus.html'
]) assert.ok(entries.includes(required), `VSIX is missing ${required}`);
process.stdout.write(`PASS VSIX boundary audit (${entries.length} entries; no internal references or student data)\n`);
