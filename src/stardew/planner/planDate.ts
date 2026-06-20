import type { PlanDate, SaveTime } from '../../shared/types.ts';

export function calculatePlanDate(saveDate: SaveTime): PlanDate {
  if (saveDate.day < 1 || saveDate.day > 28) {
    throw new Error(`Invalid Stardew day: ${saveDate.day}`);
  }

  return {
    year: saveDate.year,
    season: saveDate.season,
    day: saveDate.day,
    sourceSaveDate: saveDate,
  };
}
