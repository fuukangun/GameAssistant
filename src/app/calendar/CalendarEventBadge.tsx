import type { CalendarEvent } from './types.ts';

export function CalendarEventBadge({ event }: { event: CalendarEvent }) {
  return (
    <span className={`calendar-event-badge calendar-event-badge--${event.type}`}>
      <span aria-hidden="true">{event.type === 'birthday' ? '🎂' : event.type === 'special' ? '⭐' : '🎉'}</span>
      <span>{event.title}</span>
    </span>
  );
}
