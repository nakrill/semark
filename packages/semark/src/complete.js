// @ts-check
/**
 * Completion for a token being typed. Narrow on purpose: it suggests a name,
 * a type or a pattern at the caret and inserts that text — it never writes
 * marks, words or a whole token. The popup and the editor both use it.
 *
 *   [[na|            a name within reach (references; also the target after ->)
 *   [[name: ty|      a type
 *   [[name > pa|     a pattern, filtered by the field's type through the pattern's fits:
 */
import { TYPES, KNOWN_FLAGS } from './model.js';
import { keyList } from './token.js';

/**
 * @typedef {{ insert: string, path: string, type: string | null, file: string, line: number }} VocabName
 * @typedef {{ name: string, fits: string[] }} VocabPattern
 * @typedef {{ names: VocabName[], patterns: VocabPattern[], types: string[] }} Vocab
 * @typedef {{ label: string, detail: string, kind: 'name' | 'type' | 'pattern' | 'flag' }} Option
 */

/**
 * What can be completed in a design: its own definitions, each under the shortest text that reaches it
 * (the bare name when it is the only one of that name, otherwise its path), and the shared patterns.
 * @param {import('./model.js').Corpus} corpus @param {string | null} design
 * @returns {Vocab}
 */
export function vocabulary(corpus, design) {
  const own = corpus.defs.filter((d) => d.design === design && d.kind === 'own' && !['pattern', 'word', 'design'].includes(d.item.token.type ?? ''));
  /** @type {Map<string, number>} */
  const leaves = new Map();
  for (const d of own) { const leaf = d.path.split('.').pop() ?? d.path; leaves.set(leaf, (leaves.get(leaf) ?? 0) + 1); }
  const names = own.map((d) => {
    const leaf = d.path.split('.').pop() ?? d.path;
    return { insert: leaves.get(leaf) === 1 ? leaf : d.path, path: d.path, type: d.item.token.type, file: d.file, line: d.line };
  });
  const patterns = corpus.defs.filter((d) => d.item.token.type === 'pattern').map((d) => ({ name: d.path, fits: keyList(d.item.token, 'fits') }));
  return { names, patterns, types: [...TYPES].sort() };
}

/**
 * Suggestions at the caret, for the text inside the brackets up to the caret.
 * @param {string} before the token's text from just after `[[` to the caret
 * @param {Vocab} vocab
 * @param {number} [limit] how many suggestions at most
 * @returns {{ from: number, options: Option[] } | null} `from` is where the word being replaced starts, in `before`
 */
export function completeAt(before, vocab, limit = 8) {
  const word = /[\w.\/-]*$/.exec(before)?.[0] ?? '';
  const from = before.length - word.length;
  const head = before.slice(0, from);
  const q = word.toLowerCase();
  /** @param {string} s */
  const score = (s) => { const t = s.toLowerCase(); return t.startsWith(q) ? 0 : t.split(/[.\/-]/).some((p) => p.startsWith(q)) ? 1 : t.includes(q) ? 2 : -1; };
  /** @template T @param {T[]} list @param {(x: T) => string} key */
  const rank = (list, key) => list.map((x) => ({ x, s: score(key(x)) })).filter((r) => r.s >= 0).sort((a, b) => a.s - b.s || key(a.x).localeCompare(key(b.x))).map((r) => r.x);

  // The first word: a name. (A definition's own name is new, so nothing is suggested once a colon follows it.)
  if (head.trim() === '') {
    if (!q) return null;
    return { from, options: names(vocab, word) };
  }
  // name: |type
  if (/^\s*[^\s:]+:\s*$/.test(head)) {
    return { from, options: rank(vocab.types, (t) => t).slice(0, limit).map((t) => ({ label: t, detail: 'type', kind: 'type' })) };
  }
  // > pattern
  if (/(^|\s)>\s*$/.test(head)) {
    const type = typeOf(head, vocab);
    const fitting = vocab.patterns.filter((p) => !type || !p.fits.length || p.fits.includes(type));
    return { from, options: rank(fitting, (p) => p.name).slice(0, limit).map((p) => ({ label: p.name, detail: p.fits.length ? `fits ${p.fits.join(', ')}` : 'pattern', kind: 'pattern' })) };
  }
  // A flag, once the type is written: name: type |
  if (q && !word.includes('.') && /^\s*[^\s:]+:\s*[a-z][\w-]*\s/.test(head) && !/(->|>)\s*$/.test(head)) {
    const flags = rank([...KNOWN_FLAGS].filter((f) => f !== '?'), (f) => f).slice(0, limit);
    if (flags.length) return { from, options: flags.map((f) => ({ label: f, detail: 'mark', kind: 'flag' })) };
  }
  // -> target
  if (/->\s*$/.test(head)) {
    if (!q) return null;
    return { from, options: names(vocab, word) };
  }
  return null;

  /** Names: typed with a dot, they are matched and inserted as paths; otherwise by the shortest text that reaches them. @param {Vocab} v @param {string} w */
  function names(v, w) {
    const byPath = w.includes('.');
    const key = (/** @type {VocabName} */ n) => (byPath ? n.path : n.insert);
    const seen = new Set();
    return rank(v.names, key).filter((n) => !seen.has(key(n)) && seen.add(key(n))).slice(0, limit)
      .map((n) => /** @type {Option} */ ({ label: key(n), detail: detailOf(n, key(n)), kind: 'name' }));
  }
}

/** What a suggested name is and where it is written; its full path when the label is shorter. @param {VocabName} n @param {string} label */
function detailOf(n, label) {
  const where = `${n.file.split('/').pop()}:${n.line}`;
  return [n.type, label === n.path ? where : `${n.path} · ${where}`].filter(Boolean).join(' · ');
}

/** The type of the token being written: its own (`name: type`), or what its name refers to. @param {string} head @param {Vocab} vocab */
function typeOf(head, vocab) {
  const own = /^\s*[^\s:]+:\s*([\w-]+)/.exec(head);
  if (own) return own[1];
  const name = /^\s*([^\s:>]+)/.exec(head)?.[1];
  const hit = name ? vocab.names.find((n) => n.insert === name || n.path === name || n.path.endsWith('.' + name)) : undefined;
  return hit?.type ?? null;
}
