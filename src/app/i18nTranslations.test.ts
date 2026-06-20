import test from 'node:test';
import assert from 'node:assert/strict';
import translations from './i18nTranslations.json' with { type: 'json' };
import { I18N_TRANSLATIONS } from './i18nTranslations.ts';

test('loads app i18n translations from external JSON data', () => {
  assert.deepEqual(I18N_TRANSLATIONS, translations);
  assert.equal(I18N_TRANSLATIONS['zh-CN']['app.title'], '游戏助手');
  assert.equal(I18N_TRANSLATIONS['en-US']['navigation.backToTop'], 'Top');
});
