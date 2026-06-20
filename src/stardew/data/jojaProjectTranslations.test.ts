import test from 'node:test';
import assert from 'node:assert/strict';
import { JOJA_PROJECT_NAME_TRANSLATIONS } from './jojaProjectTranslations.ts';
import jojaProjectTranslations from './jojaProjectTranslations.json' with { type: 'json' };

test('loads Joja project translations from external JSON data', () => {
  assert.deepEqual(JOJA_PROJECT_NAME_TRANSLATIONS, jojaProjectTranslations);
  assert.equal(JOJA_PROJECT_NAME_TRANSLATIONS['矿车修复'], 'Minecarts');
  assert.equal(JOJA_PROJECT_NAME_TRANSLATIONS['巴士维修'], 'Bus Repair');
});
