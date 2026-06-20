import translations from './communityCenterTranslations.json' with { type: 'json' };

export interface CommunityCenterTranslationsData {
  rooms: Record<string, string>;
  bundles: Record<string, string>;
  itemsById: Record<string, string>;
}

export const COMMUNITY_CENTER_TRANSLATIONS = translations as CommunityCenterTranslationsData;
