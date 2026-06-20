import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMUNITY_CENTER_BUNDLES } from '../stardew/data/communityCenter.ts';
import { getItemIconPath } from './itemIcons.ts';

test('returns a packaged item icon path for known gift items', () => {
  assert.equal(getItemIconPath(66), './item-icons/66.png');
  assert.equal(getItemIconPath('(O)72'), './item-icons/72.png');
  assert.equal(getItemIconPath(80), './item-icons/80.png');
});

test('returns undefined when no packaged icon is known', () => {
  assert.equal(getItemIconPath('UnknownModItem'), undefined);
});

test('has packaged item icons for community center deliverables', () => {
  const missingIds = [...new Set(
    COMMUNITY_CENTER_BUNDLES
      .flatMap((room) => room.bundles)
      .flatMap((bundle) => bundle.requirements)
      .map((requirement) => requirement.itemId),
  )].filter((id) => getItemIconPath(id) === undefined);

  assert.deepEqual(missingIds, []);
});
