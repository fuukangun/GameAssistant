import test from 'node:test';
import assert from 'node:assert/strict';
import { RECOMMENDATION_LOCALIZATION } from './recommendationLocalization.ts';
import recommendationLocalization from './recommendationLocalization.json' with { type: 'json' };

test('loads recommendation localization data from external JSON', () => {
  assert.deepEqual(RECOMMENDATION_LOCALIZATION, recommendationLocalization);
  assert.equal(RECOMMENDATION_LOCALIZATION.weatherNames.sunny, '晴天');
  assert.equal(RECOMMENDATION_LOCALIZATION.evidenceLabels.社区中心进度, 'Community Center Progress');
  assert.equal(RECOMMENDATION_LOCALIZATION.inventorySources.背包, 'Backpack');
});
