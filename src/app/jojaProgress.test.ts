import test from 'node:test';
import assert from 'node:assert/strict';
import type { StardewSaveSnapshot } from '../shared/types.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createJojaProgress } from './jojaProgress.ts';

test('builds joja project progress from completed markers', () => {
  const projects = createJojaProgress({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'joja',
    },
    progression: {
      joja: {
        completedProjects: 2,
        totalProjects: 5,
        completedMarkers: ['jojaBoilerRoom', 'jojaVault'],
      },
    },
  } satisfies StardewSaveSnapshot);

  assert.equal(projects.length, 5);
  assert.deepEqual(
    projects.filter((project) => project.completed).map((project) => project.id),
    ['minecarts', 'bus'],
  );
  assert.deepEqual(
    projects.filter((project) => !project.completed).map((project) => project.id),
    ['panning', 'bridge', 'greenhouse'],
  );
});

test('builds joja project progress from completed count when markers are unavailable', () => {
  const projects = createJojaProgress({
    ...demoSnapshot,
    farm: {
      ...demoSnapshot.farm,
      communityCenterRoute: 'joja',
    },
    progression: {
      joja: {
        completedProjects: 1,
        totalProjects: 5,
      },
    },
  } satisfies StardewSaveSnapshot);

  assert.deepEqual(
    projects.map((project) => [project.id, project.completed]),
    [
      ['minecarts', true],
      ['panning', false],
      ['bridge', false],
      ['greenhouse', false],
      ['bus', false],
    ],
  );
});
