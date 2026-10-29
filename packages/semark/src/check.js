// @ts-check
/**
 * Sema, layers 3–4: what a design leaves unresolved or undecided, with a file
 * and a line for every finding, and how ready each screen and widget is.
 *
 * Both the command-line checker and the editor call these functions; there is
 * no second implementation to drift from.
 */
import { Corpus, TYPES, DATA_TYPES, SCREEN_FACTS, BUILTIN_VALUES, KNOWN_FLAGS } from './model.js';
import { keyList } from './token.js';
import { conditionNames, qualify, parseCondition } from './condition.js';

/**
 * @typedef {import('./model.js').Def} Def
 * @typedef {import('./page.js').Item} Item
 * @typedef {'error' | 'warning' | 'info'} Severity
 * @typedef {{ severity: Severity, code: string, file: string, line: number, col: number, raw: string, message: string }} Diagnostic
 * @typedef {{ file: string, things: number, settled: number, onDefaults: number, blocking: number, unknownWords: number, frames: number, errors: number, ready: boolean,
 *   assumed: number, level: number,
 *   fields: Array<{ path: string, state: 'settled' | 'on-default' | 'blocking' }> }} Readiness
 */

/** Marks whose value names something in the design. */
const NAMING_KEYS = ['of', 'like', 'options', 'from', 'span'];
/** Values of those marks that name a source or an instruction, not a thing. */
const NOT_NAMES = new Set(['options:values', 'options:present', 'default:draw', 'default:skip']);
/** Keys whose value is words: an unquoted value with a space would split into stray flags after it. */
const TEXT_KEYS = new Set(['hint', 'error', 'add', 'placeholder', 'initial', 'default', 'empty', 'is']);
/**
 * Severities that are a decision rather than the spec's plain word (spec/checks.md and spec/decisions/).
 * @type {Record<string, Severity>}
 */
export const SEVERITY = { 'name-is-type': 'error', 'unquoted-space': 'error' };
/** A name written kind-first is a forward reference while it does not exist yet. */
const KIND_FIRST = /^(screen|flow|widget|step|data|states|config|design)\./;

/** @param {Def[]} c */
const both = (c) => c.slice(0, 2).map((d) => d.path).join(' and ');

/**
 * Check one design.
 * @param {Corpus} corpus @param {string} designName
 * @returns {{ diagnostics: Diagnostic[], readiness: Readiness[] }}
 */
export function checkDesign(corpus, designName) {
  /** @type {Diagnostic[]} */
  const out = [];
  const pages = corpus.designPages(designName);
  const diag = (/** @type {Severity} */ severity, /** @type {string} */ code, /** @type {string} */ file, /** @type {Item} */ it, /** @type {string} */ message) =>
    out.push({ severity, code, file, line: it.line, col: it.col, raw: it.token.raw, message });

  // A definition made twice.
  /** @type {Map<string, Def>} */
  const seen = new Map();
  for (const entry of pages) {
    for (const it of entry.page.items) {
      if (!it.token.def || !it.path) continue;
      const before = seen.get(it.path);
      if (before) diag('error', 'duplicate', entry.file, it, `${it.path} is defined twice — also at ${before.file}:${before.line}`);
      else seen.set(it.path, { path: it.path, file: entry.file, line: it.line, item: it, design: designName, kind: 'own' });
    }
  }

  for (const entry of pages) {
    for (const it of entry.page.items) {
      const t = it.token;
      const resolve = (/** @type {string} */ name) => corpus.resolve(name, it.context, designName);
      /** A reference that does not resolve; a forward reference is normal while a design is young. */
      const missing = (/** @type {string} */ name, /** @type {string} */ what, /** @type {import('./model.js').Resolution} */ r, info = false, code = 'unresolved') => {
        if (r.ok) return;
        if (r.reason === 'ambiguous') { diag('error', 'ambiguous', entry.file, it, `${what} matches ${both(r.candidates)} — write the path`); return; }
        if (name.includes('/')) {
          const design = name.slice(0, name.indexOf('/'));
          if (design !== 'words') { diag('info', 'forward', entry.file, it, corpus.designs.has(design) ? `${name} is not written yet in ${design}` : `${design} is a design not written yet`); return; }
        }
        if (KIND_FIRST.test(name)) { diag('info', 'forward', entry.file, it, `${name} is not written yet`); return; }
        diag(info ? 'info' : 'error', code, entry.file, it, `${what} resolves to nothing${whyUnresolved(corpus, designName, name, it.context)}`);
      };

      // The mistakes people make writing a token: each one named, with its fix (checks.md, "Never silent").
      const slip = entry.page.sema ? mistakes(t) : { found: [], consumed: new Set(), nameBroken: false };
      for (const m of slip.found) diag(m.severity, m.code, entry.file, it, m.message);

      if (t.def) {
        if (TYPES.has(t.name) && t.type !== 'pattern' && t.type !== 'word') diag(SEVERITY['name-is-type'], 'name-is-type', entry.file, it, `${t.name} is also a type — a name is never a type's name; call it what it holds, say ${t.name}-address or contact-${t.name}`);
        if (t.type && !TYPES.has(t.type)) diag('error', 'unknown-type', entry.file, it, `${t.type} is not a type`);
        if (t.open && !('default' in t.keys) && t.type !== 'pattern') diag('warning', 'open-no-default', entry.file, it, `${t.name} is open and has no default — nothing can be drawn for it`);
      } else if (!slip.nameBroken) {
        missing(t.name, `reference to ${t.name}`, resolve(t.name));
      }
      if (t.unknownWords) diag('warning', 'unknown-words', entry.file, it, `${t.name} has no words yet`);
      if (t.pattern && !corpus.pattern(t.pattern)) diag('error', 'unknown-pattern', entry.file, it, `pattern ${t.pattern} is not in the vocabulary`);

      // Marks that name something.
      for (const key of NAMING_KEYS) {
        for (const name of keyList(t, key)) {
          if (NOT_NAMES.has(`${key}:${name}`) || name.startsWith('@')) continue;
          if (key === 'of' && TYPES.has(name)) continue; // a bare type is legitimate as what a list is made of
          missing(name, `${key}: ${name}`, resolve(name));
        }
      }
      for (const key of ['by', 'mark']) for (const name of keyList(t, key)) missing(name, `${key}: ${name}`, resolve(name), true);

      // Conditions: every name they read must exist (the largest hole in an earlier implementation).
      for (const key of ['when', 'given', 'enabled']) {
        const expr = t.keys[key];
        if (!expr) continue;
        for (const a of conditionNames(expr)) {
          if (BUILTIN_VALUES.has(a.name)) continue;
          const r = resolve(a.name);
          if (r.ok) continue;
          diag('error', r.reason === 'ambiguous' ? 'ambiguous' : 'unresolved', entry.file, it,
            r.reason === 'ambiguous' ? `${key}: ${a.name} matches ${both(r.candidates)} — write the path` : `${key}: ${a.name} names nothing in the design`);
        }
      }

      // A value with a space that is not quoted splits into stray flags right after it.
      t.marks.forEach((m, k) => {
        if (m.kind !== 'key' || m.quoted || slip.consumed.has(k)) return;
        const stray = [];
        for (const n of t.marks.slice(k + 1)) { if (n.kind === 'flag' && !KNOWN_FLAGS.has(n.flag) && !n.flag.endsWith(':')) stray.push(n.flag); else break; }
        if (stray.length) diag(SEVERITY['unquoted-space'], 'unquoted-space', entry.file, it, `${m.key}:${m.value} ${stray.join(' ')} looks like one value with spaces — quote it: ${m.key}:"${[m.value, ...stray].join(' ')}"`);
      });
      // A flag nobody defined: after everything above has had its say about the word.
      if (entry.page.sema) {
        const strays = new Set(strayWords(t));
        t.marks.forEach((m, k) => {
          if (m.kind !== 'flag' || KNOWN_FLAGS.has(m.flag) || slip.consumed.has(k) || strays.has(k)) return;
          diag('warning', 'unknown-mark', entry.file, it, `${m.flag} is not a mark Sema knows; the marks are listed in spec/syntax.md`);
        });
      }

      if (it.standalone && t.type !== 'design') {
        diag('info', 'no-scope', entry.file, it, `${t.name} is alone on its line but not the first line under its heading, so it opens no scope: what follows still belongs to ${it.anchorOf ?? 'the page'}`);
      }

      // -> names where it leads: like any name, or a forward reference to what is not written yet.
      if (t.goto && !slip.nameBroken) missing(t.goto, `-> ${t.goto}`, resolve(t.goto), false, 'goto-unresolved');

      // The value-level rules of v0.8 (checks.md): only on pages that take part.
      if (entry.page.sema) {
        for (const f of valueChecks(corpus, designName, entry, it)) diag(f.severity, f.code, entry.file, it, f.message);
      }
    }
    if (entry.page.sema) for (const f of pageChecks(corpus, designName, entry)) diag(f.severity, f.code, entry.file, f.item, f.message);
  }
  out.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
  const readiness = pages.filter((p) => p.page.sema === 'screen' || p.page.sema === 'widget').map((p) => readinessOf(corpus, designName, p, out));
  return { diagnostics: out, readiness };
}

/**
 * The number this language exists to produce: how much of what a screen shows is decided.
 * Fields are counted through their definitions, once each; a reference settles an open field
 * only by saying so (`initial:`, `required`, `optional` on the reference itself).
 * @param {Corpus} corpus @param {string} designName @param {import('./model.js').PageEntry} entry @param {Diagnostic[]} diagnostics
 * @returns {Readiness}
 */
export function readinessOf(corpus, designName, entry, diagnostics) {
  /** @type {Map<string, { def: Def, settledHere: boolean }>} */
  const fields = new Map();
  let unknownWords = 0, frames = 0, assumed = 0;
  for (const it of entry.page.items) {
    const t = it.token;
    if (t.unknownWords) unknownWords++;
    // An action with no words at all is unknown words too (syntax.md, Copy).
    else if (t.def && t.type === 'action' && t.label === null) unknownWords++;
    assumed += t.marks.filter((m) => m.kind === 'source' && m.assumption).length;
    if (t.def && t.type === 'state') frames++;
    /** @type {Def | null} */
    let def = null;
    if (t.def) def = { path: /** @type {string} */ (it.path), file: entry.file, line: it.line, item: it, design: designName, kind: 'own' };
    else { const r = corpus.resolve(t.name, it.context, designName); if (r.ok) def = r.def; }
    if (!def || !DATA_TYPES.has(def.item.token.type ?? '')) continue;
    const key = `${def.design}:${def.path}`;
    const says = !t.def && ('initial' in t.keys || t.flags.has('required') || t.flags.has('optional'));
    const prev = fields.get(key);
    fields.set(key, { def, settledHere: !!prev?.settledHere || says });
  }
  /** @type {Readiness['fields']} */
  const list = [];
  for (const { def, settledHere } of fields.values()) {
    const d = def.item.token;
    list.push({ path: def.path, state: !d.open || settledHere ? 'settled' : 'default' in d.keys ? 'on-default' : 'blocking' });
  }
  const errors = diagnostics.filter((x) => x.file === entry.file && x.severity === 'error').length;
  const n = (/** @type {string} */ s) => list.filter((f) => f.state === s).length;
  const r = { file: entry.file, things: list.length, settled: n('settled'), onDefaults: n('on-default'), blocking: n('blocking'), unknownWords, frames, errors, ready: false, assumed, level: levelOf(corpus, designName, entry), fields: list };
  r.ready = errors === 0 && r.blocking === 0 && unknownWords === 0;
  return r;
}

/**
 * Qualify a token's conditions where it was written: `when:cuisine=thai` inside `restaurant` is `restaurant.cuisine=thai`.
 * @param {Corpus} corpus @param {string} designName @param {Item} it @param {string} key
 */
export function qualifiedCondition(corpus, designName, it, key) {
  const expr = it.token.keys[key];
  if (!expr) return null;
  return qualify(expr, (name) => { const r = corpus.resolve(name, it.context, designName); return r.ok ? r.def.path : null; });
}

/** Check every design in a corpus. @param {Corpus} corpus */
export function checkCorpus(corpus) {
  const results = [...corpus.designs.keys()].sort().map((name) => ({ name, folder: corpus.designs.get(name)?.folder ?? '', pages: corpus.designPages(name).length, ...checkDesign(corpus, name) }));
  // What is wrong with the corpus as a whole (a design name in two folders), beside the per-design findings.
  return Object.assign(results, { corpus: corpus.diagnostics });
}

/** The report the command line prints, in the shape of EXPECTED.md. @param {ReturnType<typeof checkCorpus>} results */
export function formatReport(results) {
  const lines = [];
  const mark = { error: '✖', warning: '!', info: '·' };
  for (const d of results) {
    const e = d.diagnostics.filter((x) => x.severity === 'error').length;
    const w = d.diagnostics.filter((x) => x.severity === 'warning').length;
    lines.push(`${d.folder || '.'}  —  design "${d.name}", ${d.pages} pages`, `  ${e} errors · ${w} warnings`);
    for (const x of d.diagnostics) if (x.severity !== 'info') lines.push(`  ${mark[x.severity]} ${x.file}:${x.line}  ${x.code}  ${x.message}`);
    for (const x of d.diagnostics) if (x.severity === 'info') lines.push(`  ${mark.info} ${x.file}:${x.line}  ${x.code}  ${x.message}`);
    for (const r of d.readiness) {
      lines.push(`  · ${r.file}  ${r.things} fields · ${r.settled} settled · ${r.onDefaults} on defaults · ${r.blocking} blocking · ${r.unknownWords} words unknown · ${r.frames} frames · ${r.ready ? 'ready' : 'not ready'} · ${r.assumed} assumed · L${r.level}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export { Corpus, KNOWN_FLAGS };

/**
 * The marks that are the stray words of an unquoted value: a key's value with a space splits, and
 * the words after it are flags. They are reported once, as `unquoted-space`, never as unknown marks.
 * @param {import('./token.js').Token} t @returns {number[]}
 */
function strayWords(t) {
  /** @type {number[]} */
  const out = [];
  t.marks.forEach((m, k) => {
    if (m.kind !== 'key' || m.quoted) return;
    for (let j = k + 1; j < t.marks.length; j++) {
      const n = t.marks[j];
      if (n.kind === 'flag' && !KNOWN_FLAGS.has(n.flag) && !n.flag.endsWith(':')) out.push(j); else break;
    }
  });
  return out;
}

/** kebab-case, as a name should be written. @param {string} s */
const kebab = (s) => s.toLowerCase().replace(/[\s_]+/g, '-');

/**
 * What goes wrong when someone writes a token without having read the syntax. Each is read from the
 * parsed token (the parse itself stays lenient, so the chip and the command agree on what was typed);
 * `consumed` are the marks a finding has explained, so they are not reported again as unknown marks;
 * `nameBroken` means the name itself is mistyped, so "resolves to nothing" would only repeat it.
 * @param {import('./token.js').Token} t
 * @returns {{ found: Array<{ severity: Severity, code: string, message: string }>, consumed: Set<number>, nameBroken: boolean }}
 */
export function mistakes(t) {
  /** @type {Array<{ severity: Severity, code: string, message: string }>} */
  const found = [];
  const consumed = new Set();
  let nameBroken = false;
  const rest = (/** @type {number} */ from) => t.inner.trim().split(/\s+/).slice(from).join(' ');

  // [[Restaurant name: text]] — the name is the first word, and the second ends in a colon.
  const first = t.marks[0];
  if (first?.kind === 'flag' && /^[^\s:]+:$/.test(first.flag)) {
    const name = kebab(`${t.name}-${first.flag.slice(0, -1)}`);
    const after = rest(2);
    found.push({ severity: 'error', code: 'name-has-space', message: `a name cannot contain a space — write ${name}:${after ? ' ' + after : ''}` });
    consumed.add(0);
    if (t.marks[1]?.kind === 'flag' && /^[a-z][\w-]*$/i.test(t.marks[1].flag)) consumed.add(1);
    nameBroken = true;
  } else if (!t.def && t.name.includes(':') && !t.name.includes('/')) {
    // [[name:text]] — no space after the colon, so the whole thing reads as one name.
    const at = t.name.indexOf(':');
    found.push({ severity: 'error', code: 'no-space-after-colon', message: `put a space after the colon: ${t.name.slice(0, at)}: ${t.name.slice(at + 1)}${rest(1) ? ' ' + rest(1) : ''}` });
    nameBroken = true;
  }

  // [[Email: Email]] — a definition that names no type; a type in capitals is the usual reason.
  if (t.def && t.type === null) {
    const k = t.marks.findIndex((m) => m.kind === 'flag');
    const word = k === 0 && t.marks[0].kind === 'flag' ? t.marks[0].flag : null;
    if (word && TYPES.has(word.toLowerCase())) {
      found.push({ severity: 'error', code: 'no-type', message: `${t.name} is a definition but names no type — types are lower case: ${kebab(t.name)}: ${word.toLowerCase()}` });
      consumed.add(0);
    } else {
      found.push({ severity: 'error', code: 'no-type', message: `${t.name} is a definition but names no type — the type comes straight after the colon: ${t.name}: text` });
    }
  }

  // |a=A| b=B| — a space after a bar ends the list, and what follows reads as stray flags.
  t.marks.forEach((m, k) => {
    if (m.kind !== 'values') return;
    const cut = [];
    for (let j = k + 1; j < t.marks.length; j++) {
      const n = t.marks[j];
      if (n.kind === 'flag' && (n.flag.includes('=') || n.flag.endsWith('|'))) { cut.push(n.flag.replace(/\|$/, '')); consumed.add(j); } else break;
    }
    if (cut.length) found.push({ severity: 'error', code: 'values-cut-short', message: `the value list ended at the space before ${cut[0]} — values are written without spaces around the bars` });
  });

  // Two labels: only the first is read.
  const labels = t.marks.filter((m) => m.kind === 'label');
  for (const extra of labels.slice(1)) {
    if (extra.kind !== 'label') continue;
    found.push({ severity: 'warning', code: 'second-label', message: `"${extra.value}" is a second label and is ignored; one label per token` });
  }
  return { found, consumed, nameBroken };
}

/**
 * Why a name resolved to nothing, when there is a likely reason: the same name in another case or
 * with spaces, or a path through a token that opened no scope. Empty when there is none.
 * @param {Corpus} corpus @param {string} design @param {string} name @param {string[]} context
 */
function whyUnresolved(corpus, design, name, context) {
  // A path whose parent is a token alone on its line: its fields belong to the anchor above it.
  if (name.includes('.')) {
    const parent = name.slice(0, name.lastIndexOf('.'));
    const r = corpus.resolve(parent, context, design);
    // The parent itself, or what it is like: or of: (followed a few steps, cycle-safe).
    /** @param {Def} d @param {number} depth @returns {Def | null} */
    const noScope = (d, depth) => {
      if (d.item.standalone) return d;
      if (depth > 4) return null;
      for (const key of ['like', 'of']) {
        for (const target of keyList(d.item.token, key)) {
          const t = corpus.resolve(target, d.item.context, d.design);
          const hit = t.ok && t.def !== d ? noScope(t.def, depth + 1) : null;
          if (hit) return hit;
        }
      }
      return null;
    };
    const lone = r.ok ? noScope(r.def, 0) : null;
    if (lone) {
      const owner = lone.item.anchorOf;
      return ` — ${lone.item.token.name} opens no scope (${lone.file}, line ${lone.line}), so its fields belong to ${owner ?? 'the page'}`;
    }
  }
  const want = kebab(name);
  if (want !== name) {
    const r = corpus.resolve(want, context, design);
    if (r.ok) return ` — did you mean ${r.def.path} (${r.def.file}, line ${r.def.line})?`;
  }
  return '';
}

// ------------------------------------------------------------ the value-level rules (v0.8)

/** @typedef {{ severity: Severity, code: string, message: string }} Finding */

const DURATION = /^\d+(s|m|h|d)$/;
/** Types that hold data and are never drawn as a thing of their own. */
const DATA_SHAPES = new Set(['group', 'collection', 'series', 'config', 'context', 'states']);
const COMPARE = new Set(['=', '!=', '<', '>', '<=', '>=']);
/** Types whose default may be a quoted literal. */
const TEXT_TYPES = new Set(['text', 'longtext', 'email', 'phone', 'address', 'word']);
/** Marks that make a number explicit, so a number in the note is not the only place it is written. */
const NUMERIC_KEYS = ['per', 'length', 'range', 'unit', 'repeat'];
/** A bare number with a unit word, in a note. Narrow on purpose (D-016): a miss is better than noise. */
const NUMBER_IN_PROSE = /(^|[^\w.#-])(\d+(?:[.,]\d+)?)\s*(%|per page|rows?\b|days?\b|items?\b|minutes?\b|hours?\b|seconds?\b|weeks?\b|km\b|kilomet(?:re|er)s?\b|characters?\b|dishes\b)/i;

/** The definition a token is or points at, as `design` sees it. @param {Corpus} corpus @param {string} design @param {string} file @param {Item} it @returns {Def | null} */
function defOf(corpus, design, file, it) {
  if (it.token.def && it.path) return { path: it.path, file, line: it.line, item: it, design, kind: 'own' };
  const r = corpus.resolve(it.token.name, it.context, design);
  return r.ok ? r.def : null;
}

/**
 * The values a field can hold: its own `|…|`, or those of what it is `of:` (a `states` vocabulary),
 * followed a few steps. Null when it is not a closed vocabulary.
 * @param {Corpus} corpus @param {Def} def @param {number} [depth] @returns {{ values: string[], source: Def } | null}
 */
function valuesOf(corpus, def, depth = 0) {
  const t = def.item.token;
  const own = t.marks.find((m) => m.kind === 'values');
  if (own && own.kind === 'values') return { values: own.values.map((v) => v.value), source: def };
  if (depth > 4) return null;
  for (const target of keyList(t, 'of')) {
    if (target.startsWith('@') || TYPES.has(target)) continue;
    let r = corpus.resolve(target, def.item.context, def.design);
    // Inside a named vocabulary (roles, words), its own names are reached as <vocabulary>/<name>.
    if (!r.ok && def.kind === 'vocabulary' && def.design && !target.includes('/')) r = corpus.resolve(`${def.design}/${target}`, [], null);
    if (r.ok && r.def !== def) return valuesOf(corpus, r.def, depth + 1);
  }
  return null;
}

/** A type the pattern can be checked against: the field's own, or — for a group — what it is `like:`. @param {Corpus} corpus @param {Def} def */
function typesOf(corpus, def) {
  const t = def.item.token;
  const out = new Set(t.type ? [t.type] : []);
  // A list, collection or series fits through what it is made of.
  if (t.type === 'list' || t.type === 'collection' || t.type === 'series' || t.type === 'enum') {
    for (const target of keyList(t, 'of')) {
      if (TYPES.has(target)) { out.add(target); continue; }
      const r = corpus.resolve(target, def.item.context, def.design);
      if (r.ok && r.def.item.token.type) out.add(r.def.item.token.type);
    }
  }
  return out;
}

/** The roles the corpus defines: the values of `user.role` in the roles vocabulary. Null when there is none. @param {Corpus} corpus */
function rolesOf(corpus) {
  // The roles page names itself ([[roles: design]]), so its paths start with that name.
  const role = corpus.defs.find((d) => d.kind === 'vocabulary' && (d.path === 'user.role' || d.path.endsWith('.user.role')));
  return role ? valuesOf(corpus, role)?.values ?? null : null;
}

/**
 * The checks on one token's values.
 * @param {Corpus} corpus @param {string} design @param {import('./model.js').PageEntry} entry @param {Item} it
 * @returns {Finding[]}
 */
export function valueChecks(corpus, design, entry, it) {
  /** @type {Finding[]} */
  const out = [];
  const t = it.token;
  const add = (/** @type {Severity} */ severity, /** @type {string} */ code, /** @type {string} */ message) => out.push({ severity, code, message });
  const resolve = (/** @type {string} */ name) => corpus.resolve(name, it.context, design);
  const def = defOf(corpus, design, entry.file, it);
  const type = def?.item.token.type ?? null;

  // Conditions: an enum compared to a value it does not have; a duration without its unit.
  /** @param {string} key @param {string} expr */
  const condition = (key, expr) => {
    for (const a of parseCondition(expr).flat()) {
      if (!a.name || a.name.startsWith('@') || SCREEN_FACTS.has(a.name)) continue;
      if (a.op && COMPARE.has(a.op) && a.name.endsWith('.age') && a.value !== null && !DURATION.test(a.value)) {
        add('error', 'duration-unit', `${key}: ${a.name}${a.op}${a.value} needs a unit — write ${/^\d+$/.test(a.value) ? a.value : '30'}s (or m, h, d)`);
        continue;
      }
      if ((a.op !== '=' && a.op !== '!=') || a.value === null || a.value === '') continue;
      const found = key === 'where' ? null : resolve(a.name);
      const r = key === 'where' ? whereField(a.name) : found?.ok ? found.def : null;
      if (!r) continue;
      const vocab = valuesOf(corpus, r);
      if (!vocab || vocab.values.includes(a.value) || BUILTIN_VALUES.has(a.value)) continue;
      // A value that is itself a name (another field) is a comparison of two fields, not a value.
      if (resolve(a.value).ok) continue;
      add('error', 'enum-value', `${key}: ${a.name}${a.op}${a.value} — ${r.path} has no value ${a.value}; its values are ${vocab.values.join(', ')}`);
    }
  };
  /** A `where:` name is a field of what the collection is made of. @param {string} name @returns {Def | null} */
  const whereField = (name) => {
    for (const target of keyList(t, 'of')) {
      const r = resolve(target);
      if (!r.ok) continue;
      const c = corpus.child(r.def, name);
      if (c) return c.def;
    }
    return null;
  };
  for (const key of ['when', 'given', 'enabled', 'where']) if (t.keys[key]) condition(key, t.keys[key]);
  for (const m of t.marks) if (m.kind === 'values') for (const v of m.values) if (v.when) condition('when', v.when);
  // refresh: is a duration on each side of ..
  if (t.keys.refresh) {
    const bad = t.keys.refresh.split('..').filter((x) => !DURATION.test(x));
    if (bad.length) add('error', 'duration-unit', `refresh:${t.keys.refresh} needs a unit on each side — write it like refresh:2s..3s`);
  }

  // default: must name something that exists.
  if ('default' in t.keys && def) {
    const v = t.keys.default;
    const quoted = !!t.marks.find((m) => m.kind === 'key' && m.key === 'default' && m.quoted);
    const values = valuesOf(corpus, def)?.values ?? [];
    const ok = values.includes(v) || !!corpus.pattern(v) || v === 'required' || v === 'optional'
      || (type === 'state' && (v === 'draw' || v === 'skip'))
      || (quoted && TEXT_TYPES.has(type ?? ''));
    if (!ok) {
      const could = [values.length ? `one of its values (${values.join(', ')})` : null, 'required or optional', 'a pattern',
        type === 'state' ? 'draw or skip' : null, TEXT_TYPES.has(type ?? '') ? 'a quoted text' : null].filter(Boolean);
      add('error', 'default-missing', `default:${quoted ? `"${v}"` : v} names nothing defined — a default here is ${could.join(', ')}`);
    }
  }

  // A pattern must fit the field's type.
  if (t.pattern && def) {
    const p = corpus.pattern(t.pattern);
    const fits = p ? keyList(p.item.token, 'fits') : [];
    const types = typesOf(corpus, def);
    if (p && fits.length && types.size && ![...types].some((x) => fits.includes(x))) {
      add('warning', 'pattern-fits', `${t.pattern} fits ${fits.join(', ')}, and ${def.path} is ${[...types].join(' of ')}`);
    }
  }

  // for: names roles the roles vocabulary has.
  if (t.keys.for) {
    const roles = rolesOf(corpus);
    if (roles) {
      for (const name of t.keys.for.split(',').map((x) => x.replace(/^!/, '').trim()).filter(Boolean)) {
        if (!roles.includes(name)) add('error', 'role-missing', `for:${name} — there is no role ${name}; the roles are ${roles.join(', ')}`);
      }
    }
  }

  // except: is part of the choice's own vocabulary, or a field of the same vocabulary.
  if (t.keys.except && def) {
    const mine = valuesOf(corpus, def);
    if (mine) {
      for (const name of keyList(t, 'except')) {
        if (mine.values.includes(name)) continue;
        const r = resolve(name);
        const theirs = r.ok ? valuesOf(corpus, r.def) : null;
        if (theirs && theirs.source === mine.source) continue;
        add('error', 'except-outside', `except:${name} is not in ${def.path}'s vocabulary (${mine.values.join(', ')})${r.ok ? `, and ${r.def.path} holds other values` : ''}`);
      }
    }
  }

  // .selected needs select: on what it reads.
  /** @param {string} name */
  const selected = (name) => {
    const i = name.indexOf('.selected');
    if (i <= 0) return;
    const r = resolve(name.slice(0, i));
    if (r.ok && !('select' in r.def.item.token.keys)) add('error', 'selected-without-select', `${name.slice(0, i)} has no select:, so it has no .selected — add select:one to ${r.def.path} (${r.def.file}, line ${r.def.line})`);
  };
  if (!t.def) selected(t.name);
  for (const key of ['of', 'from']) for (const n of keyList(t, key)) selected(n);
  for (const key of ['when', 'given', 'enabled']) if (t.keys[key]) for (const a of parseCondition(t.keys[key]).flat()) { selected(a.name); if (a.value) selected(a.value); }

  // Words that carry values: every name in braces resolves.
  const texts = [t.label, ...['hint', 'error', 'add', 'placeholder', 'empty', 'is'].map((k) => t.keys[k])].filter((x) => typeof x === 'string');
  for (const text of texts) {
    for (const m of /** @type {string} */ (text).matchAll(/\{([^}]+)\}/g)) {
      const name = m[1].trim();
      const r = resolve(name);
      if (!r.ok) add('error', 'brace-unresolved', `{${name}} names nothing in the design — every name in braces resolves like a reference`);
    }
  }

  // An action shown on a screen needs words, even when it is drawn as an icon.
  if (t.def && t.type === 'action' && t.label === null && (entry.page.sema === 'screen' || entry.page.sema === 'widget')) {
    add('warning', 'action-no-words', `${t.name} is an action with no words — give it a label, "?" if nobody has written them, or {words/…}`);
  }

  // nav.pages pages a list: how many per page is part of the design.
  if (t.pattern?.startsWith('nav.pages') && !('per' in t.keys) && !(def && 'per' in def.item.token.keys)) {
    add('warning', 'nav-no-per', `${t.name} is paged with ${t.pattern} but says nothing of how many per page — add per:n`);
  }

  // A number in the note that no mark carries.
  if (it.note && !NUMERIC_KEYS.some((k) => k in t.keys)) {
    const m = NUMBER_IN_PROSE.exec(it.note);
    if (m) add('warning', 'number-in-prose', `"${m[2]} ${m[3]}" is written only in the note — say it with a mark (per:, length:, range:, unit: or repeat:) so it is part of the design`);
  }

  // The writer's own assumptions: settled for drawing, counted apart from the sources.
  for (const m of t.marks) if (m.kind === 'source' && m.assumption) add('info', 'assumed', `#${m.ref} is an assumption of the writer's — drawn as settled, counted apart from what the sources say`);

  // A reference's when: narrows its definition's; it cannot contradict it.
  if (!t.def && t.keys.when && def?.item.token.keys.when) {
    const mine = qualifiedCondition(corpus, design, it, 'when');
    const theirs = qualifiedCondition(corpus, def.design ?? design, def.item, 'when');
    const clash = mine && theirs ? contradiction(mine, theirs) : null;
    if (clash) add('error', 'when-contradicts', `when:${t.keys.when} contradicts ${def.path}'s own when:${def.item.token.keys.when} (${clash}) — it can never be shown`);
  }
  return out;
}

/**
 * Two conditions that cannot both hold, read literally: only pure ANDs, only the same name.
 * @param {string} a @param {string} b @returns {string | null} the clash, in words
 */
function contradiction(a, b) {
  const ca = parseCondition(a), cb = parseCondition(b);
  if (ca.length !== 1 || cb.length !== 1) return null;
  for (const x of ca[0]) {
    for (const y of cb[0]) {
      if (x.name !== y.name) continue;
      if (x.op === null && y.op === null && x.not !== y.not) return `${x.not ? '!' : ''}${x.name} against ${y.not ? '!' : ''}${y.name}`;
      if (x.not || y.not || x.value === null || y.value === null) continue;
      if (x.op === '=' && y.op === '=' && x.value !== y.value) return `${x.name}=${x.value} against ${y.name}=${y.value}`;
      if (((x.op === '=' && y.op === '!=') || (x.op === '!=' && y.op === '=')) && x.value === y.value) return `${x.name}${x.op}${x.value} against ${y.name}${y.op}${y.value}`;
    }
  }
  return null;
}

/**
 * The checks that need the whole page: a step that redefines a screen's thing, a reference that
 * lands in another group than its neighbours, a definition outside what is drawn, the level.
 * @param {Corpus} corpus @param {string} design @param {import('./model.js').PageEntry} entry
 * @returns {Array<Finding & { item: Item }>}
 */
export function pageChecks(corpus, design, entry) {
  /** @type {Array<Finding & { item: Item }>} */
  const out = [];
  const items = entry.page.items;

  // A step on a flow page that defines what a screen already defines.
  if (entry.page.sema === 'flow') {
    for (const it of items) {
      if (!it.token.def || it.token.type !== 'step') continue;
      const twin = corpus.defs.find((d) => d.design === design && d.file !== entry.file && ['screen', 'action', 'widget'].includes(d.item.token.type ?? '')
        && d.path.slice(d.path.lastIndexOf('.') + 1) === it.token.name);
      if (twin) out.push({ item: it, severity: 'warning', code: 'step-redefines', message: `${it.token.name} is defined here as a step and as a${twin.item.token.type === 'action' ? 'n' : ''} ${twin.item.token.type} at ${twin.file}:${twin.line} — refer to it instead: [[${it.token.name}${it.token.goto ? ' -> ' + it.token.goto : ''}]]` });
    }
  }

  // Siblings in one list that resolve under one group, except one.
  /** @type {Map<string, Array<{ it: Item, group: string, path: string }>>} */
  const lists = new Map();
  for (const it of items) {
    if (it.role !== 'item' || it.token.def || it.token.name.includes('.') || it.token.name.includes('/')) continue;
    const r = corpus.resolve(it.token.name, it.context, design);
    if (!r.ok || !r.def.path.includes('.')) continue;
    const key = it.context.join('.');
    const list = lists.get(key) ?? [];
    list.push({ it, group: r.def.path.slice(0, r.def.path.lastIndexOf('.')), path: r.def.path });
    lists.set(key, list);
  }
  for (const list of lists.values()) {
    if (list.length < 3) continue;
    const count = new Map();
    for (const x of list) count.set(x.group, (count.get(x.group) ?? 0) + 1);
    const [main, n] = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
    if (n !== list.length - 1) continue;
    const odd = list.find((x) => x.group !== main);
    if (odd) out.push({ item: odd.it, severity: 'warning', code: 'wrong-group', message: `${odd.it.token.name} resolved to ${odd.path}; the fields around it are ${main}.* — write the path if that is what is meant` });
  }

  // On a screen or widget page, a definition outside the frame's anchor is never drawn.
  if (entry.page.sema === 'screen' || entry.page.sema === 'widget') {
    const frame = items.find((it) => it.token.def && (it.token.type === 'screen' || it.token.type === 'widget' || (entry.page.sema === 'widget' && it.role === 'anchor')));
    const frames = new Set(items.filter((it) => it.token.def && it.role === 'anchor' && (it.token.type === 'screen' || it.token.type === 'widget' || it === frame)).map((it) => it.token.name));
    for (const it of items) {
      if (!it.token.def || frames.has(it.token.name) || it.token.type === 'design') continue;
      if (frames.has(it.context[0] ?? '')) continue;
      if (/\bdata\b/i.test(it.heading ?? '')) continue;
      // Data shapes are never drawn wherever they sit, and nor is what they hold.
      if (DATA_SHAPES.has(it.token.type ?? '')) continue;
      const top = items.find((x) => x.token.def && x.path === it.context[0]);
      if (top && DATA_SHAPES.has(top.token.type ?? '')) continue;
      out.push({ item: it, severity: 'info', code: 'outside-anchor', message: `${it.token.name} is outside ${frame?.token.name ?? 'the frame'}, so it will not be drawn — put it under the anchor, or under a ## Data heading` });
    }
  }

  // level: in the frontmatter claims no more than the page reaches.
  const claimed = Number(entry.page.frontmatter.level);
  if (entry.page.frontmatter.level !== undefined && Number.isFinite(claimed)) {
    const reached = levelOf(corpus, design, entry);
    const first = items[0];
    if (claimed > reached && first) out.push({ item: first, severity: 'warning', code: 'level', message: `level: ${claimed} in the frontmatter, but the page reaches L${reached} — ${LEVEL_NEXT[reached] ?? ''}` });
  }
  return out;
}

const LEVEL_NEXT = [
  'L1 needs steps and the transitions between them',
  'L2 needs fields with types and required-ness',
  'L3 needs a pattern on every field and action it shows',
  'L4 needs regions or sections, and states with given:',
];

/**
 * The highest level a page reaches throughout (syntax.md, Levels).
 * @param {Corpus} corpus @param {string} design @param {import('./model.js').PageEntry} entry
 */
export function levelOf(corpus, design, entry) {
  const items = entry.page.items;
  const shown = entry.page.sema === 'screen' || entry.page.sema === 'widget';
  let level = items.length ? 0 : 0;
  if (items.some((it) => it.token.goto || it.token.type === 'step' || it.token.type === 'flow')) level = 1;
  const fields = items.filter((it) => it.token.def && DATA_TYPES.has(it.token.type ?? ''));
  if (fields.some((it) => it.token.flags.has('required') || it.token.flags.has('optional') || it.token.open) || (shown && items.some((it) => !it.token.def))) level = Math.max(level, 2);
  if (shown) {
    const things = items.filter((it) => {
      const def = defOf(corpus, design, entry.file, it);
      const type = def?.item.token.type ?? '';
      return it.role !== 'anchor' && (DATA_TYPES.has(type) || type === 'action') && !(def?.item.token.flags.has('derived'));
    });
    const patterned = things.length > 0 && things.every((it) => it.token.pattern || defOf(corpus, design, entry.file, it)?.item.token.pattern);
    if (patterned) level = 3;
    if (patterned && items.some((it) => it.token.def && (it.token.type === 'region' || it.token.type === 'section')) && items.some((it) => it.token.type === 'state' && it.token.keys.given)) level = 4;
  }
  return level;
}
