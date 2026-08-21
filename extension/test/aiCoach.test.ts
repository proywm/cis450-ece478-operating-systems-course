import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AI_ASSISTANCE_ONBOARDING_VERSION, aiAssistanceLabel, aiAssistanceState, courseAgentsMd, moduleCoachPrompt, normalizeAiAssistanceState, prepareCoachRequest, setupCoachPrompt } from '../src/aiCoach.js';
import { MODULES } from '../src/courseData.js';

test('AI coach blocks direct assessed-work solutions before model access', () => {
  const blocked = prepareCoachRequest('Write the complete code solution for my xv6 scheduler assignment.');
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.match(blocked.explanation, /will not produce a graded answer/i);
  const allowed = prepareCoachRequest('I predicted RUNNABLE to RUNNING after scheduling, but my trace differs after yield. What invariant should I inspect first?');
  assert.equal(allowed.allowed, true);
  if (allowed.allowed) assert.match(allowed.prompt, /one next hint/i);
});

test('AI coach refuses to compromise the ungraded pre-test baseline', () => {
  const blocked = prepareCoachRequest('Check my answers to the beginning-of-course pre-test and tell me which ones are wrong.');
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.match(blocked.explanation, /unaided baseline/i);
});

test('course workspaces carry persistent learning and credential guardrails', () => {
  const agents = courseAgentsMd();
  assert.match(agents, /prediction, attempt, observed evidence/);
  assert.match(agents, /Do not produce a completed homework answer/);
  assert.match(agents, /beginning-of-course pre-test/);
  assert.match(agents, /Never request, read, print, or store U-M credentials/);
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

test('first-run assistance uses U-M Codex and rejects stale provider state', async () => {
  const state = aiAssistanceState('codex', 'local-ready', new Date('2026-08-21T12:00:00Z'));
  assert.deepEqual(normalizeAiAssistanceState(state), state);
  assert.equal(normalizeAiAssistanceState({ ...state, version: AI_ASSISTANCE_ONBOARDING_VERSION - 1 }), undefined);
  assert.match(aiAssistanceLabel('codex'), /Codex CLI learning and setup coach/i);
  const source = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(source, /probeCodexCli/);
  assert.match(source, /Open official U-M setup/);
  assert.doesNotMatch(source, /Maizey|U-M GPT/);
  assert.doesNotMatch(source, /selectChatModels|COPILOT_SETUP_URL/);
});
