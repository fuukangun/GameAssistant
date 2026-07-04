import type { InventoryItem, PlannerInput, RecommendationItem } from '../../../shared/types.ts';
import { formatItemName } from '../../../app/itemDisplay.ts';
import { BIRTHDAYS } from '../../data/calendar.ts';
import { NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES, type NpcGiftPreferences } from '../../data/npcs.ts';
import { normalizeItemId } from '../../data/items.ts';
import { formatChineseMonthDay } from '../sharedFormatting.ts';

export function buildBirthdayReminders(input: PlannerInput): RecommendationItem[] {
  if (input.manualCorrections.giftedToday) {
    return [];
  }

  const birthday = BIRTHDAYS.find(
    (item) => item.season === input.planDate.season && item.day === input.planDate.day,
  );
  if (!birthday) {
    return [];
  }

  const preference = NPC_GIFT_PREFERENCES.find((item) => item.npc === birthday.npc);
  const gift = preference ? findBestBirthdayGift(input.snapshot.inventory, preference) : undefined;

  if (!gift) {
    return [{
      id: `birthday-${birthday.npc.toLowerCase()}`,
      title: `今天是${birthday.npc}生日`,
      category: 'reminder',
      priority: 'must_do',
      confidence: 'high',
      reason: '生日送礼收益显著高于普通送礼，但当前库存未识别到已支持的可推荐礼物。',
      evidence: [
        { source: 'static_data', label: '生日', value: formatChineseMonthDay(input.planDate) },
      ],
      uncertainty: ['未确认游戏内今日是否已经送礼。'],
    }];
  }

  return [{
    id: `birthday-${birthday.npc.toLowerCase()}`,
    title: `给${birthday.npc}送${formatItemName(gift, 'zh-CN')}`,
    category: 'reminder',
    priority: 'must_do',
    confidence: 'high',
    reason: '生日送礼收益显著高于普通送礼，且库存中存在当前可识别的高收益礼物。',
    evidence: [
      { source: 'static_data', label: '生日', value: formatChineseMonthDay(input.planDate) },
      { source: 'save', label: '库存物品', value: `${formatItemName(gift, 'zh-CN')} x${gift.stack}${gift.sourceLabel ? `（${gift.sourceLabel}）` : ''}` },
    ],
    uncertainty: ['未确认游戏内今日是否已经送礼。'],
  }];
}

function findBestBirthdayGift(
  inventory: InventoryItem[],
  preference: NpcGiftPreferences,
): InventoryItem | undefined {
  const rankedGifts = inventory
    .map((item) => ({ item, rank: getPositiveGiftRank(item, preference) }))
    .filter((entry): entry is { item: InventoryItem; rank: number } => entry.rank !== undefined)
    .sort((left, right) => left.rank - right.rank);

  return rankedGifts[0]?.item;
}

function getPositiveGiftRank(
  item: InventoryItem,
  preference: NpcGiftPreferences,
): number | undefined {
  if (isExcludedGift(item, preference)) {
    return undefined;
  }

  if (matchesGift(item, preference.lovedItemIds, preference.lovedItemNames)) {
    return 0;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.lovedItemIds, UNIVERSAL_GIFT_PREFERENCES.lovedItemNames)) {
    return 0;
  }

  if (matchesGift(item, preference.likedItemIds ?? [], preference.likedItemNames ?? [])) {
    return 1;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.likedItemIds ?? [], UNIVERSAL_GIFT_PREFERENCES.likedItemNames ?? [])) {
    return 1;
  }

  if (matchesGift(item, preference.neutralItemIds ?? [], preference.neutralItemNames ?? [])) {
    return 2;
  }

  if (matchesGift(item, UNIVERSAL_GIFT_PREFERENCES.neutralItemIds ?? [], UNIVERSAL_GIFT_PREFERENCES.neutralItemNames ?? [])) {
    return 2;
  }

  return undefined;
}

function isExcludedGift(item: InventoryItem, preference: NpcGiftPreferences): boolean {
  return matchesGift(item, preference.hatedItemIds ?? [], preference.hatedItemNames ?? [])
    || matchesGift(item, preference.dislikedItemIds ?? [], preference.dislikedItemNames ?? [])
    || matchesGift(item, preference.excludedLovedItemIds ?? [], preference.excludedLovedItemNames ?? [])
    || matchesGift(item, preference.excludedLikedItemIds ?? [], preference.excludedLikedItemNames ?? [])
    || matchesGift(item, preference.excludedNeutralItemIds ?? [], preference.excludedNeutralItemNames ?? []);
}

function matchesGift(
  item: InventoryItem,
  itemIds: Array<number | string>,
  itemNames: string[],
): boolean {
  const itemId = normalizeItemId(item.id);
  return itemIds.some((id) => normalizeItemId(id) === itemId) || itemNames.includes(item.name);
}
