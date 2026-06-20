import itemCatalog from './itemCatalog.json' with { type: 'json' };
import { ITEM_NAME_ALIASES } from './itemNameAliases.ts';

export interface ItemCatalogEntry {
  id: number | string;
  name: string;
}

export const ITEM_CATALOG: ItemCatalogEntry[] = itemCatalog;

export function getItemNameById(id: number | string | undefined): string | undefined {
  if (id === undefined) {
    return undefined;
  }

  const normalizedId = normalizeItemId(id);
  const name = ITEM_CATALOG.find((item) => String(item.id) === normalizedId)?.name;
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
  const catalogMatch = ITEM_CATALOG.find((item) => item.name === trimmed || ITEM_NAME_ALIASES[item.name] === trimmed);
  return catalogMatch ? normalizeItemId(catalogMatch.id) : undefined;
}

export function normalizeItemId(id: number | string): string {
  return String(id).replace(/^\([^)]+\)/, '');
}
