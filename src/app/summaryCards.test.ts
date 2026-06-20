import test from 'node:test';
import assert from 'node:assert/strict';
import type { PlanDate, StardewSaveSnapshot } from '../shared/types.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createSummaryCards } from './summaryCards.ts';

const planDate: PlanDate = {
  year: 2,
  season: 'winter',
  day: 12,
  sourceSaveDate: {
    year: 2,
    season: 'winter',
    day: 12,
  },
};

test('creates compact homepage summary cards without exploration duplicates', () => {
  const cards = createSummaryCards({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      farmName: 'Vanilla',
      farmType: 'standard',
      hasDesertAccess: true,
      hasIslandAccess: false,
      hasSkullCavernAccess: true,
      hasVolcanoDungeonAccess: false,
      mineLevel: 80,
    },
    wallet: {
      ...demoSnapshot.wallet,
      money: 12345,
    },
  } satisfies StardewSaveSnapshot, planDate, 'zh-CN');

  assert.deepEqual(cards.map((card) => card.id), [
    'farm',
    'money',
    'plan-date',
  ]);
  assert.equal(cards.find((card) => card.id === 'farm')?.detail, '标准农场');
  assert.equal(cards.find((card) => card.id === 'plan-date')?.value, '第2年 冬季 第12日');
});
