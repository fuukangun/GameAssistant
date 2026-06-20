import test from 'node:test';
import assert from 'node:assert/strict';
import { readTauriSaveFile, scanTauriSaves } from './tauriSaveScanner.ts';

test('scans saves through an injected Tauri invoke function', async () => {
  const saves = await scanTauriSaves({
    invoke: async (command, args) => {
      assert.equal(command, 'scan_saves');
      assert.deepEqual(args, { customPath: '/tmp/Saves' });
      return [
        {
          id: 'Farmer_123456',
          name: 'Farmer',
          path: '/tmp/Saves/Farmer_123456',
          lastModified: '123',
          parseStatus: 'partial',
        },
      ];
    },
    customPath: '/tmp/Saves',
  });

  assert.equal(saves[0].id, 'Farmer_123456');
});

test('reads and imports a scanned save through an injected Tauri invoke function', async () => {
  const imported = await readTauriSaveFile({
    savePath: '/tmp/Saves/Farmer_123456',
    invoke: async (command, args) => {
      assert.equal(command, 'read_save_file');
      assert.deepEqual(args, { savePath: '/tmp/Saves/Farmer_123456' });
      return {
        fileName: 'Farmer_123456',
        filePath: '/tmp/Saves/Farmer_123456/Farmer_123456',
        modifiedAt: '2026-06-18T00:00:00.000Z',
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
      };
    },
  });

  assert.equal(imported.entry.id, '123456');
  assert.equal(imported.snapshot.saveIdentity.filePath, '/tmp/Saves/Farmer_123456/Farmer_123456');
});
