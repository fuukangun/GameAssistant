import birthdays from './birthdays.json' with { type: 'json' };
import festivals from './festivals.json' with { type: 'json' };
import type { Season } from '../../shared/types.ts';

export interface Birthday {
  npc: string;
  season: Season;
  day: number;
}

export interface Festival {
  id: string;
  name: string;
  nameEn: string;
  season: Season;
  day: number;
  endDay?: number;
  timeHint: string;
  timeHintEn: string;
  planningTips: string[];
  planningTipsEn: string[];
  relatedData?: FestivalRelatedData;
}

export interface FestivalRelatedData {
  shopItems?: Array<number | string>;
  budgetSuggestion?: number;
  requiredHeartNpc?: string;
  requiredHearts?: number;
  itemCategories?: string[];
  requiresFishingRod?: boolean;
  specialGift?: 'winter_star';
}

export const BIRTHDAYS: Birthday[] = birthdays as Birthday[];
export const FESTIVALS: Festival[] = festivals as Festival[];
