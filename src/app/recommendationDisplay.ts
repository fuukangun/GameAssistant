import type { CommunityCenterDeliverableDetail, RecommendationItem } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { formatEquipmentName, formatNpcName } from './displayFormat.ts';
import { formatItemName } from './itemDisplay.ts';
import { getItemIdByName } from '../stardew/data/items.ts';
import { COMMUNITY_CENTER_TRANSLATIONS } from '../stardew/data/communityCenterTranslations.ts';
import { formatJojaProjectName } from './jojaProjectDisplay.ts';
import { JOJA_PROJECT_NAME_TRANSLATIONS } from '../stardew/data/jojaProjectTranslations.ts';
import { RECOMMENDATION_LOCALIZATION } from '../stardew/data/recommendationLocalization.ts';
import { RECOMMENDATION_DISPLAY_DATA } from './recommendationDisplayData.ts';
import { RECOMMENDATION_TEXT_DATA } from './recommendationTextData.ts';

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
    detail: localized.detail?.communityCenterDeliverables
      ? {
        communityCenterDeliverables: localized.detail.communityCenterDeliverables.map((deliverable) => ({
          ...deliverable,
          itemName: localizeChineseItemName(deliverable.itemId, deliverable.itemName),
        })),
      }
      : localized.detail,
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
  if (!known) {
    return localizeEvidenceAndEstimate(item);
  }

  return localizeEvidenceAndEstimate({
    ...item,
    ...known,
  });
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
          .replace('{item}', localizeGeneralItemName(giftMatch[2]))
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
      value: localizeEvidenceValue(evidence.value),
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
  if (label === '库存物品' || label === '已有种子') {
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
    .map((entry) => entry.replace(/^(.+?) x(\d+)/, (_match, name: string, stack: string) => {
      return `${localizeChineseItemNameFromText(name)} x${stack}`;
    }))
    .join(value.includes('、') ? '、' : ', ');
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

  return localizeChineseText(cleanName);
}

function localizeChineseItemName(itemId: number | string, fallback: string): string {
  return formatItemName({ id: itemId, name: fallback }, 'zh-CN');
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

function localizeChineseText(value: string): string {
  let localized = value;

  for (const [en, zh] of Object.entries(RECOMMENDATION_LOCALIZATION.englishTextNames)) {
    localized = localized.replaceAll(en, zh);
  }

  return localized;
}

function localizeEvidenceLabel(label: string): string {
  return RECOMMENDATION_LOCALIZATION.evidenceLabels[label] ?? label;
}

function localizeEvidenceValue(value: string): string {
  let localized = value;

  for (const [zh, en] of Object.entries(RECOMMENDATION_LOCALIZATION.statusTexts)) {
    localized = localized.replaceAll(zh, en);
  }

  const phraseTranslations = Object.entries({
    ...RECOMMENDATION_LOCALIZATION.cropNames,
    ...RECOMMENDATION_LOCALIZATION.generalItemNames,
    ...RECOMMENDATION_LOCALIZATION.festivalNames,
    ...COMMUNITY_CENTER_TRANSLATIONS.rooms,
    ...COMMUNITY_CENTER_TRANSLATIONS.bundles,
    ...COMMUNITY_CENTER_TRANSLATIONS.itemsById,
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
  return RECOMMENDATION_LOCALIZATION.generalItemNames[name] ?? localizeCropName(name);
}

function localizeJojaProjectName(name: string): string {
  return formatJojaProjectName(name, 'en-US');
}

function localizeMissingField(name: string): string {
  return RECOMMENDATION_LOCALIZATION.missingFieldNames[name] ?? name;
}
const englishItemNameToId = RECOMMENDATION_LOCALIZATION.englishItemNameToId;
