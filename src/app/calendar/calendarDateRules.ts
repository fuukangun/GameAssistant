import type { Festival } from '../../stardew/data/calendar.ts';
import type { CalendarDayOfWeek } from './types.ts';

const DAYS_OF_WEEK: CalendarDayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function getWeekNumber(day: number): 1 | 2 | 3 | 4 {
  return (Math.floor((day - 1) / 7) + 1) as 1 | 2 | 3 | 4;
}

export function getWeekStartDay(day: number): number {
  return Math.floor((day - 1) / 7) * 7 + 1;
}

export function getWeekEndDay(day: number): number {
  return getWeekStartDay(day) + 6;
}

export function getDayOfWeek(day: number): CalendarDayOfWeek {
  return DAYS_OF_WEEK[(day - 1) % 7];
}

export function expandFestivalDays(festival: Festival): number[] {
  const endDay = festival.endDay ?? festival.day;
  return Array.from({ length: endDay - festival.day + 1 }, (_, index) => festival.day + index);
}
