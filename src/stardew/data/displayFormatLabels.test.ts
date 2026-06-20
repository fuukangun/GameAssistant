import test from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_FORMAT_LABELS } from './displayFormatLabels.ts';
import displayFormatLabels from './displayFormatLabels.json' with { type: 'json' };

test('loads display format labels from external JSON data', () => {
  assert.deepEqual(DISPLAY_FORMAT_LABELS, displayFormatLabels);
  assert.equal(DISPLAY_FORMAT_LABELS.seasonLabels['zh-CN'].spring, '春季');
  assert.equal(DISPLAY_FORMAT_LABELS.npcNameLabels.Sebastian, '塞巴斯蒂安');
});
