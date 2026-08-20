import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE, COURSEWORK, MODULES, SOURCE_BOUNDARIES } from '../src/courseData.js';

test('course identity contains no CIS 310 or senior-design carryover', () => {
  const serialized = JSON.stringify({ COURSE, COURSEWORK, MODULES });
  assert.doesNotMatch(serialized, /CIS 310|senior design|Magoosh|Digital simulator|MASM|NASM/i);
  assert.match(COURSE.title, /CIS 450 \/ ECE 478/);
});

test('all 13 modules include eight source-grounded explained questions across Bloom levels', () => {
  assert.equal(MODULES.length, 13);
  assert.equal(MODULES.flatMap((module) => module.questions).length, 104);
  assert.equal(MODULES.flatMap((module) => module.readings).length, 29);
  for (const module of MODULES) {
    assert.ok(module.objectives.length >= 3, module.id);
    assert.ok(module.lesson.length >= 3, module.id);
    assert.match(module.readingUrl, /^https:\/\/pages\.cs\.wisc\.edu\/.*OSTEP/);
    assert.ok(module.readings.length >= 1, module.id);
    for (const reading of module.readings) {
      assert.match(reading.url, /^https:\/\/pages\.cs\.wisc\.edu\/~remzi\/OSTEP\/[a-z0-9-]+\.pdf$/);
      assert.match(reading.chapter, /^Chapter \d+$/);
      assert.ok(reading.focus.length > 35, `${module.id} ${reading.chapter}`);
      const chapterNumber = reading.chapter.replace('Chapter ', '');
      assert.ok(module.questions.some((question) => new RegExp(`\\b${chapterNumber}\\b`).test(question.source)), `${module.id} ${reading.chapter} has no specifically mapped question source`);
    }
    assert.ok(module.handsOn.length > 40, module.id);
    assert.ok(module.artifact.length > 30, module.id);
    assert.equal(module.questions.length, 8, module.id);
    assert.ok(new Set(module.questions.map((question) => question.level)).size >= 3, module.id);
    for (const question of module.questions) {
      assert.equal(question.choices.length, 4, question.id);
      assert.ok(question.answer >= 0 && question.answer < question.choices.length, question.id);
      assert.ok(question.explanation.length > 25, question.id);
      assert.ok(question.source.length > 10, question.id);
    }
  }
});

test('coursework reflects three homework and four programming components', () => {
  assert.equal(COURSEWORK.filter((item) => item.kind === 'Homework').length, 3);
  assert.equal(COURSEWORK.filter((item) => item.kind === 'Programming').length, 4);
  assert.equal(COURSEWORK.length, 7);
  assert.ok(COURSEWORK.every((item) => item.expectedExtensions.length > 0));
  const labIds = new Set(['environment-evidence', 'process-api', 'scheduler-trace', 'relocation-segmentation', 'paging-tlb', 'replacement', 'thread-race', 'lock-invariant', 'condition-buffer', 'deadlock-order', 'io-trace', 'links-metadata', 'crash-consistency']);
  assert.ok(COURSEWORK.every((item) => item.practiceLabIds.length > 0 && item.practiceLabIds.every((id) => labIds.has(id))));
});

test('current facts and unverified Canvas details are explicitly separated', () => {
  assert.ok(SOURCE_BOUNDARIES.verifiedCurrent.some((fact) => fact.includes('CASL 1048')));
  assert.equal(COURSE.canvasUrl, 'https://canvas.umd.umich.edu/courses/552201');
  assert.ok(SOURCE_BOUNDARIES.verifiedCurrent.some((fact) => fact.includes('552201')));
  assert.ok(SOURCE_BOUNDARIES.verifiedReference.some((fact) => fact.includes('eeb7b415')));
  assert.ok(SOURCE_BOUNDARIES.verifiedReference.some((fact) => fact.includes('upstream usertests')));
  assert.ok(SOURCE_BOUNDARIES.canvasOnly.some((fact) => fact.includes('assignment wording')));
  assert.ok(!SOURCE_BOUNDARIES.canvasOnly.some((fact) => fact.includes('Direct Fall 2026 course URL')));
  assert.ok(SOURCE_BOUNDARIES.canvasOnly.some((fact) => fact.includes('different revision')));
});
