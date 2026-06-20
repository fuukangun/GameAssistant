import data from './recommendationTextData.json' with { type: 'json' };

export interface RecommendationTextData {
  communityCenter: {
    title: string;
    reason: string;
    progressPrefix: string;
    deliverableLabel: string;
    suffix: string;
    uncertainty: string;
  };
  seasonEnd: {
    title: string;
    reason: string;
    uncertainty: string;
  };
  festival: {
    title: string;
    reason: string;
    uncertainty: string;
  };
  birthday: {
    giftTitle: string;
    giftReason: string;
    giftUncertainty: string;
    birthdayTitle: string;
    birthdayReason: string;
    birthdayUncertainty: string;
  };
  plant: {
    title: string;
    reasonWithDays: string;
    reasonWithoutDays: string;
  };
  mine: {
    titleWithTarget: string;
    titleDefault: string;
    reason: string;
  };
  joja: {
    buyTitle: string;
    saveTitle: string;
    reasonWithGold: string;
    reasonEnoughGold: string;
    uncertainty: string;
  };
  explorationFish: {
    namesById: Record<string, string>;
    locations: Record<string, string>;
    timeWindows: Record<string, string>;
  };
  explorationStatus: {
    parsedCrops: Record<'zh-CN' | 'en-US', string>;
    recognizedSeeds: Record<'zh-CN' | 'en-US', string>;
    plotsUnparsed: Record<'zh-CN' | 'en-US', string>;
    tilledEmptyPlots: Record<'zh-CN' | 'en-US', string>;
    mineDepth: Record<'zh-CN' | 'en-US', string>;
  };
}

export const RECOMMENDATION_TEXT_DATA = data as RecommendationTextData;
