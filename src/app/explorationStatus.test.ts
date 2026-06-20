import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createExplorationProgressSections,
  createExplorationStatusItems,
  formatFishingAccessStatus,
  formatProgressionStatus,
  formatSeedAndPlotStatus,
  formatShopAvailability,
  formatSprinklerStatus,
} from './explorationStatus.ts';
import type { StardewSaveSnapshot } from '../shared/types.ts';

test('creates exploration progress sections in stable order without food or weapon primary items', () => {
  const sections = createExplorationProgressSections(explorationSnapshot(), 'rainy');

  assert.deepEqual(sections.map((section) => section.id), [
    'mapUnlocks',
    'mineProgress',
  ]);
  assert.deepEqual(sections.map((section) => section.title), [
    '地图解锁',
    '矿洞进度',
  ]);
  assert.equal(sections.some((section) => section.items.some((item) => /食物|武器|Food|Weapon/.test(item.label))), false);
});

test('summarizes desert and ginger island map unlocks', () => {
  const section = createExplorationProgressSections(explorationSnapshot({
    farm: {
      hasDesertAccess: true,
      hasIslandAccess: false,
    },
  }), 'rainy').find((item) => item.id === 'mapUnlocks');

  assert.deepEqual(section?.items, [
    { label: '沙漠', value: '已开放' },
    { label: '姜岛', value: '未开放' },
  ]);
});

test('summarizes mine, skull cavern, and volcano dungeon progress', () => {
  const section = createExplorationProgressSections(explorationSnapshot({
    farm: {
      hasDesertAccess: true,
      hasIslandAccess: true,
      hasSkullCavernAccess: true,
      hasVolcanoDungeonAccess: true,
      mineLevel: 85,
      skullCavernLevel: 12,
    },
  }), 'rainy').find((item) => item.id === 'mineProgress');

  assert.deepEqual(section?.items, [
    { label: '矿洞', value: '最深 85 层' },
    { label: '骷髅洞穴', value: '最深 12 层' },
    { label: '火山地牢', value: '已开放' },
  ]);
});

test('formats exploration progress sections in English', () => {
  const sections = createExplorationProgressSections(explorationSnapshot({
    farm: {
      hasDesertAccess: true,
      hasIslandAccess: false,
      hasSkullCavernAccess: true,
      hasVolcanoDungeonAccess: false,
      mineLevel: 85,
      skullCavernLevel: 12,
      communityCenterRoute: 'community_center',
    },
  }), 'rainy', 'en-US');

  assert.deepEqual(sections.map((section) => section.title), [
    'Map Unlocks',
    'Mine Progress',
  ]);
  assert.deepEqual(sections[0]?.items, [
    { label: 'Desert', value: 'Open' },
    { label: 'Ginger Island', value: 'Closed' },
  ]);
  assert.deepEqual(sections[1]?.items, [
    { label: 'Mine', value: 'Deepest 85 floor' },
    { label: 'Skull Cavern', value: 'Deepest 12 floor' },
    { label: 'Volcano Dungeon', value: 'Closed' },
  ]);
});

test('describes Pierre closed on Wednesdays', () => {
  assert.equal(formatShopAvailability({ year: 1, season: 'spring', day: 3 }), '皮埃尔：周三休息；Joja：通常开放');
});

test('describes Pierre open on non-Wednesday days', () => {
  assert.equal(formatShopAvailability({ year: 1, season: 'spring', day: 4 }), '皮埃尔：通常开放；Joja：通常开放');
});

test('describes festival impact on shop availability', () => {
  assert.equal(formatShopAvailability({ year: 1, season: 'summer', day: 28 }), '节日当天，商店营业可能受影响');
});

test('describes festival impact on shop availability in English', () => {
  assert.equal(formatShopAvailability({ year: 1, season: 'summer', day: 28 }, 'en-US'), 'Festival day; shop hours may be affected');
});

test('detects sprinklers from global inventory', () => {
  assert.equal(formatSprinklerStatus(snapshotWithInventory([
    { id: 621, name: 'Quality Sprinkler', stack: 2 },
  ])), '检测到洒水器');
});

test('detects sprinklers from global inventory in English', () => {
  assert.equal(formatSprinklerStatus(snapshotWithInventory([
    { id: 621, name: 'Quality Sprinkler', stack: 2 },
  ]), 'en-US'), 'Sprinkler detected');
});

test('describes missing sprinklers when global inventory has no sprinkler item', () => {
  assert.equal(formatSprinklerStatus(snapshotWithInventory([
    { id: 66, name: '紫水晶', stack: 4 },
  ])), '未检测到洒水器');
});

test('keeps sprinkler status pending when snapshot lacks inventory structure', () => {
  assert.equal(formatSprinklerStatus({} as StardewSaveSnapshot), '待解析');
});

test('keeps sprinkler status pending when snapshot lacks inventory structure in English', () => {
  assert.equal(formatSprinklerStatus({} as StardewSaveSnapshot, 'en-US'), 'Pending');
});

test('describes recognized seeds while keeping empty plots unparsed', () => {
  assert.equal(formatSeedAndPlotStatus({
    inventory: [
      { id: 472, name: '防风草种子', stack: 12, sourceLabel: '储物箱' },
    ],
    crops: [
      { id: 24, name: '防风草', isReady: false, quantity: 8, sellPrice: 35 },
    ],
  } as StardewSaveSnapshot), '已解析作物 8 株；已识别种子：防风草种子 x12（储物箱）；空地未精确解析');
});

test('describes recognized seeds while keeping empty plots unparsed in English', () => {
  assert.equal(formatSeedAndPlotStatus({
    inventory: [
      { id: 472, name: '防风草种子', stack: 12, sourceLabel: '储物箱' },
    ],
    crops: [
      { id: 24, name: '防风草', isReady: false, quantity: 8, sellPrice: 35 },
    ],
  } as StardewSaveSnapshot, 'en-US'), 'Parsed crops: 8; Recognized seeds: Parsnip Seeds x12 (Chest); plots not precisely parsed');
});

test('describes parsed tilled empty plots in seed and plot status', () => {
  assert.equal(formatSeedAndPlotStatus({
    inventory: [
      { id: 472, name: '防风草种子', stack: 12, sourceLabel: '储物箱' },
    ],
    crops: [
      { id: 24, name: '防风草', isReady: false, quantity: 8, sellPrice: 35 },
    ],
    farmPlotSummary: {
      plantedCropCount: 8,
      tilledTileCount: 12,
      emptyTileCount: 4,
      occupiedObjectCount: 1,
      resourceClumpCount: 0,
      buildingCount: 0,
      parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
      unknownFields: ['farmableTileCount', 'buildingFootprints'],
    },
  } as StardewSaveSnapshot), '已解析作物 8 株；已识别种子：防风草种子 x12（储物箱）；已耕空地 4 块');
});

test('describes parsed tilled empty plots in seed and plot status in English', () => {
  assert.equal(formatSeedAndPlotStatus({
    inventory: [
      { id: 472, name: '防风草种子', stack: 12, sourceLabel: '储物箱' },
    ],
    crops: [
      { id: 24, name: '防风草', isReady: false, quantity: 8, sellPrice: 35 },
    ],
    farmPlotSummary: {
      plantedCropCount: 8,
      tilledTileCount: 12,
      emptyTileCount: 4,
      occupiedObjectCount: 1,
      resourceClumpCount: 0,
      buildingCount: 0,
      parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
      unknownFields: ['farmableTileCount', 'buildingFootprints'],
    },
  } as StardewSaveSnapshot, 'en-US'), 'Parsed crops: 8; Recognized seeds: Parsnip Seeds x12 (Chest); tilled empty plots: 4');
});

test('describes missing known seeds while keeping empty plots unparsed', () => {
  assert.equal(formatSeedAndPlotStatus(snapshotWithInventory([
    { id: 66, name: '紫水晶', stack: 4 },
  ])), '未识别到已支持种子；空地未精确解析');
});

test('describes parsed fishing equipment with supported fish from fish rules', () => {
  const snapshot = {
    time: { year: 1, season: 'spring', day: 5 },
    player: {
      equipment: {
        ringNames: [],
        fishingRodName: 'Fiberglass Rod',
        baitName: 'Bait',
      },
    },
  } as unknown as StardewSaveSnapshot;

  const status = formatFishingAccessStatus(snapshot, 'rainy');
  assert.match(status, /鱼竿：玻璃纤维鱼竿/);
  assert.match(status, /鱼饵：鱼饵/);
  assert.match(status, /鲶鱼/);
  assert.match(status, /仅展示前8种已支持鱼类/);
});

test('describes parsed fishing equipment with supported fish from fish rules in English', () => {
  const snapshot = {
    time: { year: 1, season: 'spring', day: 5 },
    player: {
      equipment: {
        ringNames: [],
        fishingRodName: 'Glass Fiber Rod',
        baitName: 'Bait',
      },
    },
  } as unknown as StardewSaveSnapshot;

  const status = formatFishingAccessStatus(snapshot, 'rainy', 'en-US');
  assert.match(status, /Rod：Glass Fiber Rod|Rod: Glass Fiber Rod/);
  assert.match(status, /Bait：Bait|Bait: Bait/);
  assert.match(status, /Supported fish:/);
});

test('localizes supported fish names, locations, and all-day window in English', () => {
  const snapshot = {
    time: { year: 1, season: 'spring', day: 5 },
    farm: {
      hasDesertAccess: false,
      hasIslandAccess: false,
    },
    player: {
      equipment: {
        ringNames: [],
        fishingRodName: 'Bamboo Pole',
        baitName: undefined,
      },
    },
  } as unknown as StardewSaveSnapshot;

  const status = formatFishingAccessStatus(snapshot, 'sunny', 'en-US');

  assert.match(status, /Anchovy \(Ocean, Any time\)/);
  assert.match(status, /Largemouth Bass \(Mountain Lake, 06:00-19:00\)/);
  assert.doesNotMatch(status, /[\u4e00-\u9fff]/);
});

test('describes route progression for community center saves', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'community_center' },
    progression: { communityCenter: { completed: false, percentage: 68 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot), '社区中心：约68%完成');
});

test('describes route progression for community center saves in English', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'community_center' },
    progression: { communityCenter: { completed: false, percentage: 68 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot, 'en-US'), 'Community Center: about 68% complete');
});

test('includes community center deliverable count when inventory can satisfy bundle items', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'community_center' },
    inventory: [
      { id: 24, name: '防风草', stack: 1 },
      { id: 388, name: '木材', stack: 120 },
    ],
    progression: { communityCenter: { completed: false, percentage: 68 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot), '社区中心：约68%完成；库存可交付 2 项');
});

test('includes community center deliverable count when inventory can satisfy bundle items in English', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'community_center' },
    inventory: [
      { id: 24, name: '防风草', stack: 1 },
      { id: 388, name: '木材', stack: 120 },
    ],
    progression: { communityCenter: { completed: false, percentage: 68 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot, 'en-US'), 'Community Center: about 68% complete; 2 deliverable items in inventory');
});

test('describes route progression for joja saves', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'joja' },
    progression: { joja: { completedProjects: 2, totalProjects: 5 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot), 'Joja项目：2/5 已购买');
});

test('describes route progression for joja saves in English', () => {
  const snapshot = {
    farm: { communityCenterRoute: 'joja' },
    progression: { joja: { completedProjects: 2, totalProjects: 5 } },
  } as unknown as StardewSaveSnapshot;

  assert.equal(formatProgressionStatus(snapshot, 'en-US'), 'Joja projects: 2/5 purchased');
});

test('creates exploration status items without preparation-only fields', () => {
  const snapshot = {
    time: { year: 2, season: 'winter', day: 12 },
    farm: {
      hasDesertAccess: true,
      hasIslandAccess: false,
      communityCenterRoute: 'community_center',
    },
    player: {
      health: 120,
      maxHealth: 140,
      equipment: {
        ringNames: [],
        weaponName: 'Galaxy Sword',
      },
    },
    inventory: [
      { id: 216, name: '面包', stack: 3, isEdible: true },
      { id: 472, name: '防风草种子', stack: 12 },
    ],
    progression: {
      communityCenter: { completed: false, percentage: 68 },
    },
  } as unknown as StardewSaveSnapshot;

  const items = createExplorationStatusItems(snapshot, 'snowy');

  assert.deepEqual(items.map((item) => item.label), [
    '商店是否开放',
    '种子与空地',
    '洒水条件',
    '水域与鱼类窗口',
    '沙漠',
    '姜岛',
    '路线进度',
  ]);
});

test('creates exploration status items in English without Chinese labels', () => {
  const snapshot = {
    time: { year: 2, season: 'winter', day: 12 },
    farm: {
      hasDesertAccess: true,
      hasIslandAccess: false,
      communityCenterRoute: 'community_center',
    },
    player: {
      health: 120,
      maxHealth: 140,
      equipment: {
        ringNames: [],
        weaponName: 'Galaxy Sword',
      },
    },
    inventory: [
      { id: 216, name: '面包', stack: 3, isEdible: true },
      { id: 472, name: '防风草种子', stack: 12 },
    ],
    progression: {
      communityCenter: { completed: false, percentage: 68 },
    },
  } as unknown as StardewSaveSnapshot;

  const items = createExplorationStatusItems(snapshot, 'snowy', 'en-US');

  assert.deepEqual(items.map((item) => item.label), [
    'Shop Availability',
    'Seeds and Plots',
    'Sprinklers',
    'Water and Fish Windows',
    'Desert',
    'Ginger Island',
    'Route Progress',
  ]);
  assert.match(items[1]?.value ?? '', /Recognized seeds:/);
  assert.equal(items.some((item) => /商店是否开放|种子与空地|洒水条件|水域与鱼类窗口|路线进度/.test(item.label)), false);
});

function snapshotWithInventory(inventory: StardewSaveSnapshot['inventory']): StardewSaveSnapshot {
  return { inventory } as StardewSaveSnapshot;
}

function explorationSnapshot(overrides: {
  farm?: Partial<StardewSaveSnapshot['farm']>;
  progression?: StardewSaveSnapshot['progression'];
} = {}): StardewSaveSnapshot {
  return {
    time: { year: 1, season: 'spring', day: 5 },
    farm: {
      farmName: 'Vanilla',
      playerName: 'Player',
      farmType: 'standard',
      hasDesertAccess: true,
      hasIslandAccess: false,
      mineLevel: 40,
      communityCenterRoute: 'community_center',
      ...overrides.farm,
    },
    player: {
      maxEnergy: 270,
      maxItems: 36,
      equipment: {
        ringNames: [],
        weaponName: 'Galaxy Sword',
        fishingRodName: '玻璃纤维鱼竿',
        baitName: '鱼饵',
      },
    },
    inventory: [
      { id: 216, name: '面包', stack: 3, isEdible: true },
    ],
    progression: overrides.progression ?? {
      communityCenter: { completed: false, percentage: 68 },
    },
  } as unknown as StardewSaveSnapshot;
}
