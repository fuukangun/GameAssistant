import cropPlantingOptions from './cropPlantingOptions.json' with { type: 'json' };
import type { Season } from '../../shared/types.ts';

export interface CropPlantingOption {
  id: string;
  name: string;
  season: Season;
  daysToMature: number;
  growthDays: number;
  seedPrice: number;
  sellPrice: number;
  seedIds: Array<number | string>;
  seedName: string;
  regrowDays?: number;
  notes?: string;
}

export interface CropRoiEstimate {
  canMature: boolean;
  harvests: number;
  revenue: number;
  profit: number;
  roi: number;
}

export interface CropPlantingDate {
  season: Season;
  day: number;
  year?: number;
}

export const BASIC_PLANTING_OPTIONS: CropPlantingOption[] = cropPlantingOptions as CropPlantingOption[];
export function findCropById(id: string): CropPlantingOption | undefined {
  return BASIC_PLANTING_OPTIONS.find((crop) => crop.id === id);
}

export function canCropMatureBySeasonEnd(
  crop: CropPlantingOption,
  date: CropPlantingDate,
): boolean {
  if (!isValidSeasonDay(date.day)) {
    return false;
  }

  if (crop.season !== date.season) {
    return false;
  }

  return getRemainingGrowDays(date.day) >= crop.daysToMature;
}

export function calculateConservativeCropRoi(
  crop: CropPlantingOption,
  date: CropPlantingDate,
): CropRoiEstimate {
  const harvests = countConservativeHarvests(crop, date);
  const revenue = harvests * crop.sellPrice;
  const profit = revenue - crop.seedPrice;

  return {
    canMature: harvests > 0,
    harvests,
    revenue,
    profit,
    roi: crop.seedPrice > 0 ? profit / crop.seedPrice : 0,
  };
}

function countConservativeHarvests(crop: CropPlantingOption, date: CropPlantingDate): number {
  if (!canCropMatureBySeasonEnd(crop, date)) {
    return 0;
  }

  if (!crop.regrowDays) {
    return 1;
  }

  const daysAfterFirstHarvest = getRemainingGrowDays(date.day) - crop.daysToMature;
  return 1 + Math.floor(daysAfterFirstHarvest / crop.regrowDays);
}

function getRemainingGrowDays(day: number): number {
  return 28 - day;
}

function isValidSeasonDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 28;
}
