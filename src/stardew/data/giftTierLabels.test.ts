import test from 'node:test';
import assert from 'node:assert/strict';
import data from './giftTierLabels.json' with { type: 'json' };
import { GIFT_TIER_LABELS } from './giftTierLabels.ts';

test('loads gift tier labels from external JSON data', () => {
  assert.deepEqual(GIFT_TIER_LABELS, data);
  assert.equal(GIFT_TIER_LABELS['zh-CN'].loved, '最爱');
  assert.equal(GIFT_TIER_LABELS['en-US'].liked, 'Liked');
});
