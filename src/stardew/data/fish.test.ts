import test from 'node:test';
import assert from 'node:assert/strict';
import { FISH_CATALOG, findAvailableFishForDay } from './fish.ts';
import fishCatalog from './fishCatalog.json' with { type: 'json' };

test('loads fish catalog from external JSON data', () => {
  assert.deepEqual(FISH_CATALOG, fishCatalog);
});

test('returns supported fish available on spring rainy days', () => {
  const fish = findAvailableFishForDay({
    date: { year: 1, season: 'spring', day: 5 },
    weather: 'rainy',
  });

  assert.ok(fish.some((item) => item.name === '鲶鱼'));
  assert.ok(fish.some((item) => item.name === '鳗鱼'));
  assert.ok(fish.some((item) => item.name === '沙丁鱼'));
  assert.ok(fish.some((item) => item.name === '鲈鱼'));
});

test('does not return rain-only fish on sunny days', () => {
  const fish = findAvailableFishForDay({
    date: { year: 1, season: 'spring', day: 5 },
    weather: 'sunny',
  });

  assert.ok(fish.some((item) => item.name === '沙丁鱼'));
  assert.ok(fish.some((item) => item.name === '鲈鱼'));
  assert.equal(fish.some((item) => item.name === '鲶鱼'), false);
});

test('does not return fall-only rainy fish outside supported seasons', () => {
  const fish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'rainy',
  });

  assert.equal(fish.some((item) => item.name === '大眼鱼'), false);
});

test('covers the encyclopedia fish catalog categories', () => {
  assert.ok(FISH_CATALOG.length >= 50);
  assert.ok(FISH_CATALOG.some((fish) => fish.category === 'legendary' && fish.name === '传说之鱼'));
  assert.ok(FISH_CATALOG.some((fish) => fish.category === 'crab_pot' && fish.name === '龙虾'));
  assert.ok(FISH_CATALOG.some((fish) => fish.category === 'night_market' && fish.name === '午夜鱿鱼'));
});

test('returns summer sunny ocean fish from the expanded catalog', () => {
  const fish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
  });

  assert.ok(fish.some((item) => item.name === '金枪鱼'));
  assert.ok(fish.some((item) => item.name === '红鲻鱼'));
  assert.equal(fish.some((item) => item.name === '鲶鱼'), false);
});

test('filters fish behind locked desert and ginger island access', () => {
  const lockedFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { desert: false, island: false },
  });

  assert.equal(lockedFish.some((item) => item.name === '沙鱼'), false);
  assert.equal(lockedFish.some((item) => item.name === '黄貂鱼'), false);

  const unlockedFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { desert: true, island: true },
  });

  assert.equal(unlockedFish.some((item) => item.name === '沙鱼'), true);
  assert.equal(unlockedFish.some((item) => item.name === '黄貂鱼'), true);
});

test('keeps mine and island fish available only when access is represented', () => {
  const lockedFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { desert: false, island: false, sewer: false, secretWoods: false, mineLevel: 20 },
  });

  assert.equal(lockedFish.some((item) => item.name === '石鱼'), true);
  assert.equal(lockedFish.some((item) => item.name === '黄貂鱼'), false);

  const unlockedFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { desert: false, island: true, sewer: false, secretWoods: false },
  });

  assert.equal(unlockedFish.some((item) => item.name === '黄貂鱼'), true);
});

test('filters mine fish by reached mine level', () => {
  const earlyMineFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { mineLevel: 20 },
  });

  assert.equal(earlyMineFish.some((item) => item.name === '石鱼'), true);
  assert.equal(earlyMineFish.some((item) => item.name === '冰柱鱼'), false);
  assert.equal(earlyMineFish.some((item) => item.name === '岩浆鳗鱼'), false);

  const deepMineFish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    access: { mineLevel: 100 },
  });

  assert.equal(deepMineFish.some((item) => item.name === '冰柱鱼'), true);
  assert.equal(deepMineFish.some((item) => item.name === '岩浆鳗鱼'), true);
});

test('filters night market submarine fish to winter 15 through 17', () => {
  const beforeNightMarket = findAvailableFishForDay({
    date: { year: 1, season: 'winter', day: 14 },
    weather: 'snowy',
    timeOfDay: 18 * 60,
  });

  assert.equal(beforeNightMarket.some((item) => item.name === '午夜鱿鱼'), false);
  assert.equal(beforeNightMarket.some((item) => item.name === '幽灵鱼'), false);
  assert.equal(beforeNightMarket.some((item) => item.name === '水滴鱼'), false);

  const duringNightMarket = findAvailableFishForDay({
    date: { year: 1, season: 'winter', day: 15 },
    weather: 'snowy',
    timeOfDay: 18 * 60,
  });

  assert.equal(duringNightMarket.some((item) => item.name === '午夜鱿鱼'), true);
  assert.equal(duringNightMarket.some((item) => item.name === '幽灵鱼'), true);
  assert.equal(duringNightMarket.some((item) => item.name === '水滴鱼'), true);
});

test('catalog includes Stardew Valley 1.6 fish and jelly edge entries', () => {
  assert.ok(FISH_CATALOG.some((fish) => fish.id === 'goby' && fish.name === '虾虎鱼'));
  assert.ok(FISH_CATALOG.some((fish) => fish.id === 'river-jelly' && fish.name === '河凝胶'));
  assert.ok(FISH_CATALOG.some((fish) => fish.id === 'sea-jelly' && fish.name === '海凝胶'));
  assert.ok(FISH_CATALOG.some((fish) => fish.id === 'cave-jelly' && fish.name === '洞穴凝胶'));
});

test('keeps extended family legendary fish behind their special order gate', () => {
  const normalSpringFish = findAvailableFishForDay({
    date: { year: 1, season: 'spring', day: 5 },
    weather: 'rainy',
    access: { sewer: true },
  });

  assert.equal(normalSpringFish.some((item) => item.id === 'legend-ii'), false);
  assert.equal(normalSpringFish.some((item) => item.id === 'radioactive-carp'), false);

  const extendedFamilyFish = findAvailableFishForDay({
    date: { year: 1, season: 'spring', day: 5 },
    weather: 'rainy',
    access: { sewer: true, extendedFamily: true },
  });

  assert.equal(extendedFamilyFish.some((item) => item.id === 'legend-ii'), true);
  assert.equal(extendedFamilyFish.some((item) => item.id === 'radioactive-carp'), true);
});

test('filters fish by time window when a time of day is provided', () => {
  const fish = findAvailableFishForDay({
    date: { year: 1, season: 'summer', day: 5 },
    weather: 'sunny',
    timeOfDay: 10 * 60,
  });

  assert.equal(fish.some((item) => item.name === '河豚'), false);
  assert.equal(fish.some((item) => item.name === '鲑鱼'), false);
  assert.equal(fish.some((item) => item.name === '金枪鱼'), true);
});
