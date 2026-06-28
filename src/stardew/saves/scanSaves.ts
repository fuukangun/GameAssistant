import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface SaveEntry {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  parseStatus: 'ok' | 'partial' | 'failed';
  source?: 'scanned' | 'manual' | 'demo';
  playerName?: string;
}

export async function scanSavesInDirectory(rootPath: string): Promise<SaveEntry[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const saves: SaveEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderPath = join(rootPath, entry.name);
    const saveFilePath = await findSaveFilePath(folderPath, entry.name);
    if (!saveFilePath) {
      continue;
    }

    const fileStat = await stat(saveFilePath);
    const saveNames = await readSaveNames(saveFilePath);
    saves.push({
      id: entry.name,
      name: saveNames.farmName ?? getDisplayName(entry.name),
      playerName: saveNames.playerName,
      path: folderPath,
      lastModified: fileStat.mtime.toISOString(),
      parseStatus: 'partial',
    });
  }

  return saves.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

async function findSaveFilePath(folderPath: string, folderName: string): Promise<string | undefined> {
  const entries = await readdir(folderPath, { withFileTypes: true });
  const fileNames = entries.flatMap((entry) => {
    if (!entry.isFile()) {
      return [];
    }

    return entry.name;
  });
  if (fileNames.includes(folderName)) {
    return join(folderPath, folderName);
  }
  if (fileNames.includes('SaveGameInfo')) {
    return join(folderPath, 'SaveGameInfo');
  }

  return undefined;
}

async function readSaveNames(filePath: string): Promise<{ farmName?: string; playerName?: string }> {
  try {
    const xml = await readFile(filePath, 'utf8');
    return {
      farmName: extractXmlText(xml, 'farmName'),
      playerName: extractXmlText(xml, 'name'),
    };
  } catch {
    return {};
  }
}

function getDisplayName(folderName: string): string {
  const separatorIndex = folderName.lastIndexOf('_');
  return separatorIndex > 0 ? folderName.slice(0, separatorIndex) : folderName;
}

function extractXmlText(xml: string, tagName: string): string | undefined {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  const start = xml.indexOf(openTag);
  if (start < 0) {
    return undefined;
  }
  const valueStart = start + openTag.length;
  const end = xml.indexOf(closeTag, valueStart);
  if (end < 0) {
    return undefined;
  }

  const value = decodeBasicXmlEntities(xml.slice(valueStart, end).trim());
  return value || undefined;
}

function decodeBasicXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}
