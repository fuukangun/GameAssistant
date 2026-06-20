import recommendationLocalization from './recommendationLocalization.json' with { type: 'json' };

export interface RecommendationLocalizationData {
  weatherNames: Record<string, string>;
  evidenceLabels: Record<string, string>;
  uncertaintyTexts: Record<string, string>;
  festivalNames: Record<string, string>;
  cropNames: Record<string, string>;
  generalItemNames: Record<string, string>;
  statusTexts: Record<string, string>;
  englishItemNameToId: Record<string, number | string>;
  englishTextNames: Record<string, string>;
  missingFieldNames: Record<string, string>;
  inventorySources: Record<string, string>;
}

export const RECOMMENDATION_LOCALIZATION = recommendationLocalization as RecommendationLocalizationData;
