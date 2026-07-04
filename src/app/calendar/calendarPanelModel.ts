import type { PlanDate } from '../../shared/types.ts';
import { buildCalendarEvents } from './calendarEvents.ts';
import { buildCalendarWarnings } from './calendarWarnings.ts';
import { getDayOfWeek, getWeekNumber } from './calendarDateRules.ts';
import type { CalendarEvent, CalendarPanelModel, CalendarPriority, CalendarWarning, CalendarWeek, CreateCalendarPanelModelInput } from './types.ts';

const CALENDAR_PRIORITY_ORDER: Record<CalendarPriority, number> = {
  must_do: 0,
  info: 1,
  recommended: 2,
};

export function createCalendarPanelModel(input: CreateCalendarPanelModelInput): CalendarPanelModel {
  const events = buildCalendarEvents(input.planDate.season, input.language);
  const warnings = sortCalendarWarnings(buildCalendarWarnings(input.snapshot, input.planDate, input.language));
  const weeks = buildSeasonCalendarDays(input.planDate, events, warnings);

  return {
    year: input.planDate.year,
    season: input.planDate.season,
    weeks,
    warnings,
    upcomingFestivals: warnings.filter((warning) => warning.type === 'festival_advance' || warning.type === 'festival_today' || warning.type === 'winter_star'),
    selectedDay: input.planDate.day,
  };
}

function sortCalendarWarnings(warnings: CalendarWarning[]): CalendarWarning[] {
  return warnings
    .map((warning, index) => ({ warning, index }))
    .sort((left, right) => {
      const priorityDiff = CALENDAR_PRIORITY_ORDER[left.warning.priority] - CALENDAR_PRIORITY_ORDER[right.warning.priority];
      return priorityDiff === 0 ? left.index - right.index : priorityDiff;
    })
    .map((item) => item.warning);
}

function buildSeasonCalendarDays(planDate: PlanDate, events: CalendarEvent[], warnings: CalendarWarning[]): CalendarWeek[] {
  return [1, 8, 15, 22].map((startDay) => {
    const endDay = startDay + 6;
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = startDay + index;
      return {
        day,
        weekNumber: getWeekNumber(day),
        dayOfWeek: getDayOfWeek(day),
        isToday: day === planDate.day,
        isPast: day < planDate.day,
        events: events.filter((event) => day >= event.day && day <= (event.endDay ?? event.day)),
      };
    });

    return {
      weekNumber: getWeekNumber(startDay),
      startDay,
      endDay,
      days,
      warnings: warnings.filter((warning) => warning.relatedDays.some((day) => day >= startDay && day <= endDay)),
    };
  });
}
