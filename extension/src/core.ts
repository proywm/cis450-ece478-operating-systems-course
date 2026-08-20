import { COURSE, MODULES } from './courseData.js';

export interface GradeInputs {
  participation: number;
  homework: number;
  programming: number;
  midterm: number;
  finalExam: number;
}

export interface GradeEstimate {
  percent: number;
  letter: string;
  contributions: Readonly<Record<keyof GradeInputs, number>>;
}

const GRADE_WEIGHTS: Readonly<Record<keyof GradeInputs, number>> = {
  participation: 0.10,
  homework: 0.15,
  programming: 0.40,
  midterm: 0.15,
  finalExam: 0.20
};

export function estimateGrade(input: GradeInputs): GradeEstimate {
  for (const [name, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`${name} must be a percentage from 0 through 100.`);
    }
  }
  const contributions = Object.fromEntries(
    (Object.keys(GRADE_WEIGHTS) as (keyof GradeInputs)[]).map((key) => [key, input[key] * GRADE_WEIGHTS[key]])
  ) as Record<keyof GradeInputs, number>;
  const percent = Object.values(contributions).reduce((sum, value) => sum + value, 0);
  return { percent, letter: letterFor(percent), contributions };
}

export function letterFor(percent: number): string {
  if (percent >= 96.67) return 'A+';
  if (percent >= 93.34) return 'A';
  if (percent >= 90.00) return 'A−';
  if (percent >= 86.67) return 'B+';
  if (percent >= 83.34) return 'B';
  if (percent >= 80.00) return 'B−';
  if (percent >= 76.67) return 'C+';
  if (percent >= 73.34) return 'C';
  if (percent >= 70.00) return 'C−';
  if (percent >= 66.67) return 'D+';
  if (percent >= 63.34) return 'D';
  if (percent >= 60.00) return 'D−';
  return 'E';
}

export type ModuleStatus = 'not-started' | 'preparing' | 'practicing' | 'confident';

export function progressPercent(statuses: Readonly<Record<string, ModuleStatus>>): number {
  const points: Record<ModuleStatus, number> = { 'not-started': 0, preparing: 1, practicing: 2, confident: 3 };
  const total = MODULES.reduce((sum, module) => sum + points[statuses[module.id] ?? 'not-started'], 0);
  return Math.round((total / (MODULES.length * 3)) * 100);
}

export interface TutorReply {
  mode: 'course-help' | 'integrity-guardrail' | 'navigation';
  title: string;
  response: string;
  prompts: readonly string[];
  moduleNumber?: number;
}

const answerRequest = /\b(give|write|provide|tell)\b.{0,24}\b(answer|solution|code)\b|\bsolve\b.{0,20}\b(homework|assignment|project|lab)\b|\bdo (?:my|the) (?:homework|assignment|project|lab)\b/i;
const assessedWork = /\b(homework|assignment|project|lab|pa[123]|hw[123]|scheduler|traffic control)\b/i;

export function tutorReply(question: string): TutorReply {
  const normalized = question.trim();
  if (!normalized) {
    return {
      mode: 'navigation', title: 'Ask a focused question',
      response: 'Name the concept, what you expected, what you observed, and the smallest step where you became uncertain.',
      prompts: ['What concept am I practicing?', 'What have I tried?', 'What output or state differs from my prediction?']
    };
  }
  const module = bestModule(normalized);
  if (answerRequest.test(normalized) && assessedWork.test(normalized)) {
    return {
      mode: 'integrity-guardrail', title: 'I can coach the reasoning, not produce a submission',
      response: 'I will not provide a finished answer, implementation, or report for assessed coursework. I can help you identify the relevant invariant, trace one smaller analogous example, interpret an error, or review reasoning you wrote yourself. Canvas and the instructor define the allowed collaboration and AI-use rules.',
      prompts: ['Restate the requirement in your own words.', 'Identify the state or invariant that must hold.', 'Build the smallest non-submission example that tests one idea.', 'Show your attempt and ask about one specific mismatch.'],
      moduleNumber: module?.number
    };
  }
  if (module) {
    return {
      mode: 'course-help', title: `Use Module ${module.number}: ${module.title}`,
      response: module.lesson[0] ?? 'Review the mapped lesson and reading.',
      prompts: [`Which objective is closest to your question: ${module.objectives.join(' / ')}?`, `Try the hands-on step: ${module.handsOn}`, 'Explain your prediction before running the code or simulator.'],
      moduleNumber: module.number
    };
  }
  return {
    mode: 'navigation', title: 'Connect the question to the course map',
    response: 'The course is organized into CPU/memory virtualization, concurrency, and persistence. Choose the closest unit, then use its reading, explanation, practice, and hands-on task in that order.',
    prompts: ['Is the problem about processes or memory?', 'Is shared execution or synchronization involved?', 'Is the question about files, I/O, or crash recovery?']
  };
}

function bestModule(question: string) {
  const tokens = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const stop = new Set(['what', 'where', 'when', 'with', 'this', 'that', 'from', 'have', 'does', 'about', 'please']);
  const meaningful = tokens.filter((token) => token.length >= 4 && !stop.has(token));
  let best: (typeof MODULES)[number] | undefined;
  let bestScore = 0;
  for (const module of MODULES) {
    const haystack = `${module.title} ${module.objectives.join(' ')} ${module.lesson.join(' ')} ${module.handsOn}`.toLowerCase();
    const score = meaningful.filter((token) => haystack.includes(token)).length;
    if (score > bestScore) {
      best = module;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : undefined;
}

export interface Meeting { number: number; date: string; day: 'Monday' | 'Wednesday' }

export function fall2026Meetings(): Meeting[] {
  const start = new Date('2026-08-26T12:00:00Z');
  const end = new Date('2026-12-07T12:00:00Z');
  const excluded = new Set(['2026-09-07', '2026-11-23', '2026-11-25']);
  const meetings: Meeting[] = [];
  for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const iso = day.toISOString().slice(0, 10);
    if ((day.getUTCDay() === 1 || day.getUTCDay() === 3) && !excluded.has(iso)) {
      meetings.push({ number: meetings.length + 1, date: iso, day: day.getUTCDay() === 1 ? 'Monday' : 'Wednesday' });
    }
  }
  return meetings;
}

export function buildCalendar(): string {
  const meetingEvents = fall2026Meetings().map((meeting) => event(
    `meeting-${meeting.number}`,
    `CIS 450 / ECE 478 class ${meeting.number} of 27`,
    `Regular class meeting in ${COURSE.room}. Check Canvas for the current topic and all assignment or schedule changes.`,
    `DTSTART;TZID=America/Detroit:${compact(meeting.date)}T140000\r\nDTEND;TZID=America/Detroit:${compact(meeting.date)}T154500`,
    COURSE.room
  ));
  const allDay = [
    event('classes-begin', 'Fall 2026 classes begin', 'First CIS 450 / ECE 478 meeting.', 'DTSTART;VALUE=DATE:20260826\r\nDTEND;VALUE=DATE:20260827'),
    event('labor-day', 'Labor Day — no class', 'University holiday.', 'DTSTART;VALUE=DATE:20260907\r\nDTEND;VALUE=DATE:20260908'),
    event('thanksgiving', 'Thanksgiving recess — no class', 'No Monday/Wednesday course meetings; classes resume November 30.', 'DTSTART;VALUE=DATE:20261121\r\nDTEND;VALUE=DATE:20261130'),
    event('classes-end', 'Fall 2026 classes end', 'Final regular Monday course meeting.', 'DTSTART;VALUE=DATE:20261207\r\nDTEND;VALUE=DATE:20261208'),
    event('study-days', 'Study days', 'No regular class. Verify exam information in Canvas.', 'DTSTART;VALUE=DATE:20261208\r\nDTEND;VALUE=DATE:20261210'),
    event('exam-window', 'CIS 450 / ECE 478 final-exam window', 'Exact exam date, time, room, and format are not yet verified; Canvas is authoritative.', 'DTSTART;VALUE=DATE:20261210\r\nDTEND;VALUE=DATE:20261217')
  ];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SystemStudio OS//Fall 2026//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:CIS 450 ECE 478 Fall 2026', ...meetingEvents, ...allDay, 'END:VCALENDAR', ''].join('\r\n');
}

function event(id: string, summary: string, description: string, timing: string, location?: string): string {
  return ['BEGIN:VEVENT', `UID:cis450-ece478-f26-${id}@systemstudio`, 'DTSTAMP:20260820T000000Z', timing, `SUMMARY:${ics(summary)}`, ...(location ? [`LOCATION:${ics(location)}`] : []), `DESCRIPTION:${ics(description)}`, `URL:${COURSE.canvasUrl}`, 'END:VEVENT'].join('\r\n');
}

function compact(value: string): string { return value.replaceAll('-', ''); }
function ics(value: string): string { return value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;'); }
