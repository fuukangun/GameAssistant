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
  season: Season;
  day: number;
  timeHint: string;
}

export const BIRTHDAYS: Birthday[] = birthdays as Birthday[];
export const FESTIVALS: Festival[] = festivals as Festival[];
