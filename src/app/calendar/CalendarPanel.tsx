import { useEffect, useMemo, useState } from 'react';
import type { AppLanguage } from '../config/localConfig.ts';
import { formatSeason } from '../displayFormat.ts';
import { t } from '../i18n.ts';
import type { PlanDate, StardewSaveSnapshot } from '../../shared/types.ts';
import { CalendarDayDetails } from './CalendarDayDetails.tsx';
import { CalendarGrid } from './CalendarGrid.tsx';
import { CalendarWarningList } from './CalendarWarningList.tsx';
import { createCalendarPanelModel } from './calendarPanelModel.ts';
import type { CalendarWarning } from './types.ts';

export function CalendarPanel({
  language,
  planDate,
  snapshot,
}: {
  language: AppLanguage;
  planDate: PlanDate;
  snapshot: StardewSaveSnapshot;
}) {
  const model = useMemo(() => createCalendarPanelModel({ snapshot, planDate, language }), [snapshot, planDate, language]);
  const [selectedDay, setSelectedDay] = useState(model.selectedDay);
  const days = model.weeks.flatMap((week) => week.days);
  const selected = days.find((day) => day.day === selectedDay) ?? days.find((day) => day.isToday) ?? days[0];

  useEffect(() => {
    setSelectedDay(model.selectedDay);
  }, [model]);

  function selectWarning(warning: CalendarWarning) {
    const nextDay = warning.relatedDays.find((day) => day >= planDate.day) ?? warning.relatedDays[0] ?? planDate.day;
    setSelectedDay(nextDay);
  }

  return (
    <section className="calendar-panel" aria-label={t(language, 'calendar.title')}>
      <div className="calendar-panel-header">
        <div>
          <span>{t(language, 'calendar.title')}</span>
          <h3>
            {formatSeason(model.season, language)} {language === 'zh-CN' ? `第 ${model.year} 年` : `Year ${model.year}`}
          </h3>
        </div>
        <strong>{t(language, 'calendar.todayWithDay', { day: planDate.day })}</strong>
      </div>

      <CalendarGrid days={days} language={language} selectedDay={selected?.day} onSelectDay={setSelectedDay} />

      <div className="calendar-lists">
        <CalendarWarningList language={language} title={t(language, 'calendar.warnings')} warnings={model.warnings} onSelect={selectWarning} />
        <CalendarWarningList language={language} title={t(language, 'calendar.upcomingFestivals')} warnings={model.upcomingFestivals} onSelect={selectWarning} />
      </div>

      {selected ? <CalendarDayDetails day={selected} language={language} /> : null}
    </section>
  );
}
