import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlanDate } from './planDate.ts';

test('uses the save date as the plan date', () => {
  assert.deepEqual(calculatePlanDate({ year: 1, season: 'spring', day: 14 }), {
    year: 1,
    season: 'spring',
    day: 14,
    sourceSaveDate: { year: 1, season: 'spring', day: 14 },
  });
});

test('keeps season day 28 on the same save date', () => {
  assert.deepEqual(calculatePlanDate({ year: 1, season: 'summer', day: 28 }), {
    year: 1,
    season: 'summer',
    day: 28,
    sourceSaveDate: { year: 1, season: 'summer', day: 28 },
  });
});

test('keeps winter day 28 on the same save date', () => {
  assert.deepEqual(calculatePlanDate({ year: 2, season: 'winter', day: 28 }), {
    year: 2,
    season: 'winter',
    day: 28,
    sourceSaveDate: { year: 2, season: 'winter', day: 28 },
  });
});
