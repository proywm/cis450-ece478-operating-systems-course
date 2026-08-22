import * as vscode from 'vscode';
import { LEARNING_IMPROVEMENT_NOTICE_VERSION, LEARNING_IMPROVEMENT_PROGRAM, appendImprovementEvent, approvedUmichEndpoint, buildImprovementEvent, buildImprovementPayload, consentAllows, emptyImprovementConsent, fall2026CourseWeek, normalizeImprovementConsent, normalizeImprovementEvents, type ImprovementCategory, type ImprovementConsent, type ImprovementEventInput } from './learningImprovementCore.js';

const CONSENT_KEY = 'learningImprovement.consent.v1';
const EVENTS_KEY = 'learningImprovement.events.v1';

export class LearningImprovementManager {
  constructor(private readonly context: vscode.ExtensionContext) {}
  get active(): boolean { return LEARNING_IMPROVEMENT_PROGRAM.enabled && vscode.env.isTelemetryEnabled; }
  get consent(): ImprovementConsent { return normalizeImprovementConsent(this.context.globalState.get(CONSENT_KEY)); }
  private events() { return normalizeImprovementEvents(this.context.globalState.get(EVENTS_KEY)); }
  async record(input: ImprovementEventInput): Promise<boolean> {
    if (!this.active || !consentAllows(this.consent, input.category)) return false;
    try {
      const event = buildImprovementEvent(input, { courseWeek: fall2026CourseWeek(new Date()), extensionVersion: String(this.context.extension.packageJSON.version ?? 'unknown'), platform: process.platform, architecture: process.arch });
      if (!event) return false; await this.context.globalState.update(EVENTS_KEY, appendImprovementEvent(this.events(), event)); return true;
    } catch { return false; }
  }
  async openPrivacyCenter(): Promise<void> {
    if (!LEARNING_IMPROVEMENT_PROGRAM.enabled) {
      const choice = await vscode.window.showInformationMessage('Learning-improvement data collection is dormant in this release.', { modal: true, detail: 'The institutional gate is OFF and no approved endpoint is configured. No learning-improvement event can be collected or transmitted. A later IRB-reviewed release would still require a separate student opt-in.' }, 'Delete Any Local Draft Data');
      if (choice === 'Delete Any Local Draft Data') await this.deleteAll(false); return;
    }
    const choice = await vscode.window.showQuickPick([
      { label: 'Review or change consent', value: 'consent' }, { label: 'Preview queued data', value: 'preview' },
      { label: 'Export a private copy', value: 'export' }, { label: 'Send a reviewed batch', value: 'send' },
      { label: 'Withdraw and delete', value: 'withdraw' }
    ], { title: 'OS course learning-improvement privacy controls', placeHolder: 'Nothing is sent automatically' });
    if (!choice) return; if (choice.value === 'consent') await this.configureConsent(); if (choice.value === 'preview') await this.preview();
    if (choice.value === 'export') await this.exportData(); if (choice.value === 'send') await this.send(); if (choice.value === 'withdraw') await this.deleteAll(true);
  }
  async askHelpfulness(activityId: string): Promise<void> {
    if (!this.active || !this.consent.survey) return;
    const rating = await vscode.window.showQuickPick([{ label: 'Yes', value: 2 }, { label: 'Partly', value: 1 }, { label: 'No', value: 0 }], { title: 'Did this tutorial help you take the next step?' }); if (!rating) return;
    const reason = await vscode.window.showQuickPick([{ label: 'Clear and useful', value: 'clear' }, { label: 'Instructions were unclear', value: 'unclear' }, { label: 'Too much text', value: 'too-much-text' }, { label: 'Too advanced', value: 'too-advanced' }, { label: 'Too easy', value: 'too-easy' }, { label: 'A course tool failed', value: 'tool-failed' }, { label: 'I needed more prior knowledge', value: 'prior-knowledge-gap' }, { label: 'Another reason', value: 'other' }], { title: 'What most influenced your rating?', placeHolder: 'No free text is collected' });
    if (reason) await this.record({ category: 'survey', name: 'helpfulness-rating', activityId, value: rating.value, reason: reason.value });
  }
  private async configureConsent(): Promise<void> {
    const action = await vscode.window.showInformationMessage('Optional learning-improvement participation', { modal: true, detail: 'Participation does not affect access, help, grades, or evaluation. The extension payload contains no identity, IP address, Canvas data, grades, files, code, paths, logs, prompts, credentials, or exact timestamps.' }, 'Choose Categories', 'Decline and Delete');
    if (action === 'Decline and Delete') return this.deleteAll(true); if (action !== 'Choose Categories') return;
    const picked = await vscode.window.showQuickPick([{ label: 'Technical setup outcomes', value: 'technical' as ImprovementCategory }, { label: 'Ungraded learning activity', value: 'learning' as ImprovementCategory }, { label: 'Optional fixed-choice helpfulness surveys', value: 'survey' as ImprovementCategory }], { canPickMany: true, title: 'Choose optional categories' }); if (!picked) return;
    const selected = new Set(picked.map(x => x.value)); const consent = { noticeVersion: LEARNING_IMPROVEMENT_NOTICE_VERSION, technical: selected.has('technical'), learning: selected.has('learning'), survey: selected.has('survey') };
    if (await vscode.window.showWarningMessage('Save these optional consent choices on this device?', { modal: true, detail: 'Nothing is transmitted automatically; every batch requires preview and confirmation.' }, 'Save Consent Choices') === 'Save Consent Choices') await this.context.globalState.update(CONSENT_KEY, consent);
  }
  private payload() { return buildImprovementPayload(this.events(), fall2026CourseWeek(new Date()), LEARNING_IMPROVEMENT_PROGRAM.protocolId); }
  private async preview(): Promise<boolean> { const payload = this.payload(); const doc = await vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(payload ?? { status: 'No shareable data', reason: 'No queued events or approved protocol.' }, null, 2) }); await vscode.window.showTextDocument(doc, { preview: true }); return Boolean(payload); }
  private async exportData(): Promise<void> { const payload = this.payload(); if (!payload) { await vscode.window.showInformationMessage('There is no approved queued batch to export.'); return; } await this.preview(); const uri = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('os-learning-improvement-preview.json'), filters: { JSON: ['json'] } }); if (uri) await vscode.workspace.fs.writeFile(uri, Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)); }
  private async send(): Promise<void> { const endpoint = approvedUmichEndpoint(LEARNING_IMPROVEMENT_PROGRAM.endpoint), payload = this.payload(); if (!endpoint || !payload) { await vscode.window.showInformationMessage('No approved U-M endpoint/protocol and reviewed batch are available. Nothing was sent.'); return; } await this.preview(); if (await vscode.window.showWarningMessage(`Send ${payload.events.length} reviewed events to ${endpoint.hostname}?`, { modal: true }, 'Send Reviewed Batch') !== 'Send Reviewed Batch') return; const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(15_000) }); if (!response.ok) throw new Error(`Collection endpoint returned HTTP ${response.status}; the queue was kept.`); await this.context.globalState.update(EVENTS_KEY, []); }
  private async deleteAll(confirm: boolean): Promise<void> { if (confirm && await vscode.window.showWarningMessage('Withdraw and delete the local learning-improvement queue?', { modal: true }, 'Withdraw and Delete') !== 'Withdraw and Delete') return; await Promise.all([this.context.globalState.update(CONSENT_KEY, emptyImprovementConsent()), this.context.globalState.update(EVENTS_KEY, [])]); await vscode.window.showInformationMessage('Optional participation is off and the local queue is empty.'); }
}
