import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveStore } from './saveStore.ts';

test('stores scanned saves and selects the first save by default', () => {
  const store = createSaveStore();

  store.getState().setSaves([
    {
      id: 'Farm_1',
      name: 'Farm',
      path: '/tmp/Farm_1',
      lastModified: '2026-06-18T00:00:00.000Z',
      parseStatus: 'partial',
    },
  ]);

  assert.equal(store.getState().selectedSaveId, 'Farm_1');
});

test('keeps selected save when it still exists after rescan', () => {
  const store = createSaveStore();

  store.getState().setSaves([
    { id: 'A_1', name: 'A', path: '/tmp/A_1', lastModified: '2026-06-18T00:00:00.000Z', parseStatus: 'partial' },
    { id: 'B_2', name: 'B', path: '/tmp/B_2', lastModified: '2026-06-18T00:00:00.000Z', parseStatus: 'partial' },
  ]);
  store.getState().selectSave('B_2');
  store.getState().setSaves([
    { id: 'B_2', name: 'B', path: '/tmp/B_2', lastModified: '2026-06-18T00:00:00.000Z', parseStatus: 'partial' },
  ]);

  assert.equal(store.getState().selectedSaveId, 'B_2');
});

test('upserts an imported save and selects it', () => {
  const store = createSaveStore();
  store.getState().setSaves([
    { id: 'A_1', name: 'A', path: '/tmp/A_1', lastModified: '2026-06-18T00:00:00.000Z', parseStatus: 'partial' },
  ]);

  store.getState().upsertSave({
    id: 'B_2',
    name: 'B',
    path: 'manual://B_2',
    lastModified: '2026-06-18T01:00:00.000Z',
    parseStatus: 'ok',
  });

  assert.equal(store.getState().saves.length, 2);
  assert.equal(store.getState().selectedSaveId, 'B_2');
});

test('replaces an existing save when an imported save has the same path', () => {
  const store = createSaveStore();
  store.getState().setSaves([
    { id: 'Farmer_123456', name: 'Farmer', path: '/tmp/Saves/Farmer_123456', lastModified: '1781712000', parseStatus: 'partial' },
  ]);

  store.getState().upsertSave({
    id: '123456',
    name: 'Sunrise Farm',
    path: '/tmp/Saves/Farmer_123456',
    lastModified: '2026-06-18T01:00:00.000Z',
    parseStatus: 'ok',
  });

  assert.equal(store.getState().saves.length, 1);
  assert.equal(store.getState().saves[0].id, '123456');
  assert.equal(store.getState().selectedSaveId, '123456');
});

test('keeps the existing save order when updating a scanned save', () => {
  const store = createSaveStore();
  store.getState().setSaves([
    { id: 'A_1', name: 'A Farm', path: '/tmp/A_1', lastModified: '2026-06-18T02:00:00.000Z', parseStatus: 'partial' },
    { id: 'B_2', name: 'B Farm', path: '/tmp/B_2', lastModified: '2026-06-18T01:00:00.000Z', parseStatus: 'partial' },
    { id: 'C_3', name: 'C Farm', path: '/tmp/C_3', lastModified: '2026-06-18T00:00:00.000Z', parseStatus: 'partial' },
  ]);

  store.getState().upsertSave({
    id: 'B_2',
    name: 'Updated B Farm',
    path: '/tmp/B_2',
    lastModified: '2026-06-18T01:30:00.000Z',
    parseStatus: 'ok',
  });

  assert.deepEqual(store.getState().saves.map((save) => save.id), ['A_1', 'B_2', 'C_3']);
  assert.equal(store.getState().saves[1].name, 'Updated B Farm');
  assert.equal(store.getState().selectedSaveId, 'B_2');
});

test('removes a missing manual import by folder path and updates selected save', () => {
  const store = createSaveStore();
  store.getState().setSaves([
    { id: 'A_1', name: 'A Farm', path: '/tmp/Saves/A_1', lastModified: '2026-06-18T02:00:00.000Z', parseStatus: 'ok' },
    { id: 'B_2', name: 'B Farm', path: '/tmp/Saves/B_2/B_2', lastModified: '2026-06-18T01:00:00.000Z', parseStatus: 'ok' },
  ]);
  store.getState().selectSave('B_2');

  store.getState().removeSaveByPath('/tmp/Saves/B_2');

  assert.deepEqual(store.getState().saves.map((save) => save.id), ['A_1']);
  assert.equal(store.getState().selectedSaveId, 'A_1');
});
