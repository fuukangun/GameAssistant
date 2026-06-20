import test from 'node:test';
import assert from 'node:assert/strict';
import { INVENTORY_SOURCE_LABELS } from './inventorySourceLabels.ts';
import inventorySourceLabels from './inventorySourceLabels.json' with { type: 'json' };

test('loads inventory source labels from external JSON data', () => {
  assert.deepEqual(INVENTORY_SOURCE_LABELS, inventorySourceLabels);
  assert.equal(INVENTORY_SOURCE_LABELS.backpack, '背包');
  assert.equal(INVENTORY_SOURCE_LABELS.unknown, '其他');
});
