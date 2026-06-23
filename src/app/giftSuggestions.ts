import type { InventoryItem, RelationshipSummary } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { formatItemName } from './itemDisplay.ts';
import { getItemIdByName, getItemNameById, normalizeItemId } from '../stardew/data/items.ts';
import { NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES, type NpcGiftPreferences } from '../stardew/data/npcs.ts';
import { GIFT_TIER_LABELS } from '../stardew/data/giftTierLabels.ts';

export type GiftTier = 'loved' | 'liked' | 'neutral';

const CONSERVATIVE_UNIVERSAL_FALLBACK: Omit<NpcGiftPreferences, 'npc'> = {
  lovedItemIds: [
    ...UNIVERSAL_GIFT_PREFERENCES.lovedItemIds,
    797,
    'StardropTea',
  ],
  lovedItemNames: [
    ...UNIVERSAL_GIFT_PREFERENCES.lovedItemNames,
    'Pearl',
    '珍珠',
    'Stardrop Tea',
    '星之果茶',
  ],
  likedItemIds: [
    72,
  ],
  likedItemNames: [
    'Diamond',
    '钻石',
  ],
  neutralItemIds: [],
  neutralItemNames: [],
};

const NPC_GIFT_PREFERENCES_BY_NAME = new Map(NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, preference]));

export interface GiftSuggestion {
  category: '最爱' | '喜欢' | '中立';
  label: string;
}

export interface GiftOption {
  tier: GiftTier;
  category: GiftSuggestion['category'];
  displayName: string;
  id: InventoryItem['id'];
  stack: number;
  quality?: number;
  source?: InventoryItem['source'];
  sourceLabel?: string;
}

export function buildGiftSuggestions(
  relationship: RelationshipSummary,
  inventory: InventoryItem[],
  language: AppLanguage = 'zh-CN',
): GiftSuggestion[] {
  return buildGiftOptions(relationship, inventory, language).map((option) => ({
    category: option.category,
    label: formatGiftOptionLabel(option),
  }));
}

export function buildGiftOptions(
  relationship: RelationshipSummary,
  inventory: InventoryItem[],
  language: AppLanguage = 'zh-CN',
): GiftOption[] {
  if ((relationship.giftsThisWeek ?? 0) >= 2) {
    return [];
  }

  const preference = NPC_GIFT_PREFERENCES_BY_NAME.get(relationship.npc);

  return inventory
    .flatMap((item): GiftOption[] => {
      const tier = preference
        ? getNpcGiftTier(item, preference)
        : getGiftTier(item, [CONSERVATIVE_UNIVERSAL_FALLBACK]);
      if (!tier) {
        return [];
      }

      return [{
        tier,
        category: formatGiftTier(tier),
        displayName: formatItemName(item, language),
        id: item.id,
        stack: item.stack,
        quality: item.quality,
        source: item.source,
        sourceLabel: item.sourceLabel,
      }];
    })
    .sort(compareGiftOptions);
}

export function hasGiftPreferenceData(npc: string): boolean {
  return NPC_GIFT_PREFERENCES_BY_NAME.has(npc);
}

function getNpcGiftTier(
  item: InventoryItem,
  preference: NpcGiftPreferences,
): GiftTier | undefined {
  const npcTier = getGiftTier(item, [preference]);
  if (npcTier || matchesExcludedGift(item, preference) || matchesGiftTier(item, preference, 'neutral')) {
    return npcTier;
  }

  return getGiftTier(item, [UNIVERSAL_GIFT_PREFERENCES]);
}

function getGiftTier(
  item: InventoryItem,
  preferencePool: Array<Omit<NpcGiftPreferences, 'npc'>>,
): GiftTier | undefined {
  if (preferencePool.some((preference) => matchesExcludedGift(item, preference))) {
    return undefined;
  }

  if (preferencePool.some((preference) => matchesGiftTier(item, preference, 'loved'))) {
    return 'loved';
  }

  if (preferencePool.some((preference) => matchesGiftTier(item, preference, 'liked'))) {
    return 'liked';
  }

  if (preferencePool.some((preference) => matchesGiftTier(item, preference, 'neutral'))) {
    return 'neutral';
  }

  return undefined;
}

function matchesExcludedGift(item: InventoryItem, preference: Omit<NpcGiftPreferences, 'npc'>): boolean {
  return matchesGiftList(item, preference.hatedItemIds ?? [], preference.hatedItemNames ?? [])
    || matchesGiftList(item, preference.dislikedItemIds ?? [], preference.dislikedItemNames ?? [])
    || matchesGiftList(item, preference.excludedLovedItemIds ?? [], preference.excludedLovedItemNames ?? [])
    || matchesGiftList(item, preference.excludedLikedItemIds ?? [], preference.excludedLikedItemNames ?? [])
    || matchesGiftList(item, preference.excludedNeutralItemIds ?? [], preference.excludedNeutralItemNames ?? []);
}

function formatGiftTier(tier: GiftTier): GiftSuggestion['category'] {
  return GIFT_TIER_LABELS['zh-CN'][tier] as GiftSuggestion['category'];
}

function compareGiftOptions(left: GiftOption, right: GiftOption): number {
  const tierOrder: Record<GiftTier, number> = {
    loved: 0,
    liked: 1,
    neutral: 2,
  };
  return tierOrder[left.tier] - tierOrder[right.tier]
    || left.displayName.localeCompare(right.displayName, 'zh-Hans-CN')
    || String(left.id).localeCompare(String(right.id));
}

function matchesGiftTier(
  item: InventoryItem,
  preference: Omit<NpcGiftPreferences, 'npc'>,
  tier: 'loved' | 'liked' | 'neutral',
): boolean {
  const normalizedItemId = normalizeItemId(item.id);
  const ids = tier === 'loved'
    ? preference.lovedItemIds
    : tier === 'liked'
      ? preference.likedItemIds ?? []
      : preference.neutralItemIds ?? [];
  const names = tier === 'loved'
    ? preference.lovedItemNames
    : tier === 'liked'
      ? preference.likedItemNames ?? []
      : preference.neutralItemNames ?? [];

  return matchesGiftList(item, ids, names);
}

function matchesGiftList(
  item: InventoryItem,
  ids: Array<number | string>,
  names: string[],
): boolean {
  const normalizedItemId = normalizeItemId(item.id);
  const catalogName = getItemNameById(item.id);
  const normalizedItemName = item.name.trim().toLowerCase();
  const itemNameId = catalogName === undefined ? getItemIdByName(item.name) : undefined;

  return ids.some((id) => normalizeItemId(id) === normalizedItemId)
    || (catalogName !== undefined && names.some((name) => normalizeGiftName(name) === normalizeGiftName(catalogName)))
    || (catalogName === undefined && names.some((name) => normalizeGiftName(name) === normalizedItemName))
    || (itemNameId !== undefined && ids.some((id) => normalizeItemId(id) === itemNameId));
}

function normalizeGiftName(name: string): string {
  return name.trim().toLowerCase();
}

function formatGiftOptionLabel(option: GiftOption): string {
  return `${option.displayName} x${option.stack}${option.sourceLabel ? `（${option.sourceLabel}）` : ''}`;
}
