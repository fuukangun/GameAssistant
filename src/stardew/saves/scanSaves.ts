import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface SaveEntry {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  parseStatus: 'ok' | 'partial' | 'failed';
}

export async function scanSavesInDirectory(rootPath: string): Promise<SaveEntry[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const saves: SaveEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderPath = join(rootPath, entry.name);
    if (!(await hasSaveFiles(folderPath, entry.name))) {
      continue;
    }

    const folderStat = await stat(folderPath);
    saves.push({
      id: entry.name,
      name: getDisplayName(entry.name),
      path: folderPath,
      lastModified: folderStat.mtime.toISOString(),
      parseStatus: 'partial',
    });
  }

  return saves.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

async function hasSaveFiles(folderPath: string, folderName: string): Promise<boolean> {
  const entries = await readdir(folderPath, { withFileTypes: true });
  return entries.some((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    return entry.name === folderName || entry.name === 'SaveGameInfo';
  });
}

function getDisplayName(folderName: string): string {
  const separatorIndex = folderName.lastIndexOf('_');
  return separatorIndex > 0 ? folderName.slice(0, separatorIndex) : folderName;
}
