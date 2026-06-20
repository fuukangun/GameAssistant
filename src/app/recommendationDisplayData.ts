import data from './recommendationDisplayData.json' with { type: 'json' };
import type { RecommendationItem } from '../shared/types.ts';

export const RECOMMENDATION_DISPLAY_DATA = data as Partial<Record<string, Partial<RecommendationItem>>>;
