import itemCatalog from './itemCatalog.json' with { type: 'json' };
import { ITEM_NAME_ALIASES } from './itemNameAliases.ts';

export interface ItemCatalogEntry {
  id: number | string;
  name: string;
}

export const ITEM_CATALOG: ItemCatalogEntry[] = itemCatalog;
const ITEM_NAMES_BY_ID = new Map(ITEM_CATALOG.map((item) => [normalizeItemId(item.id), item.name]));
const ITEM_IDS_BY_NAME = new Map<string, string>();

for (const item of ITEM_CATALOG) {
  ITEM_IDS_BY_NAME.set(item.name, normalizeItemId(item.id));
  const alias = ITEM_NAME_ALIASES[item.name];
  if (alias !== undefined) {
    ITEM_IDS_BY_NAME.set(alias, normalizeItemId(item.id));
  }
}

export function getItemNameById(id: number | string | undefined): string | undefined {
  if (id === undefined) {
    return undefined;
  }

  const name = ITEM_NAMES_BY_ID.get(normalizeItemId(id));
  return name ? (ITEM_NAME_ALIASES[name] ?? name) : undefined;
}

export function getItemNameAlias(name: string | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  return ITEM_NAME_ALIASES[name.trim()];
}

export function getItemIdByName(name: string | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  const trimmed = name.trim();
  return ITEM_IDS_BY_NAME.get(trimmed);
}

export function normalizeItemId(id: number | string): string {
  return String(id).replace(/^\([^)]+\)/, '');
}
