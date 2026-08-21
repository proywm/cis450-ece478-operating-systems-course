import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendar, estimateGrade, fall2026Meetings, fall2026Schedule, letterFor, progressPercent, requiredFinalExamPercent, tutorReply } from '../src/core.js';

test('verified Fall 2026 calendar has 26 classes plus the October 14 midterm', () => {
  const meetings = fall2026Meetings();
  assert.equal(meetings.length, 27);
  assert.deepEqual(meetings[0], { number: 1, date: '2026-08-26', day: 'Wednesday' });
  assert.deepEqual(meetings.at(-1), { number: 27, date: '2026-12-07', day: 'Monday' });
  assert.equal(meetings.some((meeting) => ['2026-09-07', '2026-11-23', '2026-11-25'].includes(meeting.date)), false);
});

test('all verified meetings have a dated module and OSTEP preparation plan', () => {
  const schedule = fall2026Schedule();
  assert.equal(schedule.length, 27);
  assert.equal(schedule.filter((meeting) => meeting.kind === 'class').length, 26);
  assert.deepEqual(schedule.find((meeting) => meeting.date === '2026-10-14'), {
    number: 14,
    date: '2026-10-14',
    day: 'Wednesday',
    kind: 'assessment',
    label: 'Midterm',
    moduleNumbers: [1, 2, 3, 4, 5, 6],
    topic: 'Midterm examination during the regular class period',
    prepare: 'Review Modules 1–6; confirm scope, format, and allowed materials in Canvas'
  });
  assert.equal(schedule.find((meeting) => meeting.date === '2026-10-19')?.label, '14');
  assert.equal(schedule.find((meeting) => meeting.date === '2026-10-19')?.prepare, 'OSTEP Chapters 26–27');
  assert.equal(schedule[0]?.topic, 'OS goals and the common C/Unix environment');
  assert.equal(schedule[0]?.prepare, 'OSTEP Chapter 2');
  assert.deepEqual(schedule.at(-1)?.moduleNumbers, [13]);
  assert.equal(schedule.at(-1)?.prepare, 'OSTEP Chapter 42');
  assert.ok(schedule.every((meeting) => meeting.moduleNumbers.length > 0));
  assert.ok(schedule.filter((meeting) => meeting.kind === 'class').every((meeting) => meeting.prepare.includes('OSTEP')));
});

test('calendar identifies the midterm and scheduled final without duplicating a class on October 14', () => {
  const calendar = buildCalendar();
  assert.match(calendar, /CASL 1048/);
  assert.match(calendar, /T140000/);
  assert.match(calendar, /T154500/);
  assert.match(calendar, /Midterm examination/);
  assert.match(calendar, /DTSTART;TZID=America\/Detroit:20261014T140000/);
  assert.match(calendar, /DTSTART;TZID=America\/Detroit:20261214T150000/);
  assert.match(calendar, /DTEND;TZID=America\/Detroit:20261214T180000/);
  assert.equal((calendar.match(/20261014T140000/g) ?? []).length, 1);
  assert.match(calendar, /MLFQ\\, proportional share\\, and multiprocessor scheduling/);
  assert.match(calendar, /Prepare: OSTEP Chapters 8–10/);
  assert.match(calendar, /URL:https:\/\/canvas\.umd\.umich\.edu\/courses\/552201/);
});

test('grade estimate uses verified historical 10/15/40/15/20 weights', () => {
  const result = estimateGrade({ participation: 80, homework: 90, programming: 70, midterm: 100, finalExam: 85 });
  assert.equal(result.percent, 81.5);
  assert.equal(result.letter, 'B−');
  assert.deepEqual(result.contributions, { participation: 8, homework: 13.5, programming: 28, midterm: 15, finalExam: 17 });
});

test('grade calculator rejects out-of-range categories', () => {
  assert.throws(() => estimateGrade({ participation: 101, homework: 90, programming: 90, midterm: 90, finalExam: 90 }), /0 through 100/);
});

test('grade predictor calculates an exact target-final requirement', () => {
  const result = requiredFinalExamPercent({ participation: 80, homework: 90, programming: 70, midterm: 100 }, 83.34);
  assert.equal(result.pointsBeforeFinal, 64.5);
  assert.ok(Math.abs(result.requiredPercent - 94.2) < 1e-9);
  assert.equal(result.status, 'required');
});

test('grade predictor distinguishes secured and unreachable targets', () => {
  assert.equal(requiredFinalExamPercent({ participation: 100, homework: 100, programming: 100, midterm: 100 }, 70).status, 'already-reached');
  assert.equal(requiredFinalExamPercent({ participation: 0, homework: 0, programming: 0, midterm: 0 }, 60).status, 'not-reachable');
  assert.throws(() => requiredFinalExamPercent({ participation: 100, homework: 100, programming: 100, midterm: 100 }, 101), /0 through 100/);
});

test('letter boundaries match the carried-forward syllabus', () => {
  assert.equal(letterFor(96.67), 'A+');
  assert.equal(letterFor(93.34), 'A');
  assert.equal(letterFor(90), 'A−');
  assert.equal(letterFor(59.99), 'E');
});

test('local progress is normalized across all modules', () => {
  assert.equal(progressPercent({}), 0);
  assert.equal(progressPercent(Object.fromEntries(Array.from({ length: 13 }, (_, index) => [`m${String(index + 1).padStart(2, '0')}`, 'confident' as const]))), 100);
});

test('helper refuses direct assessed-work answers', () => {
  const reply = tutorReply('Please give me the code solution for programming assignment 2 scheduler');
  assert.equal(reply.mode, 'integrity-guardrail');
  assert.match(reply.response, /will not provide a finished answer/);
});

test('helper maps concept questions to the course', () => {
  const reply = tutorReply('Why can counter increment have a race condition between threads?');
  assert.equal(reply.mode, 'course-help');
  assert.equal(reply.moduleNumber, 7);
});
