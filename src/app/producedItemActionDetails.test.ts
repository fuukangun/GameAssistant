import test from 'node:test';
import assert from 'node:assert/strict';
import { groupProducedItemsBySource, shouldShowProducedItemDetailButton } from './producedItemActionDetails.ts';

test('shows produced item detail button only for long summaries', () => {
  assert.equal(shouldShowProducedItemDetailButton(undefined), false);
  assert.equal(shouldShowProducedItemDetailButton([
    { itemId: 724, itemName: '枫糖浆', quantity: 1 },
    { itemId: 725, itemName: '橡树树脂', quantity: 1 },
    { itemId: 726, itemName: '松焦油', quantity: 1 },
  ]), false);
  assert.equal(shouldShowProducedItemDetailButton([
    { itemId: 724, itemName: '枫糖浆', quantity: 1 },
    { itemId: 725, itemName: '橡树树脂', quantity: 1 },
    { itemId: 726, itemName: '松焦油', quantity: 1 },
    { itemId: 348, itemName: '果酒', quantity: 1 },
  ]), true);
});

test('groups produced item details by source while preserving item order', () => {
  const groups = groupProducedItemsBySource([
    { itemId: 724, itemName: '枫糖浆', quantity: 1, sourceName: '树液采集器' },
    { itemId: 725, itemName: '橡树树脂', quantity: 1, sourceName: '树液采集器' },
    { itemId: 725, itemName: 'Oak Resin', quantity: 2, sourceName: '树液采集器' },
    { itemId: 348, itemName: '果酒', quantity: 2, sourceName: '小桶' },
    { itemId: 348, itemName: 'Wine', quantity: 1, sourceName: '小桶' },
    { itemId: 726, itemName: '松焦油', quantity: 1 },
  ]);

  assert.deepEqual(groups, [
    {
      key: '树液采集器',
      sourceName: '树液采集器',
      items: [
        { itemId: 724, itemName: '枫糖浆', quantity: 1, sourceName: '树液采集器' },
        { itemId: 725, itemName: '橡树树脂', quantity: 3, sourceName: '树液采集器' },
      ],
    },
    {
      key: '小桶',
      sourceName: '小桶',
      items: [
        { itemId: 348, itemName: '果酒', quantity: 3, sourceName: '小桶' },
      ],
    },
    {
      key: 'unknown',
      sourceName: undefined,
      items: [
        { itemId: 726, itemName: '松焦油', quantity: 1 },
      ],
    },
  ]);
});
