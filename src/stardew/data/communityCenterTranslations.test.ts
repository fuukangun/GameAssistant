import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMUNITY_CENTER_TRANSLATIONS } from './communityCenterTranslations.ts';
import communityCenterTranslations from './communityCenterTranslations.json' with { type: 'json' };

test('loads community center translations from external JSON data', () => {
  assert.deepEqual(COMMUNITY_CENTER_TRANSLATIONS, communityCenterTranslations);
  assert.equal(COMMUNITY_CENTER_TRANSLATIONS.rooms['茶水间'], 'Pantry');
  assert.equal(COMMUNITY_CENTER_TRANSLATIONS.bundles['建筑收集包'], 'Construction Bundle');
  assert.equal(COMMUNITY_CENTER_TRANSLATIONS.itemsById['80'], 'Quartz');
});
