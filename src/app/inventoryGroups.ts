import type { InventoryItem } from '../shared/types.ts';
import { INVENTORY_SOURCE_LABELS } from '../stardew/data/inventorySourceLabels.ts';

export interface InventoryGroup {
  id: string;
  label: string;
  items: InventoryItem[];
}

const sourceOrder: Array<NonNullable<InventoryItem['source']> | 'unknown'> = ['backpack', 'chest', 'fridge', 'unknown'];

export function groupInventoryBySource(inventory: InventoryItem[]): InventoryGroup[] {
  return sourceOrder.flatMap((source) => {
    const items = inventory
      .filter((item) => (item.source ?? 'unknown') === source)
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));

    if (items.length === 0) {
      return [];
    }

    return [{
      id: source,
      label: INVENTORY_SOURCE_LABELS[source],
      items,
    }];
  });
}
