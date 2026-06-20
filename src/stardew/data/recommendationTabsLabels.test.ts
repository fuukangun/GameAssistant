import test from 'node:test';
import assert from 'node:assert/strict';
import { RECOMMENDATION_TABS_LABELS } from './recommendationTabsLabels.ts';
import recommendationTabsLabels from './recommendationTabsLabels.json' with { type: 'json' };

test('loads recommendation tab labels from external JSON data', () => {
  assert.deepEqual(RECOMMENDATION_TABS_LABELS, recommendationTabsLabels);
  assert.equal(RECOMMENDATION_TABS_LABELS['zh-CN'].reminders, '重要提醒');
  assert.equal(RECOMMENDATION_TABS_LABELS['en-US'].inventory, 'Owned Items');
});
