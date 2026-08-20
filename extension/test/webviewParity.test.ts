import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('learning hub exposes the pedagogically relevant parity surfaces', async () => {
  const html = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  for (const marker of [
    'Thirteen learning modules', '104 explained questions', 'Five-question practice',
    'Guided OS labs', 'Coursework planning and evidence', 'My learning progress',
    'Optional historical-weight grade planning estimate', 'Frequently asked questions',
    'Ask before class through Canvas', 'Self-paced orientation',
    'Self-reported coursework planning progression'
  ]) assert.ok(html.includes(marker), marker);
});

test('optional companion is original, keyboard-addressable, private, and motion-aware', async () => {
  const html = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(html, /aria-label="Optional OS learning companion"/);
  assert.match(html, /aria-expanded="false" aria-controls="companion-panel"/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /sends no data|do not send data/i);
  assert.match(html, /uses no external artwork/i);
  assert.match(html, /event\.key==='Escape'.*companionOpen/);
  assert.doesNotMatch(html, /vscode-pets|pet sprite/i);
  assert.doesNotMatch(html, /<img\b/i);
});
