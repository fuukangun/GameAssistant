import test from 'node:test';
import assert from 'node:assert/strict';
import type { RecommendationItem } from '../shared/types.ts';
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
