import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
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
