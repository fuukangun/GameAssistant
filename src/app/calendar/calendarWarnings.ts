import type { AppLanguage } from '../config/localConfig.ts';
import { formatNpcName } from '../displayFormat.ts';
import { BIRTHDAYS, FESTIVALS, type Festival } from '../../stardew/data/calendar.ts';
import type { PlanDate, RelationshipSummary, StardewSaveSnapshot } from '../../shared/types.ts';
import { expandFestivalDays, getDayOfWeek, getWeekEndDay, getWeekNumber, getWeekStartDay } from './calendarDateRules.ts';
import { birthdayEventId, festivalEventId } from './calendarEvents.ts';
import { buildFestivalSuggestion } from './calendarFestivalSuggestions.ts';
import { formatBirthdayMessage, formatFestivalMessage, formatMultiBirthdayMessage } from './calendarMessages.ts';
import type { CalendarPriority, CalendarWarning } from './types.ts';

const FESTIVAL_WARNING_DAYS = new Set([7, 3, 1, 0]);

export function buildCalendarWarnings(snapshot: StardewSaveSnapshot, planDate: PlanDate, language: AppLanguage): CalendarWarning[] {
  return [
    ...buildBirthdayWarnings(snapshot, planDate, language),
    ...buildFestivalWarnings(snapshot, planDate, language),
  ];
}

function buildBirthdayWarnings(snapshot: StardewSaveSnapshot, planDate: PlanDate, language: AppLanguage): CalendarWarning[] {
  const birthdays = BIRTHDAYS.filter((birthday) => birthday.season === planDate.season);
  const warnings = birthdays
    .flatMap((birthday) => buildBirthdayWarning(snapshot, planDate, birthday.npc, birthday.day, language))
    .filter((warning): warning is CalendarWarning => warning !== undefined);
  const currentWeekBirthdays = birthdays.filter((birthday) => {
    const startDay = getWeekStartDay(planDate.day);
    const endDay = getWeekEndDay(planDate.day);
    return birthday.day >= startDay && birthday.day <= endDay && birthday.day >= planDate.day;
  });

  if (currentWeekBirthdays.length > 1) {
    warnings.unshift({
      id: `birthdays:${planDate.season}:week-${getWeekNumber(planDate.day)}`,
      type: 'multi_birthday_week',
      message: formatMultiBirthdayMessage(currentWeekBirthdays, language),
      priority: currentWeekBirthdays.some((birthday) => birthday.day - planDate.day <= 3) ? 'recommended' : 'info',
      relatedDays: currentWeekBirthdays.map((birthday) => birthday.day),
      eventIds: currentWeekBirthdays.map((birthday) => birthdayEventId(planDate.season, birthday.day, birthday.npc)),
    });
  }

  return warnings;
}

function buildBirthdayWarning(
  snapshot: StardewSaveSnapshot,
  planDate: PlanDate,
  npc: string,
  birthdayDay: number,
  language: AppLanguage,
): CalendarWarning | undefined {
  const currentDay = planDate.day;
  const birthdayWeekStart = getWeekStartDay(birthdayDay);
  const birthdayWeekEnd = getWeekEndDay(birthdayDay);
  if (birthdayDay < currentDay || currentDay < birthdayWeekStart || currentDay > birthdayDay) {
    return undefined;
  }

  const relationship = getRelationshipByNpc(snapshot, npc);
  const giftsThisWeek = clampGiftCount(relationship?.giftsThisWeek ?? 0);
  const giftedToday = relationship?.giftedToday;
  const daysBeforeBirthday = birthdayDay - currentDay;
  const daysAfterBirthdayInWeek = birthdayWeekEnd - birthdayDay;
  const eventId = birthdayEventId(planDate.season, birthdayDay, npc);
  const warningType = daysBeforeBirthday === 0 ? 'birthday_today' : 'birthday_advance';
  const priority: CalendarPriority = daysBeforeBirthday === 0 ? 'must_do' : giftsThisWeek === 0 && daysBeforeBirthday > 1 ? 'info' : 'recommended';

  return {
    id: `birthday:${npc}:${birthdayDay}`,
    type: warningType,
    message: formatBirthdayMessage({
      npc: formatNpcName(npc, language),
      birthdayDay,
      currentDay,
      giftsThisWeek,
      giftedToday,
      daysBeforeBirthday,
      daysAfterBirthdayInWeek,
      isSundayBirthday: getDayOfWeek(birthdayDay) === 'sun',
      language,
    }),
    priority,
    relatedDays: [birthdayDay],
    eventIds: [eventId],
  };
}

function buildFestivalWarnings(snapshot: StardewSaveSnapshot, planDate: PlanDate, language: AppLanguage): CalendarWarning[] {
  return FESTIVALS
    .filter((festival) => festival.season === planDate.season)
    .flatMap((festival) => {
      const warning = buildFestivalWarning(snapshot, planDate, festival, language);
      return warning ? [warning] : [];
    });
}

function buildFestivalWarning(
  snapshot: StardewSaveSnapshot,
  planDate: PlanDate,
  festival: Festival,
  language: AppLanguage,
): CalendarWarning | undefined {
  const eventDays = expandFestivalDays(festival);
  const startsInDays = festival.day - planDate.day;
  const isFestivalDay = planDate.day >= festival.day && planDate.day <= (festival.endDay ?? festival.day);
  if (!isFestivalDay && !FESTIVAL_WARNING_DAYS.has(startsInDays)) {
    return undefined;
  }
  if (planDate.day > (festival.endDay ?? festival.day)) {
    return undefined;
  }

  if (festival.relatedData?.specialGift === 'winter_star' && startsInDays <= 1 && startsInDays >= 0) {
    return {
      id: `winter-star:${startsInDays === 0 ? 'today' : startsInDays}`,
      type: 'winter_star',
      message: language === 'zh-CN'
        ? '冬日星盛宴需要准备神秘朋友礼物；这次送礼不占周上限，是额外送礼机会。'
        : 'Prepare a gift for the Feast of the Winter Star secret friend; it does not use the weekly gift limit.',
      priority: startsInDays === 0 ? 'must_do' : 'recommended',
      relatedDays: eventDays,
      eventIds: [festivalEventId(festival)],
    };
  }

  const type = isFestivalDay ? 'festival_today' : 'festival_advance';
  const priority: CalendarPriority = isFestivalDay ? 'must_do' : startsInDays === 7 ? 'info' : 'recommended';
  const smartSuggestion = buildFestivalSuggestion(snapshot, festival, language);

  return {
    id: `festival:${festival.id}:${isFestivalDay ? 'today' : startsInDays}`,
    type,
    message: formatFestivalMessage(festival, startsInDays, isFestivalDay, smartSuggestion, language),
    priority,
    relatedDays: eventDays,
    eventIds: [festivalEventId(festival)],
  };
}

function getRelationshipByNpc(snapshot: StardewSaveSnapshot, npc: string): RelationshipSummary | undefined {
  return snapshot.relationships.find((relationship) => relationship.npc === npc);
}

function clampGiftCount(giftsThisWeek: number): number {
  return Math.max(0, Math.min(2, giftsThisWeek));
}
