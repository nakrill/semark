// The binding table shipped as data is the one the drawing uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WIREFRAME_BINDING, shapeFor } from '../packages/semark/src/view.js';

const here = path.dirname(fileURLToPath(import.meta.url));

test('bindings/wireframe.json is WIREFRAME_BINDING, row for row', () => {
  const json = JSON.parse(fs.readFileSync(path.join(here, '..', 'bindings', 'wireframe.json'), 'utf8'));
  assert.deepEqual(json.binding, WIREFRAME_BINDING);
});

test('shapes are picked by the longest prefix, a read-only pattern never becomes a control, and no pattern means the type decides', () => {
  assert.deepEqual(shapeFor('input.text.long', 'longtext'), ['area', null]);
  assert.equal(shapeFor('input.text', 'text')[0], 'field');
  assert.deepEqual(shapeFor('something.new', 'text'), ['unbound', 'something.new']);
  assert.deepEqual(shapeFor(null, 'action'), ['button', 'quiet']);
  assert.deepEqual(shapeFor(null, 'group'), ['container', 'group']);
  assert.deepEqual(shapeFor(null, 'text'), ['value', null]);
});
