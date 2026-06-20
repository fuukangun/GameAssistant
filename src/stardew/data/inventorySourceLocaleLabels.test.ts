import test from 'node:test';
import assert from 'node:assert/strict';
import { INVENTORY_SOURCE_LOCALE_LABELS } from './inventorySourceLocaleLabels.ts';
import inventorySourceLocaleLabels from './inventorySourceLocaleLabels.json' with { type: 'json' };

test('loads inventory source locale labels from external JSON data', () => {
  assert.deepEqual(INVENTORY_SOURCE_LOCALE_LABELS, inventorySourceLocaleLabels);
  assert.equal(INVENTORY_SOURCE_LOCALE_LABELS['zh-CN'].backpack, '背包');
  assert.equal(INVENTORY_SOURCE_LOCALE_LABELS['en-US']['储物箱'], 'Chest');
});
