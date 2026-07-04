import { demoSnapshot } from './demoSnapshot.ts';
import type { EquipmentSummary, PlanDate, PlayerSummary, RelationshipSummary, Season, StardewSaveSnapshot } from '../../shared/types.ts';

export type CalendarSnapshotOverrides = Omit<Partial<StardewSaveSnapshot>, 'player'> & {
  player?: Partial<Omit<PlayerSummary, 'equipment'>> & {
    equipment?: Partial<EquipmentSummary>;
  };
};

export function createPlanDate(season: Season, day: number, year = 1): PlanDate {
  return {
    year,
    season,
    day,
    sourceSaveDate: { year, season, day },
  };
}

export function createCalendarSnapshot(overrides: CalendarSnapshotOverrides = {}): StardewSaveSnapshot {
  return {
    ...demoSnapshot,
    ...overrides,
    saveIdentity: {
      ...demoSnapshot.saveIdentity,
      ...overrides.saveIdentity,
    },
    parseMeta: {
      ...demoSnapshot.parseMeta,
      ...overrides.parseMeta,
    },
    farm: {
      ...demoSnapshot.farm,
      ...overrides.farm,
    },
    player: {
      ...demoSnapshot.player,
      ...overrides.player,
      equipment: {
        ...demoSnapshot.player.equipment,
        ...overrides.player?.equipment,
      },
    },
    time: {
      ...demoSnapshot.time,
      ...overrides.time,
    },
    wallet: {
      ...demoSnapshot.wallet,
      ...overrides.wallet,
    },
    skills: {
      ...demoSnapshot.skills,
      ...overrides.skills,
    },
    relationships: overrides.relationships ?? defaultCalendarRelationships(),
    inventory: overrides.inventory ?? demoSnapshot.inventory,
  };
}

function defaultCalendarRelationships(): RelationshipSummary[] {
  return [
    { npc: 'Haley', points: 0, hearts: 0, giftsThisWeek: 0 },
    { npc: 'Alex', points: 0, hearts: 0, giftsThisWeek: 0 },
    { npc: 'Sebastian', points: 0, hearts: 0, giftsThisWeek: 0 },
  ];
}
