import type { ImportedSaveFile } from '../stardew/saves/importSaveFile.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';

export interface MergedImportedSave {
  entry: SaveEntry;
  snapshotKey: string;
  imported: ImportedSaveFile;
}

export function mergeImportedSaveForScannedEntry(
  imported: ImportedSaveFile,
  scannedEntry?: SaveEntry,
): MergedImportedSave {
  if (!scannedEntry) {
    return {
      entry: imported.entry,
      snapshotKey: imported.entry.id,
      imported,
    };
  }

  return {
    entry: {
      ...imported.entry,
      id: scannedEntry.id,
      path: scannedEntry.path,
    },
    snapshotKey: scannedEntry.id,
    imported,
  };
}
