import test from 'node:test';
import assert from 'node:assert/strict';
import { createFarmPlotStatusSummary } from './farmPlotStatus.ts';
import type { StardewSaveSnapshot } from '../shared/types.ts';

test('summarizes planted crop evidence while keeping empty plots explicitly unparsed', () => {
  const summary = createFarmPlotStatusSummary({
    crops: [
      { id: 24, name: '防风草', isReady: false, quantity: 8, sellPrice: 35 },
      { id: 258, name: '蓝莓', isReady: true, quantity: 12, sellPrice: 50 },
    ],
    inventory: [{ id: 472, name: '防风草种子', stack: 6, sourceLabel: '储物箱' }],
  } as unknown as StardewSaveSnapshot);

  assert.equal(summary.plantedCropCount, 20);
  assert.equal(summary.emptyPlotStatus, 'unparsed');
  assert.equal(summary.recommendationMode, 'degraded');
  assert.deepEqual(summary.evidence, [
    '已解析作物：防风草 x8、蓝莓 x12',
    '已识别种子：防风草种子 x6（储物箱）',
  ]);
  assert.deepEqual(summary.uncertainty, ['空地数量未精确解析', '耕地/可种植地块未精确解析']);
});

test('does not invent planted or empty plot precision without parsed crop evidence', () => {
  const summary = createFarmPlotStatusSummary({
    crops: [],
    inventory: [{ id: 66, name: '紫水晶', stack: 2 }],
  } as unknown as StardewSaveSnapshot);

  assert.equal(summary.plantedCropCount, 0);
  assert.equal(summary.emptyPlotStatus, 'unparsed');
  assert.equal(summary.recommendationMode, 'degraded');
  assert.deepEqual(summary.evidence, ['未解析到已种植作物']);
  assert.deepEqual(summary.uncertainty, ['空地数量未精确解析', '耕地/可种植地块未精确解析']);
});

test('uses parsed farm plot summary with precise tilled empty plot count', () => {
  const summary = createFarmPlotStatusSummary({
    crops: [],
    inventory: [],
    farmPlotSummary: {
      plantedCropCount: 1,
      tilledTileCount: 2,
      occupiedObjectCount: 1,
      resourceClumpCount: 1,
      emptyTileCount: 1,
      parsedFields: [
        'locations.GameLocation[name=Farm].terrainFeatures',
        'locations.GameLocation[name=Farm].objects',
        'locations.GameLocation[name=Farm].resourceClumps',
      ],
      unknownFields: [
        'farmableTileCount',
        'buildingFootprints',
      ],
    },
  } as unknown as StardewSaveSnapshot);

  assert.equal(summary.plantedCropCount, 1);
  assert.equal(summary.emptyPlotStatus, 'parsed');
  assert.deepEqual(summary.evidence, [
    '已解析农场作物：1 块',
    '已解析耕地：2 块',
    '已解析可直接种植的已耕空地：1 块',
    '已解析占用物件：1 个',
    '已解析资源障碍：1 个',
  ]);
  assert.deepEqual(summary.uncertainty, [
    '可耕种地块总数未知',
    '建筑占地未校准',
  ]);
});

test('keeps parsed empty plot count conservative when no empty tilled tiles are confirmed', () => {
  const summary = createFarmPlotStatusSummary({
    crops: [],
    inventory: [],
    farmPlotSummary: {
      plantedCropCount: 0,
      tilledTileCount: 4,
      occupiedObjectCount: 0,
      resourceClumpCount: 0,
      buildingCount: 0,
      parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
      unknownFields: ['emptyTileCount', 'farmableTileCount', 'buildingFootprints'],
    },
  } as unknown as StardewSaveSnapshot);

  assert.equal(summary.emptyPlotStatus, 'unparsed');
  assert.equal(summary.emptyTilledTileCount, undefined);
  assert.equal(summary.recommendationMode, 'degraded');
});

test('degrades inconsistent parsed empty plot counts instead of overstating available land', () => {
  const summary = createFarmPlotStatusSummary({
    crops: [],
    inventory: [],
    farmPlotSummary: {
      plantedCropCount: 2,
      tilledTileCount: 3,
      occupiedObjectCount: 0,
      resourceClumpCount: 0,
      buildingCount: 0,
      emptyTileCount: 8,
      parsedFields: ['locations.GameLocation[name=Farm].terrainFeatures'],
      unknownFields: [],
    },
  } as unknown as StardewSaveSnapshot);

  assert.equal(summary.emptyPlotStatus, 'unparsed');
  assert.equal(summary.emptyTilledTileCount, undefined);
  assert.equal(summary.recommendationMode, 'degraded');
  assert.deepEqual(summary.uncertainty, ['空地数量未精确解析']);
});
