import { normalizeItemId } from '../stardew/data/items.ts';
import { ITEM_ICON_IDS } from '../stardew/data/itemIconIds.ts';

export function getItemIconPath(id: number | string): string | undefined {
  const normalizedId = normalizeItemId(id);
  return ITEM_ICON_IDS.has(normalizedId) ? `./item-icons/${normalizedId}.png` : undefined;
}
