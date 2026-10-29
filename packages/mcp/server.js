#!/usr/bin/env node
// Semark over the Model Context Protocol, stdio transport (newline-delimited JSON-RPC 2.0).
// No dependencies: the protocol surface an agent needs is initialize, tools/list and tools/call.
//
//   semark-mcp [corpus-root]      the root is the default for every tool; a tool may name another
import path from 'node:path';
import fs from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { loadCorpus, runCheck } from 'semark/corpus.js';
import { checkCorpus, checkDesign } from 'semark/check.js';
import { viewOf } from 'semark/view.js';

const DEFAULT_ROOT = process.argv[2] ? path.resolve(process.argv[2]) : null;
const rootOf = (args) => { const r = args?.root ? path.resolve(args.root) : DEFAULT_ROOT; if (!r) throw new Error('no corpus root: pass root, or start the server with one'); return r; };

const TOOLS = [
  { name: 'semark_check', description: 'Check every design under a corpus root (the folder holding patterns.md): problems with file and line, readiness per screen. The text is what `semark check` prints; `json: true` returns the structured report instead.',
    inputSchema: { type: 'object', properties: { root: { type: 'string', description: 'Corpus root; defaults to the server\'s.' }, json: { type: 'boolean' } } } },
  { name: 'semark_page', description: 'One page of a design: its kind, every token with what it resolved to (and the walk it took), the diagnostics on that page, its readiness, and the drawing as data.',
    inputSchema: { type: 'object', required: ['file'], properties: { root: { type: 'string' }, file: { type: 'string', description: 'Corpus-relative path with /, such as ordering/checkout-screen.md' } } } },
  { name: 'semark_dump', description: 'The resolved model of a corpus as JSON: designs, their pages in reading order, definitions with paths and types, diagnostics and readiness. Large; prefer semark_page for one page.',
    inputSchema: { type: 'object', properties: { root: { type: 'string' } } } },
];

async function call(name, args) {
  const root = rootOf(args);
  if (name === 'semark_check') {
    const out = { text: '', write(s) { this.text += s; } };
    const code = await runCheck(root, { out, json: !!args?.json });
    return { content: [{ type: 'text', text: out.text }], isError: code !== 0 };
  }
  const { corpus, skipped } = await loadCorpus(root);
  if (name === 'semark_dump') {
    const results = checkCorpus(corpus);
    const designs = results.map((r) => ({
      name: r.name, folder: r.folder, pages: corpus.designPages(r.name).map((p) => p.file),
      definitions: corpus.defs.filter((d) => d.design === r.name && d.kind === 'own').map((d) => ({ path: d.path, type: d.item.token.type, file: d.file, line: d.line, token: d.item.token.raw })),
      diagnostics: r.diagnostics, readiness: r.readiness,
    }));
    return { content: [{ type: 'text', text: JSON.stringify({ root, skipped, corpus: results.corpus, designs }, null, 1) }] };
  }
  if (name === 'semark_page') {
    const file = String(args.file).replace(/\\/g, '/');
    const entry = corpus.pages.get(file);
    if (!entry) return { content: [{ type: 'text', text: `no page ${file} under ${root}` }], isError: true };
    const design = entry.design;
    const checked = design && corpus.designs.has(design) ? checkDesign(corpus, design) : { diagnostics: [], readiness: [] };
    const tokens = entry.page.items.map((it) => {
      const t = it.token;
      const r = t.def ? null : corpus.resolve(t.name, it.context, design);
      return { line: it.line, raw: t.raw, name: t.name, def: t.def, type: t.type, path: it.path,
        resolved: r ? (r.ok ? { ok: true, path: r.def.path, file: r.def.file, line: r.def.line, walk: r.walk } : { ok: false, reason: r.reason, candidates: r.candidates.map((d) => d.path) }) : null };
    });
    const page = { file, sema: entry.page.sema, design, tokens,
      diagnostics: checked.diagnostics.filter((d) => d.file === file), readiness: checked.readiness.find((x) => x.file === file) ?? null,
      view: viewOf(corpus, file) };
    return { content: [{ type: 'text', text: JSON.stringify(page, null, 1) }] };
  }
  throw new Error(`unknown tool ${name}`);
}

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let req; try { req = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); }
  const { id, method, params } = req;
  const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => id !== undefined && send({ jsonrpc: '2.0', id, error: { code, message } });
  try {
    if (method === 'initialize') return reply({ protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'semark', version: '0.8.1' } });
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') return;
    if (method === 'ping') return reply({});
    if (method === 'tools/list') return reply({ tools: TOOLS });
    if (method === 'tools/call') {
      try { return reply(await call(params?.name, params?.arguments ?? {})); }
      catch (e) { return reply({ content: [{ type: 'text', text: String(e?.message ?? e) }], isError: true }); }
    }
    return fail(-32601, `method not found: ${method}`);
  } catch (e) { return fail(-32603, String(e?.message ?? e)); }
});
