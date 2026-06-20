import test from 'node:test';
import assert from 'node:assert/strict';
import { getSaveNoteKey } from './saveIdentity.ts';
import type { SaveIdentity } from '../../shared/types.ts';

test('uses unique save id as the preferred note key', () => {
  const identity: SaveIdentity = {
    uniqueId: '123456',
    filePath: '/tmp/Farmer_123456',
    fileModifiedAt: '2026-06-18T00:00:00.000Z',
  };

  assert.equal(getSaveNoteKey(identity), '123456');
});

test('falls back to file path when unique save id is missing', () => {
  const identity: SaveIdentity = {
    filePath: '/tmp/Farmer_123456',
    fileModifiedAt: '2026-06-18T00:00:00.000Z',
  };

  assert.equal(getSaveNoteKey(identity), '/tmp/Farmer_123456');
});
