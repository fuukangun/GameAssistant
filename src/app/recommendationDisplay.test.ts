import test from 'node:test';
import assert from 'node:assert/strict';
import type { RecommendationItem } from '../shared/types.ts';
import { RECOMMENDATION_LOCALIZATION } from '../stardew/data/recommendationLocalization.ts';
import { NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES } from '../stardew/data/npcs.ts';
import { getItemNameById } from '../stardew/data/items.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { generatePlan } from '../stardew/planner/generatePlan.ts';
import {
  localizeCommunityCenterBundleName,
  localizeCommunityCenterItemName,
  localizeCommunityCenterRoomName,
  localizeRecommendationItem,
} from './recommendationDisplay.ts';

test('localizes community center recommendation card content to English', () => {
  const item: RecommendationItem = {
    id: 'community-center-deliverables',
    title: '去社区中心交付库存物品',
    category: 'collection',
    priority: 'recommended',
    confidence: 'medium',
    reason: '社区中心仍有未完成内容，且当前库存中存在可用于收集包的物品；顺路交付可以推进路线进度。',
    evidence: [
      { source: 'derived', label: '社区中心进度', value: '约68%完成' },
      { source: 'save', label: '可交付物品', value: '防风草 x1（春季作物收集包）、木材 x99（建筑收集包）' },
    ],
    uncertainty: ['已按存档中的收集包完成标记过滤已完成收集包；具体需求仍基于内置原版收集包目录匹配。'],
    detail: {
      communityCenterDeliverables: [
        {
          roomName: '茶水间',
          bundleName: '春季作物收集包',
          itemId: 24,
          itemName: '防风草',
          requiredStack: 1,
          availableStack: 1,
        },
        {
          roomName: '工艺室',
          bundleName: '建筑收集包',
          itemId: 388,
          itemName: '木材',
          requiredStack: 99,
          availableStack: 120,
        },
      ],
    },
  };

  const localized = localizeRecommendationItem(item, 'en-US');

  assert.equal(localized.title, 'Deliver owned items to the Community Center');
  assert.equal(localized.evidence[0]?.label, 'Community Center Progress');
  assert.equal(localized.evidence[0]?.value, 'About 68% complete');
  assert.equal(localized.evidence[1]?.label, 'Deliverable Items');
  assert.equal(localized.evidence[1]?.value, 'Parsnip x1 (Spring Crops Bundle), Wood x99 (Construction Bundle)');
  assert.match(localized.uncertainty.join(' '), /save bundle completion flags/);
});

test('localizes community center detail names to English', () => {
  assert.equal(localizeCommunityCenterRoomName('茶水间', 'en-US'), 'Pantry');
  assert.equal(localizeCommunityCenterRoomName('布告栏', 'en-US'), 'Bulletin Board');
  assert.equal(localizeCommunityCenterBundleName('建筑收集包', 'en-US'), 'Construction Bundle');
  assert.equal(localizeCommunityCenterItemName(80, '石英', 'en-US'), 'Quartz');
  assert.equal(localizeCommunityCenterItemName(24, '防风草', 'zh-CN'), '防风草');
});

test('localizes birthday recommendations without claiming the gift is always loved', () => {
  const localized = localizeRecommendationItem({
    id: 'birthday-sebastian',
    title: '给Sebastian送Quartz',
    category: 'reminder',
    priority: 'must_do',
    confidence: 'high',
    reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
    evidence: [
      { source: 'static_data', label: '生日', value: '秋季 第11日' },
      { source: 'save', label: '库存物品', value: 'Quartz x3（背包）' },
    ],
    uncertainty: ['未确认游戏内今日是否已经送礼。'],
  }, 'en-US');

  assert.equal(localized.reason.includes('loved gift'), false);
  assert.match(localized.reason, /best recognized gift/);
  assert.equal(localized.evidence[0]?.value, 'Fall Day 11');
});

test('localizes Chinese birthday gift item names to English by item id', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 1, season: 'winter', day: 23, sourceSaveDate: { year: 1, season: 'winter', day: 23 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 1, season: 'winter', day: 23 },
      inventory: [
        { id: 416, name: '雪山药', stack: 7, source: 'backpack', sourceLabel: '背包' },
      ],
      crops: [],
    },
  });

  const localizedText = plan.reminders
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
    }))
    .join('\n');

  assert.match(localizedText, /Give Snow Yam to Leah/);
  assert.match(localizedText, /Snow Yam x7\(Backpack\)/);
  assert.doesNotMatch(localizedText, /[\u4e00-\u9fff]/);
  assert.doesNotMatch(localizedText, /雪Yam/);
});

test('localizes birthday gift names that only exist in external text translations', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 7, season: 'summer', day: 8, sourceSaveDate: { year: 7, season: 'summer', day: 8 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 7, season: 'summer', day: 8 },
      inventory: [
        { id: 446, name: '兔脚', stack: 6, source: 'chest', sourceLabel: '储物箱' },
      ],
      crops: [],
    },
  });

  const localizedText = plan.reminders
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
    }))
    .join('\n');

  assert.match(localizedText, /Give Rabbit's Foot to Gus/);
  assert.match(localizedText, /Rabbit's Foot x6\(Chest\)/);
  assert.doesNotMatch(localizedText, /[\u4e00-\u9fff]/);
});

test('reverse-localizes external English text name mappings in English recommendation output', () => {
  const untranslated = Object.entries(RECOMMENDATION_LOCALIZATION.englishTextNames)
    .filter(([, chineseName]) => /[\u4e00-\u9fff]/.test(chineseName))
    .filter(([englishName, chineseName]) => {
      const localized = localizeRecommendationItem({
        id: 'birthday-gus',
        title: `给Gus送${chineseName}`,
        category: 'reminder',
        priority: 'must_do',
        confidence: 'high',
        reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
        evidence: [
          { source: 'save', label: '库存物品', value: `${chineseName} x1（储物箱）` },
        ],
        uncertainty: [],
      }, 'en-US');

      const text = JSON.stringify(localized);
      return text.includes(chineseName) || /[\u4e00-\u9fff]/.test(text);
    });

  assert.deepEqual(untranslated, []);
});

test('does not leak Chinese catalog names for positive gift preference item ids in English birthday reminders', () => {
  const positiveGiftIds = new Set<string>();
  for (const preference of [...NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES]) {
    for (const key of ['lovedItemIds', 'likedItemIds', 'neutralItemIds'] as const) {
      for (const itemId of preference[key] ?? []) {
        positiveGiftIds.add(String(itemId).replace(/^\([^)]+\)/, ''));
      }
    }
  }

  const leaked = [...positiveGiftIds]
    .sort((left, right) => Number(left) - Number(right))
    .map((itemId) => ({ itemId, name: getItemNameById(itemId) }))
    .filter((item): item is { itemId: string; name: string } => {
      return typeof item.name === 'string' && /[\u4e00-\u9fff]/.test(item.name);
    })
    .filter(({ name }) => {
      const localized = localizeRecommendationItem({
        id: 'birthday-gus',
        title: `给Gus送${name}`,
        category: 'reminder',
        priority: 'must_do',
        confidence: 'high',
        reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
        evidence: [
          { source: 'save', label: '库存物品', value: `${name} x1（储物箱）` },
        ],
        uncertainty: [],
      }, 'en-US');

      return /[\u4e00-\u9fff]/.test(JSON.stringify(localized));
    });

  assert.deepEqual(leaked, []);
});

test('localizes processed birthday gift text to Chinese', () => {
  const localized = localizeRecommendationItem({
    id: 'birthday-harvey',
    title: '给Harvey送Pickles',
    category: 'reminder',
    priority: 'must_do',
    confidence: 'high',
    reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
    evidence: [
      { source: 'static_data', label: '生日', value: '冬季 第14日' },
      { source: 'save', label: '库存物品', value: 'Pickles x4（储物箱）' },
    ],
    uncertainty: ['未确认游戏内今日是否已经送礼。'],
  }, 'zh-CN');

  const text = JSON.stringify(localized);

  assert.match(text, /给哈维送腌菜/);
  assert.match(text, /腌菜 x4（储物箱）/);
  assert.doesNotMatch(text, /\b(Harvey|Pickles)\b/);
});

test('localizes generated recommendation card text to Chinese when save names are English', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 3, season: 'fall', day: 11, sourceSaveDate: { year: 3, season: 'fall', day: 11 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 3, season: 'fall', day: 11 },
      inventory: [
        { id: 72, name: 'Diamond', stack: 3, source: 'chest', sourceLabel: '储物箱' },
        { id: 216, name: 'Bread', stack: 2, isEdible: true, source: 'backpack', sourceLabel: '背包' },
      ],
      crops: [
        { id: 258, name: 'Blueberry', isReady: true, quantity: 12, sellPrice: 50 },
      ],
      player: {
        ...demoSnapshot.player,
        equipment: {
          ...demoSnapshot.player.equipment,
          fishingRodName: 'Fiberglass Rod',
          baitName: 'Bait x24',
          weaponName: 'Crystal Dagger',
        },
      },
      farm: {
        ...demoSnapshot.farm,
        mineLevel: 40,
      },
    },
  });

  const localizedText = [...plan.reminders, ...plan.actions]
    .map((item) => localizeRecommendationItem(item, 'zh-CN'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
      estimate: item.estimate?.description,
    }))
    .join('\n');

  assert.match(localizedText, /乔迪/);
  assert.match(localizedText, /钻石/);
  assert.match(localizedText, /蓝莓/);
  assert.match(localizedText, /玻璃纤维鱼竿/);
  assert.match(localizedText, /鱼饵 x24/);
  assert.match(localizedText, /水晶匕首/);
  assert.match(localizedText, /面包/);
  assert.doesNotMatch(localizedText, /\b(Jodi|Diamond|Blueberry|Fiberglass Rod|Bait|Crystal Dagger|Bread)\b/);
});

test('does not leak common english item names into Chinese recommendations', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 3, season: 'fall', day: 11, sourceSaveDate: { year: 3, season: 'fall', day: 11 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 3, season: 'fall', day: 11 },
      inventory: [
        { id: 72, name: 'Diamond', stack: 3, source: 'chest', sourceLabel: '储物箱' },
        { id: 216, name: 'Bread', stack: 2, isEdible: true, source: 'backpack', sourceLabel: '背包' },
        { id: 416, name: 'Snow Yam', stack: 5, isEdible: true, source: 'chest', sourceLabel: '储物箱' },
        { id: 418, name: 'Crocus', stack: 5, isEdible: true, source: 'chest', sourceLabel: '储物箱' },
      ],
      crops: [
        { id: 258, name: 'Blueberry', isReady: true, quantity: 12, sellPrice: 50 },
      ],
      player: {
        ...demoSnapshot.player,
        equipment: {
          ...demoSnapshot.player.equipment,
          fishingRodName: 'Fiberglass Rod',
          baitName: 'Bait x24',
          weaponName: 'Crystal Dagger',
        },
      },
      farm: {
        ...demoSnapshot.farm,
        mineLevel: 40,
      },
    },
  });

  const localizedText = [...plan.reminders, ...plan.actions]
    .map((item) => localizeRecommendationItem(item, 'zh-CN'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
      estimate: item.estimate?.description,
    }))
    .join('\n');

  assert.match(localizedText, /钻石/);
  assert.match(localizedText, /面包/);
  assert.match(localizedText, /雪山药/);
  assert.match(localizedText, /番红花/);
  assert.match(localizedText, /蓝莓/);
  assert.doesNotMatch(localizedText, /\b(Diamond|Bread|Snow Yam|Crocus|Blueberry)\b/);
});

test('localizes English item names through the item catalog when Chinese recommendation data is incomplete', () => {
  const localized = localizeRecommendationItem({
    id: 'manual-inventory-check',
    title: '检查库存',
    category: 'reminder',
    priority: 'optional',
    confidence: 'medium',
    reason: '测试推荐',
    evidence: [
      { source: 'save', label: '库存物品', value: 'Copper Bar x5（储物箱）, Iron Bar x3（背包）' },
      { source: 'save', label: '食物', value: 'Miner\'s Treat x1（冰箱）' },
    ],
    uncertainty: [],
  }, 'zh-CN');

  const text = JSON.stringify(localized.evidence);

  assert.match(text, /铜锭 x5/);
  assert.match(text, /铁锭 x3/);
  assert.match(text, /矿工点心 x1/);
  assert.doesNotMatch(text, /\b(Copper Bar|Iron Bar|Miner's Treat)\b/);
});

test('localizes new collection and animal feed recommendation text to English', () => {
  const items: RecommendationItem[] = [
    {
      id: 'collect-ready-processed-goods',
      title: '收取加工产物',
      category: 'profit',
      priority: 'recommended',
      confidence: 'medium',
      reason: '存档显示部分加工设备已有成品可收取，及时收取可以释放机器继续加工。',
      evidence: [
        { source: 'save', label: '加工产物', value: '果酒 x2（小桶）' },
      ],
      uncertainty: ['如果你进入游戏后已经收取，请忽略此建议。'],
    },
    {
      id: 'collect-animal-products',
      title: '收取动物产物',
      category: 'profit',
      priority: 'recommended',
      confidence: 'medium',
      reason: '存档显示动物有可收取产物，建议顺手收取并根据需要加工。',
      evidence: [
        { source: 'save', label: '动物产物', value: '牛奶 x1（奶牛）、鸡蛋 x3（鸡）' },
      ],
      uncertainty: ['是否已经挤奶、剪毛、捡蛋或使用自动采集器仍需按游戏内确认。'],
    },
    {
      id: 'animal-feed-low',
      title: '动物饲料不足两天',
      category: 'risk',
      priority: 'recommended',
      confidence: 'medium',
      reason: '当前干草库存不足两天动物消耗，建议割草、购买干草或检查筒仓，避免动物停止产出。',
      evidence: [
        { source: 'save', label: '动物数量', value: '4' },
        { source: 'save', label: '干草库存', value: '6' },
        { source: 'derived', label: '剩余天数', value: '1天' },
      ],
      uncertainty: ['动物是否已放牧吃草、自动喂食器状态和当天是否已喂食仍需按游戏内确认。'],
    },
  ];

  const localizedText = items
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
    }))
    .join('\n');

  assert.match(localizedText, /Processed Goods/);
  assert.match(localizedText, /Animal Products/);
  assert.match(localizedText, /Days Remaining/);
  assert.match(localizedText, /Wine x2/);
  assert.match(localizedText, /Milk x1/);
  assert.doesNotMatch(localizedText, /收取|加工产物|动物产物|干草库存|剩余天数|牛奶|鸡蛋|小桶/);
});

test('localizes produced item evidence and details to Chinese without leaking source names', () => {
  const localized = localizeRecommendationItem({
    id: 'collect-ready-processed-goods',
    title: '收取加工产物',
    category: 'profit',
    priority: 'recommended',
    confidence: 'medium',
    reason: '存档显示部分加工设备已有成品可收取，及时收取可以释放机器继续加工。',
    evidence: [
      { source: 'save', label: '加工产物', value: 'Common Mushroom x1（Mushroom Box）、Wine x2（Keg）、Cheese x1（Cheese Press）等4项' },
    ],
    uncertainty: ['如果你进入游戏后已经收取，请忽略此建议。'],
    detail: {
      producedItems: [
        { itemId: 404, itemName: 'Common Mushroom', quantity: 1, sourceName: 'Mushroom Box' },
        { itemId: 724, itemName: 'Maple Syrup', quantity: 1, sourceName: 'Tapper' },
        { itemId: 725, itemName: 'Oak Resin', quantity: 1, sourceName: 'Tapper' },
        { itemId: 348, itemName: 'Wine', quantity: 2, sourceName: 'Keg' },
        { itemId: 424, itemName: 'Cheese', quantity: 1, sourceName: 'Cheese Press' },
      ],
    },
  }, 'zh-CN');

  const text = JSON.stringify(localized);

  assert.match(text, /普通蘑菇 x1（蘑菇箱）/);
  assert.match(text, /枫糖浆/);
  assert.match(text, /橡树树脂/);
  assert.match(text, /树液采集器/);
  assert.match(text, /果酒 x2（小桶）/);
  assert.match(text, /奶酪 x1（奶酪压制机）/);
  assert.doesNotMatch(text, /\b(Common Mushroom|Mushroom Box|Maple Syrup|Oak Resin|Tapper|Wine|Keg|Cheese Press)\b/);
});

test('localizes produced item detail edge sources and item names to Chinese', () => {
  const localized = localizeRecommendationItem({
    id: 'collect-ready-processed-goods',
    title: '收取加工产物',
    category: 'profit',
    priority: 'recommended',
    confidence: 'medium',
    reason: '存档显示部分加工设备已有成品可收取，及时收取可以释放机器继续加工。',
    evidence: [
      { source: 'save', label: '加工产物', value: 'Taro Root Juice x191（Keg）、Chest x6（Auto-Grabber）、Tear Crystal x5（Crystalarium）' },
    ],
    uncertainty: ['如果你进入游戏后已经收取，请忽略此建议。'],
    detail: {
      producedItems: [
        { itemId: 350, itemName: 'Taro Root Juice', quantity: 191, sourceName: 'Keg' },
        { itemId: 130, itemName: 'Chest', quantity: 6, sourceName: 'Auto-Grabber' },
        { itemId: 84, itemName: 'Tear Crystal', quantity: 5, sourceName: 'Crystalarium' },
      ],
    },
  }, 'zh-CN');

  const text = JSON.stringify(localized);

  assert.match(text, /芋头汁 x191（小桶）/);
  assert.match(text, /宝箱 x6（自动采集器）/);
  assert.match(text, /泪晶 x5（水晶复制机）/);
  assert.doesNotMatch(text, /\b(Taro Root Juice|Chest|Auto-Grabber|Tear Crystal|Crystalarium|Keg)\b/);
});

test('localizes produced item names and sources found in real save scans to Chinese', () => {
  const localized = localizeRecommendationItem({
    id: 'collect-ready-processed-goods',
    title: '收取加工产物',
    category: 'profit',
    priority: 'recommended',
    confidence: 'medium',
    reason: '存档显示部分加工设备已有成品可收取，及时收取可以释放机器继续加工。',
    evidence: [
      {
        source: 'save',
        label: '加工产物',
        value: [
          'Duck Feather x3（Auto-Grabber）',
          'Golden Egg x1（Incubator）',
          'Joja Cola x1（Soda Machine）',
          'Battery Pack x2（Lightning Rod）',
          'Strawberry Jelly x2（Preserves Jar）',
          'Ancient Fruit Wine x9（Keg）',
          'Ancient Fruit Wine x1（Cask）',
          'Honey x1（Bee House）',
          'Bait x2（Worm Bin）',
          'Dinosaur Mayonnaise x1（Mayonnaise Machine）',
          'Coffee x2（Coffee Maker）',
          'Large Egg x2（Auto-Grabber）',
          'Large Milk x3（Auto-Grabber）',
          "Rabbit's Foot x1（Auto-Grabber）",
          'Chanterelle x1（Mushroom Box）',
          'Iridium Ore x2（Statue Of Perfection）',
          'Pressure Nozzle x1（Iridium Sprinkler）',
          'Void Egg x1（Incubator）',
          'Void Mayonnaise x1（Mayonnaise Machine）',
          'Aged Void Salmon Roe x1（Preserves Jar）',
          'Mayonnaise x1（Mayonnaise Machine）',
          'Duck Mayonnaise x1（Mayonnaise Machine）',
          'Diamond x1（Statue Of Endless Fortune）',
          'Morel x1（Mushroom Box）',
          'Grape Wine x1（Keg）',
          'Aged Lava Eel Roe x1（Preserves Jar）',
          'Aged Slimejack Roe x1（Preserves Jar）',
          'Wild Honey x1（Bee House）',
          'Trash x1（Crab Pot）',
          'Green Tea x1（Keg）',
          'Driftwood x1（Crab Pot）',
          'Red Mushroom x1（Mushroom Box）',
          'Tigerseye x5（Crystalarium）',
          'Marble x10（Crystalarium）',
          'Clam x3（Crab Pot）',
          'Gold Bar x12（Furnace）',
          'Prismatic Shard x1（Statue Of True Perfection）',
        ].join('、'),
      },
    ],
    uncertainty: [],
    detail: {
      producedItems: [
        { itemId: 444, itemName: 'Duck Feather', quantity: 3, sourceName: 'Auto-Grabber' },
        { itemId: 928, itemName: 'Golden Egg', quantity: 1, sourceName: 'Incubator' },
        { itemId: 167, itemName: 'Joja Cola', quantity: 1, sourceName: 'Soda Machine' },
        { itemId: 787, itemName: 'Battery Pack', quantity: 2, sourceName: 'Lightning Rod' },
        { itemId: 344, itemName: 'Strawberry Jelly', quantity: 2, sourceName: 'Preserves Jar' },
        { itemId: 348, itemName: 'Ancient Fruit Wine', quantity: 9, sourceName: 'Keg' },
        { itemId: 348, itemName: 'Ancient Fruit Wine', quantity: 1, sourceName: 'Cask' },
        { itemId: 340, itemName: 'Honey', quantity: 1, sourceName: 'Bee House' },
        { itemId: 685, itemName: 'Bait', quantity: 2, sourceName: 'Worm Bin' },
        { itemId: 807, itemName: 'Dinosaur Mayonnaise', quantity: 1, sourceName: 'Mayonnaise Machine' },
        { itemId: 395, itemName: 'Coffee', quantity: 2, sourceName: 'Coffee Maker' },
        { itemId: 174, itemName: 'Large Egg', quantity: 2, sourceName: 'Auto-Grabber' },
        { itemId: 186, itemName: 'Large Milk', quantity: 3, sourceName: 'Auto-Grabber' },
        { itemId: 446, itemName: "Rabbit's Foot", quantity: 1, sourceName: 'Auto-Grabber' },
        { itemId: 281, itemName: 'Chanterelle', quantity: 1, sourceName: 'Mushroom Box' },
        { itemId: 386, itemName: 'Iridium Ore', quantity: 2, sourceName: 'Statue Of Perfection' },
        { itemId: 915, itemName: 'Pressure Nozzle', quantity: 1, sourceName: 'Iridium Sprinkler' },
        { itemId: 305, itemName: 'Void Egg', quantity: 1, sourceName: 'Incubator' },
        { itemId: 308, itemName: 'Void Mayonnaise', quantity: 1, sourceName: 'Mayonnaise Machine' },
        { itemId: 447, itemName: 'Aged Void Salmon Roe', quantity: 1, sourceName: 'Preserves Jar' },
        { itemId: 306, itemName: 'Mayonnaise', quantity: 1, sourceName: 'Mayonnaise Machine' },
        { itemId: 307, itemName: 'Duck Mayonnaise', quantity: 1, sourceName: 'Mayonnaise Machine' },
        { itemId: 72, itemName: 'Diamond', quantity: 1, sourceName: 'Statue Of Endless Fortune' },
        { itemId: 257, itemName: 'Morel', quantity: 1, sourceName: 'Mushroom Box' },
        { itemId: 348, itemName: 'Grape Wine', quantity: 1, sourceName: 'Keg' },
        { itemId: 447, itemName: 'Aged Lava Eel Roe', quantity: 1, sourceName: 'Preserves Jar' },
        { itemId: 447, itemName: 'Aged Slimejack Roe', quantity: 1, sourceName: 'Preserves Jar' },
        { itemId: 340, itemName: 'Wild Honey', quantity: 1, sourceName: 'Bee House' },
        { itemId: 168, itemName: 'Trash', quantity: 1, sourceName: 'Crab Pot' },
        { itemId: 614, itemName: 'Green Tea', quantity: 1, sourceName: 'Keg' },
        { itemId: 169, itemName: 'Driftwood', quantity: 1, sourceName: 'Crab Pot' },
        { itemId: 420, itemName: 'Red Mushroom', quantity: 1, sourceName: 'Mushroom Box' },
        { itemId: 562, itemName: 'Tigerseye', quantity: 5, sourceName: 'Crystalarium' },
        { itemId: 567, itemName: 'Marble', quantity: 10, sourceName: 'Crystalarium' },
        { itemId: 372, itemName: 'Clam', quantity: 3, sourceName: 'Crab Pot' },
        { itemId: 336, itemName: 'Gold Bar', quantity: 12, sourceName: 'Furnace' },
        { itemId: 74, itemName: 'Prismatic Shard', quantity: 1, sourceName: 'Statue Of True Perfection' },
      ],
    },
  }, 'zh-CN');

  const text = JSON.stringify(localized);

  assert.match(text, /鸭毛/);
  assert.match(text, /金蛋/);
  assert.match(text, /Joja可乐/);
  assert.match(text, /电池组/);
  assert.match(text, /草莓果酱/);
  assert.match(text, /远古水果果酒/);
  assert.match(text, /蜂蜜/);
  assert.match(text, /鱼饵/);
  assert.match(text, /恐龙蛋黄酱/);
  assert.match(text, /咖啡/);
  assert.match(text, /大鸡蛋/);
  assert.match(text, /大牛奶/);
  assert.match(text, /兔脚/);
  assert.match(text, /鸡油菌/);
  assert.match(text, /铱矿石/);
  assert.match(text, /压力喷嘴/);
  assert.match(text, /虚空蛋/);
  assert.match(text, /虚空蛋黄酱/);
  assert.match(text, /陈年虚空鲑鱼籽/);
  assert.match(text, /蛋黄酱/);
  assert.match(text, /鸭蛋黄酱/);
  assert.match(text, /钻石/);
  assert.match(text, /羊肚菌/);
  assert.match(text, /葡萄果酒/);
  assert.match(text, /陈年岩浆鳗鱼鱼籽/);
  assert.match(text, /陈年史莱姆鱼鱼籽/);
  assert.match(text, /野蜂蜜/);
  assert.match(text, /垃圾/);
  assert.match(text, /绿茶/);
  assert.match(text, /浮木/);
  assert.match(text, /红蘑菇/);
  assert.match(text, /虎眼石/);
  assert.match(text, /大理石/);
  assert.match(text, /蛤/);
  assert.match(text, /金锭/);
  assert.match(text, /真正完美雕像/);
  assert.match(text, /孵化器/);
  assert.match(text, /汽水机/);
  assert.match(text, /避雷针/);
  assert.match(text, /蜂房/);
  assert.match(text, /虫饵盒/);
  assert.match(text, /咖啡机/);
  assert.match(text, /完美雕像/);
  assert.match(text, /铱制洒水器/);
  assert.match(text, /无尽财富之雕像/);
  assert.match(text, /蟹笼/);
  assert.match(text, /木桶/);
  assert.match(text, /熔炉/);
  assert.doesNotMatch(text, /\b(Duck Feather|Golden Egg|Joja Cola|Battery Pack|Strawberry Jelly|Ancient Fruit Wine|Honey|Wild Honey|Bait|Dinosaur Mayonnaise|Coffee|Large Egg|Large Milk|Rabbit's Foot|Chanterelle|Iridium Ore|Pressure Nozzle|Void Egg|Void Mayonnaise|Aged Void Salmon Roe|Mayonnaise|Duck Mayonnaise|Morel|Grape Wine|Aged Lava Eel Roe|Aged Slimejack Roe|Trash|Green Tea|Driftwood|Red Mushroom|Tigerseye|Marble|Clam|Gold Bar|Prismatic Shard|Auto-Grabber|Incubator|Soda Machine|Lightning Rod|Bee House|Worm Bin|Mayonnaise Machine|Coffee Maker|Mushroom Box|Crab Pot|Cask|Furnace|Statue Of Perfection|Statue Of Endless Fortune|Statue Of True Perfection|Iridium Sprinkler)\b/);
});

test('localizes animal product colored animal sources to Chinese', () => {
  const localized = localizeRecommendationItem({
    id: 'collect-animal-products',
    title: '收取动物产物',
    category: 'profit',
    priority: 'recommended',
    confidence: 'medium',
    reason: '存档显示动物有可收取产物，建议顺手收取并根据需要加工。',
    evidence: [
      { source: 'save', label: '动物产物', value: 'Large Milk x4（White Cow）、Milk x1（Brown Cow）' },
    ],
    uncertainty: [],
    detail: {
      producedItems: [
        { itemId: 186, itemName: 'Large Milk', quantity: 4, sourceName: 'White Cow' },
        { itemId: 184, itemName: 'Milk', quantity: 1, sourceName: 'Brown Cow' },
      ],
    },
  }, 'zh-CN');

  const text = JSON.stringify(localized);

  assert.match(text, /大牛奶 x4（白色奶牛）/);
  assert.match(text, /牛奶 x1（棕色奶牛）/);
  assert.doesNotMatch(text, /\b(White Cow|Brown Cow|Large Milk|Milk)\b/);
});

test('localizes demo recommendation card text to English without visible Chinese copy', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { ...demoSnapshot.time, sourceSaveDate: demoSnapshot.time },
    selectedWeather: 'sunny',
    snapshot: demoSnapshot,
  });

  const localizedText = [...plan.reminders, ...plan.actions]
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
      estimate: item.estimate?.description,
    }))
    .join('\n');

  assert.doesNotMatch(localizedText, /[\u4e00-\u9fff]/);
});

test('localizes varied generated recommendation scenarios to English without visible Chinese copy', () => {
  const scenarios = [
    generatePlan({
      goal: 'free',
      manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
      planDate: { year: 1, season: 'summer', day: 28, sourceSaveDate: { year: 1, season: 'summer', day: 28 } },
      selectedWeather: 'stormy',
      snapshot: {
        ...demoSnapshot,
        time: { year: 1, season: 'summer', day: 28 },
        crops: [{ id: 258, name: '蓝莓', isReady: true, quantity: 12, sellPrice: 50 }],
      },
    }),
    generatePlan({
      goal: 'free',
      manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
      planDate: { year: 3, season: 'fall', day: 11, sourceSaveDate: { year: 3, season: 'fall', day: 11 } },
      selectedWeather: 'sunny',
      snapshot: {
        ...demoSnapshot,
        time: { year: 3, season: 'fall', day: 11 },
        inventory: [{ id: 72, name: 'Diamond', stack: 1, source: 'chest', sourceLabel: '储物箱' }],
        crops: [],
      },
    }),
    generatePlan({
      goal: 'money',
      manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
      planDate: { year: 2, season: 'fall', day: 10, sourceSaveDate: { year: 2, season: 'fall', day: 10 } },
      selectedWeather: 'sunny',
      snapshot: {
        ...demoSnapshot,
        time: { year: 2, season: 'fall', day: 10 },
        wallet: { money: 18000 },
        crops: [],
        inventory: [],
        farm: {
          ...demoSnapshot.farm,
          communityCenterRoute: 'joja',
        },
        progression: {
          joja: { completedProjects: 1, totalProjects: 5 },
        },
      },
    }),
  ];

  const localizedText = scenarios
    .flatMap((plan) => [...plan.reminders, ...plan.actions])
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
      estimate: item.estimate?.description,
    }))
    .join('\n');

  assert.doesNotMatch(localizedText, /[\u4e00-\u9fff]/);
});

test('localizes missing processing machine evidence to English without mixed item names', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 1, season: 'winter', day: 23, sourceSaveDate: { year: 1, season: 'winter', day: 23 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 1, season: 'winter', day: 23 },
      inventory: [
        { id: 812, name: '河鲈鱼籽', stack: 2, source: 'backpack', sourceLabel: '背包' },
        { id: 286, name: '樱桃炸弹', stack: 10, source: 'backpack', sourceLabel: '背包' },
      ],
      crops: [],
    },
  });

  const localizedText = plan.actions
    .filter((item) => item.id.startsWith('complete-machine-'))
    .map((item) => localizeRecommendationItem(item, 'en-US'))
    .map((item) => JSON.stringify({
      title: item.title,
      reason: item.reason,
      evidence: item.evidence,
      uncertainty: item.uncertainty,
    }))
    .join('\n');

  assert.match(localizedText, /Get or craft Preserves Jar/);
  assert.match(localizedText, /Perch Roe x2\(Backpack\)/);
  assert.doesNotMatch(localizedText, /[\u4e00-\u9fff]/);
  assert.doesNotMatch(localizedText, /Cherry炸弹|河鲈/);
});

test('localizes available fish evidence to English without Chinese fish windows', () => {
  const plan = generatePlan({
    goal: 'free',
    manualCorrections: { giftedToday: false, harvestedToday: false, wateredToday: false },
    planDate: { year: 1, season: 'winter', day: 23, sourceSaveDate: { year: 1, season: 'winter', day: 23 } },
    selectedWeather: 'sunny',
    snapshot: {
      ...demoSnapshot,
      time: { year: 1, season: 'winter', day: 23 },
      player: {
        ...demoSnapshot.player,
        equipment: {
          ...demoSnapshot.player.equipment,
          fishingRodName: 'Iridium Rod',
        },
      },
      farm: {
        ...demoSnapshot.farm,
        mineLevel: 85,
      },
      inventory: [
        { id: 812, name: '河鲈鱼籽', stack: 2, source: 'backpack', sourceLabel: '背包' },
        { id: 416, name: 'Snow Yam', stack: 7, source: 'chest', sourceLabel: '储物箱' },
        { id: 418, name: 'Crocus', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
      crops: [],
    },
  });

  const localizedFishing = plan.actions
    .filter((item) => item.id === 'fish-for-money')
    .map((item) => localizeRecommendationItem(item, 'en-US'));
  const text = JSON.stringify(localizedFishing);

  assert.match(text, /Available Fish/);
  assert.match(text, /Bream \(River, 18:00-02:00\)/);
  assert.match(text, /Perch \(River\/Lake\/Forest Pond, Any time\)/);
  assert.doesNotMatch(text, /[\u4e00-\u9fff]/);
});
