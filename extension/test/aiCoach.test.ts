import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AI_ASSISTANCE_ONBOARDING_VERSION, aiAssistanceLabel, aiAssistanceState, classifyTutorDestination, moduleCoachPrompt, normalizeAiAssistanceState, prepareCoachRequest, setupCoachPrompt } from '../src/aiCoach.js';
import { MODULES } from '../src/courseData.js';

test('AI coach blocks direct assessed-work solutions before model access', () => {
  const blocked = prepareCoachRequest('Write the complete code solution for my xv6 scheduler assignment.');
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.match(blocked.explanation, /will not produce a graded answer/i);
  const allowed = prepareCoachRequest('I predicted RUNNABLE to RUNNING after scheduling, but my trace differs after yield. What invariant should I inspect first?');
  assert.equal(allowed.allowed, true);
  if (allowed.allowed) assert.match(allowed.prompt, /one next hint/i);
});

test('Maizey routing accepts student apps and rejects management pages', () => {
  assert.equal(classifyTutorDestination('https://umgpt.umich.edu/maizey/course-chat').kind, 'maizey-app');
  assert.equal(classifyTutorDestination('https://umgpt.umich.edu/maizey/abc/detail/overview').kind, 'maizey-management');
  assert.equal(classifyTutorDestination('https://example.com/chat').kind, 'invalid');
});

test('module coach prompt is bounded by mapped OS sources and objectives', () => {
  const prompt = moduleCoachPrompt(MODULES[6]!);
  assert.match(prompt, /Module 7/);
  assert.match(prompt, /Mapped reading: Chapter 26/);
  assert.match(prompt, /not an assignment solution/i);
});

test('setup coach prompt is bounded, actionable, and privacy-safe', () => {
  const prompt = setupCoachPrompt('Docker environment\n', 'named-pipe failure\nsecret-looking detail');
  assert.match(prompt, /host requirement|course container/i);
  assert.match(prompt, /exactly one safe next step/i);
  assert.match(prompt, /credentials, tokens, private files, grades/i);
  assert.doesNotMatch(prompt, /\nsecret-looking detail/);
});

test('first-run assistance uses U-M services and rejects stale provider state', async () => {
  const state = aiAssistanceState('umgpt', 'student-confirmed', new Date('2026-08-21T12:00:00Z'));
  assert.deepEqual(normalizeAiAssistanceState(state), state);
  assert.equal(normalizeAiAssistanceState({ ...state, version: AI_ASSISTANCE_ONBOARDING_VERSION - 1 }), undefined);
  assert.match(aiAssistanceLabel('maizey'), /course and setup coach/i);
  assert.match(aiAssistanceLabel('umgpt'), /general learning and setup coach/i);
  const source = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(source, /Yes, U-M GPT opens/);
  assert.doesNotMatch(source, /selectChatModels|COPILOT_SETUP_URL/);
});
