import type { RecommendationItem } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { RECOMMENDATION_TABS_LABELS } from '../stardew/data/recommendationTabsLabels.ts';

export type RecommendationTabId =
  | 'reminders'
  | 'actions'
  | 'skills'
  | 'friendship'
  | 'exploration'
  | 'inventory';

export interface RecommendationTab {
  id: RecommendationTabId;
  label: string;
  emptyText: string;
  items?: RecommendationItem[];
}

export function createRecommendationTabs(input: {
  reminders: RecommendationItem[];
  actions: RecommendationItem[];
  language?: AppLanguage;
}): RecommendationTab[] {
  const language = input.language ?? 'zh-CN';
  const labels = RECOMMENDATION_TABS_LABELS[language];

  return [
    {
      id: 'reminders',
      label: labels.reminders,
      emptyText: labels.remindersEmpty,
      items: input.reminders,
    },
    {
      id: 'actions',
      label: labels.actions,
      emptyText: labels.actionsEmpty,
      items: input.actions,
    },
    {
      id: 'skills',
      label: labels.skills,
      emptyText: '',
    },
    {
      id: 'friendship',
      label: labels.friendship,
      emptyText: '',
    },
    {
      id: 'exploration',
      label: labels.exploration,
      emptyText: '',
    },
    {
      id: 'inventory',
      label: labels.inventory,
      emptyText: '',
    },
  ];
}
