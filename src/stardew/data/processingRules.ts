import processingRules from './processingRules.json' with { type: 'json' };
import type { Confidence, RecommendationItem } from '../../shared/types.ts';

export type ProcessingIngredientKind = 'fish' | 'keg' | 'preserves' | 'egg' | 'milk' | 'dehydrator';

export interface ProcessingRule {
  id: string;
  machineIds: Array<number | string>;
  machineNames: string[];
  ingredientKind?: ProcessingIngredientKind;
  ingredientIds?: Array<number | string>;
  ingredientNames?: string[];
  extraMaterialIds?: Array<number | string>;
  extraMaterialNames?: string[];
  title: string;
  reason: string;
  completeMachineTitle?: string;
  completeMachineReason?: string;
  priorityForMoneyGoal: RecommendationItem['priority'];
  priorityDefault: RecommendationItem['priority'];
  confidence: Confidence;
  uncertainty: string;
}

export const PROCESSING_RULES: ProcessingRule[] = processingRules as ProcessingRule[];
