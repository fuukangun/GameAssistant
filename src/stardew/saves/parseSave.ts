import { XMLParser } from 'fast-xml-parser';
import type {
  CropSummary,
  EquipmentSummary,
  FarmPlotSummary,
  AnimalFeedSummary,
  InventoryItem,
  ParseWarning,
  ProducedItemSummary,
  RelationshipSummary,
  StardewSaveSnapshot,
  Weather,
} from '../../shared/types.ts';
import { getItemNameById } from '../data/items.ts';
import { SAVE_PARSING_RULES } from '../data/saveParsingRules.ts';

const WEATHER_VALUES = new Set<Weather>(SAVE_PARSING_RULES.weatherValues);
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

type XmlPrimitive = string | number | boolean;
type XmlValue = XmlPrimitive | XmlObject | XmlValue[];

interface XmlObject {
  [key: string]: XmlValue | undefined;
}

export function parseStardewSaveXml(
  xml: string,
  filePath: string,
  fileModifiedAt: string,
): StardewSaveSnapshot {
  const warnings: ParseWarning[] = [];
  const root = parseRoot(xml);
  const year = numberField(root, 'year');
  const season = textField(root, 'currentSeason');
  const day = numberField(root, 'dayOfMonth');
  const requiredMissing = year === undefined || !isSeason(season) || day === undefined;

  if (requiredMissing) {
    warnings.push({
      code: 'missing_field',
      severity: 'error',
      message: '存档缺少年、季节或日期字段，无法生成计划日期。',
    });
  }

  if (hasMultiplayerData(root)) {
    warnings.push({
      code: 'unsupported_multiplayer',
      severity: 'warning',
      message: '检测到多人存档数据，当前版本仅按主玩家基础字段生成计划。',
      fieldPath: 'SaveGame.farmhands',
    });
  }

  const player = objectField(root, 'player') ?? {};
  const farmName = textField(player, 'farmName') ?? fallbackNameFromPath(filePath);
  const playerName = textField(player, 'name') ?? fallbackNameFromPath(filePath);
  const weather = textField(root, 'weatherForTomorrow');
  const whichFarm = textField(root, 'whichFarm') ?? '0';

  const route = detectRoute(root);
  const communityCenterCompleted = boolField(root, 'hasRestoredCommunityCenter') ?? false;
  const hasDesertAccess = detectDesertAccess(root, player);
  const hasIslandAccess = detectIslandAccess(root, player);
  const mineDepth = parseMineDepth(root, player);

  return {
    saveIdentity: {
      uniqueId: textField(root, 'uniqueIDForThisGame'),
      filePath,
      fileModifiedAt,
    },
    parseMeta: {
      status: requiredMissing ? 'failed' : 'ok',
      gameVersion: textField(root, 'gameVersion'),
      parserVersion: '0.2.0',
      warnings,
    },
    farm: {
      farmName,
      playerName,
      farmType: SAVE_PARSING_RULES.farmTypes[whichFarm] ?? whichFarm,
      hasDesertAccess,
      hasIslandAccess,
      hasSkullCavernAccess: detectSkullCavernAccess(root, player, hasDesertAccess, mineDepth.regularMineLevel),
      hasVolcanoDungeonAccess: detectVolcanoDungeonAccess(root, player, hasIslandAccess),
      mineLevel: mineDepth.regularMineLevel,
      skullCavernLevel: mineDepth.skullCavernLevel,
      communityCenterRoute: route,
    },
    farmPlotSummary: parseFarmPlotSummary(root),
    player: {
      maxEnergy: numberField(player, 'maxStamina') ?? 0,
      health: numberField(player, 'health'),
      maxHealth: numberField(player, 'maxHealth'),
      dailyLuck: numberField(root, 'dailyLuck'),
      maxItems: numberField(player, 'maxItems') ?? 0,
      equipment: parseEquipment(root, player),
    },
    time: {
      year: year ?? 1,
      season: isSeason(season) ? season : 'spring',
      day: day ?? 1,
    },
    weatherForTomorrow: isWeather(weather) ? weather : undefined,
    wallet: {
      money: numberField(player, 'money') ?? 0,
      totalMoneyEarned: numberField(player, 'totalMoneyEarned'),
    },
    skills: {
      farming: numberField(player, 'farmingLevel') ?? 0,
      mining: numberField(player, 'miningLevel') ?? 0,
      foraging: numberField(player, 'foragingLevel') ?? 0,
      fishing: numberField(player, 'fishingLevel') ?? 0,
      combat: numberField(player, 'combatLevel') ?? 0,
    },
    inventory: parseInventory(root, player),
    crops: parseCrops(root),
    readyMachineOutputs: parseReadyMachineOutputs(root),
    animalProducts: parseAnimalProducts(root),
    animalFeed: parseAnimalFeed(root),
    progression: {
      communityCenter: {
        completed: communityCenterCompleted,
        percentage: communityCenterCompleted ? 100 : parseCommunityCenterPercentage(root),
        bundleStates: parseCommunityCenterBundleStates(root),
      },
      joja: route === 'joja' ? parseJojaProgress(root) : undefined,
    },
    relationships: parseRelationships(player),
  };
}

function parseJojaProgress(root: XmlObject): { completedProjects: number; totalProjects: number; completedMarkers: string[] } {
  const serialized = JSON.stringify(root);
  const completedMarkers = SAVE_PARSING_RULES.jojaProjectMarkers.filter((marker) => serialized.includes(marker));
  return {
    completedProjects: completedMarkers.length,
    totalProjects: SAVE_PARSING_RULES.jojaProjectMarkers.length,
    completedMarkers,
  };
}

function parseCommunityCenterPercentage(root: XmlObject): number {
  const communityCenterLocation = findCommunityCenterLocation(root);
  if (!communityCenterLocation) {
    return 0;
  }

  const areaProgress = countBooleanProgress(objectField(communityCenterLocation, 'areasComplete'));
  const bundleProgress = countBundleCompletionProgress(objectField(communityCenterLocation, 'bundles'));
  const progress = addProgress(areaProgress, bundleProgress);
  if (progress.total === 0) {
    return 0;
  }

  return Math.round((progress.completed / progress.total) * 100);
}

function parseCommunityCenterBundleStates(root: XmlObject): Array<{ key: number; completed: boolean; donatedSlots: boolean[] }> {
  const communityCenterLocation = findCommunityCenterLocation(root);
  const bundles = objectField(communityCenterLocation ?? {}, 'bundles');
  return asArray(bundles?.item).flatMap((item) => {
    const key = numberField(objectField(item, 'key') ?? {}, 'int');
    const value = objectField(item, 'value');
    if (key === undefined || value === undefined) {
      return [];
    }

    const donatedSlots = collectBooleans(value);
    if (donatedSlots.length === 0) {
      return [];
    }

    return [{
      key,
      completed: donatedSlots[0] === true,
      donatedSlots,
    }];
  });
}

function collectBooleans(value: XmlValue | undefined): boolean[] {
  if (value === undefined) {
    return [];
  }

  if (typeof value === 'boolean') {
    return [value];
  }

  if (value === 'true') {
    return [true];
  }

  if (value === 'false') {
    return [false];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectBooleans(item));
  }

  if (!isXmlObject(value)) {
    return [];
  }

  return Object.values(value).flatMap((item) => collectBooleans(item));
}

function countBundleCompletionProgress(value: XmlValue | undefined): { completed: number; total: number } {
  if (value === undefined) {
    return { completed: 0, total: 0 };
  }

  if (Array.isArray(value)) {
    let progress = { completed: 0, total: 0 };
    for (const item of value) {
      progress = addProgress(progress, countBundleCompletionProgress(item));
    }
    return progress;
  }

  if (typeof value === 'boolean') {
    return { completed: value ? 1 : 0, total: 1 };
  }

  if (value === 'true' || value === 'false') {
    return { completed: value === 'true' ? 1 : 0, total: 1 };
  }

  if (!isXmlObject(value)) {
    return { completed: 0, total: 0 };
  }

  const items = asArray(value.item);
  if (items.length > 0) {
    let progress = { completed: 0, total: 0 };
    for (const item of items) {
      const bundleValue = objectField(item, 'value');
      if (bundleValue === undefined) {
        continue;
      }

      progress = addProgress(progress, countBundleCompletionProgress(bundleValue));
    }
    return progress;
  }

  const firstBoolean = findFirstBoolean(value);
  if (firstBoolean !== undefined) {
    return { completed: firstBoolean ? 1 : 0, total: 1 };
  }

  return { completed: 0, total: 0 };
}

function findFirstBoolean(value: XmlValue | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstBoolean(item);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }

  if (!isXmlObject(value)) {
    return undefined;
  }

  for (const item of Object.values(value)) {
    const found = findFirstBoolean(item);
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

function findCommunityCenterLocation(root: XmlObject): XmlObject | undefined {
  return collectObjectsByKey(root, 'GameLocation').find((location) => {
    const name = textField(location, 'name');
    return name === 'CommunityCenter' || name === 'Community Center';
  });
}

function countBooleanProgress(value: XmlValue | undefined): { completed: number; total: number } {
  if (value === undefined) {
    return { completed: 0, total: 0 };
  }

  if (typeof value === 'boolean') {
    return { completed: value ? 1 : 0, total: 1 };
  }

  if (value === 'true' || value === 'false') {
    return { completed: value === 'true' ? 1 : 0, total: 1 };
  }

  if (Array.isArray(value)) {
    let progress = { completed: 0, total: 0 };
    for (const item of value) {
      progress = addProgress(progress, countBooleanProgress(item));
    }
    return progress;
  }

  if (isXmlObject(value)) {
    let progress = { completed: 0, total: 0 };
    for (const item of Object.values(value)) {
      if (item !== undefined) {
        progress = addProgress(progress, countBooleanProgress(item));
      }
    }
    return progress;
  }

  return { completed: 0, total: 0 };
}

function addProgress(
  left: { completed: number; total: number },
  right: { completed: number; total: number },
): { completed: number; total: number } {
  return {
    completed: left.completed + right.completed,
    total: left.total + right.total,
  };
}

function parseEquipment(root: XmlObject, player: XmlObject): EquipmentSummary {
  const carriedItems = parseInventoryItems(player);
  const currentTool = objectField(player, 'CurrentTool');
  const toolItems = [
    ...carriedItems,
    ...(currentTool ? [currentTool] : []),
  ];
  const storedItems = [
    ...parseChestItems(root),
    ...parseFridgeItems(root),
  ];
  const weapon = findWeaponMatch(toolItems, storedItems);
  const fishingRod = findEquipmentMatch(
    toolItems,
    storedItems,
    SAVE_PARSING_RULES.equipment.fishingRod.types,
    SAVE_PARSING_RULES.equipment.fishingRod.keywords,
  );
  const hoe = findEquipmentMatch(
    toolItems,
    storedItems,
    SAVE_PARSING_RULES.equipment.hoe.types,
    SAVE_PARSING_RULES.equipment.hoe.keywords,
  );
  const pickaxe = findEquipmentMatch(
    toolItems,
    storedItems,
    SAVE_PARSING_RULES.equipment.pickaxe.types,
    SAVE_PARSING_RULES.equipment.pickaxe.keywords,
  );
  const axe = findAxeMatch(toolItems, storedItems);
  const wateringCan = findEquipmentMatch(
    toolItems,
    storedItems,
    SAVE_PARSING_RULES.equipment.wateringCan.types,
    SAVE_PARSING_RULES.equipment.wateringCan.keywords,
  );
  const scythe = findScytheMatch(toolItems, storedItems);
  const trashCan = findEquipmentMatch(
    toolItems,
    storedItems,
    SAVE_PARSING_RULES.equipment.trashCan.types,
    SAVE_PARSING_RULES.equipment.trashCan.keywords,
  );
  const pan = findPanMatch(toolItems, storedItems);
  const trashCanName = trashCan.name ?? parseTrashCanLevel(player);

  return {
    weaponName: weapon.name,
    bootsName: getEquipmentDisplayName(objectField(player, 'boots') ?? {}),
    ringNames: [
      getEquipmentDisplayName(objectField(player, 'leftRing') ?? {}),
      getEquipmentDisplayName(objectField(player, 'rightRing') ?? {}),
    ].filter((name): name is string => Boolean(name)),
    fishingRodName: fishingRod.name,
    baitName: parseBaitName(carriedItems),
    hoeName: hoe.name,
    pickaxeName: pickaxe.name,
    axeName: axe.name,
    wateringCanName: wateringCan.name,
    scytheName: scythe.name,
    trashCanName,
    panName: pan.name,
    carried: {
      weapon: weapon.carried,
      fishingRod: fishingRod.carried,
      bait: true,
      hoe: hoe.carried,
      pickaxe: pickaxe.carried,
      axe: axe.carried,
      wateringCan: wateringCan.carried,
      scythe: scythe.carried,
      trashCan: trashCan.carried ?? (trashCanName ? true : undefined),
      pan: pan.carried,
    },
  };
}

function parseInventory(root: XmlObject, player: XmlObject): InventoryItem[] {
  return [
    ...parseInventoryItems(player).flatMap((item) => parseInventoryItem(item, 'backpack', '背包')),
    ...parseChestItems(root).flatMap((item) => parseInventoryItem(item, 'chest', '储物箱')),
    ...parseFridgeItems(root).flatMap((item) => parseInventoryItem(item, 'fridge', '冰箱')),
  ];
}

function parseInventoryItem(
  item: XmlObject,
  source: NonNullable<InventoryItem['source']>,
  sourceLabel: string,
): InventoryItem[] {
  const id = parseItemId(item);
  const name = parseItemName(item, id);
  if (!id && !name) {
    return [];
  }

  const edibility = numberField(item, 'edibility');
  const energy = numberField(item, 'staminaRecoveredOnConsumption');
  const health = numberField(item, 'healthRecoveredOnConsumption');
  return [{
    id: id ?? name ?? '',
    name: name ?? `物品 #${id}`,
    stack: numberField(item, 'Stack') ?? numberField(item, 'stack') ?? 1,
    quality: numberField(item, 'Quality') ?? numberField(item, 'quality') ?? 0,
    isEdible: edibility !== undefined ? edibility > -300 : energy !== undefined || health !== undefined,
    energy,
    health,
    source,
    sourceLabel,
  }];
}

function parseItemId(item: XmlObject): string | undefined {
  return textField(item, 'ItemId')
    ?? textField(item, 'itemId')
    ?? textField(item, 'parentSheetIndex')
    ?? textField(item, 'ParentSheetIndex')
    ?? textField(item, 'QualifiedItemId')
    ?? textField(item, 'qualifiedItemId');
}

function parseItemName(item: XmlObject, id: string | undefined): string | undefined {
  return textField(item, 'Name')
    ?? textField(item, 'name')
    ?? textField(item, 'DisplayName')
    ?? textField(item, 'displayName')
    ?? getItemNameById(id)
    ?? (id ? `物品 #${id}` : undefined);
}

function parseInventoryItems(player: XmlObject): XmlObject[] {
  const items = objectField(player, 'items');
  return asArray(items?.Item);
}

function parseChestItems(root: XmlObject): XmlObject[] {
  const heldObjectItems = collectObjectsByKey(root, 'heldObject').flatMap((heldObject) => {
    const chest = objectField(heldObject, 'Chest');
    const items = chest ? objectField(chest, 'items') : undefined;
    return asArray(items?.Item);
  });

  const directChestItems = collectObjectsByKey(root, 'Object').flatMap((object) => {
    if (!isChestObject(object)) {
      return [];
    }

    const items = objectField(object, 'items');
    return asArray(items?.Item);
  });

  return [...heldObjectItems, ...directChestItems];
}

function isChestObject(object: XmlObject): boolean {
  if (!objectField(object, 'items')) {
    return false;
  }

  const xsiType = textField(object, '@_xsi:type');
  const name = textField(object, 'name') ?? textField(object, 'Name');
  return xsiType === 'Chest' || name === 'Chest';
}

function parseFridgeItems(root: XmlObject): XmlObject[] {
  return collectObjectsByKey(root, 'fridge').flatMap((fridge) => {
    const items = objectField(fridge, 'items');
    return asArray(items?.Item);
  });
}

function findEquipmentMatch(
  carriedItems: XmlObject[],
  storedItems: XmlObject[],
  types: string[],
  keywords: string[],
): { name?: string; carried?: boolean } {
  return findEquipmentMatchByPredicate(
    carriedItems,
    storedItems,
    (item) => getMatchingEquipmentItems([item], types, keywords).length > 0,
  );
}

function findEquipmentMatchByPredicate(
  carriedItems: XmlObject[],
  storedItems: XmlObject[],
  predicate: (item: XmlObject) => boolean,
): { name?: string; carried?: boolean } {
  const carriedItem = carriedItems.find(predicate);
  if (carriedItem) {
    return { name: getEquipmentDisplayName(carriedItem), carried: true };
  }

  const storedItem = storedItems.find(predicate);
  if (storedItem) {
    return { name: getEquipmentDisplayName(storedItem), carried: false };
  }

  return {};
}

function getMatchingEquipmentItems(items: XmlObject[], types: string[], keywords: string[]): XmlObject[] {
  return items.filter((item) => {
    const type = textField(item, '@_xsi:type');
    const name = getEquipmentSearchText(item);
    const typeMatches = type !== undefined && types.includes(type);
    const keywordMatches = keywords.some((keyword) => name.includes(keyword.toLowerCase()));
    return typeMatches || keywordMatches;
  });
}

function findWeaponMatch(carriedItems: XmlObject[], storedItems: XmlObject[]): { name?: string; carried?: boolean } {
  return findEquipmentMatchByPredicate(
    carriedItems,
    storedItems,
    (item) => {
      const type = textField(item, '@_xsi:type');
      const searchText = getEquipmentSearchText(item);
      return (
        (SAVE_PARSING_RULES.equipment.weapon.types.includes(type ?? '') && !isScytheItem(item))
        || SAVE_PARSING_RULES.equipment.weapon.keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
      );
    },
  );
}

function findAxeMatch(carriedItems: XmlObject[], storedItems: XmlObject[]): { name?: string; carried?: boolean } {
  return findEquipmentMatchByPredicate(
    carriedItems,
    storedItems,
    (item) => {
      const type = textField(item, '@_xsi:type');
      const searchText = getEquipmentSearchText(item);
      return type === SAVE_PARSING_RULES.equipment.axe.type
        || (
          SAVE_PARSING_RULES.equipment.axe.keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
          && !SAVE_PARSING_RULES.equipment.axe.excludeKeywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
        );
    },
  );
}

function findScytheMatch(carriedItems: XmlObject[], storedItems: XmlObject[]): { name?: string; carried?: boolean } {
  return findEquipmentMatchByPredicate(carriedItems, storedItems, isScytheItem);
}

function findPanMatch(carriedItems: XmlObject[], storedItems: XmlObject[]): { name?: string; carried?: boolean } {
  return findEquipmentMatchByPredicate(carriedItems, storedItems, (item) => {
    const type = textField(item, '@_xsi:type');
    const id = textField(item, 'itemId') ?? textField(item, 'ItemId');
    const name = textField(item, 'name') ?? textField(item, 'Name');
    return type === SAVE_PARSING_RULES.equipment.pan.type
      || SAVE_PARSING_RULES.equipment.pan.itemIds.includes(id ?? '')
      || SAVE_PARSING_RULES.equipment.pan.names.includes(name ?? '');
  });
}

function isScytheItem(item: XmlObject): boolean {
  const id = textField(item, 'itemId') ?? textField(item, 'ItemId');
  const searchText = getEquipmentSearchText(item);
  return SAVE_PARSING_RULES.equipment.scythe.itemIds.includes(id ?? '')
    || SAVE_PARSING_RULES.equipment.scythe.keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
}

function getEquipmentSearchText(item: XmlObject): string {
  return [
    textField(item, 'Name'),
    textField(item, 'name'),
    textField(item, 'ItemId'),
    textField(item, 'itemId'),
    textField(item, '@_xsi:type'),
  ].filter(Boolean).join(' ').toLowerCase();
}

function getEquipmentDisplayName(item: XmlObject): string | undefined {
  const id = textField(item, 'ItemId') ?? textField(item, 'itemId');
  const name = textField(item, 'Name') ?? textField(item, 'name');
  const formattedId = id ? formatEquipmentId(id) : undefined;
  if (formattedId && (!name || isGenericEquipmentName(name))) {
    return formattedId;
  }

  return name ?? formattedId;
}

function isGenericEquipmentName(name: string): boolean {
  return SAVE_PARSING_RULES.equipment.genericNames.includes(name.trim().toLowerCase());
}

function formatEquipmentId(id: string): string | undefined {
  const normalizedId = id.replace(/^\([^)]+\)/, '');
  return SAVE_PARSING_RULES.equipment.displayNames[normalizedId];
}

function parseTrashCanLevel(player: XmlObject): string | undefined {
  const level = numberField(player, 'trashCanLevel');
  if (level === undefined) {
    return undefined;
  }

  return SAVE_PARSING_RULES.equipment.trashCanLevels[level];
}

function parseBaitName(items: XmlObject[]): string | undefined {
  for (const item of items) {
    const attachments = objectField(item, 'attachments');
    const attachmentItems = [
      ...asArray(attachments?.Object),
      ...asArray(attachments?.Item),
    ];
    const bait = attachmentItems.find((attachment) => {
      const name = getEquipmentSearchText(attachment);
      return SAVE_PARSING_RULES.equipment.baitKeywords.some((keyword) => name.includes(keyword.toLowerCase()));
    });

    if (bait) {
      const name = getEquipmentDisplayName(bait);
      const stack = numberField(bait, 'Stack') ?? numberField(bait, 'stack');
      return stack && stack > 1 ? `${name} x${stack}` : name;
    }
  }

  return undefined;
}

function parseCrops(root: XmlObject): CropSummary[] {
  return collectObjectsByKey(root, 'crop').map((crop) => {
    const name = textField(crop, 'Name') ?? `作物 ${textField(crop, 'indexOfHarvest') ?? ''}`.trim();
    return {
      id: textField(crop, 'indexOfHarvest') ?? name,
      name,
      isReady: boolField(crop, 'isReadyForHarvest') ?? false,
      daysLeft: numberField(crop, 'daysLeft'),
      quantity: numberField(crop, 'quantity') ?? 1,
      sellPrice: numberField(crop, 'sellPrice') ?? 0,
    };
  });
}

function parseReadyMachineOutputs(root: XmlObject): ProducedItemSummary[] {
  return collectObjectsByKey(root, 'Object').flatMap((object) => {
    if (isChestObject(object) || objectField(object, 'items')) {
      return [];
    }

    const heldObjectContainer = objectField(object, 'heldObject');
    const heldObject = objectField(heldObjectContainer ?? {}, 'Object')
      ?? objectField(heldObjectContainer ?? {}, 'Item')
      ?? heldObjectContainer;
    if (!heldObject) {
      return [];
    }

    const machineName = textField(object, 'Name') ?? textField(object, 'name');
    const heldItems = isChestObject(heldObject)
      ? asArray(objectField(heldObject, 'items')?.Item)
      : [heldObject];

    return heldItems.flatMap((heldItem) => {
      const parsed = parseInventoryItem(heldItem, 'chest', '');
      const item = parsed[0];
      if (!item) {
        return [];
      }

      return [{
      id: item.id,
      name: item.name,
      quantity: item.stack,
      source: 'machine',
      sourceName: machineName,
      }];
    });
  });
}

function parseAnimalProducts(root: XmlObject): ProducedItemSummary[] {
  return collectObjectsByKey(root, 'FarmAnimal').flatMap((animal) => {
    const produceId = textField(animal, 'currentProduce');
    if (!produceId || produceId === '-1' || produceId === '0') {
      return [];
    }

    return [{
      id: produceId,
      name: getItemNameById(produceId) ?? `物品 #${produceId}`,
      quantity: 1,
      source: 'animal',
      sourceName: textField(animal, 'type'),
    }];
  });
}

function parseAnimalFeed(root: XmlObject): AnimalFeedSummary {
  const animalCount = collectObjectsByKey(root, 'FarmAnimal').length;
  const hayCount = collectNumbersByKey(root, 'piecesOfHay').reduce((sum, value) => sum + value, 0);
  const hasHayCount = hayCount > 0 || collectNumbersByKey(root, 'piecesOfHay').length > 0;

  return {
    animalCount,
    hayCount: hasHayCount ? hayCount : undefined,
    daysRemaining: animalCount > 0 && hasHayCount ? Math.floor(hayCount / animalCount) : undefined,
  };
}

function parseFarmPlotSummary(root: XmlObject): FarmPlotSummary | undefined {
  const farmLocation = findFarmLocation(root);
  if (!farmLocation) {
    return undefined;
  }

  const terrainFeatures = objectField(farmLocation, 'terrainFeatures');
  const objects = objectField(farmLocation, 'objects');
  const buildings = objectField(farmLocation, 'buildings');
  const resourceClumps = objectField(farmLocation, 'resourceClumps');

  const tilledTileCount = terrainFeatures
    ? asArray(terrainFeatures.item).filter(isHoeDirtTerrainFeatureItem).length
    : 0;
  const plantedCropCount = terrainFeatures
    ? asArray(terrainFeatures.item).filter(hasCropInTerrainFeatureItem).length
    : 0;
  const emptyTilledTileCount = terrainFeatures
    ? asArray(terrainFeatures.item).filter(isEmptyHoeDirtTerrainFeatureItem).length
    : undefined;
  const occupiedObjectCount = objects ? asArray(objects.item).length : 0;
  const buildingCount = buildings ? countCollectionEntries(buildings, ['Building', 'item']) : 0;
  const resourceClumpCount = resourceClumps ? countCollectionEntries(resourceClumps, ['ResourceClump', 'item']) : 0;
  const parsedFields = [
    terrainFeatures ? 'locations.GameLocation[name=Farm].terrainFeatures' : undefined,
    objects ? 'locations.GameLocation[name=Farm].objects' : undefined,
    buildings ? 'locations.GameLocation[name=Farm].buildings' : undefined,
    resourceClumps ? 'locations.GameLocation[name=Farm].resourceClumps' : undefined,
  ].filter((field): field is string => Boolean(field));

  if (parsedFields.length === 0) {
    return undefined;
  }

  return {
    plantedCropCount,
    tilledTileCount,
    occupiedObjectCount,
    resourceClumpCount,
    buildingCount,
    emptyTileCount: emptyTilledTileCount,
    parsedFields,
    unknownFields: [
      'farmableTileCount',
      terrainFeatures ? undefined : 'emptyTileCount',
      'buildingFootprints',
    ].filter((field): field is string => Boolean(field)),
  };
}

function findFarmLocation(root: XmlObject): XmlObject | undefined {
  return collectObjectsByKey(root, 'GameLocation').find((location) => {
    const name = textField(location, 'name') ?? textField(location, 'Name');
    return name === 'Farm';
  });
}

function isHoeDirtTerrainFeatureItem(item: XmlObject): boolean {
  const terrainFeature = objectField(objectField(item, 'value') ?? {}, 'TerrainFeature') ?? objectField(item, 'TerrainFeature') ?? item;
  const type = textField(terrainFeature, '@_xsi:type');
  return type === 'HoeDirt' || objectField(terrainFeature, 'crop') !== undefined;
}

function hasCropInTerrainFeatureItem(item: XmlObject): boolean {
  const terrainFeature = objectField(objectField(item, 'value') ?? {}, 'TerrainFeature') ?? objectField(item, 'TerrainFeature') ?? item;
  return objectField(terrainFeature, 'crop') !== undefined;
}

function isEmptyHoeDirtTerrainFeatureItem(item: XmlObject): boolean {
  return isHoeDirtTerrainFeatureItem(item) && !hasCropInTerrainFeatureItem(item);
}

function countCollectionEntries(collection: XmlObject, entryFields: string[]): number {
  return entryFields.reduce((total, field) => total + asArray(collection[field]).length, 0);
}

function parseRelationships(player: XmlObject): RelationshipSummary[] {
  const friendshipData = objectField(player, 'friendshipData');
  const legacyFriendships = asArray(friendshipData?.item).flatMap((item) => {
    const key = objectField(item, 'key');
    const value = objectField(item, 'value');
    const friendship = objectField(value ?? {}, 'Friendship') ?? value;
    const npc = textField(key ?? {}, 'string');
    const points = friendship ? numberField(friendship, 'Points') ?? numberField(friendship, 'points') ?? 0 : 0;

    if (!npc) {
      return [];
    }

    return [{
      npc,
      points,
      hearts: Math.floor(points / 250),
      giftsThisWeek: friendship ? numberField(friendship, 'GiftsThisWeek') ?? numberField(friendship, 'giftsThisWeek') : undefined,
      talkedToday: friendship ? boolField(friendship, 'TalkedToToday') ?? boolField(friendship, 'talkedToToday') : undefined,
    }];
  });

  if (legacyFriendships.length > 0) {
    return legacyFriendships;
  }

  const friendships = objectField(player, 'friendships');
  return asArray(friendships?.item).flatMap((item) => {
    const npc = textField(objectField(item, 'key') ?? {}, 'string');
    const values = numberArrayField(objectField(item, 'value') ?? {}, 'ArrayOfInt');
    const points = values[0];

    if (!npc || points === undefined) {
      return [];
    }

    return [{
      npc,
      points,
      hearts: Math.floor(points / 250),
      giftsThisWeek: values[1],
      talkedToday: values[2] !== undefined ? values[2] > 0 : undefined,
    }];
  });
}

function parseMineDepth(root: XmlObject, player: XmlObject): { regularMineLevel: number; skullCavernLevel?: number } {
  const internalLevel = numberField(player, 'deepestMineLevel')
    ?? numberField(player, 'mineLevel')
    ?? numberField(root, 'mineLevel')
    ?? 0;
  const normalizedLevel = Math.max(0, Math.trunc(internalLevel));
  return {
    regularMineLevel: Math.min(120, normalizedLevel),
    skullCavernLevel: normalizedLevel > 120 ? normalizedLevel - 120 : undefined,
  };
}

function detectRoute(root: XmlObject): 'community_center' | 'joja' | 'unknown' {
  const serialized = JSON.stringify(root);
  if (serialized.includes('jojaMember') || serialized.includes('JojaMember')) {
    return 'joja';
  }

  if (boolField(root, 'hasRestoredCommunityCenter') === true || hasCommunityCenterProgress(root)) {
    return 'community_center';
  }

  return 'unknown';
}

function hasCommunityCenterProgress(root: XmlObject): boolean {
  if (parseCommunityCenterBundleStates(root).some((state) => state.completed || state.donatedSlots.some(Boolean))) {
    return true;
  }

  const communityCenterLocation = findCommunityCenterLocation(root);
  const areaProgress = countBooleanProgress(objectField(communityCenterLocation ?? {}, 'areasComplete'));
  return areaProgress.completed > 0;
}

function detectDesertAccess(root: XmlObject, player: XmlObject): boolean {
  return boolField(root, 'busFixed') === true
    || hasAnySerializedMarker(player, SAVE_PARSING_RULES.accessMarkers.desert);
}

function detectIslandAccess(root: XmlObject, player: XmlObject): boolean {
  return hasAnySerializedMarker(player, SAVE_PARSING_RULES.accessMarkers.islandPlayer)
    || hasAnySerializedMarker(root, SAVE_PARSING_RULES.accessMarkers.islandRoot);
}

function detectSkullCavernAccess(
  root: XmlObject,
  player: XmlObject,
  hasDesertAccess: boolean,
  regularMineLevel: number,
): boolean {
  return boolField(player, 'hasSkullKey') === true
    || boolField(player, 'hasUnlockedSkullDoor') === true
    || (hasDesertAccess && regularMineLevel >= 120);
}

function detectVolcanoDungeonAccess(root: XmlObject, player: XmlObject, hasIslandAccess: boolean): boolean {
  return hasAnySerializedMarker(player, SAVE_PARSING_RULES.accessMarkers.volcanoPlayer)
    || hasLocationNamed(root, SAVE_PARSING_RULES.accessMarkers.volcanoLocations)
    || (hasIslandAccess && hasAnySerializedMarker(player, SAVE_PARSING_RULES.accessMarkers.volcanoShortcut));
}

function hasLocationNamed(root: XmlObject, names: string[]): boolean {
  return collectObjectsByKey(root, 'GameLocation').some((location) => {
    const name = textField(location, 'name') ?? textField(location, 'Name');
    return name !== undefined && names.includes(name);
  });
}

function hasAnySerializedMarker(object: XmlObject, markers: string[]): boolean {
  const serialized = JSON.stringify(object);
  return markers.some((marker) => serialized.includes(marker));
}

function hasMultiplayerData(root: XmlObject): boolean {
  return SAVE_PARSING_RULES.multiplayerFields.some((field) => hasNonEmptyField(root, field));
}

function hasNonEmptyField(object: XmlObject, field: string): boolean {
  const value = object[field];
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isXmlObject(value)) {
    return Object.keys(value).length > 0;
  }

  return String(value).trim().length > 0;
}

function parseRoot(xml: string): XmlObject {
  const parsed = xmlParser.parse(xml) as XmlObject;
  return objectField(parsed, 'SaveGame') ?? parsed;
}

function textField(object: XmlObject, field: string): string | undefined {
  const value = object[field];
  if (value === undefined || value === null || typeof value === 'object') {
    return undefined;
  }

  return String(value).trim();
}

function numberField(object: XmlObject, field: string): number | undefined {
  const value = object[field];
  const numberValue = typeof value === 'number' ? value : Number(textField(object, field));
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function boolField(object: XmlObject, field: string): boolean | undefined {
  const value = object[field];
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function objectField(object: XmlObject, field: string): XmlObject | undefined {
  const value = object[field];
  if (isXmlObject(value)) {
    return value;
  }

  return undefined;
}

function numberArrayField(object: XmlObject, field: string): number[] {
  const value = objectField(object, field);
  const intValues = value?.int;
  const values = Array.isArray(intValues) ? intValues : intValues !== undefined ? [intValues] : [];
  return values
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function asArray(value: XmlValue | undefined): XmlObject[] {
  if (Array.isArray(value)) {
    return value.filter(isXmlObject);
  }

  return isXmlObject(value) ? [value] : [];
}

function collectObjectsByKey(object: XmlObject, key: string): XmlObject[] {
  const matches: XmlObject[] = [];

  for (const [field, value] of Object.entries(object)) {
    if (field === key) {
      matches.push(...asArray(value));
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isXmlObject(item)) {
          matches.push(...collectObjectsByKey(item, key));
        }
      }
    } else if (isXmlObject(value)) {
      matches.push(...collectObjectsByKey(value, key));
    }
  }

  return matches;
}

function collectNumbersByKey(object: XmlObject, key: string): number[] {
  const matches: number[] = [];

  for (const [field, value] of Object.entries(object)) {
    if (field === key) {
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numberValue)) {
        matches.push(numberValue);
      }
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isXmlObject(item)) {
          matches.push(...collectNumbersByKey(item, key));
        }
      }
    } else if (isXmlObject(value)) {
      matches.push(...collectNumbersByKey(value, key));
    }
  }

  return matches;
}

function isXmlObject(value: unknown): value is XmlObject {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function fallbackNameFromPath(filePath: string): string {
  const folderName = filePath.split('/').at(-1) ?? filePath;
  return folderName.split('_')[0] || folderName;
}

function isSeason(value: string | undefined): value is 'spring' | 'summer' | 'fall' | 'winter' {
  return value === 'spring' || value === 'summer' || value === 'fall' || value === 'winter';
}

function isWeather(value: string | undefined): value is Weather {
  return value !== undefined && WEATHER_VALUES.has(value as Weather);
}
