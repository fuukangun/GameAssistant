import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTime } from './formatDateTime.ts';

test('formats ISO date strings', () => {
  assert.match(formatDateTime('2026-06-18T00:00:00.000Z'), /\d/);
});

test('includes the year for save list timestamps', () => {
  assert.match(formatDateTime('2026-06-18T00:00:00.000Z'), /2026/);
});

test('formats Unix seconds returned by the Tauri backend', () => {
  assert.match(formatDateTime('1781712000'), /\d/);
});

test('falls back for invalid dates instead of throwing during render', () => {
  assert.equal(formatDateTime('not-a-date'), '时间未知');
});
