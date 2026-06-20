import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_PLOT_MESSAGES } from './farmPlotMessages.ts';
import farmPlotMessages from './farmPlotMessages.json' with { type: 'json' };

test('loads farm plot messages from external JSON data', () => {
  assert.deepEqual(FARM_PLOT_MESSAGES, farmPlotMessages);
  assert.equal(FARM_PLOT_MESSAGES.unknownFields.emptyTileCount, '空地数量未精确解析');
  assert.equal(FARM_PLOT_MESSAGES.emptyCropEvidence, '未解析到已种植作物');
});
