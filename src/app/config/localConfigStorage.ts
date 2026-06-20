import { createDefaultConfig, migrateConfig, type LocalAppConfig } from './localConfig.ts';

export const LOCAL_CONFIG_STORAGE_KEY = 'gameDailyPlannerConfig';

export interface LocalConfigStorage {
  load: () => LocalAppConfig;
  save: (config: LocalAppConfig) => void;
}

export function createLocalConfigStorage(storage: Storage): LocalConfigStorage {
  return {
    load: () => {
      try {
        const raw = storage.getItem(LOCAL_CONFIG_STORAGE_KEY);
        if (!raw) {
          return createDefaultConfig();
        }

        return migrateConfig(JSON.parse(raw));
      } catch {
        return createDefaultConfig();
      }
    },
    save: (config) => {
      try {
        storage.setItem(LOCAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
      } catch {
        // Some WebView protocols can block localStorage. Notes remain in memory for the session.
      }
    },
  };
}

export function createBrowserLocalConfigStorage(
  windowLike: Pick<Window, 'localStorage'> | undefined = typeof window === 'undefined' ? undefined : window,
): LocalConfigStorage | undefined {
  if (!windowLike) {
    return undefined;
  }

  try {
    return createLocalConfigStorage(windowLike.localStorage);
  } catch {
    return undefined;
  }
}
