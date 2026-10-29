#!/usr/bin/env node
// semark check <root> [--json]    every design: problems with file:line, readiness per screen; exit 1 on errors
// semark dump <root>              the resolved model as JSON: designs, definitions, diagnostics, readiness, drawings
// semark init <folder>            a corpus to start from: patterns, words, roles and one small design
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runCheck, loadCorpus } from '../src/corpus.js';
import { checkCorpus } from '../src/check.js';
import { viewOf } from '../src/view.js';

const [cmd, root, ...rest] = process.argv.slice(2);
const usage = () => { process.stderr.write('usage: semark check <corpus-root> [--json]\n       semark dump <corpus-root>\n       semark init <folder>\n       semark --version\n'); process.exit(2); };
if (cmd === '--version' || cmd === '-v') { const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8')); process.stdout.write(`semark ${pkg.version} (Sema v0.8)\n`); process.exit(0); }
if (!root) usage();
if (cmd === 'init') {
  const target = path.resolve(root);
  const from = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'init');
  const existing = await fs.readdir(target).catch(() => null);
  if (existing && existing.length) { process.stderr.write(`${target} is not empty; init writes only into an empty or new folder\n`); process.exit(1); }
  await fs.cp(from, target, { recursive: true });
  process.stdout.write(`Started a corpus in ${target}: patterns.md, words.md, roles.md and the design "hello".\nNext: semark check ${root}\n`);
  process.exit(0);
}
if (cmd === 'check') process.exit(await runCheck(root, { json: rest.includes('--json') }));
if (cmd === 'dump') {
  const abs = path.resolve(root);
  const { corpus, skipped } = await loadCorpus(abs);
  const results = checkCorpus(corpus);
  const designs = results.map((r) => ({
    name: r.name, folder: r.folder, pages: corpus.designOrder(r.name).map((p) => (typeof p === 'string' ? p : p.file)),
    definitions: corpus.defs.filter((d) => d.design === r.name && d.kind === 'own').map((d) => ({ path: d.path, type: d.item.token.type, file: d.file, line: d.line, token: d.item.token.raw })),
    diagnostics: r.diagnostics, readiness: r.readiness,
    views: corpus.designPages(r.name).map((p) => ({ file: p.file, view: viewOf(corpus, p.file) })),
  }));
  process.stdout.write(JSON.stringify({ root: abs, skipped, corpus: results.corpus, designs }, null, 2) + '\n');
  process.exit(0);
}
usage();
