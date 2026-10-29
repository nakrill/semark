// The corpus walker: what it reads, what it skips, and when it gives up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpusFiles, loadCorpus, runCheck, TooBig } from '../packages/semark/src/corpus.js';
import { checkCorpus } from '../packages/semark/src/check.js';

const page = (sema, body = '') => `---\nsema: ${sema}\n---\n\n${body}`;
const make = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'semark-'));
  for (const [f, text] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), text); }
  return dir;
};

test('the walk reads every .md page, skips hidden, tool and build folders and symbolic links, and leaves a nested corpus alone', async () => {
  const dir = make({
    'patterns.md': page('patterns'), 'd/index.md': page('design', '[[d: design]]\n'), 'd/s.md': page('screen', '[[s: screen]]\n'),
    'node_modules/x/readme.md': '[[x: screen]]', '.hidden/y.md': '[[y: screen]]', 'dist/z.md': '[[z: screen]]',
    'other/patterns.md': page('patterns'), 'other/e/index.md': page('design', '[[e: design]]\n'),
  });
  fs.symlinkSync(path.join(dir, 'd'), path.join(dir, 'link'));
  const { files, skipped } = await loadCorpusFiles(dir);
  assert.deepEqual(files.map((f) => f.file), ['d/index.md', 'd/s.md', 'patterns.md']);
  assert.deepEqual(skipped, ['other']);
});

test('folders and files count against the limit together, and the walk gives up with TooBig', async () => {
  const files = {};
  for (let i = 0; i < 30; i++) files[`f${i}/p.md`] = page('data');
  const dir = make(files);
  await assert.rejects(loadCorpusFiles(dir, { limit: 20 }), TooBig);
  const { files: all } = await loadCorpusFiles(dir, { limit: 100 });
  assert.equal(all.length, 30);
});

test('with a cache, an unchanged page is not parsed again and a changed one is parsed alone', async () => {
  const dir = make({ 'patterns.md': page('patterns'), 'd/index.md': page('design', '[[d: design]]\n'), 'd/s.md': page('screen', '[[s: screen]]\n') });
  const cache = new Map();
  await loadCorpusFiles(dir, { cache });
  const sizeBefore = cache.size;
  const again = await loadCorpusFiles(dir, { cache });
  assert.equal(cache.size, sizeBefore);
  assert.equal(again.files.length, 3);
  const before = cache.get(path.join(dir, 'd', 's.md')).page;
  fs.writeFileSync(path.join(dir, 'd', 's.md'), page('screen', '[[s: screen]]\n\n- [[f: text]]\n'));
  const now = Date.now() / 1000; fs.utimesSync(path.join(dir, 'd', 's.md'), now + 5, now + 5);
  const after = await loadCorpusFiles(dir, { cache });
  assert.notEqual(cache.get(path.join(dir, 'd', 's.md')).page, before);
  assert.equal(after.files.find((f) => f.file === 'd/s.md').page.items.length, 2);
  fs.unlinkSync(path.join(dir, 'd', 's.md'));
  await loadCorpusFiles(dir, { cache });
  assert.equal(cache.has(path.join(dir, 'd', 's.md')), false, 'a page that is gone leaves the cache');
});

test('runCheck prints a report and returns 1 on errors, 0 when clean, and says so when there is no design', async () => {
  const out = { text: '', write(s) { this.text += s; } };
  const clean = make({ 'patterns.md': page('patterns', '- [[input.text: pattern fits:text]]\n'), 'd/index.md': page('design', '[[d: design]]\n'), 'd/s.md': page('screen', '[[s: screen]]\n\n- [[f: text "F" > input.text]]\n') });
  assert.equal(await runCheck(clean, { out }), 0);
  assert.match(out.text, /1 designs · 2 pages/);
  out.text = '';
  const broken = make({ 'patterns.md': page('patterns'), 'd/index.md': page('design', '[[d: design]]\n'), 'd/s.md': page('screen', '[[s: screen]]\n\n- [[nothing]]\n') });
  assert.equal(await runCheck(broken, { out }), 1);
  assert.match(out.text, /unresolved/);
  out.text = '';
  const none = make({ 'patterns.md': page('patterns') });
  assert.equal(await runCheck(none, { out }), 0);
  assert.match(out.text, /No design under/);
  const json = { text: '', write(s) { this.text += s; } };
  await runCheck(broken, { out: json, json: true });
  const parsed = JSON.parse(json.text);
  assert.equal(parsed.designs.length, 1);
  assert.equal(checkCorpus((await loadCorpus(broken)).corpus)[0].diagnostics.length, parsed.designs[0].diagnostics.length);
});

test('semark init starts a corpus that checks clean, and refuses a folder that is not empty', async () => {
  const { execFileSync } = await import('node:child_process');
  const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'semark', 'bin', 'semark.js');
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'semark-init-')), 'corpus');
  assert.match(execFileSync(process.execPath, [bin, 'init', dir], { encoding: 'utf8' }), /Started a corpus/);
  assert.match(execFileSync(process.execPath, [bin, 'check', dir], { encoding: 'utf8' }), /1 designs · 4 pages · 14 tokens · 0 errors · 0 warnings/);
  assert.throws(() => execFileSync(process.execPath, [bin, 'init', dir], { encoding: 'utf8', stdio: 'pipe' }));
  assert.match(execFileSync(process.execPath, [bin, '--version'], { encoding: 'utf8' }), /semark 0\.8\.1/);
});
