import type { CropSummary, InventoryItem, StardewSaveSnapshot } from '../shared/types.ts';
import { BASIC_PLANTING_OPTIONS } from '../stardew/data/crops.ts';
import { normalizeItemId } from '../stardew/data/items.ts';
import { FARM_PLOT_MESSAGES } from '../stardew/data/farmPlotMessages.ts';

export interface FarmPlotStatusSummary {
  plantedCropCount: number;
  emptyPlotStatus: 'parsed' | 'unparsed';
  emptyTilledTileCount?: number;
  recommendationMode: 'direct' | 'degraded';
  evidence: string[];
  uncertainty: string[];
}

export function createFarmPlotStatusSummary(snapshot: StardewSaveSnapshot): FarmPlotStatusSummary {
  if (snapshot.farmPlotSummary) {
    return createParsedFarmPlotStatusSummary(snapshot);
  }

  const crops = Array.isArray(snapshot.crops) ? snapshot.crops : [];
  const inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory : [];
  const plantedCropCount = crops.reduce((total, crop) => total + Math.max(0, crop.quantity), 0);
  const evidence = [
    formatCropEvidence(crops),
    ...formatSeedEvidence(inventory),
  ];

  return {
    plantedCropCount,
    emptyPlotStatus: 'unparsed',
    emptyTilledTileCount: undefined,
    recommendationMode: 'degraded',
    evidence,
    uncertainty: [FARM_PLOT_MESSAGES.unknownFields.emptyTileCount, '耕地/可种植地块未精确解析'],
  };
}

function createParsedFarmPlotStatusSummary(snapshot: StardewSaveSnapshot): FarmPlotStatusSummary {
  const farmPlotSummary = snapshot.farmPlotSummary;
  if (!farmPlotSummary) {
    return createFarmPlotStatusSummary({ ...snapshot, farmPlotSummary: undefined });
  }
  const emptyTileCount = getConfirmedEmptyTileCount(farmPlotSummary);

  return {
    plantedCropCount: farmPlotSummary.plantedCropCount,
    emptyPlotStatus: emptyTileCount === undefined ? 'unparsed' : 'parsed',
    emptyTilledTileCount: emptyTileCount,
    recommendationMode: emptyTileCount === undefined ? 'degraded' : 'direct',
    evidence: [
      `已解析农场作物：${farmPlotSummary.plantedCropCount} 块`,
      `已解析耕地：${farmPlotSummary.tilledTileCount} 块`,
      ...(emptyTileCount === undefined
        ? []
        : [`已解析可直接种植的已耕空地：${emptyTileCount} 块`]),
      `已解析占用物件：${farmPlotSummary.occupiedObjectCount} 个`,
      `已解析资源障碍：${farmPlotSummary.resourceClumpCount} 个`,
      ...formatSeedEvidence(Array.isArray(snapshot.inventory) ? snapshot.inventory : []),
    ],
    uncertainty: formatFarmPlotUnknowns(
      emptyTileCount === undefined && !farmPlotSummary.unknownFields.includes('emptyTileCount')
        ? ['emptyTileCount', ...farmPlotSummary.unknownFields]
        : farmPlotSummary.unknownFields,
    ),
  };
}

function getConfirmedEmptyTileCount(
  farmPlotSummary: NonNullable<StardewSaveSnapshot['farmPlotSummary']>,
): number | undefined {
  const emptyTileCount = farmPlotSummary.emptyTileCount;
  if (emptyTileCount === undefined) {
    return undefined;
  }

  if (!Number.isInteger(emptyTileCount) || emptyTileCount < 0) {
    return undefined;
  }

  const maximumPossibleEmptyTiles = farmPlotSummary.tilledTileCount - farmPlotSummary.plantedCropCount;
  if (maximumPossibleEmptyTiles < 0 || emptyTileCount > maximumPossibleEmptyTiles) {
    return undefined;
  }

  return emptyTileCount;
}

function formatFarmPlotUnknowns(unknownFields: string[]): string[] {
  const priority = ['emptyTileCount', 'farmableTileCount', 'buildingFootprints'];
  const orderedFields = [
    ...priority.filter((field) => unknownFields.includes(field)),
    ...unknownFields.filter((field) => !priority.includes(field)),
  ];
  const messages = orderedFields.map((field) => FARM_PLOT_MESSAGES.unknownFields[field] ?? `${field} 未校准`);

  return messages.length > 0 ? messages : [FARM_PLOT_MESSAGES.unknownFields.emptyTileCount];
}

function formatCropEvidence(crops: CropSummary[]): string {
  if (crops.length === 0) {
    return FARM_PLOT_MESSAGES.emptyCropEvidence;
  }

  return `已解析作物：${crops
    .slice(0, 5)
    .map((crop) => `${crop.name} x${crop.quantity}`)
    .join('、')}`;
}

function formatSeedEvidence(inventory: InventoryItem[]): string[] {
  const seeds = inventory.filter(isSupportedSeed);
  if (seeds.length === 0) {
    return [];
  }

  return [`已识别种子：${seeds
    .slice(0, 5)
    .map((item) => `${item.name} x${item.stack}${item.sourceLabel ? `（${item.sourceLabel}）` : ''}`)
    .join('、')}`];
}

function isSupportedSeed(item: InventoryItem): boolean {
  const itemId = normalizeItemId(item.id);
  return BASIC_PLANTING_OPTIONS.some((crop) => {
    return crop.seedIds.some((seedId) => normalizeItemId(seedId) === itemId)
      || crop.seedName === item.name;
  });
}
