import test from 'node:test';
import assert from 'node:assert/strict';
import data from './recommendationDisplayData.json' with { type: 'json' };
import { RECOMMENDATION_DISPLAY_DATA } from './recommendationDisplayData.ts';

test('loads recommendation display data from external JSON data', () => {
  assert.deepEqual(RECOMMENDATION_DISPLAY_DATA, data);
  assert.equal(RECOMMENDATION_DISPLAY_DATA['fish-for-money']?.title, 'Spend some time fishing for income');
  assert.ok(Array.isArray(RECOMMENDATION_DISPLAY_DATA['farm-maintenance']?.uncertainty));
});
