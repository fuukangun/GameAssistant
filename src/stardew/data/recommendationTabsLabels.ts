import recommendationTabsLabels from './recommendationTabsLabels.json' with { type: 'json' };

export type RecommendationTabsLabelsData = Record<string, Record<string, string>>;

export const RECOMMENDATION_TABS_LABELS = recommendationTabsLabels as RecommendationTabsLabelsData;
