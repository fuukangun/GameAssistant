import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsStore } from './settingsStore.ts';

test('updates save notes by save id', () => {
  const store = createSettingsStore();

  store.getState().setSaveNote('save-1', '农业流，准备开温室');

  assert.equal(store.getState().config.saveNotes['save-1'].note, '农业流，准备开温室');
  assert.equal(store.getState().config.saveNotes['save-1'].saveId, 'save-1');
});

test('persists save note changes through the configured adapter', () => {
  const savedValues: string[] = [];
  const store = createSettingsStore(undefined, {
    save: (value) => {
      savedValues.push(JSON.stringify(value));
    },
  });

  store.getState().setSaveNote('save-1', '留意夏季作物');

  assert.equal(savedValues.length, 1);
  assert.equal(JSON.parse(savedValues[0]).saveNotes['save-1'].note, '留意夏季作物');
});

test('updates and persists the selected language', () => {
  const savedValues: string[] = [];
  const store = createSettingsStore(undefined, {
    save: (value) => {
      savedValues.push(JSON.stringify(value));
    },
  });

  store.getState().setLanguage('en-US');

  assert.equal(store.getState().config.language, 'en-US');
  assert.equal(savedValues.length, 1);
  assert.equal(JSON.parse(savedValues[0]).language, 'en-US');
});

test('adds manual save directories without duplicates and persists them', () => {
  const savedValues: string[] = [];
  const store = createSettingsStore(undefined, {
    save: (value) => {
      savedValues.push(JSON.stringify(value));
    },
  });

  store.getState().addManualSaveDirectory('/tmp/Saves/A_1');
  store.getState().addManualSaveDirectory('/tmp/Saves/A_1');
  store.getState().addManualSaveDirectory('/tmp/Saves/B_2');

  assert.deepEqual(store.getState().config.manualSaveDirectories, ['/tmp/Saves/A_1', '/tmp/Saves/B_2']);
  assert.deepEqual(JSON.parse(savedValues.at(-1) ?? '{}').manualSaveDirectories, ['/tmp/Saves/A_1', '/tmp/Saves/B_2']);
});

test('removes unavailable manual save directories and persists the cleanup', () => {
  const savedValues: string[] = [];
  const store = createSettingsStore({
    configVersion: 1,
    language: 'zh-CN',
    customSaveDirectories: [],
    manualSaveDirectories: ['/tmp/Saves/A_1', '/tmp/Saves/Missing_2'],
    saveNotes: {},
    plannerDefaults: { goal: 'free' },
  }, {
    save: (value) => {
      savedValues.push(JSON.stringify(value));
    },
  });

  store.getState().removeManualSaveDirectory('/tmp/Saves/Missing_2');

  assert.deepEqual(store.getState().config.manualSaveDirectories, ['/tmp/Saves/A_1']);
  assert.deepEqual(JSON.parse(savedValues[0]).manualSaveDirectories, ['/tmp/Saves/A_1']);
});
