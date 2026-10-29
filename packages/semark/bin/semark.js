#!/usr/bin/env node
// semark check <root> [--json]    every design: problems with file:line, readiness per screen; exit 1 on errors
// semark dump <root>              the resolved model as JSON: designs, definitions, diagnostics, readiness, drawings
import path from 'node:path';
import { runCheck, loadCorpus } from '../src/corpus.js';
import { checkCorpus } from '../src/check.js';
import { viewOf } from '../src/view.js';

const [cmd, root, ...rest] = process.argv.slice(2);
const usage = () => { process.stderr.write('usage: semark check <corpus-root> [--json]\n       semark dump <corpus-root>\n'); process.exit(2); };
if (!root) usage();
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
