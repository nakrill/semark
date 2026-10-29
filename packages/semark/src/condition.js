// @ts-check
/**
 * Conditions in `when:`, `given:` and `enabled:`.
 *
 *   =  !=  <  >  <=  >=     comparisons
 *   ~                       a filter on this field is set to this value (in a state's given:)
 *   &   ,   !               and, or, not — `&` binds tighter than `,`: a&b,c is (a and b) or c
 *
 * Every bare field name in a condition is rewritten to the full path it means
 * where the condition was written ("qualified"), so a field shown somewhere else
 * still compares against the right thing. `@…` (a config or context), names that
 * already have a dot, and the built-in screen facts are left as written.
 */
import { SCREEN_FACTS } from './model.js';

/**
 * @typedef {{ not: boolean, name: string, op: string | null, value: string | null, start: number, end: number }} Atom
 *   `start`/`end` locate the name inside the expression.
 * @typedef {Atom[][]} Condition  an OR of ANDs
 */

const OPS = ['<=', '>=', '!=', '=', '<', '>', '~'];

/** Split on a separator outside double quotes. @param {string} s @param {string} sep @returns {Array<{ text: string, at: number }>} */
function split(s, sep) {
  /** @type {Array<{ text: string, at: number }>} */
  const out = [];
  let q = false, from = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') q = !q;
    else if (!q && s[i] === sep) { out.push({ text: s.slice(from, i), at: from }); from = i + 1; }
  }
  out.push({ text: s.slice(from), at: from });
  return out;
}

/** @param {string} expr @returns {Condition} */
export function parseCondition(expr) {
  return split(expr, ',').map((or) => split(or.text, '&').map((and) => {
    let t = and.text, at = or.at + and.at, not = false;
    while (t.startsWith('!') && !t.startsWith('!=')) { not = !not; t = t.slice(1); at++; }
    let op = null, value = null, end = at + t.length;
    let name = t;
    // The first operator outside quotes ends the name.
    for (let i = 0; i < t.length && op === null; i++) {
      for (const o of OPS) if (t.startsWith(o, i)) { op = o; name = t.slice(0, i); value = t.slice(i + o.length).replace(/^"|"$/g, ''); end = at + i; break; }
    }
    return { not, name, op, value, start: at, end };
  }));
}

/** The names a condition reads that belong to the design (not `@…`, not built-in facts). @param {string} expr */
export function conditionNames(expr) {
  return parseCondition(expr).flat().filter((a) => a.name && !a.name.startsWith('@') && !SCREEN_FACTS.has(a.name));
}

/**
 * Rewrite each bare field name to its full path, as `resolve` finds it from where the condition was written.
 * A name that does not resolve is left as written (the checker reports it).
 * @param {string} expr @param {(name: string) => string | null} resolve
 */
export function qualify(expr, resolve) {
  const atoms = parseCondition(expr).flat().filter((a) => a.name && !a.name.startsWith('@') && !a.name.includes('.') && !SCREEN_FACTS.has(a.name));
  let out = expr;
  for (const a of atoms.sort((x, y) => y.start - x.start)) {
    const path = resolve(a.name);
    if (path && path !== a.name) out = out.slice(0, a.start) + path + out.slice(a.end);
  }
  return out;
}
