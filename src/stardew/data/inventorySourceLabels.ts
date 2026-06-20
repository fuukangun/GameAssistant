import inventorySourceLabels from './inventorySourceLabels.json' with { type: 'json' };

export interface InventorySourceLabelsData {
  backpack: string;
  chest: string;
  fridge: string;
  unknown: string;
}

export const INVENTORY_SOURCE_LABELS = inventorySourceLabels as InventorySourceLabelsData;
