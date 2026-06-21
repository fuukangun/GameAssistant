import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialAppData } from './appInitialData.ts';

test('does not preload demo saves in desktop runtime', () => {
  const initialData = createInitialAppData(true);

  assert.deepEqual(initialData.saves, []);
  assert.deepEqual(initialData.snapshotsBySaveId, {});
});

test('keeps demo saves for non-desktop preview runtime', () => {
  const initialData = createInitialAppData(false);

  assert.equal(initialData.saves.length, 2);
  assert.equal(initialData.saves[0]?.name, 'Sunrise Farm');
  assert.equal(initialData.saves[1]?.name, '雪岭农场');
});
