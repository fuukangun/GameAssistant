import data from './giftTierLabels.json' with { type: 'json' };

export interface GiftTierLabelsData {
  'zh-CN': Record<'loved' | 'liked' | 'neutral', string>;
  'en-US': Record<'loved' | 'liked' | 'neutral', string>;
}

export const GIFT_TIER_LABELS = data as GiftTierLabelsData;
