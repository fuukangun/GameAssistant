import type { ParseWarning } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';

const PARSE_WARNING_KEYS: Partial<Record<ParseWarning['code'], { zh: string; en: string }>> = {
  missing_field: {
    zh: 'parseWarning.missingField',
    en: 'parseWarning.missingField',
  },
  unsupported_multiplayer: {
    zh: 'parseWarning.unsupportedMultiplayer',
    en: 'parseWarning.unsupportedMultiplayer',
  },
};

export function formatParseWarningMessage(warning: ParseWarning, language: AppLanguage): string {
  const key = PARSE_WARNING_KEYS[warning.code]?.[language === 'zh-CN' ? 'zh' : 'en'];
  if (!key) {
    return t(language, 'parseWarning.generic');
  }

  return t(language, key as Parameters<typeof t>[1]);
}
