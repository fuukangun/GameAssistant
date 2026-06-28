import type { CommunityCenterDeliverableDetail, ProducedItemDetail, RecommendationItem } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { formatEquipmentName, formatNpcName } from './displayFormat.ts';
import { formatItemName } from './itemDisplay.ts';
import { getItemIdByName, getItemNameById } from '../stardew/data/items.ts';
import { ITEM_NAME_ALIASES } from '../stardew/data/itemNameAliases.ts';
import { COMMUNITY_CENTER_TRANSLATIONS } from '../stardew/data/communityCenterTranslations.ts';
import { formatJojaProjectName } from './jojaProjectDisplay.ts';
import { JOJA_PROJECT_NAME_TRANSLATIONS } from '../stardew/data/jojaProjectTranslations.ts';
import { RECOMMENDATION_LOCALIZATION } from '../stardew/data/recommendationLocalization.ts';
import { RECOMMENDATION_DISPLAY_DATA } from './recommendationDisplayData.ts';
import { RECOMMENDATION_TEXT_DATA } from './recommendationTextData.ts';
import { FISH_CATALOG } from '../stardew/data/fish.ts';
import { PREPARATION_RULES } from '../stardew/data/preparationRules.ts';

export function localizeRecommendationItem(
  item: RecommendationItem,
  language: AppLanguage,
): RecommendationItem {
  if (language === 'zh-CN') {
    return localizeChineseRecommendationItem(item);
  }

  if (item.id === 'community-center-deliverables') {
    return localizeCommunityCenterRecommendation(item);
  }

  return localizeKnownRecommendation(localizeCommonFields(item));
}

function localizeChineseRecommendationItem(item: RecommendationItem): RecommendationItem {
  const known = getDynamicChineseRecommendationText(item);
  const localized = known ? { ...item, ...known } : item;

  return {
    ...localized,
    evidence: localized.evidence.map((evidence) => ({
      ...evidence,
      value: localizeChineseEvidenceValue(evidence.label, evidence.value),
    })),
    estimate: localized.estimate
      ? {
        ...localized.estimate,
        description: localizeChineseText(localized.estimate.description),
      }
      : undefined,
    detail: localized.detail
      ? {
        ...localized.detail,
        communityCenterDeliverables: localized.detail.communityCenterDeliverables?.map((deliverable) => ({
          ...deliverable,
          itemName: localizeChineseItemName(deliverable.itemId, deliverable.itemName),
        })),
        recommendationActions: localized.detail.recommendationActions?.map(localizeChineseRecommendationItem),
        plantingActions: localized.detail.plantingActions?.map(localizeChineseRecommendationItem),
        greenhousePlantingActions: localized.detail.greenhousePlantingActions?.map(localizeChineseRecommendationItem),
        producedItems: localized.detail.producedItems?.map(localizeChineseProducedItemDetail),
      }
      : undefined,
  };
}

function getDynamicChineseRecommendationText(item: RecommendationItem): Partial<RecommendationItem> | undefined {
  if (item.id.startsWith('birthday-')) {
    const giftMatch = item.title.match(/^给(.+)送(.+)$/);
    if (giftMatch) {
      return {
        title: `给${formatNpcName(giftMatch[1], 'zh-CN')}送${localizeChineseItemNameFromText(giftMatch[2])}`,
      };
    }

    const birthdayMatch = item.title.match(/^今天是(.+)生日$/);
    if (birthdayMatch) {
      return {
        title: `今天是${formatNpcName(birthdayMatch[1], 'zh-CN')}生日`,
      };
    }
  }

  return undefined;
}

export function localizeCommunityCenterRoomName(name: string, language: AppLanguage): string {
  return language === 'zh-CN' ? name : COMMUNITY_CENTER_TRANSLATIONS.rooms[name] ?? name;
}

export function localizeCommunityCenterBundleName(name: string, language: AppLanguage): string {
  return language === 'zh-CN' ? name : COMMUNITY_CENTER_TRANSLATIONS.bundles[name] ?? name;
}

export function localizeCommunityCenterItemName(
  itemId: number | string,
  fallback: string,
  language: AppLanguage,
): string {
  if (language === 'zh-CN') {
    return fallback;
  }

  return COMMUNITY_CENTER_TRANSLATIONS.itemsById[String(itemId)] ?? fallback;
}

function localizeCommunityCenterRecommendation(item: RecommendationItem): RecommendationItem {
  const deliverables = item.detail?.communityCenterDeliverables ?? [];
  const percentage = extractPercent(item.evidence.find((evidence) => evidence.label === '社区中心进度')?.value);
  const preview = deliverables.slice(0, 2).map(formatCommunityCenterDeliverable);
  const suffix = deliverables.length > preview.length
    ? RECOMMENDATION_TEXT_DATA.communityCenter.suffix.replace('{count}', String(deliverables.length))
    : '';

  return {
    ...item,
    title: RECOMMENDATION_TEXT_DATA.communityCenter.title,
    reason: RECOMMENDATION_TEXT_DATA.communityCenter.reason,
    evidence: [
      {
        source: 'derived',
        label: 'Community Center Progress',
        value: RECOMMENDATION_TEXT_DATA.communityCenter.progressPrefix.replace('{percentage}', String(percentage ?? 0)),
      },
      {
        source: 'save',
        label: RECOMMENDATION_TEXT_DATA.communityCenter.deliverableLabel,
        value: `${preview.join(', ')}${suffix}`,
      },
    ],
    uncertainty: [RECOMMENDATION_TEXT_DATA.communityCenter.uncertainty],
    detail: {
      communityCenterDeliverables: deliverables.map((deliverable) => ({
        ...deliverable,
        roomName: localizeCommunityCenterRoomName(deliverable.roomName, 'en-US'),
        bundleName: localizeCommunityCenterBundleName(deliverable.bundleName, 'en-US'),
        itemName: localizeCommunityCenterItemName(deliverable.itemId, deliverable.itemName, 'en-US'),
      })),
    },
  };
}

function localizeKnownRecommendation(item: RecommendationItem): RecommendationItem {
  const known = getDynamicRecommendationText(item) ?? RECOMMENDATION_DISPLAY_DATA[item.id];
  const localizedDetails = localizeEnglishDetails(item);
  if (!known) {
    return localizeEvidenceAndEstimate(localizedDetails);
  }

  return localizeEvidenceAndEstimate({
    ...localizedDetails,
    ...known,
  });
}

function localizeEnglishDetails(item: RecommendationItem): RecommendationItem {
  if (!item.detail?.producedItems && !item.detail?.recommendationActions && !item.detail?.plantingActions && !item.detail?.greenhousePlantingActions) {
    return item;
  }

  return {
    ...item,
    detail: {
      ...item.detail,
      recommendationActions: item.detail.recommendationActions?.map((action) => localizeKnownRecommendation(localizeCommonFields(action))),
      plantingActions: item.detail.plantingActions?.map((action) => localizeKnownRecommendation(localizeCommonFields(action))),
      greenhousePlantingActions: item.detail.greenhousePlantingActions?.map((action) => localizeKnownRecommendation(localizeCommonFields(action))),
      producedItems: item.detail.producedItems?.map(localizeEnglishProducedItemDetail),
    },
  };
}

function localizeEnglishProducedItemDetail(item: ProducedItemDetail): ProducedItemDetail {
  return {
    ...item,
    itemName: localizeCommunityCenterItemName(item.itemId, item.itemName, 'en-US'),
    sourceName: item.sourceName ? localizeGeneralItemName(item.sourceName) : undefined,
  };
}

function formatCommunityCenterDeliverable(deliverable: CommunityCenterDeliverableDetail): string {
  return `${localizeCommunityCenterItemName(deliverable.itemId, deliverable.itemName, 'en-US')} x${deliverable.requiredStack} (${localizeCommunityCenterBundleName(deliverable.bundleName, 'en-US')})`;
}

function extractPercent(value: string | undefined): number | undefined {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function getDynamicRecommendationText(item: RecommendationItem): Partial<RecommendationItem> | undefined {
  if (item.id === 'season-end-planting-risk') {
    return {
      title: RECOMMENDATION_TEXT_DATA.seasonEnd.title,
      reason: RECOMMENDATION_TEXT_DATA.seasonEnd.reason,
      uncertainty: [RECOMMENDATION_TEXT_DATA.seasonEnd.uncertainty],
    };
  }

  if (item.id.startsWith('plant-') && !recommendationContainsChineseText(item)) {
    return {
      title: item.title,
      reason: item.reason,
      uncertainty: item.uncertainty,
    };
  }

  if (item.id === 'plant-greenhouse-summary' || item.id === 'plant-ginger-island-farm-summary') {
    const zoneName = item.evidence.find((evidence) => evidence.label === '推荐地块')?.value ?? '温室';
    const localizedZone = localizePlantingZoneName(zoneName);
    const count = item.evidence.find((evidence) => evidence.label === '推荐数量')?.value.match(/\d+/)?.[0];
    return {
      title: `Review ${formatPlantingZoneLabelForSentence(localizedZone)} planting options`,
      reason: count
        ? `${formatPlantingZoneSubject(localizedZone)} is not limited by the current season. There are ${count} crop options available; open details to compare them by profit, owned seeds, and plot conditions.`
        : `${formatPlantingZoneSubject(localizedZone)} is not limited by the current season. Open details to compare crop options by profit, owned seeds, and plot conditions.`,
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id.startsWith('festival-')) {
    const festivalName = item.title.replace(/^今天有/, '');
    return {
      title: RECOMMENDATION_TEXT_DATA.festival.title.replace('{festival}', localizeFestivalName(festivalName)),
      reason: RECOMMENDATION_TEXT_DATA.festival.reason,
      uncertainty: [RECOMMENDATION_TEXT_DATA.festival.uncertainty],
    };
  }

  if (item.id.startsWith('birthday-')) {
    const giftMatch = item.title.match(/^给(.+)送(.+)$/);
    if (giftMatch) {
      return {
        title: RECOMMENDATION_TEXT_DATA.birthday.giftTitle
          .replace('{item}', localizeItemNameToEnglish(giftMatch[2]))
          .replace('{npc}', giftMatch[1]),
        reason: RECOMMENDATION_TEXT_DATA.birthday.giftReason,
        uncertainty: [RECOMMENDATION_TEXT_DATA.birthday.giftUncertainty],
      };
    }

    const birthdayMatch = item.title.match(/^今天是(.+)生日$/);
    return {
      title: birthdayMatch
        ? RECOMMENDATION_TEXT_DATA.birthday.birthdayTitle.replace('{npc}', birthdayMatch[1])
        : 'NPC birthday today',
      reason: RECOMMENDATION_TEXT_DATA.birthday.birthdayReason,
      uncertainty: [RECOMMENDATION_TEXT_DATA.birthday.birthdayUncertainty],
    };
  }

  if (item.id.startsWith('plant-')) {
    const zonePlantingMatch = item.title.match(/^(普通农场|温室|姜岛农场)可以种植(.+)$/u);
    if (zonePlantingMatch) {
      const zoneName = zonePlantingMatch[1];
      const cropName = zonePlantingMatch[2];
      return {
        title: formatEnglishZonePlantingTitle(zoneName, localizeCropName(cropName)),
        reason: localizeZonePlantingReason(item.reason),
        uncertainty: localizeUncertaintyList(item.uncertainty),
      };
    }

    const cropName = item.title.replace(/^可以种植/, '');
    const cropNameEn = localizeCropName(cropName);
    const growthDays = item.evidence.find((evidence) => evidence.label === '生长天数')?.value.match(/\d+/)?.[0];
    return {
      title: RECOMMENDATION_TEXT_DATA.plant.title.replace('{crop}', cropNameEn),
      reason: growthDays
        ? RECOMMENDATION_TEXT_DATA.plant.reasonWithDays
          .replace('{crop}', cropNameEn)
          .replace('{days}', growthDays)
        : RECOMMENDATION_TEXT_DATA.plant.reasonWithoutDays.replace('{crop}', cropNameEn),
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'push-mines') {
    const target = item.evidence.find((evidence) => evidence.label === '近期目标')?.value.match(/\d+/)?.[0];
    return {
      title: target
        ? RECOMMENDATION_TEXT_DATA.mine.titleWithTarget.replace('{floor}', target)
        : RECOMMENDATION_TEXT_DATA.mine.titleDefault,
      reason: RECOMMENDATION_TEXT_DATA.mine.reason,
    };
  }

  if (item.id === 'process-fish-smoker') {
    return {
      title: 'Smoke fish for extra profit',
      reason: 'Your inventory has a Fish Smoker, fish, and coal. Smoking fish can raise its sell value when a machine is available.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-summary') {
    const count = item.evidence.find((evidence) => evidence.label === '推荐数量')?.value.match(/\d+/)?.[0];
    return {
      title: 'Review processing suggestions',
      reason: count
        ? `There are ${count} processing suggestions available. Open details to compare machines, ingredients, machine state, and value estimates.`
        : 'Open details to compare processing suggestions by machines, ingredients, machine state, and value estimates.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-keg') {
    return {
      title: 'Use kegs for artisan goods',
      reason: 'Your inventory has kegs and processable ingredients. Turning fruit, hops, or wheat into artisan goods can improve profit.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-preserves-jar') {
    return {
      title: 'Use preserves jars for artisan goods',
      reason: 'Your inventory has preserves jars and processable ingredients. Jams, pickles, and aged roe can improve item value.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-mayonnaise-machine') {
    return {
      title: 'Make mayonnaise from eggs',
      reason: 'Your inventory has a Mayonnaise Machine and egg ingredients. Processing eggs can improve ranching profit.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-cheese-press') {
    return {
      title: 'Make cheese from milk',
      reason: 'Your inventory has a Cheese Press and milk ingredients. Processing milk can improve ranching profit.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-loom') {
    return {
      title: 'Process wool with a loom',
      reason: 'Your inventory has a loom and wool. Cloth is useful for selling, crafting, and quests.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-oil-maker') {
    return {
      title: 'Process oil maker ingredients',
      reason: 'Your inventory has an Oil Maker and compatible ingredients. Process truffles or oil crops based on your current goal.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'process-dehydrator') {
    return {
      title: 'Dehydrate fruit or mushrooms',
      reason: 'Your inventory has a Dehydrator and enough compatible ingredients. Dehydrating can improve item value.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'complete-machine-summary') {
    const count = item.evidence.find((evidence) => evidence.label === '推荐数量')?.value.match(/\d+/)?.[0];
    return {
      title: 'Review missing machine suggestions',
      reason: count
        ? `There are ${count} machine completion suggestions available. Open details to compare ingredients, recipe status, material gaps, and priority.`
        : 'Open details to compare missing machine suggestions by ingredients, recipe status, material gaps, and priority.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id.startsWith('complete-machine-')) {
    const machine = localizeEvidenceValue(item.evidence.find((evidence) => evidence.label === '缺少设备')?.value ?? 'machine');
    return {
      title: `Get or craft ${machine}`,
      reason: `Your inventory has compatible ingredients but no ${machine} was recognized. Getting this machine can unlock better processing profit.`,
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-backpack-24') {
    return {
      title: 'Upgrade the backpack to 24 slots',
      reason: 'Your backpack is still small and you have enough gold. More space reduces trips during fishing, mining, and foraging.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-tool-summary') {
    const count = item.evidence.find((evidence) => evidence.label === '推荐数量')?.value.match(/\d+/)?.[0];
    return {
      title: 'Review tool upgrade suggestions',
      reason: count
        ? `There are ${count} tool upgrade suggestions available. Open details to compare short-term needs, blacksmith state, materials, and gold.`
        : 'Open details to compare tool upgrade suggestions by short-term needs, blacksmith state, materials, and gold.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-pickaxe-copper') {
    return {
      title: 'Upgrade to a Copper Pickaxe',
      reason: 'Your pickaxe is still basic, and the save shows enough gold and copper bars. Upgrading improves mining and stone clearing efficiency.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-fishing-rod-fiberglass') {
    return {
      title: 'Upgrade to the Fiberglass Rod',
      reason: 'You have a basic rod and enough gold. The Fiberglass Rod can use bait and improves fishing efficiency.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-backpack-36') {
    return {
      title: 'Upgrade the backpack to 36 slots',
      reason: 'Your backpack is not at maximum size and you have enough gold. More space improves long mining, fishing, and exploration routes.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-axe-copper') {
    return {
      title: 'Upgrade to a Copper Axe',
      reason: 'Your axe is still basic, and the save shows enough gold and copper bars. Upgrading improves wood clearing efficiency.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-watering-can-copper') {
    return {
      title: 'Upgrade to a Copper Watering Can',
      reason: 'Your watering can is still basic, and the save shows enough gold and copper bars. Upgrading reduces watering time and energy cost.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-hoe-copper') {
    return {
      title: 'Upgrade to a Copper Hoe',
      reason: 'Your hoe is still basic, and the save shows enough gold and copper bars. Upgrading improves tilling and artifact spot work.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'upgrade-fishing-rod-iridium') {
    return {
      title: 'Upgrade to the Iridium Rod',
      reason: 'You have a Fiberglass Rod and enough gold. The Iridium Rod supports bait and tackle for better fishing efficiency.',
      uncertainty: localizeUncertaintyList(item.uncertainty),
    };
  }

  if (item.id === 'joja-next-project') {
    const projectName = localizeJojaProjectName(item.evidence.find((evidence) => evidence.label === 'Joja项目')?.value ?? '');
    const missingGold = item.reason.match(/还差\s*(\d+)\s*金/)?.[1];
    return {
      title: item.title.startsWith('购买')
        ? RECOMMENDATION_TEXT_DATA.joja.buyTitle.replace('{project}', projectName)
        : RECOMMENDATION_TEXT_DATA.joja.saveTitle.replace('{project}', projectName),
      reason: missingGold
        ? RECOMMENDATION_TEXT_DATA.joja.reasonWithGold.replace('{gold}', missingGold)
        : RECOMMENDATION_TEXT_DATA.joja.reasonEnoughGold.replace('{project}', projectName),
      uncertainty: [RECOMMENDATION_TEXT_DATA.joja.uncertainty],
    };
  }

  return undefined;
}

function recommendationContainsChineseText(item: RecommendationItem): boolean {
  return [
    item.title,
    item.reason,
    ...item.uncertainty,
    ...item.evidence.flatMap((evidence) => [evidence.label, evidence.value]),
  ].some((value) => /[\u4e00-\u9fff]/.test(value));
}

function formatEnglishZonePlantingTitle(zoneName: string, cropName: string): string {
  if (zoneName === '温室') {
    return `Plant ${cropName} in the greenhouse`;
  }
  if (zoneName === '姜岛农场') {
    return `Plant ${cropName} on the Ginger Island farm`;
  }
  return `Plant ${cropName} on the farm`;
}

function localizeZonePlantingReason(reason: string): string {
  const zoneMatch = reason.match(/^(温室|姜岛农场)不受当前季节限制，(.+)需要(\d+)天成熟。$/u);
  if (zoneMatch) {
    const zoneName = zoneMatch[1] === '温室' ? 'The greenhouse' : 'The Ginger Island farm';
    return `${zoneName} is not limited by the current mainland season. ${localizeCropName(zoneMatch[2])} takes ${zoneMatch[3]} days to mature.`;
  }

  const farmMatch = reason.match(/^(.+)需要(\d+)天成熟，今天种下仍可在本季结束前成熟。$/u);
  if (farmMatch) {
    return `${localizeCropName(farmMatch[1])} takes ${farmMatch[2]} days to mature and can still mature before the season ends if planted today.`;
  }

  return localizeEvidenceValue(reason);
}

function localizeCommonFields(item: RecommendationItem): RecommendationItem {
  return {
    ...item,
    uncertainty: localizeUncertaintyList(item.uncertainty),
  };
}

function localizeEvidenceAndEstimate(item: RecommendationItem): RecommendationItem {
  return {
    ...item,
    evidence: item.evidence.map((evidence) => ({
      ...evidence,
      label: localizeEvidenceLabel(evidence.label),
      value: localizeEvidenceValue(evidence.value, evidence.label),
    })),
    estimate: item.estimate
      ? {
        ...item.estimate,
        description: localizeEstimateDescription(item.estimate.description),
      }
      : undefined,
  };
}

function localizeChineseEvidenceValue(label: string, value: string): string {
  if (label === '库存物品' || label === '已有种子' || label === '加工产物' || label === '动物产物') {
    return localizeChineseInventoryValue(value);
  }
  if (label === '成熟作物' || label === '可交付物品') {
    return localizeChineseText(value);
  }
  if (label === '鱼竿' || label === '鱼饵' || label === '武器' || label === '当前装备') {
    return localizeChineseEquipmentValue(value);
  }
  if (label === '食物') {
    return localizeChineseItemStackList(value);
  }
  if (label === '今日天气') {
    return localizeChineseWeatherValue(value);
  }

  return localizeChineseText(value);
}

function localizeChineseInventoryValue(value: string): string {
  return localizeChineseItemStackList(value);
}

function localizeChineseItemStackList(value: string): string {
  return value
    .split(/、|,\s*/)
    .map(localizeChineseItemStackEntry)
    .join(value.includes('、') ? '、' : ', ');
}

function localizeChineseItemStackEntry(entry: string): string {
  return entry.replace(/^(.+?) x(\d+)(.*)$/u, (_match, name: string, stack: string, suffix: string) => {
    return `${localizeChineseItemNameFromText(name)} x${stack}${localizeChineseText(suffix)}`;
  });
}

function localizeChineseItemNameFromText(name: string): string {
  const cleanName = name.trim();
  const id = englishItemNameToId[cleanName];
  if (id !== undefined) {
    return localizeChineseText(formatItemName({ id, name: cleanName }, 'zh-CN'));
  }

  const catalogId = getItemIdByName(cleanName);
  if (catalogId !== undefined) {
    return localizeChineseText(formatItemName({ id: catalogId, name: cleanName }, 'zh-CN'));
  }

  return localizeChineseProcessedItemName(cleanName) ?? localizeChineseText(cleanName);
}

function localizeChineseItemName(itemId: number | string, fallback: string): string {
  if (/[A-Za-z]/.test(fallback)) {
    const localizedFromText = localizeChineseItemNameFromText(fallback);
    if (localizedFromText !== fallback) {
      return localizedFromText;
    }
  }

  return localizeChineseText(formatItemName({ id: itemId, name: fallback }, 'zh-CN'));
}

function localizeChineseEquipmentValue(value: string): string {
  const stackMatch = value.match(/^(.+?) x(\d+)$/);
  if (stackMatch) {
    return `${formatEquipmentName(stackMatch[1], 'zh-CN')} x${stackMatch[2]}`;
  }

  return formatEquipmentName(value, 'zh-CN');
}

function localizeChineseWeatherValue(value: string): string {
  return RECOMMENDATION_LOCALIZATION.weatherNames[value] ?? value;
}

function localizeChineseProducedItemDetail(item: ProducedItemDetail): ProducedItemDetail {
  return {
    ...item,
    itemName: localizeChineseItemName(item.itemId, item.itemName),
    sourceName: item.sourceName ? localizeChineseText(item.sourceName) : undefined,
  };
}

function localizeChineseText(value: string): string {
  let localized = value;

  const phraseTranslations = Object.entries(RECOMMENDATION_LOCALIZATION.englishTextNames)
    .sort(([left], [right]) => right.length - left.length);

  for (const [en, zh] of phraseTranslations) {
    localized = localized.replaceAll(en, zh);
  }

  return localized;
}

function localizeChineseProcessedItemName(name: string): string | undefined {
  const processedItemNames: Record<string, string> = {
    Wine: '果酒',
    Pickles: '腌菜',
    Jelly: '果酱',
    Juice: '汁',
    'Dried Fruit': '果干',
    'Dried Mushrooms': '蘑菇干',
    Raisins: '葡萄干',
    'Aged Roe': '陈年鱼籽',
  };
  if (processedItemNames[name]) {
    return processedItemNames[name];
  }

  const processedSuffixes: Array<[RegExp, string]> = [
    [/^Aged (.+) Roe$/u, '陈年{base}鱼籽'],
    [/^(.+) Roe$/u, '{base}鱼籽'],
    [/^(.+) Juice$/u, '汁'],
    [/^(.+) Jelly$/u, '果酱'],
    [/^(.+) Pickles$/u, '腌菜'],
    [/^(.+) Wine$/u, '果酒'],
    [/^(.+) Dried Fruit$/u, '果干'],
  ];

  for (const [pattern, suffix] of processedSuffixes) {
    const match = name.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const baseName = localizeChineseItemNameFromText(match[1]);
    if (baseName !== match[1]) {
      return suffix.includes('{base}') ? suffix.replace('{base}', baseName) : `${baseName}${suffix}`;
    }
  }

  return undefined;
}

function localizeEvidenceLabel(label: string): string {
  return RECOMMENDATION_LOCALIZATION.evidenceLabels[label] ?? label;
}

function localizeEvidenceValue(value: string, label?: string): string {
  if (label === '可钓鱼类') {
    return localizeAvailableFishEvidenceValue(value);
  }
  if (label === '推荐地块') {
    return localizePlantingZoneName(value);
  }
  if (label === '可用空地') {
    return localizePlantingPlotEvidence(value);
  }
  if (label === '洒水条件') {
    return localizeWateringEvidence(value);
  }
  if (label === '推荐数量' || label === '加工建议数量' || label === '补齐设备建议数量' || label === '工具升级建议数量') {
    return value.replace(/^(\d+) 项$/u, (_match, count: string) => `${count} ${Number(count) === 1 ? 'option' : 'options'}`);
  }

  let localized = localizeEnglishItemStackList(value);

  const statusTextTranslations = Object.entries(RECOMMENDATION_LOCALIZATION.statusTexts)
    .sort(([left], [right]) => right.length - left.length);
  for (const [zh, en] of statusTextTranslations) {
    localized = localized.replaceAll(zh, en);
  }

  const phraseTranslations = Object.entries({
    ...RECOMMENDATION_LOCALIZATION.cropNames,
    ...RECOMMENDATION_LOCALIZATION.generalItemNames,
    ...RECOMMENDATION_LOCALIZATION.festivalNames,
    ...COMMUNITY_CENTER_TRANSLATIONS.rooms,
    ...COMMUNITY_CENTER_TRANSLATIONS.bundles,
    ...JOJA_PROJECT_NAME_TRANSLATIONS,
  }).sort(([left], [right]) => right.length - left.length);

  for (const [zh, en] of phraseTranslations) {
    if (zh.length < 2) {
      continue;
    }
    localized = localized.replaceAll(zh, en);
  }

  localized = localized
    .replaceAll('金', 'g')
    .replaceAll('层', 'F')
    .replaceAll('天', ' days')
    .replaceAll('春季', 'Spring')
    .replaceAll('夏季', 'Summer')
    .replaceAll('秋季', 'Fall')
    .replaceAll('冬季', 'Winter')
    .replaceAll('背包', RECOMMENDATION_LOCALIZATION.inventorySources.背包)
    .replaceAll('储物箱', RECOMMENDATION_LOCALIZATION.inventorySources.储物箱)
    .replaceAll('冰箱', RECOMMENDATION_LOCALIZATION.inventorySources.冰箱);

  return localized
    .replace(/(\d+)次/g, (_match, count: string) => `${count} ${Number(count) === 1 ? 'harvest' : 'harvests'}`)
    .replace(/(Spring|Summer|Fall|Winter) 第(\d+)日/g, '$1 Day $2')
    .replaceAll('（', '(')
    .replaceAll('）', ')');
}

function localizePlantingZoneName(value: string): string {
  return {
    普通农场: 'Farm',
    温室: 'Greenhouse',
    姜岛农场: 'Ginger Island Farm',
  }[value] ?? value;
}

function formatPlantingZoneLabelForSentence(value: string): string {
  if (value === 'Greenhouse') {
    return 'greenhouse';
  }
  if (value === 'Ginger Island Farm') {
    return 'Ginger Island farm';
  }
  return value;
}

function formatPlantingZoneSubject(value: string): string {
  return value === 'Greenhouse' ? 'The greenhouse' : `The ${value.replace(/^Ginger Island Farm$/, 'Ginger Island farm')}`;
}

function localizePlantingPlotEvidence(value: string): string {
  const zoneMatch = value.match(/^(温室|姜岛农场)已耕空地 (\d+) 块$/u);
  if (zoneMatch) {
    return `${localizePlantingZoneName(zoneMatch[1])} empty tilled plots: ${zoneMatch[2]}`;
  }
  const farmMatch = value.match(/^已耕空地 (\d+) 块$/u);
  if (farmMatch) {
    return `Empty tilled plots: ${farmMatch[1]}`;
  }

  return localizeEvidenceValue(value);
}

function localizeWateringEvidence(value: string): string {
  const zoneSprinklerMatch = value.match(/^(温室|姜岛农场)检测到洒水器 (\d+) 个$/u);
  if (zoneSprinklerMatch) {
    return `${localizePlantingZoneName(zoneSprinklerMatch[1])} sprinklers detected: ${zoneSprinklerMatch[2]}`;
  }
  const zoneCoverageMatch = value.match(/^(温室|姜岛农场)洒水覆盖已解析$/u);
  if (zoneCoverageMatch) {
    return `${localizePlantingZoneName(zoneCoverageMatch[1])} sprinkler coverage parsed`;
  }

  return localizeEvidenceValue(value);
}

function localizeAvailableFishEvidenceValue(value: string): string {
  return value
    .split('、')
    .map(localizeAvailableFishEntry)
    .join(', ');
}

function localizeAvailableFishEntry(entry: string): string {
  const match = entry.match(/^(.+?)（(.+?)，(.+?)）$/u);
  if (!match) {
    return localizeEvidenceValue(entry);
  }

  const [, fishName, locations, timeWindow] = match;
  const localizedFishName = localizeFishName(fishName);
  const localizedLocations = locations
    .split('/')
    .map((location) => RECOMMENDATION_TEXT_DATA.explorationFish.locations[location] ?? location)
    .join('/');
  const localizedTimeWindow = RECOMMENDATION_TEXT_DATA.explorationFish.timeWindows[timeWindow] ?? timeWindow;

  return `${localizedFishName} (${localizedLocations}, ${localizedTimeWindow})`;
}

function localizeFishName(name: string): string {
  const fish = FISH_CATALOG.find((entry) => entry.name === name);
  if (fish) {
    return RECOMMENDATION_TEXT_DATA.explorationFish.namesById[fish.id] ?? name;
  }

  return localizeKnownChineseItemNamesToEnglish(name);
}

function localizeEnglishItemStackList(value: string): string {
  return value
    .split(/、|,\s*/)
    .map(localizeEnglishItemStackEntry)
    .join(value.includes('、') ? ', ' : ', ');
}

function localizeEnglishItemStackEntry(entry: string): string {
  return entry.replace(/^(.+?) x(\d+)(.*)$/u, (_match, name: string, stack: string, suffix: string) => {
    return `${localizeItemNameToEnglish(name) ?? localizeKnownChineseItemNamesToEnglish(name)} x${stack}${localizeEnglishItemStackSuffix(suffix)}`;
  });
}

function localizeEnglishItemStackSuffix(suffix: string): string {
  return localizeKnownChineseItemNamesToEnglish(suffix)
    .replaceAll('背包', RECOMMENDATION_LOCALIZATION.inventorySources.背包)
    .replaceAll('储物箱', RECOMMENDATION_LOCALIZATION.inventorySources.储物箱)
    .replaceAll('冰箱', RECOMMENDATION_LOCALIZATION.inventorySources.冰箱)
    .replaceAll('（', '(')
    .replaceAll('）', ')');
}

function localizeEstimateDescription(description: string): string {
  const range = description.match(/预计约(\d+)-(\d+)金/);
  if (range) {
    return `Estimated ${range[1]}-${range[2]}g`;
  }

  const conservativeProfit = description.match(/保守预计利润约(-?\d+)金/);
  if (conservativeProfit) {
    return `Conservative estimated profit about ${conservativeProfit[1]}g`;
  }

  const fixed = description.match(/约(\d+)金/);
  if (fixed) {
    return `About ${fixed[1]}g`;
  }

  const profit = description.match(/单株预计利润约(-?\d+)金/);
  if (profit) {
    return `Estimated profit about ${profit[1]}g per plant`;
  }

  return localizeEvidenceValue(description);
}

function localizeUncertaintyList(uncertainty: string[]): string[] {
  return uncertainty.map((item) => {
    const exact = RECOMMENDATION_LOCALIZATION.uncertaintyTexts[item];
    if (exact) {
      return exact;
    }

    const roughIncome = item.match(/^未解析(.+)，因此收益为粗略区间。$/);
    if (roughIncome) {
      return `Not parsed yet: ${roughIncome[1]
        .split('、')
        .map(localizeMissingField)
        .join(', ')}. Income is therefore a rough range.`;
    }

    const adjustInGame = item.match(/^未解析(.+)，请按游戏内状态调整。$/);
    if (adjustInGame) {
      return `Not parsed yet: ${adjustInGame[1]
        .split('、')
        .map(localizeMissingField)
        .join(', ')}. Adjust based on the in-game state.`;
    }

    const plantingMissing = item.match(/^未解析(.+)。$/);
    if (plantingMissing) {
      return `Not parsed yet: ${plantingMissing[1]
        .split('、')
        .map(localizeMissingField)
        .join(', ')}.`;
    }

    return localizeEvidenceValue(item);
  });
}

function localizeFestivalName(name: string): string {
  return RECOMMENDATION_LOCALIZATION.festivalNames[name] ?? name;
}

function localizeCropName(name: string): string {
  return RECOMMENDATION_LOCALIZATION.cropNames[name] ?? name;
}

function localizeGeneralItemName(name: string): string {
  return localizeItemNameToEnglish(name);
}

function localizeJojaProjectName(name: string): string {
  return formatJojaProjectName(name, 'en-US');
}

function localizeMissingField(name: string): string {
  return RECOMMENDATION_LOCALIZATION.missingFieldNames[name]
    ?? name
      .replaceAll('温室', 'greenhouse ')
      .replaceAll('姜岛农场', 'Ginger Island farm ')
      .replaceAll('是否有足够空地', 'empty plot availability')
      .replaceAll('洒水覆盖', 'sprinkler coverage');
}
const englishItemNameToId = RECOMMENDATION_LOCALIZATION.englishItemNameToId;

const chineseItemNameToEnglish = createChineseItemNameToEnglishMap();

function createChineseItemNameToEnglishMap(): Map<string, string> {
  const entries: Array<[string, string]> = [];

  for (const [englishName, chineseName] of Object.entries(ITEM_NAME_ALIASES)) {
    entries.push([chineseName, englishName]);
  }

  for (const [englishName, chineseName] of Object.entries(RECOMMENDATION_LOCALIZATION.englishTextNames)) {
    if (/[\u4e00-\u9fff]/.test(chineseName)) {
      entries.push([chineseName, englishName]);
    }
  }

  for (const [id, chineseName] of Object.entries(PREPARATION_RULES.bombs.namesByLanguage['zh-CN'])) {
    const englishName = PREPARATION_RULES.bombs.namesByLanguage['en-US'][id];
    if (englishName) {
      entries.push([chineseName, englishName]);
    }
  }

  for (const [id, chineseName] of Object.entries(PREPARATION_RULES.staircases.namesByLanguage['zh-CN'])) {
    const englishName = PREPARATION_RULES.staircases.namesByLanguage['en-US'][id];
    if (englishName) {
      entries.push([chineseName, englishName]);
    }
  }

  for (const [id, englishName] of Object.entries(COMMUNITY_CENTER_TRANSLATIONS.itemsById)) {
    const chineseName = getItemNameById(id);
    if (chineseName && /[\u4e00-\u9fff]/.test(chineseName)) {
      entries.push([chineseName, englishName]);
    }
  }

  for (const [chineseName, englishName] of Object.entries(RECOMMENDATION_LOCALIZATION.generalItemNames)) {
    entries.push([chineseName, englishName]);
  }

  for (const [chineseName, englishName] of Object.entries(RECOMMENDATION_LOCALIZATION.cropNames)) {
    entries.push([chineseName, englishName]);
  }

  for (const entry of createProcessedItemNameEntries()) {
    entries.push(entry);
  }

  return new Map(entries.sort(([left], [right]) => right.length - left.length));
}

function createProcessedItemNameEntries(): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const fishNameEntries = FISH_CATALOG.map((fish) => {
    return [fish.name, RECOMMENDATION_TEXT_DATA.explorationFish.namesById[fish.id]] as [string, string | undefined];
  }).filter((entry): entry is [string, string] => entry[1] !== undefined);

  for (const [chineseName, englishName] of fishNameEntries) {
    entries.push([`${chineseName}鱼籽`, `${englishName} Roe`]);
    entries.push([`陈年${chineseName}鱼籽`, `Aged ${englishName} Roe`]);
  }

  return entries;
}

function getEnglishItemNameFromAlias(chineseName: string): string | undefined {
  return Object.entries(ITEM_NAME_ALIASES)
    .find(([, alias]) => alias === chineseName)?.[0];
}

function localizeItemNameToEnglish(name: string): string {
  const cleanName = name.trim();
  const id = getItemIdByName(cleanName);
  if (id !== undefined) {
    return COMMUNITY_CENTER_TRANSLATIONS.itemsById[String(id)]
      ?? getEnglishItemNameFromAlias(getItemNameById(id) ?? cleanName)
      ?? chineseItemNameToEnglish.get(cleanName)
      ?? RECOMMENDATION_LOCALIZATION.generalItemNames[cleanName]
      ?? localizeCropName(cleanName)
      ?? cleanName;
  }

  return chineseItemNameToEnglish.get(cleanName)
    ?? RECOMMENDATION_LOCALIZATION.generalItemNames[cleanName]
    ?? localizeCropName(cleanName);
}

function localizeKnownChineseItemNamesToEnglish(value: string): string {
  let localized = value;

  for (const [chineseName, englishName] of chineseItemNameToEnglish) {
    if (chineseName.length < 2) {
      continue;
    }
    localized = localized.replaceAll(chineseName, englishName);
  }

  return localized;
}
