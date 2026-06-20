import { importSaveFileContent, type ImportedSaveFile } from '../../stardew/saves/importSaveFile.ts';

export interface BrowserSaveFile {
  name: string;
  lastModified: number;
  text: () => Promise<string>;
}

export interface PickedSaveFile {
  path: string;
  modifiedAt: Date;
  xml: string;
}

export async function importBrowserSaveFile(file: BrowserSaveFile): Promise<ImportedSaveFile> {
  return importSaveFileContent({
    fileName: file.name,
    modifiedAt: new Date(file.lastModified),
    xml: await file.text(),
  });
}

export function importPickedSaveFile(file: PickedSaveFile): ImportedSaveFile {
  return importSaveFileContent({
    fileName: getFileName(file.path),
    filePath: file.path,
    modifiedAt: file.modifiedAt,
    xml: file.xml,
  });
}

function getFileName(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}
