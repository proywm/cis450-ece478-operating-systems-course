import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendar, estimateGrade, fall2026Meetings, letterFor, progressPercent, tutorReply } from '../src/core.js';

test('verified Fall 2026 calendar has 27 Monday/Wednesday meetings', () => {
  const meetings = fall2026Meetings();
  assert.equal(meetings.length, 27);
  assert.deepEqual(meetings[0], { number: 1, date: '2026-08-26', day: 'Wednesday' });
  assert.deepEqual(meetings.at(-1), { number: 27, date: '2026-12-07', day: 'Monday' });
  assert.equal(meetings.some((meeting) => ['2026-09-07', '2026-11-23', '2026-11-25'].includes(meeting.date)), false);
});

test('calendar identifies verified room and leaves exact exam details to Canvas', () => {
  const calendar = buildCalendar();
  assert.match(calendar, /CASL 1048/);
  assert.match(calendar, /T140000/);
  assert.match(calendar, /T154500/);
  assert.match(calendar, /Exact exam date\\, time\\, room\\, and format are not yet verified/);
  assert.match(calendar, /Canvas is authoritative/);
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
