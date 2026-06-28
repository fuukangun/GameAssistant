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

interface IndexedGiftItem {
  item: InventoryItem;
  normalizedItemId: string;
  catalogGiftName?: string;
  normalizedCatalogGiftName?: string;
  normalizedItemName: string;
  itemNameId?: string;
  displayName: string;
}

interface CompiledGiftList {
  ids: Set<string>;
  names: Set<string>;
}

interface CompiledGiftPreference {
  loved: CompiledGiftList;
  liked: CompiledGiftList;
  neutral: CompiledGiftList;
  excluded: CompiledGiftList;
}

const COMPILED_UNIVERSAL_GIFT_PREFERENCES = compileGiftPreference(UNIVERSAL_GIFT_PREFERENCES);
const COMPILED_CONSERVATIVE_UNIVERSAL_FALLBACK = compileGiftPreference(CONSERVATIVE_UNIVERSAL_FALLBACK);
const COMPILED_NPC_GIFT_PREFERENCES_BY_NAME = new Map(
  NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, compileGiftPreference(preference)]),
);

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
  return createGiftOptionBuilder(inventory, language)(relationship);
}

export function createGiftOptionBuilder(
  inventory: InventoryItem[],
  language: AppLanguage = 'zh-CN',
): (relationship: RelationshipSummary) => GiftOption[] {
  const indexedInventory = inventory.map((item) => createIndexedGiftItem(item, language));

  return (relationship: RelationshipSummary): GiftOption[] => buildGiftOptionsFromIndexed(relationship, indexedInventory);
}

function buildGiftOptionsFromIndexed(
  relationship: RelationshipSummary,
  indexedInventory: IndexedGiftItem[],
): GiftOption[] {
  if ((relationship.giftsThisWeek ?? 0) >= 2) {
    return [];
  }

  const preference = COMPILED_NPC_GIFT_PREFERENCES_BY_NAME.get(relationship.npc);

  return indexedInventory
    .flatMap((item): GiftOption[] => {
      const tier = preference
        ? getNpcGiftTier(item, preference)
        : getGiftTier(item, [COMPILED_CONSERVATIVE_UNIVERSAL_FALLBACK]);
      if (!tier) {
        return [];
      }

      return [{
        tier,
        category: formatGiftTier(tier),
        displayName: item.displayName,
        id: item.item.id,
        stack: item.item.stack,
        quality: item.item.quality,
        source: item.item.source,
        sourceLabel: item.item.sourceLabel,
      }];
    })
    .sort(compareGiftOptions);
}

export function hasGiftPreferenceData(npc: string): boolean {
  return NPC_GIFT_PREFERENCES_BY_NAME.has(npc);
}

function getNpcGiftTier(
  item: IndexedGiftItem,
  preference: CompiledGiftPreference,
): GiftTier | undefined {
  const npcTier = getGiftTier(item, [preference]);
  if (npcTier || matchesGiftList(item, preference.excluded) || matchesGiftTier(item, preference, 'neutral')) {
    return npcTier;
  }

  return getGiftTier(item, [COMPILED_UNIVERSAL_GIFT_PREFERENCES]);
}

function getGiftTier(
  item: IndexedGiftItem,
  preferencePool: CompiledGiftPreference[],
): GiftTier | undefined {
  if (preferencePool.some((preference) => matchesGiftList(item, preference.excluded))) {
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
  item: IndexedGiftItem,
  preference: CompiledGiftPreference,
  tier: 'loved' | 'liked' | 'neutral',
): boolean {
  const giftList = tier === 'loved'
    ? preference.loved
    : tier === 'liked'
      ? preference.liked
      : preference.neutral;

  return matchesGiftList(item, giftList);
}

function matchesGiftList(
  item: IndexedGiftItem,
  giftList: CompiledGiftList,
): boolean {
  return giftList.ids.has(item.normalizedItemId)
    || (item.normalizedCatalogGiftName !== undefined && giftList.names.has(item.normalizedCatalogGiftName))
    || (item.catalogGiftName === undefined && giftList.names.has(item.normalizedItemName))
    || (item.itemNameId !== undefined && giftList.ids.has(item.itemNameId));
}

function normalizeGiftName(name: string): string {
  return name.trim().toLowerCase();
}

function createIndexedGiftItem(item: InventoryItem, language: AppLanguage): IndexedGiftItem {
  const catalogGiftName = getItemNameById(item.id);
  return {
    item,
    normalizedItemId: normalizeItemId(item.id),
    catalogGiftName,
    normalizedCatalogGiftName: catalogGiftName === undefined ? undefined : normalizeGiftName(catalogGiftName),
    normalizedItemName: normalizeGiftName(item.name),
    itemNameId: catalogGiftName === undefined ? getItemIdByName(item.name) : undefined,
    displayName: formatItemName(item, language),
  };
}

function compileGiftPreference(preference: Omit<NpcGiftPreferences, 'npc'>): CompiledGiftPreference {
  return {
    loved: compileGiftList(preference.lovedItemIds, preference.lovedItemNames),
    liked: compileGiftList(preference.likedItemIds ?? [], preference.likedItemNames ?? []),
    neutral: compileGiftList(preference.neutralItemIds ?? [], preference.neutralItemNames ?? []),
    excluded: compileGiftList([
      ...(preference.hatedItemIds ?? []),
      ...(preference.dislikedItemIds ?? []),
      ...(preference.excludedLovedItemIds ?? []),
      ...(preference.excludedLikedItemIds ?? []),
      ...(preference.excludedNeutralItemIds ?? []),
    ], [
      ...(preference.hatedItemNames ?? []),
      ...(preference.dislikedItemNames ?? []),
      ...(preference.excludedLovedItemNames ?? []),
      ...(preference.excludedLikedItemNames ?? []),
      ...(preference.excludedNeutralItemNames ?? []),
    ]),
  };
}

function compileGiftList(ids: Array<number | string>, names: string[]): CompiledGiftList {
  return {
    ids: new Set(ids.map((id) => normalizeItemId(id))),
    names: new Set(names.map((name) => normalizeGiftName(name))),
  };
}

function formatGiftOptionLabel(option: GiftOption): string {
  return `${option.displayName} x${option.stack}${option.sourceLabel ? `（${option.sourceLabel}）` : ''}`;
}
