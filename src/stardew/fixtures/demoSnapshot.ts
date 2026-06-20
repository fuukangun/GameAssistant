import type { StardewSaveSnapshot } from '../../shared/types.ts';

export const demoSnapshot: StardewSaveSnapshot = {
  saveIdentity: {
    uniqueId: 'demo-save',
    filePath: '/demo/Sunrise_123',
    fileModifiedAt: new Date().toISOString(),
  },
  parseMeta: {
    status: 'ok',
    parserVersion: '0.1.0',
    warnings: [],
  },
  farm: {
    farmName: 'Sunrise Farm',
    playerName: 'Farmer',
    farmType: 'standard',
    hasDesertAccess: false,
    mineLevel: 20,
    communityCenterRoute: 'community_center',
  },
  player: {
    maxEnergy: 270,
    maxItems: 36,
    equipment: {
      ringNames: [],
    },
  },
  time: {
    year: 1,
    season: 'summer',
    day: 15,
  },
  weatherForTomorrow: 'sunny',
  wallet: {
    money: 23500,
  },
  skills: {
    farming: 6,
    mining: 4,
    foraging: 5,
    fishing: 3,
    combat: 2,
  },
  inventory: [{ id: 66, name: '紫水晶', stack: 1 }],
  crops: [{ id: 258, name: '蓝莓', isReady: true, quantity: 12, sellPrice: 50 }],
  readyMachineOutputs: [],
  animalProducts: [],
  animalFeed: { animalCount: 0 },
  progression: {
    communityCenter: {
      completed: false,
      percentage: 68,
    },
  },
  relationships: [
    { npc: 'Sebastian', points: 1000, hearts: 4, giftsThisWeek: 1, talkedToday: false },
  ],
};

export const winterEveSnapshot: StardewSaveSnapshot = {
  saveIdentity: {
    uniqueId: 'winter-eve-demo',
    filePath: '/demo/WinterEve_456',
    fileModifiedAt: new Date('2026-06-18T00:00:00.000Z').toISOString(),
  },
  parseMeta: {
    status: 'ok',
    parserVersion: '0.2.0',
    warnings: [],
  },
  farm: {
    farmName: '雪岭农场',
    playerName: 'Lin',
    farmType: 'forest',
    hasDesertAccess: true,
    mineLevel: 85,
    communityCenterRoute: 'community_center',
  },
  player: {
    maxEnergy: 338,
    maxItems: 36,
    equipment: {
      ringNames: [],
    },
  },
  time: {
    year: 1,
    season: 'winter',
    day: 28,
  },
  weatherForTomorrow: 'sunny',
  wallet: {
    money: 8120,
  },
  skills: {
    farming: 7,
    mining: 7,
    foraging: 6,
    fishing: 5,
    combat: 6,
  },
  inventory: [{ id: 72, name: '钻石', stack: 2 }],
  crops: [],
  readyMachineOutputs: [],
  animalProducts: [],
  animalFeed: { animalCount: 0 },
  progression: {
    communityCenter: {
      completed: false,
      percentage: 82,
    },
  },
  relationships: [],
};
