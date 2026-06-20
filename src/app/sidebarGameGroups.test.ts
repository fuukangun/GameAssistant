import test from 'node:test';
import assert from 'node:assert/strict';
import { createSidebarGameGroups } from './sidebarGameGroups.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';

const saves: SaveEntry[] = [
  {
    id: 'save-1',
    name: 'Forest Farm',
    path: '/tmp/ForestFarm',
    lastModified: '2026-06-20T08:00:00.000Z',
    parseStatus: 'ok',
  },
  {
    id: 'save-2',
    name: 'River Farm',
    path: '/tmp/RiverFarm',
    lastModified: '2026-06-20T09:00:00.000Z',
    parseStatus: 'ok',
  },
];

test('creates only the Stardew Valley sidebar group for the current MVP', () => {
  const groups = createSidebarGameGroups(saves, 'zh-CN');

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.id, 'stardew-valley');
  assert.equal(groups[0]?.name, '星露谷物语');
  assert.equal(groups[0]?.iconPath, './game-icons/stardew-valley.png');
  assert.equal(groups[0]?.saveCountLabel, '已识别存档 2');
  assert.deepEqual(groups[0]?.saves, saves);
});
