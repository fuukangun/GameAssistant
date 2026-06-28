import type { InventoryItem, MachineStateSummary, PlannerInput, PlanRecommendation, ProducedItemSummary, RecommendationItem, SaveTime, Season } from '../../shared/types.ts';
import { BIRTHDAYS, FESTIVALS } from '../data/calendar.ts';
import { createCommunityCenterSummary } from '../data/communityCenter.ts';
import { BASIC_PLANTING_OPTIONS, calculateConservativeCropRoi } from '../data/crops.ts';
import { findAvailableFishForDay } from '../data/fish.ts';
import { normalizeItemId } from '../data/items.ts';
import { getNextJojaProject } from '../data/joja.ts';
import { NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES, type NpcGiftPreferences } from '../data/npcs.ts';
import { isBombItemId, isBombItemName, isSprinklerItemId, isSprinklerItemName } from '../data/preparationRules.ts';
import { PROCESSING_RULES, type ProcessingIngredientKind, type ProcessingRule } from '../data/processingRules.ts';
import { UPGRADE_RULES, type UpgradeRule } from '../data/upgradeRules.ts';
import { formatItemName } from '../../app/itemDisplay.ts';
import { createFarmPlotStatusSummary } from '../../app/farmPlotStatus.ts';
import { formatShopAvailability } from '../../app/explorationStatus.ts';
import { RECOMMENDATION_LOCALIZATION } from '../data/recommendationLocalization.ts';

export function generatePlan(input: PlannerInput): PlanRecommendation {
  const reminders: RecommendationItem[] = [
    ...buildBirthdayReminders(input),
    ...buildFestivalReminders(input),
    ...buildSeasonEndReminders(input),
    ...buildAnimalFeedReminders(input),
    ...buildWeatherReminders(input),
  ];
  const actions: RecommendationItem[] = [
    ...buildHarvestActions(input),
    ...buildPlantingActions(input),
    ...buildFishingActions(input),
    ...buildProcessingActions(input),
    ...buildCommunityCenterActions(input),
    ...buildProgressActions(input),
    ...buildUpgradeActions(input),
    ...buildJojaActions(input),
    ...buildMaintenanceActions(input),
  ];
  const sortedActions = sortActions(actions, input.goal);

  return {
    title: `今日计划 - ${formatPlanDate(input)}`,
    subtitle: '',
    dataNotice: '当前计划基于最近一次睡觉后的存档生成',
    reminders,
    actions: sortedActions,
    parseWarnings: input.snapshot.parseMeta.warnings,
  };
}

function sortActions(actions: RecommendationItem[], goal: PlannerInput['goal']): RecommendationItem[] {
  return [...actions].sort((left, right) => {
    const priorityDiff = actionPriorityScore(right) - actionPriorityScore(left);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const confidenceDiff = confidenceScore(right) - confidenceScore(left);
    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }

    if (goal === 'money') {
      const rightGold = estimateGoldValue(right);
      const leftGold = estimateGoldValue(left);
      if (rightGold !== leftGold) {
        return rightGold - leftGold;
      }
    }

    return actions.indexOf(left) - actions.indexOf(right);
  });
}

function actionPriorityScore(item: RecommendationItem): number {
  return {
    must_do: 3,
    recommended: 2,
    optional: 1,
  }[item.priority];
}

function confidenceScore(item: RecommendationItem): number {
  return {
    high: 3,
    medium: 2,
    low: 1,
  }[item.confidence];
}

function estimateGoldValue(item: RecommendationItem): number {
  if (!item.estimate) {
    return 0;
  }

  return item.estimate.goldMax ?? item.estimate.gold ?? item.estimate.goldMin ?? 0;
}

function buildFestivalReminders(input: PlannerInput): RecommendationItem[] {
  const festival = FESTIVALS.find(
    (item) => item.season === input.planDate.season && item.day === input.planDate.day,
  );
  if (!festival) {
    return [];
  }

  return [{
    id: `festival-${festival.id}`,
    title: `今天有${festival.name}`,
    category: 'reminder',
    priority: 'must_do',
      confidence: 'high',
      reason: `今天是节日当天，可能影响商店、NPC日程和可安排行动。${festival.timeHint}。`,
      evidence: [
        { source: 'static_data', label: '节日', value: `${formatChineseMonthDay(input.planDate)} ${festival.name}` },
      ],
    uncertainty: ['节日参加与否由玩家决定，进入节日区域可能推进当天时间安排。'],
  }];
}

function buildSeasonEndReminders(input: PlannerInput): RecommendationItem[] {
  if (input.planDate.day < 25 || input.planDate.day > 28) {
    return [];
  }

  return [{
    id: 'season-end-planting-risk',
    title: '临近季末不要种单季节作物',
    category: 'risk',
    priority: 'must_do',
    confidence: 'high',
    reason: '临近季末的最后4天，不要再种植无法在本季成熟的单季节作物，避免浪费种子和体力。',
    evidence: [
      { source: 'derived', label: '计划日期', value: formatChineseMonthDay(input.planDate) },
    ],
    uncertainty: ['如果你已经在游戏内完成种植或进入下一天，请按实际状态调整。'],
  }];
}

function buildWeatherReminders(input: PlannerInput): RecommendationItem[] {
  if (input.selectedWeather === 'rainy' && !input.manualCorrections.wateredToday) {
    return [{
      id: 'weather-rainy-no-watering',
      title: '雨天通常无需浇水',
      category: 'maintenance',
      priority: 'recommended',
      confidence: 'medium',
      reason: '今日天气为雨天，普通室外作物通常会被雨水浇灌，可把体力留给采矿、钓鱼或清理农场。',
      evidence: [
        { source: 'user_input', label: '今日天气', value: 'rainy' },
      ],
      uncertainty: ['温室、室内花盆或特殊地块仍可能需要你自行确认。'],
    }];
  }

  if (input.selectedWeather === 'stormy') {
    return [{
      id: 'weather-stormy',
      title: '雷暴日检查避雷针',
      category: 'reminder',
      priority: 'recommended',
      confidence: 'medium',
      reason: '今日是雷暴天气，避雷针可能产出电池组；普通室外作物通常无需浇水。',
      evidence: [
        { source: 'user_input', label: '今日天气', value: 'stormy' },
      ],
      uncertainty: ['未解析农场上是否已有避雷针，因此只作为天气提醒。'],
    }];
  }

  return [];
}

function buildAnimalFeedReminders(input: PlannerInput): RecommendationItem[] {
  const feed = input.snapshot.animalFeed;
  if (feed.animalCount <= 0 || feed.daysRemaining === undefined || feed.daysRemaining >= 2) {
    return [];
  }

  const isFallEnd = input.planDate.season === 'fall' && input.planDate.day >= 25 && input.planDate.day <= 28;

  return [{
    id: 'animal-feed-low',
    title: isFallEnd ? '秋季末准备干草饲料' : '动物饲料不足两天',
    category: 'risk',
    priority: isFallEnd || feed.daysRemaining <= 0 ? 'must_do' : 'recommended',
    confidence: 'medium',
    reason: isFallEnd
      ? '临近冬季，户外牧草会消失；当前干草不足两天消耗，建议尽快补充干草并确认筒仓储备。'
      : '当前干草库存不足两天动物消耗，建议割草、购买干草或检查筒仓，避免动物停止产出。',
    evidence: [
      { source: 'save', label: '动物数量', value: `${feed.animalCount}` },
      { source: 'save', label: '干草库存', value: `${feed.hayCount ?? 0}` },
      { source: 'derived', label: '剩余天数', value: `${feed.daysRemaining}天` },
    ],
    uncertainty: ['动物是否已放牧吃草、自动喂食器状态和当天是否已喂食仍需按游戏内确认。'],
  }];
}

function buildBirthdayReminders(input: PlannerInput): RecommendationItem[] {
  if (input.manualCorrections.giftedToday) {
    return [];
  }

  const birthday = BIRTHDAYS.find(
    (item) => item.season === input.planDate.season && item.day === input.planDate.day,
  );
  if (!birthday) {
    return [];
  }

  const preference = NPC_GIFT_PREFERENCES.find((item) => item.npc === birthday.npc);
  const gift = preference ? findBestBirthdayGift(input.snapshot.inventory, preference) : undefined;

  if (!gift) {
    return [{
      id: `birthday-${birthday.npc.toLowerCase()}`,
      title: `今天是${birthday.npc}生日`,
      category: 'reminder',
      priority: 'must_do',
      confidence: 'high',
      reason: '生日送礼收益显著高于普通送礼，但当前库存未识别到已支持的可推荐礼物。',
      evidence: [
        { source: 'static_data', label: '生日', value: formatChineseMonthDay(input.planDate) },
      ],
      uncertainty: ['未确认游戏内今日是否已经送礼。'],
    }];
  }

    return [{
      id: `birthday-${birthday.npc.toLowerCase()}`,
      title: `给${birthday.npc}送${formatItemName(gift, 'zh-CN')}`,
      category: 'reminder',
      priority: 'must_do',
      confidence: 'high',
      reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
      evidence: [
      { source: 'static_data', label: '生日', value: formatChineseMonthDay(input.planDate) },
      { source: 'save', label: '库存物品', value: `${formatItemName(gift, 'zh-CN')} x${gift.stack}${gift.sourceLabel ? `（${gift.sourceLabel}）` : ''}` },
      ],
      uncertainty: ['未确认游戏内今日是否已经送礼。'],
    }];
}

function findBestBirthdayGift(
  inventory: InventoryItem[],
  preference: NpcGiftPreferences,
): InventoryItem | undefined {
  const rankedGifts = inventory
    .map((item) => ({ item, rank: getPositiveGiftRank(item, preference) }))
    .filter((entry): entry is { item: InventoryItem; rank: number } => entry.rank !== undefined)
    .sort((left, right) => left.rank - right.rank);

  return rankedGifts[0]?.item;
}

function getPositiveGiftRank(
  item: InventoryItem,
  preference: NpcGiftPreferences,
): number | undefined {
  if (isExcludedGift(item, preference)) {
    return undefined;
  }

  if (matchesGift(item, preference.lovedItemIds, preference.lovedItemNames)) {
    return 0;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.lovedItemIds, UNIVERSAL_GIFT_PREFERENCES.lovedItemNames)) {
    return 0;
  }

  if (matchesGift(item, preference.likedItemIds ?? [], preference.likedItemNames ?? [])) {
    return 1;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.likedItemIds ?? [], UNIVERSAL_GIFT_PREFERENCES.likedItemNames ?? [])) {
    return 1;
  }

  if (matchesGift(item, preference.neutralItemIds ?? [], preference.neutralItemNames ?? [])) {
    return 2;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.neutralItemIds ?? [], UNIVERSAL_GIFT_PREFERENCES.neutralItemNames ?? [])) {
    return 2;
  }

  return undefined;
}

function isExcludedGift(item: InventoryItem, preference: NpcGiftPreferences): boolean {
  return matchesGift(item, preference.hatedItemIds ?? [], preference.hatedItemNames ?? [])
    || matchesGift(item, preference.dislikedItemIds ?? [], preference.dislikedItemNames ?? [])
    || matchesGift(item, preference.excludedLovedItemIds ?? [], preference.excludedLovedItemNames ?? [])
    || matchesGift(item, preference.excludedLikedItemIds ?? [], preference.excludedLikedItemNames ?? [])
    || matchesGift(item, preference.excludedNeutralItemIds ?? [], preference.excludedNeutralItemNames ?? []);
}

function matchesGift(
  item: InventoryItem,
  ids: Array<number | string>,
  names: string[],
): boolean {
  const itemId = normalizeItemId(item.id);
  return ids.some((id) => normalizeItemId(id) === itemId) || names.includes(item.name);
}

function buildHarvestActions(input: PlannerInput): RecommendationItem[] {
  if (input.manualCorrections.harvestedToday) {
    return [];
  }

  const actions: RecommendationItem[] = [];
  const readyCrops = input.snapshot.crops.filter((crop) => crop.isReady);
  if (readyCrops.length > 0) {
    const gold = readyCrops.reduce((sum, crop) => sum + crop.quantity * crop.sellPrice, 0);
    const cropSummary = readyCrops.map((crop) => `${formatItemName(crop, 'zh-CN')} x${crop.quantity}`).join(', ');

    actions.push({
      id: 'harvest-ready-crops',
      title: '收获成熟作物',
      category: 'profit',
      priority: 'recommended',
      confidence: 'medium',
      reason: '存档显示农场中存在成熟作物，可通过收获转化为金币收益。',
      evidence: [
        { source: 'save', label: '成熟作物', value: cropSummary },
        { source: 'static_data', label: '基础售价估算', value: `${gold}金` },
      ],
      uncertainty: ['如果你进入游戏后已经收获，请忽略此建议。'],
      estimate: {
        kind: 'fixed',
        gold,
        description: `约${gold}金`,
      },
    });
  }

  if (input.snapshot.readyMachineOutputs.length > 0) {
    const producedItems = createProducedItemDetails(input.snapshot.readyMachineOutputs);
    actions.push({
      id: 'collect-ready-processed-goods',
      title: '收取加工产物',
      category: 'profit',
      priority: 'recommended',
      confidence: 'medium',
      reason: '存档显示部分加工设备已有成品可收取，及时收取可以释放机器继续加工。',
      evidence: [
        { source: 'save', label: '加工产物', value: formatProducedItemsPreview(producedItems) },
      ],
      uncertainty: ['如果你进入游戏后已经收取，请忽略此建议。'],
      detail: {
        producedItems,
      },
    });
  }

  if (input.snapshot.animalProducts.length > 0) {
    const producedItems = createProducedItemDetails(input.snapshot.animalProducts);
    actions.push({
      id: 'collect-animal-products',
      title: '收取动物产物',
      category: 'profit',
      priority: 'recommended',
      confidence: 'medium',
      reason: '存档显示动物有可收取产物，建议顺手收取并根据需要加工。',
      evidence: [
        { source: 'save', label: '动物产物', value: formatProducedItemsPreview(producedItems) },
      ],
      uncertainty: ['是否已经挤奶、剪毛、捡蛋或使用自动采集器仍需按游戏内确认。'],
      detail: {
        producedItems,
      },
    });
  }

  return actions;
}

function createProducedItemDetails(items: ProducedItemSummary[]) {
  const aggregatedItems: Array<{
    itemId: number | string;
    itemName: string;
    quantity: number;
    sourceName?: string;
  }> = [];
  const indexByItemAndSource = new Map<string, number>();

  for (const item of items) {
    const sourceName = item.sourceName ? formatProducedItemSourceName(item.sourceName) : undefined;
    const key = `${sourceName ?? 'unknown'}::${String(item.id ?? item.name)}`;
    const existingIndex = indexByItemAndSource.get(key);
    if (existingIndex !== undefined) {
      const existingItem = aggregatedItems[existingIndex];
      if (existingItem) {
        existingItem.quantity += item.quantity;
      }
      continue;
    }

    indexByItemAndSource.set(key, aggregatedItems.length);
    aggregatedItems.push({
      itemId: item.id,
      itemName: formatItemName(item, 'zh-CN'),
      quantity: item.quantity,
      sourceName,
    });
  }

  return aggregatedItems;
}

function formatProducedItemsPreview(
  items: ReturnType<typeof createProducedItemDetails>,
  limit = 3,
): string {
  const preview = items.slice(0, limit).map(formatProducedItemDetail).join('、');
  return items.length > limit ? `${preview}等${items.length}项` : preview;
}

function formatProducedItemDetail(item: ReturnType<typeof createProducedItemDetails>[number]): string {
  const sourceSuffix = item.sourceName ? `（${item.sourceName}）` : '';
  return `${item.itemName} x${item.quantity}${sourceSuffix}`;
}

function formatProducedItemSourceName(sourceName: string): string {
  return RECOMMENDATION_LOCALIZATION.englishTextNames[sourceName] ?? sourceName;
}

function buildPlantingActions(input: PlannerInput): RecommendationItem[] {
  const growableDaysBeforeSeasonEnd = 28 - input.planDate.day;
  const options = BASIC_PLANTING_OPTIONS.filter((crop) => {
    return crop.season === input.planDate.season
      && crop.growthDays <= growableDaysBeforeSeasonEnd
      && input.snapshot.wallet.money >= crop.seedPrice;
  });

  return options.map((crop) => {
    const roi = calculateConservativeCropRoi(crop, input.planDate);
    const plotStatus = createFarmPlotStatusSummary(input.snapshot);
    const farmSprinklerCount = input.snapshot.farmPlotSummary?.sprinklerCount;
    const hasInventorySprinkler = input.snapshot.inventory.some(isSprinklerItem);
    const hasParsedSprinklerCoverage = input.snapshot.farmPlotSummary?.sprinklerCoverageParsed === true;
    const seed = input.snapshot.inventory.find((item) => {
      const itemId = normalizeItemId(item.id);
      return crop.seedIds.some((seedId) => normalizeItemId(seedId) === itemId)
        || formatItemName(item, 'zh-CN') === crop.seedName
        || item.name === crop.seedName;
    });
    const evidence: RecommendationItem['evidence'] = [
      { source: 'static_data', label: '生长天数', value: `${crop.growthDays}天` },
      { source: 'derived', label: '可生长天数', value: `${growableDaysBeforeSeasonEnd}天` },
      { source: 'derived', label: '预计收获次数', value: `${roi.harvests}次` },
      { source: 'save', label: '当前金币', value: `${input.snapshot.wallet.money}金` },
      { source: 'static_data', label: '商店', value: formatShopAvailability(input.planDate, 'zh-CN') },
    ];
    if (seed) {
      evidence.push({
        source: 'save',
        label: '已有种子',
        value: formatInventoryItemStack(seed),
      });
    }
    if (plotStatus.emptyTilledTileCount !== undefined) {
      evidence.push({
        source: 'derived',
        label: '可用空地',
        value: `已耕空地 ${plotStatus.emptyTilledTileCount} 块`,
      });
    }
    if (hasParsedSprinklerCoverage) {
      evidence.push({
        source: 'save',
        label: '洒水条件',
        value: '检测到洒水器',
      });
    } else if (hasInventorySprinkler) {
      evidence.push({
        source: 'save',
        label: '洒水条件',
        value: '库存有洒水器，未确认覆盖地块',
      });
    } else if (farmSprinklerCount !== undefined && farmSprinklerCount > 0) {
      evidence.push({
        source: 'save',
        label: '洒水条件',
        value: `检测到洒水器 ${farmSprinklerCount} 个`,
      });
    }

    const uncertainty = buildPlantingUncertainty({
      hasSeed: Boolean(seed),
      hasParsedShop: true,
      hasParsedEmptyPlots: plotStatus.emptyTilledTileCount !== undefined,
      hasParsedSprinkler: hasParsedSprinklerCoverage,
    });

    return {
      id: `plant-${crop.id}`,
      title: `可以种植${formatItemName(crop, 'zh-CN')}`,
      category: 'profit',
      priority: 'optional',
      confidence: uncertainty.length === 0 ? 'high' : 'medium',
      reason: `${formatItemName(crop, 'zh-CN')}需要${crop.growthDays}天成熟，今天种下仍可在本季结束前成熟。`,
      evidence,
      uncertainty,
      estimate: {
        kind: 'projected',
        gold: roi.profit,
        description: `保守预计利润约${roi.profit}金`,
      },
    } satisfies RecommendationItem;
  });
}

function buildPlantingUncertainty(status: {
  hasSeed: boolean;
  hasParsedShop: boolean;
  hasParsedEmptyPlots: boolean;
  hasParsedSprinkler: boolean;
}): string[] {
  const missing = [
    ...status.hasParsedShop ? [] : ['商店是否开放'],
    ...status.hasSeed ? [] : ['是否已拥有种子'],
    ...status.hasParsedEmptyPlots ? [] : ['是否有足够空地'],
    ...status.hasParsedSprinkler ? [] : ['洒水覆盖'],
  ];
  return missing.length > 0 ? [`未解析${missing.join('、')}。`] : [];
}

function buildFishingActions(input: PlannerInput): RecommendationItem[] {
  const fishingLevel = input.snapshot.skills.fishing;
  const weatherModifier = input.selectedWeather === 'rainy' || input.selectedWeather === 'stormy' ? 1.2 : 1;
  const goldMin = Math.round((120 + fishingLevel * 25) * weatherModifier);
  const goldMax = Math.round((260 + fishingLevel * 45) * weatherModifier);
  const equipment = input.snapshot.player.equipment;

  if (!equipment.fishingRodName) {
    return [{
      id: 'get-fishing-rod',
      title: '先获取鱼竿',
      category: 'progress',
      priority: 'recommended',
      confidence: 'high',
      reason: '当前存档未识别到鱼竿。钓鱼赚钱前应先获取基础鱼竿，通常可前往海滩找威利领取竹鱼竿。',
      evidence: [
        { source: 'save', label: '鱼竿', value: '未拥有' },
        { source: 'static_data', label: '获取方式', value: '前往海滩找威利领取竹鱼竿' },
      ],
      uncertainty: ['如果你进入游戏后已经领取或购买鱼竿，请以游戏内状态为准。'],
    }];
  }

  const evidence: RecommendationItem['evidence'] = [
    { source: 'save', label: '钓鱼等级', value: `${fishingLevel}` },
    { source: 'user_input', label: '今日天气', value: input.selectedWeather },
  ];
  const availableFish = findAvailableFishForDay({
    date: input.planDate,
    weather: input.selectedWeather,
    access: {
      desert: input.snapshot.farm.hasDesertAccess,
      island: input.snapshot.farm.hasIslandAccess,
      mineLevel: input.snapshot.farm.mineLevel,
    },
  });
  const missing: string[] = [];

  evidence.push({ source: 'save', label: '鱼竿', value: equipment.fishingRodName });

  if (equipment.baitName) {
    evidence.push({ source: 'save', label: '鱼饵', value: equipment.baitName });
  } else {
    missing.push('鱼饵');
  }
  if (availableFish.length > 0) {
    evidence.push({
      source: 'derived',
      label: '可钓鱼类',
      value: availableFish.slice(0, 5).map((fish) => `${fish.name}（${fish.locations.join('/')}，${fish.timeWindow}）`).join('、'),
    });
  } else {
    missing.push('可达水域', '鱼类时间窗口');
  }

  const uncertainty = missing.length > 0 ? [`未解析${missing.join('、')}，因此收益为粗略区间。`] : [];

  return [{
    id: 'fish-for-money',
    title: '安排一段时间钓鱼赚钱',
    category: 'profit',
    priority: input.goal === 'money' ? 'recommended' : 'optional',
    confidence: uncertainty.length === 0 ? 'medium' : 'low',
    reason: '钓鱼是低门槛的稳定收入来源，当前版本按钓鱼等级和天气给出保守区间估算。',
    evidence,
    uncertainty,
    estimate: {
      kind: 'range',
      goldMin,
      goldMax,
      description: `预计约${goldMin}-${goldMax}金`,
    },
  }];
}

function formatInventoryItemStack(item: InventoryItem): string {
  return `${formatItemName(item, 'zh-CN')} x${item.stack}${item.sourceLabel ? `（${item.sourceLabel}）` : ''}`;
}

function isSprinklerItem(item: InventoryItem): boolean {
  return isSprinklerItemId(item.id) || isSprinklerItemName(item.name);
}

function findProcessingIngredient(inventory: InventoryItem[], rule: ProcessingRule): InventoryItem | undefined {
  if (rule.ingredientIds || rule.ingredientNames) {
    const exact = findInventoryItem(inventory, [...(rule.ingredientIds ?? []), ...(rule.ingredientNames ?? [])]);
    if (exact) {
      return exact;
    }
  }

  const ingredientKind = rule.ingredientKind;
  if (!ingredientKind) {
    return undefined;
  }

  return inventory.find((item) => isProcessingIngredientKind(item, ingredientKind));
}

function isProcessingIngredientKind(item: InventoryItem, kind: ProcessingIngredientKind): boolean {
  switch (kind) {
    case 'fish':
      return isFishIngredient(item);
    case 'keg':
      return isKegIngredient(item);
    case 'preserves':
      return isPreservesIngredient(item);
    case 'egg':
      return isEggIngredient(item);
    case 'milk':
      return isMilkIngredient(item);
    case 'dehydrator':
      return item.stack >= 5 && isDehydratorIngredient(item);
  }
}

function buildProcessingActions(input: PlannerInput): RecommendationItem[] {
  const inventory = input.snapshot.inventory;

  return PROCESSING_RULES.flatMap<RecommendationItem>((rule) => {
    const machine = findInventoryItem(inventory, [...rule.machineIds, ...rule.machineNames]);
    const machineStates = findMachineStates(input.snapshot.machineStates, rule);
    const machineState = selectMachineState(machineStates);
    const ingredient = findProcessingIngredient(inventory, rule);
    if (!ingredient) {
      return [];
    }

    if (!machine && !machineState) {
      const craftableStatus = formatCraftingStatus(input, rule);
      return [{
        id: `complete-machine-${rule.id}`,
        title: rule.completeMachineTitle ?? `补齐${rule.machineNames[0] ?? rule.id}`,
        category: 'progress',
        priority: input.goal === 'money' ? rule.priorityForMoneyGoal : rule.priorityDefault,
        confidence: 'medium',
        reason: rule.completeMachineReason ?? `库存中已有可加工原料，但未识别到${rule.machineNames[0] ?? '对应加工设备'}。建议制作或获取对应设备后再安排加工收益。`,
        evidence: [
          { source: 'static_data', label: '缺少设备', value: rule.machineNames[0] ?? rule.id },
          { source: 'save', label: '可加工原料', value: formatInventoryItemStack(ingredient) },
          { source: 'derived', label: '制作状态', value: craftableStatus },
        ],
        uncertainty: buildCraftingUncertainty(input, rule),
      } satisfies RecommendationItem];
    }

    if (machineStates.length > 0 && (machineState?.state === 'processing' || machineState?.state === 'ready')) {
      return [];
    }

    const extraMaterial = rule.extraMaterialIds || rule.extraMaterialNames
      ? findInventoryItem(inventory, [...(rule.extraMaterialIds ?? []), ...(rule.extraMaterialNames ?? [])])
      : undefined;
    if ((rule.extraMaterialIds || rule.extraMaterialNames) && !extraMaterial) {
      return [];
    }

    const evidence: RecommendationItem['evidence'] = [
      { source: 'save', label: '可加工原料', value: formatInventoryItemStack(ingredient) },
    ];
    if (machine) {
      evidence.unshift({ source: 'save', label: '加工设备', value: formatInventoryItemStack(machine) });
    }
    if (machineState) {
      evidence.push({ source: 'save', label: '机器状态', value: formatMachineStateEvidence(machineState) });
    }
    if (extraMaterial) {
      evidence.push({ source: 'save', label: '辅料', value: formatInventoryItemStack(extraMaterial) });
    }
    if (rule.processingMinutes !== undefined) {
      evidence.push({ source: 'static_data', label: '加工耗时', value: formatProcessingDuration(rule.processingMinutes) });
    }
    if (rule.valueEstimateGold !== undefined) {
      evidence.push({ source: 'static_data', label: '加工收益', value: `约${rule.valueEstimateGold}金/个` });
    }
    const uncertainty = [
      ...buildProcessingRuleUncertainty(rule, machineState),
      ...!machineState && rule.confidence === 'high'
        ? ['机器状态未解析，无法确认当前设备是否空闲。']
        : [],
      ...(machineState?.state === 'unknown'
        ? [`机器状态未确认：${formatUnknownFields(machineState.unknownFields)}`]
        : []),
    ];
    const confidence = (machineState?.state === 'unknown' || (!machineState && rule.confidence === 'high')) && rule.confidence === 'high'
      ? 'medium'
      : rule.confidence;

    return [{
      id: `process-${rule.id}`,
      title: rule.title,
      category: 'profit',
      priority: input.goal === 'money' ? rule.priorityForMoneyGoal : rule.priorityDefault,
      confidence,
      reason: rule.reason,
      evidence,
      uncertainty,
    } satisfies RecommendationItem];
  });
}

function buildProcessingRuleUncertainty(
  rule: ProcessingRule,
  machineState: MachineStateSummary | undefined,
): string[] {
  let uncertainty = rule.uncertainty;
  if (machineState && machineState.state !== 'unknown') {
    uncertainty = uncertainty
      .replace('机器当前占用状态和', '')
      .replace('机器当前占用状态', '')
      .replace('加工排队和', '');
  }
  if (rule.processingMinutes !== undefined) {
    uncertainty = uncertainty.replace('加工耗时、', '');
  }
  if (rule.valueEstimateGold !== undefined) {
    uncertainty = uncertainty
      .replace('和精确增值倍率', '')
      .replace('精确增值倍率', '')
      .replace('尚未逐项计算原料收益', '原料收益仅按保守静态值估算');
  }

  return cleanupUncertaintyText(uncertainty);
}

function cleanupUncertaintyText(text: string): string[] {
  const cleaned = text
    .replace(/^、+|、+$/g, '')
    .replace(/^和/, '')
    .replace(/^尚未解析，请按农场实际机器空闲情况调整。$/, '')
    .replace(/^尚未逐项解析。$/, '')
    .replace(/^请按农场实际机器空闲情况调整。$/, '')
    .replace(/^。$/, '')
    .trim();

  return cleaned.length > 0 ? [cleaned] : [];
}

function formatCraftingStatus(input: PlannerInput, rule: ProcessingRule): string {
  if (!input.snapshot.crafting?.parsed) {
    return '配方、材料缺口和购买状态未解析';
  }

  const isUnlocked = input.snapshot.crafting.unlockedRecipeIds?.includes(rule.id) === true;
  const materialStatus = formatCraftingMaterialStatus(input.snapshot.inventory, rule);
  const purchaseStatus = rule.purchasable === undefined
    ? '购买状态未解析'
    : rule.purchasable ? '可购买' : '不可直接购买';
  if (materialStatus) {
    return isUnlocked
      ? `配方已解锁，${materialStatus}；${purchaseStatus}`
      : `配方未确认已解锁，${materialStatus}；${purchaseStatus}`;
  }

  return isUnlocked
    ? '配方已解析为已解锁；材料缺口和购买状态未解析'
    : '配方已解析；未确认已解锁，材料缺口和购买状态未解析';
}

function buildCraftingUncertainty(input: PlannerInput, rule: ProcessingRule): string[] {
  if (input.snapshot.crafting?.parsed && rule.craftMaterials && rule.purchasable !== undefined) {
    return [];
  }

  if (input.snapshot.crafting?.parsed) {
    return ['制作材料缺口和可购买状态尚未逐项解析。'];
  }

  return ['配方解锁状态、制作材料缺口和可购买状态尚未逐项解析。'];
}

function formatCraftingMaterialStatus(inventory: InventoryItem[], rule: ProcessingRule): string | undefined {
  if (!rule.craftMaterials) {
    return undefined;
  }

  const missing = rule.craftMaterials.flatMap((material) => {
    const owned = countInventoryItems(inventory, [material.itemId, material.itemName]);
    const shortage = material.quantity - owned;
    return shortage > 0 ? [`${material.itemName}缺${shortage}`] : [];
  });

  return missing.length > 0 ? `材料不足：${missing.join('、')}` : '材料已满足';
}

function countInventoryItems(inventory: InventoryItem[], candidates: Array<number | string>): number {
  return inventory
    .filter((item) => candidates.some((candidate) => {
      return normalizeItemId(candidate) === normalizeItemId(item.id)
        || item.name === String(candidate)
        || formatItemName(item, 'zh-CN') === String(candidate);
    }))
    .reduce((sum, item) => sum + item.stack, 0);
}

function formatProcessingDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60}小时`;
  }

  return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
}

function findMachineStates(
  machineStates: MachineStateSummary[] | undefined,
  rule: ProcessingRule,
): MachineStateSummary[] {
  if (!machineStates || machineStates.length === 0) {
    return [];
  }

  return machineStates.filter((machine) => {
    const machineId = machine.machineId === undefined ? undefined : normalizeItemId(machine.machineId);
    return (machineId !== undefined && rule.machineIds.some((id) => normalizeItemId(id) === machineId))
      || rule.machineNames.includes(machine.machineName);
  });
}

function selectMachineState(machineStates: MachineStateSummary[]): MachineStateSummary | undefined {
  return machineStates.find((machine) => machine.state === 'idle')
    ?? machineStates.find((machine) => machine.state === 'unknown')
    ?? machineStates[0];
}

function formatMachineStateEvidence(machine: MachineStateSummary): string {
  const labels: Record<MachineStateSummary['state'], string> = {
    ready: '已有产物可收取',
    processing: '加工中',
    idle: '空闲',
    unknown: '状态未确认',
  };
  return `${machine.machineName}${labels[machine.state]}`;
}

function formatUnknownFields(fields: string[]): string {
  return fields.length > 0 ? fields.join('、') : '存档字段不完整';
}

function buildCommunityCenterActions(input: PlannerInput): RecommendationItem[] {
  const summary = createCommunityCenterSummary(input.snapshot);
  if (!summary.shouldSuggestCommunityCenter || summary.deliverables.length === 0) {
    return [];
  }

  const deliverables = sortDeliverablesByInventoryOrder(summary.deliverables, input);
  const preview = deliverables.slice(0, 2).map((item) => {
    return `${item.itemName} x${item.requiredStack}（${item.bundleName}）`;
  });
  const suffix = deliverables.length > preview.length ? `等${deliverables.length}项` : '';

  return [{
    id: 'community-center-deliverables',
    title: '去社区中心交付库存物品',
    category: 'collection',
    priority: 'recommended',
    confidence: 'medium',
    reason: '社区中心仍有未完成内容，且当前库存中存在可用于收集包的物品；顺路交付可以推进路线进度。',
    evidence: [
      { source: 'derived', label: '社区中心进度', value: `约${summary.overall.percentage}%完成` },
      { source: 'save', label: '可交付物品', value: `${preview.join('、')}${suffix}` },
    ],
    uncertainty: ['已按存档中的收集包完成标记过滤已完成收集包；具体需求仍基于内置原版收集包目录匹配。'],
    detail: {
      communityCenterDeliverables: deliverables.map((item) => ({
        roomName: item.roomName,
        bundleName: item.bundleName,
        itemId: item.itemId,
        itemName: item.itemName,
        requiredStack: item.requiredStack,
        availableStack: item.availableStack,
      })),
    },
  }];
}

function sortDeliverablesByInventoryOrder(
  deliverables: ReturnType<typeof createCommunityCenterSummary>['deliverables'],
  input: PlannerInput,
): ReturnType<typeof createCommunityCenterSummary>['deliverables'] {
  const inventoryOrder = new Map<string, number>();
  input.snapshot.inventory.forEach((item, index) => {
    const itemId = normalizeItemId(item.id);
    if (!inventoryOrder.has(itemId)) {
      inventoryOrder.set(itemId, index);
    }
  });

  return [...deliverables].sort((left, right) => {
    return (inventoryOrder.get(normalizeItemId(left.itemId)) ?? Number.MAX_SAFE_INTEGER)
      - (inventoryOrder.get(normalizeItemId(right.itemId)) ?? Number.MAX_SAFE_INTEGER);
  });
}

function buildProgressActions(input: PlannerInput): RecommendationItem[] {
  if (input.snapshot.farm.mineLevel >= 120) {
    return [];
  }

  const targetLevel = Math.min(120, Math.ceil((input.snapshot.farm.mineLevel + 1) / 5) * 5);
  const readiness = buildMineReadiness(input);
  return [{
    id: 'push-mines',
    title: `推进矿洞到${targetLevel}层`,
    category: 'progress',
    priority: 'optional',
    confidence: 'medium',
    reason: '继续推进矿洞能解锁更深层资源，也能顺手获得矿石、宝石和战斗经验。',
    evidence: [
      { source: 'save', label: '当前矿洞', value: `${input.snapshot.farm.mineLevel}层` },
      { source: 'derived', label: '近期目标', value: `${targetLevel}层` },
      ...readiness.evidence,
    ],
    uncertainty: readiness.uncertainty,
  }];
}

function buildUpgradeActions(input: PlannerInput): RecommendationItem[] {
  const money = input.snapshot.wallet.money;

  return UPGRADE_RULES.flatMap((rule) => {
    if (money < rule.goldCost) {
      return [];
    }

    if (rule.kind === 'backpack') {
      if (
        input.snapshot.player.maxItems >= (rule.requiredMaxItemsLessThan ?? Number.MAX_SAFE_INTEGER)
        || input.snapshot.player.maxItems < (rule.requiredMaxItemsAtLeast ?? 0)
      ) {
        return [];
      }

      return [{
        id: `upgrade-${rule.id}`,
        title: rule.title,
        category: 'progress',
        priority: input.goal === 'money' ? rule.priorityForMoneyGoal : rule.priorityDefault,
        confidence: rule.confidence,
        reason: rule.reason,
        evidence: [
          { source: 'save', label: '背包容量', value: `${input.snapshot.player.maxItems}格` },
          { source: 'save', label: '当前金币', value: `${money}金` },
          { source: 'static_data', label: '升级费用', value: `${rule.goldCost}金` },
        ],
        uncertainty: rule.uncertainty,
      } satisfies RecommendationItem];
    }

    if (rule.kind === 'tool' && input.snapshot.blacksmith?.parsed === true && input.snapshot.blacksmith.toolInProgress) {
      return [];
    }

    const equipmentName = rule.slot ? input.snapshot.player.equipment[rule.slot] : undefined;
    if (typeof equipmentName !== 'string' || !isBaseToolName(equipmentName, rule.baseNames ?? [])) {
      return [];
    }

    const material = rule.materialIds || rule.materialNames
      ? findInventoryItem(input.snapshot.inventory, [...(rule.materialIds ?? []), ...(rule.materialNames ?? [])])
      : undefined;
    if ((rule.materialIds || rule.materialNames) && (!material || material.stack < (rule.materialStack ?? 1))) {
      return [];
    }

    const evidence: RecommendationItem['evidence'] = [
      { source: 'save', label: '当前装备', value: equipmentName },
      { source: 'static_data', label: '下一等级', value: rule.targetName ?? rule.title },
    ];
    if (material) {
      evidence.push({ source: 'save', label: '所需材料', value: formatInventoryItemStack(material) });
    }
    evidence.push(
      { source: 'save', label: '当前金币', value: `${money}金` },
      { source: 'static_data', label: '升级费用', value: `${rule.goldCost}金` },
      { source: 'derived', label: '铁匠铺状态', value: formatBlacksmithStatus(input) },
    );

    return [{
      id: `upgrade-${rule.id}`,
      title: rule.title,
      category: 'progress',
      priority: input.goal === 'money' ? rule.priorityForMoneyGoal : rule.priorityDefault,
      confidence: rule.kind === 'tool' && input.snapshot.blacksmith?.parsed !== true && rule.confidence === 'high' ? 'medium' : rule.confidence,
      reason: rule.reason,
      evidence,
      uncertainty: [
        ...(rule.kind === 'tool' && input.snapshot.blacksmith?.parsed === true ? [] : rule.uncertainty),
        ...input.snapshot.blacksmith?.parsed === true ? [] : ['铁匠铺占用状态尚未从存档稳定解析，交付前请按游戏内确认。'],
      ],
    } satisfies RecommendationItem];
  });
}

function formatBlacksmithStatus(input: PlannerInput): string {
  const blacksmith = input.snapshot.blacksmith;
  if (!blacksmith?.parsed) {
    return '未解析';
  }

  if (blacksmith.toolInProgress) {
    return `${blacksmith.toolInProgress}处理中${blacksmith.daysUntilReady === undefined ? '' : `，${blacksmith.daysUntilReady}天后完成`}`;
  }

  return '未发现正在处理的工具';
}

function buildJojaActions(input: PlannerInput): RecommendationItem[] {
  if (input.snapshot.farm.communityCenterRoute !== 'joja') {
    return [];
  }

  const project = getNextJojaProject(input.snapshot.progression.joja);
  if (!project) {
    return [];
  }

  const currentMoney = input.snapshot.wallet.money;
  const missingGold = Math.max(0, project.price - currentMoney);
  const canBuy = missingGold === 0;

  return [{
    id: 'joja-next-project',
    title: canBuy ? `购买${project.name}` : `为${project.name}攒钱`,
    category: 'progress',
    priority: 'recommended',
    confidence: 'medium',
    reason: canBuy
      ? `金币已足够购买${project.name}，可前往 Joja 社区发展申请书推进路线。`
      : `距离下一个 Joja 项目还差 ${missingGold} 金，建议优先安排稳定赚钱行动。`,
    evidence: [
      { source: 'static_data', label: 'Joja项目', value: project.name },
      { source: 'static_data', label: '项目价格', value: `${project.price}金` },
      { source: 'save', label: '当前金币', value: `${currentMoney}金` },
      { source: 'static_data', label: '完成标记', value: project.marker },
    ],
    uncertainty: ['存档当前仅解析已购买项目数量，若实际购买顺序异常，请以游戏内 Joja 项目列表为准。'],
  }];
}

function buildMineReadiness(input: PlannerInput): Pick<RecommendationItem, 'evidence' | 'uncertainty'> {
  const evidence: RecommendationItem['evidence'] = [];
  const missing: string[] = [];
  const player = input.snapshot.player;

  if (player.health !== undefined || player.maxHealth !== undefined) {
    evidence.push({
      source: 'save',
      label: '生命',
      value: `${player.health ?? '?'} / ${player.maxHealth ?? '?'}`,
    });
  } else {
    missing.push('生命');
  }

  if (player.equipment.weaponName) {
    evidence.push({ source: 'save', label: '武器', value: player.equipment.weaponName });
  } else {
    missing.push('武器');
  }

  const edibleItems = input.snapshot.inventory.filter((item) => item.isEdible);
  if (edibleItems.length > 0) {
    evidence.push({
      source: 'save',
      label: '食物',
      value: edibleItems.slice(0, 3).map((item) => `${formatItemName(item, 'zh-CN')} x${item.stack}`).join('、'),
    });
  } else {
    missing.push('食物');
  }

  return {
    evidence,
    uncertainty: missing.length > 0 ? [`未解析${missing.join('、')}，请按游戏内状态调整。`] : [],
  };
}

function buildMaintenanceActions(input: PlannerInput): RecommendationItem[] {
  return [{
    id: 'farm-maintenance',
    title: '整理农场和背包',
    category: 'maintenance',
    priority: 'optional',
    confidence: 'low',
    reason: '当没有更强的限时事项时，清理杂草石头、整理箱子和补充工具路线能减少后续日程摩擦。',
    evidence: [
      { source: 'derived', label: '触发条件', value: '通用低门槛行动' },
    ],
    uncertainty: ['未解析农场杂物、箱子内容和工具位置，因此只作为兜底建议。'],
  }];
}

function findInventoryItem(
  inventory: InventoryItem[],
  candidates: Array<number | string>,
): InventoryItem | undefined {
  return inventory.find((item) => {
    const itemId = normalizeItemId(item.id);
    const names = new Set([
      item.name,
      formatItemName(item, 'zh-CN'),
    ]);
    return candidates.some((candidate) => {
      const candidateText = String(candidate);
      return normalizeItemId(candidateText) === itemId || names.has(candidateText);
    });
  });
}

function isFishIngredient(item: InventoryItem): boolean {
  const name = formatItemName(item, 'zh-CN');
  if (/熏制机|小桶|罐头瓶|机器|设备/.test(name)) {
    return false;
  }

  return /鱼|鳗|鲈|鲑|鳟|鲶|鳀|鲱|鲷|鲟|鲢|鱿|章鱼|河豚|比目鱼|金枪鱼/.test(name);
}

function isKegIngredient(item: InventoryItem): boolean {
  if (isExcludedProcessingIngredient(item)) {
    return false;
  }

  const name = formatItemName(item, 'zh-CN');
  return /蓝莓|甜瓜|南瓜|啤酒花|小麦|葡萄|草莓|上古水果|杨桃|苹果|杏子|橙子|桃子|石榴|樱桃/.test(name);
}

function isPreservesIngredient(item: InventoryItem): boolean {
  if (isExcludedProcessingIngredient(item)) {
    return false;
  }

  const name = formatItemName(item, 'zh-CN');
  return isKegIngredient(item) || /番茄|土豆|花椰菜|防风草|玉米|鱼籽|陈年鱼卵/.test(name);
}

function isEggIngredient(item: InventoryItem): boolean {
  const itemId = normalizeItemId(item.id);
  const name = formatItemName(item, 'zh-CN');
  return ['174', '176', '180', '182', '305', '442'].includes(itemId)
    || /鸡蛋|鸭蛋|虚空蛋|恐龙蛋/.test(name);
}

function isMilkIngredient(item: InventoryItem): boolean {
  const itemId = normalizeItemId(item.id);
  const name = formatItemName(item, 'zh-CN');
  return ['184', '186', '436', '438'].includes(itemId)
    || /牛奶|山羊奶/.test(name);
}

function isDehydratorIngredient(item: InventoryItem): boolean {
  if (isExcludedProcessingIngredient(item)) {
    return false;
  }

  const name = formatItemName(item, 'zh-CN');
  return isKegIngredient(item) || /蘑菇|羊肚菌|鸡油菌|冬根|水晶果|雪山药/.test(name);
}

function isExcludedProcessingIngredient(item: InventoryItem): boolean {
  const name = formatItemName(item, 'zh-CN');
  return isBombItemId(item.id)
    || isBombItemName(item.name)
    || /炸弹|机器|设备|鱼熏制机|小桶|罐头瓶|蛋黄酱机|奶酪压制机|织布机|产油机|脱水机/.test(name);
}

function isBaseToolName(value: string, candidates: string[]): boolean {
  const normalizedValue = normalizeToolName(value);
  return candidates.some((candidate) => normalizedValue === normalizeToolName(candidate));
}

function normalizeToolName(value: string): string {
  return value.trim().toLowerCase();
}

function formatPlanDate(input: PlannerInput): string {
  return formatChineseGameDate(input.planDate);
}

function formatChineseMonthDay(date: SaveTime): string {
  return `${formatChineseSeason(date.season)} 第${date.day}日`;
}

function formatChineseGameDate(date: SaveTime): string {
  return `第${date.year}年 ${formatChineseSeason(date.season)} 第${date.day}日`;
}

function formatChineseSeason(season: Season): string {
  const labels: Record<Season, string> = {
    spring: '春季',
    summer: '夏季',
    fall: '秋季',
    winter: '冬季',
  };

  return labels[season];
}
