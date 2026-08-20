import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { COURSE, MODULES } from '../src/courseData.js';
import { fall2026Schedule } from '../src/core.js';
import { guidedLab } from '../src/labs.js';

const destination = resolve(process.cwd(), '../course-pack/fall2026/lessons');

function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const navigation = MODULES.map((module) => `<li><a href="#module-${module.number}">Module ${module.number}: ${escape(module.title)}</a></li>`).join('\n');
const scheduleRows = fall2026Schedule().map((meeting) => `<tr><td>${meeting.number}</td><td>${escape(meeting.date)}</td><td>${escape(meeting.day)}</td><td>${meeting.moduleNumbers.map((number) => `<a href="#module-${number}">Module ${number}</a>`).join(', ')}</td><td>${escape(meeting.topic)}</td><td>${escape(meeting.prepare)}</td></tr>`).join('\n');
const content = MODULES.map((module) => {
const lab = guidedLab(module.number);
return `
<section id="module-${module.number}" aria-labelledby="module-${module.number}-title">
  <p class="eyebrow">${escape(module.unit)} · Module ${module.number}</p>
  <h2 id="module-${module.number}-title">${escape(module.title)}</h2>
  <h3>Learning objectives</h3>
  <ul>${module.objectives.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>
  <h3>Read before class</h3>
  <ol>${module.readings.map((reading) => `<li><a href="${escape(reading.url)}"><strong>${escape(reading.chapter)}: ${escape(reading.title)}</strong></a><br>Read for: ${escape(reading.focus)}</li>`).join('')}</ol>
  ${module.lesson.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('\n')}
  <aside aria-label="Hands-on practice"><h3>Hands-on practice</h3><p>${escape(module.handsOn)}</p><p><strong>Evidence artifact:</strong> ${escape(module.artifact)}</p>${lab ? `<h4>${escape(lab.title)}</h4><ol>${lab.steps.map((step) => `<li><strong>${escape(step.instruction)}</strong><br>Evidence: ${escape(step.evidence)}</li>`).join('')}</ol><p><strong>Run:</strong> <code>${escape(lab.runCommand)}</code></p><p><strong>Reflect:</strong> ${escape(lab.reflection)}</p><p><strong>Lab source:</strong> ${escape(lab.source)}</p>` : ''}</aside>
  <h3>Readiness questions with explanations</h3>
  ${module.questions.map((question) => `<details><summary><span class="level">${escape(question.level)}</span> ${escape(question.prompt)}</summary><ol type="A">${question.choices.map((choice) => `<li>${escape(choice)}</li>`).join('')}</ol>${question.hint ? `<p><strong>Hint:</strong> ${escape(question.hint)}</p>` : ''}<p><strong>Answer:</strong> ${String.fromCharCode(65 + question.answer)}. ${escape(question.explanation)}</p><p><strong>Source:</strong> ${escape(question.source)}</p></details>`).join('\n')}
  <p><a href="#top">Back to module list</a></p>
</section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(COURSE.title)} — Accessible Lessons</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:78ch;margin:auto;padding:1rem;color:#1d1d1f;background:#fff}a{color:#0645ad;text-underline-offset:.15em}a:focus-visible,summary:focus-visible{outline:3px solid #005fcc;outline-offset:3px}.skip{position:absolute;left:-10000px}.skip:focus{left:1rem;top:1rem;background:#fff;padding:.5rem}header,section{border-bottom:2px solid #d8d8d8;padding-block:1.5rem}.eyebrow,.level{font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4b4b4b}aside{border-left:6px solid #005fcc;background:#f1f6ff;padding:.75rem 1rem}details{border:1px solid #777;border-radius:.3rem;padding:.65rem;margin:.7rem 0}summary{cursor:pointer;font-weight:650}table{border-collapse:collapse;width:100%}th,td{border:1px solid #666;padding:.45rem;text-align:left;vertical-align:top}th{background:#e9eef5}@media(max-width:700px){table{display:block;overflow:auto}}@media(prefers-color-scheme:dark){body{color:#f4f4f4;background:#181818}a{color:#8fc7ff}aside{background:#202d3d}.eyebrow,.level{color:#d0d0d0}th{background:#283344}}</style></head>
<body id="top"><a class="skip" href="#main">Skip to lessons</a><header><p class="eyebrow">Fall 2026 · Accessible text alternative</p><h1>${escape(COURSE.title)}</h1><p>These explanations and formative questions supplement the lecture sources. <a href="${escape(COURSE.canvasUrl)}">Canvas course 552201</a> is authoritative for schedule changes, assignments, submissions, and grades.</p><p>The modules provide 29 exact official OSTEP chapter links and 104 explained readiness questions.</p><nav aria-label="Module list"><h2>Modules</h2><ol>${navigation}</ol></nav></header><main id="main"><section aria-labelledby="course-plan-title"><h2 id="course-plan-title">Dated OSTEP preparation plan</h2><p>The meeting dates, time, and room are verified. Topics and readings are the current preparation plan; Canvas announcements control changes and all assessed-work dates.</p><table><caption>Fall 2026 Monday/Wednesday reading map</caption><thead><tr><th>Meeting</th><th>Date</th><th>Day</th><th>Module</th><th>Planned focus</th><th>Read before class</th></tr></thead><tbody>${scheduleRows}</tbody></table></section>${content}</main><footer><p>Prepared for ${escape(COURSE.title)}. Last content build: 2026-08-20.</p></footer></body></html>`;

async function main(): Promise<void> {
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'CIS450_ECE478_Fall2026_Accessible_Lessons.html'), html, 'utf8');
  await writeFile(resolve(destination, 'module-map.csv'), ['module,unit,title,reading_chapters,reading_urls,hands_on', ...MODULES.map((module) => [module.number, module.unit, module.title, module.readings.map((reading) => `${reading.chapter}: ${reading.title}`).join(' | '), module.readings.map((reading) => reading.url).join(' | '), module.handsOn].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n', 'utf8');
}

void main();
