import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';

export type SidebarGameGroup = {
  id: 'stardew-valley';
  name: string;
  iconPath: string;
  saveCountLabel: string;
  saves: SaveEntry[];
};

export function createSidebarGameGroups(saves: SaveEntry[], language: AppLanguage): SidebarGameGroup[] {
  return [
    {
      id: 'stardew-valley',
      name: t(language, 'game.stardewValley'),
      iconPath: './game-icons/stardew-valley.png',
      saveCountLabel: t(language, 'game.saveCount', { count: saves.length }),
      saves,
    },
  ];
}
