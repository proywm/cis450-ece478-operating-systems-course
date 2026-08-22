export const LEARNING_IMPROVEMENT_SCHEMA_VERSION = 1;
export const LEARNING_IMPROVEMENT_NOTICE_VERSION = 1;
export const MAX_LEARNING_IMPROVEMENT_EVENTS = 300;

// Intentionally dormant. A later reviewed release must supply all three values
// after an institutional/IRB determination; no runtime setting can bypass this.
export const LEARNING_IMPROVEMENT_PROGRAM = Object.freeze({ enabled: false, protocolId: '', endpoint: '' });

export type ImprovementCategory = 'technical' | 'learning' | 'survey';
export type ConfidenceBucket = 'low' | 'medium' | 'high';
export interface ImprovementConsent { noticeVersion: number; technical: boolean; learning: boolean; survey: boolean }
export interface ImprovementEventInput {
  category: ImprovementCategory; name: string; moduleId?: string; activityId?: string; outcome?: string;
  selectedOption?: number; correct?: boolean; confidence?: ConfidenceBucket; usedHint?: boolean;
  durationMs?: number; attemptNumber?: number; value?: number; reason?: string;
}
export interface ImprovementEvent {
  schemaVersion: number; category: ImprovementCategory; name: string; courseWeek: string; extensionVersion: string;
  moduleId?: string; activityId?: string; outcome?: string; selectedOption?: number; correct?: boolean;
  confidence?: ConfidenceBucket; usedHint?: boolean; durationBucket?: string; attemptBucket?: string;
  value?: number; reason?: string; platformFamily?: string; architecture?: string;
}

const EVENT_NAMES = new Set(['setup-result', 'tutorial-result', 'practice-attempt', 'guided-lab-step', 'simulation-result', 'helpfulness-rating']);
const OUTCOMES = new Set(['started', 'completed', 'skipped', 'cancelled', 'success', 'failure', 'checked', 'unchecked']);
const REASONS = new Set(['clear', 'unclear', 'too-much-text', 'too-advanced', 'too-easy', 'tool-failed', 'prior-knowledge-gap', 'other']);

export function emptyImprovementConsent(): ImprovementConsent {
  return { noticeVersion: LEARNING_IMPROVEMENT_NOTICE_VERSION, technical: false, learning: false, survey: false };
}
export function normalizeImprovementConsent(value: unknown): ImprovementConsent {
  if (!isRecord(value) || value.noticeVersion !== LEARNING_IMPROVEMENT_NOTICE_VERSION) return emptyImprovementConsent();
  return { noticeVersion: LEARNING_IMPROVEMENT_NOTICE_VERSION, technical: value.technical === true, learning: value.learning === true, survey: value.survey === true };
}
export function consentAllows(consent: ImprovementConsent, category: ImprovementCategory): boolean { return consent[category]; }
export function buildImprovementEvent(input: ImprovementEventInput, context: { courseWeek: string; extensionVersion: string; platform?: NodeJS.Platform; architecture?: string }): ImprovementEvent | undefined {
  if (!EVENT_NAMES.has(input.name)) return undefined;
  const event: ImprovementEvent = { schemaVersion: LEARNING_IMPROVEMENT_SCHEMA_VERSION, category: input.category, name: input.name, courseWeek: boundedId(context.courseWeek, 24) ?? 'outside-term', extensionVersion: boundedId(context.extensionVersion, 32) ?? 'unknown' };
  set(event, 'moduleId', boundedId(input.moduleId, 80)); set(event, 'activityId', boundedId(input.activityId, 80));
  set(event, 'outcome', input.outcome && OUTCOMES.has(input.outcome) ? input.outcome : undefined);
  if (Number.isInteger(input.selectedOption) && input.selectedOption! >= 0 && input.selectedOption! <= 9) event.selectedOption = input.selectedOption;
  if (typeof input.correct === 'boolean') event.correct = input.correct;
  if (input.confidence === 'low' || input.confidence === 'medium' || input.confidence === 'high') event.confidence = input.confidence;
  if (typeof input.usedHint === 'boolean') event.usedHint = input.usedHint;
  if (Number.isFinite(input.durationMs)) event.durationBucket = durationBucket(input.durationMs!);
  if (Number.isFinite(input.attemptNumber)) event.attemptBucket = input.attemptNumber! <= 1 ? 'first' : input.attemptNumber === 2 ? 'second' : 'third-plus';
  if (Number.isInteger(input.value) && input.value! >= 0 && input.value! <= 5) event.value = input.value;
  set(event, 'reason', input.reason && REASONS.has(input.reason) ? input.reason : undefined);
  if (input.category === 'technical') {
    event.platformFamily = context.platform === 'win32' ? 'windows' : context.platform === 'darwin' ? 'macos' : context.platform === 'linux' ? 'linux' : 'other';
    event.architecture = context.architecture === 'x64' || context.architecture === 'arm64' ? context.architecture : 'other';
  }
  return event;
}
export function appendImprovementEvent(queue: unknown, event: ImprovementEvent): ImprovementEvent[] {
  return [...normalizeImprovementEvents(queue), event].slice(-MAX_LEARNING_IMPROVEMENT_EVENTS);
}
export function normalizeImprovementEvents(value: unknown): ImprovementEvent[] {
  return Array.isArray(value) ? value.flatMap((candidate): ImprovementEvent[] => { const normalized = normalizeStoredEvent(candidate); return normalized ? [normalized] : []; }).slice(-MAX_LEARNING_IMPROVEMENT_EVENTS) : [];
}
export function fall2026CourseWeek(now: Date): string {
  const difference = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(2026, 7, 26)) / 86_400_000);
  if (difference < 0) return 'before-term'; if (difference > 140) return 'after-term'; return `week-${Math.floor(difference / 7) + 1}`;
}
export function approvedUmichEndpoint(value: string): URL | undefined {
  try { const url = new URL(value); const host = url.hostname.toLowerCase(); return url.protocol === 'https:' && (host === 'umich.edu' || host.endsWith('.umich.edu')) && !url.username && !url.password && !url.hash ? url : undefined; } catch { return undefined; }
}
export function buildImprovementPayload(events: ImprovementEvent[], courseWeek: string, protocolId: string) {
  const protocol = boundedId(protocolId, 80); if (!protocol || !events.length) return undefined;
  return { schemaVersion: LEARNING_IMPROVEMENT_SCHEMA_VERSION, protocolId: protocol, noticeVersion: LEARNING_IMPROVEMENT_NOTICE_VERSION, courseId: 'cis450-ece478-fall2026' as const, generatedCourseWeek: boundedId(courseWeek, 24) ?? 'outside-term', events: normalizeImprovementEvents(events) };
}
function durationBucket(ms: number): string { return ms < 30_000 ? 'under-30s' : ms < 90_000 ? '30-90s' : ms < 300_000 ? '90s-5m' : 'over-5m'; }
function normalizeStoredEvent(value: unknown): ImprovementEvent | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || (value.category !== 'technical' && value.category !== 'learning' && value.category !== 'survey') || typeof value.name !== 'string' || !EVENT_NAMES.has(value.name)) return undefined;
  const courseWeek = boundedId(value.courseWeek, 24), extensionVersion = boundedId(value.extensionVersion, 32); if (!courseWeek || !extensionVersion) return undefined;
  const event: ImprovementEvent = { schemaVersion: 1, category: value.category, name: value.name, courseWeek, extensionVersion };
  set(event, 'moduleId', boundedId(value.moduleId, 80)); set(event, 'activityId', boundedId(value.activityId, 80)); set(event, 'outcome', typeof value.outcome === 'string' && OUTCOMES.has(value.outcome) ? value.outcome : undefined);
  if (Number.isInteger(value.selectedOption) && Number(value.selectedOption) >= 0 && Number(value.selectedOption) <= 9) event.selectedOption = Number(value.selectedOption);
  if (typeof value.correct === 'boolean') event.correct = value.correct;
  if (value.confidence === 'low' || value.confidence === 'medium' || value.confidence === 'high') event.confidence = value.confidence;
  if (typeof value.usedHint === 'boolean') event.usedHint = value.usedHint;
  if (value.durationBucket === 'under-30s' || value.durationBucket === '30-90s' || value.durationBucket === '90s-5m' || value.durationBucket === 'over-5m') event.durationBucket = value.durationBucket;
  if (value.attemptBucket === 'first' || value.attemptBucket === 'second' || value.attemptBucket === 'third-plus') event.attemptBucket = value.attemptBucket;
  if (Number.isInteger(value.value) && Number(value.value) >= 0 && Number(value.value) <= 5) event.value = Number(value.value);
  set(event, 'reason', typeof value.reason === 'string' && REASONS.has(value.reason) ? value.reason : undefined);
  if (value.category === 'technical') { if (value.platformFamily === 'windows' || value.platformFamily === 'macos' || value.platformFamily === 'linux' || value.platformFamily === 'other') event.platformFamily = value.platformFamily; if (value.architecture === 'x64' || value.architecture === 'arm64' || value.architecture === 'other') event.architecture = value.architecture; }
  return event;
}
function boundedId(value: unknown, maximum: number): string | undefined { if (typeof value !== 'string') return undefined; const text = value.trim(); return text.length > 0 && text.length <= maximum && /^[A-Za-z0-9_.:-]+$/.test(text) ? text : undefined; }
function set<K extends keyof ImprovementEvent>(target: ImprovementEvent, key: K, value: ImprovementEvent[K] | undefined): void { if (value !== undefined) target[key] = value; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
