import inventorySourceLocaleLabels from './inventorySourceLocaleLabels.json' with { type: 'json' };

export interface InventorySourceLocaleLabelsData {
  'zh-CN': Record<string, string>;
  'en-US': Record<string, string>;
}

export const INVENTORY_SOURCE_LOCALE_LABELS = inventorySourceLocaleLabels as InventorySourceLocaleLabelsData;
