import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPECTED_STATIC_DATA_SECTIONS,
  resolveStaticDataPack,
  validateStaticDataPack,
  type StaticDataPack,
} from './staticDataLoader.ts';
import { FISH_CATALOG } from './fish.ts';
import { BASIC_PLANTING_OPTIONS } from './crops.ts';
import { ITEM_CATALOG } from './items.ts';
import { BIRTHDAYS, FESTIVALS } from './calendar.ts';
import { ITEM_ICON_ID_LIST, ITEM_ICON_IDS } from './itemIconIds.ts';
import { PREPARATION_RULES } from './preparationRules.ts';
import { NPC_SOCIAL_DATA } from './npcs.ts';
import { SAVE_PARSING_RULES } from './saveParsingRules.ts';
import { PROCESSING_RULES } from './processingRules.ts';
import { UPGRADE_RULES } from './upgradeRules.ts';

function validPack(overrides: Partial<StaticDataPack> = {}): StaticDataPack {
  return {
    metadata: {
      gameVersion: '1.6.x',
      schemaVersion: '1',
      generatedAt: '2026-06-20T00:00:00.000Z',
      source: 'test fixture',
    },
    sections: {
      fish: [],
      crops: [],
      npcs: [],
      items: [],
      birthdays: [],
      festivals: [],
      communityCenter: [],
      joja: [],
      itemIconIds: [],
      npcSocialData: {
        socialNpcs: [],
        marriageCandidates: [],
        universalGiftPreferences: {
          lovedItemIds: [],
          lovedItemNames: [],
          likedItemIds: [],
          likedItemNames: [],
          neutralItemIds: [],
          neutralItemNames: [],
        },
      },
      saveParsingRules: {
        farmTypes: {},
        weatherValues: [],
        jojaProjectMarkers: [],
        accessMarkers: {
          desert: [],
          islandPlayer: [],
          islandRoot: [],
          volcanoPlayer: [],
          volcanoLocations: [],
          volcanoShortcut: [],
        },
        multiplayerFields: [],
        equipment: {
          fishingRod: { types: [], keywords: [] },
          hoe: { types: [], keywords: [] },
          pickaxe: { types: [], keywords: [] },
          wateringCan: { types: [], keywords: [] },
          trashCan: { types: [], keywords: [] },
          weapon: { types: [], keywords: [] },
          axe: { type: 'Axe', keywords: [], excludeKeywords: [] },
          scythe: { itemIds: [], keywords: [] },
          pan: { type: 'Pan', itemIds: [], names: [] },
          genericNames: [],
          displayNames: {},
          trashCanLevels: [],
          baitKeywords: [],
        },
      },
      preparationRules: {
        bombs: {
          ids: [],
          namesByLanguage: {
            'zh-CN': {},
            'en-US': {},
          },
        },
        staircases: {
          ids: [],
          namesByLanguage: {
            'zh-CN': {},
            'en-US': {},
          },
        },
        sprinklers: {
          ids: [],
          names: [],
        },
      },
      processingRules: [],
      upgradeRules: [],
    },
    ...overrides,
  };
}

test('accepts a valid static data pack', () => {
  const result = validateStaticDataPack(validPack());

  assert.deepEqual(result, {
    ok: true,
    warnings: [],
    missingSections: [],
  });
});

test('preserves explicit item icon id lists and preparation rules from valid packs', () => {
  const pack = validPack({
    sections: {
      fish: [],
      crops: [],
      npcs: [],
      items: [],
      birthdays: [],
      festivals: [],
      communityCenter: [],
      joja: [],
      itemIconIds: ['999'],
      npcSocialData: {
        socialNpcs: [],
        marriageCandidates: [],
        universalGiftPreferences: {
          lovedItemIds: [],
          lovedItemNames: [],
          likedItemIds: [],
          likedItemNames: [],
          neutralItemIds: [],
          neutralItemNames: [],
        },
      },
      saveParsingRules: {
        farmTypes: {},
        weatherValues: [],
        jojaProjectMarkers: [],
        accessMarkers: {
          desert: [],
          islandPlayer: [],
          islandRoot: [],
          volcanoPlayer: [],
          volcanoLocations: [],
          volcanoShortcut: [],
        },
        multiplayerFields: [],
        equipment: {
          fishingRod: { types: [], keywords: [] },
          hoe: { types: [], keywords: [] },
          pickaxe: { types: [], keywords: [] },
          wateringCan: { types: [], keywords: [] },
          trashCan: { types: [], keywords: [] },
          weapon: { types: [], keywords: [] },
          axe: { type: 'Axe', keywords: [], excludeKeywords: [] },
          scythe: { itemIds: [], keywords: [] },
          pan: { type: 'Pan', itemIds: [], names: [] },
          genericNames: [],
          displayNames: {},
          trashCanLevels: [],
          baitKeywords: [],
        },
      },
      preparationRules: {
        bombs: {
          ids: ['999'],
          namesByLanguage: {
            'zh-CN': { '999': '测试炸弹' },
            'en-US': { '999': 'Test Bomb' },
          },
        },
        staircases: {
          ids: ['998'],
          namesByLanguage: {
            'zh-CN': { '998': '测试楼梯' },
            'en-US': { '998': 'Test Staircase' },
          },
        },
        sprinklers: {
          ids: ['997'],
          names: ['测试洒水器'],
        },
      },
      processingRules: [{
        id: 'test-machine',
        machineIds: ['TestMachine'],
        machineNames: ['测试机器'],
        ingredientIds: [1],
        ingredientNames: ['测试原料'],
        title: '测试加工',
        reason: '测试原因',
        priorityForMoneyGoal: 'recommended',
        priorityDefault: 'optional',
        confidence: 'medium',
        uncertainty: '测试不确定性',
      }],
      upgradeRules: [{
        id: 'test-upgrade',
        kind: 'backpack',
        requiredMaxItemsLessThan: 24,
        goldCost: 2000,
        title: '测试升级',
        reason: '测试原因',
        priorityForMoneyGoal: 'recommended',
        priorityDefault: 'recommended',
        confidence: 'high',
        uncertainty: [],
      }],
    },
  });
  const resolved = resolveStaticDataPack(pack);

  assert.deepEqual(resolved.sections.itemIconIds, ['999']);
  assert.deepEqual(resolved.sections.preparationRules, pack.sections.preparationRules);
  assert.deepEqual(resolved.sections.processingRules, pack.sections.processingRules);
  assert.deepEqual(resolved.sections.upgradeRules, pack.sections.upgradeRules);
});

test('rejects a data pack missing metadata without throwing', () => {
  const result = validateStaticDataPack({
    sections: {
      fish: [],
      crops: [],
      npcs: [],
      items: [],
      birthdays: [],
      festivals: [],
      communityCenter: [],
      joja: [],
      itemIconIds: [],
      npcSocialData: {},
      saveParsingRules: {},
      preparationRules: {},
      processingRules: [],
      upgradeRules: [],
    },
  });

  assert.deepEqual(result, {
    ok: false,
    reason: 'missing_metadata',
    warnings: [],
    missingSections: EXPECTED_STATIC_DATA_SECTIONS,
  });
});

test('warns when a data pack targets a different game version', () => {
  const result = validateStaticDataPack(validPack({
    metadata: {
      gameVersion: '1.5.x',
      schemaVersion: '1',
    },
  }), { supportedGameVersion: '1.6.x' });

  assert.deepEqual(result, {
    ok: true,
    warnings: ['game_version_mismatch'],
    missingSections: [],
  });
});

test('warns for missing sections and resolver falls back to built-in data', () => {
  const pack = validPack({
    sections: {
      fish: [{ id: 'fixture-fish' }],
      npcs: [],
      items: [],
      birthdays: [],
      festivals: [],
      communityCenter: [],
      joja: [],
      npcSocialData: {},
      saveParsingRules: {},
    },
  });

  const validation = validateStaticDataPack(pack);
  const resolved = resolveStaticDataPack(pack);

  assert.deepEqual(validation, {
    ok: true,
    warnings: ['missing_section'],
    missingSections: ['crops', 'itemIconIds', 'preparationRules', 'processingRules', 'upgradeRules'],
  });
  assert.equal(resolved.sections.fish, pack.sections.fish);
  assert.equal(resolved.sections.crops, BASIC_PLANTING_OPTIONS);
  assert.equal(resolved.sections.npcs, pack.sections.npcs);
  assert.equal(resolved.sections.items, pack.sections.items);
  assert.equal(resolved.sections.birthdays, pack.sections.birthdays);
  assert.equal(resolved.sections.festivals, pack.sections.festivals);
  assert.deepEqual(resolved.sections.itemIconIds, ITEM_ICON_ID_LIST);
  assert.equal(resolved.sections.npcSocialData, pack.sections.npcSocialData);
  assert.equal(resolved.sections.saveParsingRules, pack.sections.saveParsingRules);
  assert.equal(resolved.sections.preparationRules, PREPARATION_RULES);
  assert.equal(resolved.sections.processingRules, PROCESSING_RULES);
  assert.equal(resolved.sections.upgradeRules, UPGRADE_RULES);
});

test('resolver uses built-in data when pack is invalid', () => {
  const resolved = resolveStaticDataPack({ sections: {} });

  assert.equal(resolved.validation.ok, false);
  assert.equal(resolved.sections.fish, FISH_CATALOG);
  assert.equal(resolved.sections.crops, BASIC_PLANTING_OPTIONS);
  assert.equal(resolved.sections.items, ITEM_CATALOG);
  assert.equal(resolved.sections.birthdays, BIRTHDAYS);
  assert.equal(resolved.sections.festivals, FESTIVALS);
  assert.deepEqual(resolved.sections.itemIconIds, ITEM_ICON_ID_LIST);
  assert.equal(resolved.sections.npcSocialData, NPC_SOCIAL_DATA);
  assert.equal(resolved.sections.saveParsingRules, SAVE_PARSING_RULES);
  assert.equal(resolved.sections.preparationRules, PREPARATION_RULES);
});

test('item icon id helper exposes a set for runtime lookups', () => {
  assert.ok(ITEM_ICON_IDS.has('66'));
  assert.ok(!ITEM_ICON_IDS.has('not-a-real-id'));
});
