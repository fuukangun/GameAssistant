import { ITEM_CATALOG } from './items.ts';
import { ITEM_ICON_ID_LIST } from './itemIconIds.ts';
import { FISH_CATALOG } from './fish.ts';
import { NPC_GIFT_PREFERENCES } from './npcs.ts';
import { PROCESSING_RULES } from './processingRules.ts';
import { UPGRADE_RULES } from './upgradeRules.ts';
import { RECOMMENDATION_LOCALIZATION } from './recommendationLocalization.ts';

export interface StaticDataCoverageReport {
  itemCatalogCount: number;
  itemIconCount: number;
  npcGiftPreferenceCount: number;
  fishRuleCount: number;
  processingRuleCount: number;
  upgradeRuleCount: number;
  recommendationLocalizationCount: number;
}

export function createStaticDataCoverageReport(): StaticDataCoverageReport {
  return {
    itemCatalogCount: ITEM_CATALOG.length,
    itemIconCount: ITEM_ICON_ID_LIST.length,
    npcGiftPreferenceCount: NPC_GIFT_PREFERENCES.length,
    fishRuleCount: FISH_CATALOG.length,
    processingRuleCount: PROCESSING_RULES.length,
    upgradeRuleCount: UPGRADE_RULES.length,
    recommendationLocalizationCount: Object.keys(RECOMMENDATION_LOCALIZATION.englishTextNames).length,
  };
}
