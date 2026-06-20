import type { PlanDate, PlannerGoal, Weather } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { formatSeason } from './displayFormat.ts';
import { I18N_TRANSLATIONS, type I18nTranslationKey } from './i18nTranslations.ts';

export function t(
  language: AppLanguage,
  key: I18nTranslationKey,
  params: Record<string, string | number> = {},
): string {
  return Object.entries(params).reduce(
    (text, [param, value]) => text.replaceAll(`{${param}}`, String(value)),
    I18N_TRANSLATIONS[language][key] ?? I18N_TRANSLATIONS['zh-CN'][key] ?? key,
  );
}

export function formatGoalLabel(goal: PlannerGoal, language: AppLanguage): string {
  return t(language, goal === 'money' ? 'goal.money' : 'goal.free');
}

export function formatWeatherLabel(weather: Weather, language: AppLanguage): string {
  return t(language, `weather.${weather}` as I18nTranslationKey);
}

export function formatPlanTitle(planDate: PlanDate, language: AppLanguage): string {
  return t(language, 'plan.title', { date: formatPlanDateLabel(planDate, language) });
}

export function formatPlanDateLabel(planDate: PlanDate, language: AppLanguage): string {
  if (language === 'en-US') {
    return `${formatSeason(planDate.season, language)} ${planDate.day}, Year ${planDate.year}`;
  }

  return `第${planDate.year}年 ${formatSeason(planDate.season, language)} 第${planDate.day}日`;
}
