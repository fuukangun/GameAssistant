import type { StardewSaveSnapshot } from '../../shared/types.ts';
import { parseStardewSaveXml } from './parseSave.ts';
import type { SaveEntry } from './scanSaves.ts';

export interface ImportSaveFileInput {
  fileName: string;
  filePath?: string;
  modifiedAt: Date;
  xml: string;
}

export interface ImportedSaveFile {
  entry: SaveEntry;
  snapshot: StardewSaveSnapshot;
}

export function importSaveFileContent(input: ImportSaveFileInput): ImportedSaveFile {
  const filePath = input.filePath ?? `manual://${input.fileName}`;
  const fileModifiedAt = input.modifiedAt.toISOString();
  const snapshot = parseStardewSaveXml(input.xml, filePath, fileModifiedAt);
  const id = snapshot.saveIdentity.uniqueId ?? input.fileName;

  return {
    entry: {
      id,
      name: snapshot.farm.farmName,
      path: filePath,
      lastModified: fileModifiedAt,
      parseStatus: snapshot.parseMeta.status,
    },
    snapshot,
  };
}
