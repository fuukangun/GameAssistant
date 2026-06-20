import test from 'node:test';
import assert from 'node:assert/strict';
import type { StardewSaveSnapshot } from '../shared/types.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createCommunityCenterProgress } from './communityCenterProgress.ts';

test('builds completed and deliverable bundle progress for the full community center view', () => {
  const progress = createCommunityCenterProgress({
    ...demoSnapshot,
    inventory: [
      { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
      { id: 388, name: '木材', stack: 120, source: 'chest', sourceLabel: '储物箱' },
    ],
    progression: {
      communityCenter: {
        completed: false,
        percentage: 40,
        bundleStates: [
          { key: 0, completed: true, donatedSlots: [true, true, true, true] },
          { key: 17, completed: false, donatedSlots: [false, false, false, false] },
        ],
      },
    },
  } satisfies StardewSaveSnapshot);

  const bundles = progress.flatMap((room) => room.bundles);
  const springCrops = bundles.find((bundle) => bundle.bundleId === 'spring_crops');
  const construction = bundles.find((bundle) => bundle.bundleId === 'construction');

  assert.equal(springCrops?.roomName, '茶水间');
  assert.equal(springCrops?.bundleName, '春季作物收集包');
  assert.equal(springCrops?.completed, true);
  assert.deepEqual(
    springCrops?.requirements.map((requirement) => ({
      itemId: requirement.itemId,
      itemName: requirement.itemName,
      requiredStack: requirement.requiredStack,
      availableStack: requirement.availableStack,
      deliverable: requirement.deliverable,
      completed: requirement.completed,
    })),
    [
      { itemId: 24, itemName: '防风草', requiredStack: 1, availableStack: 1, deliverable: false, completed: true },
      { itemId: 188, itemName: '青豆', requiredStack: 1, availableStack: 0, deliverable: false, completed: true },
      { itemId: 190, itemName: '花椰菜', requiredStack: 1, availableStack: 0, deliverable: false, completed: true },
      { itemId: 192, itemName: '土豆', requiredStack: 1, availableStack: 0, deliverable: false, completed: true },
    ],
  );

  const woodRequirements = construction?.requirements.filter((requirement) => requirement.itemId === 388);

  assert.equal(construction?.roomName, '工艺室');
  assert.equal(construction?.bundleName, '建筑收集包');
  assert.equal(construction?.completed, false);
  assert.equal(woodRequirements?.[0]?.requiredStack, 99);
  assert.equal(woodRequirements?.[0]?.availableStack, 120);
  assert.equal(woodRequirements?.[0]?.deliverable, true);
});
