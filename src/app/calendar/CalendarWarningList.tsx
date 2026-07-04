import type { AppLanguage } from '../config/localConfig.ts';
import { t } from '../i18n.ts';
import type { CalendarWarning } from './types.ts';

export function CalendarWarningList({
  language,
  title,
  warnings,
  onSelect,
}: {
  language: AppLanguage;
  title: string;
  warnings: CalendarWarning[];
  onSelect: (warning: CalendarWarning) => void;
}) {
  return (
    <section className="calendar-warning-list">
      <h4>{title}</h4>
      {warnings.length === 0 ? <p>{t(language, 'calendar.noWarnings')}</p> : null}
      {warnings.map((warning) => (
        <button
          className={`calendar-warning calendar-warning--${warning.priority}`}
          key={warning.id}
          type="button"
          onClick={() => onSelect(warning)}
        >
          <strong>{formatPriorityLabel(warning.priority, language)}</strong>
          <span>{warning.message}</span>
        </button>
      ))}
    </section>
  );
}

function formatPriorityLabel(priority: CalendarWarning['priority'], language: AppLanguage): string {
  if (language === 'en-US') {
    return priority === 'must_do' ? 'Must do' : priority === 'recommended' ? 'Recommended' : 'Info';
  }
  return priority === 'must_do' ? '必须' : priority === 'recommended' ? '建议' : '提示';
}
