import type { RecommendationTabId } from './recommendationTabs.ts';

export function resolveRecommendationTabForSaveSelection(input: {
  activeTabId: RecommendationTabId;
  previousSaveId: string | undefined;
  selectedSaveId: string | undefined;
}): RecommendationTabId {
  if (input.previousSaveId && input.selectedSaveId && input.previousSaveId !== input.selectedSaveId) {
    return 'reminders';
  }

  return input.activeTabId;
}

export function resolveRecommendationTabForSaveClick(input: {
  activeTabId: RecommendationTabId;
  clickedSaveId: string;
  selectedSaveId: string | undefined;
}): RecommendationTabId {
  if (input.selectedSaveId && input.clickedSaveId !== input.selectedSaveId) {
    return 'reminders';
  }

  return input.activeTabId;
}
