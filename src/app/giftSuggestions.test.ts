import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGiftOptions, buildGiftSuggestions } from './giftSuggestions.ts';

test('suggests loved gifts from inventory when weekly gift limit is not reached', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 1 },
    [
      { id: 66, name: '紫水晶', stack: 2, source: 'chest', sourceLabel: '储物箱' },
      { id: 72, name: '钻石', stack: 1 },
    ],
  );

  assert.equal(suggestions[0]?.category, '最爱');
  assert.equal(suggestions[0]?.label, '紫水晶 x2（储物箱）');
  assert.ok(suggestions.some((suggestion) => suggestion.label === '钻石 x1'));
});

test('does not suggest gifts after weekly gift limit is reached', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 2 },
    [{ id: 66, name: '紫水晶', stack: 2 }],
  );

  assert.deepEqual(suggestions, []);
});

test('suggests loved gifts for additional MVP npc preference data by id', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Abigail', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: '66', name: '紫水晶', stack: 1, source: 'backpack', sourceLabel: '背包' }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '紫水晶 x1（背包）' },
  ]);
});

test('matches loved gifts with qualified item ids', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Abigail', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: '(O)66', name: '紫水晶', stack: 1 }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '紫水晶 x1' },
  ]);
});

test('suggests liked gifts when no loved gifts are in inventory', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Abigail', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 72, name: '钻石', stack: 1, source: 'fridge', sourceLabel: '冰箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '钻石 x1（冰箱）' },
  ]);
});

test('suggests neutral gifts when only neutral inventory matches', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 24, name: '防风草', stack: 3 }],
  );

  assert.deepEqual(suggestions, [
    { category: '中立', label: '防风草 x3' },
  ]);
});

test('uses universal loved gifts when npc-specific gifts do not match', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Robin', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 74, name: '五彩碎片', stack: 1 }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '五彩碎片 x1' },
  ]);
});

test('does not suggest universal loved gifts for npc-specific hated exceptions', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Haley', points: 500, hearts: 2, giftsThisWeek: 0 },
    [
      { id: 74, name: 'Prismatic Shard', stack: 1 },
      { id: 446, name: "Rabbit's Foot", stack: 1 },
    ],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '兔脚 x1' },
  ]);
});

test('suggests wiki-specific liked quartz for Sebastian', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 80, name: 'Quartz', stack: 3 }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '石英 x3' },
  ]);
});

test('uses universal liked gifts as fallback for covered npcs', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Demetrius', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 388, name: '木材', stack: 5 }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '木材 x5' },
  ]);
});

test('matches gifts by item catalog name when save item name is English', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 66, name: 'Amethyst', stack: 1, source: 'backpack', sourceLabel: '背包' }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '紫水晶 x1（背包）' },
  ]);
});

test('matches gifts by English save name for catalog items added through aliases', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 80, name: 'Quartz', stack: 3, source: 'fridge', sourceLabel: '冰箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '石英 x3（冰箱）' },
  ]);
});

test('uses universal liked category for common catalog-backed gifts', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Robin', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 72, name: 'Diamond', stack: 1 }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '钻石 x1' },
  ]);
});

test('falls back to universal gift preferences when npc-specific data is absent', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Marlon', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 72, name: 'Diamond', stack: 1, source: 'chest', sourceLabel: '储物箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '钻石 x1（储物箱）' },
  ]);
});

test('does not overmatch broad universal liked data for npc-specific data gaps', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Marlon', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 388, name: 'Wood', stack: 50, source: 'chest', sourceLabel: '储物箱' }],
  );

  assert.deepEqual(suggestions, []);
});

test('prioritizes known item id over mismatched save item name', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Abigail', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 388, name: 'Diamond', stack: 50, source: 'chest', sourceLabel: '储物箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '中立', label: '木材 x50（储物箱）' },
  ]);
});

test('matches universal loved edge gifts from Stardew 1.6 data', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Marlon', points: 500, hearts: 2, giftsThisWeek: 0 },
    [
      { id: 'StardropTea', name: 'Stardrop Tea', stack: 1, source: 'chest', sourceLabel: '储物箱' },
      { id: 797, name: 'Pearl', stack: 1, source: 'backpack', sourceLabel: '背包' },
    ],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '星之果茶 x1（储物箱）' },
    { category: '最爱', label: '珍珠 x1（背包）' },
  ]);
});

test('matches quartz by original Stardew item id', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Maru', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 80, name: 'Quartz', stack: 3, source: 'chest', sourceLabel: '储物箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '石英 x3（储物箱）' },
  ]);
});

test('builds gift options sorted by preference tier with item source details', () => {
  const options = buildGiftOptions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 0 },
    [
      { id: 72, name: 'Diamond', stack: 1, source: 'chest', sourceLabel: '储物箱' },
      { id: 66, name: 'Amethyst', stack: 2, source: 'backpack', sourceLabel: '背包' },
      { id: 388, name: 'Wood', stack: 50, source: 'chest', sourceLabel: '储物箱' },
    ],
  );

  assert.deepEqual(options.map((option) => ({
    tier: option.tier,
    category: option.category,
    displayName: option.displayName,
    stack: option.stack,
    sourceLabel: option.sourceLabel,
  })), [
    { tier: 'loved', category: '最爱', displayName: '紫水晶', stack: 2, sourceLabel: '背包' },
    { tier: 'liked', category: '喜欢', displayName: '木材', stack: 50, sourceLabel: '储物箱' },
    { tier: 'liked', category: '喜欢', displayName: '钻石', stack: 1, sourceLabel: '储物箱' },
  ]);
});

test('suggests expanded wiki loved gifts by English save name', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 201, name: 'Complete Breakfast', stack: 1, source: 'fridge', sourceLabel: '冰箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '最爱', label: '完整早餐 x1（冰箱）' },
  ]);
});

test('matches English item names for localized preference data', () => {
  const suggestions = buildGiftSuggestions(
    { npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 0 },
    [{ id: 80, name: 'Quartz', stack: 2, source: 'chest', sourceLabel: '储物箱' }],
  );

  assert.deepEqual(suggestions, [
    { category: '喜欢', label: '石英 x2（储物箱）' },
  ]);
});
