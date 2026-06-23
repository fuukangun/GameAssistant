import type { InventoryItem, RelationshipSummary } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { sortRelationshipsByFriendship } from './displayFormat.ts';
import { buildGiftOptions, hasGiftPreferenceData, type GiftOption } from './giftSuggestions.ts';
import { t } from './i18n.ts';

export interface FriendshipPanelRow {
  relationship: RelationshipSummary;
  giftOptions: GiftOption[];
  giftText: string;
}

interface FriendshipPanelModelDependencies {
  buildGiftOptions?: typeof buildGiftOptions;
  hasGiftPreferenceData?: typeof hasGiftPreferenceData;
}

export function createFriendshipPanelRows(
  relationships: RelationshipSummary[],
  inventory: InventoryItem[],
  language: AppLanguage,
  dependencies: FriendshipPanelModelDependencies = {},
): FriendshipPanelRow[] {
  const buildOptions = dependencies.buildGiftOptions ?? buildGiftOptions;
  const hasPreferenceData = dependencies.hasGiftPreferenceData ?? hasGiftPreferenceData;

  return sortRelationshipsByFriendship(relationships).map((relationship) => {
    const giftOptions = buildOptions(relationship, inventory, language);
    return {
      relationship,
      giftOptions,
      giftText: formatGiftText(relationship, giftOptions, language, hasPreferenceData),
    };
  });
}

function formatGiftText(
  relationship: RelationshipSummary,
  giftOptions: GiftOption[],
  language: AppLanguage,
  hasPreferenceData: typeof hasGiftPreferenceData,
): string {
  if ((relationship.giftsThisWeek ?? 0) >= 2) {
    return t(language, 'friendship.weeklyFull');
  }
  if (giftOptions.length > 0) {
    return giftOptions.map((option) => `${option.category}：${option.displayName} x${option.stack}${option.sourceLabel ? `（${option.sourceLabel}）` : ''}`).join('、');
  }
  if (hasPreferenceData(relationship.npc)) {
    return t(language, 'friendship.noMatch');
  }

  return t(language, 'friendship.pendingPreference');
}
