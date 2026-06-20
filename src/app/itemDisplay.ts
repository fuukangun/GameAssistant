import type { InventoryItem } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';
import { getItemNameAlias, getItemNameById } from '../stardew/data/items.ts';

export function formatItemName(
  item: Pick<InventoryItem, 'id' | 'name'>,
  language: AppLanguage,
): string {
  if (language === 'zh-CN') {
    return getItemNameById(item.id) ?? getItemNameAlias(item.name) ?? item.name;
  }

  return item.name;
}

export function formatItemSource(
  item: Pick<InventoryItem, 'source' | 'sourceLabel'>,
  language: AppLanguage,
): string | undefined {
  if (item.source === 'backpack') {
    return t(language, 'inventory.source.backpack');
  }
  if (item.source === 'chest') {
    return t(language, 'inventory.source.chest');
  }
  if (item.source === 'fridge') {
    return t(language, 'inventory.source.fridge');
  }

  return item.sourceLabel;
}
