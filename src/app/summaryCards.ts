import type { PlanDate, StardewSaveSnapshot } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { formatFarmType } from './displayFormat.ts';
import { formatPlanDateLabel, t } from './i18n.ts';

export interface SummaryCard {
  id: string;
  label: string;
  value: string;
  detail?: string;
}

export function createSummaryCards(
  snapshot: StardewSaveSnapshot,
  planDate: PlanDate,
  language: AppLanguage,
): SummaryCard[] {
  return [
    {
      id: 'farm',
      label: t(language, 'summary.farm'),
      value: snapshot.farm.farmName,
      detail: formatFarmType(snapshot.farm.farmType, language),
    },
    {
      id: 'money',
      label: t(language, 'summary.money'),
      value: `${snapshot.wallet.money.toLocaleString()}${t(language, 'common.gold')}`,
    },
    {
      id: 'plan-date',
      label: t(language, 'summary.planDate'),
      value: formatPlanDateForSummary(planDate, language),
    },
  ];
}

function formatPlanDateForSummary(planDate: PlanDate, language: AppLanguage): string {
  return formatPlanDateLabel(planDate, language);
}
