import saveParsingRules from './saveParsingRules.json' with { type: 'json' };
import type { Weather } from '../../shared/types.ts';

export interface SaveParsingRules {
  farmTypes: Record<string, string>;
  weatherValues: Weather[];
  jojaProjectMarkers: string[];
  accessMarkers: {
    desert: string[];
    islandPlayer: string[];
    islandRoot: string[];
    volcanoPlayer: string[];
    volcanoLocations: string[];
    volcanoShortcut: string[];
  };
  multiplayerFields: string[];
  equipment: {
    fishingRod: EquipmentMatchRule;
    hoe: EquipmentMatchRule;
    pickaxe: EquipmentMatchRule;
    wateringCan: EquipmentMatchRule;
    trashCan: EquipmentMatchRule;
    weapon: EquipmentMatchRule;
    axe: {
      type: string;
      keywords: string[];
      excludeKeywords: string[];
    };
    scythe: {
      itemIds: string[];
      keywords: string[];
    };
    pan: {
      type: string;
      itemIds: string[];
      names: string[];
    };
    genericNames: string[];
    displayNames: Record<string, string>;
    trashCanLevels: string[];
    baitKeywords: string[];
  };
}

export interface EquipmentMatchRule {
  types: string[];
  keywords: string[];
}

export const SAVE_PARSING_RULES: SaveParsingRules = saveParsingRules as SaveParsingRules;
