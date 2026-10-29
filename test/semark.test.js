// Sema in Vouch, layers 1–4: the token, the page, the design and its resolver,
// diagnostics and readiness. The traps are the ones in the implementation brief
// (§10); each was a real bug once. The corpus is test/fixtures/corpus — neutral,
// not client material — and its numbers were worked out by hand first.
import { test } from 'node:test';
import os from 'node:os';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTokens, parseToken } from '../packages/semark/src/token.js';
import { parsePage } from '../packages/semark/src/page.js';
import { parseCondition, qualify } from '../packages/semark/src/condition.js';
import { Corpus, checkCorpus, checkDesign } from '../packages/semark/src/check.js';
import { viewOf, shapeFor, WIREFRAME_BINDING } from '../packages/semark/src/view.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'corpus');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []));
const corpus = () => new Corpus(walk(ROOT).map((f) => ({ file: path.relative(ROOT, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') })));
/** A corpus from inline pages. */
const small = (files) => new Corpus(Object.entries(files).map(([file, text]) => ({ file, text })));
/** A one-design corpus `d` from inline pages, with the fixture vocabulary beside it. */
const smallCorpus = (files) => small({
  'd/index.md': '---\nsema: design\n---\n# D\n\n[[d: design]]\n',
  'patterns.md': fs.readFileSync(path.join(ROOT, 'patterns.md'), 'utf8'),
  'words.md': fs.readFileSync(path.join(ROOT, 'words.md'), 'utf8'),
  ...files,
});
const tok = (s) => { const f = findTokens(s)[0]; return parseToken(f.inner, f.raw); };
const at = (c, name, context, design = 'onboarding') => { const r = c.resolve(name, context, design); return r.ok ? r.def.path : `${r.reason}:${r.candidates.map((d) => d.path).join(',')}`; };

// ------------------------------------------------------------ layer 1: the token

test('token: definition vs reference, type, marks of every kind', () => {
  const t = tok('- [[cuisine: enum |thai=Thai|other=?|Street food when:a.b=thai| required ? default:thai "Cuisine…" -> next > choice.single #src-1 #a3 hint:"Pick one" weird-key:x]] note');
  assert.equal(t.name, 'cuisine'); assert.equal(t.def, true); assert.equal(t.type, 'enum');
  const values = t.marks.find((m) => m.kind === 'values').values;
  assert.deepEqual(values.map((v) => [v.value, v.label, v.unknown, v.when]), [['thai', 'Thai', false, null], ['other', '?', true, null], ['Street food', null, false, 'a.b=thai']]);
  assert.ok(t.flags.has('required')); assert.ok(t.open);
  assert.equal(t.keys.default, 'thai'); assert.equal(t.keys.hint, 'Pick one');
  assert.equal(t.label, 'Cuisine…'); assert.equal(t.partialWords, true);
  assert.equal(t.goto, 'next'); assert.equal(t.pattern, 'choice.single');
  assert.deepEqual(t.marks.filter((m) => m.kind === 'source').map((m) => [m.ref, m.assumption]), [['src-1', false], ['a3', true]]);
  assert.equal(t.keys['weird-key'], 'x', 'a key the language does not know yet is kept, never dropped');
  const r = tok('[[first-name > input.text]]');
  assert.equal(r.def, false); assert.equal(r.type, null); assert.equal(r.pattern, 'input.text');
  assert.equal(tok('[[x: text "?"]]').unknownWords, true);
});

test('token: the raw text is kept byte for byte, and nothing writes a token back', () => {
  const line = '- [[ name:   text   required  "Odd  spacing" ]]  after';
  const f = findTokens(line)[0];
  assert.equal(f.raw, '[[ name:   text   required  "Odd  spacing" ]]');
  assert.equal(line.slice(f.start, f.end), f.raw);
  assert.equal(parseToken(f.inner, f.raw).raw, f.raw);
});

test('token: an unquoted value with a space cannot be read — initial:30 days is initial:30 plus a flag', () => {
  const t = tok('[[retention: number initial:30 days]]');
  assert.equal(t.keys.initial, '30'); assert.ok(t.flags.has('days'));
  assert.equal(tok('[[retention: number initial:"30 days"]]').keys.initial, '30 days');
});

// ------------------------------------------------------------ layer 2: the page

test('page: anchors, list nesting, context and paths; code and ::: blocks never enter the model', () => {
  const p = parsePage([
    '---', 'sema: data', '---', '', '# Data', '', '## Demographics', '', '[[demographics: group]] the person', '',
    '- [[first-name: text required]]', '- [[address: group]]', '  - [[line-1: text]]', '', '```', '[[in-code: text]]', '```',
    '::: note', '[[in-note: text]]', ':::', '', '## Plain', '', 'Prose with [[mention: text]] in it.', '- [[loose: text]]',
  ].join('\n'));
  assert.equal(p.sema, 'data');
  const row = (n) => p.items.find((i) => i.token.name === n);
  assert.equal(row('demographics').role, 'anchor');
  assert.equal(row('first-name').path, 'demographics.first-name');
  assert.equal(row('line-1').path, 'demographics.address.line-1');
  assert.equal(row('line-1').line, 13);
  assert.equal(row('in-code'), undefined); assert.equal(row('in-note'), undefined);
  assert.equal(row('mention').role, 'inline'); assert.equal(row('mention').path, 'mention');
  assert.equal(row('loose').path, 'loose', 'a heading with no anchor changes no path');
});

test('trap 9: a second standalone token mid-section opens no scope — and is flagged, not reinterpreted', () => {
  const c = corpus();
  const data = c.pages.get('onboarding/data.md').page;
  const sig = data.items.find((i) => i.token.name === 'signatory');
  assert.equal(sig.standalone, true); assert.equal(sig.path, 'owner.signatory');
  assert.equal(data.items.find((i) => i.token.name === 'signed-at').path, 'owner.signed-at', 'its fields stay under the anchor, as specified');
  const { diagnostics } = checkDesign(c, 'onboarding');
  assert.ok(diagnostics.some((d) => d.code === 'no-scope' && d.file === 'onboarding/data.md' && d.line === sig.line && d.severity === 'info'));
  assert.equal(at(c, 'billing-contact.signed-at', ['form']), 'none:', 'like:signatory has nothing to borrow');
});

// ------------------------------------------------------------ layer 3: resolving names

test('trap 1: context is walked from the outside in — demographics.first-name is found from inside demographics', () => {
  const c = corpus();
  // from [form, contact]: form.contact.first-name ✗ → contact.first-name ✓ (dropping the innermost first would hit an ambiguous leaf)
  assert.equal(at(c, 'first-name', ['form', 'contact']), 'contact.first-name');
});

test('trap 2: patterns and words never win a bare name by accident', () => {
  const c = corpus();
  assert.equal(at(c, 'email-address', ['form', 'restaurant-section']), 'restaurant.email-address');
  assert.equal(at(c, 'email', ['form', 'restaurant-section']), 'none:', 'the pattern input.email never answers for a bare email');
  assert.equal(at(c, 'phone', ['form']), 'none:', 'nor input.phone for phone');
  assert.equal(at(c, 'cancel', []), 'none:', 'a shared word is reached as words/cancel, never as a bare name');
  // With a field that is called email after all, the field wins, not the pattern.
  const s = smallCorpus({ 'd/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[email: email]]\n' });
  assert.equal(at(s, 'email', ['g'], 'd'), 'g.email', 'not input.email');
});

// Changed 29 Oct 2026 (Sema brief, D-013): a name that is a type's name is an error, as v0.8 says, and the
// corpus no longer has one, so the trap is planted here.
test('trap 3: a name that is also a type is still resolved and checked, and is an error where it is defined', () => {
  const s = smallCorpus({ 'd/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[phone: phone ? default:optional]]\n- [[text: longtext]]\n' });
  assert.equal(at(s, 'phone', ['g'], 'd'), 'g.phone');
  const d = checkDesign(s, 'd').diagnostics.filter((x) => x.code === 'name-is-type').map((x) => `${x.severity} ${x.file}:${x.line}`);
  assert.deepEqual(d, ['error d/data.md:8', 'error d/data.md:9']);
  assert.deepEqual(checkDesign(corpus(), 'onboarding').diagnostics.filter((x) => x.code === 'name-is-type'), [], 'the corpus names its fields for what they hold');
  const t = small({ 'd/index.md': '---\nsema: design\n---\n# D\n\n[[d: design]]\n', 'd/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[items: list of:text]]\n' });
  assert.deepEqual(checkDesign(t, 'd').diagnostics.filter((x) => x.severity !== 'info'), [], 'a bare type is fine as the value of of:');
});

test('ambiguity is an error naming both candidates — never a guess', () => {
  const c = corpus();
  assert.equal(at(c, 'first-name', ['check-details', 'summary-section']), 'ambiguous:contact.first-name,manager.first-name');
});

test('path walk: whole segments only, following like: and of:, accessors read in place', () => {
  const c = corpus();
  assert.equal(at(c, 'owner.first-name', []), 'contact.first-name', 'owner is like:contact');
  assert.equal(at(c, 'branch.street-address.line-1', []), 'location.street-address.line-1', 'nested groups come across');
  assert.equal(at(c, 'branch.postcode', []), 'branch.postcode', 'a child of the same name replaces one');
  assert.equal(at(c, 'branch.line-1', []), 'none:', 'skipping a segment is an error, not a landing on branch');
  assert.equal(at(c, 'dishes.first.price', ['editor'], 'menu-builder'), 'dish.price', '.first reads, of:dish steps down');
  const r = c.resolve('owner.first-name', [], 'onboarding');
  assert.ok(r.walk.some((w) => w.includes('like:contact')), 'the walk says it went through like:');
});

test('trap 8: a bare name never crosses a design boundary; built-in screen facts are not names', () => {
  const c = corpus();
  assert.equal(at(c, 'submitted', ['check-details']), 'none:', 'not menu-builder/menu.submitted');
  assert.equal(at(c, 'menu-builder/menu.submitted', []), 'menu.submitted', 'written as design/path it is found');
  assert.equal(at(c, 'menu-builder/editor', []), 'editor');
  const d = checkDesign(c, 'onboarding').diagnostics;
  assert.ok(!d.some((x) => x.message.includes('submitted')), 'when:!submitted is a screen fact, not a missing field');
});

test('trap 10: shared words are indexed by their own name, words/<name>, never by path', () => {
  const c = corpus();
  assert.equal(at(c, 'words/cancel', []), 'words.cancel');
  assert.equal(at(c, 'words/words.cancel', []), 'words.cancel');
  assert.equal(at(c, 'words/nope', []), 'none:');
});

// ------------------------------------------------------------ conditions

test('conditions: & binds tighter than , and names are qualified where they were written', () => {
  const cond = parseCondition('a&b,!c=x');
  assert.deepEqual(cond.map((and) => and.map((x) => `${x.not ? '!' : ''}${x.name}${x.op ?? ''}${x.value ?? ''}`)), [['a', 'b'], ['!c=x']]);
  assert.deepEqual(parseCondition('cuisine~"Thai, street"&searched').flat().map((x) => [x.name, x.op, x.value]), [['cuisine', '~', 'Thai, street'], ['searched', null, null]]);
  const paths = { cuisine: 'restaurant.cuisine', radius: 'restaurant.delivery-radius' };
  assert.equal(qualify('cuisine=thai&!valid,@platform.on&x.y=1,radius>2', (n) => paths[n] ?? null), 'restaurant.cuisine=thai&!valid,@platform.on&x.y=1,restaurant.delivery-radius>2');
  const c = corpus();
  const it = c.pages.get('onboarding/data.md').page.items.find((i) => i.token.name === 'delivery-radius');
  assert.equal(qualify(it.token.keys.when, (n) => { const r = c.resolve(n, it.context, 'onboarding'); return r.ok ? r.def.path : null; }), 'restaurant.offers-delivery');
});

// ------------------------------------------------------------ diagnostics over the corpus

// Recounted by hand on 29 Oct 2026 (Sema brief, phase 2), from the 3 errors and 10 warnings before:
//   errors   3 as before (check-details:25, data:26, form:42)
//            + 1 data:25 unquoted-space, now an error on every key (D-014)
//            + 7 planted in mistakes.md (lines 21, 22, 23, 25, 27, 28, 29)                    = 11
//   warnings 10 − 3 name-is-type (the fields are renamed, D-013) − 1 unquoted-space (now an error)
//            + 2 planted in mistakes.md (lines 24, 26)                                        = 8
// Phase 3 adds one, found by pattern-fits: check-details.md:20 puts summary.key-value (fits summary, group)
// on a section                                                                                = 9
test('the corpus: 11 errors and 9 warnings in onboarding, none in menu-builder — each with a file and a line', () => {
  const results = checkCorpus(corpus());
  assert.deepEqual(results.map((r) => r.name), ['menu-builder', 'onboarding']);
  const [menu, onb] = results;
  assert.deepEqual(menu.diagnostics, []);
  const list = (sev) => onb.diagnostics.filter((d) => d.severity === sev).map((d) => `${d.file}:${d.line} ${d.code}`);
  assert.deepEqual(list('error'), [
    'onboarding/check-details.md:25 ambiguous',
    'onboarding/data.md:25 unquoted-space',
    'onboarding/data.md:26 unresolved',
    'onboarding/form.md:42 unresolved',
    'onboarding/mistakes.md:21 name-has-space',
    'onboarding/mistakes.md:22 no-space-after-colon',
    'onboarding/mistakes.md:23 no-type',
    'onboarding/mistakes.md:25 values-cut-short',
    'onboarding/mistakes.md:27 unquoted-space',
    'onboarding/mistakes.md:28 unresolved',
    'onboarding/mistakes.md:29 unresolved',
  ]);
  assert.deepEqual(list('warning'), [
    'onboarding/check-details.md:20 pattern-fits',
    'onboarding/data.md:19 open-no-default', 'onboarding/data.md:21 unknown-words', 'onboarding/data.md:24 open-no-default',
    'onboarding/dialogs.md:23 unknown-words', 'onboarding/form.md:49 unknown-words',
    'onboarding/mistakes.md:24 unknown-mark', 'onboarding/mistakes.md:26 second-label',
    'onboarding/states.md:20 open-no-default',
  ]);
  assert.deepEqual(list('info'), ['onboarding/data.md:50 no-scope', 'onboarding/index.md:19 forward', 'onboarding/sign-up.md:20 forward']);
  const when = onb.diagnostics.find((d) => d.file === 'onboarding/data.md' && d.line === 26);
  assert.match(when.message, /when: has-terrace names nothing/);
  assert.equal(when.raw, '[[seating: number optional when:has-terrace "Seats outside"]]');
});

test('never silent: each mistake in mistakes.md is one diagnostic, and its message names the fix', () => {
  const onb = checkCorpus(corpus()).find((r) => r.name === 'onboarding');
  const msg = Object.fromEntries(onb.diagnostics.filter((d) => d.file === 'onboarding/mistakes.md').map((d) => [d.line, d.message]));
  assert.equal(Object.keys(msg).length, 9, 'nine planted lines, nine diagnostics');
  assert.equal(msg[21], 'a name cannot contain a space — write restaurant-name: text');
  assert.equal(msg[22], 'put a space after the colon: cuisine: text');
  assert.equal(msg[23], 'Website is a definition but names no type — types are lower case: website: text');
  assert.equal(msg[24], 'required-field is not a mark Sema knows; the marks are listed in spec/syntax.md');
  assert.equal(msg[25], 'the value list ended at the space before mid=Mid — values are written without spaces around the bars');
  assert.equal(msg[26], '"Name" is a second label and is ignored; one label per token');
  assert.equal(msg[27], 'asks:the product team looks like one value with spaces — quote it: asks:"the product team"');
  assert.match(msg[28], /did you mean restaurant\.name \(onboarding\/data\.md, line 18\)\?$/);
  assert.match(msg[29], /signatory opens no scope \(onboarding\/data\.md, line 50\), so its fields belong to owner$/);
  const form42 = onb.diagnostics.find((d) => d.file === 'onboarding/form.md' && d.line === 42);
  assert.match(form42.message, /signatory opens no scope/, 'the cause is found through like: too');
});

test('never silent: a page without sema: never gets these diagnostics; flags are offered by completion from the same list', async () => {
  const s = smallCorpus({ 'd/notes.md': '# Notes\n\n## G\n\n[[g: group]]\n\n- [[Restaurant name: text]]\n- [[x: text required-field]]\n' });
  assert.deepEqual(checkDesign(s, 'd').diagnostics.filter((x) => ['name-has-space', 'unknown-mark'].includes(x.code)), []);
  const { completeAt } = await import('../packages/semark/src/complete.js');
  const { KNOWN_FLAGS } = await import('../packages/semark/src/model.js');
  const got = completeAt('x: text req', { names: [], types: [], patterns: [] });
  assert.deepEqual(got.options.map((o) => o.label), ['required']);
  assert.ok(KNOWN_FLAGS.has('row') && KNOWN_FLAGS.has('to-be'));
});

test('a definition made twice is an error; an unknown pattern is an error', () => {
  const s = small({
    'd/index.md': '---\nsema: design\n---\n# D\n\n[[d: design]]\n',
    // Since 29 Oct 2026 (phase 4) a page takes part only when it says sema:, so this one says so.
    'd/a.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[x: text]]\n- [[x: text]]\n- [[y > input.nothing]]\n',
  });
  const d = checkDesign(s, 'd').diagnostics;
  assert.ok(d.some((x) => x.code === 'duplicate' && x.line === 9 && /also at d\/a\.md:8/.test(x.message)));
  assert.ok(d.some((x) => x.code === 'unknown-pattern' && x.line === 10));
});

// ------------------------------------------------------------ layer 4: readiness

test('readiness of form.md, worked out by hand: 10 · 8 settled · 1 on defaults · 1 blocking · 1 unknown word · 4 frames · not ready', () => {
  const onb = checkCorpus(corpus()).find((r) => r.name === 'onboarding');
  const form = onb.readiness.find((r) => r.file === 'onboarding/form.md');
  assert.deepEqual([form.things, form.settled, form.onDefaults, form.blocking, form.unknownWords, form.frames, form.ready], [10, 8, 1, 1, 1, 4, false]);
  const state = Object.fromEntries(form.fields.map((f) => [f.path, f.state]));
  assert.equal(state['restaurant.opening-date'], 'settled', 'the reference says required: that settles it on this page');
  assert.equal(state['restaurant.email-address'], 'blocking', 'silence on the reference is not a decision');
  assert.equal(state['restaurant.phone-number'], 'on-default');
  const hours = onb.readiness.find((r) => r.file === 'onboarding/opening-hours.md');
  assert.deepEqual([hours.things, hours.settled, hours.onDefaults, hours.blocking, hours.ready], [3, 2, 1, 0, true]);
  const editor = checkCorpus(corpus()).find((r) => r.name === 'menu-builder').readiness[0];
  assert.deepEqual([editor.file, editor.things, editor.frames, editor.ready], ['menu-builder/editor.md', 4, 2, true]);
});

test('trap 4: readiness counts what a screen shows through its definitions, once each', () => {
  const s = small({
    'd/index.md': '---\nsema: design\n---\n# D\n\n[[d: design]]\n',
    'd/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[a: text required]]\n- [[b: text ?]]\n- [[c: text ? default:optional]]\n- [[d2: text ?]]\n',
    'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[a > input.text]]\n- [[a]]\n- [[b]]\n- [[c]]\n- [[d2 optional]]\n- [[go: action "Go"]]\n',
  });
  const r = checkDesign(s, 'd').readiness[0];
  assert.deepEqual([r.things, r.settled, r.onDefaults, r.blocking], [4, 2, 1, 1], 'a twice is one; the action is not a thing; d2 is settled by its reference');
});

// ------------------------------------------------------------ the command line

test('semark check: totals, the report, exit 1 on errors; a nested copy of a corpus is skipped, a missing vocabulary is named', async () => {
  const { runCheck } = await import('../packages/semark/src/corpus.js');
  // os is imported at the top.
  const capture = () => { const chunks = []; return { write: (s) => { chunks.push(s); return true; }, text: () => chunks.join('') }; };
  let out = capture();
  assert.equal(await runCheck(ROOT, { out }), 1);
  assert.match(out.text(), /^2 designs · 12 pages · \d+ tokens · 11 errors · 9 warnings$/m);
  assert.match(out.text(), /onboarding\/form\.md  10 fields · 8 settled · 1 on defaults · 1 blocking · 1 words unknown · 4 frames · not ready/);

  // A copy of the corpus nested inside it is skipped, not counted twice.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sema-'));
  fs.cpSync(ROOT, tmp, { recursive: true });
  fs.cpSync(ROOT, path.join(tmp, 'packages', 'copy'), { recursive: true });
  out = capture();
  await runCheck(tmp, { out });
  assert.match(out.text(), /^2 designs · 12 pages/m);
  assert.match(out.text(), /Skipped nested copies of a corpus: packages\/copy/);

  // One design folder alone has no patterns: say so instead of only listing false errors.
  out = capture();
  await runCheck(path.join(ROOT, 'menu-builder'), { out });
  assert.match(out.text(), /No patterns\.md under .*every pattern will look unknown/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('code and comments are not read: inline code, fences (also in lists), HTML comments', () => {
  const text = ['---', 'sema: screen', '---', '# A', '[[a: screen]]', '',
    'Use `[[x: field]]` and ``[[y]] ` `` then [[b]] <!-- [[c]] -->',
    '```md', '[[in-code]]', '```js', '[[still-code]]', '```', '[[after]]',
    '- ```', '  [[list-code]]', '  ```', '<!--', '[[hidden]]', '-->', '[[last]]'].join('\n');
  assert.deepEqual(parsePage(text).items.map((i) => `${i.line}:${i.token.raw}`), ['5:[[a: screen]]', '7:[[b]]', '13:[[after]]', '20:[[last]]']);
});

/** Every element of a frame, flattened. */
const flatten = (el) => (el ? [el, ...el.children.flatMap(flatten)] : []);
const frameOf = (v, sheet, state) => v.sheets.find((s) => s.name === sheet).frames.find((f) => f.name === state);
const elIn = (frame, name) => flatten(frame.root).find((e) => e.name === name);

test('views: the page kind is decided before anything is drawn (trap 7)', () => {
  const c = corpus();
  assert.equal(viewOf(c, 'onboarding/sign-up.md').kind, 'flow');
  assert.equal(viewOf(c, 'onboarding/index.md').kind, 'map');
  assert.equal(viewOf(c, 'onboarding/form.md').kind, 'frames');
  assert.equal(viewOf(c, 'onboarding/opening-hours.md').kind, 'frames');
  for (const f of ['onboarding/data.md', 'onboarding/states.md', 'patterns.md', 'words.md', 'roles.md']) assert.equal(viewOf(c, f).kind, 'list', f);
  assert.equal(viewOf(c, 'README.md'), null);
});

test('views: one sheet per screen (trap 6); states are frames, never content; a skipped state is listed, not drawn', () => {
  const c = corpus();
  const dialogs = viewOf(c, 'onboarding/dialogs.md');
  assert.deepEqual(dialogs.sheets.map((s) => s.name), ['discard-dialog', 'sent-dialog']);
  assert.equal(dialogs.sheets[0].present, 'dialog');
  const form = viewOf(c, 'onboarding/form.md').sheets[0];
  assert.deepEqual(form.frames.map((f) => [f.name, f.skipped]), [['empty', false], ['invalid', false], ['delivering', false], ['approved-preview', true]]);
  assert.ok(!flatten(form.frames[0].root).some((e) => e.type === 'state'));
});

test('views: any anchor is a container (trap 5); a placed widget brings its card; the binding picks shapes by prefix (trap 12)', () => {
  const c = corpus();
  const f = frameOf(viewOf(c, 'onboarding/form.md'), 'form', 'empty');
  const contact = elIn(f, 'contact');
  assert.equal(contact.shape, 'container');
  assert.deepEqual(contact.children.map((e) => e.name), ['first-name', 'last-name', 'mobile']);
  assert.deepEqual(elIn(f, 'opening-hours-card').children.map((e) => e.name), ['opens-at', 'closes-at', 'days']);
  const status = elIn(frameOf(viewOf(c, 'onboarding/check-details.md'), 'check-details', 'review'), 'status');
  assert.equal(status.shape, 'badge', 'status.badge is a badge, never a choice');
  assert.equal(status.value, 'Draft');
  assert.deepEqual(shapeFor('status.badge', 'enum'), ['badge', null]);
  assert.deepEqual(shapeFor('input.text.long', 'longtext'), ['area', null]);
  assert.deepEqual(shapeFor('input.brand-new', 'text'), ['field', null], 'a new pattern lands on its prefix');
  assert.deepEqual(shapeFor('status.pill', 'enum'), ['unbound', 'status.pill'], 'no row: a plain box, never a control guessed from the type');
  assert.deepEqual(shapeFor(null, 'enum'), ['value', null], 'no pattern: the value, as text (rule 2)');
  assert.ok(WIREFRAME_BINDING.length < 50);
});

test('views: conditions are three-valued; what a frame does not track is shown and marked, never hidden', () => {
  const c = corpus();
  const v = viewOf(c, 'onboarding/form.md');
  const empty = frameOf(v, 'form', 'empty');
  assert.equal(elIn(empty, 'delivery-radius'), undefined, 'nothing entered: offers-delivery is off');
  assert.deepEqual(flatten(empty.root).flatMap((e) => e.hidden.map((h) => h.name)), ['delivery-radius']);
  assert.equal(elIn(frameOf(v, 'form', 'delivering'), 'delivery-radius').shown, 'yes');
  // enabled:valid is unknown until a state says; !valid makes it off.
  assert.equal(elIn(empty, 'submit').enabled, 'unknown');
  assert.equal(elIn(frameOf(v, 'form', 'invalid'), 'submit').enabled, 'no');
  const small = smallCorpus({
    'd/screen.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[a: text when:@platform.on]]\n- [[b: text when:nobody-knows]]\n',
  });
  const f = viewOf(small, 'd/screen.md').sheets[0].frames[0];
  assert.deepEqual(f.root.children.map((e) => [e.name, e.shown, e.when]), [['a', 'unknown', '@platform.on'], ['b', 'unknown', 'nobody-knows']]);
});

test('views: words — unknown is hatched with its name, shared words resolve, other braces stay, a parent\'s words are not repeated', () => {
  const c = corpus();
  const f = frameOf(viewOf(c, 'onboarding/form.md'), 'form', 'empty');
  assert.equal(elIn(f, 'cuisine').words.state, 'unknown');
  assert.equal(elIn(f, 'save-draft').words.state, 'unknown');
  assert.equal(elIn(f, 'cancel-button').words.text, 'Cancel');
  const small = smallCorpus({
    'd/screen.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n## Settings\n\n[[settings-card: section "Settings"]]\n\n- [[inner: section "Settings"]]\n- [[count: number "Notes ({notes.count})"]]\n',
  });
  const root = viewOf(small, 'd/screen.md').sheets[0].frames[0].root;
  const card = root.children[0];
  assert.equal(card.words.text, 'Settings', 'the card keeps its title (compared as words, not as names)');
  assert.equal(card.children[0].words.state, 'none', 'the child saying the same words drops them');
  assert.equal(card.children[1].words.text, 'Notes ({notes.count})');
});

test('views: a frame that says !valid draws what can fail as failing (rule 9); the chosen value follows given, initial, first (rule 8)', () => {
  const c = corpus();
  const v = viewOf(c, 'onboarding/form.md');
  const invalid = frameOf(v, 'form', 'invalid');
  assert.equal(elIn(invalid, 'first-name').error, 'Required');
  assert.equal(elIn(invalid, 'mobile').error, null, 'optional cannot fail');
  assert.equal(elIn(frameOf(v, 'form', 'empty'), 'first-name').error, null);
  assert.equal(elIn(frameOf(v, 'form', 'empty'), 'days').value, 'Every day', 'initial:');
  const small = smallCorpus({
    'd/screen.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[mode: enum |pickup=Pickup|delivery=Delivery| > choice.single]]\n- [[extra: text when:mode=delivery > input.text]]\n\n## States\n\n- [[home: state given:mode=delivery]]\n- [[plain: state]]\n',
  });
  const sv = viewOf(small, 'd/screen.md').sheets[0];
  const home = sv.frames.find((f) => f.name === 'home');
  assert.equal(home.root.children.find((e) => e.name === 'mode').value, 'Delivery', 'given first');
  assert.ok(home.root.children.some((e) => e.name === 'extra'));
  const plain = sv.frames.find((f) => f.name === 'plain');
  assert.equal(plain.root.children.find((e) => e.name === 'mode').value, 'Pickup', 'then the first value');
  assert.ok(!plain.root.children.some((e) => e.name === 'extra'));
});

test('views: like: copies the whole subtree, nested groups included (rule 11); a widget takes the states of the screen that places it (rule 5)', () => {
  const small = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n# Data\n\n## Reading\n\n[[reading: group]]\n\n- [[value: number "Value"]]\n- [[when-taken: group]]\n  - [[date: date "Date"]]\n\n## BP\n\n[[bp: group like:reading]]\n\n- [[value: number "Systolic"]]\n',
    'd/screen.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n## Pressure\n\n[[bp]]\n\n## States\n\n- [[one: state]]\n- [[two: state given:valid]]\n',
  });
  const root = viewOf(small, 'd/screen.md').sheets[0].frames[0].root;
  const bp = root.children[0];
  assert.deepEqual(bp.children.map((e) => e.name), ['when-taken', 'value']);
  assert.deepEqual(bp.children[0].children.map((e) => e.name), ['date'], 'a nested group comes across as a group');
  assert.equal(bp.children[1].words.text, 'Systolic', 'a child of the same name replaces one');
  const w = viewOf(corpus(), 'onboarding/opening-hours.md').sheets[0];
  assert.deepEqual(w.frames.map((f) => f.name), ['form · empty', 'form · invalid', 'form · delivering', 'form · approved-preview']);
  assert.equal(w.frames[0].from, 'onboarding/form.md');
});

test('views: a flow is a graph with its forward and cross-design steps marked; a design map finds orphans and readiness', () => {
  const c = corpus();
  const [flow] = viewOf(c, 'onboarding/sign-up.md').flows;
  assert.deepEqual(flow.edges.map((e) => `${e.from}->${e.to}`), ['form->check-details', 'check-details->menu-builder/editor']);
  assert.deepEqual(Object.fromEntries(flow.nodes.map((n) => [n.name, n.state])), { form: 'ok', 'check-details': 'ok', 'menu-builder/editor': 'elsewhere', 'screen.welcome': 'forward' });
  const map = viewOf(c, 'onboarding/index.md').map;
  assert.deepEqual(map.orphans.map((o) => o.name), ['discard-dialog', 'sent-dialog']);
  // Phase 6 adds the writer's assumptions (#a…) to the map's counts; form has none.
  assert.deepEqual(map.screens.find((s) => s.name === 'form').counts, { things: 10, settled: 8, onDefaults: 1, blocking: 1, unknownWords: 1, frames: 4, assumed: 0 });
  assert.deepEqual(map.elsewhere.map((e) => [e.name, e.state]), [['menu-builder/promotions', 'forward']]);
  assert.equal(map.totals.errors, 11, 'the design\'s errors, recounted in "the corpus: 11 errors and 9 warnings"');
});

test('views: review cases — negated facts, bools and collections not given, filters, several like:, per-screen placement and reach', () => {
  const c = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n# Data\n\n## A\n\n[[a: group]]\n\n- [[x: text "X"]]\n\n## B\n\n[[b: group]]\n\n- [[y: text "Y"]]\n\n## Both\n\n[[both: group like:a,b]]\n\n## Items\n\n[[items: collection of:a]]\n',
    'd/screen.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n'
      + '- [[kind: enum |a|b|c| > choice.single]]\n- [[flag: bool > choice.binary]]\n'
      + '- [[t-b: text when:kind=b]]\n- [[off-1: text when:!flag]]\n- [[off-2: text when:flag=false]]\n'
      + '- [[has-items: text when:items!=empty]]\n- [[only-filtered: text when:filtered]]\n- [[both]]\n\n'
      + '## States\n\n- [[not-a: state given:!kind=a]]\n- [[filter: state given:kind~b]]\n',
    'd/dialogs.md': '---\nsema: screen\n---\n# Dialogs\n\n## One\n\n[[one: screen]]\n\n- [[w]]\n\n## Two\n\n[[two: screen]]\n\n- [[t-two: state]]\n',
    'd/w.md': '---\nsema: widget\n---\n# W\n\n## Card\n\n[[w: region "W"]]\n',
    'd/flow.md': '---\nsema: flow\n---\n# F\n\n[[f: flow]]\n\n- [[s -> one]]\n',
  });
  const sheet = viewOf(c, 'd/screen.md').sheets[0];
  const notA = sheet.frames.find((f) => f.name === 'not-a');
  const names = (f) => flatten(f.root).map((e) => [e.name, e.shown]);
  const get = (f, n) => flatten(f.root).find((e) => e.name === n);
  assert.equal(get(notA, 't-b').shown, 'unknown', 'kind is not a — it may be b: shown and marked');
  assert.equal(get(notA, 'kind').value, 'b', 'rule 8 skips the value the state rules out');
  assert.equal(get(notA, 'off-1').shown, 'yes');
  assert.equal(get(notA, 'off-2').shown, 'yes', '!flag and flag=false say the same thing');
  assert.equal(get(notA, 'has-items').shown, 'unknown', 'records the system holds are not known to be empty');
  assert.equal(get(notA, 'only-filtered'), undefined);
  assert.equal(get(sheet.frames.find((f) => f.name === 'filter'), 'only-filtered').shown, 'yes', 'a filter set with ~ is filtering');
  assert.deepEqual(get(notA, 'both').children.map((e) => e.name), ['x', 'y'], 'every like: counts');
  void names;
  const w = viewOf(c, 'd/w.md').sheets[0];
  assert.deepEqual(w.frames.map((f) => f.name), ['start'], 'the dialog that does not place the widget lends it no states');
  const map = viewOf(c, 'd/index.md').map;
  assert.deepEqual(map.orphans.map((o) => o.name), ['two'], 'reach is per screen, not per file');
});

test('completion: names, types, fitting patterns; a long list is never cut before the match', async () => {
  const { vocabulary, completeAt } = await import('../packages/semark/src/complete.js');
  const v = vocabulary(corpus(), 'onboarding');
  const labels = (b, n) => completeAt(b, v, n)?.options.map((o) => o.label) ?? null;
  assert.deepEqual(labels('first'), ['contact.first-name', 'manager.first-name']);
  assert.deepEqual(labels('restaurant.na'), ['restaurant.name']);
  assert.ok(labels('x: te').includes('text'));
  assert.deepEqual(labels('cuisine > ch'), ['choice.single'], 'an enum takes choice.single, not choice.binary');
  assert.deepEqual(labels('feta > input.te'), ['input.text'], 'an unknown name gets every pattern, matched by what is typed');
  assert.ok(labels('feta > i', 30).includes('input.text'));
  assert.equal(labels('a b'), null);
});

// ------------------------------------------------------------ the value-level rules (phase 3)

const VALUES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'values');
const valuesCorpus = () => new Corpus(walk(VALUES).map((f) => ({ file: path.relative(VALUES, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') })));

// Worked out by hand before the code: each page in test/fixtures/values/values makes its rule's
// mistake on exactly one line and writes the correct form on another, so the checker reports one
// diagnostic per page, on the mistake's line, under the page's own name; data.md and index.md report none.
test('value rules: each page of the second corpus plants its mistake once, and it is reported once under its code', () => {
  const [d] = checkCorpus(valuesCorpus());
  const got = d.diagnostics.map((x) => `${x.file}:${x.line} ${x.code} ${x.severity}`);
  assert.deepEqual(got, [
    'values/action-no-words.md:17 action-no-words warning',
    'values/assumed.md:17 assumed info',
    'values/brace-unresolved.md:17 brace-unresolved error',
    'values/default-missing.md:19 default-missing error',
    'values/duration-unit.md:18 duration-unit error',
    'values/enum-value.md:18 enum-value error',
    'values/except-outside.md:17 except-outside error',
    'values/goto-unresolved.md:17 goto-unresolved error',
    'values/level.md:15 level warning',
    'values/nav-no-per.md:17 nav-no-per warning',
    'values/number-in-prose.md:17 number-in-prose warning',
    'values/outside-anchor.md:22 outside-anchor info',
    'values/pattern-fits.md:17 pattern-fits warning',
    'values/role-missing.md:17 role-missing error',
    'values/selected-without-select.md:17 selected-without-select error',
    'values/step-redefines.md:17 step-redefines warning',
    'values/when-contradicts.md:17 when-contradicts error',
    'values/wrong-group.md:30 wrong-group warning',
  ]);
  // Every page is named for its rule, so nothing fired on a page that is not about it.
  for (const x of d.diagnostics) assert.equal(x.file, `values/${x.code}.md`, `${x.code} fired on ${x.file}`);
  const by = (code) => d.diagnostics.find((x) => x.code === code).message;
  assert.match(by('enum-value'), /restaurant\.cuisine has no value french; its values are thai, italian/);
  assert.match(by('default-missing'), /default:medium names nothing defined — a default here is one of its values \(small, large\)/);
  assert.match(by('role-missing'), /there is no role courier; the roles are owner, staff/);
  assert.match(by('wrong-group'), /shift-phone resolved to manager\.shift-phone; the fields around it are contact\.\*/);
  assert.match(by('when-contradicts'), /!restaurant\.offers-delivery against restaurant\.offers-delivery/);
  assert.match(by('duration-unit'), /write 60s/);
  assert.match(by('selected-without-select'), /add select:one to past-orders \(values\/data\.md, line \d+\)/);
});

test('value rules: readiness counts an action with no words as unknown words, assumptions apart, and the level reached', () => {
  const [d] = checkCorpus(valuesCorpus());
  const r = (file) => d.readiness.find((x) => x.file === `values/${file}.md`);
  assert.equal(r('action-no-words').unknownWords, 1, 'trash has no words');
  assert.equal(r('action-no-words').ready, false);
  assert.equal(r('assumed').assumed, 1);
  assert.equal(r('assumed').ready, true, 'an assumption is settled for drawing');
  assert.deepEqual([r('level').level, r('level-right').level, r('assumed').level], [2, 2, 3]);
  const s = smallCorpus({ 'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n## Main\n\n[[main: region]]\n\n- [[a: text required > input.text]]\n- [[go: action > action.primary "Go"]]\n\n## States\n\n- [[empty: state given:!valid]]\n' });
  assert.equal(checkDesign(s, 'd').readiness[0].level, 4, 'patterns on all it shows, a region, and a state with given:');
});

test('value rules: the edges — refresh:, values that exist only when, defaults that are text, two fields compared, ORs never contradict', () => {
  const s = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n'
      + '- [[kind: enum |a|b| required]]\n'
      + '- [[other: enum |a|b| required]]\n'
      + '- [[live: number derived refresh:2..3]]\n'
      + '- [[pick: enum |x when:kind=c|y| required]]\n'
      + '- [[greeting: text ? default:"Hello there"]]\n'
      + '- [[count: number ? default:"many"]]\n'
      + '- [[same: bool required when:kind=other]]\n'
      + '- [[flag: bool required when:kind=a,kind=b]]\n',
    'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[flag when:kind=b]]\n- [[x: help "?" when:kind=other&other=a]]\n',
  });
  const got = checkDesign(s, 'd').diagnostics.filter((x) => !['open-no-default', 'unknown-words'].includes(x.code)).map((x) => `${x.file}:${x.line} ${x.code}`);
  assert.deepEqual(got, [
    'd/data.md:10 duration-unit', // refresh:2..3 has no unit
    'd/data.md:11 enum-value',    // |x when:kind=c| — kind has no c
    'd/data.md:13 default-missing', // a number's default cannot be a quoted text
  ], 'a text default may be quoted text; kind=other compares two fields; an OR never contradicts');
});

// ------------------------------------------------------------ resolver and model (phase 4)

test('a page without sema: contributes no names, even with a definition outside backticks', () => {
  const s = smallCorpus({
    'd/README.md': '# About\n\nFields are written like [[email: text]] here.\n',
    'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[email]]\n',
  });
  assert.equal(at(s, 'email', ['s'], 'd'), 'none:', 'the README defines nothing');
  assert.ok(s.pages.get('d/README.md'), 'the page is still listed, so the editor can say it is not Sema');
  assert.equal(s.pages.get('d/README.md').takesPart, false);
  assert.ok(!s.designPages('d').some((p) => p.file === 'd/README.md'), 'and it is not checked as part of the design');
  assert.deepEqual(checkDesign(s, 'd').diagnostics.map((x) => `${x.file}:${x.line} ${x.code}`), ['d/s.md:8 unresolved']);
});

test('two folders declaring one design name: the first keeps it, the second is an error and takes no part', async () => {
  const s = small({
    'a/index.md': '---\nsema: design\n---\n# A\n\n[[same: design]]\n',
    'a/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[x: text required]]\n',
    'b/index.md': '---\nsema: design\n---\n# B\n\n[[same: design]]\n',
    'b/data.md': '---\nsema: data\n---\n## G\n\n[[g: group]]\n\n- [[y: text required]]\n',
  });
  assert.deepEqual([...s.designs.keys()], ['same']);
  assert.equal(s.designs.get('same').folder, 'a');
  assert.deepEqual(s.diagnostics.map((x) => `${x.file}:${x.line} ${x.code} ${x.severity}`), ['b/index.md:6 design-twice error']);
  assert.match(s.diagnostics[0].message, /same is declared in a\/index\.md and b\/index\.md; a design has one folder/);
  assert.equal(at(s, 'g.y', [], 'same'), 'none:', 'the second folder adds nothing to the design');
  assert.deepEqual(checkCorpus(s).corpus, s.diagnostics, 'the corpus findings travel beside the per-design ones');

  // The command line prints it first, and nothing from a stray README.
  const { runCheck } = await import('../packages/semark/src/corpus.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sema-twice-'));
  fs.cpSync(ROOT, tmp, { recursive: true });
  fs.cpSync(path.join(ROOT, 'menu-builder'), path.join(tmp, 'menu-copy'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'onboarding', 'README.md'), '# Notes\n\nA stray [[nothing-here]] and [[email: text]].\n');
  const chunks = [];
  assert.equal(await runCheck(tmp, { out: { write: (x) => { chunks.push(x); return true; } } }), 1);
  const text = chunks.join('');
  const lines = text.split('\n');
  assert.match(lines[1], /^✖ menu-copy\/index\.md:\d+  design-twice  menu-builder is declared in menu-builder\/index\.md and menu-copy\/index\.md/);
  assert.ok(!text.includes('nothing-here') && !text.includes('README'), 'the README says nothing');
  assert.match(lines[0], /^2 designs · 12 pages · \d+ tokens · 12 errors · 9 warnings$/, 'one more error than the corpus: the twin');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('a bare name never means the design itself; from another design it is design/design', () => {
  const c = corpus();
  assert.equal(at(c, 'onboarding', [], 'onboarding'), 'none:', 'inside onboarding, [[onboarding]] is not the design');
  assert.equal(at(c, 'onboarding/onboarding', [], 'menu-builder'), 'onboarding');
});

test('resolution drops the outermost segment first: from [form, section, b], x is b.x, not a.x', () => {
  // syntax.md, Names and nesting: form.section.b.x, then section.b.x, then b.x. Dropping the innermost
  // segment first would try form.section.x, form.x, x and find neither, or the wrong one.
  const s = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n## A\n\n[[a: group]]\n\n- [[x: text]]\n\n## B\n\n[[b: group]]\n\n- [[x: text]]\n',
  });
  assert.equal(at(s, 'x', ['form', 'section', 'b'], 'd'), 'b.x');
  assert.equal(at(s, 'x', ['form', 'section'], 'd'), 'ambiguous:a.x,b.x', 'with no b in the context, two x is an error, not a guess');
});

test('reading order: design page, flows, data, screens as the flows reach them with their widgets, the rest by name', () => {
  const c = corpus();
  assert.deepEqual(c.designOrder('onboarding').map((f) => f.replace('onboarding/', '')), [
    'index.md', 'sign-up.md', 'data.md', 'mistakes.md', 'states.md', 'form.md', 'opening-hours.md', 'check-details.md', 'dialogs.md',
  ]);
  const map = viewOf(c, 'onboarding/index.md').map;
  assert.deepEqual(map.screens.map((s) => s.name), ['form', 'opening-hours-card', 'check-details', 'discard-dialog', 'sent-dialog']);
});

test('the drawing of a list page shows what the checker says about each row, not only "resolves to nothing"', () => {
  const c = corpus();
  const checked = checkDesign(c, 'onboarding');
  const rows = viewOf(c, 'onboarding/mistakes.md', checked).sections.flatMap((s) => s.rows);
  const problem = (name) => rows.find((r) => r.name === name)?.problem;
  assert.equal(problem('Restaurant'), 'a name cannot contain a space — write restaurant-name: text');
  assert.match(problem('Website'), /names no type/);
  assert.match(problem('price-band'), /the value list ended/);
  // Without the checker's findings (a page drawn on its own), a mistyped name is still named as such.
  const alone = viewOf(c, 'onboarding/mistakes.md').sections.flatMap((s) => s.rows);
  assert.equal(alone.find((r) => r.name === 'cuisine:text').problem, 'put a space after the colon: cuisine: text');
});

// ------------------------------------------------------------ server and client (phase 5)

/** A repository with the fixture vocabulary and a design of `n` small screens, plus whatever `extra` adds. */
function bigRepo(n, extra = () => {}) {
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sema-big-')));
  for (const f of ['patterns.md', 'words.md', 'roles.md']) fs.copyFileSync(path.join(ROOT, f), path.join(repo, f));
  fs.mkdirSync(path.join(repo, 'big'));
  fs.writeFileSync(path.join(repo, 'big', 'index.md'), '---\nsema: design\n---\n# Big\n\n[[big: design]]\n');
  for (let i = 0; i < n; i++) fs.writeFileSync(path.join(repo, 'big', `s${i}.md`), `---\nsema: screen\n---\n# S${i}\n\n[[s${i}: screen]]\n\n- [[f${i}: text required "Field ${i}"]]\n`);
  extra(repo);
  return repo;
}

test('drawing: empty: shows its words where a frame says the value is missing; a frame for one role leaves out what is not for it', () => {
  const s = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n## Details\n\n[[details: group empty:"Not given"]]\n\n- [[licence: text optional]]\n- [[seats: number optional empty:"No terrace"]]\n',
    'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[details > summary.key-value]]\n- [[payouts: section for:owner "Payouts"]]\n- [[rota: section for:!owner "Rota"]]\n\n## States\n\n'
      + '- [[missing: state given:details.licence=empty&details.seats=empty&@user.role=staff]]\n- [[as-owner: state given:@user.role=owner]]\n',
  });
  const sheet = viewOf(s, 'd/s.md').sheets[0];
  const missing = sheet.frames.find((f) => f.name === 'missing');
  const details = missing.root.children.find((e) => e.name === 'details');
  const kid = (name) => details.children.find((e) => e.name === name);
  assert.equal(kid('licence').empty, 'Not given', 'from the group');
  assert.equal(kid('seats').empty, 'No terrace', 'its own wins');
  const owner = sheet.frames.find((f) => f.name === 'as-owner');
  assert.equal(owner.root.children.find((e) => e.name === 'details').children.find((e) => e.name === 'licence').empty, null, 'a value not said to be missing is drawn as a value');
  assert.deepEqual([missing.role, owner.role], ['staff', 'owner']);
  const names = (f) => f.root.children.map((e) => e.name);
  assert.ok(!names(missing).includes('payouts') && names(missing).includes('rota'), 'staff: no payouts');
  assert.ok(names(owner).includes('payouts') && !names(owner).includes('rota'), 'owner: payouts, no rota');
  assert.ok(missing.hidden.some((h) => h.name === 'payouts' && h.when === 'for:owner'), 'and it says why');
});

test('like: and of: cycles end: resolving, checking and drawing them never loops or throws', () => {
  const s = smallCorpus({
    'd/data.md': '---\nsema: data\n---\n## A\n\n[[a: group like:b]]\n\n- [[x: text]]\n\n## B\n\n[[b: group like:a]]\n\n- [[y: text]]\n\n## L\n\n[[l: list of:m]]\n\n## M\n\n[[m: list of:l]]\n',
    'd/s.md': '---\nsema: screen\n---\n# S\n\n[[s: screen]]\n\n- [[a.y]]\n- [[b.x]]\n- [[a.nothing]]\n- [[l.first]]\n',
  });
  assert.equal(at(s, 'a.y', [], 'd'), 'b.y');
  assert.equal(at(s, 'a.nothing', [], 'd'), 'none:');
  const d = checkDesign(s, 'd').diagnostics.map((x) => `${x.line} ${x.code}`);
  assert.deepEqual(d, ['10 unresolved']);
  assert.ok(viewOf(s, 'd/s.md').sheets.length === 1);
});

test('a page with CRLF line ends or a byte order mark reads exactly as the same page with LF', () => {
  const lf = fs.readFileSync(path.join(ROOT, 'onboarding', 'form.md'), 'utf8');
  const variants = { crlf: lf.replace(/\n/g, '\r\n'), bom: '﻿' + lf };
  const shape = (page) => page.items.map((i) => `${i.line}:${i.col}:${i.token.raw}:${i.path}`);
  for (const [name, text] of Object.entries(variants)) {
    assert.deepEqual(shape(parsePage(text)), shape(parsePage(lf)), name);
    assert.equal(parsePage(text).sema, 'screen', name);
    const files = walk(ROOT).map((f) => ({ file: path.relative(ROOT, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') }));
    const swapped = files.map((f) => (f.file === 'onboarding/form.md' ? { ...f, text } : f));
    const diag = (c) => checkDesign(c, 'onboarding').diagnostics.map((x) => `${x.file}:${x.line}:${x.col} ${x.code}`);
    assert.deepEqual(diag(new Corpus(swapped)), diag(new Corpus(files)), name);
  }
});
