import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from './generatePlan.ts';
import type { PlannerInput, StardewSaveSnapshot } from '../../shared/types.ts';

function baseSnapshot(overrides: Partial<StardewSaveSnapshot> = {}): StardewSaveSnapshot {
  return {
    saveIdentity: {
      uniqueId: 'save-1',
      filePath: '/tmp/Farmer_123',
      fileModifiedAt: '2026-06-18T00:00:00.000Z',
    },
    parseMeta: {
      status: 'ok',
      parserVersion: '0.1.0',
      warnings: [],
    },
    farm: {
      farmName: 'Sunrise Farm',
      playerName: 'Farmer',
      farmType: 'standard',
      hasDesertAccess: false,
      mineLevel: 20,
      communityCenterRoute: 'community_center',
    },
    player: {
      maxEnergy: 270,
      maxItems: 36,
      equipment: {
        ringNames: [],
      },
    },
    time: { year: 1, season: 'summer', day: 15 },
    weatherForTomorrow: 'sunny',
    wallet: { money: 23500 },
    skills: {
      farming: 6,
      mining: 4,
      foraging: 5,
      fishing: 3,
      combat: 2,
    },
    inventory: [{ id: 66, name: '紫水晶', stack: 1 }],
    crops: [{ id: 258, name: '蓝莓', isReady: true, quantity: 12, sellPrice: 50 }],
    readyMachineOutputs: [],
    animalProducts: [],
    animalFeed: { animalCount: 0 },
    progression: {
      communityCenter: { completed: false, percentage: 68 },
    },
    relationships: [],
    ...overrides,
  };
}

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  const snapshot = baseSnapshot();
  return {
    snapshot,
    planDate: { year: 1, season: 'summer', day: 15, sourceSaveDate: snapshot.time },
    selectedWeather: 'sunny',
    goal: 'free',
    manualCorrections: {
      wateredToday: false,
      harvestedToday: false,
      giftedToday: false,
    },
    ...overrides,
  };
}

function findAction(plan: ReturnType<typeof generatePlan>, id: string) {
  return plan.actions.find((item) => item.id === id)
    ?? plan.actions
      .flatMap((item) => item.detail?.recommendationActions ?? [])
      .find((item) => item.id === id);
}

test('recommends birthday gift when a loved gift is in inventory', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'winter', day: 10, sourceSaveDate: { year: 1, season: 'winter', day: 10 } },
  }));

  assert.equal(plan.reminders[0]?.id, 'birthday-sebastian');
  assert.equal(plan.reminders[0]?.priority, 'must_do');
  assert.equal(plan.reminders[0]?.confidence, 'high');
});

test('describes birthday gift source when loved gift is in storage', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'winter', day: 10, sourceSaveDate: { year: 1, season: 'winter', day: 10 } },
    snapshot: baseSnapshot({
      inventory: [{ id: 66, name: '紫水晶', stack: 4, source: 'chest', sourceLabel: '储物箱' }],
    }),
  }));

  assert.equal(plan.reminders[0]?.evidence.find((item) => item.label === '库存物品')?.value, '紫水晶 x4（储物箱）');
});

test('recommends the best available birthday gift even when inventory has no loved gift', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'winter', day: 10, sourceSaveDate: { year: 1, season: 'winter', day: 10 } },
    snapshot: baseSnapshot({
      inventory: [{ id: 80, name: 'Quartz', stack: 3, source: 'backpack', sourceLabel: '背包' }],
    }),
  }));

  assert.equal(plan.reminders[0]?.id, 'birthday-sebastian');
  assert.equal(plan.reminders[0]?.title, '给Sebastian送石英');
  assert.equal(plan.reminders[0]?.evidence.find((item) => item.label === '库存物品')?.value, '石英 x3（背包）');
});

test('includes universal gift preferences when choosing the best birthday gift', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'fall', day: 21, sourceSaveDate: { year: 1, season: 'fall', day: 21 } },
    snapshot: baseSnapshot({
      inventory: [
        { id: 72, name: 'Diamond', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 74, name: 'Prismatic Shard', stack: 1, source: 'backpack', sourceLabel: '背包' },
      ],
    }),
  }));

  assert.equal(plan.reminders[0]?.id, 'birthday-robin');
  assert.equal(plan.reminders[0]?.title, '给Robin送五彩碎片');
  assert.equal(plan.reminders[0]?.evidence.find((item) => item.label === '库存物品')?.value, '五彩碎片 x1（背包）');
});

test('localizes processed birthday gifts in Chinese plan output', () => {
  const plan = generatePlan(input({
    planDate: { year: 6, season: 'winter', day: 14, sourceSaveDate: { year: 6, season: 'winter', day: 14 } },
    snapshot: baseSnapshot({
      inventory: [{ id: 342, name: 'Pickles', stack: 4, source: 'chest', sourceLabel: '储物箱' }],
    }),
  }));

  assert.equal(plan.reminders[0]?.id, 'birthday-harvey');
  assert.equal(plan.reminders[0]?.title, '给Harvey送腌菜');
  assert.equal(plan.reminders[0]?.evidence.find((item) => item.label === '库存物品')?.value, '腌菜 x4（储物箱）');
});

test('formats fall birthday reminder evidence with the Chinese season label', () => {
  const plan = generatePlan(input({
    planDate: { year: 3, season: 'fall', day: 11, sourceSaveDate: { year: 3, season: 'fall', day: 11 } },
    snapshot: baseSnapshot({
      inventory: [],
    }),
  }));

  const birthday = plan.reminders.find((item) => item.id === 'birthday-jodi');
  assert.equal(birthday?.evidence.find((item) => item.label === '生日')?.value, '秋季 第11日');
});

test('recommends harvesting ready crops with fixed gold estimate', () => {
  const plan = generatePlan(input());
  const harvest = plan.actions.find((item) => item.id === 'harvest-ready-crops');

  assert.equal(harvest?.estimate?.gold, 600);
  assert.equal(harvest?.confidence, 'medium');
});

test('does not recommend harvest after user marks crops already harvested', () => {
  const plan = generatePlan(
    input({
      manualCorrections: {
        wateredToday: false,
        harvestedToday: true,
        giftedToday: false,
      },
    }),
  );

  assert.equal(plan.actions.some((item) => item.id === 'harvest-ready-crops'), false);
});

test('recommends collecting ready processed goods and animal products', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      readyMachineOutputs: [
        { id: 348, name: 'Wine', quantity: 2, source: 'machine', sourceName: 'Keg' },
      ],
      animalProducts: [
        { id: 184, name: 'Milk', quantity: 1, source: 'animal', sourceName: 'Cow' },
        { id: 176, name: 'Egg', quantity: 3, source: 'animal', sourceName: 'Chicken' },
      ],
    }),
  }));

  const processed = plan.actions.find((item) => item.id === 'collect-ready-processed-goods');
  const animalProducts = plan.actions.find((item) => item.id === 'collect-animal-products');

  assert.equal(processed?.category, 'profit');
  assert.equal(processed?.evidence.find((item) => item.label === '加工产物')?.value, '果酒 x2（小桶）');
  assert.equal(animalProducts?.category, 'profit');
  assert.equal(animalProducts?.evidence.find((item) => item.label === '动物产物')?.value, '牛奶 x1（奶牛）、鸡蛋 x3（鸡）');
});

test('summarizes long produced item lists and keeps full detail', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      readyMachineOutputs: [
        { id: 404, name: 'Common Mushroom', quantity: 1, source: 'machine', sourceName: 'Mushroom Box' },
        { id: 404, name: 'Common Mushroom', quantity: 1, source: 'machine', sourceName: 'Mushroom Box' },
        { id: 348, name: 'Wine', quantity: 2, source: 'machine', sourceName: 'Keg' },
        { id: 348, name: 'Wine', quantity: 1, source: 'machine', sourceName: 'Keg' },
        { id: 424, name: 'Cheese', quantity: 1, source: 'machine', sourceName: 'Cheese Press' },
        { id: 432, name: 'Truffle Oil', quantity: 1, source: 'machine', sourceName: 'Oil Maker' },
      ],
    }),
  }));

  const processed = plan.actions.find((item) => item.id === 'collect-ready-processed-goods');

  assert.equal(
    processed?.evidence.find((item) => item.label === '加工产物')?.value,
    '普通蘑菇 x2（蘑菇箱）、果酒 x3（小桶）、奶酪 x1（奶酪压制机）等4项',
  );
  assert.deepEqual(processed?.detail?.producedItems, [
    { itemId: 404, itemName: '普通蘑菇', quantity: 2, sourceName: '蘑菇箱' },
    { itemId: 348, itemName: '果酒', quantity: 3, sourceName: '小桶' },
    { itemId: 424, itemName: '奶酪', quantity: 1, sourceName: '奶酪压制机' },
    { itemId: 432, itemName: '松露油', quantity: 1, sourceName: '产油机' },
  ]);
});

test('does not recommend processed or animal collection after user marks harvest done', () => {
  const plan = generatePlan(input({
    manualCorrections: {
      wateredToday: false,
      harvestedToday: true,
      giftedToday: false,
    },
    snapshot: baseSnapshot({
      crops: [],
      readyMachineOutputs: [
        { id: 348, name: 'Wine', quantity: 2, source: 'machine', sourceName: 'Keg' },
      ],
      animalProducts: [
        { id: 184, name: 'Milk', quantity: 1, source: 'animal', sourceName: 'Cow' },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'collect-ready-processed-goods'), false);
  assert.equal(plan.actions.some((item) => item.id === 'collect-animal-products'), false);
});

test('reminds when hay cannot cover two days of animal feed', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      animalFeed: {
        animalCount: 4,
        hayCount: 6,
        daysRemaining: 1,
      },
    }),
  }));

  const reminder = plan.reminders.find((item) => item.id === 'animal-feed-low');
  assert.equal(reminder?.priority, 'recommended');
  assert.equal(reminder?.evidence.find((item) => item.label === '动物数量')?.value, '4');
  assert.equal(reminder?.evidence.find((item) => item.label === '干草库存')?.value, '6');
  assert.equal(reminder?.evidence.find((item) => item.label === '剩余天数')?.value, '1天');
});

test('emphasizes hay preparation near the end of fall', () => {
  const plan = generatePlan(input({
    planDate: { year: 2, season: 'fall', day: 27, sourceSaveDate: { year: 2, season: 'fall', day: 27 } },
    snapshot: baseSnapshot({
      time: { year: 2, season: 'fall', day: 27 },
      crops: [],
      animalFeed: {
        animalCount: 8,
        hayCount: 10,
        daysRemaining: 1,
      },
    }),
  }));

  const reminder = plan.reminders.find((item) => item.id === 'animal-feed-low');
  assert.equal(reminder?.priority, 'must_do');
  assert.match(reminder?.title ?? '', /秋季末/);
});

test('formats plan heading and notice for after-sleep saves', () => {
  const plan = generatePlan(input());

  assert.equal(plan.title, '今日计划 - 第1年 夏季 第15日');
  assert.equal(plan.subtitle, '');
  assert.equal(plan.dataNotice, '当前计划基于最近一次睡觉后的存档生成');
});

test('reminds festival days as must-do reminders', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'summer', day: 28, sourceSaveDate: { year: 1, season: 'summer', day: 28 } },
  }));

  const festival = plan.reminders.find((item) => item.id === 'festival-dance-of-moonlight-jellies');
  assert.equal(festival?.priority, 'must_do');
  assert.equal(festival?.confidence, 'high');
});

test('reminds storm weather effects', () => {
  const plan = generatePlan(input({ selectedWeather: 'stormy' }));

  const storm = plan.reminders.find((item) => item.id === 'weather-stormy');
  assert.equal(storm?.priority, 'recommended');
  assert.match(storm?.reason ?? '', /避雷针/);
});

test('does not remind skipped watering when already watered', () => {
  const plan = generatePlan(input({
    selectedWeather: 'rainy',
    manualCorrections: {
      wateredToday: true,
      harvestedToday: false,
      giftedToday: false,
    },
  }));

  assert.equal(plan.reminders.some((item) => item.id === 'weather-rainy-no-watering'), false);
});

test('reminds season-end harvest risk for ready crops', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 28, sourceSaveDate: { year: 1, season: 'spring', day: 28 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 28 },
      crops: [{ id: 1, name: '防风草', isReady: true, quantity: 8, sellPrice: 35 }],
    }),
  }));

  const risk = plan.reminders.find((item) => item.id === 'season-end-planting-risk');
  assert.equal(risk?.priority, 'must_do');
  assert.equal(risk?.title, '临近季末不要种单季节作物');
  assert.match(risk?.reason ?? '', /最后4天/);
});

test('reminds season-end planting risk on every day from 25 to 28', () => {
  for (const day of [25, 26, 27, 28]) {
    const plan = generatePlan(input({
      planDate: { year: 1, season: 'spring', day, sourceSaveDate: { year: 1, season: 'spring', day } },
      snapshot: baseSnapshot({
        time: { year: 1, season: 'spring', day },
        crops: [],
      }),
    }));

    const risk = plan.reminders.find((item) => item.id === 'season-end-planting-risk');
    assert.equal(Boolean(risk), true, `missing reminder for day ${day}`);
  }
});

test('recommends planting crops when they can mature before season end', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');
  assert.equal(planting?.priority, 'optional');
  assert.match(planting?.reason ?? '', /成熟/);
});

test('describes seed source when matching seeds are already in global inventory', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 472, name: '防风草种子', stack: 12, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');
  assert.equal(planting?.evidence.find((item) => item.label === '已有种子')?.value, '防风草种子 x12（储物箱）');
  assert.equal(planting?.uncertainty.some((item) => item.includes('是否已拥有种子')), false);
});

test('localizes English seed names in Chinese planting evidence', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 472, name: 'Parsnip Seeds', stack: 12, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');
  const seedEvidence = planting?.evidence.find((item) => item.label === '已有种子')?.value;

  assert.equal(seedEvidence, '防风草种子 x12（储物箱）');
  assert.doesNotMatch(seedEvidence ?? '', /Parsnip Seeds/);
});

test('raises planting confidence when seed, empty plots, shop, and sprinkler coverage are parsed', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 472, name: 'Parsnip Seeds', stack: 12, source: 'chest', sourceLabel: '储物箱' },
        { id: 621, name: 'Quality Sprinkler', stack: 1, source: 'chest', sourceLabel: '储物箱' },
      ],
      farmPlotSummary: {
        plantedCropCount: 0,
        tilledTileCount: 8,
        emptyTileCount: 8,
        occupiedObjectCount: 0,
        resourceClumpCount: 0,
        buildingCount: 0,
        sprinklerCoverageParsed: true,
        parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
        unknownFields: [],
      },
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');

  assert.equal(planting?.confidence, 'high');
  assert.equal(planting?.evidence.find((item) => item.label === '商店')?.value, '皮埃尔：周三休息；Joja：通常开放');
  assert.equal(planting?.evidence.find((item) => item.label === '可用空地')?.value, '已耕空地 8 块');
  assert.equal(planting?.evidence.find((item) => item.label === '洒水条件')?.value, '检测到洒水器');
  assert.deepEqual(planting?.uncertainty, []);
});

test('keeps planting confidence medium when sprinklers exist but coverage is unparsed', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 472, name: 'Parsnip Seeds', stack: 12, source: 'chest', sourceLabel: '储物箱' },
      ],
      farmPlotSummary: {
        plantedCropCount: 0,
        tilledTileCount: 8,
        emptyTileCount: 8,
        occupiedObjectCount: 0,
        resourceClumpCount: 0,
        buildingCount: 0,
        sprinklerCount: 1,
        sprinklerCoverageParsed: false,
        parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures', 'locations.GameLocation[name=Farm].objects'],
        unknownFields: ['sprinklerCoverage'],
      },
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');

  assert.equal(planting?.confidence, 'medium');
  assert.equal(planting?.evidence.find((item) => item.label === '洒水条件')?.value, '检测到洒水器 1 个');
  assert.equal(planting?.uncertainty.some((item) => item.includes('洒水覆盖')), true);
});

test('does not treat inventory sprinklers as parsed plot coverage', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 24, sourceSaveDate: { year: 1, season: 'spring', day: 24 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 24 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 472, name: 'Parsnip Seeds', stack: 12, source: 'chest', sourceLabel: '储物箱' },
        { id: 621, name: 'Quality Sprinkler', stack: 1, source: 'chest', sourceLabel: '储物箱' },
      ],
      farmPlotSummary: {
        plantedCropCount: 0,
        tilledTileCount: 8,
        emptyTileCount: 8,
        occupiedObjectCount: 0,
        resourceClumpCount: 0,
        buildingCount: 0,
        parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
        unknownFields: [],
      },
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-parsnip');

  assert.equal(planting?.confidence, 'medium');
  assert.equal(planting?.evidence.find((item) => item.label === '洒水条件')?.value, '库存有洒水器，未确认覆盖地块');
  assert.equal(planting?.uncertainty.some((item) => item.includes('洒水覆盖')), true);
});

test('uses conservative multi-harvest ROI for regrow crop planting estimates', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'summer', day: 1, sourceSaveDate: { year: 1, season: 'summer', day: 1 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'summer', day: 1 },
      wallet: { money: 1000 },
      crops: [],
    }),
  }));

  const planting = plan.actions.find((item) => item.id === 'plant-blueberry');
  assert.equal(planting?.estimate?.gold, 120);
  assert.equal(planting?.estimate?.description, '保守预计利润约120金');
  assert.equal(planting?.evidence.find((item) => item.label === '预计收获次数')?.value, '4次');
});

test('does not recommend planting crops that cannot mature before season end', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 25, sourceSaveDate: { year: 1, season: 'spring', day: 25 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 25 },
      wallet: { money: 1000 },
      crops: [],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'plant-parsnip'), false);
});

test('recommends greenhouse planting in winter without using farm plot evidence', () => {
  const plan = generatePlan(input({
    planDate: { year: 3, season: 'winter', day: 5, sourceSaveDate: { year: 3, season: 'winter', day: 5 } },
    snapshot: baseSnapshot({
      time: { year: 3, season: 'winter', day: 5 },
      wallet: { money: 1000 },
      crops: [],
      inventory: [
        { id: 481, name: 'Blueberry Seeds', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      farmPlotSummary: {
        plantedCropCount: 0,
        tilledTileCount: 0,
        emptyTileCount: 0,
        occupiedObjectCount: 0,
        resourceClumpCount: 0,
        buildingCount: 0,
        parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
        unknownFields: [],
      },
      plantingZones: [
        {
          zone: 'farm',
          unlockState: 'unlocked',
          usable: true,
          plantedCropCount: 0,
          matureCropCount: 0,
          tilledTileCount: 0,
          emptyTilledTileCount: 0,
          parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
          unknownFields: [],
        },
        {
          zone: 'greenhouse',
          unlockState: 'unlocked',
          usable: true,
          plantedCropCount: 1,
          matureCropCount: 0,
          tilledTileCount: 12,
          emptyTilledTileCount: 8,
          sprinklerCount: 2,
          sprinklerCoverageParsed: false,
          parsedFields: ['locations.GameLocation[name=Greenhouse].terrainFeatures', 'locations.GameLocation[name=Greenhouse].objects'],
          unknownFields: ['sprinklerCoverage'],
        },
      ],
    }),
  }));

  const greenhouse = plan.actions
    .find((item) => item.id === 'plant-greenhouse-summary')
    ?.detail?.greenhousePlantingActions
    ?.find((item) => item.id === 'plant-greenhouse-blueberry');

  assert.equal(greenhouse?.title, '温室可以种植蓝莓');
  assert.equal(greenhouse?.confidence, 'medium');
  assert.equal(greenhouse?.evidence.find((item) => item.label === '推荐地块')?.value, '温室');
  assert.equal(greenhouse?.evidence.find((item) => item.label === '可用空地')?.value, '温室已耕空地 8 块');
  assert.equal(greenhouse?.evidence.find((item) => item.label === '洒水条件')?.value, '温室检测到洒水器 2 个');
  assert.equal(greenhouse?.reason.includes('不受当前季节限制'), true);
  assert.equal(plan.actions.some((item) => item.id === 'plant-blueberry'), false);
});

test('groups greenhouse planting actions into a single detail card', () => {
  const plan = generatePlan(input({
    planDate: { year: 3, season: 'winter', day: 5, sourceSaveDate: { year: 3, season: 'winter', day: 5 } },
    snapshot: baseSnapshot({
      time: { year: 3, season: 'winter', day: 5 },
      wallet: { money: 5000 },
      crops: [],
      inventory: [
        { id: 481, name: 'Blueberry Seeds', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      plantingZones: [
        {
          zone: 'greenhouse',
          unlockState: 'unlocked',
          usable: true,
          plantedCropCount: 1,
          matureCropCount: 0,
          tilledTileCount: 12,
          emptyTilledTileCount: 8,
          sprinklerCount: 2,
          sprinklerCoverageParsed: false,
          parsedFields: ['locations.GameLocation[name=Greenhouse].terrainFeatures', 'locations.GameLocation[name=Greenhouse].objects'],
          unknownFields: ['sprinklerCoverage'],
        },
      ],
    }),
  }));

  const greenhouse = plan.actions.find((item) => item.id === 'plant-greenhouse-summary');
  const greenhouseDetails = greenhouse?.detail?.greenhousePlantingActions ?? [];

  assert.equal(plan.actions.some((item) => item.id.startsWith('plant-greenhouse-') && item.id !== 'plant-greenhouse-summary'), false);
  assert.equal(greenhouse?.title, '温室种植建议');
  assert.equal(greenhouse?.priority, 'optional');
  assert.equal(greenhouse?.confidence, 'medium');
  assert.equal(greenhouse?.evidence.find((item) => item.label === '推荐数量')?.value, `${greenhouseDetails.length} 项`);
  assert.equal(greenhouse?.evidence.find((item) => item.label === '可用空地')?.value, '温室已耕空地 8 块');
  assert.equal(greenhouse?.evidence.find((item) => item.label === '洒水条件')?.value, '温室检测到洒水器 2 个');
  assert.equal(greenhouseDetails.length > 1, true);
  assert.equal(greenhouseDetails.some((item) => item.id === 'plant-greenhouse-blueberry'), true);
});

test('does not recommend greenhouse planting when greenhouse status is unknown', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 12, sourceSaveDate: { year: 1, season: 'spring', day: 12 } },
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 12 },
      wallet: { money: 1000 },
      crops: [],
      plantingZones: [
        {
          zone: 'greenhouse',
          unlockState: 'unknown',
          usable: undefined,
          parsedFields: [],
          unknownFields: ['greenhouseStatus'],
        },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id.startsWith('plant-greenhouse-')), false);
});

test('recommends ginger island farm planting only when the island farm zone is usable', () => {
  const usablePlan = generatePlan(input({
    planDate: { year: 4, season: 'winter', day: 8, sourceSaveDate: { year: 4, season: 'winter', day: 8 } },
    snapshot: baseSnapshot({
      time: { year: 4, season: 'winter', day: 8 },
      wallet: { money: 5000 },
      crops: [],
      inventory: [
        { id: 481, name: 'Blueberry Seeds', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      farm: {
        ...baseSnapshot().farm,
        hasIslandAccess: true,
      },
      plantingZones: [
        {
          zone: 'ginger_island_farm',
          unlockState: 'unlocked',
          usable: true,
          plantedCropCount: 0,
          matureCropCount: 0,
          tilledTileCount: 4,
          emptyTilledTileCount: 4,
          sprinklerCoverageParsed: true,
          parsedFields: ['locations.GameLocation[name=IslandWest].terrainFeatures'],
          unknownFields: [],
        },
      ],
    }),
  }));
  const unknownPlan = generatePlan(input({
    planDate: { year: 4, season: 'winter', day: 8, sourceSaveDate: { year: 4, season: 'winter', day: 8 } },
    snapshot: baseSnapshot({
      time: { year: 4, season: 'winter', day: 8 },
      wallet: { money: 5000 },
      crops: [],
      inventory: [
        { id: 481, name: 'Blueberry Seeds', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      farm: {
        ...baseSnapshot().farm,
        hasIslandAccess: true,
      },
      plantingZones: [
        {
          zone: 'ginger_island_farm',
          unlockState: 'unlocked',
          usable: undefined,
          parsedFields: [],
          unknownFields: ['gingerIslandFarmLocation'],
        },
      ],
    }),
  }));

  const island = usablePlan.actions
    .find((item) => item.id === 'plant-ginger-island-farm-summary')
    ?.detail?.plantingActions
    ?.find((item) => item.id === 'plant-ginger-island-farm-blueberry');
  assert.equal(island?.title, '姜岛农场可以种植蓝莓');
  assert.equal(island?.confidence, 'high');
  assert.equal(island?.evidence.find((item) => item.label === '推荐地块')?.value, '姜岛农场');
  assert.equal(island?.evidence.find((item) => item.label === '可用空地')?.value, '姜岛农场已耕空地 4 块');
  assert.equal(usablePlan.actions.some((item) => item.id.startsWith('plant-ginger-island-farm-') && item.id !== 'plant-ginger-island-farm-summary'), false);
  assert.equal(unknownPlan.actions.some((item) => item.id.startsWith('plant-ginger-island-farm-')), false);
});

test('groups ginger island farm planting actions into a single detail card', () => {
  const plan = generatePlan(input({
    planDate: { year: 4, season: 'winter', day: 8, sourceSaveDate: { year: 4, season: 'winter', day: 8 } },
    snapshot: baseSnapshot({
      time: { year: 4, season: 'winter', day: 8 },
      wallet: { money: 5000 },
      crops: [],
      inventory: [
        { id: 481, name: 'Blueberry Seeds', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      farm: {
        ...baseSnapshot().farm,
        hasIslandAccess: true,
      },
      plantingZones: [
        {
          zone: 'ginger_island_farm',
          unlockState: 'unlocked',
          usable: true,
          plantedCropCount: 0,
          matureCropCount: 0,
          tilledTileCount: 16,
          emptyTilledTileCount: 12,
          sprinklerCount: 3,
          sprinklerCoverageParsed: false,
          parsedFields: ['locations.GameLocation[name=IslandWest].terrainFeatures', 'locations.GameLocation[name=IslandWest].objects'],
          unknownFields: ['sprinklerCoverage'],
        },
      ],
    }),
  }));

  const island = plan.actions.find((item) => item.id === 'plant-ginger-island-farm-summary');
  const islandDetails = island?.detail?.plantingActions ?? [];

  assert.equal(plan.actions.some((item) => item.id.startsWith('plant-ginger-island-farm-') && item.id !== 'plant-ginger-island-farm-summary'), false);
  assert.equal(island?.title, '姜岛农场种植建议');
  assert.equal(island?.priority, 'optional');
  assert.equal(island?.confidence, 'medium');
  assert.equal(island?.evidence.find((item) => item.label === '推荐地块')?.value, '姜岛农场');
  assert.equal(island?.evidence.find((item) => item.label === '推荐数量')?.value, `${islandDetails.length} 项`);
  assert.equal(island?.evidence.find((item) => item.label === '可用空地')?.value, '姜岛农场已耕空地 12 块');
  assert.equal(island?.evidence.find((item) => item.label === '洒水条件')?.value, '姜岛农场检测到洒水器 3 个');
  assert.equal(islandDetails.length > 1, true);
  assert.equal(islandDetails.some((item) => item.id === 'plant-ginger-island-farm-blueberry'), true);
});

test('free mode still produces useful actions when no special reminders apply', () => {
  const plan = generatePlan(input({
    planDate: { year: 2, season: 'fall', day: 10, sourceSaveDate: { year: 2, season: 'fall', day: 10 } },
    selectedWeather: 'sunny',
    snapshot: baseSnapshot({
      time: { year: 2, season: 'fall', day: 10 },
      weatherForTomorrow: 'sunny',
      wallet: { money: 1200 },
      crops: [],
      inventory: [],
      farm: {
        ...baseSnapshot().farm,
        mineLevel: 35,
      },
    }),
  }));

  assert.ok(plan.actions.length >= 3);
  assert.ok(plan.actions.some((item) => item.id === 'get-fishing-rod'));
  assert.equal(plan.actions.some((item) => item.id === 'fish-for-money'), false);
  assert.ok(plan.actions.some((item) => item.id === 'push-mines'));
});

test('recommends getting a fishing rod before fishing for money when no rod is owned', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      player: {
        maxEnergy: 270,
        maxItems: 12,
        equipment: {
          ringNames: [],
        },
      },
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'get-fishing-rod');
  assert.equal(action?.title, '先获取鱼竿');
  assert.match(action?.reason ?? '', /威利/);
  assert.equal(action?.evidence.find((item) => item.label === '获取方式')?.value, '前往海滩找威利领取竹鱼竿');
  assert.equal(plan.actions.some((item) => item.id === 'fish-for-money'), false);
});

test('ranks high-confidence setup actions before lower-priority profit estimates', () => {
  const plannerInput = input({
    planDate: { year: 1, season: 'spring', day: 1, sourceSaveDate: { year: 1, season: 'spring', day: 1 } },
    selectedWeather: 'sunny',
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 1 },
      wallet: { money: 500 },
      crops: [],
      inventory: [],
      skills: {
        farming: 0,
        mining: 0,
        foraging: 0,
        fishing: 0,
        combat: 0,
      },
      farm: {
        ...baseSnapshot().farm,
        mineLevel: 0,
        communityCenterRoute: 'unknown',
      },
      player: {
        maxEnergy: 270,
        maxItems: 12,
        equipment: {
          ringNames: [],
        },
      },
    }),
  });
  const freePlan = generatePlan(plannerInput);
  const moneyPlan = generatePlan({ ...plannerInput, goal: 'money' });

  assert.equal(freePlan.actions[0]?.id, 'get-fishing-rod');
  assert.equal(moneyPlan.actions[0]?.id, 'get-fishing-rod');
  assert.equal(moneyPlan.actions[0]?.priority, 'recommended');
  assert.equal(moneyPlan.actions[0]?.confidence, 'high');
  assert.equal(moneyPlan.actions.some((item) => item.id === 'fish-for-money'), false);
});

test('includes parsed rod and bait evidence in fishing actions', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          fishingRodName: '玻璃纤维鱼竿',
          baitName: '鱼饵',
        },
      },
      crops: [],
    }),
  }));

  const fishing = plan.actions.find((item) => item.id === 'fish-for-money');
  assert.equal(fishing?.evidence.find((item) => item.label === '鱼竿')?.value, '玻璃纤维鱼竿');
  assert.equal(fishing?.evidence.find((item) => item.label === '鱼饵')?.value, '鱼饵');
  assert.equal(fishing?.uncertainty.some((item) => item.includes('鱼竿和鱼饵状态')), false);
  assert.equal(fishing?.uncertainty.some((item) => item.includes('水域')), false);
});

test('raises fishing confidence when reachable fish windows and bait are parsed', () => {
  const plan = generatePlan(input({
    planDate: { year: 1, season: 'spring', day: 5, sourceSaveDate: { year: 1, season: 'spring', day: 5 } },
    selectedWeather: 'rainy',
    snapshot: baseSnapshot({
      time: { year: 1, season: 'spring', day: 5 },
      crops: [],
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          fishingRodName: '玻璃纤维鱼竿',
          baitName: '鱼饵',
        },
      },
    }),
  }));

  const fishing = plan.actions.find((item) => item.id === 'fish-for-money');

  assert.equal(fishing?.confidence, 'medium');
  assert.match(fishing?.evidence.find((item) => item.label === '可钓鱼类')?.value ?? '', /凤尾鱼/);
  assert.equal(fishing?.uncertainty.some((item) => item.includes('可达水域')), false);
  assert.equal(fishing?.uncertainty.some((item) => item.includes('鱼类时间窗口')), false);
  assert.equal(fishing?.uncertainty.some((item) => item.includes('鱼饵')), false);
});

test('recommends processing fish when smoker, fish, and coal are available', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'FishSmoker', name: '鱼熏制机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 128, name: '河豚', stack: 2, source: 'backpack', sourceLabel: '背包' },
        { id: 382, name: '煤炭', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-fish-smoker');

  assert.equal(action?.category, 'profit');
  assert.equal(action?.confidence, 'medium');
  assert.match(action?.title ?? '', /熏鱼/);
  assert.equal(action?.evidence.find((item) => item.label === '加工设备')?.value, '鱼熏制机 x1（储物箱）');
  assert.equal(action?.evidence.find((item) => item.label === '可加工原料')?.value, '河豚 x2（背包）');
  assert.equal(action?.evidence.find((item) => item.label === '辅料')?.value, '煤炭 x5（储物箱）');
});

test('degrades high-confidence processing when machine state is unparsed', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'FishSmoker', name: '鱼熏制机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 128, name: '河豚', stack: 2, source: 'backpack', sourceLabel: '背包' },
        { id: 382, name: '煤炭', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-fish-smoker');

  assert.equal(action?.confidence, 'medium');
  assert.equal(action?.uncertainty.some((item) => item.includes('机器状态未解析')), true);
});

test('removes machine occupancy uncertainty when an idle machine state is parsed', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 128, name: '河豚', stack: 2, source: 'backpack', sourceLabel: '背包' },
        { id: 382, name: '煤炭', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
      machineStates: [
        {
          machineId: 'FishSmoker',
          machineName: '鱼熏制机',
          state: 'idle',
          parseConfidence: 'high',
          unknownFields: [],
        },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-fish-smoker');

  assert.equal(action?.confidence, 'high');
  assert.equal(action?.uncertainty.some((item) => item.includes('机器当前占用状态')), false);
  assert.equal(action?.uncertainty.some((item) => item.includes('机器状态未解析')), false);
});

test('does not schedule new processing on machines that are already processing', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'Keg', name: '小桶', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 258, name: 'Blueberry', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      machineStates: [
        {
          machineId: 'Keg',
          machineName: '小桶',
          state: 'processing',
          heldObjectId: 258,
          minutesUntilReady: 120,
          parseConfidence: 'high',
          unknownFields: [],
        },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'process-keg'), false);
});

test('recommends processing with an idle placed machine even when machine is not in inventory', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 258, name: 'Blueberry', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      machineStates: [
        {
          machineId: 'Keg',
          machineName: '小桶',
          state: 'idle',
          parseConfidence: 'high',
          unknownFields: [],
        },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-keg');

  assert.equal(action?.category, 'profit');
  assert.equal(action?.confidence, 'medium');
  assert.equal(action?.evidence.find((item) => item.label === '机器状态')?.value, '小桶空闲');
  assert.equal(action?.evidence.some((item) => item.label === '加工设备'), false);
  assert.equal(plan.actions.some((item) => item.id === 'complete-machine-keg'), false);
});

test('uses an idle machine when another machine of the same type is processing', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 258, name: 'Blueberry', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      machineStates: [
        {
          machineId: 'Keg',
          machineName: '小桶',
          state: 'processing',
          heldObjectId: 258,
          minutesUntilReady: 120,
          parseConfidence: 'high',
          unknownFields: [],
        },
        {
          machineId: 'Keg',
          machineName: '小桶',
          state: 'idle',
          parseConfidence: 'high',
          unknownFields: [],
        },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-keg');

  assert.equal(action?.category, 'profit');
  assert.equal(action?.evidence.find((item) => item.label === '机器状态')?.value, '小桶空闲');
});

test('degrades processing confidence when machine state is unknown', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'Keg', name: '小桶', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 258, name: 'Blueberry', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
      machineStates: [
        {
          machineId: 'Keg',
          machineName: '小桶',
          state: 'unknown',
          parseConfidence: 'low',
          unknownFields: ['heldObject', 'minutesUntilReady'],
        },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-keg');

  assert.equal(action?.confidence, 'medium');
  assert.equal(action?.uncertainty.some((item) => item.includes('机器状态未确认')), true);
  assert.equal(action?.evidence.find((item) => item.label === '机器状态')?.value, '小桶状态未确认');
});

test('recommends artisan processing when keg and fruit are available', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'Keg', name: '小桶', stack: 2, source: 'chest', sourceLabel: '储物箱' },
        { id: 258, name: 'Blueberry', stack: 8, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const action = plan.actions.find((item) => item.id === 'process-keg');

  assert.equal(action?.category, 'profit');
  assert.match(action?.title ?? '', /酿造/);
  assert.equal(action?.evidence.find((item) => item.label === '加工设备')?.value, '小桶 x2（储物箱）');
  assert.equal(action?.evidence.find((item) => item.label === '可加工原料')?.value, '蓝莓 x8（储物箱）');
});

test('recommends common artisan machines from external processing rules', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'MayonnaiseMachine', name: '蛋黄酱机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 176, name: 'Egg', stack: 3, source: 'fridge', sourceLabel: '冰箱' },
        { id: 'CheesePress', name: '奶酪压制机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 184, name: 'Milk', stack: 2, source: 'fridge', sourceLabel: '冰箱' },
      ],
    }),
  }));

  const mayonnaise = findAction(plan, 'process-mayonnaise-machine');
  const cheese = findAction(plan, 'process-cheese-press');

  assert.equal(mayonnaise?.category, 'profit');
  assert.equal(mayonnaise?.evidence.find((item) => item.label === '可加工原料')?.value, '鸡蛋 x3（冰箱）');
  assert.equal(cheese?.category, 'profit');
  assert.equal(cheese?.evidence.find((item) => item.label === '可加工原料')?.value, '牛奶 x2（冰箱）');
});

test('groups processing actions into a single detail card', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'MayonnaiseMachine', name: '蛋黄酱机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 176, name: 'Egg', stack: 3, source: 'fridge', sourceLabel: '冰箱' },
        { id: 'CheesePress', name: '奶酪压制机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 184, name: 'Milk', stack: 2, source: 'fridge', sourceLabel: '冰箱' },
      ],
    }),
  }));

  const processing = plan.actions.find((item) => item.id === 'process-summary');
  const details = processing?.detail?.recommendationActions ?? [];

  assert.equal(plan.actions.some((item) => item.id.startsWith('process-') && item.id !== 'process-summary'), false);
  assert.equal(processing?.title, '加工建议');
  assert.equal(processing?.category, 'profit');
  assert.equal(processing?.evidence.find((item) => item.label === '推荐数量')?.value, `${details.length} 项`);
  assert.equal(details.some((item) => item.id === 'process-mayonnaise-machine'), true);
  assert.equal(details.some((item) => item.id === 'process-cheese-press'), true);
});

test('recommends completing missing processing machines when ingredients are available', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 258, name: 'Blueberry', stack: 20, source: 'chest', sourceLabel: '储物箱' },
        { id: 176, name: 'Egg', stack: 6, source: 'fridge', sourceLabel: '冰箱' },
      ],
    }),
  }));

  const keg = findAction(plan, 'complete-machine-keg');
  const mayonnaiseMachine = findAction(plan, 'complete-machine-mayonnaise-machine');

  assert.equal(keg?.category, 'progress');
  assert.equal(keg?.priority, 'recommended');
  assert.equal(keg?.confidence, 'medium');
  assert.equal(keg?.evidence.find((item) => item.label === '缺少设备')?.value, '小桶');
  assert.equal(keg?.evidence.find((item) => item.label === '可加工原料')?.value, '蓝莓 x20（储物箱）');
  assert.equal(keg?.evidence.find((item) => item.label === '制作状态')?.value, '配方、材料缺口和购买状态未解析');
  assert.match(keg?.uncertainty.join(' ') ?? '', /配方解锁状态、制作材料缺口和可购买状态/);
  assert.equal(mayonnaiseMachine?.evidence.find((item) => item.label === '缺少设备')?.value, '蛋黄酱机');
  assert.equal(mayonnaiseMachine?.evidence.find((item) => item.label === '可加工原料')?.value, '鸡蛋 x6（冰箱）');
});

test('groups missing machine completion actions into a single detail card', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 258, name: 'Blueberry', stack: 20, source: 'chest', sourceLabel: '储物箱' },
        { id: 176, name: 'Egg', stack: 6, source: 'fridge', sourceLabel: '冰箱' },
      ],
    }),
  }));

  const completion = plan.actions.find((item) => item.id === 'complete-machine-summary');
  const details = completion?.detail?.recommendationActions ?? [];

  assert.equal(plan.actions.some((item) => item.id.startsWith('complete-machine-') && item.id !== 'complete-machine-summary'), false);
  assert.equal(completion?.title, '补齐加工设备建议');
  assert.equal(completion?.category, 'progress');
  assert.equal(completion?.evidence.find((item) => item.label === '推荐数量')?.value, `${details.length} 项`);
  assert.equal(details.some((item) => item.id === 'complete-machine-keg'), true);
  assert.equal(details.some((item) => item.id === 'complete-machine-mayonnaise-machine'), true);
});

test('uses parsed crafting recipe status for missing processing machines', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      crops: [],
      crafting: {
        parsed: true,
        unlockedRecipeIds: ['keg'],
      },
      inventory: [
        { id: 258, name: 'Blueberry', stack: 20, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const keg = findAction(plan, 'complete-machine-keg');

  assert.equal(keg?.evidence.find((item) => item.label === '制作状态')?.value, '配方已解锁，材料不足：木材缺30、铜锭缺1、铁锭缺1、橡树树脂缺1；不可直接购买');
  assert.equal(keg?.uncertainty.some((item) => item.includes('配方解锁状态')), false);
  assert.equal(keg?.uncertainty.some((item) => item.includes('制作材料缺口和可购买状态')), false);
});

test('calculates crafting material gaps from processing static data', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      crops: [],
      crafting: {
        parsed: true,
        unlockedRecipeIds: ['keg'],
      },
      inventory: [
        { id: 388, name: 'Wood', stack: 20, source: 'chest', sourceLabel: '储物箱' },
        { id: 334, name: 'Copper Bar', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 258, name: 'Blueberry', stack: 20, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const keg = findAction(plan, 'complete-machine-keg');

  assert.equal(keg?.evidence.find((item) => item.label === '制作状态')?.value, '配方已解锁，材料不足：木材缺10、铁锭缺1、橡树树脂缺1；不可直接购买');
  assert.equal(keg?.uncertainty.some((item) => item.includes('制作材料缺口')), false);
  assert.equal(keg?.uncertainty.some((item) => item.includes('可购买状态')), false);
});

test('shows processing time and value estimates from processing static data', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 'MayonnaiseMachine', name: '蛋黄酱机', stack: 1, source: 'chest', sourceLabel: '储物箱' },
        { id: 176, name: 'Egg', stack: 3, source: 'fridge', sourceLabel: '冰箱' },
      ],
      machineStates: [
        {
          machineId: 'MayonnaiseMachine',
          machineName: '蛋黄酱机',
          state: 'idle',
          parseConfidence: 'high',
          unknownFields: [],
        },
      ],
    }),
  }));

  const mayonnaise = plan.actions.find((item) => item.id === 'process-mayonnaise-machine');

  assert.equal(mayonnaise?.evidence.find((item) => item.label === '加工耗时')?.value, '3小时');
  assert.equal(mayonnaise?.evidence.find((item) => item.label === '加工收益')?.value, '约190金/个');
  assert.equal(mayonnaise?.uncertainty.some((item) => item.includes('机器当前占用状态')), false);
});

test('does not treat bombs as keg or dehydrator ingredients', () => {
  const plan = generatePlan(input({
    goal: 'free',
    snapshot: baseSnapshot({
      crops: [],
      inventory: [
        { id: 286, name: '樱桃炸弹', stack: 10, source: 'backpack', sourceLabel: '背包' },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'complete-machine-keg'), false);
  assert.equal(plan.actions.some((item) => item.id === 'complete-machine-dehydrator'), false);
});

test('recommends backpack and tool upgrades when resources are available', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      wallet: { money: 4500 },
      player: {
        maxEnergy: 270,
        maxItems: 12,
        equipment: {
          ringNames: [],
          pickaxeName: 'Pickaxe',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const backpack = plan.actions.find((item) => item.id === 'upgrade-backpack-24');
  const pickaxe = plan.actions.find((item) => item.id === 'upgrade-pickaxe-copper');

  assert.equal(backpack?.category, 'progress');
  assert.equal(backpack?.confidence, 'high');
  assert.match(backpack?.title ?? '', /背包/);
  assert.equal(pickaxe?.category, 'progress');
  assert.equal(pickaxe?.confidence, 'medium');
  assert.equal(pickaxe?.evidence.find((item) => item.label === '所需材料')?.value, '铜锭 x5（储物箱）');
  assert.equal(pickaxe?.evidence.find((item) => item.label === '下一等级')?.value, '铜十字镐');
  assert.equal(pickaxe?.evidence.find((item) => item.label === '铁匠铺状态')?.value, '未解析');
  assert.match(pickaxe?.uncertainty.join(' ') ?? '', /铁匠铺占用状态/);
});

test('keeps tool upgrade high confidence when blacksmith is parsed as available', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      blacksmith: {
        parsed: true,
      },
      wallet: { money: 4500 },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          pickaxeName: 'Pickaxe',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const pickaxe = plan.actions.find((item) => item.id === 'upgrade-pickaxe-copper');

  assert.equal(pickaxe?.confidence, 'high');
  assert.equal(pickaxe?.evidence.find((item) => item.label === '铁匠铺状态')?.value, '未发现正在处理的工具');
  assert.equal(pickaxe?.uncertainty.some((item) => item.includes('铁匠铺占用状态')), false);
});

test('does not recommend another tool upgrade when blacksmith is already processing a tool', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      blacksmith: {
        parsed: true,
        toolInProgress: 'Pickaxe',
        daysUntilReady: 1,
      },
      wallet: { money: 4500 },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          axeName: 'Axe',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'upgrade-axe-copper'), false);
});

test('does not recommend copper upgrades for already upgraded tools', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      wallet: { money: 100000 },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          pickaxeName: 'Iridium Pickaxe',
          axeName: 'Iridium Axe',
          wateringCanName: 'Iridium Watering Can',
          hoeName: 'Iridium Hoe',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 50, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'upgrade-pickaxe-copper'), false);
  assert.equal(plan.actions.some((item) => item.id === 'upgrade-axe-copper'), false);
  assert.equal(plan.actions.some((item) => item.id === 'upgrade-watering-can-copper'), false);
  assert.equal(plan.actions.some((item) => item.id === 'upgrade-hoe-copper'), false);
});

test('recommends additional tool upgrades from external upgrade rules', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      wallet: { money: 2500 },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          wateringCanName: 'Watering Can',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 5, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const wateringCan = plan.actions.find((item) => item.id === 'upgrade-watering-can-copper');

  assert.equal(wateringCan?.category, 'progress');
  assert.equal(wateringCan?.confidence, 'medium');
  assert.equal(wateringCan?.evidence.find((item) => item.label === '当前装备')?.value, 'Watering Can');
  assert.equal(wateringCan?.evidence.find((item) => item.label === '所需材料')?.value, '铜锭 x5（储物箱）');
  assert.equal(wateringCan?.evidence.find((item) => item.label === '下一等级')?.value, '铜喷壶');
  assert.equal(wateringCan?.evidence.find((item) => item.label === '铁匠铺状态')?.value, '未解析');
  assert.match(wateringCan?.uncertainty.join(' ') ?? '', /雨天前后|铁匠铺占用状态/);
});

test('groups tool upgrade actions into a single detail card', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      crops: [],
      wallet: { money: 12000 },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          pickaxeName: 'Pickaxe',
          axeName: 'Axe',
          wateringCanName: 'Watering Can',
          hoeName: 'Hoe',
        },
      },
      inventory: [
        { id: 334, name: 'Copper Bar', stack: 20, source: 'chest', sourceLabel: '储物箱' },
      ],
    }),
  }));

  const upgrades = plan.actions.find((item) => item.id === 'upgrade-tool-summary');
  const details = upgrades?.detail?.recommendationActions ?? [];

  assert.equal(plan.actions.some((item) => /^upgrade-(pickaxe|axe|watering-can|hoe)-/.test(item.id)), false);
  assert.equal(upgrades?.title, '工具升级建议');
  assert.equal(upgrades?.category, 'progress');
  assert.equal(upgrades?.evidence.find((item) => item.label === '推荐数量')?.value, `${details.length} 项`);
  assert.equal(details.some((item) => item.id === 'upgrade-pickaxe-copper'), true);
  assert.equal(details.some((item) => item.id === 'upgrade-axe-copper'), true);
  assert.equal(details.some((item) => item.id === 'upgrade-watering-can-copper'), true);
  assert.equal(details.some((item) => item.id === 'upgrade-hoe-copper'), true);
});

test('includes parsed mine readiness evidence in mine progress actions', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      farm: {
        ...baseSnapshot().farm,
        mineLevel: 35,
      },
      player: {
        maxEnergy: 270,
        maxItems: 36,
        health: 84,
        maxHealth: 115,
        equipment: {
          ringNames: [],
          weaponName: 'Steel Smallsword',
        },
      },
      inventory: [
        { id: 403, name: 'Field Snack', stack: 3, isEdible: true },
      ],
      crops: [],
    }),
  }));

  const mines = plan.actions.find((item) => item.id === 'push-mines');
  assert.deepEqual(mines?.evidence.map((item) => item.label), [
    '当前矿洞',
    '近期目标',
    '生命',
    '武器',
    '食物',
  ]);
  assert.doesNotMatch(mines?.uncertainty.join(' ') ?? '', /生命、食物和武器/);
  assert.equal(mines?.evidence.some((item) => item.label === '今日运气'), false);
});

test('recommends delivering community center items when inventory has matching bundle items', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      inventory: [
        { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
        { id: 388, name: '木材', stack: 120, source: 'chest', sourceLabel: '储物箱' },
      ],
      crops: [],
      progression: {
        communityCenter: { completed: false, percentage: 68 },
      },
    }),
  }));

  const communityCenter = plan.actions.find((item) => item.id === 'community-center-deliverables');
  assert.equal(communityCenter?.priority, 'recommended');
  assert.equal(communityCenter?.category, 'collection');
  assert.match(communityCenter?.title ?? '', /社区中心/);
  assert.equal(communityCenter?.evidence.find((item) => item.label === '可交付物品')?.value, '防风草 x1（春季作物收集包）、木材 x99（建筑收集包）');
  assert.deepEqual(communityCenter?.detail?.communityCenterDeliverables, [
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
  ]);
});

test('filters community center delivery suggestions by completed save bundle states', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      inventory: [
        { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
        { id: 388, name: '木材', stack: 120, source: 'chest', sourceLabel: '储物箱' },
      ],
      crops: [],
      progression: {
        communityCenter: {
          completed: false,
          percentage: 68,
          bundleStates: [
            { key: 0, completed: true, donatedSlots: [true, true, true, true] },
            { key: 17, completed: false, donatedSlots: [false, false, false, false] },
          ],
        },
      },
    }),
  }));

  const communityCenter = plan.actions.find((item) => item.id === 'community-center-deliverables');
  assert.equal(communityCenter?.evidence.find((item) => item.label === '可交付物品')?.value, '木材 x99（建筑收集包）');
});

test('does not recommend community center delivery for completed or joja routes', () => {
  const completedPlan = generatePlan(input({
    snapshot: baseSnapshot({
      inventory: [{ id: 24, name: '防风草', stack: 1 }],
      crops: [],
      progression: {
        communityCenter: { completed: true, percentage: 100 },
      },
    }),
  }));
  const jojaPlan = generatePlan(input({
    snapshot: baseSnapshot({
      farm: {
        ...baseSnapshot().farm,
        communityCenterRoute: 'joja',
      },
      inventory: [{ id: 24, name: '防风草', stack: 1 }],
      crops: [],
      progression: {
        joja: { completedProjects: 1, totalProjects: 5 },
      },
    }),
  }));

  assert.equal(completedPlan.actions.some((item) => item.id === 'community-center-deliverables'), false);
  assert.equal(jojaPlan.actions.some((item) => item.id === 'community-center-deliverables'), false);
});

test('money mode prioritizes estimated profit actions', () => {
  const plan = generatePlan(input({
    goal: 'money',
    planDate: { year: 2, season: 'fall', day: 10, sourceSaveDate: { year: 2, season: 'fall', day: 10 } },
    selectedWeather: 'sunny',
    snapshot: baseSnapshot({
      time: { year: 2, season: 'fall', day: 10 },
      wallet: { money: 1200 },
      crops: [],
      inventory: [],
      player: {
        maxEnergy: 270,
        maxItems: 36,
        equipment: {
          ringNames: [],
          fishingRodName: '竹鱼竿',
        },
      },
    }),
  }));

  assert.equal(plan.actions[0]?.id, 'fish-for-money');
  assert.equal(plan.actions[0]?.estimate?.kind, 'range');
});

test('recommends earning the missing gold for the next joja project on joja route', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      farm: {
        ...baseSnapshot().farm,
        communityCenterRoute: 'joja',
      },
      wallet: { money: 18000 },
      crops: [],
      progression: {
        joja: { completedProjects: 1, totalProjects: 5 },
      },
    }),
  }));

  const joja = plan.actions.find((item) => item.id === 'joja-next-project');
  assert.equal(joja?.priority, 'recommended');
  assert.equal(joja?.category, 'progress');
  assert.match(joja?.title ?? '', /淘金盘/);
  assert.match(joja?.reason ?? '', /距离下一个 Joja 项目还差 2000 金/);
  assert.equal(joja?.evidence.find((item) => item.label === '项目价格')?.value, '20000金');
  assert.equal(joja?.evidence.find((item) => item.label === '当前金币')?.value, '18000金');
});

test('recommends buying the next joja project when enough money is available', () => {
  const plan = generatePlan(input({
    snapshot: baseSnapshot({
      farm: {
        ...baseSnapshot().farm,
        communityCenterRoute: 'joja',
      },
      wallet: { money: 22000 },
      crops: [],
      progression: {
        joja: { completedProjects: 1, totalProjects: 5 },
      },
    }),
  }));

  const joja = plan.actions.find((item) => item.id === 'joja-next-project');
  assert.equal(joja?.priority, 'recommended');
  assert.match(joja?.title ?? '', /购买淘金盘/);
  assert.match(joja?.reason ?? '', /金币已足够购买/);
  assert.equal(joja?.evidence.find((item) => item.label === '当前金币')?.value, '22000金');
});

test('does not create joja funding advice for community center route', () => {
  const plan = generatePlan(input({
    goal: 'money',
    snapshot: baseSnapshot({
      farm: {
        ...baseSnapshot().farm,
        communityCenterRoute: 'community_center',
      },
      wallet: { money: 18000 },
      crops: [],
      progression: {
        communityCenter: { completed: false, percentage: 68 },
        joja: { completedProjects: 1, totalProjects: 5 },
      },
    }),
  }));

  assert.equal(plan.actions.some((item) => item.id === 'joja-next-project'), false);
  assert.equal(plan.reminders.some((item) => item.id === 'joja-next-project'), false);
});
