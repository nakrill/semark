// @ts-check
/**
 * Sema, layer 5: what gets drawn. The views are plain data built from the
 * parsed corpus; the editor's pane draws them, and nothing here knows about a
 * screen or a framework.
 *
 * The page's kind is decided first, so a flow is never pushed through the
 * screen renderer:
 *
 *   screen, widget              frames: a sheet per screen, a frame per state
 *   flow                        a graph of steps and transitions
 *   design                      a map: flows, the screens they reach, orphans, readiness
 *   everything else             a list of definitions
 *
 * Conditions are three-valued. Where a condition names something the frame
 * does not track, the element is shown and marked with its condition, never
 * hidden on a guess.
 */
import { parseCondition } from './condition.js';
import { keyList } from './token.js';
import { DATA_TYPES, ACCESSORS, SCREEN_FACTS } from './model.js';
import { checkDesign, mistakes } from './check.js';

/** What is wrong with a token, in the checker's words when its name is mistyped (it does not "resolve to nothing": it is no name). @param {import('./token.js').Token} t @param {import('./model.js').Resolution | null | undefined} r @param {boolean} [paths] */
const problemOf = (t, r, paths = false) => {
  const slip = mistakes(t);
  if (slip.nameBroken) return slip.found[0]?.message ?? null;
  if (!r || r.ok) return null;
  return r.reason === 'ambiguous' ? (paths ? `matches ${r.candidates.map((c) => c.path).join(' and ')}` : 'matches more than one thing') : 'resolves to nothing';
};

/**
 * @typedef {import('./model.js').Corpus} Corpus
 * @typedef {import('./model.js').Def} Def
 * @typedef {import('./page.js').Item} Item
 * @typedef {import('./token.js').Token} Token
 * @typedef {{ item: Item, file: string, design: string | null, children: TreeNode[] }} TreeNode
 * @typedef {true | false | 'unknown'} Tri
 * @typedef {{ text: string, state: 'known' | 'partial' | 'unknown' | 'name' | 'none' }} Words
 * @typedef {{
 *   line: number, file: string, raw: string, name: string, shape: string, variant: string | null,
 *   pattern: string | null, type: string | null, words: Words, hint: string | null, placeholder: string | null,
 *   error: string | null, errorInvented: boolean, unit: string | null, values: Array<{ value: string, words: Words, chosen: boolean, when: string | null }>,
 *   value: string | null, required: boolean, open: boolean, toBe: boolean, derived: string | null,
 *   shown: 'yes' | 'unknown', when: string | null, enabled: 'yes' | 'no' | 'unknown', enabledWhen: string | null,
 *   goto: string | null, forRoles: string | null, note: string, problem: string | null, children: Element[], hidden: Array<{ name: string, line: number, file: string, when: string }>,
 *   empty: string | null,
 * }} Element
 *   `empty`: the words `empty:` gives, set when this frame says the value is missing.
 * @typedef {{ name: string, line: number, given: string | null, words: Words, skipped: boolean, open: boolean, from: string | null,
 *   root: Element | null, hidden: Array<{ name: string, line: number, file: string, when: string }>, adds: Element[], facts: string[], role: string | null }} Frame
 *   `role`: the role the frame is drawn for, when its given: says `@user.role=…`.
 * @typedef {{ name: string, line: number, words: Words, present: string | null, over: string | null, forRoles: string | null, frames: Frame[] }} Sheet
 * @typedef {{ kind: 'frames', page: string, sheets: Sheet[] }
 *   | { kind: 'flow', page: string, flows: FlowGraph[] }
 *   | { kind: 'map', page: string, map: DesignMap }
 *   | { kind: 'list', page: string, sema: string, sections: ListSection[] }} View
 * @typedef {{ id: string, name: string, line: number, file: string | null, kind: string, state: 'ok' | 'forward' | 'elsewhere' | 'missing' | 'ambiguous',
 *   design: string | null, ready: boolean | null, note: string }} FlowNode
 * @typedef {{ from: string, to: string, when: string | null, line: number, note: string }} FlowEdge
 * @typedef {{ name: string, line: number, file: string, words: Words, note: string, nodes: FlowNode[], edges: FlowEdge[] }} FlowGraph
 * @typedef {{ name: string, file: string, line: number, kind: string, ready: boolean | null, reachedBy: string[],
 *   counts: { things: number, settled: number, onDefaults: number, blocking: number, unknownWords: number, frames: number, assumed: number } | null }} MapScreen
 * @typedef {{ design: string, note: string, flows: FlowGraph[], screens: MapScreen[], orphans: MapScreen[], elsewhere: Array<{ name: string, line: number, state: string }>,
 *   totals: { pages: number, screens: number, ready: number, errors: number, warnings: number } }} DesignMap
 * @typedef {{ heading: string | null, rows: Array<{ line: number, depth: number, name: string, path: string | null, def: boolean, type: string | null,
 *   words: Words, values: Array<{ value: string, words: Words, when: string | null }>, marks: string[], note: string, open: boolean, problem: string | null }> }} ListSection
 */

// ---------------------------------------------------------------- the binding

/**
 * The `wireframe` binding: pattern → shape, matched by prefix, longest first.
 * It is a declared table, not rules hidden in a renderer, so a pattern the
 * vocabulary gains tomorrow still lands somewhere sensible. The shape list is
 * small on purpose; add a row before adding a shape.
 * @type {Array<[prefix: string, shape: string, variant?: string]>}
 */
export const WIREFRAME_BINDING = [
  ['input.text.long', 'area'], ['input.note', 'area'], ['input.search', 'search'], ['input.date', 'field', 'date'],
  ['input.number', 'field', 'number'], ['input.duration', 'field', 'number'], ['input', 'field'],
  ['choice.binary', 'toggle'], ['choice.confirm', 'check'], ['choice.days', 'chips', 'toggle'], ['choice', 'choice'],
  ['collection.tags', 'chips', 'edit'], ['chips', 'chips'],
  ['group', 'group'], ['approval.row', 'group'],
  ['nav', 'nav'],
  ['summary.key-value', 'keyvalue'], ['summary.tile', 'tile'], ['summary', 'keyvalue'],
  ['feedback', 'feedback'],
  ['action.primary', 'button', 'primary'], ['action.secondary', 'button', 'secondary'], ['action.dismiss', 'button', 'quiet'],
  ['action', 'button', 'quiet'],
  ['table', 'table'], ['series.days', 'strip'], ['calendar', 'strip'],
  ['filter', 'filter'], ['indicator', 'indicator'], ['status.badge', 'badge'],
  ['notice.warning', 'notice', 'warning'], ['notice', 'notice'], ['help', 'help'], ['row.details', 'help'], ['chart.point-details', 'help'],
  ['chart', 'chart'], ['text', 'text'], ['list', 'list'], ['media', 'media'],
];
const BINDING = [...WIREFRAME_BINDING].sort((a, b) => b[0].length - a[0].length);

const CONTAINERS = new Set(['screen', 'region', 'section', 'group', 'column', 'summary', 'nav', 'help', 'state', 'fallback']);
const DATA_SHAPES = new Set(['group', 'collection', 'series', 'config', 'context', 'states']);
/** Types a user enters on a screen; not given in a state, they hold what they start with. */
const ENTERED = new Set([...DATA_TYPES].filter((t) => t !== 'collection' && t !== 'series'));

/** @param {string | null} pattern @param {string | null} type @returns {[string, string | null]} */
export function shapeFor(pattern, type) {
  if (pattern) {
    const hit = BINDING.find(([p]) => pattern === p || pattern.startsWith(p + '.'));
    if (hit) return [hit[1], hit[2] ?? null];
    // No row for this pattern: a plain box with the pattern's name, so a read-only pattern is never drawn as a control.
    return ['unbound', pattern];
  }
  if (type && CONTAINERS.has(type)) return ['container', type];
  if (type === 'action') return ['button', 'quiet'];
  if (type === 'feedback') return ['feedback', null];
  return ['value', null];
}

// ---------------------------------------------------------------- page trees

/** @param {string} name */
const segs = (name) => name.split('.').filter(Boolean);
/** What an item opens: the context its children are written in. @param {Item} it */
const opens = (it) => [...it.context, ...segs(it.token.name)].join('\u0000');

/**
 * The page as a tree: an item's parent is the nearest item before it that opens
 * exactly the item's context. Mentions in a sentence are not part of the tree.
 * @param {Corpus} corpus @param {string} file @returns {TreeNode[]}
 */
export function pageTree(corpus, file) {
  let byFile = trees.get(corpus);
  if (!byFile) trees.set(corpus, (byFile = new Map()));
  const hit = byFile.get(file);
  if (hit) return hit;
  const entry = corpus.pages.get(file);
  if (!entry) return [];
  /** @type {TreeNode[]} */
  const roots = [];
  /** @type {Map<string, TreeNode>} */
  const open = new Map();
  for (const item of entry.page.items) {
    if (item.role === 'inline' && !item.standalone) continue;
    /** @type {TreeNode} */
    const node = { item, file, design: entry.design, children: [] };
    const parent = open.get(item.context.join('\u0000'));
    (parent ? parent.children : roots).push(node);
    open.set(opens(item), node);
  }
  byFile.set(file, roots);
  return roots;
}
/** @type {WeakMap<Corpus, Map<string, TreeNode[]>>} */
const trees = new WeakMap();

/** The node for a definition, on its own page. @param {Corpus} corpus @param {Def} def */
function nodeOf(corpus, def) {
  /** @param {TreeNode[]} list @returns {TreeNode | null} */
  const find = (list) => {
    for (const n of list) {
      if (n.item === def.item) return n;
      const deeper = find(n.children);
      if (deeper) return deeper;
    }
    return null;
  };
  return find(pageTree(corpus, def.file));
}

// ---------------------------------------------------------------- words

/** @param {string} name */
const asWords = (name) => name.replace(/-/g, ' ');

/**
 * The words a token shows, with `{words/x}` resolved; any other `{name}` stays as written.
 * @param {Corpus} corpus @param {string | null} design @param {string} text
 */
function fillWords(corpus, design, text) {
  return text.replace(/\{(words\/[\w-]+)\}/g, (all, key) => {
    const r = corpus.resolve(key, [], design);
    return r.ok && r.def.item.token.label && !r.def.item.token.unknownWords ? r.def.item.token.label : all;
  });
}

/**
 * @param {Corpus} corpus @param {string | null} design @param {Token} t @param {Token | null} d
 * @param {'name' | 'none'} fallback what a token with no words of its own shows
 * @returns {Words}
 */
function wordsOf(corpus, design, t, d, fallback) {
  const src = t.label !== null ? t : d && d.label !== null ? d : null;
  if (src) {
    if (src.unknownWords) return { text: '?', state: 'unknown' };
    return { text: fillWords(corpus, design, /** @type {string} */ (src.label)), state: src.partialWords ? 'partial' : 'known' };
  }
  return fallback === 'name' ? { text: asWords(t.name.split('.').pop() ?? t.name), state: 'name' } : { text: '', state: 'none' };
}

/** @param {Token} t */
const valuesMark = (t) => /** @type {{ kind: 'values', values: import('./token.js').EnumValue[] } | undefined} */ (t.marks.find((m) => m.kind === 'values'));

// ---------------------------------------------------------------- conditions

/**
 * What a frame knows: its state's `given:`, qualified where the state is written.
 * Keys are `design:path` for fields, the name itself for `@…` and screen facts.
 * @typedef {Map<string, Array<{ not: boolean, op: string | null, value: string | null }>>} Facts
 */

/**
 * The key a name in a condition stands for, resolved where the condition was written. An accessor
 * (`dishes.count`) keys on what it reads, with the accessor kept.
 * @param {Corpus} corpus @param {string | null} design @param {string[]} context @param {string} name
 */
function factKey(corpus, design, context, name) {
  if (name.startsWith('@') || SCREEN_FACTS.has(name)) return { key: name, def: null };
  const parts = name.split('.');
  const at = parts.findIndex((p, i) => i > 0 && ACCESSORS.has(p));
  const base = at > 0 ? parts.slice(0, at).join('.') : name;
  const tail = at > 0 ? '.' + parts.slice(at).join('.') : '';
  const r = corpus.resolve(base, context, design);
  if (!r.ok) return { key: `?${name}`, def: null };
  return { key: `${r.def.design}:${r.def.path}${tail}`, def: tail ? null : r.def };
}

/**
 * A fact or an atom with its `!` folded in: `!x` is x off, `!x=a` is `x!=a`. Null when `!` cannot be folded (`!x<3`).
 * @param {{ not: boolean, op: string | null, value: string | null }} a
 * @returns {{ op: string | null, value: string | null, truthy: boolean } | null}
 */
function fold(a) {
  if (a.op === null) return { op: null, value: null, truthy: !a.not };
  if (!a.not) return { op: a.op, value: a.value, truthy: true };
  if (a.op === '=') return { op: '!=', value: a.value, truthy: true };
  if (a.op === '!=') return { op: '=', value: a.value, truthy: true };
  return null;
}

/** The role a frame is drawn for: its given: says `@user.role=…`. @param {Facts} facts @returns {string | null} */
function roleOf(facts) {
  const told = (facts.get('@user.role') ?? []).find((f) => !f.not && f.op === '=' && f.value);
  return told?.value ?? null;
}

/** Is `role` among `for:` roles? `!x` means everyone but x. @param {string} list @param {string} role */
function forsRole(list, role) {
  const names = list.split(',').map((x) => x.trim()).filter(Boolean);
  const not = names.filter((n) => n.startsWith('!')).map((n) => n.slice(1));
  const yes = names.filter((n) => !n.startsWith('!'));
  return !not.includes(role) && (!yes.length || yes.includes(role));
}

/**
 * The words a value shows when it is missing: given by `empty:` (on it, or on its group), and drawn only
 * when the frame says the value is missing (`given:x=empty`).
 * @param {Ctx} cx @param {string} key @param {string | null} words
 */
function emptyHere(cx, key, words) {
  if (!words || !key) return null;
  return (cx.facts.get(key) ?? []).some((f) => !f.not && f.op === '=' && f.value === 'empty') ? words : null;
}

/** @param {Corpus} corpus @param {string | null} design @param {string[]} context @param {string | null} given @returns {Facts} */
function factsOf(corpus, design, context, given) {
  /** @type {Facts} */
  const facts = new Map();
  if (!given) return facts;
  const [first] = parseCondition(given); // a scenario is one branch; the checker reports the rest
  for (const a of first ?? []) {
    if (!a.name) continue;
    const { key } = factKey(corpus, design, context, a.name);
    const list = facts.get(key) ?? [];
    list.push({ not: a.not, op: a.op, value: a.value });
    facts.set(key, list);
  }
  // A filter set to a value (`field~value`) is a filtered screen.
  if (!facts.has('filtered') && (first ?? []).some((a) => a.op === '~' && !a.not)) facts.set('filtered', [{ not: false, op: null, value: null }]);
  return facts;
}

/** @param {string | null} v */
const unq = (v) => (v ?? '').replace(/^"|"$/g, '');

/**
 * One atom against the frame: true, false, or unknown.
 * @param {Corpus} corpus @param {string | null} design @param {string[]} context @param {import('./condition.js').Atom} a @param {Facts} facts
 * @returns {Tri}
 */
function atomValue(corpus, design, context, a, facts) {
  const { key, def } = factKey(corpus, design, context, a.name);
  const q = fold({ not: false, op: a.op, value: a.value });
  /** @param {Tri} v @returns {Tri} */
  const neg = (v) => (v === 'unknown' ? v : a.not ? !v : v);
  if (!q) return 'unknown';
  const want = unq(q.value);
  const known = facts.get(key);
  if (known) {
    for (const raw of known) {
      const f = fold(raw);
      if (!f) continue;
      const have = unq(f.value);
      if (f.op === q.op && have === want) return neg(f.truthy);
      if (f.op === null) {
        // On or off, and nothing more said.
        if (q.op === null) return neg(f.truthy);
        if (f.truthy && q.op === '=' && want === 'empty') return neg(false);
        if (f.truthy && q.op === '!=' && want === 'empty') return neg(true);
        if (!f.truthy && q.op === '=' && (want === 'false' || want === 'empty')) return neg(true);
        continue;
      }
      if (f.op === '=') {
        if (q.op === '=') return neg(have === want);
        if (q.op === '!=') return neg(have !== want);
        if (q.op === null) return neg(have !== 'empty' && have !== 'false');
        continue;
      }
      if (f.op === '!=' && have === want) {
        if (q.op === '=') return neg(false);
        if (q.op === '!=') return neg(true);
      }
    }
    return 'unknown';
  }
  // Not given: the screen as it starts.
  if (SCREEN_FACTS.has(a.name)) {
    if (a.name === 'valid') return 'unknown';
    return q.op === null ? neg(false) : 'unknown';
  }
  // A field the user enters, not given: what it starts with (its initial:), or nothing — a bool starts off.
  // Records the system holds (a collection, a series) are not entered, so they are not known to be empty.
  const t = def?.item.token;
  if (t && ENTERED.has(t.type ?? '') && !t.flags.has('derived')) {
    const initial = t.keys.initial ?? (t.type === 'bool' ? 'false' : 'empty');
    const blank = initial === 'empty' || initial === 'false';
    if (q.op === null) return neg(!blank);
    if (q.op === '=' || q.op === '!=') {
      const eq = want === initial || (blank && (want === 'empty' || want === 'false') && (t.type === 'bool' || want === 'empty'));
      return neg(eq === (q.op === '='));
    }
  }
  return 'unknown';
}

/**
 * @param {Corpus} corpus @param {string | null} design @param {string[]} context @param {string | null} expr @param {Facts} facts
 * @returns {Tri}
 */
export function evaluate(corpus, design, context, expr, facts) {
  if (!expr) return true;
  let any = false, unknown = false;
  for (const branch of parseCondition(expr)) {
    /** @type {Tri} */
    let v = true;
    for (const a of branch) {
      if (!a.name) continue;
      const x = atomValue(corpus, design, context, a, facts);
      if (x === false) { v = false; break; }
      if (x === 'unknown') v = 'unknown';
    }
    if (v === true) any = true;
    if (v === 'unknown') unknown = true;
  }
  return any ? true : unknown ? 'unknown' : false;
}

/** @param {Tri} a @param {Tri} b @returns {Tri} */
const and = (a, b) => (a === false || b === false ? false : a === 'unknown' || b === 'unknown' ? 'unknown' : true);

// ---------------------------------------------------------------- frames

/**
 * @typedef {{ corpus: Corpus, design: string | null, facts: Facts, invalid: boolean, depth: number, seen: Set<string>, budget: { left: number }, empty?: string | null, role?: string | null }} Ctx
 *   `budget` caps the elements in one frame, so shared groups nested in each other cannot blow up.
 */

/**
 * One element of a frame, or null when its condition is false in this frame.
 * @param {TreeNode} node @param {Ctx} cx @param {Words | null} parentWords
 * @returns {{ el: Element | null, hidden: { name: string, line: number, file: string, when: string } | null }}
 */
function element(node, cx, parentWords) {
  const { corpus, design } = cx;
  cx.budget.left--;
  const it = node.item, t = it.token;
  const r = t.def ? null : corpus.resolve(t.name, it.context, node.design);
  const def = r?.ok ? r.def : null;
  const d = def?.item.token ?? null;
  const type = t.type ?? d?.type ?? null;
  const pattern = t.pattern ?? d?.pattern ?? null;

  // A reference inherits its definition's when:, and its own narrows it.
  const ownWhen = t.keys.when ?? null, defWhen = d?.keys.when ?? null;
  let shown = evaluate(corpus, node.design, it.context, ownWhen, cx.facts);
  if (def && defWhen) shown = and(shown, evaluate(corpus, def.design, def.item.context, defWhen, cx.facts));
  const when = [defWhen, ownWhen].filter(Boolean).join(' & ') || null;
  if (shown === false) return { el: null, hidden: { name: t.name, line: it.line, file: node.file, when: when ?? '' } };
  // for: in a frame drawn for one role: what is not for that role is not there.
  const forRoles = t.keys.for ?? d?.keys.for ?? null;
  if (forRoles && cx.role && !forsRole(forRoles, cx.role)) return { el: null, hidden: { name: t.name, line: it.line, file: node.file, when: `for:${forRoles}` } };

  const enabledExpr = t.keys.enabled ?? d?.keys.enabled ?? null;
  const enabled = evaluate(corpus, node.design, it.context, enabledExpr, cx.facts);
  const [shape, variant] = shapeFor(pattern, type);
  const visible = shape !== 'container' || ['screen', 'region', 'section', 'column', 'summary', 'nav', 'help', 'state', 'fallback'].includes(type ?? '');
  let words = wordsOf(corpus, design, t, d, visible ? 'name' : 'none');
  // Rule 7: only what a user sees has words. A group, a flow, a step is never hatched for having none.
  // (Whether a group drawn as a titled card should be, is an open question; this follows the rule as written.)
  if (!visible && words.state === 'unknown') words = { text: '', state: 'none' };
  // Do not repeat what the parent already says, compared as words, not names.
  if (parentWords && (parentWords.state === 'known' || parentWords.state === 'partial') && words.state !== 'unknown' && words.text && words.text.toLowerCase() === parentWords.text.toLowerCase()) words = { text: '', state: 'none' };

  const flags = new Set([...(d?.flags ?? []), ...t.flags]);
  const required = flags.has('required') && !t.flags.has('optional');
  const keys = { ...(d?.keys ?? {}), ...t.keys };

  // Values of a choice: its own |…|, or the vocabulary it is of:. Rule 8: given, then initial:, then the first.
  const vm = valuesMark(t) ?? (d ? valuesMark(d) : undefined) ?? vocabValues(corpus, t, it.context, node.design) ?? (d && def ? vocabValues(corpus, d, def.item.context, def.design) : undefined);
  /** @type {Element['values']} */
  let values = [];
  /** @type {string | null} */
  let value = null;
  if (vm) {
    const key = def ? `${def.design}:${def.path}` : t.def ? `${node.design}:${it.path}` : null;
    const told = (key ? cx.facts.get(key) ?? [] : []).map(fold).filter((f) => f !== null);
    const is = told.find((f) => f.op === '=')?.value;
    const not = new Set(told.filter((f) => f.op === '!=').map((f) => unq(f.value)));
    const options = vm.values.map((v) => ({ v, shown: v.when ? evaluate(corpus, def?.design ?? node.design, def?.item.context ?? it.context, v.when, cx.facts) : /** @type {Tri} */ (true) }))
      .filter((x) => x.shown !== false);
    const allowed = options.map((x) => x.v.value).filter((v) => !not.has(v));
    const initial = keys.initial && !not.has(unq(keys.initial)) ? unq(keys.initial) : null;
    const pick = is !== undefined ? unq(is) : initial ?? allowed[0] ?? null;
    values = options.map(({ v, shown: vs }) => ({
      value: v.value, words: v.unknown ? /** @type {Words} */ ({ text: '?', state: 'unknown' }) : { text: v.label ?? v.value, state: 'known' },
      chosen: v.value === pick, when: vs === 'unknown' ? v.when : null,
    }));
    const chosen = values.find((v) => v.chosen);
    value = chosen ? (chosen.words.state === 'unknown' ? '?' : chosen.words.text) : null;
  } else if (keys.initial) value = keys.initial;

  /** @type {Element} */
  const el = {
    line: it.line, file: node.file, raw: t.raw, name: t.name, shape, variant, pattern, type, words,
    hint: keys.hint ? fillWords(corpus, design, keys.hint) : null,
    placeholder: keys.placeholder ? fillWords(corpus, design, keys.placeholder) : null,
    error: null, errorInvented: false, unit: keys.unit ?? null, values, value, required, open: flags.has('?'), toBe: flags.has('to-be'),
    derived: flags.has('derived') ? (keys.from ?? '') : null,
    shown: shown === true ? 'yes' : 'unknown', when: shown === 'unknown' ? when : null,
    enabled: enabled === true ? 'yes' : enabled === false ? 'no' : 'unknown', enabledWhen: enabledExpr,
    goto: t.goto ?? d?.goto ?? null, forRoles: keys.for ?? null, note: it.note,
    empty: emptyHere(cx, def ? `${def.design}:${def.path}` : it.path ? `${node.design}:${it.path}` : '', t.keys.empty ?? d?.keys.empty ?? cx.empty ?? null),
    problem: problemOf(t, r, true),
    children: [], hidden: [],
  };
  // Rule 9: a frame that says !valid draws what can fail as failing.
  if (cx.invalid && required && el.derived === null && pattern && !['button', 'container', 'value'].includes(shape) && !cx.facts.has(def ? `${def.design}:${def.path}` : '')) {
    el.error = keys.error ? fillWords(corpus, design, keys.error) : 'Required';
    el.errorInvented = !keys.error;
  }

  // Children: what is written under it here; failing that, what its definition holds (any anchor is a container),
  // or for a table, the fields of what it lists.
  let kids = node.children.filter((c) => c.item.token.type !== 'state');
  const guard = def ? `${def.design}:${def.path}` : `${node.design}:${it.path}`;
  if (!kids.length && def && !cx.seen.has(guard) && cx.depth < 12) {
    kids = inheritedChildren(corpus, def);
  }
  if (!kids.length && shape === 'table' && def) {
    const of = keyList(def.item.token, 'of')[0];
    const target = of ? corpus.resolve(of, def.item.context, def.design) : null;
    if (target?.ok && !cx.seen.has(`${target.def.design}:${target.def.path}`)) kids = inheritedChildren(corpus, target.def);
  }
  // empty: on a group says what each child shows when it has no value.
  const inner = { ...cx, depth: cx.depth + 1, seen: new Set(cx.seen).add(guard), empty: t.keys.empty ?? d?.keys.empty ?? cx.empty ?? null };
  if (cx.budget.left <= 0) kids = [];
  for (const k of kids) {
    const c = element(k, inner, words.state === 'none' ? parentWords : words);
    if (c.el) el.children.push(c.el);
    if (c.hidden) el.hidden.push(c.hidden);
  }
  return { el, hidden: null };
}

/**
 * A definition's own children; with `like:`, the source's whole subtree first, a child of the same name replacing one.
 * @param {Corpus} corpus @param {Def} def @returns {TreeNode[]}
 */
function inheritedChildren(corpus, def, seen = new Set()) {
  const key = `${def.design}:${def.path}`;
  if (seen.has(key)) return [];
  seen.add(key);
  const own = nodeOf(corpus, def)?.children.filter((c) => c.item.token.type !== 'state') ?? [];
  /** @type {TreeNode[]} */
  const out = [];
  for (const like of keyList(def.item.token, 'like')) {
    const r = corpus.resolve(like, def.item.context, def.design);
    if (r.ok) out.push(...inheritedChildren(corpus, r.def, seen));
  }
  const names = new Set(own.map((c) => c.item.token.name));
  return [...out.filter((c) => !names.has(c.item.token.name)), ...own];
}

/** The values an enum takes from the vocabulary it is `of:`. @param {Corpus} corpus @param {Token} t @param {string[]} context @param {string | null} design */
function vocabValues(corpus, t, context, design) {
  const of = keyList(t, 'of')[0];
  if (!of || of.startsWith('@')) return undefined;
  const r = corpus.resolve(of, context, design);
  return r.ok ? valuesMark(r.def.item.token) : undefined;
}

/** @param {Words} w */
const wordsText = (w) => (w.state === 'unknown' ? '?' : w.text);

/**
 * The sheets of a screen or widget page.
 * @param {Corpus} corpus @param {string} file @returns {Sheet[]}
 */
function sheetsOf(corpus, file) {
  const entry = /** @type {import('./model.js').PageEntry} */ (corpus.pages.get(file));
  const design = entry.design;
  const roots = pageTree(corpus, file);
  /** @type {TreeNode[]} */
  let sheetRoots = [];
  /** @param {TreeNode[]} list */
  const collect = (list) => { for (const n of list) { if (n.item.token.type === 'screen') sheetRoots.push(n); else collect(n.children); } };
  collect(roots);
  /** @type {Array<{ name: string, line: number, given: string | null, context: string[], design: string | null, token: Token, from: string | null, adds: TreeNode[] }>} */
  let borrowed = [];
  if (!sheetRoots.length) {
    if (entry.page.sema === 'widget') {
      // The card: the first anchor that is not a data shape. Its states come from the screens that place it.
      const card = roots.find((n) => !DATA_SHAPES.has(n.item.token.type ?? '')) ?? roots[0];
      if (card) {
        sheetRoots = [card];
        borrowed = statesOfPlacingScreens(corpus, design, card);
      }
    } else {
      // A page with no screen at all is one sheet of everything.
      const fake = /** @type {Item} */ ({ ...roots[0]?.item, line: roots[0]?.item.line ?? 1, col: 0, context: [], path: null, note: '', role: 'anchor',
        token: { raw: '', inner: '', name: file.split('/').pop()?.replace(/\.md$/, '') ?? 'page', def: true, type: 'screen', marks: [], label: null, unknownWords: false, partialWords: false, open: false, pattern: null, goto: null, keys: {}, flags: new Set() } });
      if (roots.length) sheetRoots = [{ item: fake, file, design, children: roots }];
    }
  }
  return sheetRoots.map((root) => {
    const t = root.item.token;
    const own = statesUnder(root);
    const states = own.length ? own.map((s) => ({ name: s.item.token.name, line: s.item.line, given: s.item.token.keys.given ?? null, context: s.item.context, design, token: s.item.token, from: null, adds: s.children }))
      : borrowed;
    /** @type {Frame[]} */
    const frames = [];
    const make = (/** @type {typeof states[number] | null} */ s) => {
      /** @type {Facts} */
      const facts = s ? factsOf(corpus, s.design, s.context, s.given) : new Map();
      const invalid = (facts.get('valid') ?? []).some((f) => f.not && f.op === null);
      const role = roleOf(facts);
      /** @type {Ctx} */
      const cx = { corpus, design, facts, invalid, depth: 0, seen: new Set(), budget: { left: 800 }, role };
      const top = element({ ...root, children: root.children.filter((c) => c.item.token.type !== 'state') }, cx, null);
      const adds = (s?.adds ?? []).map((a) => element(a, cx, null).el).filter((x) => x !== null);
      /** @type {Words} */
      const words = s ? wordsOf(corpus, design, s.token, null, 'name') : { text: 'As it starts', state: 'known' };
      return /** @type {Frame} */ ({
        name: s?.name ?? 'start', line: s?.line ?? root.item.line, given: s?.given ?? null, words,
        skipped: false, open: !!s?.token.flags.has('?'), from: s?.from ?? null,
        root: top.el, hidden: top.el?.hidden ?? [], adds: /** @type {Element[]} */ (adds),
        facts: s?.given ? [s.given] : [], role,
      });
    };
    for (const s of states) {
      if (s.token.flags.has('?') && s.token.keys.default === 'skip') {
        frames.push({ name: s.name, line: s.line, given: s.given, words: wordsOf(corpus, design, s.token, null, 'name'), skipped: true, open: true, from: s.from, root: null, hidden: [], adds: [], facts: [], role: null });
        continue;
      }
      frames.push(make(s));
    }
    if (!frames.some((f) => !f.skipped)) frames.unshift(make(null));
    return {
      name: t.name, line: root.item.line, words: wordsOf(corpus, design, t, null, 'name'),
      present: t.keys.present ?? null, over: t.keys.over ?? null, forRoles: t.keys.for ?? null, frames,
    };
  });
}

/** The states of a sheet, wherever they sit in it (not inside another screen). @param {TreeNode} root */
function statesUnder(root) {
  /** @type {TreeNode[]} */
  const out = [];
  const walk = (/** @type {TreeNode} */ n) => {
    for (const c of n.children) {
      if (c.item.token.type === 'state') out.push(c);
      else if (c.item.token.type !== 'screen') walk(c);
    }
  };
  walk(root);
  return out;
}

/**
 * Rule 5: a widget with no states of its own is drawn in each state of the screen that places it.
 * @param {Corpus} corpus @param {string | null} design @param {TreeNode} card
 */
function statesOfPlacingScreens(corpus, design, card) {
  const target = card.item.path ?? card.item.token.name;
  /** @type {Array<{ name: string, line: number, given: string | null, context: string[], design: string | null, token: Token, from: string | null, adds: TreeNode[] }>} */
  const out = [];
  if (!design) return out;
  /** @param {TreeNode} n @returns {boolean} */
  const placesIt = (n) => n.children.some((c) => {
    if (c.item.token.type === 'screen') return false;
    if (!c.item.token.def) {
      const r = corpus.resolve(c.item.token.name, c.item.context, design);
      if (r.ok && r.def.path === target && r.def.design === design) return true;
    }
    return placesIt(c);
  });
  for (const p of corpus.designPages(design)) {
    if (p.page.sema !== 'screen') continue;
    /** @type {TreeNode[]} */
    const screens = [];
    const walk = (/** @type {TreeNode} */ n) => { if (n.item.token.type === 'screen') screens.push(n); n.children.forEach(walk); };
    pageTree(corpus, p.file).forEach(walk);
    for (const sc of screens) {
      if (!placesIt(sc)) continue;
      for (const s of statesUnder(sc)) out.push({ name: `${sc.item.token.name} · ${s.item.token.name}`, line: s.item.line, given: s.item.token.keys.given ?? null, context: s.item.context, design, token: s.item.token, from: p.file, adds: [] });
    }
  }
  return out;
}

// ---------------------------------------------------------------- flows and maps

/**
 * @param {Corpus} corpus @param {string | null} design @param {string} file @param {Map<string, boolean>} readyByFile
 * @returns {FlowGraph[]}
 */
function flowsOn(corpus, design, file, readyByFile) {
  const entry = corpus.pages.get(file);
  if (!entry) return [];
  const roots = pageTree(corpus, file);
  /** @type {FlowGraph[]} */
  const out = [];
  /** @param {TreeNode} n @returns {TreeNode[]} */
  const flat = (n) => [n, ...n.children.flatMap(flat)];
  const flowRoots = roots.flatMap(flat).filter((n) => n.item.token.type === 'flow');
  const groups = flowRoots.length ? flowRoots.map((f) => ({ head: f, items: f.children.flatMap(flat) }))
    : [{ head: null, items: roots.flatMap(flat) }];
  for (const g of groups) {
    /** @type {Map<string, FlowNode>} */
    const nodes = new Map();
    /** @type {FlowEdge[]} */
    const edges = [];
    /** @param {string} name @param {string[]} context @param {number} line @param {string} note */
    const node = (name, context, line, note) => {
      const existing = nodes.get(name);
      if (existing) { if (!existing.note && note) existing.note = note; return existing; }
      const r = corpus.resolve(name, context, design);
      /** @type {FlowNode} */
      const n = { id: name, name, line, file: null, kind: 'step', state: 'missing', design, ready: null, note };
      if (r.ok) {
        n.file = r.def.file; n.kind = r.def.item.token.type ?? 'step'; n.line = r.def.line; n.design = r.def.design;
        n.state = r.def.design === design ? 'ok' : 'elsewhere';
        n.ready = readyByFile.get(r.def.file) ?? null;
      } else if (r.reason === 'ambiguous') n.state = 'ambiguous';
      else if (name.includes('/') || /^(screen|flow|widget|step)\./.test(name)) n.state = 'forward';
      nodes.set(name, n);
      return n;
    };
    for (const n of g.items) {
      const t = n.item.token;
      if (t.type === 'flow') continue;
      if (!t.def || t.type === 'step' || t.goto) {
        node(t.name, n.item.context, n.item.line, t.goto ? '' : n.item.note);
        if (t.goto) {
          node(t.goto, n.item.context, n.item.line, '');
          edges.push({ from: t.name, to: t.goto, when: t.keys.when ?? null, line: n.item.line, note: n.item.note });
        }
      }
    }
    const head = g.head?.item;
    out.push({
      name: head?.token.name ?? file.split('/').pop()?.replace(/\.md$/, '') ?? 'flow', line: head?.line ?? 1, file,
      words: head ? wordsOf(corpus, design, head.token, null, 'name') : { text: '', state: 'none' },
      note: head?.note ?? '', nodes: [...nodes.values()], edges,
    });
  }
  return out;
}

/** @param {Corpus} corpus @param {string} file @param {{ diagnostics: import('./check.js').Diagnostic[], readiness: import('./check.js').Readiness[] }} [given] @returns {DesignMap} */
function mapOf(corpus, file, given) {
  const entry = /** @type {import('./model.js').PageEntry} */ (corpus.pages.get(file));
  const design = /** @type {string} */ (entry.design);
  const checked = given ?? checkDesign(corpus, design);
  const readyByFile = new Map(checked.readiness.map((r) => [r.file, r.ready]));
  const countsByFile = new Map(checked.readiness.map((r) => [r.file, r]));
  const pages = corpus.designPages(design);
  const flows = pages.filter((p) => p.page.sema === 'flow' || p.page.items.some((i) => i.token.def && i.token.type === 'flow'))
    .flatMap((p) => flowsOn(corpus, design, p.file, readyByFile));
  /** @type {MapScreen[]} */
  const screens = [];
  for (const p of pages) {
    if (p.page.sema !== 'screen' && p.page.sema !== 'widget') continue;
    const defs = p.page.items.filter((i) => i.token.def && i.token.type === 'screen');
    const list = defs.length ? defs : [p.page.items.find((i) => i.token.def) ?? null].filter((x) => x !== null);
    for (const d of list) {
      const c = countsByFile.get(p.file);
      screens.push({
        name: d.path ?? d.token.name, file: p.file, line: d.line, kind: p.page.sema, ready: c ? c.ready : null,
        reachedBy: flows.filter((f) => f.nodes.some((n) => n.file === p.file && n.line === d.line && n.state === 'ok')).map((f) => f.name),
        counts: c ? { things: c.things, settled: c.settled, onDefaults: c.onDefaults, blocking: c.blocking, unknownWords: c.unknownWords, frames: c.frames, assumed: c.assumed } : null,
      });
    }
  }
  // In reading order: as the flows reach them, each screen followed by its widgets (structure.md).
  const order = corpus.designOrder(design);
  const rank = (/** @type {string} */ f) => { const i = order.indexOf(f); return i < 0 ? order.length : i; };
  screens.sort((a, b) => rank(a.file) - rank(b.file) || a.line - b.line);
  const orphans = screens.filter((s) => s.kind === 'screen' && !s.reachedBy.length);
  const elsewhere = entry.page.items.filter((i) => !i.token.def).map((i) => {
    const r = corpus.resolve(i.token.name, i.context, design);
    // Only a name in another design, or a kind-prefixed file id, is a forward reference; any other unresolved name is an error.
    const forward = i.token.name.includes('/') || /^(screen|flow|widget|step)\./.test(i.token.name);
    return { name: i.token.name, line: i.line, state: r.ok ? (r.def.design === design ? 'ok' : 'elsewhere') : r.reason === 'ambiguous' ? 'ambiguous' : forward ? 'forward' : 'missing' };
  }).filter((x) => x.state !== 'ok');
  return {
    design, note: entry.page.items.find((i) => i.token.type === 'design')?.note ?? '', flows, screens: screens, orphans, elsewhere,
    totals: {
      pages: pages.length, screens: screens.length, ready: screens.filter((s) => s.ready).length,
      errors: checked.diagnostics.filter((d) => d.severity === 'error').length,
      warnings: checked.diagnostics.filter((d) => d.severity === 'warning').length,
    },
  };
}

// ---------------------------------------------------------------- lists

const LIST_SKIP = new Set(['hint', 'error', 'placeholder', 'add', 'empty']);

/** @param {Corpus} corpus @param {string} file @param {import('./check.js').Diagnostic[]} [diagnostics] the checker's findings on this page @returns {ListSection[]} */
function listOf(corpus, file, diagnostics = []) {
  const entry = /** @type {import('./model.js').PageEntry} */ (corpus.pages.get(file));
  /** @type {ListSection[]} */
  const sections = [];
  for (const it of entry.page.items) {
    if (it.role === 'inline' && !it.standalone) continue;
    const t = it.token;
    let sec = sections[sections.length - 1];
    if (!sec || sec.heading !== it.heading) { sec = { heading: it.heading, rows: [] }; sections.push(sec); }
    const r = t.def ? null : corpus.resolve(t.name, it.context, entry.design);
    const vm = valuesMark(t);
    /** @type {string[]} */
    const marks = [];
    for (const m of t.marks) {
      if (m.kind === 'flag') marks.push(m.flag);
      else if (m.kind === 'key' && !LIST_SKIP.has(m.key)) marks.push(`${m.key}:${m.value}`);
      else if (m.kind === 'key') marks.push(`${m.key}: “${m.value}”`);
      else if (m.kind === 'pattern') marks.push(`> ${m.pattern}`);
      else if (m.kind === 'goto') marks.push(`→ ${m.target}`);
      else if (m.kind === 'source') marks.push(`#${m.ref}`);
    }
    sec.rows.push({
      line: it.line, depth: it.depth, name: t.name, path: it.path, def: t.def, type: t.type ?? (r?.ok ? r.def.item.token.type : null),
      words: wordsOf(corpus, entry.design, t, null, 'none'),
      values: (vm?.values ?? []).map((v) => ({ value: v.value, words: v.unknown ? { text: '?', state: 'unknown' } : { text: v.label ?? v.value, state: 'known' }, when: v.when })),
      marks, note: it.note, open: t.open,
      // What the checker says about the row, when it says something; else what resolving it found.
      problem: diagnostics.find((d) => d.line === it.line && d.col === it.col && d.severity !== 'info')?.message ?? (t.def ? null : problemOf(t, r)),
    });
  }
  return sections;
}

// ---------------------------------------------------------------- entry point

/**
 * What to draw for one page. Dispatches on the page's kind before anything is drawn.
 * @param {Corpus} corpus @param {string} file corpus-relative
 * @param {{ diagnostics: import('./check.js').Diagnostic[], readiness: import('./check.js').Readiness[] }} [checked] the page's design, already checked
 * @returns {View | null}
 */
export function viewOf(corpus, file, checked) {
  const entry = corpus.pages.get(file);
  if (!entry || !entry.page.sema) return null;
  const kind = entry.page.sema;
  if (kind === 'screen' || kind === 'widget') return { kind: 'frames', page: file, sheets: sheetsOf(corpus, file) };
  if (kind === 'flow') {
    const c = checked ?? (entry.design && !entry.vocabulary ? checkDesign(corpus, entry.design) : { readiness: [] });
    return { kind: 'flow', page: file, flows: flowsOn(corpus, entry.design, file, new Map(c.readiness.map((r) => [r.file, r.ready]))) };
  }
  if (kind === 'design' && entry.design && !entry.vocabulary) return { kind: 'map', page: file, map: mapOf(corpus, file, checked) };
  return { kind: 'list', page: file, sema: kind, sections: listOf(corpus, file, checked?.diagnostics.filter((d) => d.file === file)) };
}

export { wordsText };
