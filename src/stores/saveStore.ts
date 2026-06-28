import { createStore } from 'zustand/vanilla';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';

export interface SaveState {
  saves: SaveEntry[];
  selectedSaveId?: string;
  isScanning: boolean;
  setSaves: (saves: SaveEntry[]) => void;
  upsertSave: (save: SaveEntry) => void;
  removeSaveById: (saveId: string) => void;
  removeSaveByPath: (path: string) => void;
  selectSave: (saveId: string) => void;
  setScanning: (isScanning: boolean) => void;
}

export function createSaveStore() {
  return createStore<SaveState>((set, get) => ({
    saves: [],
    selectedSaveId: undefined,
    isScanning: false,
    setSaves: (saves) => {
      const currentSelected = get().selectedSaveId;
      const manualSaves = get().saves.filter((save) => save.source === 'manual');
      const nextSaves = [
        ...saves.map((save) => ({ ...save, source: save.source ?? 'scanned' as const })),
        ...manualSaves,
      ];
      const selectedStillExists = nextSaves.some((save) => save.id === currentSelected);
      set({
        saves: nextSaves,
        selectedSaveId: selectedStillExists ? currentSelected : nextSaves[0]?.id,
      });
    },
    upsertSave: (save) => {
      set((state) => {
        const existingIndex = state.saves.findIndex((item) => item.id === save.id || item.path === save.path);
        if (existingIndex >= 0) {
          return {
            saves: state.saves.map((item, index) => index === existingIndex ? save : item),
            selectedSaveId: save.id,
          };
        }

        return {
          saves: [
            save,
            ...state.saves,
          ],
          selectedSaveId: save.id,
        };
      });
    },
    removeSaveById: (saveId) => {
      set((state) => {
        const saves = state.saves.filter((save) => save.id !== saveId);
        const selectedStillExists = saves.some((save) => save.id === state.selectedSaveId);

        return {
          saves,
          selectedSaveId: selectedStillExists ? state.selectedSaveId : saves[0]?.id,
        };
      });
    },
    removeSaveByPath: (path) => {
      set((state) => {
        const normalizedPath = path.replace(/\/+$/, '');
        const saves = state.saves.filter((save) => {
          const savePath = save.path.replace(/\/+$/, '');
          return savePath !== normalizedPath && !savePath.startsWith(`${normalizedPath}/`);
        });
        const selectedStillExists = saves.some((save) => save.id === state.selectedSaveId);

        return {
          saves,
          selectedSaveId: selectedStillExists ? state.selectedSaveId : saves[0]?.id,
        };
      });
    },
    selectSave: (saveId) => {
      set({ selectedSaveId: saveId });
    },
    setScanning: (isScanning) => {
      set({ isScanning });
    },
  }));
}
