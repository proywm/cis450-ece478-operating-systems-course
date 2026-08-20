import { COURSEWORK, MODULES, type PracticeQuestion } from './courseData.js';

export const LEARNING_STATE_VERSION = 1;
const DAY_MS = 86_400_000;
const REVIEW_DAYS = [1, 2, 4, 7, 14, 30] as const;
export const MAX_ICS_BYTES = 2 * 1024 * 1024;
export const MAX_ICS_EVENTS = 500;

export type PracticeFocus = 'recommended' | 'due' | 'saved' | 'all';
export type Confidence = 'low' | 'medium' | 'high';

export interface QuestionProgress {
  attempts: number;
  correct: number;
  streak: number;
  stage: number;
  lastCorrect: boolean;
  lastAnsweredAt: string;
  nextReviewAt: string;
  lastConfidence: Confidence;
  saved: boolean;
}

export interface PracticeAttempt {
  questionId: string;
  moduleNumber: number;
  correct: boolean;
  confidence: Confidence;
  answeredAt: string;
}

export interface LearningState {
  version: number;
  questions: Record<string, QuestionProgress>;
  attempts: PracticeAttempt[];
}

export interface PracticeSelection {
  focus: PracticeFocus;
  moduleNumber?: number;
  count?: number;
  now?: Date;
}

export interface TopicAnalytics {
  moduleNumber: number;
  title: string;
  attemptedQuestions: number;
  totalQuestions: number;
  attempts: number;
  accuracy?: number;
  due: number;
  saved: number;
  confidentMisses: number;
}

export function createLearningState(): LearningState {
  return { version: LEARNING_STATE_VERSION, questions: {}, attempts: [] };
}

export function normalizeLearningState(value: unknown): LearningState {
  if (!isRecord(value) || value.version !== LEARNING_STATE_VERSION) return createLearningState();
  const questions: Record<string, QuestionProgress> = {};
  if (isRecord(value.questions)) {
    for (const [id, raw] of Object.entries(value.questions)) {
      if (!questionById(id) || !isRecord(raw)) continue;
      const confidence = confidenceValue(raw.lastConfidence);
      questions[id] = {
        attempts: boundedInteger(raw.attempts, 0, 100_000),
        correct: boundedInteger(raw.correct, 0, 100_000),
        streak: boundedInteger(raw.streak, 0, 100_000),
        stage: boundedInteger(raw.stage, 0, REVIEW_DAYS.length - 1),
        lastCorrect: raw.lastCorrect === true,
        lastAnsweredAt: safeIso(raw.lastAnsweredAt),
        nextReviewAt: safeIso(raw.nextReviewAt),
        lastConfidence: confidence,
        saved: raw.saved === true
      };
      questions[id].correct = Math.min(questions[id].correct, questions[id].attempts);
    }
  }
  const attempts = Array.isArray(value.attempts) ? value.attempts.flatMap((raw): PracticeAttempt[] => {
    if (!isRecord(raw) || typeof raw.questionId !== 'string' || !questionById(raw.questionId)) return [];
    const moduleNumber = Number(raw.moduleNumber);
    if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > MODULES.length) return [];
    return [{ questionId: raw.questionId, moduleNumber, correct: raw.correct === true, confidence: confidenceValue(raw.confidence), answeredAt: safeIso(raw.answeredAt) }];
  }).slice(-1_000) : [];
  return { version: LEARNING_STATE_VERSION, questions, attempts };
}

export function selectPracticeQuestions(state: LearningState, options: PracticeSelection): PracticeQuestion[] {
  const count = boundedInteger(options.count ?? 5, 1, 20);
  const now = options.now ?? new Date();
  let pool = MODULES.flatMap((module) => module.questions.map((question) => ({ question, moduleNumber: module.number })));
  if (options.moduleNumber) pool = pool.filter((item) => item.moduleNumber === options.moduleNumber);
  if (options.focus === 'saved') pool = pool.filter((item) => state.questions[item.question.id]?.saved);
  if (options.focus === 'due') pool = pool.filter((item) => isDue(state.questions[item.question.id], now));
  pool.sort((a, b) => rank(a.question.id, state, now) - rank(b.question.id, state, now) || a.question.id.localeCompare(b.question.id));
  return pool.slice(0, count).map((item) => item.question);
}

export function recordPracticeAnswer(
  state: LearningState,
  questionId: string,
  selectedIndex: number,
  confidence: Confidence,
  now = new Date()
): { state: LearningState; correct: boolean; nextReviewAt: string } {
  const located = questionById(questionId);
  if (!located || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= located.question.choices.length) throw new Error('Practice answer is invalid.');
  const validConfidence = confidenceValue(confidence);
  const previous = state.questions[questionId] ?? emptyQuestionProgress();
  const correct = selectedIndex === located.question.answer;
  const stage = correct ? Math.min(previous.lastCorrect ? previous.stage + 1 : 0, REVIEW_DAYS.length - 1) : 0;
  const delay = correct ? (REVIEW_DAYS[stage] ?? 30) : (validConfidence === 'high' ? 0 : 1);
  const nextReviewAt = new Date(now.getTime() + delay * DAY_MS).toISOString();
  const updated: QuestionProgress = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    streak: correct ? previous.streak + 1 : 0,
    stage,
    lastCorrect: correct,
    lastAnsweredAt: now.toISOString(),
    nextReviewAt,
    lastConfidence: validConfidence,
    saved: previous.saved
  };
  return {
    correct,
    nextReviewAt,
    state: {
      version: LEARNING_STATE_VERSION,
      questions: { ...state.questions, [questionId]: updated },
      attempts: [...state.attempts, { questionId, moduleNumber: located.moduleNumber, correct, confidence: validConfidence, answeredAt: now.toISOString() }].slice(-1_000)
    }
  };
}

export function toggleSavedQuestion(state: LearningState, questionId: string): LearningState {
  if (!questionById(questionId)) throw new Error('Practice question is invalid.');
  const previous = state.questions[questionId] ?? emptyQuestionProgress();
  return { ...state, questions: { ...state.questions, [questionId]: { ...previous, saved: !previous.saved } } };
}

export function practiceAnalytics(state: LearningState, now = new Date()): TopicAnalytics[] {
  return MODULES.map((module) => {
    const ids = new Set(module.questions.map((question) => question.id));
    const attempted = module.questions.filter((question) => (state.questions[question.id]?.attempts ?? 0) > 0);
    const attempts = state.attempts.filter((attempt) => ids.has(attempt.questionId));
    const correct = attempts.filter((attempt) => attempt.correct).length;
    return {
      moduleNumber: module.number,
      title: module.title,
      attemptedQuestions: attempted.length,
      totalQuestions: module.questions.length,
      attempts: attempts.length,
      ...(attempts.length ? { accuracy: correct / attempts.length * 100 } : {}),
      due: module.questions.filter((question) => isDue(state.questions[question.id], now)).length,
      saved: module.questions.filter((question) => state.questions[question.id]?.saved).length,
      confidentMisses: attempts.filter((attempt) => !attempt.correct && attempt.confidence === 'high').length
    };
  });
}

export type CourseworkStatus = 'not-started' | 'planning' | 'working' | 'ready-to-submit' | 'submitted' | 'receipt-confirmed';
export interface CourseworkProgress { status: CourseworkStatus; completedEvidence: string[]; updatedAt: string }

export function normalizeCourseworkStatus(value: unknown): CourseworkStatus {
  return ['not-started', 'planning', 'working', 'ready-to-submit', 'submitted', 'receipt-confirmed'].includes(String(value))
    ? value as CourseworkStatus : 'not-started';
}

export function validCourseworkEvidence(itemId: string, values: unknown): string[] {
  const item = COURSEWORK.find((entry) => entry.id === itemId);
  if (!item || !Array.isArray(values)) return [];
  const allowed = new Set(item.evidence.map((_, index) => `${item.id}-e${index}`));
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && allowed.has(value)))];
}

export interface EvidenceFile { name: string; size: number; isFile: boolean }
export interface EvidenceValidation { safe: boolean; lines: string[]; warnings: string[] }

export function validateEvidenceFiles(files: readonly EvidenceFile[], allowedExtensions: readonly string[]): EvidenceValidation {
  const lines: string[] = [];
  const warnings: string[] = [];
  if (!files.length) return { safe: false, lines, warnings: ['No files were selected.'] };
  if (files.length > 200) return { safe: false, lines, warnings: ['More than 200 files were selected; choose a focused evidence folder.'] };
  const total = files.reduce((sum, file) => sum + (Number.isFinite(file.size) && file.size >= 0 ? file.size : 0), 0);
  if (total > 50 * 1024 * 1024) warnings.push('The selected evidence exceeds 50 MiB. Check the current Canvas upload limits before packaging or submitting.');
  for (const file of files) {
    if (!file.isFile) { warnings.push(`${file.name}: skipped because it is not a regular file.`); continue; }
    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    if (allowedExtensions.length && !allowedExtensions.includes(extension)) warnings.push(`${file.name}: extension is not in this historical planning checklist.`);
  }
  lines.push(`${files.filter((file) => file.isFile).length} regular file(s), ${(total / 1024 / 1024).toFixed(2)} MiB total.`);
  lines.push('No file was uploaded, modified, renamed, archived, or submitted by this validation.');
  return { safe: warnings.every((warning) => !/skipped because/i.test(warning)), lines, warnings };
}

export interface CanvasEvent { id: string; title: string; startsAt: string; allDay: boolean; url?: string }

export function parseCanvasIcs(ics: string): CanvasEvent[] {
  if (Buffer.byteLength(ics, 'utf8') > MAX_ICS_BYTES) throw new Error('Calendar file exceeds the 2 MiB local import limit.');
  const unfolded = ics.replace(/\r?\n[ \t]/g, '');
  const blocks = unfolded.split(/BEGIN:VEVENT\r?\n/).slice(1);
  const events: CanvasEvent[] = [];
  for (const [index, block] of blocks.entries()) {
    if (events.length >= MAX_ICS_EVENTS) break;
    const body = block.split(/\r?\nEND:VEVENT/)[0] ?? '';
    const title = unescapeIcs(property(body, 'SUMMARY')?.value ?? '').trim().slice(0, 300);
    const start = property(body, 'DTSTART');
    if (!title || !start) continue;
    const parsed = parseIcsDate(start.value, start.parameters);
    if (!parsed) continue;
    const rawUrl = unescapeIcs(property(body, 'URL')?.value ?? '').trim();
    events.push({ id: unescapeIcs(property(body, 'UID')?.value ?? `canvas-${index}`).slice(0, 300), title, ...parsed, ...(safeCanvasUrl(rawUrl) ? { url: rawUrl } : {}) });
  }
  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function safeCanvasUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'canvas.umd.umich.edu') return undefined;
    if (url.username || url.password) return undefined;
    url.hash = '';
    return url;
  } catch { return undefined; }
}

export type QuestionRoute = 'discussion' | 'private-message';
export interface PreClassDraft { topic: string; question: string; understanding: string; attempted: string; route: QuestionRoute; anonymityRequested: boolean }

export function formatPreClassQuestion(value: unknown): { text: string; route: QuestionRoute; anonymityRequested: boolean } | undefined {
  if (!isRecord(value)) return undefined;
  const route = value.route === 'private-message' ? 'private-message' : value.route === 'discussion' ? 'discussion' : undefined;
  const topic = boundedText(value.topic, 160);
  const question = boundedText(value.question, 2_000);
  if (!route || !topic || !question) return undefined;
  const understanding = boundedText(value.understanding, 2_000);
  const attempted = boundedText(value.attempted, 2_000);
  const parts = [`Topic: ${topic}`, `Question for an upcoming class:\n${question}`];
  if (understanding) parts.push(`What I understand so far:\n${understanding}`);
  if (attempted) parts.push(`What I already tried or checked:\n${attempted}`);
  parts.push('Requested support: please consider addressing this concept, example, or decision point in class.');
  return { text: parts.join('\n\n'), route, anonymityRequested: value.anonymityRequested === true };
}

export const WALKTHROUGH_STEPS = [
  { id: 'authority', title: 'Start with Canvas', detail: 'Configure the direct Fall 2026 course link when it is known. Canvas—not this extension—controls deadlines, submissions, policies, and official grades.' },
  { id: 'prepare', title: 'Prepare before class', detail: 'For each module: read the mapped OSTEP section, read the accessible explanation, answer readiness questions, and note one uncertainty.' },
  { id: 'practice', title: 'Practice in five-question sessions', detail: 'Choose recommended, due, saved, or module-specific questions. Explanations and review dates stay only on this device.' },
  { id: 'build', title: 'Build observable OS behavior', detail: 'Use a guided starter to predict, run, capture evidence, and explain a process, memory, concurrency, or file-system behavior.' },
  { id: 'coursework', title: 'Use mission control carefully', detail: 'Track planning evidence locally, then open the current Canvas assignment and submit there. Local status is never an instructor or Canvas evaluation.' },
  { id: 'help', title: 'Ask without outsourcing the work', detail: 'Use the offline FAQ/helper for navigation and reasoning prompts. For assessed work, bring your attempt and ask for a hint or feedback—not a finished answer.' },
  { id: 'questions', title: 'Send a question before class', detail: 'The composer copies a structured draft and opens a configured Canvas route. It never posts automatically and cannot promise anonymity.' },
  { id: 'recover', title: 'You remain in control', detail: 'Skip now, rerun from Course home, reset local learning data, or rely only on accessible HTML and Canvas.' }
] as const;

export const FAQS = [
  { id: 'authority', question: 'Where are deadlines and submissions?', answer: 'Open the current Canvas course. The extension intentionally does not invent dates or submit work. Imported Canvas calendar items are local reminders only.' },
  { id: 'progress', question: 'Is local progress part of my grade?', answer: 'No. Status, confidence, attempts, saved questions, review dates, and mission-control checkmarks stay in VS Code and are self-evaluation only. Instructor evaluations in Canvas are official.' },
  { id: 'practice', question: 'How should I use readiness practice?', answer: 'Try a five-question session without notes, record confidence, read every explanation and source, then review due, missed, uncertain, or saved questions later.' },
  { id: 'docker', question: 'Why use the portable Docker workspace?', answer: 'It provides a visible, consistent C/pthread/debugging tool recipe across common hosts. The extension never installs Docker silently; host virtualization and course-specific xv6 setup still require verification.' },
  { id: 'xv6', question: 'Which xv6 version should I install?', answer: 'Use only the revision and setup named in the current Fall 2026 Canvas assignment. Historical material is insufficient to choose the active revision.' },
  { id: 'ai', question: 'Can the helper write my homework or project?', answer: 'No. It can map concepts, ask diagnostic questions, explain an analogous example, or review your own reasoning. Canvas defines allowed AI/collaboration use for each assessed task.' },
  { id: 'anonymous', question: 'Can I post anonymously before class?', answer: 'The extension cannot post or guarantee anonymity. It copies a draft and opens Canvas. Anonymity exists only if Canvas explicitly offers it and you verify the selected option before posting.' },
  { id: 'staff', question: 'Who can help me?', answer: 'Dr. Probir Roy is in CIS Building, Room 230. No GSI or grader is currently assigned or confirmed; check Canvas and department announcements for updates. Current office hours and changes must also be checked in Canvas.' },
  { id: 'errors', question: 'What should I include when asking about an error?', answer: 'Include the exact command, full error, smallest reproducing input, expected behavior, observed behavior, environment versions, and what you already tried. Do not send secrets or unrelated files.' },
  { id: 'accessibility', question: 'Is there a non-interactive course format?', answer: 'Yes. The extension packages semantic standalone HTML lessons and syllabus pages that work without scripts and can be uploaded to Canvas after instructor/accessibility review.' }
] as const;

function questionById(id: string): { question: PracticeQuestion; moduleNumber: number } | undefined {
  for (const module of MODULES) {
    const question = module.questions.find((item) => item.id === id);
    if (question) return { question, moduleNumber: module.number };
  }
  return undefined;
}

function emptyQuestionProgress(): QuestionProgress {
  return { attempts: 0, correct: 0, streak: 0, stage: 0, lastCorrect: false, lastAnsweredAt: new Date(0).toISOString(), nextReviewAt: new Date(0).toISOString(), lastConfidence: 'medium', saved: false };
}

function isDue(progress: QuestionProgress | undefined, now: Date): boolean {
  return Boolean(progress?.attempts && Date.parse(progress.nextReviewAt) <= now.getTime());
}

function rank(id: string, state: LearningState, now: Date): number {
  const progress = state.questions[id];
  if (!progress) return 10;
  if (isDue(progress, now)) return progress.lastCorrect ? 1 : 0;
  if (!progress.lastCorrect) return 3;
  return 20 + progress.stage;
}

function confidenceValue(value: unknown): Confidence {
  return value === 'low' || value === 'high' ? value : 'medium';
}

function property(block: string, name: string): { value: string; parameters: Record<string, string> } | undefined {
  const match = block.match(new RegExp(`(?:^|\\r?\\n)${name}((?:;[^:]*)?):(.*)(?:\\r?\\n|$)`, 'i'));
  if (!match) return undefined;
  const parameters: Record<string, string> = {};
  for (const segment of (match[1] ?? '').split(';').filter(Boolean)) {
    const separator = segment.indexOf('=');
    if (separator > 0) parameters[segment.slice(0, separator).toUpperCase()] = segment.slice(separator + 1).replace(/^"|"$/g, '');
  }
  return { value: (match[2] ?? '').trim(), parameters };
}

function parseIcsDate(value: string, parameters: Record<string, string>): Pick<CanvasEvent, 'startsAt' | 'allDay'> | undefined {
  const compact = value.trim();
  if (parameters.VALUE?.toUpperCase() === 'DATE' || /^\d{8}$/.test(compact)) {
    if (!/^\d{8}$/.test(compact)) return undefined;
    const year = Number(compact.slice(0, 4)), month = Number(compact.slice(4, 6)), day = Number(compact.slice(6, 8));
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return undefined;
    return { startsAt: `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`, allDay: true };
  }
  const match = compact.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc === 'Z') {
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    return Number.isNaN(date.getTime()) ? undefined : { startsAt: date.toISOString(), allDay: false };
  }
  const startsAt = zonedLocalToIso({ year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) }, parameters.TZID ?? 'America/Detroit');
  return startsAt ? { startsAt, allDay: false } : undefined;
}

function zonedLocalToIso(parts: Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>, zone: string): string | undefined {
  try {
    const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    let candidate = desired;
    for (let i = 0; i < 3; i += 1) candidate = desired - zoneOffset(candidate, zone);
    const observed = zonedParts(candidate, zone);
    if (Object.entries(parts).some(([key, value]) => observed[key] !== value)) return undefined;
    return new Date(candidate).toISOString();
  } catch { return undefined; }
}

function zoneOffset(timestamp: number, zone: string): number {
  const parts = zonedParts(timestamp, zone);
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!) - timestamp;
}

function zonedParts(timestamp: number, zone: string): Record<string, number> {
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  return Object.fromEntries(formatter.formatToParts(new Date(timestamp)).filter((part) => ['year', 'month', 'day', 'hour', 'minute', 'second'].includes(part.type)).map((part) => [part.type, Number(part.value)]));
}

function unescapeIcs(value: string): string { return value.replaceAll('\\n', '\n').replaceAll('\\,', ',').replaceAll('\\;', ';').replaceAll('\\\\', '\\'); }
function boundedText(value: unknown, max: number): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function boundedInteger(value: unknown, min: number, max: number): number { const number = Number(value); return Number.isInteger(number) ? Math.max(min, Math.min(max, number)) : min; }
function safeIso(value: unknown): string { const date = typeof value === 'string' ? new Date(value) : new Date(0); return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString(); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
