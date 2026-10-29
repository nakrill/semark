// @ts-check
/**
 * Sema, layer 1: one token.
 *
 *   [[name]]                    a reference
 *   [[name: type marks…]]       a definition — the colon after the name is what makes it one
 *   [[name marks…]]             a reference that adds to what it points at
 *
 * The parsed token keeps its raw text, and nothing here ever writes a token
 * back: a re-serialised token would change lines nobody edited, and in Vouch
 * every line carries an author and a sign-off. Unknown marks are kept, never
 * dropped. The editor's chip and the checker both call these functions, so
 * they cannot disagree about what a token says.
 */

/**
 * @typedef {{ value: string, label: string | null, unknown: boolean, when: string | null }} EnumValue
 * @typedef {{ kind: 'key', key: string, value: string, quoted: boolean }
 *   | { kind: 'label', value: string, unknown: boolean, partial: boolean }
 *   | { kind: 'values', values: EnumValue[] }
 *   | { kind: 'goto', target: string }
 *   | { kind: 'pattern', pattern: string }
 *   | { kind: 'source', ref: string, assumption: boolean }
 *   | { kind: 'flag', flag: string }} Mark
 * @typedef {{
 *   raw: string, inner: string, name: string, def: boolean, type: string | null, marks: Mark[],
 *   label: string | null, unknownWords: boolean, partialWords: boolean, open: boolean,
 *   pattern: string | null, goto: string | null, keys: Record<string, string>, flags: Set<string>,
 * }} Token
 * @typedef {{ start: number, end: number, raw: string, inner: string }} Found  `start`/`end` index the line, `end` exclusive
 */

/** Every `[[…]]` in one line of text, in order. Unclosed brackets are not tokens. @param {string} line @returns {Found[]} */
export function findTokens(line) {
  /** @type {Found[]} */
  const out = [];
  let i = 0;
  while ((i = line.indexOf('[[', i)) !== -1) {
    const close = line.indexOf(']]', i + 2);
    if (close === -1) break;
    const inner = line.slice(i + 2, close);
    // Nested brackets mean this is not one token (e.g. a Markdown link inside a link).
    if (!inner.includes('[[') && inner.trim()) out.push({ start: i, end: close + 2, raw: line.slice(i, close + 2), inner });
    i = close + 2;
  }
  return out;
}

const ELLIPSIS = /(…|\.\.\.)$/;

/**
 * Split the inside of a token into words, keeping quoted strings and `|…|`
 * value lists whole. A value list runs from a `|` that starts a word to the
 * next `|` followed by a space or the end.
 * @param {string} s
 */
function words(s) {
  /** @type {string[]} */
  const out = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let j = i;
    if (s[i] === '|') {
      j = i + 1;
      while (j < s.length && !(s[j] === '|' && (j + 1 >= s.length || /\s/.test(s[j + 1])))) j++;
      j = Math.min(s.length, j + 1);
    } else {
      // A word; a quoted part (also after `key:`) runs to its closing quote.
      while (j < s.length && !/\s/.test(s[j])) {
        if (s[j] === '"') {
          const q = s.indexOf('"', j + 1);
          j = q === -1 ? s.length : q + 1;
        } else j++;
      }
    }
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}

/** @param {string} body the inside of `|…|` @returns {EnumValue[]} */
function parseValues(body) {
  return body.split('|').map((v) => v.trim()).filter(Boolean).map((v) => {
    let when = null;
    const w = /\swhen:(\S+)$/.exec(v);
    if (w) { when = w[1]; v = v.slice(0, w.index).trim(); }
    const eq = v.indexOf('=');
    const value = eq === -1 ? v : v.slice(0, eq);
    const label = eq === -1 ? null : v.slice(eq + 1);
    return { value, label, unknown: label === '?', when };
  });
}

/** @param {string} w @returns {Mark} */
function parseMark(w) {
  if (w.startsWith('|')) return { kind: 'values', values: parseValues(w.replace(/^\||\|$/g, '')) };
  if (w.startsWith('"')) {
    const value = w.replace(/^"|"$/g, '');
    return { kind: 'label', value, unknown: value === '?', partial: ELLIPSIS.test(value) };
  }
  if (w.startsWith('#') && w.length > 1) return { kind: 'source', ref: w.slice(1), assumption: /^a\d/.test(w.slice(1)) };
  const kv = /^([a-z][\w-]*):(.*)$/i.exec(w);
  if (kv && kv[2] !== '') {
    const quoted = kv[2].startsWith('"');
    return { kind: 'key', key: kv[1], value: quoted ? kv[2].replace(/^"|"$/g, '') : kv[2], quoted };
  }
  return { kind: 'flag', flag: w };
}

/**
 * Parse the inside of one token. `->` and `>` take the word after them.
 * @param {string} inner @param {string} [raw]
 * @returns {Token}
 */
export function parseToken(inner, raw = `[[${inner}]]`) {
  const ws = words(inner);
  let name = ws.shift() ?? '';
  let def = false;
  /** @type {string | null} */
  let type = null;
  if (name.endsWith(':')) { def = true; name = name.slice(0, -1); }
  /** @type {Mark[]} */
  const marks = [];
  for (let k = 0; k < ws.length; k++) {
    const w = ws[k];
    if (w === '->' || w === '>') {
      const target = ws[k + 1] ?? '';
      k++;
      marks.push(w === '->' ? { kind: 'goto', target } : { kind: 'pattern', pattern: target });
      continue;
    }
    if (w.startsWith('->') && w.length > 2) { marks.push({ kind: 'goto', target: w.slice(2) }); continue; }
    // A definition's first plain word is its type.
    if (def && type === null && /^[a-z][\w-]*$/.test(w) && marks.length === 0) { type = w; continue; }
    marks.push(parseMark(w));
  }
  /** @type {Record<string, string>} */
  const keys = {};
  const flags = new Set();
  let label = null, unknownWords = false, partialWords = false, pattern = null, goto = null;
  for (const m of marks) {
    if (m.kind === 'key' && !(m.key in keys)) keys[m.key] = m.value;
    else if (m.kind === 'flag') flags.add(m.flag);
    else if (m.kind === 'label' && label === null) { label = m.value; unknownWords = m.unknown; partialWords = m.partial; }
    else if (m.kind === 'pattern' && pattern === null) pattern = m.pattern;
    else if (m.kind === 'goto' && goto === null) goto = m.target;
  }
  return { raw, inner, name, def, type, marks, label, unknownWords, partialWords, open: flags.has('?'), pattern, goto, keys, flags };
}

/** The value of a key mark, split on `,` when it names several things (`from:a,b`). @param {Token} t @param {string} key */
export function keyList(t, key) {
  const v = t.keys[key];
  return v === undefined ? [] : v.split(',').map((x) => x.trim()).filter(Boolean);
}
