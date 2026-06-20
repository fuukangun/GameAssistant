import test from 'node:test';
import assert from 'node:assert/strict';
import { pickTauriSaveFile } from './tauriSaveFilePicker.ts';

test('picks a Stardew save folder and imports its main save file through Tauri', async () => {
  const imported = await pickTauriSaveFile({
    openDialog: async (options) => {
      assert.deepEqual(options, {
        multiple: false,
        directory: true,
      });
      return '/Users/player/Desktop/saving/Ammar_333191697';
    },
    invoke: async (command, args) => {
      assert.equal(command, 'read_save_file');
      assert.deepEqual(args, { savePath: '/Users/player/Desktop/saving/Ammar_333191697' });
      return {
        fileName: 'Ammar_333191697',
        filePath: '/Users/player/Desktop/saving/Ammar_333191697/Ammar_333191697',
        modifiedAt: '2026-06-20T00:00:00.000Z',
        xml: `
          <SaveGame>
            <uniqueIDForThisGame>333191697</uniqueIDForThisGame>
            <year>1</year>
            <currentSeason>spring</currentSeason>
            <dayOfMonth>1</dayOfMonth>
            <player>
              <name>Ammar</name>
              <farmName>Test Farm</farmName>
            </player>
          </SaveGame>
        `,
      };
    },
  });

  assert.equal(imported?.saveDirectoryPath, '/Users/player/Desktop/saving/Ammar_333191697');
  assert.equal(imported?.imported.entry.id, '333191697');
  assert.equal(imported?.imported.snapshot.saveIdentity.filePath, '/Users/player/Desktop/saving/Ammar_333191697/Ammar_333191697');
});

test('returns undefined when folder picking is cancelled', async () => {
  const imported = await pickTauriSaveFile({
    openDialog: async () => undefined,
    invoke: async () => {
      throw new Error('invoke should not be called');
    },
  });

  assert.equal(imported, undefined);
});
