import test from 'node:test';
import assert from 'node:assert/strict';
import type { ImportedSaveFile } from '../stardew/saves/importSaveFile.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';
import { mergeImportedSaveForScannedEntry } from './saveImportMerge.ts';

const scannedSave: SaveEntry = {
  id: 'Farmer_123456',
  name: 'Farmer',
  path: '/tmp/Saves/Farmer_123456',
  lastModified: '1781712000',
  parseStatus: 'partial',
};

const importedSave: ImportedSaveFile = {
  entry: {
    id: '123456',
    name: 'Sunrise Farm',
    path: '/tmp/Saves/Farmer_123456/Farmer_123456',
    lastModified: '2026-06-18T00:00:00.000Z',
    parseStatus: 'ok',
  },
  snapshot: {
    saveIdentity: {
      uniqueId: '123456',
      filePath: '/tmp/Saves/Farmer_123456/Farmer_123456',
      fileModifiedAt: '2026-06-18T00:00:00.000Z',
    },
    parseMeta: {
      status: 'ok',
      parserVersion: '0.2.0',
      warnings: [],
    },
    farm: {
      farmName: 'Sunrise Farm',
      playerName: 'Farmer',
      farmType: 'standard',
      hasDesertAccess: false,
      mineLevel: 0,
      communityCenterRoute: 'unknown',
    },
    player: {
      maxEnergy: 0,
      maxItems: 0,
      equipment: {
        ringNames: [],
      },
    },
    time: {
      year: 1,
      season: 'spring',
      day: 1,
    },
    wallet: {
      money: 0,
    },
    skills: {
      farming: 0,
      mining: 0,
      foraging: 0,
      fishing: 0,
      combat: 0,
    },
    inventory: [],
    crops: [],
    readyMachineOutputs: [],
    animalProducts: [],
    animalFeed: { animalCount: 0 },
    progression: {
      communityCenter: {
        completed: false,
        percentage: 0,
      },
    },
    relationships: [],
  },
};

test('keeps scanned id and folder path when parsed content comes from a scanned save', () => {
  const merged = mergeImportedSaveForScannedEntry(importedSave, scannedSave);

  assert.equal(merged.entry.id, 'Farmer_123456');
  assert.equal(merged.entry.path, '/tmp/Saves/Farmer_123456');
  assert.equal(merged.entry.name, 'Sunrise Farm');
  assert.equal(merged.entry.parseStatus, 'ok');
  assert.equal(merged.snapshotKey, 'Farmer_123456');
});

test('keeps imported identity for manual imports without a scanned entry', () => {
  const merged = mergeImportedSaveForScannedEntry(importedSave);

  assert.equal(merged.entry.id, '123456');
  assert.equal(merged.entry.path, '/tmp/Saves/Farmer_123456/Farmer_123456');
  assert.equal(merged.snapshotKey, '123456');
});
