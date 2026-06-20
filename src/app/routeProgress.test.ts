import test from 'node:test';
import assert from 'node:assert/strict';
import type { StardewSaveSnapshot } from '../shared/types.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createRouteProgressSummary } from './routeProgress.ts';

test('summarizes community center route progress', () => {
  const summary = createRouteProgressSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'community_center',
    },
    progression: {
      ...demoSnapshot.progression,
      communityCenter: { completed: false, percentage: 68 },
    },
  } satisfies StardewSaveSnapshot, 'zh-CN');

  assert.equal(summary.branchLabel, '社区中心分支');
  assert.equal(summary.percent, 68);
});

test('summarizes joja route progress from purchased projects', () => {
  const summary = createRouteProgressSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'joja',
    },
    progression: {
      ...demoSnapshot.progression,
      joja: { completedProjects: 2, totalProjects: 5 },
    },
  } satisfies StardewSaveSnapshot, 'zh-CN');

  assert.equal(summary.branchLabel, 'Joja分支');
  assert.equal(summary.percent, 40);
});

test('summarizes unknown route as zero progress', () => {
  const summary = createRouteProgressSummary({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'unknown',
    },
    progression: {},
  } satisfies StardewSaveSnapshot, 'zh-CN');

  assert.equal(summary.branchLabel, '未确认');
  assert.equal(summary.percent, 0);
});
