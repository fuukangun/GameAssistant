import type { StardewSaveSnapshot } from '../shared/types.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';
import { demoSnapshot, winterEveSnapshot } from '../stardew/fixtures/demoSnapshot.ts';

export interface InitialAppData {
  saves: SaveEntry[];
  snapshotsBySaveId: Record<string, StardewSaveSnapshot>;
  initialSnapshot: StardewSaveSnapshot;
}

const demoSaves: Array<{ entry: SaveEntry; snapshot: StardewSaveSnapshot }> = [
  {
    entry: {
      id: 'demo-save',
      name: demoSnapshot.farm.farmName,
      path: demoSnapshot.saveIdentity.filePath,
      lastModified: demoSnapshot.saveIdentity.fileModifiedAt,
      parseStatus: demoSnapshot.parseMeta.status,
    },
    snapshot: demoSnapshot,
  },
  {
    entry: {
      id: 'winter-eve-demo',
      name: winterEveSnapshot.farm.farmName,
      path: winterEveSnapshot.saveIdentity.filePath,
      lastModified: winterEveSnapshot.saveIdentity.fileModifiedAt,
      parseStatus: winterEveSnapshot.parseMeta.status,
    },
    snapshot: winterEveSnapshot,
  },
];

export function createInitialAppData(isDesktopRuntime: boolean): InitialAppData {
  if (isDesktopRuntime) {
    return {
      saves: [],
      snapshotsBySaveId: {},
      initialSnapshot: demoSnapshot,
    };
  }

  return {
    saves: demoSaves.map((item) => item.entry),
    snapshotsBySaveId: Object.fromEntries(demoSaves.map((item) => [item.entry.id, item.snapshot])),
    initialSnapshot: demoSnapshot,
  };
}
