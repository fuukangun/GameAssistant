import test from 'node:test';
import assert from 'node:assert/strict';
import { importSaveFileContent } from './importSaveFile.ts';

test('imports a save XML file into a save entry and parsed snapshot', () => {
  const imported = importSaveFileContent({
    fileName: 'Farmer_123456',
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
  assert.equal(imported.entry.name, 'Sunrise Farm');
  assert.equal(imported.entry.parseStatus, 'ok');
  assert.equal(imported.snapshot.saveIdentity.filePath, 'manual://Farmer_123456');
});
