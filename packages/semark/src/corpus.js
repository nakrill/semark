// @ts-check
/**
 * A corpus on disk: every Markdown page under a root (the folder that holds the
 * shared patterns.md, words.md and roles.md), parsed and handed to the library.
 * The command line and any editor come through here, so they report the same thing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Corpus, checkCorpus, formatReport } from './check.js';
import { parsePage } from './page.js';

/** Folders that never hold a design: tools, builds and vendored code. Hidden folders are skipped too. */
export const SKIP = new Set(['node_modules', 'dist', 'build', 'vendor', 'target']);

export class TooBig extends Error {
  /** @param {number} n */
  constructor(n) { super(`more than ${n} Markdown files`); this.limit = n; }
}

/** Counters for tests: how many pages were parsed and how many folders walked. */
export const stats = { parsed: 0, walks: 0 };

/**
 * Every .md file under `root`, parsed, as corpus-relative paths with `/`. Hidden folders, tool and build
 * folders, and symbolic links are skipped, and so is a nested copy of a corpus (a sub-folder with its own
 * patterns.md). Folders count against `limit` with files. With `cache`, a file whose size and modification
 * time have not changed is not read or parsed again.
 * @param {string} root
 * @param {{ limit?: number, cache?: Map<string, { mtimeMs: number, size: number, page: import('./page.js').Page }> }} [opts]
 * @returns {Promise<{ files: Array<{ file: string, page: import('./page.js').Page }>, skipped: string[] }>}
 */
export async function loadCorpusFiles(root, opts = {}) {
  /** @type {Array<{ file: string, page: import('./page.js').Page }>} */
  const files = [];
  /** @type {string[]} */
  const skipped = [];
  const limit = opts.limit ?? Infinity;
  const seen = new Set();
  let count = 0;
  const tick = () => { if (++count > limit) throw new TooBig(limit); };
  /** @param {string} dir */
  async function walk(dir) {
    stats.walks++;
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      if (e.name.startsWith('.') || SKIP.has(e.name) || e.isSymbolicLink()) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        tick();
        if (await fs.access(path.join(abs, 'patterns.md')).then(() => true, () => false)) { skipped.push(path.relative(root, abs).split(path.sep).join('/')); continue; }
        await walk(abs);
      } else if (e.isFile() && /\.md$/i.test(e.name)) {
        tick();
        const file = path.relative(root, abs).split(path.sep).join('/');
        seen.add(abs);
        const st = opts.cache ? await fs.stat(abs) : null;
        const hit = st && opts.cache?.get(abs);
        if (hit && st && hit.mtimeMs === st.mtimeMs && hit.size === st.size) { files.push({ file, page: hit.page }); continue; }
        const page = parsePage(await fs.readFile(abs, 'utf8'));
        stats.parsed++;
        if (st) opts.cache?.set(abs, { mtimeMs: st.mtimeMs, size: st.size, page });
        files.push({ file, page });
      }
    }
  }
  await walk(root);
  if (opts.cache) for (const k of opts.cache.keys()) if (k.startsWith(root + path.sep) && !seen.has(k)) opts.cache.delete(k);
  files.sort((a, b) => (a.file < b.file ? -1 : 1));
  return { files, skipped };
}

/** @param {string} root @param {Parameters<typeof loadCorpusFiles>[1]} [opts] */
export async function loadCorpus(root, opts) {
  const { files, skipped } = await loadCorpusFiles(root, opts);
  return { corpus: new Corpus(files), skipped };
}

/**
 * `semark check <root>`: print the report; return 1 when there are errors.
 * @param {string} root @param {{ json?: boolean, out?: NodeJS.WritableStream }} [opts]
 */
export async function runCheck(root, opts = {}) {
  const out = opts.out ?? process.stdout;
  const abs = path.resolve(root);
  const { corpus, skipped } = await loadCorpus(abs);
  const results = checkCorpus(corpus);
  const errors = results.reduce((n, r) => n + r.diagnostics.filter((d) => d.severity === 'error').length, 0) + results.corpus.length;
  if (opts.json) {
    out.write(JSON.stringify({ root: abs, skipped, corpus: results.corpus, designs: results.map((r) => ({ ...r, readiness: r.readiness.map(({ fields, ...rest }) => rest) })) }, null, 2) + '\n');
    return errors ? 1 : 0;
  }
  if (!results.length) {
    out.write(`No design under ${abs}: a design is a folder whose index.md says "sema: design".\n`);
    return 0;
  }
  const pages = results.reduce((n, r) => n + r.pages, 0);
  const tokens = [...corpus.pages.values()].filter((p) => !p.vocabulary && p.takesPart).reduce((n, p) => n + p.page.items.length, 0);
  const warnings = results.reduce((n, r) => n + r.diagnostics.filter((d) => d.severity === 'warning').length, 0);
  out.write(`${results.length} designs · ${pages} pages · ${tokens} tokens · ${errors} errors · ${warnings} warnings\n`);
  for (const d of results.corpus) out.write(`✖ ${d.file}:${d.line}  ${d.code}  ${d.message}\n`);
  if (skipped.length) out.write(`Skipped nested copies of a corpus: ${skipped.join(', ')}\n`);
  if (![...corpus.pages.values()].some((p) => p.vocabulary && p.page.sema === 'patterns')) {
    out.write(`No patterns.md under ${abs}: every pattern will look unknown. Run this on the corpus root, the folder with the shared patterns.md and words.md.\n`);
  }
  out.write('\n' + formatReport(results));
  return errors ? 1 : 0;
}
