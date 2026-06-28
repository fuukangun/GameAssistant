import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanSavesInDirectory } from './scanSaves.ts';

test('finds save folders containing a matching main save file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'game-daily-planner-'));
  try {
    await mkdir(join(root, 'Farmer_123456'));
    await writeFile(join(root, 'Farmer_123456', 'Farmer_123456'), '<SaveGame />');

    const saves = await scanSavesInDirectory(root);

    assert.equal(saves.length, 1);
    assert.equal(saves[0].id, 'Farmer_123456');
    assert.equal(saves[0].name, 'Farmer');
    assert.equal(saves[0].parseStatus, 'partial');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('reads farm and player names from the main save file while scanning', async () => {
  const root = await mkdtemp(join(tmpdir(), 'game-daily-planner-'));
  try {
    await mkdir(join(root, 'Arkon_123456'));
    await writeFile(join(root, 'Arkon_123456', 'Arkon_123456'), `
      <SaveGame>
        <player>
          <name>Arkon</name>
          <farmName>Vanilla</farmName>
        </player>
      </SaveGame>
    `);

    const saves = await scanSavesInDirectory(root);

    assert.equal(saves.length, 1);
    assert.equal(saves[0].name, 'Vanilla');
    assert.equal(saves[0].playerName, 'Arkon');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('uses the main save file modified time while scanning', async () => {
  const root = await mkdtemp(join(tmpdir(), 'game-daily-planner-'));
  try {
    const saveFolder = join(root, 'Farmer_123456');
    const saveFile = join(saveFolder, 'Farmer_123456');
    await mkdir(saveFolder);
    await writeFile(saveFile, '<SaveGame />');
    const folderTime = new Date('2026-06-18T00:00:00.000Z');
    const fileTime = new Date('2026-06-19T00:00:00.000Z');
    await utimes(saveFile, fileTime, fileTime);
    await utimes(saveFolder, folderTime, folderTime);

    const saves = await scanSavesInDirectory(root);

    assert.equal(saves[0].lastModified, fileTime.toISOString());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('finds save folders containing SaveGameInfo when the main file is absent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'game-daily-planner-'));
  try {
    await mkdir(join(root, 'Rancher_999'));
    await writeFile(join(root, 'Rancher_999', 'SaveGameInfo'), '<Farmer />');

    const saves = await scanSavesInDirectory(root);

    assert.equal(saves.length, 1);
    assert.equal(saves[0].id, 'Rancher_999');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ignores unrelated folders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'game-daily-planner-'));
  try {
    await mkdir(join(root, 'not-a-save'));
    await writeFile(join(root, 'not-a-save', 'notes.txt'), 'hello');

    const saves = await scanSavesInDirectory(root);

    assert.deepEqual(saves, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
