// The MCP server answers initialize, tools/list and tools/call over newline-delimited JSON-RPC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const server = path.join(here, '..', 'packages', 'mcp', 'server.js');
const corpus = path.join(here, '..', 'examples', 'larder');

async function exchange(messages) {
  const child = spawn(process.execPath, [server, corpus], { stdio: ['pipe', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  for (const m of messages) child.stdin.write(JSON.stringify(m) + '\n');
  child.stdin.end();
  await new Promise((r) => child.on('close', r));
  return out.trim().split('\n').map((l) => JSON.parse(l));
}

test('the server initialises, lists three tools, checks a corpus and looks one page up', async () => {
  const replies = await exchange([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'semark_check', arguments: {} } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'semark_page', arguments: { file: 'ordering/basket.md' } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'semark_page', arguments: { file: 'nope.md' } } },
    { jsonrpc: '2.0', id: 6, method: 'nothing/here' },
  ]);
  const by = Object.fromEntries(replies.map((r) => [r.id, r]));
  assert.equal(by[1].result.serverInfo.name, 'semark');
  assert.deepEqual(by[2].result.tools.map((t) => t.name), ['semark_check', 'semark_page', 'semark_dump']);
  assert.match(by[3].result.content[0].text, /4 designs · 29 pages/);
  assert.equal(by[3].result.isError, false);
  const page = JSON.parse(by[4].result.content[0].text);
  assert.equal(page.sema, 'screen');
  assert.ok(page.tokens.some((t) => t.resolved && t.resolved.ok && t.resolved.path === 'basket'), 'the basket reference resolves');
  assert.equal(page.view.kind, 'frames');
  assert.equal(by[5].result.isError, true);
  assert.equal(by[6].error.code, -32601);
});
