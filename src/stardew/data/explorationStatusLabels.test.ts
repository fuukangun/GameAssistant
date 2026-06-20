import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPLORATION_STATUS_LABELS } from './explorationStatusLabels.ts';
import explorationStatusLabels from './explorationStatusLabels.json' with { type: 'json' };

test('loads exploration status labels from external JSON data', () => {
  assert.deepEqual(EXPLORATION_STATUS_LABELS, explorationStatusLabels);
  assert.equal(EXPLORATION_STATUS_LABELS.openStatus['zh-CN'], '已开放');
  assert.equal(EXPLORATION_STATUS_LABELS.grottoRouteLabel['en-US'], 'Skull Cavern');
});
