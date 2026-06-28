import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASIC_PLANTING_OPTIONS,
  canCropMatureBySeasonEnd,
  calculateConservativeCropRoi,
  findCropById,
} from './crops.ts';
import cropPlantingOptions from './cropPlantingOptions.json' with { type: 'json' };

test('loads crop planting options from external JSON data', () => {
  assert.deepEqual(
    BASIC_PLANTING_OPTIONS.map((crop) => crop.id),
    cropPlantingOptions.map((crop) => crop.id),
  );
});

test('normalizes crop seasons and planting zones for greenhouse and island rules', () => {
  const parsnip = findCropById('parsnip');
  assert.ok(parsnip);

  assert.deepEqual(parsnip.seasons, ['spring']);
  assert.deepEqual(parsnip.allowedPlantingZones, ['farm', 'greenhouse', 'ginger_island_farm']);
});

test('covers basic shop crops across spring summer and fall', () => {
  const ids = new Set(BASIC_PLANTING_OPTIONS.map((crop) => crop.id));

  for (const id of [
    'parsnip',
    'potato',
    'cauliflower',
    'bean-starter',
    'melon',
    'blueberry',
    'tomato',
    'wheat',
    'pumpkin',
    'cranberries',
    'eggplant',
    'corn',
  ]) {
    assert.equal(ids.has(id), true, `${id} should be included`);
  }
});

test('rejects crops outside their season or without enough days before season end', () => {
  const parsnip = findCropById('parsnip');
  assert.ok(parsnip);

  assert.equal(canCropMatureBySeasonEnd(parsnip, { year: 1, season: 'spring', day: 24 }), true);
  assert.equal(canCropMatureBySeasonEnd(parsnip, { year: 1, season: 'spring', day: 25 }), false);
  assert.equal(canCropMatureBySeasonEnd(parsnip, { year: 1, season: 'spring', day: 28 }), false);
  assert.equal(canCropMatureBySeasonEnd(parsnip, { year: 1, season: 'winter', day: 1 }), false);
});

test('calculates conservative single-seed ROI for one-time and regrow crops', () => {
  const parsnip = findCropById('parsnip');
  const blueberry = findCropById('blueberry');
  assert.ok(parsnip);
  assert.ok(blueberry);

  assert.deepEqual(calculateConservativeCropRoi(parsnip, { year: 1, season: 'spring', day: 24 }), {
    canMature: true,
    harvests: 1,
    revenue: 35,
    profit: 15,
    roi: 0.75,
  });
  assert.deepEqual(calculateConservativeCropRoi(blueberry, { year: 1, season: 'summer', day: 1 }), {
    canMature: true,
    harvests: 4,
    revenue: 200,
    profit: 120,
    roi: 1.5,
  });
});

test('returns no conservative ROI when a crop cannot mature', () => {
  const pumpkin = findCropById('pumpkin');
  assert.ok(pumpkin);

  assert.deepEqual(calculateConservativeCropRoi(pumpkin, { year: 1, season: 'fall', day: 16 }), {
    canMature: false,
    harvests: 0,
    revenue: 0,
    profit: -100,
    roi: -1,
  });
});

test('treats invalid planting days as unable to mature', () => {
  const parsnip = findCropById('parsnip');
  assert.ok(parsnip);

  for (const day of [0, -1, 29, 30]) {
    assert.equal(canCropMatureBySeasonEnd(parsnip, { year: 1, season: 'spring', day }), false);
    assert.deepEqual(calculateConservativeCropRoi(parsnip, { year: 1, season: 'spring', day }), {
      canMature: false,
      harvests: 0,
      revenue: 0,
      profit: -20,
      roi: -1,
    });
  }
});

test('does not overcount regrow harvests at the season edge', () => {
  const blueberry = findCropById('blueberry');
  assert.ok(blueberry);

  assert.deepEqual(calculateConservativeCropRoi(blueberry, { year: 1, season: 'summer', day: 24 }), {
    canMature: false,
    harvests: 0,
    revenue: 0,
    profit: -80,
    roi: -1,
  });
});
