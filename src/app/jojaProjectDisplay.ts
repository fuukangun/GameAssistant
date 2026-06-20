import type { AppLanguage } from './config/localConfig.ts';
import { JOJA_PROJECT_NAME_TRANSLATIONS } from '../stardew/data/jojaProjectTranslations.ts';

export function formatJojaProjectName(name: string, language: AppLanguage): string {
  return language === 'en-US' ? JOJA_PROJECT_NAME_TRANSLATIONS[name] ?? name : name;
}
