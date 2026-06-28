import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSavePlayerName } from './saveListDisplay.ts';

test('infers player name from scanned save folder before snapshot is loaded', () => {
  assert.equal(formatSavePlayerName({
    id: 'Poison_456',
    name: 'Poison',
    path: '/Users/player/Stardew/Saves/Poison_456',
    lastModified: '2026-06-18T02:00:00.000Z',
    parseStatus: 'partial',
    source: 'scanned',
  }, undefined, 'zh-CN'), 'Poison');
});

test('uses scanned player name before snapshot is loaded', () => {
  assert.equal(formatSavePlayerName({
    id: 'Arkon_123456',
    name: 'Vanilla',
    playerName: 'Arkon',
    path: '/Users/player/Stardew/Saves/Vanilla',
    lastModified: '2026-06-18T02:00:00.000Z',
    parseStatus: 'partial',
    source: 'scanned',
  }, undefined, 'zh-CN'), 'Arkon');
});

test('infers player name from manually imported save file path before snapshot is loaded', () => {
  assert.equal(formatSavePlayerName({
    id: 'manual:/Users/player/Desktop/saving/Table_123/Table_123',
    name: 'Table Farm',
    path: '/Users/player/Desktop/saving/Table_123/Table_123',
    lastModified: '2026-06-18T02:00:00.000Z',
    parseStatus: 'partial',
    source: 'manual',
  }, undefined, 'zh-CN'), 'Table');
});
