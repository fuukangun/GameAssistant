import test from 'node:test';
import assert from 'node:assert/strict';
import type { StardewSaveSnapshot } from '../../shared/types.ts';
import { demoSnapshot } from '../fixtures/demoSnapshot.ts';
import {
  communityCenterCompletedSnapshot,
  communityCenterMidgameSnapshot,
  jojaCompletedSnapshot,
  unknownRouteSpringOneSnapshot,
} from '../fixtures/communityCenterSnapshots.ts';
import { COMMUNITY_CENTER_BUNDLES, createCommunityCenterSummary } from './communityCenter.ts';
import communityCenterBundles from './communityCenterBundles.json' with { type: 'json' };

test('loads community center bundles from external JSON data', () => {
  assert.deepEqual(COMMUNITY_CENTER_BUNDLES, communityCenterBundles);
});

test('lists rooms, bundle names, and required item catalog entries', () => {
  const pantry = COMMUNITY_CENTER_BUNDLES.find((room) => room.id === 'pantry');
  const springCrops = pantry?.bundles.find((bundle) => bundle.id === 'spring_crops');

  assert.equal(pantry?.name, '茶水间');
  assert.equal(springCrops?.name, '春季作物收集包');
  assert.deepEqual(
    springCrops?.requirements.map((requirement) => requirement.itemName),
    ['防风草', '青豆', '花椰菜', '土豆'],
  );
});

test('summarizes community center route and finds inventory deliverables', () => {
  const summary = createCommunityCenterSummary({
    ...demoSnapshot,
    inventory: [
      { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
      { id: 388, name: '木材', stack: 120, source: 'chest', sourceLabel: '储物箱' },
      { id: 390, name: '石头', stack: 120, source: 'chest', sourceLabel: '储物箱' },
    ],
    progression: {
      communityCenter: { completed: false, percentage: 37 },
    },
  } satisfies StardewSaveSnapshot);

  assert.equal(summary.route, 'community_center');
  assert.equal(summary.completionSource, 'summary_only');
  assert.equal(summary.shouldSuggestCommunityCenter, true);
  assert.equal(summary.overall.completed, false);
  assert.equal(summary.overall.percentage, 37);
  assert.ok(summary.rooms.length >= 5);

  const deliverableKeys = summary.deliverables.map((item) => `${item.bundleId}:${item.itemId}:${item.availableStack}`);
  assert.ok(deliverableKeys.includes('spring_crops:24:1'));
  assert.ok(deliverableKeys.includes('construction:388:120'));
  assert.ok(deliverableKeys.includes('construction:390:120'));
});

test('does not suggest deliverables for bundles already completed in save data', () => {
  const summary = createCommunityCenterSummary({
    ...demoSnapshot,
    inventory: [
      { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
      { id: 388, name: '木材', stack: 120, source: 'chest', sourceLabel: '储物箱' },
    ],
    progression: {
      communityCenter: {
        completed: false,
        percentage: 68,
        bundleStates: [
          { key: 0, completed: true, donatedSlots: [true, true, true, true] },
          { key: 17, completed: false, donatedSlots: [false, false, false, false] },
        ],
      },
    },
  } satisfies StardewSaveSnapshot);

  assert.equal(summary.rooms.flatMap((room) => room.bundles).find((bundle) => bundle.id === 'spring_crops')?.completed, true);
  assert.equal(summary.completionSource, 'save_bundle_state');
  assert.deepEqual(
    summary.deliverables.map((item) => `${item.bundleId}:${item.itemId}`),
    ['construction:388'],
  );
});

test('represents completed community center as complete without deliverable pressure', () => {
  const summary = createCommunityCenterSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'community_center',
    },
    progression: {
      communityCenter: { completed: true, percentage: 100 },
    },
    inventory: [{ id: 24, name: '防风草', stack: 1 }],
  } satisfies StardewSaveSnapshot);

  assert.equal(summary.overall.completed, true);
  assert.equal(summary.overall.percentage, 100);
  assert.equal(summary.shouldSuggestCommunityCenter, false);
  assert.deepEqual(summary.deliverables, []);
});

test('does not output strong community center suggestions for unknown or joja routes', () => {
  const unknownSummary = createCommunityCenterSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'unknown',
    },
    inventory: [{ id: 24, name: '防风草', stack: 1 }],
    progression: {},
  } satisfies StardewSaveSnapshot);

  const jojaSummary = createCommunityCenterSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'joja',
    },
    progression: {
      joja: { completedProjects: 1, totalProjects: 5 },
    },
    inventory: [{ id: 24, name: '防风草', stack: 1 }],
  } satisfies StardewSaveSnapshot);

  assert.equal(unknownSummary.shouldSuggestCommunityCenter, false);
  assert.equal(unknownSummary.status, 'route_unknown');
  assert.deepEqual(unknownSummary.deliverables, []);

  assert.equal(jojaSummary.shouldSuggestCommunityCenter, false);
  assert.equal(jojaSummary.status, 'joja_route');
  assert.deepEqual(jojaSummary.deliverables, []);
});

test('keeps a spring-one save with no route commitment as route unknown', () => {
  const summary = createCommunityCenterSummary(unknownRouteSpringOneSnapshot);

  assert.equal(summary.route, 'unknown');
  assert.equal(summary.status, 'route_unknown');
  assert.equal(summary.shouldSuggestCommunityCenter, false);
  assert.equal(summary.overall.percentage, 0);
  assert.deepEqual(summary.deliverables, []);
});

test('does not pressure community center delivery for completed or joja-route fixtures', () => {
  const completedSummary = createCommunityCenterSummary(communityCenterCompletedSnapshot);
  const jojaSummary = createCommunityCenterSummary(jojaCompletedSnapshot);

  assert.equal(completedSummary.status, 'completed');
  assert.equal(completedSummary.overall.percentage, 100);
  assert.deepEqual(completedSummary.deliverables, []);

  assert.equal(jojaSummary.status, 'joja_route');
  assert.equal(jojaSummary.shouldSuggestCommunityCenter, false);
  assert.deepEqual(jojaSummary.deliverables, []);
});

test('uses bundle state fixture data to keep completed bundles out of delivery details', () => {
  const summary = createCommunityCenterSummary(communityCenterMidgameSnapshot);
  const deliverableKeys = summary.deliverables.map((item) => `${item.bundleId}:${item.itemId}:${item.requiredStack}`);

  assert.equal(summary.status, 'active');
  assert.equal(summary.completionSource, 'save_bundle_state');
  assert.equal(summary.overall.percentage, 27);
  assert.ok(!deliverableKeys.includes('spring_crops:24:1'));
  assert.deepEqual(deliverableKeys.filter((key) => key.startsWith('construction:388:')), [
    'construction:388:99',
    'construction:388:99',
  ]);
  assert.ok(deliverableKeys.includes('construction:390:99'));
  assert.ok(deliverableKeys.includes('construction:709:10'));
});
