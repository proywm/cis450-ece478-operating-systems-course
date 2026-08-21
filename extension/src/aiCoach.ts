export const AI_ASSISTANCE_ONBOARDING_VERSION = 4;
export type AiAssistancePreference = 'codex' | 'offline';
export interface AiAssistanceState {
  version: number;
  preference: AiAssistancePreference;
  verifiedAt: string;
  verification: 'student-confirmed' | 'local-ready';
}

export function normalizeAiAssistanceState(value: unknown): AiAssistanceState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<AiAssistanceState>;
  if (candidate.version !== AI_ASSISTANCE_ONBOARDING_VERSION) return undefined;
  if (!['codex', 'offline'].includes(String(candidate.preference))) return undefined;
  if (!['student-confirmed', 'local-ready'].includes(String(candidate.verification))) return undefined;
  if (typeof candidate.verifiedAt !== 'string' || !Number.isFinite(Date.parse(candidate.verifiedAt))) return undefined;
  return candidate as AiAssistanceState;
}

export function aiAssistanceState(
  preference: AiAssistancePreference,
  verification: AiAssistanceState['verification'],
  now = new Date()
): AiAssistanceState {
  return { version: AI_ASSISTANCE_ONBOARDING_VERSION, preference, verifiedAt: now.toISOString(), verification };
}

export function aiAssistanceLabel(preference: AiAssistancePreference): string {
  if (preference === 'codex') return 'U-M Codex CLI learning and setup coach';
  return 'private offline Orbit helper';
}

export type CoachRequest =
  | { allowed: true; prompt: string }
  | { allowed: false; explanation: string };

const directSolutionRequest = /\b(?:give|write|provide|tell|show)\b.{0,32}\b(?:answer|solution|code|implementation|patch|report)\b|\bsolve\b.{0,28}\b(?:homework|assignment|project|lab|pa[1-4]|hw[1-3])\b|\bdo (?:my|the) (?:homework|assignment|project|lab)\b/i;
const assessedWork = /\b(?:homework|assignment|project|lab|pa[1-4]|hw[1-3]|scheduler|traffic control|xv6)\b/i;
const coursePretest = /\b(?:pre[- ]?test|beginning[- ]of[- ]course diagnostic|systems foundations diagnostic)\b/i;

export const LEARNING_COACH_SYSTEM_PROMPT = [
  'You are the CIS 450 / ECE 478 operating-systems learning coach inside SystemStudio at the University of Michigan-Dearborn.',
  'Coach concepts from the course map: virtualization, processes, scheduling, address translation, paging, concurrency, synchronization, I/O, file systems, persistence, the mapped OSTEP readings, and solution-free xv6 debugging.',
  'Ask for the student’s prediction, attempt, observed evidence, and earliest uncertain step before giving help.',
  'Give one hint, diagnostic question, or small analogous example at a time. Explain why it helps and end with a check-for-understanding question.',
  'Never provide a finished graded answer, complete assignment implementation, submission-ready patch, report, or fabricated deadline.',
  'The beginning-of-course pre-test is ungraded but must represent the student’s unaided baseline; do not answer, solve, check, or transform any pre-test item.',
  'For xv6 or C debugging, help the student locate an invariant, state transition, trace, or first mismatch without writing the assessed implementation.',
  'Say when a claim must be checked against the mapped OSTEP chapter, accessible lesson, public preflight contract, syllabus, or current Canvas assignment.',
  'Do not claim access to Canvas, grades, private course data, local files, or sources that were not included in the conversation.'
].join(' ');

export function courseAgentsMd(): string {
  return `# CIS 450 / ECE 478 Codex learning-coach instructions

${LEARNING_COACH_SYSTEM_PROMPT}

## Required interaction pattern

- Treat this workspace as student-owned course work. Ask whether the work is practice or currently graded before proposing edits.
- Ask for the student's prediction, attempt, observed evidence, and earliest uncertain step. Give one hint or smaller analogous example at a time.
- Do not produce a completed homework answer, xv6 patch, pthread assignment, report, or submission-ready artifact.
- Do not answer, solve, check, or transform the ungraded beginning-of-course pre-test; ask the student to submit their unaided baseline instead.
- Explain any proposed command before running it. Prefer inspection and formative public preflights; do not weaken, replace, or fabricate tests.
- For C or xv6 debugging, help locate an invariant, state transition, trace, or first mismatch without writing the assessed implementation.
- Never request, read, print, or store U-M credentials, API keys, Canvas cookies, grades, or unrelated private files.
- Treat current Canvas instructions, the syllabus, and instructor directions as authoritative when they differ from local material.
- Before editing student work or running a command, make the intended change and evidence goal explicit and respect the student's selected Codex permissions.
`;
}

/** Apply a deterministic academic-integrity boundary before any prompt reaches an LLM. */
export function prepareCoachRequest(question: string): CoachRequest {
  const clean = question.trim().slice(0, 6_000);
  if (!clean) {
    return { allowed: false, explanation: 'Describe the concept, your prediction or attempt, and the earliest step that is unclear.' };
  }
  if (coursePretest.test(clean)) {
    return {
      allowed: false,
      explanation: 'The beginning-of-course pre-test is ungraded, but it must show your unaided baseline. Complete and submit it without AI help; afterward, the learning coach can help you study the same prerequisite topics using different examples.'
    };
  }
  if (directSolutionRequest.test(clean) && assessedWork.test(clean)) {
    return {
      allowed: false,
      explanation: 'The learning coach will not produce a graded answer or submission-ready implementation. Describe your prediction, attempt, observed evidence, and first mismatch; then ask for one hint or a smaller analogous example.'
    };
  }
  return {
    allowed: true,
    prompt: [
      'Student request:', clean,
      '',
      'Respond as an operating-systems learning coach. Ask for a missing attempt or prediction when necessary. Give at most one next hint or analogous example, explain its purpose, and ask one check-for-understanding question.'
    ].join('\n')
  };
}

export function moduleCoachPrompt(module: { number: number; title: string; objectives: readonly string[]; readings: readonly { chapter: string; title: string }[]; handsOn: string }): string {
  return [
    `I am working on CIS 450 / ECE 478 Module ${module.number}: ${module.title}.`,
    `Mapped reading: ${module.readings.map((reading) => `${reading.chapter}: ${reading.title}`).join('; ')}.`,
    `Learning objectives: ${module.objectives.join('; ')}.`,
    `Hands-on context: ${module.handsOn}`,
    'Please ask what I predicted or tried, identify my earliest uncertainty, and give one hint or a smaller analogous example—not an assignment solution.'
  ].join('\n');
}

/** Build a bounded, student-reviewed setup prompt without attaching files or full logs. */
export function setupCoachPrompt(area: string, diagnostic: string): string {
  const safeArea = area.replace(/[\r\n]+/g, ' ').trim().slice(0, 120) || 'portable OS course environment';
  const safeDiagnostic = diagnostic.replace(/[\r\n]+/g, ' ').trim().slice(0, 1_200) || 'No diagnostic detail was reported.';
  return [
    `Help me diagnose the ${safeArea} setup without doing coursework for me.`,
    `The local diagnostic says: ${safeDiagnostic}`,
    'First explain in plain language what is ready, what is missing, and whether it is a host requirement or something supplied by the course container.',
    'Then give exactly one safe next step and tell me what successful verification should look like before I retry.',
    'Do not ask for credentials, tokens, private files, grades, or unrestricted system logs. Do not claim the setup succeeded unless I report the verification result.'
  ].join('\n');
}
