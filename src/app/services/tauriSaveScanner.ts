import type { SaveEntry } from '../../stardew/saves/scanSaves.ts';
import { importPickedSaveFile, type PickedSaveFile } from './saveFileImportService.ts';

export type TauriInvoke = (command: string, args?: Record<string, unknown>) => Promise<unknown>;

export interface ScanTauriSavesOptions {
  customPath?: string;
  invoke?: TauriInvoke;
}

export interface ReadTauriSaveFileOptions {
  savePath: string;
  invoke?: TauriInvoke;
}

interface TauriSaveFileContent {
  fileName: string;
  filePath: string;
  modifiedAt: string;
  xml: string;
}

export async function scanTauriSaves(options: ScanTauriSavesOptions = {}): Promise<SaveEntry[]> {
  const invoke = options.invoke ?? await loadTauriInvoke();
  return await invoke('scan_saves', {
    customPath: options.customPath,
  }) as SaveEntry[];
}

export async function readTauriSaveFile(options: ReadTauriSaveFileOptions) {
  const invoke = options.invoke ?? await loadTauriInvoke();
  const content = await invoke('read_save_file', {
    savePath: options.savePath,
  }) as TauriSaveFileContent;

  return importPickedSaveFile(toPickedSaveFile(content));
}

async function loadTauriInvoke(): Promise<TauriInvoke> {
  const tauriApi = await import('@tauri-apps/api/core');
  return tauriApi.invoke;
}

function toPickedSaveFile(content: TauriSaveFileContent): PickedSaveFile {
  return {
    path: content.filePath,
    modifiedAt: parseModifiedAt(content.modifiedAt),
    xml: content.xml,
  };
}

function parseModifiedAt(value: string): Date {
  if (/^\d+$/.test(value)) {
    return new Date(Number(value) * 1000);
  }

  return new Date(value);
}
