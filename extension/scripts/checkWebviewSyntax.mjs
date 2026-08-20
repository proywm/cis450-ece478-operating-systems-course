import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (request === 'vscode') return { TreeItem: class TreeItem {} };
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const extension = require('../dist/extension.js');
  const html = extension.buildHubHtmlForTesting();
  if (!html.includes('CIS 450 / ECE 478') || !html.includes('CASL 1048')) {
    throw new Error('The generated learning hub is missing verified course identity or room.');
  }
  for (const marker of ['104 explained questions', 'Rerun orientation', 'Practice & review', 'Review before keeping', 'cannot promise anonymity', 'aria-modal="true"', 'MutationObserver']) {
    if (!html.includes(marker)) throw new Error(`The generated learning hub is missing the release marker: ${marker}`);
  }
  if (/\sonclick\s*=/i.test(html)) throw new Error('Inline click handlers are incompatible with the webview CSP and accessibility event model.');
  if (/Tariq|ssmtariq/i.test(html)) throw new Error('The generated learning hub retains an unverified GSI identity.');
  const match = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/);
  if (!match?.[1]) throw new Error('Could not locate the learning-hub script.');
  new vm.Script(match[1], { filename: 'systemstudio-os-webview.js' });
  process.stdout.write('Learning-hub HTML generated and embedded JavaScript parsed successfully.\n');
} finally {
  Module._load = originalLoad;
}
