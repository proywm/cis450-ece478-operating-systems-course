import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { COURSE, MODULES } from '../src/courseData.js';
import { FALL_2026_EXAMS, fall2026Schedule } from '../src/core.js';
import { guidedLab } from '../src/labs.js';
import { OSTEP_HOMEWORK_COMMIT, OSTEP_HOMEWORK_PAGE, OSTEP_SIMULATORS, simulatorArguments } from '../src/ostepSimulators.js';

const destination = resolve(process.cwd(), '../course-pack/fall2026/lessons');

function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const moduleFile = (number: number): string => `module-${String(number).padStart(2, '0')}.html`;
const navigation = MODULES.map((module) => `<li><a href="${moduleFile(module.number)}">Module ${module.number}: ${escape(module.title)}</a></li>`).join('\n');
const scheduleRows = fall2026Schedule().map((meeting) => `<tr${meeting.kind === 'assessment' ? ' class="assessment"' : ''}><td>${escape(meeting.label)}</td><td>${escape(meeting.date)}</td><td>${escape(meeting.day)}</td><td>${meeting.moduleNumbers.map((number) => `<a href="${moduleFile(number)}">Module ${number}</a>`).join(', ')}</td><td>${meeting.kind === 'assessment' ? `<strong>${escape(meeting.topic)}</strong>` : escape(meeting.topic)}</td><td>${escape(meeting.prepare)}</td></tr>`).join('\n');
const moduleContents = MODULES.map((module) => {
const lab = guidedLab(module.number);
const simulators = OSTEP_SIMULATORS.filter((simulator) => simulator.moduleNumber === module.number);
return `
<section id="module-${module.number}" aria-labelledby="module-${module.number}-title">
  <p class="eyebrow">${escape(module.unit)} · Module ${module.number}</p>
  <h2 id="module-${module.number}-title">${escape(module.title)}</h2>
  <h3>Learning objectives</h3>
  <ul>${module.objectives.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>
  <h3>Read before class</h3>
  <ol>${module.readings.map((reading) => `<li><a href="${escape(reading.url)}"><strong>${escape(reading.chapter)}: ${escape(reading.title)}</strong></a><br>Read for: ${escape(reading.focus)}</li>`).join('')}</ol>
  ${module.lesson.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('\n')}
${simulators.length ? `<aside aria-label="Official OSTEP prediction tools"><h3>Official OSTEP prediction tools</h3><p>Read the named chapter and the tool's README, run without <code>-c</code>, record a prediction, then add <code>-c</code> only to check and explain your work.</p>${simulators.map((simulator) => `<section><h4>${escape(simulator.chapter)}: ${escape(simulator.title)}</h4><p>${escape(simulator.purpose)}</p><p><strong>Prepare:</strong> ${escape(simulator.priorKnowledge)}</p><p><strong>Predict:</strong> ${escape(simulator.predict)}</p><p><strong>Run from:</strong> <code>official/${escape(simulator.directory)}</code></p><p><strong>Prediction command:</strong> <code>python3 ${escape(simulatorArguments(simulator, 'practice').join(' '))}</code></p><p><strong>Explain after checking:</strong> ${escape(simulator.explain)}</p></section>`).join('')}</aside>` : ''}
  <aside aria-label="Hands-on practice"><h3>Hands-on practice</h3><p>${escape(module.handsOn)}</p><p><strong>Evidence artifact:</strong> ${escape(module.artifact)}</p>${lab ? `<h4>${escape(lab.title)}</h4><ol>${lab.steps.map((step) => `<li><strong>${escape(step.instruction)}</strong><br>Evidence: ${escape(step.evidence)}</li>`).join('')}</ol><p><strong>Run:</strong> <code>${escape(lab.runCommand)}</code></p><p><strong>Reflect:</strong> ${escape(lab.reflection)}</p><p><strong>Lab source:</strong> ${escape(lab.source)}</p>` : ''}</aside>
  <aside aria-label="How the sources fit together"><h3>How the sources fit together</h3><p>${escape(module.sourceAlignment)}</p></aside>
  <h3>Readiness questions with explanations</h3>
  ${module.questions.map((question) => `<details><summary><span class="level">${escape(question.level)}</span> ${escape(question.prompt)}</summary><ol type="A">${question.choices.map((choice) => `<li>${escape(choice)}</li>`).join('')}</ol>${question.hint ? `<p><strong>Hint:</strong> ${escape(question.hint)}</p>` : ''}<p><strong>Answer:</strong> ${String.fromCharCode(65 + question.answer)}. ${escape(question.explanation)}</p><p><strong>Source:</strong> ${escape(question.source)}</p></details>`).join('\n')}
  <p><a href="CIS450_ECE478_Fall2026_Accessible_Lessons.html">Back to module list and course plan</a></p>
</section>`;
});

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(COURSE.title)} — Accessible Lessons</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:78ch;margin:auto;padding:1rem;color:#1d1d1f;background:#fff}a{color:#0645ad;text-underline-offset:.15em}a:focus-visible,summary:focus-visible{outline:3px solid #005fcc;outline-offset:3px}.skip{position:absolute;left:-10000px}.skip:focus{left:1rem;top:1rem;background:#fff;padding:.5rem}header,section{border-bottom:2px solid #d8d8d8;padding-block:1.5rem}.eyebrow,.level{font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4b4b4b}aside{border-left:6px solid #005fcc;background:#f1f6ff;padding:.75rem 1rem}details{border:1px solid #777;border-radius:.3rem;padding:.65rem;margin:.7rem 0}summary{cursor:pointer;font-weight:650}table{border-collapse:collapse;width:100%}th,td{border:1px solid #666;padding:.45rem;text-align:left;vertical-align:top}th{background:#e9eef5}@media(max-width:700px){table{display:block;overflow:auto}}@media(prefers-color-scheme:dark){body{color:#f4f4f4;background:#181818}a{color:#8fc7ff}aside{background:#202d3d}.eyebrow,.level{color:#d0d0d0}th{background:#283344}}</style></head>
<body id="top"><a class="skip" href="#main">Skip to course plan</a><header><p class="eyebrow">Fall 2026 · Accessible text alternative</p><h1>${escape(COURSE.title)}</h1><p>These explanations and formative questions supplement the lecture sources. <a href="${escape(COURSE.canvasUrl)}">Canvas course 552201</a> is authoritative for schedule changes, assignments, submissions, and grades.</p><p>The modules provide 29 exact official OSTEP chapter links, 104 explained readiness questions, and 15 mapped simulator activities. Each module opens on its own focused page so students do not have to navigate one very long document.</p><p><a href="${escape(OSTEP_HOMEWORK_PAGE)}">Official OSTEP simulator documentation</a>; extension-tested source revision: <code>${escape(OSTEP_HOMEWORK_COMMIT)}</code>. The source is fetched after consent and is not redistributed in this lesson package.</p><nav aria-label="Module list"><h2>Choose a module</h2><ol>${navigation}</ol></nav></header><main id="main"><section aria-labelledby="exam-title"><h2 id="exam-title">Examinations</h2><ul><li><strong>Midterm:</strong> ${escape(FALL_2026_EXAMS.midterm.date)}, ${escape(FALL_2026_EXAMS.midterm.time)}, ${escape(FALL_2026_EXAMS.midterm.room)}; ${escape(FALL_2026_EXAMS.midterm.coverage)}. ${escape(FALL_2026_EXAMS.midterm.status)}</li><li><strong>Final:</strong> ${escape(FALL_2026_EXAMS.final.date)}, ${escape(FALL_2026_EXAMS.final.time)}, ${escape(FALL_2026_EXAMS.final.room)}; ${escape(FALL_2026_EXAMS.final.coverage)}. ${escape(FALL_2026_EXAMS.final.status)}</li></ul></section><section aria-labelledby="course-plan-title"><h2 id="course-plan-title">Dated OSTEP preparation plan</h2><p>The table contains 26 regular class meetings plus the October 14 midterm. Topics and readings are the current preparation plan; Canvas announcements control changes and assessment details.</p><table><caption>Fall 2026 Monday/Wednesday class and assessment map</caption><thead><tr><th>Class / assessment</th><th>Date</th><th>Day</th><th>Module</th><th>Planned focus</th><th>Prepare</th></tr></thead><tbody>${scheduleRows}</tbody></table></section></main><footer><p>Prepared for ${escape(COURSE.title)}. Last content build: 2026-08-21.</p></footer></body></html>`;

async function main(): Promise<void> {
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'CIS450_ECE478_Fall2026_Accessible_Lessons.html'), html, 'utf8');
  for (const [index, module] of MODULES.entries()) {
    const previous = index > 0 ? MODULES[index - 1] : undefined;
    const next = index < MODULES.length - 1 ? MODULES[index + 1] : undefined;
    const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Module ${module.number}: ${escape(module.title)} — ${escape(COURSE.title)}</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:78ch;margin:auto;padding:1rem;color:#1d1d1f;background:#fff}a{color:#0645ad;text-underline-offset:.15em}a:focus-visible,summary:focus-visible{outline:3px solid #005fcc;outline-offset:3px}.skip{position:absolute;left:-10000px}.skip:focus{left:1rem;top:1rem;background:#fff;padding:.5rem}header,section{border-bottom:2px solid #d8d8d8;padding-block:1.5rem}.eyebrow,.level{font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4b4b4b}aside{border-left:6px solid #005fcc;background:#f1f6ff;padding:.75rem 1rem}details{border:1px solid #777;border-radius:.3rem;padding:.65rem;margin:.7rem 0}summary{cursor:pointer;font-weight:650}.module-nav{display:flex;flex-wrap:wrap;gap:1rem}@media(prefers-color-scheme:dark){body{color:#f4f4f4;background:#181818}a{color:#8fc7ff}aside{background:#202d3d}.eyebrow,.level{color:#d0d0d0}}</style></head>
<body><a class="skip" href="#module-${module.number}">Skip to module</a><header><p class="eyebrow">Fall 2026 · focused accessible module</p><h1>${escape(COURSE.title)}</h1><nav class="module-nav" aria-label="Module navigation"><a href="CIS450_ECE478_Fall2026_Accessible_Lessons.html">Course plan and all modules</a>${previous ? `<a href="${moduleFile(previous.number)}">Previous: Module ${previous.number}</a>` : ''}${next ? `<a href="${moduleFile(next.number)}">Next: Module ${next.number}</a>` : ''}</nav></header><main>${moduleContents[index]}</main><footer><p>Canvas remains authoritative for assessed work, deadlines, submissions, and grades.</p></footer></body></html>`;
    await writeFile(resolve(destination, moduleFile(module.number)), page, 'utf8');
  }
  await writeFile(resolve(destination, 'module-map.csv'), ['module,unit,title,reading_chapters,reading_urls,official_simulators,hands_on,source_alignment', ...MODULES.map((module) => [module.number, module.unit, module.title, module.readings.map((reading) => `${reading.chapter}: ${reading.title}`).join(' | '), module.readings.map((reading) => reading.url).join(' | '), OSTEP_SIMULATORS.filter((simulator) => simulator.moduleNumber === module.number).map((simulator) => `${simulator.chapter}: ${simulator.title}`).join(' | '), module.handsOn, module.sourceAlignment].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n', 'utf8');
}

void main();
