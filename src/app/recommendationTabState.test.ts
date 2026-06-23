import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRecommendationTabForSaveClick, resolveRecommendationTabForSaveSelection } from './recommendationTabState.ts';

test('resets active recommendation tab to reminders when selected save changes', () => {
  assert.equal(resolveRecommendationTabForSaveSelection({
    activeTabId: 'friendship',
    previousSaveId: 'A',
    selectedSaveId: 'B',
  }), 'reminders');
});

test('keeps active recommendation tab when selected save stays the same', () => {
  assert.equal(resolveRecommendationTabForSaveSelection({
    activeTabId: 'friendship',
    previousSaveId: 'A',
    selectedSaveId: 'A',
  }), 'friendship');
});

test('does not reset tab on first selected save initialization', () => {
  assert.equal(resolveRecommendationTabForSaveSelection({
    activeTabId: 'actions',
    previousSaveId: undefined,
    selectedSaveId: 'A',
  }), 'actions');
});

test('resets active recommendation tab immediately when clicking a different save', () => {
  assert.equal(resolveRecommendationTabForSaveClick({
    activeTabId: 'friendship',
    clickedSaveId: 'B',
    selectedSaveId: 'A',
  }), 'reminders');
});

test('keeps active recommendation tab when clicking the already selected save', () => {
  assert.equal(resolveRecommendationTabForSaveClick({
    activeTabId: 'friendship',
    clickedSaveId: 'A',
    selectedSaveId: 'A',
  }), 'friendship');
});
