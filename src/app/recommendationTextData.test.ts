import test from 'node:test';
import assert from 'node:assert/strict';
import data from './recommendationTextData.json' with { type: 'json' };
import { RECOMMENDATION_TEXT_DATA } from './recommendationTextData.ts';

test('loads recommendation text data from external JSON', () => {
  assert.deepEqual(RECOMMENDATION_TEXT_DATA, data);
  assert.equal(RECOMMENDATION_TEXT_DATA.communityCenter.title, 'Deliver owned items to the Community Center');
  assert.equal(RECOMMENDATION_TEXT_DATA.joja.buyTitle, 'Buy {project}');
});
