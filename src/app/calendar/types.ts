import type { AppLanguage } from '../config/localConfig.ts';
import type { PlanDate, Season, StardewSaveSnapshot } from '../../shared/types.ts';

export type CalendarEventType = 'birthday' | 'festival' | 'special';
export type CalendarPriority = 'must_do' | 'recommended' | 'info';
export type CalendarDayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface CalendarPanelModel {
  year: number;
  season: Season;
  weeks: CalendarWeek[];
  warnings: CalendarWarning[];
  upcomingFestivals: CalendarWarning[];
  selectedDay: number;
}

export interface CalendarWeek {
  weekNumber: 1 | 2 | 3 | 4;
  startDay: number;
  endDay: number;
  days: CalendarDay[];
  warnings: CalendarWarning[];
}

export interface CalendarDay {
  day: number;
  weekNumber: 1 | 2 | 3 | 4;
  dayOfWeek: CalendarDayOfWeek;
  isToday: boolean;
  isPast: boolean;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  day: number;
  endDay?: number;
  type: CalendarEventType;
  title: string;
  npc?: string;
  festivalId?: string;
  priority: CalendarPriority;
  tips: string[];
  timeHint?: string;
}

export interface CalendarWarning {
  id: string;
  type:
    | 'birthday_advance'
    | 'birthday_today'
    | 'multi_birthday_week'
    | 'festival_advance'
    | 'festival_today'
    | 'winter_star';
  message: string;
  priority: CalendarPriority;
  relatedDays: number[];
  eventIds: string[];
}

export interface CreateCalendarPanelModelInput {
  snapshot: StardewSaveSnapshot;
  planDate: PlanDate;
  language: AppLanguage;
}
