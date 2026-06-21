import test from 'node:test';
import assert from 'node:assert/strict';
import { PROCESSING_RULES } from './processingRules.ts';
import { RECOMMENDATION_LOCALIZATION } from './recommendationLocalization.ts';
import recommendationLocalization from './recommendationLocalization.json' with { type: 'json' };

test('loads recommendation localization data from external JSON', () => {
  assert.deepEqual(RECOMMENDATION_LOCALIZATION, recommendationLocalization);
  assert.equal(RECOMMENDATION_LOCALIZATION.weatherNames.sunny, '晴天');
  assert.equal(RECOMMENDATION_LOCALIZATION.evidenceLabels.社区中心进度, 'Community Center Progress');
  assert.equal(RECOMMENDATION_LOCALIZATION.inventorySources.背包, 'Backpack');
});

test('covers all produced item source names that can appear in recommendation details', () => {
  const sourceNames = new Set([
    ...PROCESSING_RULES.flatMap((rule) => [...rule.machineIds, ...rule.machineNames]),
    'Keg',
    'PreservesJar',
    'Preserves Jar',
    'MayonnaiseMachine',
    'Mayonnaise Machine',
    'CheesePress',
    'Cheese Press',
    'Loom',
    'OilMaker',
    'Oil Maker',
    'FishSmoker',
    'Fish Smoker',
    'Dehydrator',
    'Mushroom Box',
    'MushroomBox',
    'Tapper',
    'Auto-Grabber',
    'Crystalarium',
    'Chest',
    'Incubator',
    'Soda Machine',
    'Lightning Rod',
    'Bee House',
    'Worm Bin',
    'Coffee Maker',
    'Crab Pot',
    'Cask',
    'Statue Of Perfection',
    'Statue Of Endless Fortune',
    'Iridium Sprinkler',
    'Cow',
    'Goat',
    'Sheep',
    'Pig',
    'Chicken',
    'Duck',
    'Rabbit',
    'Dinosaur',
    'Ostrich',
  ]);

  const missing = [...sourceNames]
    .map(String)
    .filter((name) => /[A-Za-z]/.test(name))
    .filter((name) => !RECOMMENDATION_LOCALIZATION.englishTextNames[name])
    .sort();

  assert.deepEqual(missing, []);
});
