import type { InventoryItem, SaveTime, StardewSaveSnapshot, Weather } from '../shared/types.ts';
import { BASIC_PLANTING_OPTIONS } from '../stardew/data/crops.ts';
import { normalizeItemId } from '../stardew/data/items.ts';
import { FESTIVALS } from '../stardew/data/calendar.ts';
import { findAvailableFishForDay } from '../stardew/data/fish.ts';
import { createCommunityCenterSummary } from '../stardew/data/communityCenter.ts';
import { isSprinklerItemId, isSprinklerItemName } from '../stardew/data/preparationRules.ts';
import { INVENTORY_SOURCE_LOCALE_LABELS } from '../stardew/data/inventorySourceLocaleLabels.ts';
import { EXPLORATION_STATUS_LABELS } from '../stardew/data/explorationStatusLabels.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';
import { createFarmPlotStatusSummary } from './farmPlotStatus.ts';
import { formatEquipmentName } from './displayFormat.ts';
import { RECOMMENDATION_TEXT_DATA, type RecommendationTextData } from './recommendationTextData.ts';

const DAYS_PER_WEEK = 7;

export interface StatusItem {
  label: string;
  value: string;
}

export interface ExplorationProgressSection {
  id: 'mapUnlocks' | 'mineProgress';
  title: string;
  items: StatusItem[];
}

export function createExplorationProgressSections(
  snapshot: StardewSaveSnapshot,
  weather?: Weather,
  language: AppLanguage = 'zh-CN',
): ExplorationProgressSection[] {
  return [
    {
      id: 'mapUnlocks',
      title: t(language, 'exploration.section.mapUnlocks'),
      items: createMapUnlockItems(snapshot, language),
    },
    {
      id: 'mineProgress',
      title: t(language, 'exploration.section.mineProgress'),
      items: createMineProgressItems(snapshot, language),
    },
  ];
}

export function createExplorationStatusItems(
  snapshot: StardewSaveSnapshot,
  weather?: Weather,
  language: AppLanguage = 'zh-CN',
): StatusItem[] {
  return [
    { label: t(language, 'exploration.shop'), value: formatShopAvailability(snapshot.time, language) },
    { label: t(language, 'exploration.seedPlots'), value: formatSeedAndPlotStatus(snapshot, language) },
    { label: t(language, 'exploration.sprinklers'), value: formatSprinklerStatus(snapshot, language) },
    { label: t(language, 'exploration.fishing'), value: formatFishingAccessStatus(snapshot, weather, language) },
    { label: t(language, 'exploration.desert'), value: snapshot.farm.hasDesertAccess ? EXPLORATION_STATUS_LABELS.openStatus[language] : EXPLORATION_STATUS_LABELS.closedOrUnknownStatus[language] },
    { label: t(language, 'exploration.island'), value: snapshot.farm.hasIslandAccess ? EXPLORATION_STATUS_LABELS.openStatus[language] : EXPLORATION_STATUS_LABELS.closedOrUnknownStatus[language] },
    { label: t(language, 'exploration.route'), value: formatProgressionStatus(snapshot, language) },
  ];
}

export function createMapUnlockItems(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): StatusItem[] {
  return [
    { label: t(language, 'exploration.desert'), value: formatOpenStatus(snapshot.farm.hasDesertAccess, language) },
    { label: t(language, 'exploration.island'), value: formatOpenStatus(snapshot.farm.hasIslandAccess, language) },
  ];
}

export function createMineProgressItems(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): StatusItem[] {
  return [
    { label: t(language, 'summary.mine'), value: formatMineLevel(snapshot.farm.mineLevel, language) },
    { label: EXPLORATION_STATUS_LABELS.grottoRouteLabel[language], value: formatSkullCavernLevel(snapshot, language) },
    { label: EXPLORATION_STATUS_LABELS.volcanoRouteLabel[language], value: formatOpenStatus(snapshot.farm.hasVolcanoDungeonAccess, language) },
  ];
}

export function createFishingAccessItems(snapshot: StardewSaveSnapshot, weather?: Weather, language: AppLanguage = 'zh-CN'): StatusItem[] {
  return [
    { label: t(language, 'exploration.fishingEquipment'), value: formatFishingEquipmentStatus(snapshot, language) },
    { label: t(language, 'exploration.todayFish'), value: formatFishAvailableToday(snapshot, weather, language) },
  ];
}

export function createShopsAndRoutesItems(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): StatusItem[] {
  return [
    { label: t(language, 'exploration.shop'), value: formatShopAvailability(snapshot.time, language) },
    { label: t(language, 'exploration.route'), value: formatProgressionStatus(snapshot, language) },
  ];
}

export function formatShopAvailability(date: SaveTime, language: AppLanguage = 'zh-CN'): string {
  const festival = FESTIVALS.find((item) => item.season === date.season && item.day === date.day);
  if (festival) {
    return EXPLORATION_STATUS_LABELS.shopFestivalStatus[language];
  }

  return getDayOfWeek(date) === 3 ? EXPLORATION_STATUS_LABELS.shopWednesdayStatus[language] : EXPLORATION_STATUS_LABELS.shopDefaultStatus[language];
}

export function formatSprinklerStatus(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): string {
  if (!Array.isArray(snapshot.inventory)) {
    return EXPLORATION_STATUS_LABELS.pendingStatus[language];
  }

  return snapshot.inventory.some(isSprinklerItem) ? EXPLORATION_STATUS_LABELS.sprinklerFoundStatus[language] : EXPLORATION_STATUS_LABELS.sprinklerMissingStatus[language];
}

export function formatSeedAndPlotStatus(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): string {
  if (!Array.isArray(snapshot.inventory)) {
    return EXPLORATION_STATUS_LABELS.seedPendingStatus[language];
  }

  const plotSummary = createFarmPlotStatusSummary(snapshot);
  const cropText = plotSummary.plantedCropCount > 0
    ? formatExplorationTemplate('parsedCrops', language, {
      count: plotSummary.plantedCropCount,
    })
    : '';
  const seedText = formatRecognizedSeedStatus(snapshot.inventory, language);
  if (!seedText) {
    return EXPLORATION_STATUS_LABELS.seedNoneStatus[language];
  }
  const plotText = formatPlotAvailabilityText(plotSummary.emptyTilledTileCount, language);

  if (language === 'zh-CN') {
    return `${cropText}${seedText}；${plotText}`;
  }

  return `${cropText}${seedText}; ${plotText}`;
}

function formatRecognizedSeedStatus(inventory: InventoryItem[], language: AppLanguage): string | undefined {
  const seeds = inventory.filter(isSupportedSeed);
  if (seeds.length === 0) {
    return undefined;
  }

  const summary = seeds.slice(0, 5).map((item) => {
    const source = formatSeedSource(item, language);
    return `${formatSeedName(item, language)} x${item.stack}${source ? ` (${source})` : ''}`;
  }).join(language === 'zh-CN' ? '、' : ', ');

  return formatExplorationTemplate('recognizedSeeds', language, {
    summary: language === 'zh-CN' ? summary.replaceAll(' (', '（').replaceAll(')', '）') : summary,
  });
}

function formatSeedName(item: InventoryItem, language: AppLanguage): string {
  if (language === 'zh-CN') {
    return item.name;
  }

  const itemId = normalizeItemId(item.id);
  const crop = BASIC_PLANTING_OPTIONS.find((option) => option.seedIds.some((seedId) => normalizeItemId(seedId) === itemId)
    || option.seedName === item.name);
  return crop ? `${toTitleCase(crop.id.replace('-starter', '').replaceAll('-', ' '))} Seeds` : item.name;
}

function formatSeedSource(item: InventoryItem, language: AppLanguage): string | undefined {
  if (item.source === 'backpack') {
    return INVENTORY_SOURCE_LOCALE_LABELS[language].backpack;
  }
  if (item.source === 'chest') {
    return INVENTORY_SOURCE_LOCALE_LABELS[language].chest;
  }
  if (item.source === 'fridge') {
    return INVENTORY_SOURCE_LOCALE_LABELS[language].fridge;
  }
  if (!item.sourceLabel) {
    return undefined;
  }

  if (language === 'zh-CN') {
    return item.sourceLabel;
  }

  return INVENTORY_SOURCE_LOCALE_LABELS['en-US'][item.sourceLabel] ?? item.sourceLabel;
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlotAvailabilityText(emptyTilledTileCount: number | undefined, language: AppLanguage): string {
  if (emptyTilledTileCount === undefined) {
    return RECOMMENDATION_TEXT_DATA.explorationStatus.plotsUnparsed[language];
  }

  return formatExplorationTemplate('tilledEmptyPlots', language, {
    count: emptyTilledTileCount,
  });
}

export function formatFishingAccessStatus(snapshot: StardewSaveSnapshot, weather?: Weather, language: AppLanguage = 'zh-CN'): string {
  return `${formatFishingEquipmentStatus(snapshot, language)}${language === 'zh-CN' ? '；' : '; '}${formatFishAvailableToday(snapshot, weather, language)}`;
}

export function formatFishingEquipmentStatus(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): string {
  const equipment = snapshot.player?.equipment;
  const rod = equipment?.fishingRodName
    ? `${EXPLORATION_STATUS_LABELS.fishingRodLabel[language]}：${formatEquipmentName(equipment.fishingRodName, language)}`
    : EXPLORATION_STATUS_LABELS.fishingRodPending[language];
  const bait = equipment?.baitName
    ? `${EXPLORATION_STATUS_LABELS.baitLabel[language]}：${formatEquipmentName(equipment.baitName, language)}`
    : EXPLORATION_STATUS_LABELS.baitPending[language];

  return `${rod}${language === 'zh-CN' ? '；' : '; '}${bait}`;
}

export function formatFishAvailableToday(snapshot: StardewSaveSnapshot, weather?: Weather, language: AppLanguage = 'zh-CN'): string {
  const supportedFish = findAvailableFishForDay({
    date: snapshot.time,
    weather,
    access: {
      desert: snapshot.farm?.hasDesertAccess,
      island: snapshot.farm?.hasIslandAccess,
      mineLevel: snapshot.farm?.mineLevel,
    },
  })
    .slice(0, 8)
    .map((fish) => formatFishAvailabilityEntry(fish, language));
  if (supportedFish.length === 0) {
    return EXPLORATION_STATUS_LABELS.fishTodayNoneStatus[language];
  }

  return `${EXPLORATION_STATUS_LABELS.fishTodayPrefix[language]}${supportedFish.join(language === 'zh-CN' ? '、' : ', ')}${EXPLORATION_STATUS_LABELS.fishTodaySuffix[language]}`;
}

function formatFishAvailabilityEntry(
  fish: ReturnType<typeof findAvailableFishForDay>[number],
  language: AppLanguage,
): string {
  const name = language === 'zh-CN'
    ? fish.name
    : RECOMMENDATION_TEXT_DATA.explorationFish.namesById[fish.id] ?? fish.name;
  const locations = fish.locations
    .map((location) => language === 'zh-CN'
      ? location
      : RECOMMENDATION_TEXT_DATA.explorationFish.locations[location] ?? location)
    .join('/');
  const timeWindow = language === 'zh-CN'
    ? fish.timeWindow
    : RECOMMENDATION_TEXT_DATA.explorationFish.timeWindows[fish.timeWindow] ?? fish.timeWindow;

  return language === 'zh-CN'
    ? `${name}（${locations}，${timeWindow}）`
    : `${name} (${locations}, ${timeWindow})`;
}

export function formatProgressionStatus(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): string {
  if (snapshot.farm.communityCenterRoute === 'joja') {
    const joja = snapshot.progression.joja;
    if (!joja) {
      return EXPLORATION_STATUS_LABELS.jojaProgressUnparsed[language];
    }

    return `${EXPLORATION_STATUS_LABELS.jojaPurchasedPrefix[language]}${joja.completedProjects}/${joja.totalProjects}${EXPLORATION_STATUS_LABELS.jojaPurchasedSuffix[language]}`;
  }

  if (snapshot.farm.communityCenterRoute === 'community_center') {
    const communityCenter = snapshot.progression.communityCenter;
    if (!communityCenter) {
      return EXPLORATION_STATUS_LABELS.communityCenterUnparsed[language];
    }
    if (communityCenter.completed) {
      return EXPLORATION_STATUS_LABELS.communityCenterRestored[language];
    }

    const summary = createCommunityCenterSummary(snapshot);
    const deliverableText = summary.deliverables.length > 0
      ? `${EXPLORATION_STATUS_LABELS.communityCenterDeliverablePrefix[language]}${summary.deliverables.length}${EXPLORATION_STATUS_LABELS.communityCenterDeliverableSuffix[language]}`
      : '';
    return `${EXPLORATION_STATUS_LABELS.communityCenterProgressPrefix[language]}${communityCenter.percentage}${EXPLORATION_STATUS_LABELS.communityCenterProgressSuffix[language]}${deliverableText}`;
  }

  return EXPLORATION_STATUS_LABELS.routeStatusUnconfirmed[language];
}

function getDayOfWeek(date: SaveTime): number {
  return ((date.day - 1) % DAYS_PER_WEEK) + 1;
}

function formatOpenStatus(isOpen: boolean | undefined, language: AppLanguage = 'zh-CN'): string {
  return isOpen ? EXPLORATION_STATUS_LABELS.openStatus[language] : EXPLORATION_STATUS_LABELS.closedOrUnknownStatus[language];
}

function formatMineLevel(mineLevel: number | undefined, language: AppLanguage = 'zh-CN'): string {
  if (mineLevel === undefined || !Number.isFinite(mineLevel)) {
    return EXPLORATION_STATUS_LABELS.mineUnparsed[language];
  }

  return formatExplorationTemplate('mineDepth', language, {
    floor: Math.max(0, Math.trunc(mineLevel)),
  });
}

function formatSkullCavernLevel(snapshot: StardewSaveSnapshot, language: AppLanguage = 'zh-CN'): string {
  if (!snapshot.farm.hasSkullCavernAccess) {
    return formatOpenStatus(false, language);
  }

  if (snapshot.farm.skullCavernLevel === undefined || !Number.isFinite(snapshot.farm.skullCavernLevel)) {
    return formatOpenStatus(true, language);
  }

  return formatMineLevel(snapshot.farm.skullCavernLevel, language);
}

function formatExplorationTemplate(
  key: Exclude<keyof RecommendationTextData['explorationStatus'], 'plotsUnparsed'>,
  language: AppLanguage,
  replacements: Record<string, string | number>,
): string {
  let template = RECOMMENDATION_TEXT_DATA.explorationStatus[key][language];
  for (const [name, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{${name}}`, String(value));
  }

  return template;
}

function isSprinklerItem(item: InventoryItem): boolean {
  return isSprinklerItemId(item.id) || isSprinklerItemName(item.name);
}

function isSupportedSeed(item: InventoryItem): boolean {
  const itemId = normalizeItemId(item.id);
  return BASIC_PLANTING_OPTIONS.some((crop) => {
    return crop.seedIds.some((seedId) => normalizeItemId(seedId) === itemId)
      || item.name === crop.seedName;
  });
}
