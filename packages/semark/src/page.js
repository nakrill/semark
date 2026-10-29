// @ts-check
/**
 * Sema, layer 2: one page → its tokens in reading order, each with where it sits.
 *
 * Three nesting rules, and no others (syntax.md, "Names and nesting"):
 *   1. A heading holds no token and creates no name.
 *   2. A token alone on the first line under a heading is that heading's anchor;
 *      everything under the heading, until the next heading of the same or a
 *      higher level, is its child.
 *   3. An indented list item is the child of the list item above it.
 * A token in ordinary prose is a mention: it gets a path if it is a definition,
 * but opens no scope. Fenced code and `:::` blocks are prose about the design and
 * never enter it. Line numbers are 1-based and always kept.
 */
import { findTokens, parseToken } from './token.js';

/**
 * @typedef {import('./token.js').Token} Token
 * @typedef {'anchor' | 'item' | 'inline'} Role
 * @typedef {{
 *   line: number, col: number, heading: string | null, context: string[], depth: number,
 *   token: Token, note: string, role: Role, path: string | null, standalone: boolean, anchorOf: string | null,
 * }} Item
 *   `context` is the enclosing names, outermost first, split into path segments.
 *   `path` is set on definitions: context and name joined with dots.
 *   `standalone` marks a token alone on its line that is not the first under its heading:
 *   it opens no scope (the language does not say what it should mean; a checker flags it).
 *   `anchorOf` is the enclosing anchor's name, for messages.
 * @typedef {{ sema: string | null, frontmatter: Record<string, string>, items: Item[], lines: number }} Page
 */

/**
 * The kind a page says it is (`sema:` in its frontmatter), or null. Only the frontmatter at the very top
 * counts (a byte order mark before it is allowed); a line `sema: …` further down is text. The editor, the
 * server and the command line all ask this function, so they cannot disagree about what is a Sema page.
 * @param {string} text @returns {string | null}
 */
export function semaKindOf(text) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return null;
  const s = /^sema:[ \t]*["']?([\w-]+)/m.exec(m[1]);
  return s ? s[1] : null;
}

/** @param {string} name */
const segments = (name) => name.split('.').filter(Boolean);

/**
 * Parts of a line where tokens are not read: `inline code` (any run of backticks, closed by the same
 * run) and <!-- comments -->. A page that shows the syntax as code is not making those definitions.
 * @param {string} line @returns {Array<[number, number]>}
 */
export function quietRanges(line) {
  /** @type {Array<[number, number]>} */
  const out = [];
  for (let i = 0; i < line.length;) {
    if (line.startsWith('<!--', i)) {
      const end = line.indexOf('-->', i + 4);
      const to = end < 0 ? line.length : end + 3;
      out.push([i, to]); i = to; continue;
    }
    if (line[i] === '`') {
      let n = 0;
      while (line[i + n] === '`') n++;
      const run = '`'.repeat(n);
      let j = i + n;
      let close = -1;
      while ((j = line.indexOf(run, j)) !== -1) {
        if (line[j + n] !== '`' && line[j - 1] !== '`') { close = j; break; }
        while (line[j] === '`') j++;
      }
      if (close < 0) { i += n; continue; }
      out.push([i, close + n]); i = close + n; continue;
    }
    i++;
  }
  return out;
}

/** @param {string} text @returns {Page} */
export function parsePage(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  /** @type {Record<string, string>} */
  const frontmatter = {};
  let i = 0;
  if (lines[0] === '---' || lines[0] === '﻿---') {
    for (i = 1; i < lines.length && lines[i] !== '---'; i++) {
      const m = /^([\w-]+):\s*(.*?)\s*(#.*)?$/.exec(lines[i]);
      if (m) frontmatter[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    i++;
  }
  /** @type {Item[]} */
  const items = [];
  /** @type {Array<{ level: number, text: string, anchor: string | null, waiting: boolean }>} */
  const headings = [];
  /** @type {Array<{ indent: number, name: string | null }>} */
  const list = [];
  let fence = null;
  let container = false;
  let comment = false;

  const anchors = () => headings.flatMap((h) => (h.anchor ? segments(h.anchor) : []));
  const nearestAnchor = () => [...headings].reverse().find((h) => h.anchor)?.anchor ?? null;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const no = i + 1;
    // Fenced code and ::: blocks are skipped whole.
    // A fence may open inside a list item; it closes only on a bare fence at least as long.
    const f = /^\s*(?:(?:[-*+]|\d+[.)])\s+)?(```+|~~~+)/.exec(line);
    if (fence) { if (/^\s*(```+|~~~+)\s*$/.test(line) && line.trim()[0] === fence[0] && line.trim().length >= fence.length) fence = null; continue; }
    if (f && !(f[1][0] === '`' && line.slice(f.index + f[0].length).includes('`'))) { fence = f[1]; continue; }
    // HTML comments are not read, on one line or across several.
    if (comment) { if (line.includes('-->')) comment = false; continue; }
    if (/^\s*<!--/.test(line) && !line.includes('-->')) { comment = true; continue; }
    if (container) { if (/^\s*:::\s*$/.test(line)) container = false; continue; }
    if (/^\s*:::\s*\S/.test(line)) { container = true; continue; }

    if (!line.trim()) continue;
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      const level = h[1].length;
      while (headings.length && headings[headings.length - 1].level >= level) headings.pop();
      headings.push({ level, text: h[2], anchor: null, waiting: true });
      list.length = 0;
      continue;
    }
    const current = headings[headings.length - 1];
    const firstUnderHeading = !!current?.waiting;
    if (current) current.waiting = false;

    const li = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    const hidden = quietRanges(line);
    const found = findTokens(line).filter((t) => !hidden.some(([a, b]) => t.start >= a && t.start < b));
    if (li) {
      const indent = li[1].replace(/\t/g, '    ').length;
      while (list.length && list[list.length - 1].indent >= indent) list.pop();
      const parents = list.flatMap((x) => (x.name ? segments(x.name) : []));
      const contentStart = line.length - li[2].length;
      const lead = found.length && found[0].start === contentStart ? found[0] : null;
      const context = [...anchors(), ...parents];
      found.forEach((t, k) => {
        const role = t === lead ? 'item' : 'inline';
        items.push(makeItem(t, no, current?.text ?? null, context, role, k === 0 && t === lead ? line.slice(t.end).trim() : '', false, nearestAnchor()));
      });
      list.push({ indent, name: lead ? parseToken(lead.inner, lead.raw).name : null });
      continue;
    }
    // A line that is neither a list item nor a heading: an indented continuation keeps the list going,
    // anything at the left margin ends it.
    if (!/^\s/.test(line)) list.length = 0;
    const startsWithToken = found.length > 0 && line.slice(0, found[0].start).trim() === '';
    if (firstUnderHeading && startsWithToken && current) {
      const t = found[0];
      const tok = parseToken(t.inner, t.raw);
      items.push(makeItem(t, no, current.text, anchors(), 'anchor', line.slice(t.end).trim(), false, nearestAnchor()));
      current.anchor = tok.name;
      found.slice(1).forEach((x) => items.push(makeItem(x, no, current.text, anchors(), 'inline', '', false, nearestAnchor())));
      continue;
    }
    const context = [...anchors(), ...(/^\s/.test(line) ? list.flatMap((x) => (x.name ? segments(x.name) : [])) : [])];
    found.forEach((t, k) => {
      const standalone = k === 0 && startsWithToken && !/^\s/.test(line);
      items.push(makeItem(t, no, current?.text ?? null, context, 'inline', standalone ? line.slice(t.end).trim() : '', standalone, nearestAnchor()));
    });
  }
  return { sema: frontmatter.sema ?? null, frontmatter, items, lines: lines.length };
}

/**
 * @param {import('./token.js').Found} t @param {number} line @param {string | null} heading @param {string[]} context
 * @param {Role} role @param {string} note @param {boolean} standalone @param {string | null} anchorOf
 * @returns {Item}
 */
function makeItem(t, line, heading, context, role, note, standalone, anchorOf) {
  const token = parseToken(t.inner, t.raw);
  return {
    line, col: t.start, heading, context: [...context], depth: context.length, token, note, role, standalone, anchorOf,
    path: token.def ? [...context, token.name].join('.') : null,
  };
}
