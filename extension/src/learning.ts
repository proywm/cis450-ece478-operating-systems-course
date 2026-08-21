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
  { id: 'assistance', title: 'Choose and check Orbit assistance', detail: 'Before setup, choose the published U-M Maizey course coach, no-cost U-M GPT, or private offline Orbit. AI is optional, changeable, and never blocks course access.' },
  { id: 'setup', title: 'Let Orbit set up and verify the environment', detail: 'Run one guided workflow. Orbit performs the checks and actions it can safely perform; if it stops, review the short privacy-filtered diagnostic before sharing it with the selected helper.' },
  { id: 'authority', title: 'Start with the Fall 2026 Canvas course', detail: 'The verified course link opens course 552201. Canvas—not this extension—controls deadlines, submissions, policies, announcements, and official grades.' },
  { id: 'schedule', title: 'Use the dated reading plan', detail: 'Open Course plan to see every Monday/Wednesday meeting mapped to specific OSTEP chapters. It is a preparation plan; Canvas announcements control topic changes.' },
  { id: 'prepare', title: 'Prepare before class', detail: 'For each module: open every mapped OSTEP chapter, use its focus prompt, read the accessible explanation, answer the eight reading-aligned questions, and note one uncertainty.' },
  { id: 'practice', title: 'Practice in five-question sessions', detail: 'Choose recommended, due, saved, or module-specific questions. Explanations and review dates stay only on this device.' },
  { id: 'simulate', title: 'Predict with official OSTEP simulators', detail: 'Prepare the pinned official simulator workspace once. Run a mapped preset without -c, record your prediction, then explicitly reveal the same trace and explain the first mismatch.' },
  { id: 'build', title: 'Build observable OS behavior', detail: 'Use a guided starter to predict, run, capture evidence, and explain a process, memory, concurrency, or file-system behavior.' },
  { id: 'portable', title: 'Use one coursework environment', detail: 'Create the portable coursework workspace once. Run the HW1, HW2, HW3, or PA3 prerequisite preflight through the supplied Linux container on Windows, macOS, or Linux; the result is formative, not a grade.' },
  { id: 'xv6', title: 'Prepare and preflight xv6', detail: 'Create the pinned official x86 xv6 reference workspace, read its guide, compare it with the active Canvas prompt, and run the matching PA1A, PA1B, or PA2 behavioral preflight before submission.' },
  { id: 'coursework', title: 'Use mission control carefully', detail: 'Track planning evidence locally, then open the current Canvas assignment and submit there. Local status is never an instructor or Canvas evaluation.' },
  { id: 'grades', title: 'Plan a grade without confusing it with Canvas', detail: 'Copy category percentages manually or try a what-if value. The predictor shows weighted contributions, pre-final standing, and the final-exam score needed for a target. It uses carried-forward historical weights, drops no scores, and is never official.' },
  { id: 'help', title: 'Ask without outsourcing the work', detail: 'Use the offline FAQ/helper or optional animated companion for navigation and reasoning prompts. The companion only opens local tools. For assessed work, bring your attempt and ask for a hint or feedback—not a finished answer.' },
  { id: 'questions', title: 'Send a question before class', detail: 'The composer copies a structured draft and opens a configured Canvas route. It never posts automatically and cannot promise anonymity.' },
  { id: 'recover', title: 'You remain in control', detail: 'Skip now, rerun from Course home, reset local learning data, or rely only on accessible HTML and Canvas.' }
] as const;

export const FAQS = [
  { id: 'authority', question: 'Where are deadlines and submissions?', answer: 'Open the verified Fall 2026 Canvas course at https://canvas.umd.umich.edu/courses/552201. The extension intentionally does not invent assessed-work dates or submit work. Imported Canvas calendar items are local reminders only.' },
  { id: 'reading-plan', question: 'Which OSTEP chapters should I read before each class?', answer: 'Open Course plan. Every one of the 27 verified Monday/Wednesday meetings has a planned topic and chapter assignment, and every module lists the individual official chapter links plus a focus prompt. Canvas announcements override topic changes.' },
  { id: 'progress', question: 'Is local progress part of my grade?', answer: 'No. Status, confidence, attempts, saved questions, review dates, and mission-control checkmarks stay in VS Code and are self-evaluation only. Instructor evaluations in Canvas are official.' },
  { id: 'practice', question: 'How should I use readiness practice?', answer: 'Try a five-question session without notes, record confidence, read every explanation and source, then review due, missed, uncertain, or saved questions later.' },
  { id: 'ostep-simulators', question: 'Where are the OSTEP chapter simulations, and do they reveal answers?', answer: 'Open OSTEP simulations. The extension fetches the official OSTEP homework repository at one release-tested revision after your consent; it does not bundle or modify that source. New prediction problem omits -c. Reveal after prediction adds -c only after you confirm that your work is recorded. Both are formative learning runs—not Canvas answers, grades, uploads, or submissions.' },
  { id: 'docker', question: 'Why use the portable Docker workspace?', answer: 'It provides one visible linux/amd64 C/pthread/Python/debugging recipe on Windows, macOS, and Linux and a fallback for the pinned xv6 QEMU preflight. The extension never installs or starts Docker silently; it displays the recipe and checks the client, Compose, and engine before execution.' },
  { id: 'compiler', question: 'Do I need to install a separate compiler for each assignment?', answer: 'No. Create the portable coursework workspace once. Its container includes the C/pthread compiler, Make, Python, GDB, Valgrind, strace, and QEMU used by the formative routes for HW1, HW2, HW3, and PA3. Docker itself must be installed and running; use the cross-platform setup guide if the environment check reports a missing prerequisite.' },
  { id: 'xv6', question: 'Which xv6 version should I use?', answer: 'The verified reference path pins the official MIT x86 xv6-public source at commit eeb7b415dbcb12cc362d0783e41c3d1f44066b17 because it matches the historical Winter 2026 PA1/PA2 materials. First compare the current Fall 2026 Canvas assignment: Canvas may name a different source, revision, behavior, or test. The extension does not silently substitute the reference for an active assignment.' },
  { id: 'xv6-test', question: 'What does a passing xv6 preflight prove?', answer: 'It proves that the selected local workspace passed the stated public build, QEMU, trace, and regression assertions. It is not a proof of every scheduler interleaving, an instructor/GSI evaluation, a Canvas grade, an upload, or a submission.' },
  { id: 'apple-silicon', question: 'QEMU flickers or will not accept input on my Apple-silicon Mac. What should I do?', answer: 'Use the extension’s headless xv6 preflight through the supplied linux/amd64 Docker route; it drives qemu-nox through a terminal and does not depend on a graphical emulator window. First run the environment check and confirm that Docker Desktop is running. If the preflight fails, keep the first full error and environment report instead of repeatedly deleting the image. A managed or incompatible computer still requires an instructor-approved Linux fallback.' },
  { id: 'archive', question: 'My downloaded or extracted xv6 folder looks broken. How do I recover?', answer: 'Create a new pinned xv6 reference workspace from the extension. It clones and verifies the exact official commit, refuses to overwrite an existing target, and avoids nested archive/extraction ambiguity. Compare the current Canvas source requirement before using it; do not copy changes from a damaged tree until the clean PA1A baseline passes.' },
  { id: 'boot-evidence', question: 'What should my xv6 boot evidence show?', answer: 'The current Canvas rubric is authoritative. For the historical reference, the PA1A preflight now uses two CPUs and checks the cpu0 and cpu1 start messages, init starting the shell, and an interactive marker command. Keep the command, source commit, environment route, and complete relevant transcript. Add identity, time, screenshots, or a report only when Canvas explicitly requires them.' },
  { id: 'xv6-bridge', question: 'I understand the scheduling algorithm on paper but cannot translate it into xv6. Where do I start?', answer: 'Write the scheduler invariants and one expected trace first. Then locate the current process state, runnable-to-running transition, timer accounting, sleep/wakeup path, and lock discipline in the pinned source. Add one observable change, run the smallest matching preflight, and explain the first mismatch. The helper can discuss an analogous trace but will not supply the assessed kernel implementation.' },
  { id: 'c-bridge', question: 'My C, Make, or pthread background is weak. What preparation is available?', answer: 'Start with Module 1 and create the portable coursework workspace. Run the environment preflight, then Modules 2 and 7–10 in order: process API, thread/race, lock invariant, condition buffer, and deadlock model. Each public starter has an exact build command and evidence checklist; none is an assignment solution.' },
  { id: 'pa3-spec', question: 'My synchronization program runs, but a scenario still fails. What should I test?', answer: 'Separate the specification into observable invariants: no conflicting actors together, the required earlier-arrival/tie rule, progress when a lane is eligible, and termination. Build deterministic traces for each rule, including simultaneous and cross-lane arrivals, then inspect the first event that violates the expected order. Use the current Canvas wording because historical traffic-control rules may change.' },
  { id: 'feedback', question: 'How can I get feedback before official grading?', answer: 'Use the local readiness questions, guided-lab evidence steps, portable prerequisite checks, and xv6 preflights for immediate formative feedback. They are not grades. For instructor feedback, send one focused Canvas message with the requirement, smallest attempt, expected behavior, actual behavior, exact command/error, and relevant diff or trace. No GSI or grader is currently confirmed.' },
  { id: 'canvas-total', question: 'Why might the Canvas total differ from the extension’s estimate?', answer: 'The extension’s calculator uses the historical 10/15/40/15/20 policy only as a planning estimate. Canvas may show a raw points total, unpublished items, exclusions, or a Fall 2026 policy change. Use the official syllabus-weighted result and instructor record in Canvas.' },
  { id: 'ai', question: 'Can the helper write my homework or project?', answer: 'No. It can map concepts, ask diagnostic questions, explain an analogous example, or review your own reasoning. Canvas defines allowed AI/collaboration use for each assessed task.' },
  { id: 'ai-options', question: 'Which U-M AI service should I use?', answer: 'Use the published course Maizey App for course-grounded questions and guided setup diagnostics. U-M GPT is a no-cost general assistant for active students when broader troubleshooting is useful. U-M Gemini is another approved general chat option, and NotebookLM can answer from sources a student uploads; neither automatically knows this course. Orbit never uses an instructor API key or a private instructor-hosted model.' },
  { id: 'setup-ai', question: 'Can Maizey install or repair the environment for me?', answer: 'Maizey can explain a reviewed short diagnostic and recommend one safe next step from indexed course documentation. It cannot inspect the computer, click dialogs, install software, accept licenses, elevate privileges, or verify success. Orbit performs local checks and safe actions; the student confirms the result before continuing.' },
  { id: 'anonymous', question: 'Can I post anonymously before class?', answer: 'The extension cannot post or guarantee anonymity. It copies a draft and opens Canvas. Anonymity exists only if Canvas explicitly offers it and you verify the selected option before posting.' },
  { id: 'staff', question: 'Who can help me?', answer: 'Dr. Probir Roy is in CIS Building, Room 230. No GSI or grader is currently assigned or confirmed; check Canvas and department announcements for updates. Current office hours and changes must also be checked in Canvas.' },
  { id: 'errors', question: 'What should I include when asking about an error?', answer: 'Include the exact command, full error, smallest reproducing input, expected behavior, observed behavior, environment versions, and what you already tried. Do not send secrets or unrelated files.' },
  { id: 'accessibility', question: 'Is there a non-interactive course format?', answer: 'Yes. The extension packages semantic standalone HTML lessons and syllabus pages that work without scripts and can be uploaded to Canvas after instructor/accessibility review.' },
  { id: 'companion', question: 'What does the animated companion do?', answer: 'It is an optional original interface control that opens the offline helper or five-question practice. It sends no data, has no AI service, follows reduced-motion preferences, and can be hidden or restored from Questions and help.' }
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
