import itemIconIds from './itemIconIds.json' with { type: 'json' };

export const ITEM_ICON_ID_LIST = itemIconIds as string[];
export const ITEM_ICON_IDS = new Set(ITEM_ICON_ID_LIST);
