import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_CONFIG_VERSION, createDefaultConfig, migrateConfig } from './localConfig.ts';

test('creates a default config with the current config version', () => {
  const config = createDefaultConfig();

  assert.equal(config.configVersion, CURRENT_CONFIG_VERSION);
  assert.equal(config.language, 'zh-CN');
  assert.deepEqual(config.customSaveDirectories, []);
  assert.deepEqual(config.manualSaveDirectories, []);
  assert.deepEqual(config.saveNotes, {});
  assert.equal(config.plannerDefaults.goal, 'free');
});

test('migrates legacy config without configVersion', () => {
  const config = migrateConfig({
    customSaveDirectories: ['/tmp/saves'],
    manualSaveDirectories: ['/tmp/manual-a', '/tmp/manual-a', 123],
    saveNotes: {
      save1: { saveId: 'save1', note: 'mining run', updatedAt: '2026-06-18T00:00:00.000Z' },
    },
  });

  assert.equal(config.configVersion, CURRENT_CONFIG_VERSION);
  assert.equal(config.language, 'zh-CN');
  assert.deepEqual(config.customSaveDirectories, ['/tmp/saves']);
  assert.deepEqual(config.manualSaveDirectories, ['/tmp/manual-a']);
  assert.equal(config.saveNotes.save1.note, 'mining run');
  assert.equal(config.plannerDefaults.goal, 'free');
});

test('migrates a supported language from local config', () => {
  const config = migrateConfig({
    language: 'en-US',
  });

  assert.equal(config.language, 'en-US');
});

test('falls back to Chinese for unsupported languages', () => {
  const config = migrateConfig({
    language: 'ja-JP',
  });

  assert.equal(config.language, 'zh-CN');
});

test('falls back to default config for invalid config data', () => {
  const config = migrateConfig(null);

  assert.deepEqual(config, createDefaultConfig());
});
