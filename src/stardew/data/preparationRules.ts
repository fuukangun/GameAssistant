import preparationRules from './preparationRules.json' with { type: 'json' };
import { normalizeItemId } from './items.ts';

export type LanguageCode = 'zh-CN' | 'en-US';

export interface PreparationIdNameMap {
  ids: string[];
  namesByLanguage: Record<LanguageCode, Record<string, string>>;
}

export interface PreparationRulesData {
  bombs: PreparationIdNameMap;
  staircases: PreparationIdNameMap;
  sprinklers: {
    ids: string[];
    names: string[];
  };
}

export const PREPARATION_RULES = preparationRules as PreparationRulesData;

export function isBombItemId(id: number | string): boolean {
  return PREPARATION_RULES.bombs.ids.includes(normalizeItemId(id));
}

export function isStaircaseItemId(id: number | string): boolean {
  return PREPARATION_RULES.staircases.ids.includes(normalizeItemId(id));
}

export function isSprinklerItemId(id: number | string): boolean {
  return PREPARATION_RULES.sprinklers.ids.includes(normalizeItemId(id));
}

export function isBombItemName(name: string): boolean {
  return matchesAnyName(name, PREPARATION_RULES.bombs.namesByLanguage);
}

export function isStaircaseItemName(name: string): boolean {
  return matchesAnyName(name, PREPARATION_RULES.staircases.namesByLanguage);
}

export function isSprinklerItemName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return PREPARATION_RULES.sprinklers.names.some((candidate) => candidate.toLowerCase().includes(normalized) || normalized.includes(candidate.toLowerCase()));
}

export function formatPreparationItemName(
  id: number | string,
  fallbackName: string,
  language: LanguageCode,
): string {
  const normalizedId = normalizeItemId(id);
  return PREPARATION_RULES.bombs.namesByLanguage[language][normalizedId]
    ?? PREPARATION_RULES.staircases.namesByLanguage[language][normalizedId]
    ?? fallbackName;
}

function matchesAnyName(
  name: string,
  namesByLanguage: Record<LanguageCode, Record<string, string>>,
): boolean {
  const normalized = name.trim().toLowerCase();
  return Object.values(namesByLanguage)
    .flatMap((nameMap) => Object.values(nameMap))
    .some((candidate) => candidate.toLowerCase() === normalized);
}
