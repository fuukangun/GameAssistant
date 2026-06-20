import test from 'node:test';
import assert from 'node:assert/strict';
import { groupInventoryBySource } from './inventoryGroups.ts';

test('groups owned inventory by item source with source labels', () => {
  const groups = groupInventoryBySource([
    { id: 66, name: '紫水晶', stack: 2, source: 'backpack', sourceLabel: '背包' },
    { id: 388, name: '木材', stack: 50, source: 'chest', sourceLabel: '储物箱' },
    { id: 196, name: '沙拉', stack: 1, source: 'fridge', sourceLabel: '冰箱' },
  ]);

  assert.deepEqual(groups.map((group) => group.label), ['背包', '储物箱', '冰箱']);
  assert.deepEqual(groups[0].items.map((item) => item.name), ['紫水晶']);
  assert.deepEqual(groups[1].items.map((item) => item.name), ['木材']);
  assert.deepEqual(groups[2].items.map((item) => item.name), ['沙拉']);
});

test('sorts grouped inventory by name', () => {
  const groups = groupInventoryBySource([
    { id: 388, name: '木材', stack: 50, source: 'chest' },
    { id: 66, name: '紫水晶', stack: 2, source: 'chest' },
  ]);

  assert.deepEqual(groups[0].items.map((item) => item.name), ['木材', '紫水晶']);
});
