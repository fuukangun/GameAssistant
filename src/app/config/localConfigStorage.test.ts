import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultConfig } from './localConfig.ts';
import { createBrowserLocalConfigStorage, createLocalConfigStorage } from './localConfigStorage.ts';

test('loads migrated config from storage', () => {
  const storage = createMemoryStorage({
    gameDailyPlannerConfig: JSON.stringify({
      saveNotes: {
        save1: { saveId: 'save1', note: '钓鱼日', updatedAt: '2026-06-18T00:00:00.000Z' },
      },
    }),
  });

  const configStorage = createLocalConfigStorage(storage);

  assert.equal(configStorage.load().saveNotes.save1.note, '钓鱼日');
});

test('saves config to storage as JSON', () => {
  const storage = createMemoryStorage();
  const configStorage = createLocalConfigStorage(storage);
  const config = createDefaultConfig();

  configStorage.save(config);

  assert.equal(JSON.parse(storage.getItem('gameDailyPlannerConfig') ?? '{}').configVersion, config.configVersion);
});

test('falls back to defaults when storage read throws', () => {
  const configStorage = createLocalConfigStorage({
    ...createMemoryStorage(),
    getItem: () => {
      throw new Error('storage blocked');
    },
  });

  assert.deepEqual(configStorage.load(), createDefaultConfig());
});

test('ignores storage write failures', () => {
  const configStorage = createLocalConfigStorage({
    ...createMemoryStorage(),
    setItem: () => {
      throw new Error('storage blocked');
    },
  });

  assert.doesNotThrow(() => configStorage.save(createDefaultConfig()));
});

test('returns undefined when browser localStorage access throws', () => {
  const configStorage = createBrowserLocalConfigStorage({
    get localStorage(): Storage {
      throw new Error('localStorage blocked');
    },
  });

  assert.equal(configStorage, undefined);
});

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
