// @ts-check
/**
 * Sema, layer 3: a corpus of pages → designs, and a resolver for names in them.
 *
 * A design is the set of pages under the nearest folder whose index.md says
 * `sema: design`. Everything else — the shared patterns, words and roles, and
 * every other design — is a vocabulary: indexed so names can be found, never
 * counted as this design's content.
 *
 * Resolving one name, from the context it was written in:
 *   1. exact      — a definition at this path;
 *   2. outward    — the context from the outside in, dropping the OUTERMOST segment each time;
 *   3. leaf       — definitions whose path ends in the name, in this design only, never a pattern
 *                   or a word; more than one is an error, never a guess;
 *   4. path walk  — a dotted name, one whole segment at a time; a step down follows `like:` and
 *                   `of:` (transitively, cycle-safe), and accessors stay where they are.
 * Nothing here guesses: an unresolved or ambiguous name comes back as exactly that.
 */
import { parsePage } from './page.js';
import { keyList } from './token.js';

/**
 * @typedef {import('./page.js').Item} Item
 * @typedef {import('./page.js').Page} Page
 * @typedef {{ path: string, file: string, line: number, item: Item, design: string | null, kind: 'own' | 'vocabulary' }} Def
 *   `design` is the design (or named vocabulary) the definition belongs to; null for an unnamed vocabulary page.
 * @typedef {{ file: string, page: Page, design: string | null, vocabulary: boolean, takesPart: boolean }} PageEntry
 *   `takesPart` is false for a page with no `sema:` and for a page in a second folder of a design name:
 *   such a page is listed, so the editor can say what it is, but contributes no names.
 * @typedef {{ name: string, folder: string, files: string[], twin?: boolean }} Design
 *   `twin`: a second folder declaring a design name another folder already has; it is no design.
 * @typedef {{ ok: true, def: Def, walk: string[] } | { ok: false, reason: 'none' | 'ambiguous', candidates: Def[], walk: string[] }} Resolution
 */

export const DATA_TYPES = new Set(['text', 'longtext', 'number', 'date', 'phone', 'email', 'bool', 'enum', 'list', 'confirm', 'address', 'image', 'collection', 'series']);
export const TYPES = new Set([
  ...DATA_TYPES, 'group', 'config', 'context', 'states', 'flow', 'step', 'screen', 'region', 'section', 'nav', 'column', 'action',
  'feedback', 'summary', 'help', 'state', 'fallback', 'pattern', 'word', 'design', 'widget',
]);
/** Flags the language defines (syntax.md, Marks): the checker's and completion's one list. */
export const KNOWN_FLAGS = new Set(['required', 'optional', '?', 'derived', 'to-be', 'removable', 'readonly', 'sortable', 'disabled', 'row']);
/** Names that reach into what a name holds instead of naming something else. */
export const ACCESSORS = new Set(['first', 'last', 'count', 'label', 'empty', 'selected', 'age']);
/** Built-in facts about a screen: never a design's names. */
export const SCREEN_FACTS = new Set(['valid', 'submitted', 'loading', 'filtered', 'searched', 'changed']);
/** Built-in values. */
export const BUILTIN_VALUES = new Set(['empty', 'today', 'now', 'true', 'false']);

const last = (/** @type {string} */ p) => p.slice(p.lastIndexOf('.') + 1);
const dirOf = (/** @type {string} */ f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');

export class Corpus {
  /**
   * @param {Array<{ file: string, text: string } | { file: string, page: Page }>} files every Markdown page under the
   *   corpus root, paths relative to it with `/` separators, as text or already parsed. The vocabulary (patterns,
   *   words, roles) must be among them.
   */
  constructor(files) {
    /** @type {Map<string, PageEntry>} */
    this.pages = new Map();
    const parsed = files.map((f) => ({ file: f.file, page: 'page' in f ? f.page : parsePage(f.text) }));
    // Designs: folders whose index.md says `sema: design`, named by their design token.
    /** @type {Map<string, Design>} folder → design */
    this.designsByFolder = new Map();
    /** @type {Array<{ severity: 'error', code: string, file: string, line: number, col: number, raw: string, message: string }>} findings about the corpus as a whole */
    this.diagnostics = [];
    /** @type {Map<string, Design>} */
    this.designs = new Map();
    for (const { file, page } of [...parsed].sort((a, b) => (a.file < b.file ? -1 : 1))) {
      if (!/(^|\/)index\.md$/i.test(file) || page.sema !== 'design') continue;
      const named = page.items.find((it) => it.token.def && it.token.type === 'design');
      const folder = dirOf(file);
      const name = named?.token.name ?? (folder.split('/').pop() || 'design');
      const first = this.designs.get(name);
      if (first) {
        // One name, two folders: the first keeps it, the second is no design until it is renamed.
        this.designsByFolder.set(folder, { name, folder, files: [], twin: true });
        this.diagnostics.push({ severity: 'error', code: 'design-twice', file, line: named?.line ?? 1, col: named?.col ?? 0, raw: named?.token.raw ?? '',
          message: `${name} is declared in ${first.folder ? first.folder + '/' : ''}index.md and ${file}; a design has one folder — rename one of them` });
        continue;
      }
      const d = { name, folder, files: [] };
      this.designsByFolder.set(folder, d);
      this.designs.set(name, d);
    }
    for (const { file, page } of parsed) {
      let dir = dirOf(file);
      /** @type {Design | undefined} */
      let design;
      for (;;) {
        design = this.designsByFolder.get(dir);
        if (design || dir === '') break;
        dir = dirOf(dir);
      }
      // A page takes part only when it says sema:, and not in a second folder of a design name.
      const takesPart = !!page.sema && !design?.twin;
      if (design && takesPart) design.files.push(file);
      // A vocabulary page named by its own `design` token (words.md is `[[words: design]]`) is addressed by that name.
      const vocabName = design ? null : (page.items.find((it) => it.token.def && it.token.type === 'design')?.token.name ?? null);
      this.pages.set(file, { file, page, design: design?.twin ? null : design?.name ?? vocabName, vocabulary: !design, takesPart });
    }
    /** @type {Def[]} */
    this.defs = [];
    for (const entry of this.pages.values()) {
      if (!entry.takesPart) continue;
      for (const item of entry.page.items) {
        if (!item.token.def || !item.path) continue;
        this.defs.push({ path: item.path, file: entry.file, line: item.line, item, design: entry.design, kind: entry.vocabulary ? 'vocabulary' : 'own' });
      }
    }
    /** @type {Map<string, Map<string, Def[]>>} design → own path → defs */
    this.own = new Map();
    /** @type {Map<string, Map<string, Def[]>>} design → leaf → defs (own design only; no patterns, no words) */
    this.leaf = new Map();
    /** @type {Map<string, Def[]>} keys every design can see: patterns, words/<name>, other designs as <design>/<name|path>, vocabulary paths */
    this.shared = new Map();
    const add = (/** @type {Map<string, Def[]>} */ m, /** @type {string} */ k, /** @type {Def} */ d) => { const a = m.get(k); if (a) { if (!a.includes(d)) a.push(d); } else m.set(k, [d]); };
    for (const d of this.defs) {
      const type = d.item.token.type;
      if (d.kind === 'own' && d.design && type === 'design') {
        // The design token is reached only from outside, as <design>/<design>: inside, a bare name never means the design.
        add(this.shared, `${d.design}/${d.item.token.name}`, d);
      } else if (d.kind === 'own' && d.design) {
        if (!this.own.has(d.design)) { this.own.set(d.design, new Map()); this.leaf.set(d.design, new Map()); }
        add(/** @type {Map<string, Def[]>} */ (this.own.get(d.design)), d.path, d);
        if (type !== 'pattern' && type !== 'word') add(/** @type {Map<string, Def[]>} */ (this.leaf.get(d.design)), last(d.path), d);
        // Another design reaches it as <design>/<name> and <design>/<path>.
        add(this.shared, `${d.design}/${d.item.token.name}`, d);
        add(this.shared, `${d.design}/${d.path}`, d);
      } else {
        // Vocabulary: patterns by their own (dotted) names, shared words by `words/<name>` — the name, never the path.
        if (type === 'pattern') add(this.shared, d.item.token.name, d);
        else if (d.design) {
          add(this.shared, `${d.design}/${d.item.token.name}`, d);
          add(this.shared, `${d.design}/${d.path}`, d);
        } else add(this.shared, d.path, d);
      }
    }
    /** @type {Map<string, Resolution>} */
    this.cache = new Map();
  }

  /** The definitions at exactly this key, as `design` sees them. @param {string} key @param {string | null} design */
  exact(key, design) {
    const own = design ? this.own.get(design)?.get(key) : undefined;
    if (own?.length) return own;
    // A key with `/` addresses another design or a vocabulary; a bare key may be a pattern or an unnamed vocabulary entry.
    return this.shared.get(key) ?? [];
  }

  /** Is this a pattern in the vocabulary? @param {string} name */
  pattern(name) {
    return (this.shared.get(name) ?? []).find((d) => d.item.token.type === 'pattern') ?? null;
  }

  /**
   * Resolve a name written in `context` (outermost first) in `design`.
   * @param {string} name @param {string[]} context @param {string | null} design
   * @returns {Resolution}
   */
  resolve(name, context, design) {
    const key = `${design}\u0000${context.join('.')}\u0000${name}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const r = this.#resolve(name, context, design, new Set());
    this.cache.set(key, r);
    return r;
  }

  /** @param {string} name @param {string[]} context @param {string | null} design @param {Set<string>} seen @returns {Resolution} */
  #resolve(name, context, design, seen) {
    /** @type {string[]} */
    const walk = [];
    // 1. exact, and 2. outward: drop the outermost segment each time.
    for (let k = 0; k <= context.length; k++) {
      const path = [...context.slice(k), name].join('.');
      const found = this.exact(path, design);
      if (found.length === 1) return { ok: true, def: found[0], walk: k === context.length ? [] : [`${name} → ${path}`] };
      if (found.length > 1) return { ok: false, reason: 'ambiguous', candidates: found, walk };
    }
    if (name.includes('/')) return { ok: false, reason: 'none', candidates: [], walk };
    // 3. leaf: this design only, never a pattern or a word.
    const leaves = (design ? this.leaf.get(design)?.get(last(name)) : undefined) ?? [];
    const matches = leaves.filter((d) => d.path === name || d.path.endsWith('.' + name));
    if (matches.length === 1) return { ok: true, def: matches[0], walk: [`${name} → ${matches[0].path} (the only one)`] };
    if (matches.length > 1) return { ok: false, reason: 'ambiguous', candidates: matches, walk };
    // 4. path walk, one whole segment at a time.
    if (name.includes('.')) {
      const segs = name.split('.');
      const first = this.#resolve(segs[0], context, design, seen);
      if (!first.ok) return first;
      let at = first.def;
      const steps = [...first.walk, segs[0] + ' → ' + at.path];
      for (const seg of segs.slice(1)) {
        if (ACCESSORS.has(seg)) { steps.push(`.${seg} reads ${at.path}`); continue; }
        const down = this.child(at, seg, seen);
        if (!down) return { ok: false, reason: 'none', candidates: [], walk: [...steps, `${at.path} has no ${seg}`] };
        steps.push(...down.walk);
        at = down.def;
      }
      return { ok: true, def: at, walk: steps };
    }
    return { ok: false, reason: 'none', candidates: [], walk };
  }

  /**
   * One step down: a direct child, or — failing that — a child of whatever the
   * definition is `like:` or `of:`, followed transitively.
   * @param {Def} def @param {string} seg @param {Set<string>} [seen]
   * @returns {{ def: Def, walk: string[] } | null}
   */
  child(def, seg, seen = new Set()) {
    const guard = `${def.design}:${def.path}`;
    if (seen.has(guard)) return null;
    const next = new Set(seen).add(guard);
    const direct = this.exact(`${def.path}.${seg}`, def.design).filter((d) => d.design === def.design);
    if (direct.length) return { def: direct[0], walk: [`${seg} → ${direct[0].path}`] };
    for (const key of ['like', 'of']) {
      for (const target of keyList(def.item.token, key)) {
        if (target.startsWith('@')) continue;
        const r = this.#resolve(target, def.item.context, def.design, next);
        if (!r.ok) continue;
        const via = this.child(r.def, seg, next);
        if (via) return { def: via.def, walk: [`${def.path} is ${key}:${target} → ${r.def.path}`, ...via.walk] };
      }
    }
    return null;
  }

  /**
   * A design's pages in the order they are read (structure.md, Reading order): the design page; its
   * flows, in the order the design page names them; data, config and states pages; then screens in the
   * order the flows reach them, each followed by the widgets it places; screens no flow reaches, by name;
   * then everything else. Paths relative to the corpus root.
   * @param {string} name @returns {string[]}
   */
  designOrder(name) {
    const pages = this.designPages(name);
    const kind = (/** @type {PageEntry} */ p) => p.page.sema;
    const byName = (/** @type {PageEntry[]} */ list) => [...list].sort((a, b) => (a.file < b.file ? -1 : 1));
    /** @type {string[]} */
    const out = [];
    const put = (/** @type {string | undefined} */ f) => { if (f && !out.includes(f)) out.push(f); };
    /** The page a name, written on `p`, is defined on. @param {PageEntry} p @param {Item} it @param {string} n */
    const fileOf = (p, it, n) => { const r = this.resolve(n, it.context, name); return r.ok && r.def.design === name ? r.def.file : undefined; };

    const index = pages.find((p) => kind(p) === 'design');
    put(index?.file);
    // Flows, in the order the design page names them.
    const flows = pages.filter((p) => kind(p) === 'flow');
    if (index) for (const it of index.page.items) { const f = fileOf(index, it, it.token.name); if (flows.some((x) => x.file === f)) put(f); }
    for (const p of byName(flows)) put(p.file);
    for (const p of byName(pages.filter((x) => ['data', 'config', 'states'].includes(kind(x) ?? '')))) put(p.file);
    // Screens, as the flows reach them; each followed by the widgets it places.
    const isScreen = (/** @type {string | undefined} */ f) => !!f && pages.some((p) => p.file === f && kind(p) === 'screen');
    const widgetsOf = (/** @type {PageEntry} */ screen) => {
      for (const it of screen.page.items) {
        if (it.token.def) continue;
        const f = fileOf(screen, it, it.token.name);
        if (f && pages.some((p) => p.file === f && kind(p) === 'widget')) put(f);
      }
    };
    const screen = (/** @type {string | undefined} */ f) => {
      if (!isScreen(f) || out.includes(/** @type {string} */ (f))) return;
      put(f);
      widgetsOf(/** @type {PageEntry} */ (pages.find((p) => p.file === f)));
    };
    for (const f of out.filter((x) => flows.some((p) => p.file === x))) {
      const flow = /** @type {PageEntry} */ (pages.find((p) => p.file === f));
      for (const it of flow.page.items) {
        screen(fileOf(flow, it, it.token.name));
        if (it.token.goto) screen(fileOf(flow, it, it.token.goto));
      }
    }
    for (const p of byName(pages.filter((x) => kind(x) === 'screen'))) screen(p.file);
    for (const p of byName(pages)) put(p.file);
    return out;
  }

  /** The page entries of a design, in file order. @param {string} name */
  designPages(name) {
    const d = this.designs.get(name);
    return d ? d.files.map((f) => /** @type {PageEntry} */ (this.pages.get(f))) : [];
  }
}
