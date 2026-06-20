import type { CommunityCenterBundleState, StardewSaveSnapshot } from '../../shared/types.ts';
import { demoSnapshot } from './demoSnapshot.ts';

const communityCenterBundleKeys = [
  13, 14, 15, 16, 17,
  0, 1, 2, 3, 4,
  6, 7, 8, 9,
  20, 21, 22,
  31, 32, 33, 34,
  23, 24, 25, 26,
];

export const unknownRouteSpringOneSnapshot: StardewSaveSnapshot = {
  ...demoSnapshot,
  saveIdentity: {
    uniqueId: 'fixture-fun-spring-one',
    filePath: '/fixtures/fun_440336724/fun_440336724',
    fileModifiedAt: '2026-06-19T00:00:00.000Z',
  },
  farm: {
    ...demoSnapshot.farm,
    farmName: 'fun',
    playerName: 'fun',
    hasDesertAccess: false,
    hasIslandAccess: false,
    hasSkullCavernAccess: false,
    hasVolcanoDungeonAccess: false,
    mineLevel: 0,
    communityCenterRoute: 'unknown',
  },
  time: {
    year: 1,
    season: 'spring',
    day: 1,
  },
  inventory: [],
  progression: {
    communityCenter: {
      completed: false,
      percentage: 0,
      bundleStates: [],
    },
  },
};

export const communityCenterMidgameSnapshot: StardewSaveSnapshot = {
  ...demoSnapshot,
  saveIdentity: {
    uniqueId: 'fixture-community-center-midgame',
    filePath: '/fixtures/Mushroom_414673714/Mushroom_414673714',
    fileModifiedAt: '2026-06-19T00:00:00.000Z',
  },
  farm: {
    ...demoSnapshot.farm,
    farmName: '菌菇',
    playerName: 'Ari',
    hasDesertAccess: false,
    hasIslandAccess: false,
    hasSkullCavernAccess: false,
    hasVolcanoDungeonAccess: false,
    mineLevel: 80,
    communityCenterRoute: 'community_center',
  },
  time: {
    year: 1,
    season: 'winter',
    day: 23,
  },
  inventory: [
    { id: 388, name: '木材', stack: 198, source: 'chest', sourceLabel: '储物箱' },
    { id: 390, name: '石头', stack: 120, source: 'chest', sourceLabel: '储物箱' },
    { id: 709, name: '硬木', stack: 10, source: 'chest', sourceLabel: '储物箱' },
    { id: 24, name: '防风草', stack: 1, source: 'backpack', sourceLabel: '背包' },
  ],
  progression: {
    communityCenter: {
      completed: false,
      percentage: 27,
      bundleStates: createBundleStates({
        completed: [13, 14, 15, 16, 0, 1],
      }),
    },
  },
};

export const communityCenterCompletedSnapshot: StardewSaveSnapshot = {
  ...demoSnapshot,
  saveIdentity: {
    uniqueId: 'fixture-community-center-completed',
    filePath: '/fixtures/Vanilla_123456789/Vanilla_123456789',
    fileModifiedAt: '2026-06-19T00:00:00.000Z',
  },
  farm: {
    ...demoSnapshot.farm,
    farmName: 'Vanilla',
    playerName: 'Vanilla',
    hasDesertAccess: true,
    hasIslandAccess: true,
    hasSkullCavernAccess: true,
    hasVolcanoDungeonAccess: true,
    mineLevel: 120,
    skullCavernLevel: 272,
    communityCenterRoute: 'community_center',
  },
  time: {
    year: 6,
    season: 'winter',
    day: 14,
  },
  inventory: [
    { id: 24, name: '防风草', stack: 12, source: 'chest', sourceLabel: '储物箱' },
    { id: 388, name: '木材', stack: 500, source: 'chest', sourceLabel: '储物箱' },
  ],
  progression: {
    communityCenter: {
      completed: true,
      percentage: 100,
      bundleStates: createBundleStates({
        completed: communityCenterBundleKeys,
      }),
    },
  },
};

export const jojaCompletedSnapshot: StardewSaveSnapshot = {
  ...demoSnapshot,
  saveIdentity: {
    uniqueId: 'fixture-joja-completed',
    filePath: '/fixtures/Moja_987654321/Moja_987654321',
    fileModifiedAt: '2026-06-19T00:00:00.000Z',
  },
  farm: {
    ...demoSnapshot.farm,
    farmName: 'Moja Joja',
    playerName: 'Moja',
    hasDesertAccess: false,
    hasIslandAccess: false,
    hasSkullCavernAccess: true,
    hasVolcanoDungeonAccess: false,
    mineLevel: 120,
    skullCavernLevel: 36,
    communityCenterRoute: 'joja',
  },
  time: {
    year: 3,
    season: 'fall',
    day: 11,
  },
  inventory: [
    { id: 388, name: '木材', stack: 500, source: 'chest', sourceLabel: '储物箱' },
    { id: 390, name: '石头', stack: 500, source: 'chest', sourceLabel: '储物箱' },
  ],
  progression: {
    joja: {
      completedProjects: 5,
      totalProjects: 5,
      completedMarkers: ['ccVault', 'ccBoilerRoom', 'ccPantry', 'ccFishTank', 'ccCraftsRoom'],
    },
  },
};

function createBundleStates(options: { completed: number[] }): CommunityCenterBundleState[] {
  const completedKeys = new Set(options.completed);
  return communityCenterBundleKeys.map((key) => ({
    key,
    completed: completedKeys.has(key),
    donatedSlots: [],
  }));
}
