import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';

export function shouldShowBackToTop(scrollTop: number): boolean {
  return scrollTop >= 280;
}

export function getBackToTopButtonA11yProps(language: AppLanguage): {
  'aria-label': string;
  title: string;
} {
  const label = t(language, 'navigation.backToTop');

  return {
    'aria-label': label,
    title: label,
  };
}
