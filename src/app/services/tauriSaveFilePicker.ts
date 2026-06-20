import { open } from '@tauri-apps/plugin-dialog';
import { readTauriSaveFile, type TauriInvoke } from './tauriSaveScanner.ts';

type OpenDialog = (options: {
  multiple: false;
  directory: true;
}) => Promise<string | string[] | null | undefined>;

export interface PickTauriSaveFileOptions {
  openDialog?: OpenDialog;
  invoke?: TauriInvoke;
}

export interface PickedTauriSaveFile {
  imported: Awaited<ReturnType<typeof readTauriSaveFile>>;
  saveDirectoryPath: string;
}

export async function pickTauriSaveFile(options: PickTauriSaveFileOptions = {}) {
  const openDialog = options.openDialog ?? open;
  const selectedPath = await openDialog({
    multiple: false,
    directory: true,
  });

  if (typeof selectedPath !== 'string') {
    return undefined;
  }

  return {
    imported: await readTauriSaveFile({
      savePath: selectedPath,
      invoke: options.invoke,
    }),
    saveDirectoryPath: selectedPath,
  };
}
