import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { COMMUNITY_CENTER_BUNDLES } from '../stardew/data/communityCenter.ts';
import { ITEM_CATALOG } from '../stardew/data/items.ts';
import { NPC_GIFT_PREFERENCES, UNIVERSAL_GIFT_PREFERENCES } from '../stardew/data/npcs.ts';
import { getItemIconPath } from './itemIcons.ts';

test('returns a packaged item icon path for known gift items', () => {
  assert.equal(getItemIconPath(66), './item-icons/66.png');
  assert.equal(getItemIconPath('(O)72'), './item-icons/72.png');
  assert.equal(getItemIconPath(80), './item-icons/80.png');
  assert.equal(getItemIconPath(725), './item-icons/725.png');
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

test('has packaged item icons for produced item details shown in recommendations', () => {
  // Built from local real-save produced item details so the detail modal never falls back to letters.
  const producedItemIds = [
    60,
    62,
    64,
    70,
    72,
    74,
    82,
    84,
    86,
    107,
    167,
    168,
    169,
    174,
    176,
    180,
    182,
    184,
    186,
    257,
    281,
    289,
    305,
    306,
    307,
    308,
    336,
    340,
    344,
    348,
    350,
    372,
    386,
    395,
    404,
    420,
    424,
    426,
    428,
    430,
    432,
    436,
    438,
    440,
    442,
    444,
    445,
    446,
    447,
    562,
    567,
    614,
    685,
    715,
    716,
    717,
    718,
    719,
    720,
    721,
    722,
    723,
    724,
    725,
    726,
    787,
    807,
    915,
    928,
  ];

  const missingIds = producedItemIds.filter((id) => {
    const iconPath = getItemIconPath(id);
    return iconPath === undefined || !existsSync(`public/item-icons/${id}.png`);
  });

  assert.deepEqual(missingIds, []);
});

test('has packaged item icons for gift suggestion candidates', () => {
  const giftIds = new Set([
    ...UNIVERSAL_GIFT_PREFERENCES.lovedItemIds,
    ...(UNIVERSAL_GIFT_PREFERENCES.likedItemIds ?? []),
    ...(UNIVERSAL_GIFT_PREFERENCES.neutralItemIds ?? []),
  ]);

  for (const preference of NPC_GIFT_PREFERENCES) {
    for (const id of preference.lovedItemIds) {
      giftIds.add(id);
    }
    for (const id of preference.likedItemIds ?? []) {
      giftIds.add(id);
    }
    for (const id of preference.neutralItemIds ?? []) {
      giftIds.add(id);
    }
  }

  const missingIds = [...giftIds]
    .map(String)
    .filter((id) => {
      const iconPath = getItemIconPath(id);
      return iconPath === undefined || !existsSync(`public/item-icons/${id}.png`);
    })
    .sort((left, right) => Number(left) - Number(right));

  assert.deepEqual(missingIds, []);
});

test('has packaged item icons for every known catalog item', () => {
  const nonRenderableCatalogIconIds = new Set([
    // Clothing shirt ids do not have standalone object icons on the Stardew Valley Wiki.
    '1020',
  ]);
  const missingIds = ITEM_CATALOG
    .map((item) => String(item.id))
    .filter((id) => !nonRenderableCatalogIconIds.has(id))
    .filter((id) => {
      const iconPath = getItemIconPath(id);
      return iconPath === undefined || !existsSync(`public/item-icons/${id}.png`);
    });

  assert.deepEqual(missingIds, []);
});
