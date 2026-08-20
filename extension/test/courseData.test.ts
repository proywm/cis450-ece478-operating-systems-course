import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE, COURSEWORK, MODULES, SOURCE_BOUNDARIES } from '../src/courseData.js';

test('course identity contains no CIS 310 or senior-design carryover', () => {
  const serialized = JSON.stringify({ COURSE, COURSEWORK, MODULES });
  assert.doesNotMatch(serialized, /CIS 310|senior design|Magoosh|Digital simulator|MASM|NASM/i);
  assert.match(COURSE.title, /CIS 450 \/ ECE 478/);
});

test('all 13 modules include reading, narrative, hands-on work, and practice explanations', () => {
  assert.equal(MODULES.length, 13);
  for (const module of MODULES) {
    assert.ok(module.objectives.length >= 3, module.id);
    assert.ok(module.lesson.length >= 3, module.id);
    assert.match(module.readingUrl, /^https:\/\/pages\.cs\.wisc\.edu\/.*OSTEP/);
    assert.ok(module.handsOn.length > 40, module.id);
    assert.ok(module.artifact.length > 30, module.id);
    assert.ok(module.questions.length >= 3, module.id);
    for (const question of module.questions) {
      assert.equal(question.choices.length, 4, question.id);
      assert.ok(question.answer >= 0 && question.answer < question.choices.length, question.id);
      assert.ok(question.explanation.length > 25, question.id);
    }
  }
});

test('coursework reflects three homework and four programming components', () => {
  assert.equal(COURSEWORK.filter((item) => item.kind === 'Homework').length, 3);
  assert.equal(COURSEWORK.filter((item) => item.kind === 'Programming').length, 4);
  assert.equal(COURSEWORK.length, 7);
});

test('current facts and unverified Canvas details are explicitly separated', () => {
  assert.ok(SOURCE_BOUNDARIES.verifiedCurrent.some((fact) => fact.includes('CASL 1048')));
  assert.ok(SOURCE_BOUNDARIES.canvasOnly.some((fact) => fact.includes('assignment wording')));
  assert.ok(SOURCE_BOUNDARIES.canvasOnly.some((fact) => fact.includes('Direct Fall 2026 course URL')));
});

