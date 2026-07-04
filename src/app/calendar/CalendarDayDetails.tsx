import type { AppLanguage } from '../config/localConfig.ts';
import { t } from '../i18n.ts';
import type { CalendarDay } from './types.ts';

export function CalendarDayDetails({ day, language }: { day: CalendarDay; language: AppLanguage }) {
  return (
    <section className="calendar-day-details">
      <h4>{t(language, 'calendar.detailsForDay', { day: day.day })}</h4>
      {day.events.length === 0 ? <p>{t(language, 'calendar.noEvents')}</p> : null}
      {day.events.map((event) => (
        <article className="calendar-event-detail" key={event.id}>
          <h5>{event.title}</h5>
          {event.timeHint ? <p>{event.timeHint}</p> : null}
          {event.tips.length > 0 ? (
            <ul>
              {event.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  );
}
