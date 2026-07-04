import type { AppLanguage } from '../config/localConfig.ts';
import { formatNpcName } from '../displayFormat.ts';
import { BIRTHDAYS, FESTIVALS, type Festival } from '../../stardew/data/calendar.ts';
import type { Season } from '../../shared/types.ts';
import { expandFestivalDays } from './calendarDateRules.ts';
import type { CalendarEvent } from './types.ts';

export function buildCalendarEvents(season: Season, language: AppLanguage): CalendarEvent[] {
  const birthdayEvents = BIRTHDAYS
    .filter((birthday) => birthday.season === season)
    .map((birthday): CalendarEvent => ({
      id: birthdayEventId(season, birthday.day, birthday.npc),
      day: birthday.day,
      type: 'birthday',
      title: formatNpcName(birthday.npc, language),
      npc: birthday.npc,
      priority: 'must_do',
      tips: [language === 'zh-CN' ? '生日送礼收益更高。' : 'Birthday gifts have a much stronger friendship effect.'],
    }));

  const festivalEvents = FESTIVALS
    .filter((festival) => festival.season === season)
    .map((festival): CalendarEvent => ({
      id: festivalEventId(festival),
      day: festival.day,
      endDay: festival.endDay,
      type: festival.relatedData?.specialGift === 'winter_star' ? 'special' : 'festival',
      title: festivalName(festival, language),
      festivalId: festival.id,
      priority: festival.relatedData?.specialGift === 'winter_star' ? 'must_do' : 'recommended',
      tips: festivalTips(festival, language),
      timeHint: festivalTimeHint(festival, language),
    }));

  return [...birthdayEvents, ...festivalEvents];
}

export function getSeasonEventCount(season: Season): number {
  const birthdayCount = BIRTHDAYS.filter((birthday) => birthday.season === season).length;
  const festivalDayCount = FESTIVALS
    .filter((festival) => festival.season === season)
    .reduce((sum, festival) => sum + expandFestivalDays(festival).length, 0);

  return birthdayCount + festivalDayCount;
}

export function birthdayEventId(season: Season, day: number, npc: string): string {
  return `birthday:${season}:${day}:${npc}`;
}

export function festivalEventId(festival: Festival): string {
  return `festival:${festival.season}:${festival.day}:${festival.id}`;
}

export function festivalName(festival: Festival, language: AppLanguage): string {
  return language === 'zh-CN' ? festival.name : festival.nameEn;
}

export function festivalTimeHint(festival: Festival, language: AppLanguage): string {
  return language === 'zh-CN' ? festival.timeHint : festival.timeHintEn;
}

export function festivalTips(festival: Festival, language: AppLanguage): string[] {
  return language === 'zh-CN' ? festival.planningTips : festival.planningTipsEn;
}
