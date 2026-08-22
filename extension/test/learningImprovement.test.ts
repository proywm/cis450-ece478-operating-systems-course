import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEARNING_IMPROVEMENT_PROGRAM,
  MAX_LEARNING_IMPROVEMENT_EVENTS,
  appendImprovementEvent,
  approvedUmichEndpoint,
  buildImprovementEvent,
  buildImprovementPayload,
  emptyImprovementConsent,
  normalizeImprovementConsent,
  normalizeImprovementEvents,
  type ImprovementEvent
} from '../src/learningImprovementCore.js';

test('learning-improvement collection is hard-disabled before institutional approval', () => {
  assert.deepEqual(LEARNING_IMPROVEMENT_PROGRAM, { enabled: false, protocolId: '', endpoint: '' });
  assert.deepEqual(emptyImprovementConsent(), { noticeVersion: 1, technical: false, learning: false, survey: false });
  assert.deepEqual(normalizeImprovementConsent({ noticeVersion: 0, learning: true }), emptyImprovementConsent());
});

test('allowlisted events disclose coarse fields only', () => {
  const event = buildImprovementEvent({ category: 'learning', name: 'practice-attempt', moduleId: 'module-4', activityId: 'm4-q2', selectedOption: 1, correct: true, confidence: 'medium', attemptNumber: 2 }, { courseWeek: 'week-2', extensionVersion: '0.9.8', platform: 'win32', architecture: 'x64' });
  assert.equal(event?.attemptBucket, 'second');
  assert.doesNotMatch(JSON.stringify(event), /email|umid|canvas|grade|prompt|path|timestamp|deviceId/i);
  assert.equal(buildImprovementEvent({ category: 'learning', name: 'page-view' }, { courseWeek: 'week-1', extensionVersion: 'test' }), undefined);
  assert.doesNotMatch(JSON.stringify(normalizeImprovementEvents([{ ...event, studentEmail: 'student@umich.edu', prompt: 'private' }])), /student@|private/);
});

test('queue, protocol, and destination are bounded', () => {
  const event = buildImprovementEvent({ category: 'technical', name: 'setup-result', outcome: 'failure' }, { courseWeek: 'week-1', extensionVersion: 'test', platform: 'linux', architecture: 'arm64' })!;
  let queue: ImprovementEvent[] = [];
  for (let index = 0; index < MAX_LEARNING_IMPROVEMENT_EVENTS + 5; index += 1) queue = appendImprovementEvent(queue, event);
  assert.equal(queue.length, MAX_LEARNING_IMPROVEMENT_EVENTS);
  assert.equal(buildImprovementPayload(queue, 'week-1', ''), undefined);
  assert.equal(buildImprovementPayload(queue, 'week-1', 'HUM-IRB-APPROVED')?.courseId, 'cis450-ece478-fall2026');
  assert.equal(approvedUmichEndpoint('https://research.umich.edu/collect')?.hostname, 'research.umich.edu');
  assert.equal(approvedUmichEndpoint('https://umich.edu.evil.test/collect'), undefined);
  assert.equal(approvedUmichEndpoint('http://research.umich.edu/collect'), undefined);
});
