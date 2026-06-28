import test from 'node:test';
import assert from 'node:assert/strict';
import { createFriendshipPanelRows } from './friendshipPanelModel.ts';
import type { AppLanguage } from './config/localConfig.ts';
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

test('creates the gift option builder once per panel render and reuses it for all relationships', () => {
  const relationships: RelationshipSummary[] = [
    { npc: 'Robin', points: 500, hearts: 2, giftsThisWeek: 0 },
    { npc: 'Sebastian', points: 1000, hearts: 4, giftsThisWeek: 0 },
  ];
  const inventory: InventoryItem[] = [
    { id: 66, name: 'Amethyst', stack: 2 },
    { id: 72, name: 'Diamond', stack: 1 },
  ];
  const builderCalls: Array<{ inventory: InventoryItem[]; language: AppLanguage | undefined }> = [];
  const relationshipCalls: string[] = [];

  const rows = createFriendshipPanelRows(relationships, inventory, 'zh-CN', {
    createGiftOptionBuilder: (builderInventory: InventoryItem[], builderLanguage?: AppLanguage) => {
      builderCalls.push({ inventory: builderInventory, language: builderLanguage });
      return (relationship: RelationshipSummary) => {
        relationshipCalls.push(relationship.npc);
        return relationship.npc === 'Sebastian'
          ? [{ tier: 'loved', category: '最爱', displayName: '紫水晶', id: 66, stack: 2 }]
          : [];
      };
    },
    hasGiftPreferenceData: () => true,
  });

  assert.equal(builderCalls.length, 1);
  assert.equal(builderCalls[0]?.inventory, inventory);
  assert.equal(builderCalls[0]?.language, 'zh-CN');
  assert.deepEqual(relationshipCalls, ['Sebastian', 'Robin']);
  assert.equal(rows[0]?.giftOptions.length, 1);
  assert.equal(rows[1]?.giftText, '库存暂无匹配礼物');
});
