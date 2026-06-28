import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';

const unixSecondsPattern = /^\d+$/;

export function formatDateTime(value: string, language: AppLanguage = 'zh-CN'): string {
  const date = unixSecondsPattern.test(value)
    ? new Date(Number(value) * 1000)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t(language, 'date.unknown');
  }

  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
