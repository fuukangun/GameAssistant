import { createStore } from 'zustand/vanilla';
import { createDefaultConfig, type AppLanguage, type LocalAppConfig } from '../app/config/localConfig.ts';

export interface SettingsState {
  config: LocalAppConfig;
  setSaveNote: (saveId: string, note: string) => void;
  setLanguage: (language: AppLanguage) => void;
  addManualSaveDirectory: (path: string) => void;
  removeManualSaveDirectory: (path: string) => void;
}

export interface SettingsPersistenceAdapter {
  save: (config: LocalAppConfig) => void;
}

export function createSettingsStore(
  initialConfig: LocalAppConfig = createDefaultConfig(),
  persistence?: SettingsPersistenceAdapter,
) {
  return createStore<SettingsState>((set) => ({
    config: initialConfig,
    setLanguage: (language) => {
      set((state) => {
        const nextConfig = {
          ...state.config,
          language,
        };
        persistence?.save(nextConfig);
        return { config: nextConfig };
      });
    },
    setSaveNote: (saveId, note) => {
      set((state) => {
        const nextConfig = {
          ...state.config,
          saveNotes: {
            ...state.config.saveNotes,
            [saveId]: {
              saveId,
              note,
              updatedAt: new Date().toISOString(),
            },
          },
        };
        persistence?.save(nextConfig);
        return { config: nextConfig };
      });
    },
    addManualSaveDirectory: (path) => {
      set((state) => {
        if (state.config.manualSaveDirectories.includes(path)) {
          return state;
        }

        const nextConfig = {
          ...state.config,
          manualSaveDirectories: [
            ...state.config.manualSaveDirectories,
            path,
          ],
        };
        persistence?.save(nextConfig);
        return { config: nextConfig };
      });
    },
    removeManualSaveDirectory: (path) => {
      set((state) => {
        if (!state.config.manualSaveDirectories.includes(path)) {
          return state;
        }

        const nextConfig = {
          ...state.config,
          manualSaveDirectories: state.config.manualSaveDirectories.filter((item) => item !== path),
        };
        persistence?.save(nextConfig);
        return { config: nextConfig };
      });
    },
  }));
}
