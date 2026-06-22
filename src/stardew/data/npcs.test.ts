import test from 'node:test';
import assert from 'node:assert/strict';
import { getItemNameById } from './items.ts';
import { MARRIAGE_CANDIDATE_NPCS, NPC_GIFT_PREFERENCES, SOCIAL_NPCS, UNIVERSAL_GIFT_PREFERENCES } from './npcs.ts';
import npcGiftPreferences from './npcGiftPreferences.json' with { type: 'json' };
import npcSocialData from './npcSocialData.json' with { type: 'json' };

test('loads npc gift preferences from external JSON data', () => {
  assert.deepEqual(NPC_GIFT_PREFERENCES, npcGiftPreferences);
});

test('loads npc social lists and universal gifts from external JSON data', () => {
  assert.deepEqual(SOCIAL_NPCS, npcSocialData.socialNpcs);
  assert.deepEqual(MARRIAGE_CANDIDATE_NPCS, npcSocialData.marriageCandidates);
  assert.deepEqual(UNIVERSAL_GIFT_PREFERENCES, npcSocialData.universalGiftPreferences);
});

test('has catalog names for all gift preference ids', () => {
  const missingIds = NPC_GIFT_PREFERENCES.flatMap((npc) => {
    return [
      ...npc.lovedItemIds,
      ...(npc.likedItemIds ?? []),
      ...(npc.neutralItemIds ?? []),
    ].filter((id) => getItemNameById(id) === undefined);
  });

  assert.deepEqual(missingIds, []);
});

test('includes at least five npc preference entries with liked or neutral data', () => {
  const preferenceCount = NPC_GIFT_PREFERENCES.filter((npc) => {
    return (npc.likedItemIds?.length ?? 0) > 0 || (npc.neutralItemIds?.length ?? 0) > 0;
  }).length;

  assert.ok(preferenceCount >= 5);
});

test('covers all core social npcs with gift preference data', () => {
  const npcNames = new Set(NPC_GIFT_PREFERENCES.map((preference) => preference.npc));

  assert.ok(SOCIAL_NPCS.length >= 30);
  assert.deepEqual(SOCIAL_NPCS.filter((npc) => !npcNames.has(npc)), []);
});

test('covers all marriage candidates with at least one loved gift', () => {
  const preferences = new Map(NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, preference]));
  const missingLoved = MARRIAGE_CANDIDATE_NPCS.filter((npc) => {
    const preference = preferences.get(npc);
    return !preference || preference.lovedItemIds.length + preference.lovedItemNames.length === 0;
  });

  assert.deepEqual(missingLoved, []);
});

test('has universal gift preferences for fallback matching', () => {
  assert.ok(UNIVERSAL_GIFT_PREFERENCES.lovedItemIds.length > 0);
  assert.ok((UNIVERSAL_GIFT_PREFERENCES.likedItemIds ?? []).length > 0);
});

test('keeps universal loved exceptions out of npc loved gift preferences', () => {
  const preferences = new Map(NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, preference]));

  assert.equal(preferences.get('Haley')?.lovedItemIds.includes(74), false);
  assert.equal(preferences.get('Haley')?.lovedItemNames.includes('五彩碎片'), false);
  assert.ok(preferences.get('Haley')?.hatedItemIds?.includes(74));
  assert.ok(preferences.get('Haley')?.hatedItemNames?.includes('五彩碎片'));

  assert.equal(preferences.get('Penny')?.lovedItemIds.includes(446), false);
  assert.equal(preferences.get('Penny')?.lovedItemNames.includes('兔脚'), false);
  assert.ok(preferences.get('Penny')?.hatedItemIds?.includes(446));
  assert.ok(preferences.get('Penny')?.hatedItemNames?.includes('兔脚'));
});

test('uses wiki-specific quartz preference for Sebastian', () => {
  const sebastian = NPC_GIFT_PREFERENCES.find((preference) => preference.npc === 'Sebastian');

  assert.equal(sebastian?.likedItemIds?.includes(80), true);
  assert.equal(sebastian?.likedItemNames?.includes('Quartz'), true);
  assert.equal(sebastian?.dislikedItemIds?.includes(80), false);
  assert.equal(sebastian?.dislikedItemNames?.includes('石英'), false);
});

test('uses original Stardew item id 80 for quartz gift preferences', () => {
  const allGiftIds = NPC_GIFT_PREFERENCES.flatMap((npc) => [
    ...npc.lovedItemIds,
    ...(npc.likedItemIds ?? []),
    ...(npc.neutralItemIds ?? []),
  ]).map(String);

  assert.ok(allGiftIds.includes('80'));
  assert.equal(allGiftIds.includes('580'), false);
});

test('does not include suspicious duplicate item ids for the same catalog gift name', () => {
  const allowedSameNameIds = new Map<string, string[]>([
    ['晶球', ['517', '535']],
    ['鲑鱼晚餐', ['212', '296']],
  ]);
  const allGiftIds = new Set(NPC_GIFT_PREFERENCES.flatMap((npc) => [
    ...npc.lovedItemIds,
    ...(npc.likedItemIds ?? []),
    ...(npc.neutralItemIds ?? []),
  ]).map(String));
  const idsByCatalogName = new Map<string, string[]>();

  for (const id of allGiftIds) {
    const name = getItemNameById(id);
    if (!name) {
      continue;
    }

    idsByCatalogName.set(name, [...(idsByCatalogName.get(name) ?? []), id]);
  }

  assert.deepEqual(
    [...idsByCatalogName.entries()].filter(([name, ids]) => {
      const allowedIds = allowedSameNameIds.get(name);
      return ids.length > 1 && ids.join(',') !== allowedIds?.join(',');
    }),
    [],
  );
});

test('uses original Stardew item id 651 for poppyseed muffin gift preferences', () => {
  const poppyseedMuffinGiftIds = new Set(NPC_GIFT_PREFERENCES.flatMap((npc) => [
    ...npc.lovedItemIds,
    ...(npc.likedItemIds ?? []),
    ...(npc.neutralItemIds ?? []),
  ]).filter((id) => getItemNameById(id) === '虞美人籽松糕').map(String));

  assert.deepEqual([...poppyseedMuffinGiftIds], ['651']);
});

test('keeps known Stardew item ids aligned with gift preference names', () => {
  assert.equal(getItemNameById(240), '农夫午餐');
  assert.equal(getItemNameById(288), '超级炸弹');

  const preferences = new Map(NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, preference]));

  assert.equal(preferences.get('Alex')?.lovedItemIds.includes(288), false);
  assert.equal(preferences.get('Alex')?.lovedItemNames.includes('巨无霸餐'), false);
  assert.equal(preferences.get('Sam')?.lovedItemIds.includes(288), false);
  assert.equal(preferences.get('Sam')?.lovedItemNames.includes('巨无霸餐'), false);
  assert.ok(preferences.get('George')?.lovedItemIds.includes(205));
  assert.equal(preferences.get('George')?.lovedItemIds.includes(240), false);
  assert.ok(preferences.get('Marnie')?.lovedItemIds.includes(240));
  assert.ok(preferences.get('Marnie')?.lovedItemNames.includes("Farmer's Lunch"));
});

test('includes expanded loved gifts from the Stardew Valley Wiki table', () => {
  const preferences = new Map(NPC_GIFT_PREFERENCES.map((preference) => [preference.npc, preference]));

  assert.ok(preferences.get('Alex')?.lovedItemNames.includes('Complete Breakfast'));
  assert.ok(preferences.get('Emily')?.lovedItemNames.includes('Wool'));
  assert.ok(preferences.get('Caroline')?.lovedItemNames.includes('Green Tea'));
  assert.ok(preferences.get('Willy')?.lovedItemNames.includes('Pumpkin'));
});
