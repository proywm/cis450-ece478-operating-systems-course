import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('learning hub exposes the pedagogically relevant parity surfaces', async () => {
  const html = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  for (const marker of [
    'Thirteen learning modules', '104 explained questions', 'Five-question practice',
    'Guided OS labs', 'Coursework planning and evidence', 'My learning progress',
    'Grade predictor', 'Target calculation', 'Standing before the final',
    'The OS policy has no verified two-lowest-score drop rule', 'Frequently asked questions',
    'Ask before class through Canvas', 'Self-paced orientation',
    'Self-reported coursework planning progression', 'Open dated OSTEP course plan',
    '29 exact official OSTEP chapter links', '15 chapter-mapped simulators',
    'Chapter-mapped simulations', 'Start here when blocked'
  ]) assert.ok(html.includes(marker), marker);
});

test('optional anime companion is packaged, keyboard-addressable, private, and motion-aware', async () => {
  const html = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(html, /aria-label="Optional animated OS learning companion"/);
  assert.match(html, /aria-expanded="false" aria-controls="companion-panel"/);
  assert.match(html, /orbit-os-anime\.svg/);
  assert.match(html, /Ask AI coach/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /does not attach files|sends no question off/i);
  assert.match(html, /event\.key==='Escape'.*companionOpen/);
  assert.doesNotMatch(html, /vscode-pets|pet sprite/i);
  const artwork = await readFile(resolve(process.cwd(), 'media/orbit-os-anime.svg'), 'utf8');
  assert.match(artwork, /anime-inspired owl robot/i);
  assert.match(artwork, /aria-labelledby="title description"/);
});

test('beginner navigation leads with one setup workflow and hides detailed tools under advanced', async () => {
  const source = await readFile(resolve(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(source, /Start Here/);
  assert.match(source, /Set up or repair my course environment/);
  assert.match(source, /Hands-on Learning/);
  assert.match(source, /Advanced Setup and Diagnostics/);
  assert.match(source, /NOT REQUIRED ON WINDOWS: host GCC, Make, Python, and QEMU/);
  assert.match(source, /docker-desktop:\/\/dashboard/);
});
