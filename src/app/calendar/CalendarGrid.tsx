import type { AppLanguage } from '../config/localConfig.ts';
import { t } from '../i18n.ts';
import type { I18nTranslationKey } from '../i18nTranslations.ts';
import { CalendarEventBadge } from './CalendarEventBadge.tsx';
import type { CalendarDay } from './types.ts';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function CalendarGrid({
  days,
  language,
  selectedDay,
  onSelectDay,
}: {
  days: CalendarDay[];
  language: AppLanguage;
  selectedDay: number | undefined;
  onSelectDay: (day: number) => void;
}) {
  return (
    <>
      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{t(language, `calendar.weekday.${weekday}` as I18nTranslationKey)}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day) => (
          <CalendarDayButton
            day={day}
            isSelected={day.day === selectedDay}
            key={day.day}
            language={language}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </>
  );
}

function CalendarDayButton({
  day,
  isSelected,
  language,
  onSelect,
}: {
  day: CalendarDay;
  isSelected: boolean;
  language: AppLanguage;
  onSelect: (day: number) => void;
}) {
  const classNames = [
    'calendar-day-cell',
    day.isToday ? 'calendar-day-cell--today' : '',
    day.isPast ? 'calendar-day-cell--past' : '',
    isSelected ? 'calendar-day-cell--selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      aria-label={t(language, 'calendar.dayAria', { day: day.day })}
      className={classNames}
      type="button"
      onClick={() => onSelect(day.day)}
    >
      <span className="calendar-day-number">{day.day}</span>
      <span className="calendar-day-events">
        {day.events.slice(0, 3).map((event) => <CalendarEventBadge event={event} key={event.id} />)}
      </span>
    </button>
  );
}
