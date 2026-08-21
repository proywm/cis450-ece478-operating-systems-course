import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ICS_BYTES, WALKTHROUGH_STEPS, createLearningState, formatPreClassQuestion, parseCanvasIcs, practiceAnalytics, recordPracticeAnswer, safeCanvasUrl, selectPracticeQuestions, toggleSavedQuestion, validateEvidenceFiles } from '../src/learning.js';

test('first correct retrieval is scheduled one day later, then expands', () => {
  const now = new Date('2026-08-20T14:00:00.000Z');
  const first = recordPracticeAnswer(createLearningState(), 'm01q1', 1, 'medium', now);
  assert.equal(first.correct, true);
  assert.equal(first.nextReviewAt, '2026-08-21T14:00:00.000Z');
  const second = recordPracticeAnswer(first.state, 'm01q1', 1, 'medium', new Date(first.nextReviewAt));
  assert.equal(second.nextReviewAt, '2026-08-23T14:00:00.000Z');
  const miss = recordPracticeAnswer(createLearningState(), 'm01q1', 0, 'medium', now);
  const recovered = recordPracticeAnswer(miss.state, 'm01q1', 1, 'medium', new Date('2026-08-21T14:00:00.000Z'));
  assert.equal(recovered.nextReviewAt, '2026-08-22T14:00:00.000Z');
});

test('quick practice returns five and supports saved and due focus', () => {
  let state = createLearningState();
  assert.equal(selectPracticeQuestions(state, { focus: 'recommended' }).length, 5);
  state = toggleSavedQuestion(state, 'm02q1');
  assert.deepEqual(selectPracticeQuestions(state, { focus: 'saved' }).map((q) => q.id), ['m02q1']);
  state = recordPracticeAnswer(state, 'm03q1', 0, 'high', new Date('2026-08-20T12:00:00Z')).state;
  assert.ok(selectPracticeQuestions(state, { focus: 'due', now: new Date('2026-08-20T12:00:00Z') }).some((q) => q.id === 'm03q1'));
});

test('topic analytics distinguish attempts, saved, due, and confident misses', () => {
  let state = toggleSavedQuestion(createLearningState(), 'm07q1');
  state = recordPracticeAnswer(state, 'm07q1', 0, 'high', new Date('2026-08-20T12:00:00Z')).state;
  const module = practiceAnalytics(state, new Date('2026-08-20T12:00:00Z')).find((item) => item.moduleNumber === 7);
  assert.equal(module?.attemptedQuestions, 1);
  assert.equal(module?.saved, 1);
  assert.equal(module?.confidentMisses, 1);
  assert.equal(module?.due, 1);
});

test('Canvas ICS preserves all-day dates and honors Detroit TZID across DST', () => {
  const events = parseCanvasIcs([
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'UID:all-day', 'SUMMARY:Labor Day', 'DTSTART;VALUE=DATE:20260907', 'URL:https://canvas.umd.umich.edu/courses/123', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:fall-time', 'SUMMARY:CIS 450 deadline', 'DTSTART;TZID=America/Detroit:20261102T140000', 'URL:https://canvas.umd.umich.edu/courses/123/assignments/5', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:spring-time', 'SUMMARY:Practice only', 'DTSTART;TZID=America/Detroit:20260309T140000', 'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n'));
  assert.equal(events[0]?.startsAt, '2026-03-09T18:00:00.000Z');
  const allDay = events.find((event) => event.id === 'all-day');
  assert.deepEqual({ startsAt: allDay?.startsAt, allDay: allDay?.allDay }, { startsAt: '2026-09-07', allDay: true });
  assert.equal(events.find((event) => event.id === 'fall-time')?.startsAt, '2026-11-02T19:00:00.000Z');
});

test('Canvas ICS rejects oversize input, skips malformed starts, and drops untrusted URLs', () => {
  assert.throws(() => parseCanvasIcs('x'.repeat(MAX_ICS_BYTES + 1)), /2 MiB/);
  const events = parseCanvasIcs([
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'UID:bad-date', 'SUMMARY:Bad date', 'DTSTART:tomorrow', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:bad-all-day', 'SUMMARY:Impossible date', 'DTSTART;VALUE=DATE:20260231', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:unsafe', 'SUMMARY:Review me', 'DTSTART:20260826T140000Z', 'URL:javascript:alert(1)', 'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n'));
  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, 'unsafe');
  assert.equal(events[0]?.url, undefined);
});

test('Canvas URL and pre-class composer enforce local handoff boundaries', () => {
  assert.ok(safeCanvasUrl('https://canvas.umd.umich.edu/courses/123'));
  assert.equal(safeCanvasUrl('http://canvas.umd.umich.edu/courses/123'), undefined);
  assert.equal(safeCanvasUrl('https://evil.example/courses/123'), undefined);
  assert.equal(safeCanvasUrl('https://user:pass@canvas.umd.umich.edu/courses/123'), undefined);
  const formatted = formatPreClassQuestion({ topic: 'Locks', question: 'Why does my stated order still permit a cycle?', understanding: 'I drew two resources.', attempted: 'I traced both threads.', route: 'discussion', anonymityRequested: true });
  assert.match(formatted?.text ?? '', /What I already tried/);
  assert.equal(formatted?.anonymityRequested, true);
  assert.equal(formatPreClassQuestion({ topic: '', question: 'x', route: 'discussion' }), undefined);
});

test('evidence validation is read-only and bounded', () => {
  const result = validateEvidenceFiles([{ name: 'report.pdf', size: 1024, isFile: true }, { name: 'code.exe', size: 10, isFile: true }], ['pdf']);
  assert.match(result.lines.join(' '), /No file was uploaded, modified, renamed, archived, or submitted/);
  assert.ok(result.warnings.some((warning) => warning.includes('code.exe')));
});

test('walkthrough is self-paced and covers all major student workflows', () => {
  assert.ok(WALKTHROUGH_STEPS.length >= 7);
  assert.deepEqual(WALKTHROUGH_STEPS.slice(0, 2).map((step) => step.id), ['assistance', 'setup']);
  assert.match(WALKTHROUGH_STEPS[0]!.detail, /U-M Codex CLI.*offline/i);
  assert.match(WALKTHROUGH_STEPS.map((step) => `${step.title} ${step.detail}`).join(' '), /Practice in five-question sessions/);
  assert.match(WALKTHROUGH_STEPS.map((step) => step.detail).join(' '), /cannot promise anonymity/);
});
