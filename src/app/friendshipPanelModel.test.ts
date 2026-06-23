import test from 'node:test';
import assert from 'node:assert/strict';
import { createFriendshipPanelRows } from './friendshipPanelModel.ts';
import type { InventoryItem, RelationshipSummary } from '../shared/types.ts';

test('builds gift options once per relationship for the friendship panel', () => {
  const relationships: RelationshipSummary[] = [
    { npc: 'Robin', points: 500, hearts: 2, giftsThisWeek: 0 },
    { npc: 'Sebastian', points: 1000, hearts: 4, giftsThisWeek: 0 },
  ];
  const inventory: InventoryItem[] = [
    { id: 66, name: 'Amethyst', stack: 2 },
    { id: 72, name: 'Diamond', stack: 1 },
  ];
  const calls: string[] = [];

  const rows = createFriendshipPanelRows(relationships, inventory, 'zh-CN', {
    buildGiftOptions: (relationship) => {
      calls.push(relationship.npc);
      return relationship.npc === 'Sebastian'
        ? [{ tier: 'loved', category: '最爱', displayName: '紫水晶', id: 66, stack: 2 }]
        : [];
    },
    hasGiftPreferenceData: () => true,
  });

  assert.deepEqual(calls, ['Sebastian', 'Robin']);
  assert.equal(rows[0]?.relationship.npc, 'Sebastian');
  assert.equal(rows[0]?.giftOptions.length, 1);
  assert.equal(rows[1]?.giftText, '库存暂无匹配礼物');
});
