import type { ProducedItemDetail } from '../shared/types.ts';

export const PRODUCED_ITEM_DETAIL_THRESHOLD = 3;

export interface ProducedItemSourceGroup {
  key: string;
  sourceName?: string;
  items: ProducedItemDetail[];
}

export function shouldShowProducedItemDetailButton(
  items: ProducedItemDetail[] | undefined,
): boolean {
  return (items?.length ?? 0) > PRODUCED_ITEM_DETAIL_THRESHOLD;
}

export function groupProducedItemsBySource(items: ProducedItemDetail[]): ProducedItemSourceGroup[] {
  const groups: ProducedItemSourceGroup[] = [];
  const indexBySource = new Map<string, number>();
  const itemIndexBySource = new Map<string, Map<string, number>>();

  for (const item of items) {
    const key = item.sourceName ?? 'unknown';
    const existingIndex = indexBySource.get(key);
    if (existingIndex !== undefined) {
      appendProducedItem(groups[existingIndex], itemIndexBySource.get(key), item);
      continue;
    }

    indexBySource.set(key, groups.length);
    itemIndexBySource.set(key, new Map([[getProducedItemKey(item), 0]]));
    groups.push({
      key,
      sourceName: item.sourceName,
      items: [item],
    });
  }

  return groups;
}

function appendProducedItem(
  group: ProducedItemSourceGroup | undefined,
  itemIndexes: Map<string, number> | undefined,
  item: ProducedItemDetail,
): void {
  if (!group || !itemIndexes) {
    return;
  }

  const itemKey = getProducedItemKey(item);
  const existingItemIndex = itemIndexes.get(itemKey);
  if (existingItemIndex !== undefined) {
    const existingItem = group.items[existingItemIndex];
    if (existingItem) {
      existingItem.quantity += item.quantity;
    }
    return;
  }

  itemIndexes.set(itemKey, group.items.length);
  group.items.push(item);
}

function getProducedItemKey(item: ProducedItemDetail): string {
  return String(item.itemId ?? item.itemName);
}
