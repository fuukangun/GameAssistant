import type { AppLanguage } from './config/localConfig.ts';
import type { StardewSaveSnapshot } from '../shared/types.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';

export function formatSaveFarmName(save: SaveEntry, snapshot: StardewSaveSnapshot | undefined, language: AppLanguage): string {
  const farmName = snapshot?.farm.farmName ?? save.name;
  return language === 'zh-CN' && !farmName.endsWith('农场') ? `${farmName}农场` : farmName;
}

export function formatSavePlayerName(save: SaveEntry, snapshot: StardewSaveSnapshot | undefined, language: AppLanguage): string {
  return snapshot?.farm.playerName ?? save.playerName ?? inferPlayerNameFromSave(save) ?? (language === 'zh-CN' ? '角色名待解析' : 'Player pending');
}

function inferPlayerNameFromSave(save: SaveEntry): string | undefined {
  const folderName = extractSaveFolderName(save.path) ?? extractSaveFolderName(save.id);
  const name = folderName ? folderName.split('_')[0] : save.name;
  return name.trim() || undefined;
}

function extractSaveFolderName(pathOrId: string): string | undefined {
  const normalized = pathOrId.replace(/\/+$/, '');
  const leaf = normalized.split('/').at(-1)?.replace(/^manual:/, '');
  return leaf?.trim() || undefined;
}
