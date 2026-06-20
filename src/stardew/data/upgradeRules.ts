import upgradeRules from './upgradeRules.json' with { type: 'json' };
import type { Confidence, EquipmentSummary, RecommendationItem } from '../../shared/types.ts';

export type UpgradeRuleKind = 'backpack' | 'tool' | 'fishingRod';
export type UpgradeEquipmentSlot = Extract<keyof EquipmentSummary, `${string}Name`>;

export interface UpgradeRule {
  id: string;
  kind: UpgradeRuleKind;
  slot?: UpgradeEquipmentSlot;
  baseNames?: string[];
  targetName?: string;
  requiredMaxItemsLessThan?: number;
  requiredMaxItemsAtLeast?: number;
  materialIds?: Array<number | string>;
  materialNames?: string[];
  materialStack?: number;
  goldCost: number;
  title: string;
  reason: string;
  priorityForMoneyGoal: RecommendationItem['priority'];
  priorityDefault: RecommendationItem['priority'];
  confidence: Confidence;
  uncertainty: string[];
}

export const UPGRADE_RULES: UpgradeRule[] = upgradeRules as UpgradeRule[];
