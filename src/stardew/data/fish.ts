import fishCatalog from './fishCatalog.json' with { type: 'json' };
import type { SaveTime, Season, Weather } from '../../shared/types.ts';

export type FishCategory = 'regular' | 'legendary' | 'crab_pot' | 'night_market' | 'jelly';
export type FishLocation = '海洋' | '河流' | '湖泊' | '山湖' | '森林池塘' | '矿井' | '沙漠' | '下水道' | '秘密森林' | '夜市潜艇' | '蟹笼' | '姜岛' | '煤矿森林瀑布';

export interface FishCatalogEntry {
  id: string;
  name: string;
  category: FishCategory;
  seasons: Season[] | 'all';
  weathers: Weather[] | 'any';
  locations: FishLocation[];
  timeWindow: string;
  basePrice: number;
  availableDays?: number[];
  requiredMineLevel?: number;
  specialOrder?: 'extendedFamily';
}

export interface FishAvailabilityInput {
  date?: SaveTime;
  weather?: Weather;
  timeOfDay?: number;
  access?: {
    desert?: boolean;
    island?: boolean;
    sewer?: boolean;
    secretWoods?: boolean;
    mineLevel?: number;
    extendedFamily?: boolean;
  };
}

const ALL_SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
const ANY_WEATHER: Weather[] = ['sunny', 'rainy', 'stormy', 'snowy', 'windy'];

export const FISH_CATALOG: FishCatalogEntry[] = fishCatalog as FishCatalogEntry[];
export function findAvailableFishForDay(input: FishAvailabilityInput): FishCatalogEntry[] {
  const { date, weather } = input;
  if (!date || !weather) {
    return [];
  }

  return FISH_CATALOG.filter((fishEntry) => {
    return seasonsFor(fishEntry).includes(date.season)
      && weathersFor(fishEntry).includes(weather)
      && isDateAccessible(fishEntry, date)
      && isTimeAccessible(fishEntry, input.timeOfDay)
      && isAccessRequirementMet(fishEntry, input.access)
      && isLocationAccessible(fishEntry, input.access);
  });
}

function isDateAccessible(fishEntry: FishCatalogEntry, date: SaveTime): boolean {
  return !fishEntry.availableDays || fishEntry.availableDays.includes(date.day);
}

function isAccessRequirementMet(
  fishEntry: FishCatalogEntry,
  access: FishAvailabilityInput['access'],
): boolean {
  if (fishEntry.requiredMineLevel === undefined) {
    return isSpecialOrderAccessible(fishEntry, access);
  }

  if (access?.mineLevel === undefined) {
    return false;
  }

  return access.mineLevel >= fishEntry.requiredMineLevel
    && isSpecialOrderAccessible(fishEntry, access);
}

function isSpecialOrderAccessible(
  fishEntry: FishCatalogEntry,
  access: FishAvailabilityInput['access'],
): boolean {
  if (fishEntry.specialOrder === 'extendedFamily') {
    return access?.extendedFamily === true;
  }

  return true;
}

function isLocationAccessible(
  fishEntry: FishCatalogEntry,
  access: FishAvailabilityInput['access'],
): boolean {
  return fishEntry.locations.some((location) => isSingleLocationAccessible(location, access));
}

function isSingleLocationAccessible(
  location: FishLocation,
  access: FishAvailabilityInput['access'],
): boolean {
  if (location === '沙漠') {
    return access?.desert === true;
  }
  if (location === '姜岛') {
    return access?.island === true;
  }
  if (location === '下水道') {
    return access?.sewer === true;
  }
  if (location === '秘密森林') {
    return access?.secretWoods === true;
  }

  return true;
}

function seasonsFor(fishEntry: FishCatalogEntry): Season[] {
  return fishEntry.seasons === 'all' ? ALL_SEASONS : fishEntry.seasons;
}

function weathersFor(fishEntry: FishCatalogEntry): Weather[] {
  return fishEntry.weathers === 'any' ? ANY_WEATHER : fishEntry.weathers;
}

function isTimeAccessible(fishEntry: FishCatalogEntry, timeOfDay?: number): boolean {
  if (timeOfDay === undefined || !Number.isFinite(timeOfDay)) {
    return true;
  }

  const windows = fishEntry.timeWindow.split('/').map((part) => part.trim());
  return windows.some((window) => isWithinWindow(window, timeOfDay));
}

function isWithinWindow(window: string, timeOfDay: number): boolean {
  if (window === '任意时间') {
    return true;
  }

  const match = window.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) {
    return true;
  }

  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const minutes = Math.trunc(timeOfDay);

  if (start <= end) {
    return minutes >= start && minutes <= end;
  }

  return minutes >= start || minutes <= end;
}
