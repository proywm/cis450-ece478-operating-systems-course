const UM_TUTOR_HOSTS = new Set(['maizey.umich.edu', 'umgpt.umich.edu']);

export const AI_ASSISTANCE_ONBOARDING_VERSION = 2;
export type AiAssistancePreference = 'maizey' | 'umgpt' | 'offline';
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
  if (!['maizey', 'umgpt', 'offline'].includes(String(candidate.preference))) return undefined;
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
  if (preference === 'maizey') return 'U-M Maizey course and setup coach';
  if (preference === 'umgpt') return 'U-M GPT general learning and setup coach';
  return 'private offline Orbit helper';
}

export type TutorDestination =
  | { kind: 'canvas'; url: string }
  | { kind: 'maizey-app'; url: string }
  | { kind: 'maizey-management'; url: string }
  | { kind: 'invalid' };

export type CoachRequest =
  | { allowed: true; prompt: string }
  | { allowed: false; explanation: string };

const directSolutionRequest = /\b(?:give|write|provide|tell|show)\b.{0,32}\b(?:answer|solution|code|implementation|patch|report)\b|\bsolve\b.{0,28}\b(?:homework|assignment|project|lab|pa[1-4]|hw[1-3])\b|\bdo (?:my|the) (?:homework|assignment|project|lab)\b/i;
const assessedWork = /\b(?:homework|assignment|project|lab|pa[1-4]|hw[1-3]|scheduler|traffic control|xv6)\b/i;

export const LEARNING_COACH_SYSTEM_PROMPT = [
  'You are the CIS 450 / ECE 478 operating-systems learning coach inside SystemStudio at the University of Michigan-Dearborn.',
  'Coach concepts from the course map: virtualization, processes, scheduling, address translation, paging, concurrency, synchronization, I/O, file systems, persistence, the mapped OSTEP readings, and solution-free xv6 debugging.',
  'Ask for the student’s prediction, attempt, observed evidence, and earliest uncertain step before giving help.',
  'Give one hint, diagnostic question, or small analogous example at a time. Explain why it helps and end with a check-for-understanding question.',
  'Never provide a finished graded answer, complete assignment implementation, submission-ready patch, report, or fabricated deadline.',
  'For xv6 or C debugging, help the student locate an invariant, state transition, trace, or first mismatch without writing the assessed implementation.',
  'Say when a claim must be checked against the mapped OSTEP chapter, accessible lesson, public preflight contract, syllabus, or current Canvas assignment.',
  'Do not claim access to Canvas, grades, private course data, local files, or sources that were not included in the conversation.'
].join(' ');

/** Classify only student-facing U-M tutor destinations; reject management pages. */
export function classifyTutorDestination(value: string): TutorDestination {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return { kind: 'invalid' };
    if (parsed.hostname === 'canvas.umd.umich.edu') {
      return /^\/courses\/\d+(?:\/|$)/.test(parsed.pathname)
        ? { kind: 'canvas', url: parsed.toString() }
        : { kind: 'invalid' };
    }
    if (!UM_TUTOR_HOSTS.has(parsed.hostname)) return { kind: 'invalid' };
    const managementSegment = parsed.pathname.toLowerCase().split('/').some((segment) =>
      ['detail', 'overview', 'settings', 'data-sources', 'datasources', 'billing'].includes(segment)
    );
    return managementSegment
      ? { kind: 'maizey-management', url: parsed.toString() }
      : { kind: 'maizey-app', url: parsed.toString() };
  } catch {
    return { kind: 'invalid' };
  }
}

/** Apply a deterministic academic-integrity boundary before any prompt reaches an LLM. */
export function prepareCoachRequest(question: string): CoachRequest {
  const clean = question.trim().slice(0, 6_000);
  if (!clean) {
    return { allowed: false, explanation: 'Describe the concept, your prediction or attempt, and the earliest step that is unclear.' };
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
