import test from 'node:test';
import assert from 'node:assert/strict';
import { importBrowserSaveFile, importPickedSaveFile } from './saveFileImportService.ts';

test('imports a browser File-like save file', async () => {
  const file = {
    name: 'Farmer_123456',
    lastModified: new Date('2026-06-18T00:00:00.000Z').getTime(),
    text: async () => `
      <SaveGame>
        <uniqueIDForThisGame>123456</uniqueIDForThisGame>
        <year>1</year>
        <currentSeason>summer</currentSeason>
        <dayOfMonth>14</dayOfMonth>
        <player>
          <name>Farmer</name>
          <farmName>Sunrise Farm</farmName>
        </player>
      </SaveGame>
    `,
  };

  const imported = await importBrowserSaveFile(file);

  assert.equal(imported.entry.id, '123456');
  assert.equal(imported.entry.name, 'Sunrise Farm');
  assert.equal(imported.snapshot.time.day, 14);
});

test('imports a desktop picked save file using its path', () => {
  const imported = importPickedSaveFile({
    path: '/Users/player/.config/StardewValley/Saves/Farmer_123456/Farmer_123456',
    modifiedAt: new Date('2026-06-18T00:00:00.000Z'),
    xml: `
      <SaveGame>
        <uniqueIDForThisGame>123456</uniqueIDForThisGame>
        <year>1</year>
        <currentSeason>summer</currentSeason>
        <dayOfMonth>14</dayOfMonth>
        <player>
          <name>Farmer</name>
          <farmName>Sunrise Farm</farmName>
        </player>
      </SaveGame>
    `,
  });

  assert.equal(imported.entry.id, '123456');
  assert.equal(imported.snapshot.saveIdentity.filePath, '/Users/player/.config/StardewValley/Saves/Farmer_123456/Farmer_123456');
});
